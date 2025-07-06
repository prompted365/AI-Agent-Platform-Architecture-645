import axios from 'axios';

export class LLMService {
  constructor() {
    this.requestyApiKey = process.env.REQUESTY_API_KEY;
    this.baseUrl = 'https://api.requesty.ai/v1';
  }

  async generateResponse(message, options = {}) {
    try {
      const { agent, context } = options;
      
      const systemPrompt = this.buildSystemPrompt(agent, context);
      
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.requestyApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LLM Service Error:', error);
      throw new Error('Failed to generate response');
    }
  }

  buildSystemPrompt(agent, context) {
    let prompt = `You are Claude Code, an advanced AI development assistant. You help developers with coding, debugging, architecture, and project management.

Core Capabilities:
- Code generation and review
- Debugging and optimization
- Architecture design
- Project management
- Documentation
- Testing strategies
- Deployment guidance

Context:
- Current project: ${context?.currentProject?.name || 'None'}
- Active files: ${context?.activeFiles?.map(f => f.name).join(', ') || 'None'}
- Recent chat history: ${context?.chatHistory?.length || 0} messages

Guidelines:
- Provide practical, actionable solutions
- Include code examples when relevant
- Explain complex concepts clearly
- Consider security and best practices
- Offer multiple approaches when appropriate`;

    if (agent) {
      prompt += `\n\nAgent Configuration:
- Name: ${agent.name}
- Type: ${agent.type}
- Capabilities: ${agent.capabilities?.join(', ') || 'General'}
- Description: ${agent.description}`;
    }

    if (context?.mcp) {
      prompt += `\n\nMCP Context:
${JSON.stringify(context.mcp, null, 2)}`;
    }

    return prompt;
  }

  async generateCodeCompletion(code, language, cursor) {
    try {
      const response = await axios.post(`${this.baseUrl}/completions`, {
        model: 'code-davinci-002',
        prompt: code,
        max_tokens: 150,
        temperature: 0.2,
        suffix: '',
        stop: ['\n\n']
      }, {
        headers: {
          'Authorization': `Bearer ${this.requestyApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].text;
    } catch (error) {
      console.error('Code completion error:', error);
      throw new Error('Failed to generate code completion');
    }
  }

  async analyzeCode(code, language) {
    try {
      const prompt = `Analyze this ${language} code for:
1. Potential bugs
2. Security vulnerabilities
3. Performance issues
4. Best practice violations
5. Suggestions for improvement

Code:
\`\`\`${language}
${code}
\`\`\`

Provide a detailed analysis with specific recommendations.`;

      const response = await this.generateResponse(prompt);
      return response;
    } catch (error) {
      console.error('Code analysis error:', error);
      throw new Error('Failed to analyze code');
    }
  }
}