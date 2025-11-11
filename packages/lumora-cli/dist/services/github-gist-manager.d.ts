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
export declare class GitHubGistManager {
    private client;
    constructor(client: GitHubClient);
    /**
     * Create a new gist for a Lumora project
     */
    createGist(options: CreateGistOptions): Promise<GistInfo>;
    /**
     * Update an existing gist
     */
    updateGist(options: UpdateGistOptions): Promise<GistInfo>;
    /**
     * Get gist information
     */
    getGist(gistId: string): Promise<GistInfo>;
    /**
     * Fork an existing gist
     */
    forkGist(gistId: string): Promise<ForkGistResult>;
    /**
     * Delete a gist
     */
    deleteGist(gistId: string): Promise<void>;
    /**
     * List gists for the authenticated user
     */
    listGists(options?: {
        perPage?: number;
        page?: number;
    }): Promise<GistInfo[]>;
    /**
     * Generate shareable URLs for a gist
     */
    generateShareableUrls(gistId: string): ShareableGistUrl;
    /**
     * Extract gist ID from various URL formats
     */
    extractGistId(url: string): string | null;
    /**
     * Check if a gist exists
     */
    gistExists(gistId: string): Promise<boolean>;
    /**
     * Get file content from a gist
     */
    getGistFile(gistId: string, filename: string): Promise<string>;
    /**
     * Create a Lumora project gist with standard structure
     */
    createProjectGist(projectName: string, files: {
        path: string;
        content: string;
    }[], description?: string): Promise<GistInfo>;
    /**
     * Map GitHub API gist data to GistInfo
     */
    private mapGistInfo;
}
/**
 * Create a GitHub gist manager
 */
export declare function createGitHubGistManager(client: GitHubClient): GitHubGistManager;
//# sourceMappingURL=github-gist-manager.d.ts.map