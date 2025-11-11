/**
 * GitHub Repository Operations for Lumora
 * 
 * Provides repository management operations including creation, updates,
 * content retrieval, and file commits.
 */

import { GitHubClient } from './github-client';

export interface CreateRepositoryOptions {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
  gitignoreTemplate?: string;
  licenseTemplate?: string;
}

export interface RepositoryInfo {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepositoryContent {
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  htmlUrl: string;
  downloadUrl: string | null;
  content?: string; // Base64 encoded for files
}

export interface CommitFileOptions {
  owner: string;
  repo: string;
  path: string;
  message: string;
  content: string; // Will be base64 encoded
  branch?: string;
  sha?: string; // Required for updates
}

export interface CommitResult {
  sha: string;
  url: string;
  message: string;
}

/**
 * GitHub Repository Manager
 * 
 * Handles all repository-related operations for Lumora projects.
 */
export class GitHubRepository {
  constructor(private client: GitHubClient) {}

  /**
   * Create a new GitHub repository
   */
  async createRepository(options: CreateRepositoryOptions): Promise<RepositoryInfo> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();
      const response = await octokit.repos.createForAuthenticatedUser({
        name: options.name,
        description: options.description,
        private: options.private ?? false,
        auto_init: options.autoInit ?? true,
        gitignore_template: options.gitignoreTemplate,
        license_template: options.licenseTemplate,
      });

      return this.mapRepositoryInfo(response.data);
    } catch (error: any) {
      throw new Error(`Failed to create repository: ${error.message}`);
    }
  }

  /**
   * Update repository settings
   */
  async updateRepository(
    owner: string,
    repo: string,
    updates: {
      name?: string;
      description?: string;
      private?: boolean;
      defaultBranch?: string;
    }
  ): Promise<RepositoryInfo> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();
      const response = await octokit.repos.update({
        owner,
        repo,
        name: updates.name,
        description: updates.description,
        private: updates.private,
        default_branch: updates.defaultBranch,
      });

      return this.mapRepositoryInfo(response.data);
    } catch (error: any) {
      throw new Error(`Failed to update repository: ${error.message}`);
    }
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<RepositoryInfo> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();
      const response = await octokit.repos.get({
        owner,
        repo,
      });

      return this.mapRepositoryInfo(response.data);
    } catch (error: any) {
      throw new Error(`Failed to get repository: ${error.message}`);
    }
  }

  /**
   * Check if repository exists
   */
  async repositoryExists(owner: string, repo: string): Promise<boolean> {
    try {
      await this.getRepository(owner, repo);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get repository contents (file or directory)
   */
  async getContents(
    owner: string,
    repo: string,
    path: string = '',
    ref?: string
  ): Promise<RepositoryContent | RepositoryContent[]> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if (Array.isArray(response.data)) {
        return response.data.map(this.mapRepositoryContent);
      }

      return this.mapRepositoryContent(response.data);
    } catch (error: any) {
      throw new Error(`Failed to get repository contents: ${error.message}`);
    }
  }

  /**
   * Get file content as string
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<{ content: string; sha: string }> {
    try {
      const result = await this.getContents(owner, repo, path, ref);

      if (Array.isArray(result)) {
        throw new Error(`Path ${path} is a directory, not a file`);
      }

      if (result.type !== 'file') {
        throw new Error(`Path ${path} is not a file`);
      }

      if (!result.content) {
        throw new Error(`No content available for ${path}`);
      }

      // Decode base64 content
      const content = Buffer.from(result.content, 'base64').toString('utf-8');

      return {
        content,
        sha: result.sha,
      };
    } catch (error: any) {
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  /**
   * Commit a file to the repository (create or update)
   */
  async commitFile(options: CommitFileOptions): Promise<CommitResult> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      // Encode content to base64
      const contentEncoded = Buffer.from(options.content).toString('base64');

      const response = await octokit.repos.createOrUpdateFileContents({
        owner: options.owner,
        repo: options.repo,
        path: options.path,
        message: options.message,
        content: contentEncoded,
        branch: options.branch,
        sha: options.sha,
      });

      return {
        sha: response.data.commit.sha || '',
        url: response.data.commit.html_url || '',
        message: options.message,
      };
    } catch (error: any) {
      throw new Error(`Failed to commit file: ${error.message}`);
    }
  }

  /**
   * Commit multiple files in a single commit
   */
  async commitFiles(
    owner: string,
    repo: string,
    branch: string,
    message: string,
    files: Array<{ path: string; content: string }>
  ): Promise<CommitResult> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      // Get the current commit SHA
      const { data: refData } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      const currentCommitSha = refData.object.sha;

      // Get the tree SHA of the current commit
      const { data: commitData } = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: currentCommitSha,
      });
      const currentTreeSha = commitData.tree.sha;

      // Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blobData } = await octokit.git.createBlob({
            owner,
            repo,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blobData.sha,
          };
        })
      );

      // Create a new tree
      const { data: treeData } = await octokit.git.createTree({
        owner,
        repo,
        base_tree: currentTreeSha,
        tree: blobs,
      });

      // Create a new commit
      const { data: newCommitData } = await octokit.git.createCommit({
        owner,
        repo,
        message,
        tree: treeData.sha,
        parents: [currentCommitSha],
      });

      // Update the reference
      await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommitData.sha,
      });

      return {
        sha: newCommitData.sha,
        url: newCommitData.html_url,
        message,
      };
    } catch (error: any) {
      throw new Error(`Failed to commit files: ${error.message}`);
    }
  }

  /**
   * Delete a file from the repository
   */
  async deleteFile(
    owner: string,
    repo: string,
    path: string,
    message: string,
    sha: string,
    branch?: string
  ): Promise<CommitResult> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      const response = await octokit.repos.deleteFile({
        owner,
        repo,
        path,
        message,
        sha,
        branch,
      });

      return {
        sha: response.data.commit.sha || '',
        url: response.data.commit.html_url || '',
        message,
      };
    } catch (error: any) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * List branches in the repository
   */
  async listBranches(owner: string, repo: string): Promise<string[]> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();
      const response = await octokit.repos.listBranches({
        owner,
        repo,
      });

      return response.data.map((branch) => branch.name);
    } catch (error: any) {
      throw new Error(`Failed to list branches: ${error.message}`);
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromBranch: string = 'main'
  ): Promise<void> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      // Get the SHA of the source branch
      const { data: refData } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${fromBranch}`,
      });

      // Create the new branch
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      });
    } catch (error: any) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Map GitHub API repository data to RepositoryInfo
   */
  private mapRepositoryInfo(data: any): RepositoryInfo {
    return {
      owner: data.owner.login,
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      private: data.private,
      htmlUrl: data.html_url,
      cloneUrl: data.clone_url,
      defaultBranch: data.default_branch,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Map GitHub API content data to RepositoryContent
   */
  private mapRepositoryContent(data: any): RepositoryContent {
    return {
      type: data.type,
      name: data.name,
      path: data.path,
      sha: data.sha,
      size: data.size,
      url: data.url,
      htmlUrl: data.html_url,
      downloadUrl: data.download_url,
      content: data.content,
    };
  }
}

/**
 * Create a GitHub repository manager
 */
export function createGitHubRepository(client: GitHubClient): GitHubRepository {
  return new GitHubRepository(client);
}
