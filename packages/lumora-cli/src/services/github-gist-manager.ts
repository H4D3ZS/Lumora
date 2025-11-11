/**
 * GitHub Gist Manager for Lumora
 * 
 * Provides Snack-like functionality using GitHub Gists for project sharing.
 * Enables creating, updating, forking, and loading Lumora projects via gists.
 */

import { GitHubClient } from './github-client';

export interface GistFile {
  filename: string;
  content: string;
  language?: string;
  type?: string;
}

export interface CreateGistOptions {
  description: string;
  files: GistFile[];
  public?: boolean;
}

export interface UpdateGistOptions {
  gistId: string;
  description?: string;
  files?: GistFile[];
}

export interface GistInfo {
  id: string;
  description: string;
  public: boolean;
  htmlUrl: string;
  owner: string;
  files: Map<string, GistFileInfo>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GistFileInfo {
  filename: string;
  type: string;
  language: string | null;
  rawUrl: string;
  size: number;
  content?: string;
}

export interface ForkGistResult {
  id: string;
  htmlUrl: string;
  owner: string;
}

export interface ShareableGistUrl {
  htmlUrl: string;
  rawUrl: string;
  embedUrl: string;
}

/**
 * GitHub Gist Manager
 * 
 * Implements Snack-like functionality for Lumora projects using GitHub Gists.
 * Allows developers to share projects without creating full repositories.
 */
export class GitHubGistManager {
  constructor(private client: GitHubClient) {}

  /**
   * Create a new gist for a Lumora project
   */
  async createGist(options: CreateGistOptions): Promise<GistInfo> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      // Convert files array to GitHub Gist format
      const files: Record<string, { content: string }> = {};
      options.files.forEach(file => {
        files[file.filename] = { content: file.content };
      });

      const response = await octokit.gists.create({
        description: options.description,
        public: options.public ?? true,
        files,
      });

      return this.mapGistInfo(response.data);
    } catch (error: any) {
      throw new Error(`Failed to create gist: ${error.message}`);
    }
  }

  /**
   * Update an existing gist
   */
  async updateGist(options: UpdateGistOptions): Promise<GistInfo> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      // Convert files array to GitHub Gist format if provided
      let files: Record<string, { content: string }> | undefined;
      if (options.files) {
        files = {};
        options.files.forEach(file => {
          files![file.filename] = { content: file.content };
        });
      }

      const response = await octokit.gists.update({
        gist_id: options.gistId,
        description: options.description,
        files,
      });

      return this.mapGistInfo(response.data);
    } catch (error: any) {
      throw new Error(`Failed to update gist: ${error.message}`);
    }
  }

  /**
   * Get gist information
   */
  async getGist(gistId: string): Promise<GistInfo> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      const response = await octokit.gists.get({
        gist_id: gistId,
      });

      return this.mapGistInfo(response.data);
    } catch (error: any) {
      throw new Error(`Failed to get gist: ${error.message}`);
    }
  }

  /**
   * Fork an existing gist
   */
  async forkGist(gistId: string): Promise<ForkGistResult> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      const response = await octokit.gists.fork({
        gist_id: gistId,
      });

      return {
        id: response.data.id || '',
        htmlUrl: response.data.html_url || '',
        owner: response.data.owner?.login || '',
      };
    } catch (error: any) {
      throw new Error(`Failed to fork gist: ${error.message}`);
    }
  }

  /**
   * Delete a gist
   */
  async deleteGist(gistId: string): Promise<void> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      await octokit.gists.delete({
        gist_id: gistId,
      });
    } catch (error: any) {
      throw new Error(`Failed to delete gist: ${error.message}`);
    }
  }

  /**
   * List gists for the authenticated user
   */
  async listGists(options?: { perPage?: number; page?: number }): Promise<GistInfo[]> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      const response = await octokit.gists.list({
        per_page: options?.perPage ?? 30,
        page: options?.page ?? 1,
      });

      return response.data.map(gist => this.mapGistInfo(gist));
    } catch (error: any) {
      throw new Error(`Failed to list gists: ${error.message}`);
    }
  }

  /**
   * Generate shareable URLs for a gist
   */
  generateShareableUrls(gistId: string): ShareableGistUrl {
    return {
      htmlUrl: `https://gist.github.com/${gistId}`,
      rawUrl: `https://gist.githubusercontent.com/${gistId}/raw`,
      embedUrl: `https://gist.github.com/${gistId}.js`,
    };
  }

  /**
   * Extract gist ID from various URL formats
   */
  extractGistId(url: string): string | null {
    // Support various gist URL formats:
    // - https://gist.github.com/username/gistId
    // - https://gist.github.com/gistId
    // - gistId (raw ID)
    
    const patterns = [
      /gist\.github\.com\/[^\/]+\/([a-f0-9]+)/i,
      /gist\.github\.com\/([a-f0-9]+)/i,
      /^([a-f0-9]+)$/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Check if a gist exists
   */
  async gistExists(gistId: string): Promise<boolean> {
    try {
      await this.getGist(gistId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file content from a gist
   */
  async getGistFile(gistId: string, filename: string): Promise<string> {
    try {
      const gist = await this.getGist(gistId);
      const file = gist.files.get(filename);

      if (!file) {
        throw new Error(`File ${filename} not found in gist`);
      }

      if (file.content) {
        return file.content;
      }

      // If content is not included, fetch from raw URL
      const response = await fetch(file.rawUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.statusText}`);
      }

      return await response.text();
    } catch (error: any) {
      throw new Error(`Failed to get gist file: ${error.message}`);
    }
  }

  /**
   * Create a Lumora project gist with standard structure
   */
  async createProjectGist(
    projectName: string,
    files: { path: string; content: string }[],
    description?: string
  ): Promise<GistInfo> {
    const gistFiles: GistFile[] = files.map(file => ({
      filename: file.path,
      content: file.content,
    }));

    // Add a README if not present
    const hasReadme = files.some(f => 
      f.path.toLowerCase() === 'readme.md' || f.path.toLowerCase() === 'readme.txt'
    );

    if (!hasReadme) {
      gistFiles.push({
        filename: 'README.md',
        content: `# ${projectName}\n\nLumora project shared via GitHub Gist.\n\n## Usage\n\nLoad this project using Lumora CLI:\n\`\`\`bash\nlumora load-gist <gist-id>\n\`\`\``,
      });
    }

    return this.createGist({
      description: description || `Lumora Project: ${projectName}`,
      files: gistFiles,
      public: true,
    });
  }

  /**
   * Map GitHub API gist data to GistInfo
   */
  private mapGistInfo(data: any): GistInfo {
    const files = new Map<string, GistFileInfo>();

    if (data.files) {
      Object.entries(data.files).forEach(([filename, fileData]: [string, any]) => {
        files.set(filename, {
          filename,
          type: fileData.type,
          language: fileData.language,
          rawUrl: fileData.raw_url,
          size: fileData.size,
          content: fileData.content,
        });
      });
    }

    return {
      id: data.id,
      description: data.description || '',
      public: data.public,
      htmlUrl: data.html_url,
      owner: data.owner?.login || 'anonymous',
      files,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

/**
 * Create a GitHub gist manager
 */
export function createGitHubGistManager(client: GitHubClient): GitHubGistManager {
  return new GitHubGistManager(client);
}
