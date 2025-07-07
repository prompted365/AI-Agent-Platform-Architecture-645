// Updated ConversationService to work with Railway PostgreSQL API
class ConversationService {
  constructor() {
    this.baseUrl = '/api'; // Use relative URLs for same-origin requests
  }

  // Organizations
  async getOrganizations() {
    const response = await fetch(`${this.baseUrl}/organizations`);
    if (!response.ok) throw new Error('Failed to fetch organizations');
    return response.json();
  }

  // Conversations
  async createConversation(data) {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create conversation');
    return response.json();
  }

  async getConversations(organizationId, folderId = null) {
    const params = new URLSearchParams({ organizationId });
    if (folderId) params.append('folderId', folderId);
    
    const response = await fetch(`${this.baseUrl}/conversations?${params}`);
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  }

  async getConversation(id) {
    const response = await fetch(`${this.baseUrl}/conversations/${id}`);
    if (!response.ok) throw new Error('Failed to fetch conversation');
    return response.json();
  }

  async updateConversation(id, updates) {
    const response = await fetch(`${this.baseUrl}/conversations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update conversation');
    return response.json();
  }

  // Messages
  async addMessage(conversationId, content, role = 'user') {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        content,
        role,
      }),
    });
    if (!response.ok) throw new Error('Failed to add message');
    return response.json();
  }

  async getMessages(conversationId) {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  }

  // Artifacts
  async createArtifact(data) {
    const response = await fetch(`${this.baseUrl}/artifacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create artifact');
    return response.json();
  }

  async updateArtifact(id, updates) {
    const response = await fetch(`${this.baseUrl}/artifacts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update artifact');
    return response.json();
  }

  async getArtifacts(conversationId) {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/artifacts`);
    if (!response.ok) throw new Error('Failed to fetch artifacts');
    return response.json();
  }

  async getArtifactVersions(artifactId) {
    const response = await fetch(`${this.baseUrl}/artifacts/${artifactId}/versions`);
    if (!response.ok) throw new Error('Failed to fetch artifact versions');
    return response.json();
  }

  // Folders
  async createFolder(data) {
    const response = await fetch(`${this.baseUrl}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create folder');
    return response.json();
  }

  async getFolders(organizationId) {
    const response = await fetch(`${this.baseUrl}/folders?organizationId=${organizationId}`);
    if (!response.ok) throw new Error('Failed to fetch folders');
    return response.json();
  }

  // Sharing
  async shareConversation(conversationId, permissions = {}) {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permissions }),
    });
    if (!response.ok) throw new Error('Failed to share conversation');
    return response.json();
  }

  async getSharedConversation(shareToken) {
    const response = await fetch(`${this.baseUrl}/shared/${shareToken}`);
    if (!response.ok) throw new Error('Failed to fetch shared conversation');
    return response.json();
  }

  // Activity Logging
  async logActivity(organizationId, action, resourceType, resourceId, metadata = {}) {
    try {
      await fetch(`${this.baseUrl}/activity-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          action,
          resourceType,
          resourceId,
          metadata,
        }),
      });
    } catch (error) {
      console.error('Activity log error:', error);
    }
  }

  async getActivityLogs(organizationId, limit = 50) {
    const response = await fetch(`${this.baseUrl}/activity-logs?organizationId=${organizationId}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch activity logs');
    return response.json();
  }
}

export default new ConversationService();