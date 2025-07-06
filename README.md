# Swarm Agents - Multi-Agent Coordination Platform

A comprehensive platform for creating, managing, and coordinating swarms of AI agents that work together to accomplish complex tasks through real-time communication and coordination.

## Features

### 🤖 Multi-Agent Swarm Architecture
- **Swarm Creation**: Create swarms with specialized agent roles
- **Agent Coordination**: Agents communicate and coordinate via event bus
- **Task Distribution**: Intelligent task assignment based on agent capabilities
- **Shared Memory**: Synchronized shared state across agents
- **Real-Time Events**: Event-driven architecture for responsive coordination

### 🔄 Event Bus System
- **Distributed Events**: Real-time event propagation across agents
- **Redis Integration**: Optional Redis-backed event bus for distributed deployment
- **Event Filtering**: Subscribe to specific event types
- **Persistent Events**: Event history for analysis and debugging
- **Broadcast Capabilities**: Send messages to entire swarms

### 👥 Agent Types and Roles
- **Coordinator Agents**: Manage task distribution and coordination
- **Worker Agents**: Execute specialized tasks
- **Research Agents**: Gather and analyze information
- **Coding Agents**: Generate and review code
- **Testing Agents**: Validate and test solutions

### 🧠 Agent Capabilities
- **Code Generation**: AI-powered code generation across multiple languages
- **Code Review**: Automated code analysis and suggestions
- **Research**: Information gathering and analysis
- **Task Decomposition**: Breaking down complex tasks into subtasks
- **Memory Management**: Storing and retrieving relevant context

### 🌐 Visualization and Monitoring
- **Swarm Dashboard**: Real-time view of swarm activity
- **Agent Status**: Monitor individual agent status and performance
- **Task Tracking**: Track task progress and results
- **Event Stream**: Live event stream visualization
- **Metrics**: Performance metrics and analytics

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Redis (optional, for distributed event bus)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd swarm-agents
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173` with the backend at `http://localhost:3001`.

## Creating Your First Swarm

1. Navigate to the Swarms dashboard
2. Click "New Swarm"
3. Configure your swarm:
   - Name and purpose
   - Number of agents
   - Agent roles (coordinator, coder, researcher, etc.)
4. Create the swarm
5. Submit tasks for the swarm to complete
6. Monitor progress in real-time

## Architecture

### Event-Driven Communication

Swarm Agents uses an event-driven architecture to enable real-time communication between agents:

```
┌────────────┐     ┌─────────────┐     ┌────────────┐
│ Agent A    │◄───►│ Event Bus   │◄───►│ Agent B    │
└────────────┘     └─────────────┘     └────────────┘
       ▲                  ▲                  ▲
       │                  │                  │
       ▼                  ▼                  ▼
┌────────────┐     ┌─────────────┐     ┌────────────┐
│ Task Queue │     │ Shared      │     │ External   │
│            │     │ Memory      │     │ Services   │
└────────────┘     └─────────────┘     └────────────┘
```

### Key Components

1. **SwarmService**: Manages swarm creation, task assignment, and coordination
2. **SwarmEventBus**: Handles real-time event distribution
3. **AgentService**: Creates and manages individual agents
4. **RedisIntegration**: Optional distributed event bus with Redis

## Development

### Project Structure

```
├── server/              # Backend server
│   ├── index.js         # Server entry point
│   └── services/        # Backend services
│       ├── AgentService.js
│       ├── SwarmService.js
│       └── SwarmEventBus.js
├── src/                 # Frontend React application
│   ├── components/      # React components
│   │   ├── SwarmBoard.jsx
│   │   └── ...
│   ├── context/         # React context providers
│   └── ...
└── ...
```

### Key Technologies

- **Backend**: Node.js, Express, Socket.IO, Redis
- **Frontend**: React, Framer Motion, Tailwind CSS
- **Communication**: WebSockets, Event Bus pattern
- **State Management**: React Context API

## Advanced Usage

### Custom Agent Types

Create specialized agents by defining custom capabilities:

```javascript
const customAgent = await swarmService.createAgent({
  name: "Specialized Agent",
  swarmId: "your-swarm-id",
  capabilities: ["custom_capability_1", "custom_capability_2"],
  role: "specialized",
  type: "custom"
});
```

### Complex Task Workflows

Create dependent tasks for complex workflows:

```javascript
const task1 = await swarmService.submitTask({
  swarmId: "your-swarm-id",
  type: "research",
  description: "Research topic X"
});

const task2 = await swarmService.submitTask({
  swarmId: "your-swarm-id",
  type: "analysis",
  description: "Analyze research findings",
  dependencies: [task1.id]  // Will only start when task1 is complete
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using Node.js, React, and modern AI technologies