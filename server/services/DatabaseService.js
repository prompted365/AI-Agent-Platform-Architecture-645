import { PrismaClient } from '@prisma/client';

export class DatabaseService {
  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    this.isSupabaseEnabled = false;
  }

  async initialize() {
    try {
      // Test database connection
      await this.prisma.$connect();
      console.log('✅ PostgreSQL database connected');

      // Check if Supabase should be enabled
      this.isSupabaseEnabled = !!(
        process.env.SUPABASE_URL && 
        process.env.SUPABASE_ANON_KEY && 
        process.env.ENABLE_SUPABASE !== 'false'
      );

      if (this.isSupabaseEnabled) {
        console.log('✅ Supabase integration enabled');
      } else {
        console.log('ℹ️  Using Railway PostgreSQL only (Supabase disabled)');
      }

      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  // User Management
  async createUser(userData) {
    return await this.prisma.user.create({
      data: userData
    });
  }

  async getUserByEmail(email) {
    return await this.prisma.user.findUnique({
      where: { email }
    });
  }

  async updateUser(id, updates) {
    return await this.prisma.user.update({
      where: { id },
      data: updates
    });
  }

  // Organization Management
  async getOrganizations(userId) {
    return await this.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async createOrganization(data, userId) {
    return await this.prisma.organization.create({
      data: {
        ...data,
        members: {
          create: {
            userId: userId,
            role: 'admin'
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });
  }

  // Conversation Management
  async createConversation(data) {
    return await this.prisma.conversation.create({
      data,
      include: {
        folder: true,
        organization: true
      }
    });
  }

  async getConversations(organizationId, folderId = null) {
    return await this.prisma.conversation.findMany({
      where: {
        organizationId,
        folderId: folderId
      },
      include: {
        folder: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getConversation(id) {
    return await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        folder: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        artifacts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async updateConversation(id, updates) {
    return await this.prisma.conversation.update({
      where: { id },
      data: updates
    });
  }

  // Message Management
  async createMessage(data) {
    return await this.prisma.message.create({
      data,
      include: {
        user: true
      }
    });
  }

  async getMessages(conversationId) {
    return await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        user: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  // Artifact Management
  async createArtifact(data) {
    const artifact = await this.prisma.artifact.create({
      data
    });

    // Create initial version
    await this.prisma.artifactVersion.create({
      data: {
        artifactId: artifact.id,
        version: 1,
        content: data.content,
        metadata: data.metadata || {},
        createdBy: data.userId
      }
    });

    return artifact;
  }

  async updateArtifact(id, updates) {
    const artifact = await this.prisma.artifact.update({
      where: { id },
      data: {
        ...updates,
        version: { increment: 1 }
      }
    });

    // Create new version if content changed
    if (updates.content) {
      await this.prisma.artifactVersion.create({
        data: {
          artifactId: id,
          version: artifact.version,
          content: updates.content,
          metadata: updates.metadata || {},
          createdBy: updates.userId || artifact.userId
        }
      });
    }

    return artifact;
  }

  async getArtifacts(conversationId) {
    return await this.prisma.artifact.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getArtifactVersions(artifactId) {
    return await this.prisma.artifactVersion.findMany({
      where: { artifactId },
      orderBy: { version: 'desc' },
      include: {
        createdByUser: true
      }
    });
  }

  // Folder Management
  async createFolder(data) {
    return await this.prisma.folder.create({
      data
    });
  }

  async getFolders(organizationId) {
    return await this.prisma.folder.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Swarm Management
  async createSwarm(data) {
    return await this.prisma.swarm.create({
      data
    });
  }

  async getSwarms() {
    return await this.prisma.swarm.findMany({
      include: {
        agents: true,
        tasks: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSwarm(id) {
    return await this.prisma.swarm.findUnique({
      where: { id },
      include: {
        agents: true,
        tasks: true
      }
    });
  }

  async updateSwarm(id, updates) {
    return await this.prisma.swarm.update({
      where: { id },
      data: updates
    });
  }

  // Agent Management
  async createAgent(data) {
    return await this.prisma.agent.create({
      data
    });
  }

  async getAgents(swarmId = null) {
    return await this.prisma.agent.findMany({
      where: swarmId ? { swarmId } : {},
      include: {
        swarm: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAgent(id) {
    return await this.prisma.agent.findUnique({
      where: { id },
      include: {
        swarm: true
      }
    });
  }

  async updateAgent(id, updates) {
    return await this.prisma.agent.update({
      where: { id },
      data: updates
    });
  }

  // Task Management
  async createTask(data) {
    return await this.prisma.task.create({
      data
    });
  }

  async getTasks(swarmId = null) {
    return await this.prisma.task.findMany({
      where: swarmId ? { swarmId } : {},
      include: {
        swarm: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateTask(id, updates) {
    return await this.prisma.task.update({
      where: { id },
      data: updates
    });
  }

  // Project Management
  async createProject(data) {
    return await this.prisma.project.create({
      data
    });
  }

  async getProjects() {
    return await this.prisma.project.findMany({
      include: {
        files: true,
        deployments: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  // Activity Logging
  async logActivity(organizationId, userId, action, resourceType, resourceId = null, metadata = {}) {
    try {
      await this.prisma.activityLog.create({
        data: {
          organizationId,
          userId,
          action,
          resourceType,
          resourceId,
          metadata
        }
      });
    } catch (error) {
      console.error('Activity log error:', error);
    }
  }

  async getActivityLogs(organizationId, limit = 50) {
    return await this.prisma.activityLog.findMany({
      where: { organizationId },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  // Sharing
  async shareConversation(conversationId, createdBy, permissions = {}) {
    const shareToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    return await this.prisma.sharedConversation.create({
      data: {
        conversationId,
        shareToken,
        permissions,
        createdBy
      }
    });
  }

  async getSharedConversation(shareToken) {
    const shared = await this.prisma.sharedConversation.findUnique({
      where: { shareToken },
      include: {
        conversation: {
          include: {
            messages: {
              include: {
                user: true
              },
              orderBy: { createdAt: 'asc' }
            },
            artifacts: true
          }
        }
      }
    });

    if (shared) {
      // Increment access count
      await this.prisma.sharedConversation.update({
        where: { shareToken },
        data: { accessCount: { increment: 1 } }
      });
    }

    return shared;
  }

  // Search and Analytics
  async searchMessages(query, organizationId, limit = 10) {
    // Basic text search - can be enhanced with full-text search or vector search
    return await this.prisma.message.findMany({
      where: {
        conversation: {
          organizationId
        },
        OR: [
          { content: { contains: query, mode: 'insensitive' } },
          { conversation: { title: { contains: query, mode: 'insensitive' } } }
        ]
      },
      include: {
        conversation: true,
        user: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  // Health check
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', database: 'postgresql' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}