import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Services
import { AgentService } from './services/AgentService.js';
import { AstraService } from './services/AstraService.js';
import { GitHubService } from './services/GitHubService.js';
import { SandboxService } from './services/SandboxService.js';
import { MCPService } from './services/MCPService.js';
import { SwarmService } from './services/SwarmService.js';
import { SwarmEventBus } from './services/SwarmEventBus.js';
import { LLMService } from './services/LLMService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
}

// Initialize services
const eventBus = new SwarmEventBus();
const swarmService = new SwarmService();
const llmService = new LLMService();
const astraService = new AstraService();
const githubService = new GitHubService();
const sandboxService = new SandboxService();
const mcpService = new MCPService();
const agentService = new AgentService(swarmService);

// Initialize services in sequence
const initializeServices = async () => {
  try {
    // Initialize event bus first
    await eventBus.initialize(process.env.REDIS_URL);
    
    // Initialize swarm service with event bus support
    await swarmService.initialize(process.env.REDIS_URL);
    
    // Initialize other services
    await agentService.initialize();
    if (process.env.ASTRA_DB_ID) {
      await astraService.initialize();
    }
    await mcpService.initialize();
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Service initialization error:', error);
  }
};

initializeServices();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      swarm: !!swarmService,
      eventBus: eventBus.isConnected(),
      astra: !!process.env.ASTRA_DB_ID
    }
  });
});

// API Routes

// Swarm Management API
app.get('/api/swarms', async (req, res) => {
  try {
    const swarms = swarmService.getSwarms();
    res.json(swarms);
  } catch (error) {
    console.error('Error fetching swarms:', error);
    res.status(500).json({ error: 'Failed to fetch swarms' });
  }
});

app.post('/api/swarms', async (req, res) => {
  try {
    const swarm = await swarmService.createSwarm(req.body);
    res.json(swarm);
  } catch (error) {
    console.error('Error creating swarm:', error);
    res.status(500).json({ error: 'Failed to create swarm' });
  }
});

app.get('/api/swarms/:swarmId', async (req, res) => {
  try {
    const swarm = swarmService.swarms.get(req.params.swarmId);
    if (!swarm) {
      return res.status(404).json({ error: 'Swarm not found' });
    }
    res.json(swarm);
  } catch (error) {
    console.error('Error fetching swarm:', error);
    res.status(500).json({ error: 'Failed to fetch swarm' });
  }
});

app.get('/api/swarms/:swarmId/agents', async (req, res) => {
  try {
    const agents = swarmService.getAgents(req.params.swarmId);
    res.json(agents);
  } catch (error) {
    console.error('Error fetching swarm agents:', error);
    res.status(500).json({ error: 'Failed to fetch swarm agents' });
  }
});

app.post('/api/swarms/:swarmId/tasks', async (req, res) => {
  try {
    const task = await swarmService.submitTask({
      ...req.body,
      swarmId: req.params.swarmId
    });
    res.json(task);
  } catch (error) {
    console.error('Error creating swarm task:', error);
    res.status(500).json({ error: 'Failed to create swarm task' });
  }
});

// Projects API
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await astraService.getProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const project = await astraService.createProject(req.body);
    res.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Agents API
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await agentService.getAgents();
    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

app.post('/api/agents', async (req, res) => {
  try {
    const agent = await agentService.createAgent(req.body);
    res.json(agent);
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Sandbox API
app.post('/api/sandbox/execute', async (req, res) => {
  try {
    const { code, language, environment } = req.body;
    const result = await sandboxService.executeCode(code, language, environment);
    res.json(result);
  } catch (error) {
    console.error('Error executing code:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

// GitHub API
app.post('/api/github/sync', async (req, res) => {
  try {
    const { projectId, repoUrl, token } = req.body;
    const result = await githubService.syncProject(projectId, repoUrl, token);
    res.json(result);
  } catch (error) {
    console.error('Error syncing GitHub:', error);
    res.status(500).json({ error: 'Failed to sync with GitHub' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle client message
  socket.on('message', async (data) => {
    try {
      const { content, agent, context } = data;

      // Process message through MCP
      const mcpResponse = await mcpService.processMessage(content, context);

      // Generate AI response
      const aiResponse = await llmService.generateResponse(content, {
        agent,
        context: { ...context, mcp: mcpResponse }
      });

      // Store in vector database if Astra is connected
      if (process.env.ASTRA_DB_ID) {
        await astraService.storeMessage({
          id: uuidv4(),
          content,
          response: aiResponse,
          timestamp: new Date(),
          agent,
          context
        });
      }

      socket.emit('message', {
        content: aiResponse,
        agent: agent?.name || 'Assistant',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  // Handle code execution
  socket.on('code-execute', async (data) => {
    try {
      const { code, language, environment } = data;
      const result = await sandboxService.executeCode(code, language, environment);
      socket.emit('code-result', result);
    } catch (error) {
      console.error('Error executing code:', error);
      socket.emit('code-error', { message: 'Failed to execute code' });
    }
  });

  // Handle agent task execution
  socket.on('agent-task', async (data) => {
    try {
      const { agentId, task, context } = data;
      const result = await agentService.executeTask(agentId, task, context);
      socket.emit('agent-result', result);
    } catch (error) {
      console.error('Error executing agent task:', error);
      socket.emit('agent-error', { message: 'Failed to execute agent task' });
    }
  });

  // Handle swarm operations
  socket.on('swarm-create', async (data) => {
    try {
      const swarm = await swarmService.createSwarm(data);
      socket.emit('swarm-created', swarm);
    } catch (error) {
      console.error('Error creating swarm:', error);
      socket.emit('swarm-error', { message: 'Failed to create swarm' });
    }
  });

  socket.on('swarm-task', async (data) => {
    try {
      const { swarmId, task } = data;
      const result = await swarmService.submitTask({
        ...task,
        swarmId
      });
      socket.emit('swarm-task-submitted', result);
    } catch (error) {
      console.error('Error submitting swarm task:', error);
      socket.emit('swarm-error', { message: 'Failed to submit swarm task' });
    }
  });

  // Subscribe client to swarm events
  socket.on('swarm-subscribe', async (data) => {
    try {
      const { swarmId } = data;
      
      // Create room name for this swarm
      const roomName = `swarm:${swarmId}`;
      
      // Join socket.io room
      socket.join(roomName);
      
      // Subscribe to swarm events
      const unsubscribe = eventBus.subscribe('swarm:*', (event) => {
        // Only forward events for this swarm
        if (event.swarmId === swarmId) {
          io.to(roomName).emit('swarm-event', event);
        }
      });
      
      // Store unsubscribe function
      socket.data.swarmUnsubscribe = unsubscribe;
      
      socket.emit('swarm-subscribed', { swarmId });
    } catch (error) {
      console.error('Error subscribing to swarm:', error);
      socket.emit('swarm-error', { message: 'Failed to subscribe to swarm' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up any swarm subscriptions
    if (socket.data.swarmUnsubscribe) {
      socket.data.swarmUnsubscribe();
    }
  });
});

// Set up event relaying from event bus to socket.io
eventBus.subscribe('swarm:*', (event) => {
  // Broadcast to all connected clients
  io.emit('swarm-event', event);
});

// Catch-all handler for production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Swarm Agents server running on port ${PORT}`);
});