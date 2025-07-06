# Swarm Agents - Multi-Agent Coordination Platform

A comprehensive platform for creating, managing, and coordinating swarms of AI agents that work together to accomplish complex tasks through real-time communication and coordination.

## 🚀 Quick Start & API Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Requesty API Key (Required)
- Redis (optional, for distributed event bus)

### 1. Get Your Requesty API Key
1. Sign up at [Requesty.ai](https://requesty.ai)
2. Get your API key from the dashboard
3. Add it to your environment variables

### 2. Installation
```bash
git clone <repository-url>
cd swarm-agents
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env and add your REQUESTY_API_KEY
```

### 4. Start Development
```bash
npm run dev
```

### 5. Test API Connection
- Go to Chat Interface
- Click "Test API" button
- Verify connection works

## 🔧 API Configuration

### Requesty API Integration
The platform uses Requesty.ai for LLM access with 150+ models:

**Endpoint:** `https://router.requesty.ai/v1/chat/completions`

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Format:**
```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "System prompt"
    },
    {
      "role": "user", 
      "content": "User message"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 4000
}
```

## 🤖 AI-Powered Features

### 1. **Conversation AI**
- Real-time chat with AI assistants
- Context-aware responses
- Message history and threading
- Multi-turn conversations

### 2. **Code Assistant**
- Code generation and completion
- Code review and analysis
- Debugging assistance
- Best practices suggestions

### 3. **Agent Swarms**
- Coordinate multiple AI agents
- Task distribution and execution
- Inter-agent communication
- Swarm intelligence

### 4. **Artifact Generation**
- Generate code components
- Create web applications
- Build documents and content
- Version control and collaboration

## 🔍 Troubleshooting API Issues

### Common Issues:

1. **"Invalid API key" Error**
   - Verify your Requesty API key in `.env`
   - Check if key has proper permissions
   - Ensure no extra spaces in the key

2. **"Connection timeout" Error**
   - Check network connectivity
   - Verify API endpoint is accessible
   - Try different model (e.g., `openai/gpt-3.5-turbo`)

3. **"Rate limit exceeded" Error**
   - Wait before retrying
   - Check your Requesty plan limits
   - Implement proper rate limiting

### Debug Steps:

1. **Test API Connection**
   ```bash
   curl -X POST https://router.requesty.ai/v1/chat/completions \
     -H "Authorization: Bearer YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
   ```

2. **Check Server Logs**
   ```bash
   npm run dev:server
   # Look for LLM service logs
   ```

3. **Use Health Check**
   - Visit: `http://localhost:3001/health`
   - Check service status

4. **Test Endpoint**
   - Visit: `http://localhost:3001/api/llm/test`
   - Direct API test

## 📊 Available Models

Requesty provides access to 150+ models including:

- **OpenAI**: `openai/gpt-4o`, `openai/gpt-4o-mini`, `openai/gpt-3.5-turbo`
- **Anthropic**: `anthropic/claude-3-opus`, `anthropic/claude-3-sonnet`
- **Google**: `google/gemini-pro`, `google/palm-2`
- **Meta**: `meta/llama-2-70b`, `meta/code-llama`
- **Mistral**: `mistral/mistral-7b`, `mistral/codestral`

## 🛠 Development Features

### Real-time Features
- WebSocket connections for live updates
- Real-time agent coordination
- Live conversation updates
- Event-driven architecture

### Database Integration
- Supabase for data persistence
- Row-level security (RLS)
- Real-time subscriptions
- Organizational multi-tenancy

### Code Execution
- Sandboxed code execution
- Multiple language support
- Live preview for web apps
- Security isolation

## 🔐 Security Features

- JWT-based authentication
- Row-level security policies
- Rate limiting and throttling
- Input sanitization
- CORS protection
- Helmet security headers

## 🚀 Deployment

### Railway Deployment
```bash
npm run deploy
```

### Environment Variables for Production
```
NODE_ENV=production
REQUESTY_API_KEY=your_production_key
DATABASE_URL=your_supabase_url
REDIS_URL=your_redis_url
```

## 📝 API Endpoints

### Chat & AI
- `POST /api/llm/test` - Test LLM connection
- `POST /api/artifacts/generate` - Generate artifacts

### Swarms
- `GET /api/swarms` - List swarms
- `POST /api/swarms` - Create swarm
- `POST /api/swarms/:id/tasks` - Submit task

### Agents
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent

### Code Execution
- `POST /api/sandbox/execute` - Execute code

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your Requesty API key to test
4. Make your changes
5. Test the LLM integration
6. Submit a pull request

## 📞 Support

For API issues:
1. Check your Requesty API key
2. Review the server logs
3. Test the health endpoint
4. Contact support if needed

---

**Note**: Make sure to keep your Requesty API key secure and never commit it to version control!