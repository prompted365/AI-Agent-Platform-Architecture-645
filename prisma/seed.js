import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@swarm-agents.ai' },
    update: {},
    create: {
      id: 'default-admin',
      email: 'admin@swarm-agents.ai',
      name: 'Admin User'
    }
  });

  // Create default organization
  const defaultOrg = await prisma.organization.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Default Organization',
      description: 'Default organization for Swarm Agents'
    }
  });

  // Create organization membership
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: 'default-org',
        userId: 'default-admin'
      }
    },
    update: {},
    create: {
      id: 'default-membership',
      organizationId: 'default-org',
      userId: 'default-admin',
      role: 'admin'
    }
  });

  // Create sample swarms
  const sampleSwarm = await prisma.swarm.upsert({
    where: { id: 'sample-swarm' },
    update: {},
    create: {
      id: 'sample-swarm',
      name: 'Development Swarm',
      description: 'A sample swarm for development and testing',
      status: 'active',
      agentCount: 3,
      owner: 'default-admin',
      sharedMemory: {
        purpose: 'Development and testing tasks',
        guidelines: ['Focus on code quality', 'Collaborate effectively', 'Document progress']
      }
    }
  });

  // Create sample agents
  const agents = [
    {
      id: 'agent-coordinator',
      name: 'Coordinator Agent',
      type: 'coordinator',
      role: 'coordinator',
      capabilities: ['task_distribution', 'coordination', 'planning'],
      swarmId: 'sample-swarm'
    },
    {
      id: 'agent-coder',
      name: 'Coder Agent',
      type: 'worker',
      role: 'coder',
      capabilities: ['code_generation', 'debugging', 'refactoring'],
      swarmId: 'sample-swarm'
    },
    {
      id: 'agent-reviewer',
      name: 'Reviewer Agent',
      type: 'specialist',
      role: 'reviewer',
      capabilities: ['code_review', 'testing', 'quality_assurance'],
      swarmId: 'sample-swarm'
    }
  ];

  for (const agentData of agents) {
    await prisma.agent.upsert({
      where: { id: agentData.id },
      update: {},
      create: agentData
    });
  }

  // Create sample conversation
  const sampleConversation = await prisma.conversation.upsert({
    where: { id: 'sample-conversation' },
    update: {},
    create: {
      id: 'sample-conversation',
      title: 'Welcome to Swarm Agents',
      organizationId: 'default-org',
      userId: 'default-admin'
    }
  });

  // Create welcome message
  await prisma.message.upsert({
    where: { id: 'welcome-message' },
    update: {},
    create: {
      id: 'welcome-message',
      conversationId: 'sample-conversation',
      userId: 'default-admin',
      role: 'assistant',
      content: 'Welcome to Swarm Agents! This is a powerful platform for coordinating AI agents. You can create swarms, assign tasks, and watch as multiple AI agents work together to accomplish complex goals. Try creating a new conversation or exploring the agent swarms!'
    }
  });

  // Create sample project
  await prisma.project.upsert({
    where: { id: 'sample-project' },
    update: {},
    create: {
      id: 'sample-project',
      name: 'Sample React App',
      description: 'A sample React application for testing',
      template: 'react'
    }
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });