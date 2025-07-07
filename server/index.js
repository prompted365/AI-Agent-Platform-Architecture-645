import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import {v4 as uuidv4} from 'uuid';
import {fileURLToPath} from 'url';
import {dirname,join} from 'path';
import path from 'path';
// Services
import {AgentService} from './services/AgentService.js';
import {AstraService} from './services/AstraService.js';
import {GitHubService} from './services/GitHubService.js';
import {SandboxService} from './services/SandboxService.js';
import {MCPService} from './services/MCPService.js';
import {SwarmService} from './services/SwarmService.js';
import {SwarmEventBus} from './services/SwarmEventBus.js';
import {LLMService} from './services/LLMService.js';
import {DatabaseService} from './services/DatabaseService.js';

dotenv.config();

const __filename=fileURLToPath(import.meta.url);
const __dirname=dirname(__filename);
const app=express();
const server=createServer(app);

// CORS configuration for cloud deployment 
const corsOptions={
  origin: [
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
};

const io=new Server(server,{
  cors: corsOptions
});

// Middleware 
app.use(helmet({
  crossOriginEmbedderPolicy: false // Allow embedding for Railway
}));
app.use(cors(corsOptions));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true,limit: '10mb'}));

// Rate limiting 
const limiter=rateLimit({
  windowMs: 15 * 60 * 1000,// 15 minutes 
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/',limiter);

// Initialize services 
const databaseService = new DatabaseService();
const eventBus=new SwarmEventBus();
const swarmService=new SwarmService();
const llmService=new LLMService();
const astraService=new AstraService();
const githubService=new GitHubService();
const sandboxService=new SandboxService();
const mcpService=new MCPService();
const agentService=new AgentService(swarmService);

// Initialize services in sequence 
const initializeServices=async ()=> {
  try {
    console.log('🚀 Initializing services...');

    // Initialize database first
    const dbConnected = await databaseService.initialize();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Check API key 
    if (!process.env.REQUESTY_API_KEY) {
      console.error('❌ REQUESTY_API_KEY not found in environment variables');
      console.error('💡 Please add your Requesty API key to Railway environment variables');
    } else {
      const keyPrefix=process.env.REQUESTY_API_KEY.substring(0,10);
      console.log(`✅ REQUESTY_API_KEY found (${keyPrefix}...)`);
    } 

    // Initialize event bus 
    await eventBus.initialize(process.env.REDIS_URL);
    // Initialize swarm service with event bus support 
    await swarmService.initialize(process.env.REDIS_URL);
    // Initialize other services 
    await agentService.initialize();
    
    // Only initialize Astra if Supabase is disabled and Astra is configured
    if (!databaseService.isSupabaseEnabled && process.env.ASTRA_DB_ID) {
      await astraService.initialize();
    } 
    
    await mcpService.initialize();
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization error:',error);
  }
};
initializeServices();

// Cleanup on shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down...');
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down...');
  await databaseService.disconnect();
  process.exit(0);
});

// Health check 
app.get('/health',async (req,res)=> {
  const dbHealth = await databaseService.healthCheck();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    services: {
      swarm: !!swarmService,
      eventBus: eventBus.isConnected(),
      supabase: databaseService.isSupabaseEnabled,
      astra: !!process.env.ASTRA_DB_ID && !databaseService.isSupabaseEnabled,
      llm: !!process.env.REQUESTY_API_KEY
    },
    cors: corsOptions.origin
  });
});

// Enhanced LLM Test endpoint with Sonnet-4 support 
app.post('/api/llm/test',async (req,res)=> {
  try {
    const {message="Hello! Can you respond with 'OK' to confirm the connection works?",model="anthropic/claude-sonnet-4-0"}=req.body;
    console.log('🧪 Testing LLM with message:',message);
    console.log('🔑 API Key status:',process.env.REQUESTY_API_KEY ? 'Present' : 'Missing');
    console.log('🤖 Model:',model);
    const response=await llmService.generateResponse(message,{
      model,
      context: {test: true},
      reasoning_effort: 'low'
    });
    console.log('✅ LLM test successful');
    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      model
    });
  } catch (error) {
    console.error('❌ LLM test error:',error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Model testing endpoint with reasoning models 
app.post('/api/llm/test-models',async (req,res)=> {
  try {
    console.log('🧪 Testing multiple models...');
    const results=await llmService.testModels();
    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Model test error:',error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// LLM Health check endpoint 
app.get('/api/llm/health',async (req,res)=> {
  try {
    const healthCheck=await llmService.healthCheck();
    if (healthCheck.status==='healthy') {
      res.json(healthCheck);
    } else {
      res.status(503).json(healthCheck);
    }
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database API Routes using Railway PostgreSQL
app.get('/api/organizations',async (req,res)=> {
  try {
    // For demo purposes, use default user
    const organizations = await databaseService.getOrganizations('default-admin');
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:',error);
    res.status(500).json({error: 'Failed to fetch organizations'});
  }
});

app.get('/api/conversations',async (req,res)=> {
  try {
    const { organizationId, folderId } = req.query;
    const conversations = await databaseService.getConversations(
      organizationId || 'default-org', 
      folderId || null
    );
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:',error);
    res.status(500).json({error: 'Failed to fetch conversations'});
  }
});

app.post('/api/conversations',async (req,res)=> {
  try {
    const conversation = await databaseService.createConversation({
      ...req.body,
      userId: 'default-admin', // For demo
      organizationId: req.body.organizationId || 'default-org'
    });
    res.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:',error);
    res.status(500).json({error: 'Failed to create conversation'});
  }
});

app.get('/api/conversations/:id/messages',async (req,res)=> {
  try {
    const messages = await databaseService.getMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:',error);
    res.status(500).json({error: 'Failed to fetch messages'});
  }
});

app.post('/api/messages',async (req,res)=> {
  try {
    const message = await databaseService.createMessage({
      ...req.body,
      userId: 'default-admin' // For demo
    });
    res.json(message);
  } catch (error) {
    console.error('Error creating message:',error);
    res.status(500).json({error: 'Failed to create message'});
  }
});

// Swarm Management API 
app.get('/api/swarms',async (req,res)=> {
  try {
    const swarms = await databaseService.getSwarms();
    res.json(swarms);
  } catch (error) {
    console.error('Error fetching swarms:',error);
    res.status(500).json({error: 'Failed to fetch swarms'});
  }
});

app.post('/api/swarms',async (req,res)=> {
  try {
    const swarm = await databaseService.createSwarm(req.body);
    res.json(swarm);
  } catch (error) {
    console.error('Error creating swarm:',error);
    res.status(500).json({error: 'Failed to create swarm'});
  }
});

app.get('/api/swarms/:swarmId/agents',async (req,res)=> {
  try {
    const agents = await databaseService.getAgents(req.params.swarmId);
    res.json(agents);
  } catch (error) {
    console.error('Error fetching swarm agents:',error);
    res.status(500).json({error: 'Failed to fetch swarm agents'});
  }
});

app.post('/api/swarms/:swarmId/tasks',async (req,res)=> {
  try {
    const task = await databaseService.createTask({
      ...req.body,
      swarmId: req.params.swarmId
    });
    res.json(task);
  } catch (error) {
    console.error('Error creating swarm task:',error);
    res.status(500).json({error: 'Failed to create swarm task'});
  }
});

// Projects API 
app.get('/api/projects',async (req,res)=> {
  try {
    const projects = await databaseService.getProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:',error);
    res.status(500).json({error: 'Failed to fetch projects'});
  }
});

app.post('/api/projects',async (req,res)=> {
  try {
    const project = await databaseService.createProject(req.body);
    res.json(project);
  } catch (error) {
    console.error('Error creating project:',error);
    res.status(500).json({error: 'Failed to create project'});
  }
});

// Agents API 
app.get('/api/agents',async (req,res)=> {
  try {
    const agents = await databaseService.getAgents();
    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:',error);
    res.status(500).json({error: 'Failed to fetch agents'});
  }
});

app.post('/api/agents',async (req,res)=> {
  try {
    const agent = await databaseService.createAgent(req.body);
    res.json(agent);
  } catch (error) {
    console.error('Error creating agent:',error);
    res.status(500).json({error: 'Failed to create agent'});
  }
});

// Sandbox API 
app.post('/api/sandbox/execute',async (req,res)=> {
  try {
    const {code,language,environment}=req.body;
    const result=await sandboxService.executeCode(code,language,environment);
    res.json(result);
  } catch (error) {
    console.error('Error executing code:',error);
    res.status(500).json({error: 'Failed to execute code'});
  }
});

// GitHub API 
app.post('/api/github/sync',async (req,res)=> {
  try {
    const {projectId,repoUrl,token}=req.body;
    const result=await githubService.syncProject(projectId,repoUrl,token);
    res.json(result);
  } catch (error) {
    console.error('Error syncing GitHub:',error);
    res.status(500).json({error: 'Failed to sync with GitHub'});
  }
});

// Artifact generation API with reasoning 
app.post('/api/artifacts/generate',async (req,res)=> {
  try {
    const {description,type='code',language='javascript'}=req.body;
    console.log('🎨 Generating artifact:',{description,type,language});
    const content=await llmService.generateArtifact(description,type,language);
    res.json({
      success: true,
      content,
      type,
      language,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error generating artifact:',error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Socket.IO connection handling 
io.on('connection',(socket)=> {
  console.log('🔌 Client connected:',socket.id);

  // Handle client message 
  socket.on('message',async (data)=> {
    try {
      const {content,agent,context}=data;
      console.log('💬 Received message:',{
        content: content.substring(0,100),
        agent: agent?.name
      });

      // Process message through MCP 
      const mcpResponse=await mcpService.processMessage(content,context);

      // Generate AI response with reasoning 
      const aiResponse=await llmService.generateResponse(content,{
        agent,
        context: {...context,mcp: mcpResponse},
        reasoning_effort: 'medium'
      });
      console.log('🤖 Generated AI response with reasoning:',aiResponse.substring(0,100));

      // Store in database
      if (context?.conversationId) {
        await databaseService.createMessage({
          conversationId: context.conversationId,
          userId: 'default-admin',
          role: 'user',
          content: content
        });

        await databaseService.createMessage({
          conversationId: context.conversationId,
          userId: 'default-admin',
          role: 'assistant',
          content: aiResponse
        });
      }

      socket.emit('message',{
        content: aiResponse,
        agent: agent?.name || 'Claude Sonnet-4',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Error processing message:',error);
      socket.emit('error',{
        message: 'Failed to process message',
        details: error.message
      });
    }
  });

  // Handle code execution 
  socket.on('code-execute',async (data)=> {
    try {
      const {code,language,environment}=data;
      const result=await sandboxService.executeCode(code,language,environment);
      socket.emit('code-result',result);
    } catch (error) {
      console.error('❌ Error executing code:',error);
      socket.emit('code-error',{message: 'Failed to execute code'});
    }
  });

  // Handle agent task execution with reasoning 
  socket.on('agent-task',async (data)=> {
    try {
      const {agentId,task,context}=data;

      // Get AI assistance for the task with reasoning 
      const agent=await agentService.getAgent(agentId);
      if (agent) {
        const aiGuidance=await llmService.processSwarmTask(task,{
          role: agent.role,
          capabilities: agent.capabilities,
          swarmId: agent.swarmId
        });

        // Include AI guidance in task execution 
        task.aiGuidance=aiGuidance;
      } 

      const result=await agentService.executeTask(agentId,task,context);
      socket.emit('agent-result',result);
    } catch (error) {
      console.error('❌ Error executing agent task:',error);
      socket.emit('agent-error',{message: 'Failed to execute agent task'});
    }
  });

  // Handle swarm operations with reasoning 
  socket.on('swarm-create',async (data)=> {
    try {
      const swarm = await databaseService.createSwarm(data);
      socket.emit('swarm-created',swarm);
    } catch (error) {
      console.error('❌ Error creating swarm:',error);
      socket.emit('swarm-error',{message: 'Failed to create swarm'});
    }
  });

  socket.on('swarm-task',async (data)=> {
    try {
      const {swarmId,task}=data;

      // Get AI assistance for task planning with reasoning 
      const swarm = await databaseService.getSwarm(swarmId);
      if (swarm) {
        const aiAnalysis=await llmService.processSwarmTask(task,{
          role: 'coordinator',
          capabilities: ['task_distribution','coordination'],
          swarmId: swarmId
        });
        task.aiAnalysis=aiAnalysis;
      } 

      const result = await databaseService.createTask({...task,swarmId});
      socket.emit('swarm-task-submitted',result);
    } catch (error) {
      console.error('❌ Error submitting swarm task:',error);
      socket.emit('swarm-error',{message: 'Failed to submit swarm task'});
    }
  });

  // Subscribe client to swarm events 
  socket.on('swarm-subscribe',async (data)=> {
    try {
      const {swarmId}=data;

      // Create room name for this swarm 
      const roomName=`swarm:${swarmId}`;

      // Join socket.io room 
      socket.join(roomName);

      // Subscribe to swarm events 
      const unsubscribe=eventBus.subscribe('swarm:*',(event)=> {
        // Only forward events for this swarm 
        if (event.swarmId===swarmId) {
          io.to(roomName).emit('swarm-event',event);
        }
      });

      // Store unsubscribe function 
      socket.data.swarmUnsubscribe=unsubscribe;
      socket.emit('swarm-subscribed',{swarmId});
    } catch (error) {
      console.error('❌ Error subscribing to swarm:',error);
      socket.emit('swarm-error',{message: 'Failed to subscribe to swarm'});
    }
  });

  // Handle disconnect 
  socket.on('disconnect',()=> {
    console.log('🔌 Client disconnected:',socket.id);
    // Clean up any swarm subscriptions 
    if (socket.data.swarmUnsubscribe) {
      socket.data.swarmUnsubscribe();
    }
  });
});

// Set up event relaying from event bus to socket.io 
eventBus.subscribe('swarm:*',(event)=> {
  // Broadcast to all connected clients 
  io.emit('swarm-event',event);
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all handler for all other routes - send to React app
// Must be AFTER API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT=process.env.PORT || 3001;
server.listen(PORT,()=> {
  console.log(`🚀 Swarm Agents server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 LLM test: http://localhost:${PORT}/api/llm/test`);
  console.log(`🏥 LLM health: http://localhost:${PORT}/api/llm/health`);
  console.log(`🧪 Model test: http://localhost:${PORT}/api/llm/test-models`);
  console.log(`🌐 Database: ${databaseService.isSupabaseEnabled ? 'Supabase + Railway PostgreSQL' : 'Railway PostgreSQL only'}`);
});