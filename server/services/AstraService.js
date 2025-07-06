import axios from 'axios';

export class AstraService {
  constructor() {
    this.astraDbId = process.env.ASTRA_DB_ID;
    this.astraDbRegion = process.env.ASTRA_DB_REGION;
    this.applicationToken = process.env.ASTRA_DB_TOKEN;
    
    this.baseUrl = `https://${this.astraDbId}-${this.astraDbRegion}.apps.astra.datastax.com/api/rest/v2`;
    this.headers = {
      'X-Cassandra-Token': this.applicationToken,
      'Content-Type': 'application/json'
    };
    
    this.projectsCollection = 'projects';
    this.messagesCollection = 'messages';
    this.agentsCollection = 'agents';
    this.codeCollection = 'code_snippets';
  }

  async initialize() {
    try {
      // Create collections if they don't exist
      await this.createCollectionIfNotExists(this.projectsCollection);
      await this.createCollectionIfNotExists(this.messagesCollection);
      await this.createCollectionIfNotExists(this.agentsCollection);
      await this.createCollectionIfNotExists(this.codeCollection);
      
      console.log('Astra DB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Astra DB:', error);
    }
  }

  async createCollectionIfNotExists(collectionName) {
    try {
      // Check if collection exists
      const response = await axios.get(
        `${this.baseUrl}/schemas/namespaces/default/collections`,
        { headers: this.headers }
      );
      
      const exists = response.data?.some(col => col.name === collectionName);
      
      if (!exists) {
        await axios.post(
          `${this.baseUrl}/schemas/namespaces/default/collections`,
          {
            name: collectionName,
            options: {
              vector: {
                dimension: 1536,
                metric: 'cosine'
              }
            }
          },
          { headers: this.headers }
        );
        console.log(`Created collection: ${collectionName}`);
      }
    } catch (error) {
      console.error(`Error creating collection ${collectionName}:`, error.response?.data || error.message);
    }
  }

  async storeMessage(message) {
    try {
      // Generate embedding for the message
      const embedding = await this.generateEmbedding(message.content);
      
      const document = {
        ...message,
        $vector: embedding,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(
        `${this.baseUrl}/namespaces/default/collections/${this.messagesCollection}`,
        document,
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      console.error('Error storing message:', error.response?.data || error.message);
      throw error;
    }
  }

  async searchMessages(query, limit = 10) {
    try {
      // Generate embedding for semantic search
      const embedding = await this.generateEmbedding(query);
      
      const response = await axios.post(
        `${this.baseUrl}/namespaces/default/collections/${this.messagesCollection}/find`,
        {
          sort: { $vector: embedding },
          options: {
            limit,
            includeSimilarity: true
          },
          filter: {
            $or: [
              { content: { $regex: query, $options: 'i' } },
              { response: { $regex: query, $options: 'i' } }
            ]
          }
        },
        { headers: this.headers }
      );

      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching messages:', error.response?.data || error.message);
      return [];
    }
  }

  async getProjects() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/namespaces/default/collections/${this.projectsCollection}`,
        { headers: this.headers }
      );
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching projects:', error.response?.data || error.message);
      return [];
    }
  }

  async createProject(project) {
    try {
      const document = {
        ...project,
        id: project.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await axios.post(
        `${this.baseUrl}/namespaces/default/collections/${this.projectsCollection}`,
        document,
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating project:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateProject(projectId, updates) {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/namespaces/default/collections/${this.projectsCollection}/${projectId}`,
        {
          ...updates,
          updatedAt: new Date().toISOString()
        },
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating project:', error.response?.data || error.message);
      throw error;
    }
  }

  async storeCodeSnippet(snippet) {
    try {
      const embedding = await this.generateEmbedding(snippet.code);
      
      const document = {
        ...snippet,
        $vector: embedding,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(
        `${this.baseUrl}/namespaces/default/collections/${this.codeCollection}`,
        document,
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      console.error('Error storing code snippet:', error.response?.data || error.message);
      throw error;
    }
  }

  async searchCodeSnippets(query, language = null, limit = 10) {
    try {
      const embedding = await this.generateEmbedding(query);
      
      const filter = language ? { language } : {};
      
      const response = await axios.post(
        `${this.baseUrl}/namespaces/default/collections/${this.codeCollection}/find`,
        {
          sort: { $vector: embedding },
          options: {
            limit,
            includeSimilarity: true
          },
          filter
        },
        { headers: this.headers }
      );

      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching code snippets:', error.response?.data || error.message);
      return [];
    }
  }

  async generateEmbedding(text) {
    try {
      // For demo purposes, generate a dummy embedding
      // In production, you would use OpenAI embeddings or similar
      const dimension = 1536;
      const embedding = new Array(dimension).fill(0).map(() => Math.random() - 0.5);
      
      // Normalize the embedding
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => val / magnitude);
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  async getAgents() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/namespaces/default/collections/${this.agentsCollection}`,
        { headers: this.headers }
      );
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching agents:', error.response?.data || error.message);
      return [];
    }
  }

  async createAgent(agent) {
    try {
      const document = {
        ...agent,
        id: agent.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'idle'
      };

      const response = await axios.post(
        `${this.baseUrl}/namespaces/default/collections/${this.agentsCollection}`,
        document,
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating agent:', error.response?.data || error.message);
      throw error;
    }
  }
}