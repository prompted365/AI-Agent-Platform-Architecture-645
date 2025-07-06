import { v4 as uuidv4 } from 'uuid';

export class AgentService {
  constructor(swarmService) {
    this.agents = new Map();
    this.activeTasks = new Map();
    this.taskQueue = [];
    this.swarmService = swarmService;
  }

  async initialize() {
    // Subscribe to swarm events
    if (this.swarmService) {
      this.swarmService.subscribeToEvent('task:assigned', this.handleTaskAssigned.bind(this));
      this.swarmService.subscribeToEvent('agent:message', this.handleAgentMessage.bind(this));
    }
    
    console.log('Agent Service initialized');
  }

  /**
   * Handle task assignment from swarm service
   */
  async handleTaskAssigned({ taskId, agentId }) {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    // Update agent status
    agent.status = 'busy';
    this.agents.set(agentId, agent);
    
    // Execute the task
    this.executeTask(agentId, { id: taskId });
  }

  /**
   * Handle agent-to-agent messages
   */
  async handleAgentMessage(message) {
    const toAgent = this.agents.get(message.to);
    if (!toAgent) return;
    
    // Add message to agent's context
    if (!toAgent.messages) {
      toAgent.messages = [];
    }
    
    toAgent.messages.push(message);
    
    // Limit message history
    if (toAgent.messages.length > 50) {
      toAgent.messages = toAgent.messages.slice(-50);
    }
    
    this.agents.set(message.to, toAgent);
  }

  async createAgent(agentConfig) {
    const agent = {
      id: uuidv4(),
      ...agentConfig,
      status: 'idle',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      tasksCompleted: 0,
      averageResponseTime: 0,
      capabilities: agentConfig.capabilities || [],
      context: {},
      memory: []
    };

    this.agents.set(agent.id, agent);
    
    // Register with swarm service if available
    if (this.swarmService && agentConfig.swarmId) {
      await this.swarmService.createAgent({
        ...agent,
        type: agentConfig.type || 'worker'
      });
    }
    
    return agent;
  }

  async getAgents() {
    return Array.from(this.agents.values());
  }

  async getAgent(agentId) {
    return this.agents.get(agentId);
  }

  async updateAgent(agentId, updates) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    Object.assign(agent, updates);
    agent.lastActive = new Date().toISOString();
    this.agents.set(agentId, agent);
    
    // Update swarm service if connected
    if (this.swarmService && agent.swarmId) {
      // Publish status change event
      this.swarmService.publishEvent('agent:status_changed', {
        agentId,
        status: agent.status,
        lastActive: agent.lastActive
      });
    }
    
    return agent;
  }

  async deleteAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Cancel any active tasks
    for (const [taskId, task] of this.activeTasks) {
      if (task.agentId === agentId) {
        await this.cancelTask(taskId);
      }
    }

    this.agents.delete(agentId);
    return true;
  }

  async executeTask(agentId, task, context = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const taskId = task.id || uuidv4();
    const taskData = {
      id: taskId,
      agentId,
      task,
      context,
      status: 'running',
      startTime: Date.now(),
      result: null,
      error: null
    };

    this.activeTasks.set(taskId, taskData);
    agent.status = 'busy';
    this.agents.set(agentId, agent);

    try {
      const result = await this.processTask(agent, task, context);
      
      taskData.status = 'completed';
      taskData.result = result;
      taskData.endTime = Date.now();

      // Update agent stats
      agent.tasksCompleted++;
      agent.averageResponseTime = this.calculateAverageResponseTime(agent, taskData.endTime - taskData.startTime);
      agent.status = 'idle';
      agent.lastActive = new Date().toISOString();

      // Store in memory
      agent.memory.push({
        task: task.type,
        context: task.description,
        result: result.summary || 'Task completed',
        timestamp: new Date().toISOString()
      });

      // Keep only last 100 memories
      if (agent.memory.length > 100) {
        agent.memory = agent.memory.slice(-100);
      }

      this.agents.set(agentId, agent);
      this.activeTasks.delete(taskId);
      
      // Notify swarm service of task completion
      if (this.swarmService && task.swarmTaskId) {
        this.swarmService.publishEvent('task:completed', {
          taskId: task.swarmTaskId,
          result: result
        });
      }
      
      return result;
    } catch (error) {
      taskData.status = 'failed';
      taskData.error = error.message;
      taskData.endTime = Date.now();
      
      agent.status = 'error';
      this.agents.set(agentId, agent);
      this.activeTasks.delete(taskId);
      
      // Notify swarm service of task failure
      if (this.swarmService && task.swarmTaskId) {
        this.swarmService.publishEvent('task:failed', {
          taskId: task.swarmTaskId,
          error: error.message
        });
      }
      
      throw error;
    }
  }

  async processTask(agent, task, context) {
    switch (task.type) {
      case 'code_generation':
        return this.processCodeGeneration(agent, task, context);
      case 'code_review':
        return this.processCodeReview(agent, task, context);
      case 'debugging':
        return this.processDebugging(agent, task, context);
      case 'testing':
        return this.processTesting(agent, task, context);
      case 'documentation':
        return this.processDocumentation(agent, task, context);
      case 'research':
        return this.processResearch(agent, task, context);
      case 'analysis':
        return this.processAnalysis(agent, task, context);
      case 'swarm_coordination':
        return this.processSwarmCoordination(agent, task, context);
      case 'message_relay':
        return this.processMessageRelay(agent, task, context);
      default:
        return this.processGenericTask(agent, task, context);
    }
  }

  // New swarm-specific task handlers
  
  async processSwarmCoordination(agent, task, context) {
    await this.delay(1000);
    
    // Check for swarm service
    if (!this.swarmService) {
      throw new Error('Swarm service not available');
    }
    
    const swarmId = task.swarmId || agent.swarmId;
    if (!swarmId) {
      throw new Error('No swarm ID provided for coordination task');
    }
    
    // Get current swarm state
    const swarmAgents = this.swarmService.getAgents(swarmId);
    const swarmTasks = this.swarmService.getTasks(swarmId);
    
    // Perform coordination based on task specifics
    let coordinationResult;
    
    switch (task.coordinationType) {
      case 'task_distribution':
        coordinationResult = this.distributeTasksToAgents(swarmId, task.tasks, swarmAgents);
        break;
      case 'memory_sync':
        coordinationResult = this.syncSwarmMemory(swarmId, task.memoryUpdates);
        break;
      case 'agent_recruitment':
        coordinationResult = this.recruitAgentsForSwarm(swarmId, task.requirements, task.count || 1);
        break;
      default:
        coordinationResult = {
          swarmId,
          agentCount: swarmAgents.length,
          taskCount: swarmTasks.length,
          status: 'coordination_completed'
        };
    }
    
    return {
      type: 'swarm_coordination',
      result: coordinationResult,
      summary: `Coordinated swarm ${swarmId} with ${swarmAgents.length} agents`
    };
  }
  
  async processMessageRelay(agent, task, context) {
    await this.delay(500);
    
    if (!this.swarmService) {
      throw new Error('Swarm service not available');
    }
    
    const { targetAgentId, message, broadcast, swarmId } = task;
    
    if (broadcast && swarmId) {
      // Broadcast to entire swarm
      await this.swarmService.broadcastToSwarm(swarmId, message, agent.id);
      return {
        type: 'message_relay',
        result: { broadcast: true, recipients: 'swarm', swarmId },
        summary: `Message broadcast to swarm ${swarmId}`
      };
    } else if (targetAgentId) {
      // Send to specific agent
      await this.swarmService.sendAgentMessage(agent.id, targetAgentId, message);
      return {
        type: 'message_relay',
        result: { sent: true, to: targetAgentId },
        summary: `Message sent to agent ${targetAgentId}`
      };
    } else {
      throw new Error('Message relay requires either targetAgentId or broadcast=true with swarmId');
    }
  }
  
  // Helper methods for swarm coordination
  
  async distributeTasksToAgents(swarmId, tasks, agents) {
    if (!this.swarmService) return { error: 'Swarm service not available' };
    
    const results = [];
    
    for (const task of tasks) {
      const submittedTask = await this.swarmService.submitTask({
        ...task,
        swarmId
      });
      
      results.push({
        taskId: submittedTask.id,
        status: submittedTask.status
      });
    }
    
    return {
      distributed: results.length,
      results
    };
  }
  
  async syncSwarmMemory(swarmId, memoryUpdates) {
    if (!this.swarmService) return { error: 'Swarm service not available' };
    
    const updatedMemory = await this.swarmService.updateSwarmMemory(
      swarmId,
      memoryUpdates
    );
    
    return {
      synced: true,
      memorySize: Object.keys(updatedMemory).length
    };
  }
  
  async recruitAgentsForSwarm(swarmId, requirements, count) {
    if (!this.swarmService) return { error: 'Swarm service not available' };
    
    const results = [];
    
    for (let i = 0; i < count; i++) {
      const agent = await this.createAgent({
        name: `Recruited-${i}`,
        swarmId,
        capabilities: requirements.capabilities || [],
        type: requirements.type || 'worker',
        role: requirements.role || 'assistant'
      });
      
      results.push({
        agentId: agent.id,
        status: 'recruited'
      });
    }
    
    return {
      recruited: results.length,
      agents: results
    };
  }

  // Original task processing methods

  async processCodeGeneration(agent, task, context) {
    // Simulate code generation process
    await this.delay(2000);
    const code = this.generateCode(task.requirements, task.language);
    return {
      type: 'code_generation',
      code,
      language: task.language,
      explanation: `Generated ${task.language} code based on requirements`,
      summary: 'Code generation completed successfully'
    };
  }

  async processCodeReview(agent, task, context) {
    await this.delay(1500);
    const issues = this.analyzeCode(task.code, task.language);
    return {
      type: 'code_review',
      issues,
      suggestions: this.generateSuggestions(issues),
      rating: this.calculateCodeRating(issues),
      summary: `Found ${issues.length} issues in code review`
    };
  }

  async processDebugging(agent, task, context) {
    await this.delay(3000);
    const bugs = this.findBugs(task.code, task.error);
    const fixes = this.generateFixes(bugs);
    return {
      type: 'debugging',
      bugs,
      fixes,
      fixedCode: this.applyFixes(task.code, fixes),
      summary: `Identified and fixed ${bugs.length} bugs`
    };
  }

  async processTesting(agent, task, context) {
    await this.delay(2500);
    const tests = this.generateTests(task.code, task.language);
    return {
      type: 'testing',
      tests,
      coverage: this.calculateCoverage(tests),
      summary: `Generated ${tests.length} test cases`
    };
  }

  async processDocumentation(agent, task, context) {
    await this.delay(1000);
    const documentation = this.generateDocumentation(task.code, task.language);
    return {
      type: 'documentation',
      documentation,
      format: 'markdown',
      summary: 'Generated comprehensive documentation'
    };
  }

  async processResearch(agent, task, context) {
    await this.delay(4000);
    const findings = this.conductResearch(task.topic, task.scope);
    return {
      type: 'research',
      findings,
      sources: this.getSources(findings),
      summary: `Research completed on ${task.topic}`
    };
  }

  async processAnalysis(agent, task, context) {
    await this.delay(2000);
    const analysis = this.performAnalysis(task.data, task.type);
    return {
      type: 'analysis',
      analysis,
      insights: this.generateInsights(analysis),
      summary: 'Analysis completed successfully'
    };
  }

  async processGenericTask(agent, task, context) {
    await this.delay(1000);
    return {
      type: 'generic',
      result: `Task "${task.description}" processed by ${agent.name}`,
      summary: 'Generic task completed'
    };
  }

  // Helper methods for task processing
  generateCode(requirements, language) {
    // Mock code generation
    const templates = {
      javascript: `// Generated JavaScript code\nfunction ${requirements.functionName || 'generatedFunction'}() {\n  // Implementation here\n  return 'Hello, World!';\n}`,
      python: `# Generated Python code\ndef ${requirements.functionName || 'generated_function'}():\n    """Generated function"""\n    return "Hello, World!"`,
      java: `// Generated Java code\npublic class ${requirements.className || 'GeneratedClass'} {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
    };
    return templates[language] || templates.javascript;
  }

  analyzeCode(code, language) {
    // Mock code analysis
    const issues = [];
    if (code.includes('var ')) {
      issues.push({
        type: 'warning',
        message: 'Use const/let instead of var',
        line: 1,
        severity: 'medium'
      });
    }
    if (!code.includes('//') && !code.includes('/*')) {
      issues.push({
        type: 'info',
        message: 'Consider adding comments',
        line: 1,
        severity: 'low'
      });
    }
    return issues;
  }

  generateSuggestions(issues) {
    return issues.map(issue => ({
      issue: issue.message,
      suggestion: `Fix: ${issue.message}`,
      priority: issue.severity
    }));
  }

  calculateCodeRating(issues) {
    const severityWeights = {
      high: 3,
      medium: 2,
      low: 1
    };
    const totalWeight = issues.reduce((sum, issue) => sum + severityWeights[issue.severity], 0);
    return Math.max(1, 10 - totalWeight);
  }

  findBugs(code, error) {
    // Mock bug detection
    return [
      {
        type: 'syntax_error',
        message: 'Missing semicolon',
        line: 1,
        column: 10
      }
    ];
  }

  generateFixes(bugs) {
    return bugs.map(bug => ({
      bug: bug.message,
      fix: `Add semicolon at line ${bug.line}`,
      line: bug.line,
      column: bug.column
    }));
  }

  applyFixes(code, fixes) {
    // Mock fix application
    return code + '; // Fixed';
  }

  generateTests(code, language) {
    // Mock test generation
    return [
      {
        name: 'should return expected value',
        code: `test('should return expected value', () => {\n  expect(generatedFunction()).toBe('Hello, World!');\n});`,
        type: 'unit'
      }
    ];
  }

  calculateCoverage(tests) {
    return {
      lines: 85,
      functions: 90,
      branches: 80,
      statements: 88
    };
  }

  generateDocumentation(code, language) {
    return `# Code Documentation\n\nThis code implements the following functionality:\n\n## Functions\n\n- Main function: Executes the primary logic\n\n## Usage\n\n\`\`\`${language}\n${code}\n\`\`\``;
  }

  conductResearch(topic, scope) {
    // Mock research
    return [
      {
        title: `Research on ${topic}`,
        summary: `Comprehensive analysis of ${topic} within ${scope} scope`,
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
        confidence: 0.85
      }
    ];
  }

  getSources(findings) {
    return findings.map(finding => ({
      title: finding.title,
      url: `https://example.com/${finding.title.replace(/\s+/g, '-').toLowerCase()}`,
      relevance: finding.confidence
    }));
  }

  performAnalysis(data, type) {
    // Mock analysis
    return {
      summary: `Analysis of ${type} data`,
      metrics: {
        totalItems: data?.length || 0,
        avgValue: 42,
        maxValue: 100,
        minValue: 0
      }
    };
  }

  generateInsights(analysis) {
    return [
      'Data shows consistent patterns',
      'Performance is within expected ranges',
      'Recommend monitoring key metrics'
    ];
  }

  calculateAverageResponseTime(agent, newTime) {
    const currentAvg = agent.averageResponseTime || 0;
    const totalTasks = agent.tasksCompleted || 0;
    return Math.round(((currentAvg * (totalTasks - 1)) + newTime) / totalTasks);
  }

  async cancelTask(taskId) {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = 'cancelled';
      this.activeTasks.delete(taskId);
      
      const agent = this.agents.get(task.agentId);
      if (agent) {
        agent.status = 'idle';
        this.agents.set(task.agentId, agent);
      }
    }
  }

  async getActiveTasks() {
    return Array.from(this.activeTasks.values());
  }

  async getTaskHistory(agentId) {
    const agent = this.agents.get(agentId);
    return agent ? agent.memory : [];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}