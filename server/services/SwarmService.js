import EventEmitter from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';

/**
 * SwarmService - Coordinates multi-agent swarm activities
 * 
 * This service manages agent coordination, task distribution,
 * and shared state through an event-driven architecture.
 */
export class SwarmService {
  constructor() {
    this.eventBus = new EventEmitter();
    this.swarms = new Map();
    this.agents = new Map();
    this.tasks = new Map();
    this.redisClient = null;
    this.isRedisEnabled = false;
  }

  async initialize(redisUrl) {
    try {
      if (redisUrl) {
        this.redisClient = createClient({ url: redisUrl });
        await this.redisClient.connect();
        this.isRedisEnabled = true;
        console.log('Redis connected for distributed event bus');
        
        // Subscribe to the shared channel
        const subscriber = this.redisClient.duplicate();
        await subscriber.connect();
        await subscriber.subscribe('swarm-events', (message) => {
          const event = JSON.parse(message);
          this.handleRedisEvent(event);
        });
      }
      
      // Register system-wide event handlers
      this.registerEventHandlers();
      console.log('Swarm Service initialized');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize SwarmService:', error);
      this.isRedisEnabled = false;
      return false;
    }
  }

  /**
   * Create a new swarm of agents with specific capabilities
   */
  async createSwarm(config) {
    const swarmId = config.id || uuidv4();
    
    const swarm = {
      id: swarmId,
      name: config.name || `Swarm-${swarmId.substring(0, 8)}`,
      description: config.description || 'Agent swarm',
      createdAt: new Date().toISOString(),
      agentCount: 0,
      activeAgents: 0,
      agents: [],
      tasks: [],
      status: 'initializing',
      sharedMemory: config.initialMemory || {},
      owner: config.owner || 'system'
    };
    
    this.swarms.set(swarmId, swarm);
    
    // Create agents based on configuration
    if (config.agents && Array.isArray(config.agents)) {
      for (const agentConfig of config.agents) {
        const agent = await this.createAgent({
          ...agentConfig,
          swarmId
        });
        
        swarm.agents.push(agent.id);
        swarm.agentCount++;
      }
    }
    
    swarm.status = 'ready';
    this.publishEvent('swarm:created', { swarm });
    
    return swarm;
  }

  /**
   * Create a new agent with specific capabilities
   */
  async createAgent(config) {
    const agentId = config.id || uuidv4();
    
    const agent = {
      id: agentId,
      name: config.name || `Agent-${agentId.substring(0, 8)}`,
      type: config.type || 'worker',
      capabilities: config.capabilities || [],
      swarmId: config.swarmId || null,
      status: 'idle',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      tasksCompleted: 0,
      currentTask: null,
      memory: config.memory || [],
      context: config.context || {},
      role: config.role || 'general',
      priority: config.priority || 5
    };
    
    this.agents.set(agentId, agent);
    
    // Add to swarm if part of one
    if (agent.swarmId && this.swarms.has(agent.swarmId)) {
      const swarm = this.swarms.get(agent.swarmId);
      if (!swarm.agents.includes(agentId)) {
        swarm.agents.push(agentId);
        swarm.agentCount++;
      }
    }
    
    this.publishEvent('agent:created', { agent });
    
    return agent;
  }

  /**
   * Submit a task to be processed by the swarm
   */
  async submitTask(config) {
    const taskId = config.id || uuidv4();
    
    const task = {
      id: taskId,
      type: config.type || 'general',
      description: config.description || '',
      status: 'pending',
      priority: config.priority || 5,
      createdAt: new Date().toISOString(),
      swarmId: config.swarmId,
      assignedAgents: [],
      dependencies: config.dependencies || [],
      result: null,
      progress: 0,
      deadline: config.deadline || null,
      context: config.context || {},
      subtasks: []
    };
    
    this.tasks.set(taskId, task);
    
    // If task has a swarm, add to swarm's task list
    if (task.swarmId && this.swarms.has(task.swarmId)) {
      const swarm = this.swarms.get(task.swarmId);
      swarm.tasks.push(taskId);
    }
    
    this.publishEvent('task:created', { task });
    
    // Automatically schedule task
    await this.scheduleTask(taskId);
    
    return task;
  }

  /**
   * Schedule a task to appropriate agent(s)
   */
  async scheduleTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    
    // Check if task is ready based on dependencies
    if (task.dependencies.length > 0) {
      const unfinishedDependencies = task.dependencies.filter(depId => {
        const depTask = this.tasks.get(depId);
        return !depTask || depTask.status !== 'completed';
      });
      
      if (unfinishedDependencies.length > 0) {
        // Task not ready to be scheduled yet
        return null;
      }
    }
    
    // Find suitable agent based on capabilities and status
    let assignedAgent = null;
    
    // If task is part of a swarm, only consider agents from that swarm
    const candidateAgents = Array.from(this.agents.values()).filter(agent => {
      if (task.swarmId && agent.swarmId !== task.swarmId) return false;
      if (agent.status !== 'idle') return false;
      
      // Check if agent has required capabilities
      if (task.requiredCapabilities && Array.isArray(task.requiredCapabilities)) {
        return task.requiredCapabilities.every(cap => agent.capabilities.includes(cap));
      }
      
      return true;
    });
    
    // Sort by priority and idle time
    candidateAgents.sort((a, b) => {
      // Higher priority agents first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Then by idle time (agents idle longer get priority)
      return new Date(a.lastActive) - new Date(b.lastActive);
    });
    
    if (candidateAgents.length > 0) {
      assignedAgent = candidateAgents[0];
      
      // Update agent status
      assignedAgent.status = 'busy';
      assignedAgent.currentTask = taskId;
      assignedAgent.lastActive = new Date().toISOString();
      
      // Update task status
      task.status = 'assigned';
      task.assignedAgents.push(assignedAgent.id);
      task.assignedAt = new Date().toISOString();
      
      this.publishEvent('task:assigned', { taskId, agentId: assignedAgent.id });
      
      return { task, agent: assignedAgent };
    }
    
    // No suitable agent found
    return null;
  }

  /**
   * Update task status and progress
   */
  async updateTaskStatus(taskId, updates) {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    
    // Apply updates
    Object.assign(task, updates);
    
    if (updates.status === 'completed') {
      task.completedAt = new Date().toISOString();
      
      // If agents were assigned, mark them as idle
      for (const agentId of task.assignedAgents) {
        const agent = this.agents.get(agentId);
        if (agent) {
          agent.status = 'idle';
          agent.currentTask = null;
          agent.tasksCompleted++;
          agent.lastActive = new Date().toISOString();
          
          // Add to agent memory
          agent.memory.push({
            taskId,
            type: task.type,
            result: task.result,
            timestamp: new Date().toISOString()
          });
          
          // Keep memory at a reasonable size
          if (agent.memory.length > 100) {
            agent.memory = agent.memory.slice(-100);
          }
        }
      }
      
      // Check if this unblocks dependent tasks
      this.checkDependentTasks(taskId);
    } else if (updates.status === 'failed') {
      task.failedAt = new Date().toISOString();
      
      // Free up assigned agents
      for (const agentId of task.assignedAgents) {
        const agent = this.agents.get(agentId);
        if (agent) {
          agent.status = 'idle';
          agent.currentTask = null;
          agent.lastActive = new Date().toISOString();
        }
      }
    }
    
    this.publishEvent('task:updated', { taskId, updates });
    
    return task;
  }

  /**
   * Check and schedule tasks that depend on a completed task
   */
  async checkDependentTasks(completedTaskId) {
    // Find all tasks that depend on the completed task
    const dependentTasks = Array.from(this.tasks.values()).filter(task => 
      task.dependencies.includes(completedTaskId) && task.status === 'pending'
    );
    
    for (const task of dependentTasks) {
      // Check if all dependencies are now satisfied
      const unfinishedDependencies = task.dependencies.filter(depId => {
        const depTask = this.tasks.get(depId);
        return !depTask || depTask.status !== 'completed';
      });
      
      if (unfinishedDependencies.length === 0) {
        // All dependencies satisfied, schedule the task
        await this.scheduleTask(task.id);
      }
    }
  }

  /**
   * Send a message between agents
   */
  async sendAgentMessage(fromAgentId, toAgentId, message) {
    const fromAgent = this.agents.get(fromAgentId);
    const toAgent = this.agents.get(toAgentId);
    
    if (!fromAgent || !toAgent) {
      throw new Error('Invalid agent IDs');
    }
    
    const messageObj = {
      id: uuidv4(),
      from: fromAgentId,
      to: toAgentId,
      content: message,
      timestamp: new Date().toISOString()
    };
    
    this.publishEvent('agent:message', messageObj);
    
    return messageObj;
  }

  /**
   * Broadcast a message to all agents in a swarm
   */
  async broadcastToSwarm(swarmId, message, excludeAgentId = null) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) {
      throw new Error('Invalid swarm ID');
    }
    
    const messageObj = {
      id: uuidv4(),
      from: 'system',
      to: 'swarm:' + swarmId,
      content: message,
      timestamp: new Date().toISOString()
    };
    
    this.publishEvent('swarm:broadcast', {
      swarmId,
      message: messageObj,
      excludeAgentId
    });
    
    return messageObj;
  }

  /**
   * Update shared memory for a swarm
   */
  async updateSwarmMemory(swarmId, updates, agentId = null) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) {
      throw new Error('Invalid swarm ID');
    }
    
    // Apply updates to shared memory
    swarm.sharedMemory = {
      ...swarm.sharedMemory,
      ...updates
    };
    
    this.publishEvent('swarm:memory_updated', {
      swarmId,
      updates,
      updatedBy: agentId || 'system',
      timestamp: new Date().toISOString()
    });
    
    return swarm.sharedMemory;
  }

  /**
   * Get all active swarms
   */
  getSwarms() {
    return Array.from(this.swarms.values());
  }

  /**
   * Get all agents, optionally filtered by swarm
   */
  getAgents(swarmId = null) {
    if (swarmId) {
      return Array.from(this.agents.values()).filter(agent => agent.swarmId === swarmId);
    }
    return Array.from(this.agents.values());
  }

  /**
   * Get all tasks, optionally filtered by swarm
   */
  getTasks(swarmId = null) {
    if (swarmId) {
      return Array.from(this.tasks.values()).filter(task => task.swarmId === swarmId);
    }
    return Array.from(this.tasks.values());
  }

  /**
   * Publish an event to the event bus
   */
  publishEvent(eventType, data) {
    // Local event emission
    this.eventBus.emit(eventType, data);
    
    // If Redis is enabled, publish to Redis
    if (this.isRedisEnabled && this.redisClient) {
      const event = {
        id: uuidv4(),
        type: eventType,
        data,
        timestamp: new Date().toISOString()
      };
      
      this.redisClient.publish('swarm-events', JSON.stringify(event)).catch(err => {
        console.error('Failed to publish event to Redis:', err);
      });
    }
  }

  /**
   * Subscribe to events on the event bus
   */
  subscribeToEvent(eventType, callback) {
    this.eventBus.on(eventType, callback);
    
    // Return unsubscribe function
    return () => {
      this.eventBus.off(eventType, callback);
    };
  }

  /**
   * Handle events from Redis
   */
  handleRedisEvent(event) {
    // Don't re-emit the event if it originated from this instance
    if (event.sourceInstanceId === this.instanceId) {
      return;
    }
    
    // Emit the event locally
    this.eventBus.emit(event.type, event.data);
  }

  /**
   * Register internal event handlers
   */
  registerEventHandlers() {
    // Handle agent status changes
    this.eventBus.on('agent:status_changed', ({ agentId, status }) => {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = status;
        agent.lastActive = new Date().toISOString();
        
        // If agent is now idle, check for pending tasks
        if (status === 'idle') {
          this.checkPendingTasks();
        }
      }
    });
    
    // Handle task completion
    this.eventBus.on('task:completed', ({ taskId, result }) => {
      this.updateTaskStatus(taskId, { 
        status: 'completed',
        result,
        completedAt: new Date().toISOString()
      });
    });
  }

  /**
   * Check for pending tasks that could be assigned
   */
  async checkPendingTasks() {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => b.priority - a.priority);
    
    for (const task of pendingTasks) {
      await this.scheduleTask(task.id);
    }
  }

  /**
   * Create a subtask from a parent task
   */
  async createSubtask(parentTaskId, config) {
    const parentTask = this.tasks.get(parentTaskId);
    if (!parentTask) {
      throw new Error('Parent task not found');
    }
    
    const subtaskId = uuidv4();
    const subtask = {
      id: subtaskId,
      parentTaskId,
      type: config.type || parentTask.type,
      description: config.description,
      status: 'pending',
      priority: config.priority || parentTask.priority,
      createdAt: new Date().toISOString(),
      swarmId: parentTask.swarmId,
      assignedAgents: [],
      result: null,
      context: {
        ...parentTask.context,
        ...config.context
      }
    };
    
    this.tasks.set(subtaskId, subtask);
    parentTask.subtasks.push(subtaskId);
    
    this.publishEvent('subtask:created', { 
      subtask,
      parentTaskId 
    });
    
    // Schedule the subtask
    await this.scheduleTask(subtaskId);
    
    return subtask;
  }
}