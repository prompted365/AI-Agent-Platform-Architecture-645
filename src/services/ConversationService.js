import supabase from '../lib/supabase';

export class ConversationService {
  // Organizations
  async createOrganization(data) {
    const { data: org, error } = await supabase
      .from('organizations_swarm_2024')
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return org;
  }

  async getOrganizations() {
    const { data, error } = await supabase
      .from('organizations_swarm_2024')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getOrganizationMembers(orgId) {
    const { data, error } = await supabase
      .from('organization_members_swarm_2024')
      .select('*, user:user_id(*)')
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async addOrganizationMember(orgId, userId, role = 'user') {
    const { data, error } = await supabase
      .from('organization_members_swarm_2024')
      .insert([{
        organization_id: orgId,
        user_id: userId,
        role,
        invited_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Folders
  async createFolder(data) {
    const user = await supabase.auth.getUser();
    const { data: folder, error } = await supabase
      .from('folders_swarm_2024')
      .insert([{
        ...data,
        user_id: user.data.user?.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return folder;
  }

  async getFolders(organizationId) {
    const { data, error } = await supabase
      .from('folders_swarm_2024')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async updateFolder(id, updates) {
    const { data, error } = await supabase
      .from('folders_swarm_2024')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteFolder(id) {
    const { error } = await supabase
      .from('folders_swarm_2024')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Conversations
  async createConversation(data) {
    const user = await supabase.auth.getUser();
    const { data: conversation, error } = await supabase
      .from('conversations_swarm_2024')
      .insert([{
        ...data,
        user_id: user.data.user?.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return conversation;
  }

  async getConversations(organizationId, folderId = null) {
    let query = supabase
      .from('conversations_swarm_2024')
      .select(`
        *,
        folder:folder_id(name, color),
        messages:messages_swarm_2024(count)
      `)
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.is('folder_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getConversation(id) {
    const { data, error } = await supabase
      .from('conversations_swarm_2024')
      .select(`
        *,
        folder:folder_id(name, color),
        messages:messages_swarm_2024(*),
        artifacts:artifacts_swarm_2024(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateConversation(id, updates) {
    const { data, error } = await supabase
      .from('conversations_swarm_2024')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteConversation(id) {
    const { error } = await supabase
      .from('conversations_swarm_2024')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Messages
  async addMessage(conversationId, content, role = 'user') {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('messages_swarm_2024')
      .insert([{
        conversation_id: conversationId,
        user_id: user.data.user?.id,
        role,
        content
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Update conversation timestamp
    await this.updateConversation(conversationId, {});
    
    return data;
  }

  async getMessages(conversationId) {
    const { data, error } = await supabase
      .from('messages_swarm_2024')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Artifacts
  async createArtifact(data) {
    const user = await supabase.auth.getUser();
    const { data: artifact, error } = await supabase
      .from('artifacts_swarm_2024')
      .insert([{
        ...data,
        user_id: user.data.user?.id
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Create initial version
    await this.createArtifactVersion(artifact.id, data.content, data.metadata);
    
    return artifact;
  }

  async updateArtifact(id, updates) {
    const { data: artifact, error } = await supabase
      .from('artifacts_swarm_2024')
      .update({ 
        ...updates, 
        version: supabase.sql`version + 1`,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    // Create new version
    if (updates.content) {
      await this.createArtifactVersion(id, updates.content, updates.metadata);
    }
    
    return artifact;
  }

  async createArtifactVersion(artifactId, content, metadata = {}) {
    const user = await supabase.auth.getUser();
    const { data: artifact } = await supabase
      .from('artifacts_swarm_2024')
      .select('version')
      .eq('id', artifactId)
      .single();

    const { data, error } = await supabase
      .from('artifact_versions_swarm_2024')
      .insert([{
        artifact_id: artifactId,
        version: artifact.version,
        content,
        metadata,
        created_by: user.data.user?.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getArtifactVersions(artifactId) {
    const { data, error } = await supabase
      .from('artifact_versions_swarm_2024')
      .select('*')
      .eq('artifact_id', artifactId)
      .order('version', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getArtifacts(conversationId) {
    const { data, error } = await supabase
      .from('artifacts_swarm_2024')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Sharing
  async shareConversation(conversationId, permissions = {}) {
    const user = await supabase.auth.getUser();
    const shareToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    const { data, error } = await supabase
      .from('shared_conversations_swarm_2024')
      .insert([{
        conversation_id: conversationId,
        share_token: shareToken,
        created_by: user.data.user?.id,
        permissions
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getSharedConversation(shareToken) {
    const { data, error } = await supabase
      .from('shared_conversations_swarm_2024')
      .select(`
        *,
        conversation:conversation_id(
          *,
          messages:messages_swarm_2024(*),
          artifacts:artifacts_swarm_2024(*)
        )
      `)
      .eq('share_token', shareToken)
      .single();
    
    if (error) throw error;

    // Increment access count
    await supabase
      .from('shared_conversations_swarm_2024')
      .update({ access_count: supabase.sql`access_count + 1` })
      .eq('share_token', shareToken);
    
    return data;
  }

  // Comments
  async addComment(data) {
    const user = await supabase.auth.getUser();
    const { data: comment, error } = await supabase
      .from('comments_swarm_2024')
      .insert([{
        ...data,
        user_id: user.data.user?.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return comment;
  }

  async getComments(conversationId = null, artifactId = null) {
    let query = supabase
      .from('comments_swarm_2024')
      .select('*, user:user_id(*)')
      .order('created_at', { ascending: true });

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }
    if (artifactId) {
      query = query.eq('artifact_id', artifactId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Activity Logging
  async logActivity(organizationId, action, resourceType, resourceId, metadata = {}) {
    const user = await supabase.auth.getUser();
    const { error } = await supabase
      .from('activity_logs_swarm_2024')
      .insert([{
        organization_id: organizationId,
        user_id: user.data.user?.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata
      }]);
    
    if (error) console.error('Activity log error:', error);
  }

  async getActivityLogs(organizationId, limit = 50) {
    const { data, error } = await supabase
      .from('activity_logs_swarm_2024')
      .select('*, user:user_id(*)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
}

export default new ConversationService();