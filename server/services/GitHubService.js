import axios from 'axios';

export class GitHubService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.token = null;
  }

  initialize(token) {
    this.token = token;
  }

  async syncProject(projectId, repoUrl, token) {
    try {
      this.initialize(token);
      
      const [owner, repo] = this.parseRepoUrl(repoUrl);
      
      // Get repository info
      const repoResponse = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: { Authorization: `token ${this.token}` }
      });

      // Get repository contents
      const contentsResponse = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/contents`, {
        headers: { Authorization: `token ${this.token}` }
      });

      // Get recent commits
      const commitsResponse = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/commits?per_page=10`, {
        headers: { Authorization: `token ${this.token}` }
      });

      return {
        repository: repoResponse.data,
        contents: contentsResponse.data,
        commits: commitsResponse.data,
        syncedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('GitHub sync error:', error.response?.data || error.message);
      throw new Error('Failed to sync with GitHub');
    }
  }

  async createRepository(name, description, isPrivate = false, token) {
    try {
      this.initialize(token);
      
      const response = await axios.post(`${this.baseUrl}/user/repos`, {
        name,
        description,
        private: isPrivate,
        auto_init: true,
      }, {
        headers: { Authorization: `token ${this.token}` }
      });

      return response.data;
    } catch (error) {
      console.error('GitHub create repo error:', error.response?.data || error.message);
      throw new Error('Failed to create repository');
    }
  }

  async getFileContent(owner, repo, path, token) {
    try {
      this.initialize(token);
      
      const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `token ${this.token}` }
      });

      if (response.data.type === 'file') {
        return {
          content: Buffer.from(response.data.content, 'base64').toString('utf8'),
          sha: response.data.sha,
          path: response.data.path,
        };
      }

      return null;
    } catch (error) {
      console.error('GitHub get file error:', error.response?.data || error.message);
      throw new Error('Failed to get file content');
    }
  }

  parseRepoUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return [match[1], match[2].replace('.git', '')];
  }
}