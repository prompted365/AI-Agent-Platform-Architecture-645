import axios from 'axios';

export class LLMService {
  constructor() {
    this.requestyApiKey = process.env.REQUESTY_API_KEY;
    this.baseUrl = 'https://router.requesty.ai/v1';
    this.defaultModel = 'anthropic/claude-sonnet-4-0'; // Using the Sonnet-4 model you specified
  }

  async generateResponse(message, options = {}) {
    try {
      const { 
        agent, 
        context, 
        model = this.defaultModel, 
        stream = false,
        reasoning_effort = 'medium' // Enable reasoning by default
      } = options;
      
      const systemPrompt = this.buildSystemPrompt(agent, context);

      console.log('🔗 Requesty API Request:', {
        url: `${this.baseUrl}/chat/completions`,
        model,
        reasoning_effort,
        hasApiKey: !!this.requestyApiKey,
        apiKeyPrefix: this.requestyApiKey ? this.requestyApiKey.substring(0, 10) + '...' : 'MISSING'
      });

      // Construct request exactly as per Requesty docs with reasoning
      const requestPayload = {
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        reasoning_effort, // Enable reasoning tokens
        stream: false
      };

      console.log('📤 Request Payload:', JSON.stringify(requestPayload, null, 2));

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.requestyApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000, // Increased timeout for reasoning models
          validateStatus: (status) => status < 500
        }
      );

      console.log('📥 Requesty Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers['content-type'],
        dataType: typeof response.data,
        hasChoices: !!response.data?.choices,
        choicesCount: response.data?.choices?.length || 0,
        usage: response.data?.usage
      });

      // Handle non-200 responses
      if (response.status !== 200) {
        console.error('❌ API Error Response:', response.data);
        throw new Error(`API returned ${response.status}: ${response.data?.error?.message || response.statusText}`);
      }

      // Validate response structure
      if (!response.data) {
        throw new Error('Empty response from API');
      }

      if (!response.data.choices || !Array.isArray(response.data.choices)) {
        console.error('❌ Invalid response structure:', response.data);
        throw new Error('Invalid response structure: missing choices array');
      }

      if (response.data.choices.length === 0) {
        throw new Error('No response choices returned from API');
      }

      const choice = response.data.choices[0];
      if (!choice.message) {
        console.error('❌ Invalid choice structure:', choice);
        throw new Error('Invalid choice structure: missing message');
      }

      // Handle reasoning content from Anthropic models
      let content = choice.message.content || '';
      if (choice.message.reasoning_content) {
        content = `**Reasoning Process:**\n${choice.message.reasoning_content}\n\n**Response:**\n${content}`;
      }

      console.log('✅ Successfully parsed response:', {
        id: response.data.id,
        model: response.data.model,
        usage: response.data.usage,
        contentLength: content.length,
        hasReasoning: !!choice.message.reasoning_content
      });

      return content;

    } catch (error) {
      console.error('🚨 LLM Service Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        isAxiosError: error.isAxiosError,
        code: error.code
      });

      // Provide specific error messages
      if (error.response?.status === 401) {
        throw new Error('🔑 Invalid API key. Please check your Requesty API key configuration.');
      } else if (error.response?.status === 403) {
        throw new Error('🚫 Forbidden. Your API key may not have permission to use this model.');
      } else if (error.response?.status === 404) {
        throw new Error('🔍 Model not found. Please check the model name is correct.');
      } else if (error.response?.status === 429) {
        throw new Error('⏱️ Rate limit exceeded. Please try again later.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('⏰ Request timeout. The AI service is taking too long to respond.');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('🌐 Network error. Unable to connect to Requesty API.');
      } else {
        throw new Error(`🤖 AI service error: ${error.message}`);
      }
    }
  }

  buildSystemPrompt(agent, context) {
    let prompt = `You are Claude Sonnet-4, an advanced AI development assistant with sophisticated reasoning capabilities. You help developers with coding, debugging, architecture, and project management.

Core Capabilities:
- Code generation and review across multiple languages
- Advanced debugging and optimization with step-by-step reasoning
- Architecture design and best practices with detailed explanations
- Project management and planning with reasoning analysis
- Documentation and testing strategies
- Deployment guidance and DevOps

Guidelines:
- Use your reasoning tokens to show your thought process
- Provide practical, actionable solutions with clear explanations
- Include code examples when relevant with reasoning behind choices
- Explain complex concepts clearly with step-by-step reasoning
- Consider security and performance best practices
- Offer multiple approaches when appropriate and explain trade-offs
- Be thorough but clear in your explanations

Context:
- Current project: ${context?.currentProject?.name || 'None'}
- Active files: ${context?.activeFiles?.map(f => f.name).join(', ') || 'None'}
- Recent chat history: ${context?.chatHistory?.length || 0} messages`;

    if (agent) {
      prompt += `

Agent Configuration:
- Name: ${agent.name}
- Type: ${agent.type}
- Capabilities: ${agent.capabilities?.join(', ') || 'General'}
- Description: ${agent.description}`;
    }

    if (context?.swarm) {
      prompt += `

Swarm Context:
- Swarm ID: ${context.swarm.id}
- Agent Count: ${context.swarm.agentCount}
- Active Tasks: ${context.swarm.activeTasks || 0}
- Coordination Mode: ${context.swarm.coordinationMode || 'standard'}`;
    }

    return prompt;
  }

  async generateCodeCompletion(code, language, cursor) {
    try {
      const prompt = `Complete this ${language} code. Show your reasoning for the completion approach:

${code}

Complete from the cursor position with contextually appropriate code.`;

      const response = await this.generateResponse(prompt, {
        model: 'anthropic/claude-sonnet-4-0',
        context: { language, cursor },
        reasoning_effort: 'low' // Use minimal reasoning for quick completions
      });

      return response;
    } catch (error) {
      console.error('Code completion error:', error);
      throw new Error('Failed to generate code completion');
    }
  }

  async analyzeCode(code, language) {
    try {
      const prompt = `Analyze this ${language} code. Use reasoning tokens to show your analysis process:

1. Potential bugs and issues
2. Security vulnerabilities
3. Performance concerns
4. Best practice violations
5. Improvement suggestions

Code:
\`\`\`${language}
${code}
\`\`\`

Provide a detailed analysis with your reasoning process and specific recommendations.`;

      const response = await this.generateResponse(prompt, {
        context: { language, analysisType: 'comprehensive' },
        reasoning_effort: 'high' // Use high reasoning for thorough analysis
      });

      return response;
    } catch (error) {
      console.error('Code analysis error:', error);
      throw new Error('Failed to analyze code');
    }
  }

  async generateArtifact(description, type = 'code', language = 'javascript') {
    try {
      let prompt = '';
      
      switch (type) {
        case 'code':
          prompt = `Generate ${language} code based on this description: ${description}

Use reasoning tokens to explain your approach and decisions:

Requirements:
- Write clean, well-commented code
- Follow best practices for ${language}
- Include error handling where appropriate
- Make it production-ready
- Explain your architectural choices

Return the code with reasoning for your implementation decisions.`;
          break;
          
        case 'web_app':
          prompt = `Create a complete HTML web application based on: ${description}

Use reasoning to plan the application structure:

Requirements:
- Include HTML, CSS, and JavaScript in a single file
- Make it responsive and visually appealing
- Add interactivity where appropriate
- Use modern web standards
- Explain your design decisions

Return the HTML code with reasoning for your approach.`;
          break;
          
        case 'document':
          prompt = `Create a comprehensive document about: ${description}

Use reasoning to structure the content effectively:

Format as Markdown with:
- Clear structure and headings
- Bullet points and lists where appropriate
- Code examples if relevant
- Practical information and examples
- Logical flow and organization

Explain your content organization reasoning.`;
          break;
          
        default:
          prompt = `Create content based on: ${description}

Type: ${type}
Use reasoning tokens to plan and explain your approach.
Format the response appropriately for the content type.`;
      }

      const response = await this.generateResponse(prompt, {
        context: { type, language, artifactGeneration: true },
        reasoning_effort: 'medium'
      });

      return response;
    } catch (error) {
      console.error('Artifact generation error:', error);
      throw new Error('Failed to generate artifact');
    }
  }

  async processSwarmTask(task, agentContext) {
    try {
      const prompt = `Process this swarm task using reasoning tokens to plan coordination:

Task Type: ${task.type}
Description: ${task.description}
Priority: ${task.priority}

Agent Context:
- Role: ${agentContext.role}
- Capabilities: ${agentContext.capabilities.join(', ')}
- Swarm ID: ${agentContext.swarmId}

Use reasoning to provide a detailed response for how this agent should handle the task, including:
1. Approach and methodology with reasoning
2. Expected deliverables
3. Potential challenges and mitigation strategies
4. Coordination needs with other agents
5. Timeline estimation with reasoning
6. Resource requirements analysis`;

      const response = await this.generateResponse(prompt, {
        agent: agentContext,
        context: { 
          swarm: { 
            id: agentContext.swarmId,
            taskProcessing: true 
          }
        },
        reasoning_effort: 'high' // Use high reasoning for complex coordination
      });

      return response;
    } catch (error) {
      console.error('Swarm task processing error:', error);
      throw new Error('Failed to process swarm task');
    }
  }

  // Health check method
  async healthCheck() {
    try {
      console.log('🏥 Running health check...');
      
      const response = await this.generateResponse('Say "OK" if you can respond. Use minimal reasoning.', {
        model: 'anthropic/claude-sonnet-4-0',
        reasoning_effort: 'low'
      });
      
      return {
        status: 'healthy',
        response: response,
        timestamp: new Date().toISOString(),
        model: 'anthropic/claude-sonnet-4-0'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test with different models including reasoning models
  async testModels() {
    const modelsToTest = [
      'anthropic/claude-sonnet-4-0',
      'openai/gpt-4o-mini',
      'openai/o3-mini'
    ];

    const results = [];

    for (const model of modelsToTest) {
      try {
        console.log(`🧪 Testing model: ${model}`);
        
        const start = Date.now();
        const reasoning_effort = model.includes('anthropic') || model.includes('o3') ? 'low' : undefined;
        
        const response = await this.generateResponse('Hello! Please respond with "OK"', { 
          model,
          reasoning_effort
        });
        const duration = Date.now() - start;

        results.push({
          model,
          status: 'success',
          response: response.substring(0, 100),
          duration,
          hasReasoning: model.includes('anthropic') || model.includes('o3')
        });
      } catch (error) {
        results.push({
          model,
          status: 'error',
          error: error.message
        });
      }
    }

    return results;
  }
}