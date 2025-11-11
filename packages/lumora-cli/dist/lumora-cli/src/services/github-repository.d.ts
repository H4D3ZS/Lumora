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
    content?: string;
}
export interface CommitFileOptions {
    owner: string;
    repo: string;
    path: string;
    message: string;
    content: string;
    branch?: string;
    sha?: string;
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
export declare class GitHubRepository {
    private client;
    constructor(client: GitHubClient);
    /**
     * Create a new GitHub repository
     */
    createRepository(options: CreateRepositoryOptions): Promise<RepositoryInfo>;
    /**
     * Update repository settings
     */
    updateRepository(owner: string, repo: string, updates: {
        name?: string;
        description?: string;
        private?: boolean;
        defaultBranch?: string;
    }): Promise<RepositoryInfo>;
    /**
     * Get repository information
     */
    getRepository(owner: string, repo: string): Promise<RepositoryInfo>;
    /**
     * Check if repository exists
     */
    repositoryExists(owner: string, repo: string): Promise<boolean>;
    /**
     * Get repository contents (file or directory)
     */
    getContents(owner: string, repo: string, path?: string, ref?: string): Promise<RepositoryContent | RepositoryContent[]>;
    /**
     * Get file content as string
     */
    getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<{
        content: string;
        sha: string;
    }>;
    /**
     * Commit a file to the repository (create or update)
     */
    commitFile(options: CommitFileOptions): Promise<CommitResult>;
    /**
     * Commit multiple files in a single commit
     */
    commitFiles(owner: string, repo: string, branch: string, message: string, files: Array<{
        path: string;
        content: string;
    }>): Promise<CommitResult>;
    /**
     * Delete a file from the repository
     */
    deleteFile(owner: string, repo: string, path: string, message: string, sha: string, branch?: string): Promise<CommitResult>;
    /**
     * List branches in the repository
     */
    listBranches(owner: string, repo: string): Promise<string[]>;
    /**
     * Create a new branch
     */
    createBranch(owner: string, repo: string, branchName: string, fromBranch?: string): Promise<void>;
    /**
     * Map GitHub API repository data to RepositoryInfo
     */
    private mapRepositoryInfo;
    /**
     * Map GitHub API content data to RepositoryContent
     */
    private mapRepositoryContent;
}
/**
 * Create a GitHub repository manager
 */
export declare function createGitHubRepository(client: GitHubClient): GitHubRepository;
//# sourceMappingURL=github-repository.d.ts.map