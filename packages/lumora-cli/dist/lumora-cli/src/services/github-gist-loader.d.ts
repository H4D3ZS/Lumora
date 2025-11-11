/**
 * GitHub Gist Loader for Lumora
 *
 * Handles loading Lumora projects from GitHub Gists into the local workspace.
 * Provides functionality to fetch, parse, and extract project files.
 */
import { GitHubGistManager, GistInfo, GistFileInfo } from './github-gist-manager';
export interface LoadGistOptions {
    gistId: string;
    outputDir: string;
    overwrite?: boolean;
    includeReadme?: boolean;
}
export interface LoadGistResult {
    gistInfo: GistInfo;
    filesWritten: string[];
    projectName: string;
    projectPath: string;
}
export interface ParsedProject {
    name: string;
    files: Map<string, string>;
    metadata: ProjectMetadata;
}
export interface ProjectMetadata {
    description: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
    gistId: string;
    gistUrl: string;
}
export interface ValidateProjectResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * GitHub Gist Loader
 *
 * Loads Lumora projects from GitHub Gists into the local workspace.
 */
export declare class GitHubGistLoader {
    private gistManager;
    constructor(gistManager: GitHubGistManager);
    /**
     * Load a project from a gist
     */
    loadGist(options: LoadGistOptions): Promise<LoadGistResult>;
    /**
     * Parse project structure from gist
     */
    parseProject(gistInfo: GistInfo): ParsedProject;
    /**
     * Validate project structure
     */
    validateProject(project: ParsedProject): ValidateProjectResult;
    /**
     * Extract project name from description
     */
    private extractProjectName;
    /**
     * Sanitize project name for filesystem
     */
    private sanitizeProjectName;
    /**
     * Get project metadata from loaded project
     */
    getProjectMetadata(projectPath: string): Promise<ProjectMetadata | null>;
    /**
     * Check if a directory is a gist-loaded project
     */
    isGistProject(projectPath: string): Promise<boolean>;
    /**
     * Update a gist-loaded project
     */
    updateGistProject(projectPath: string): Promise<LoadGistResult>;
    /**
     * List all files in a gist
     */
    listGistFiles(gistId: string): Promise<GistFileInfo[]>;
    /**
     * Preview gist content without loading
     */
    previewGist(gistId: string): Promise<{
        info: GistInfo;
        project: ParsedProject;
        validation: ValidateProjectResult;
    }>;
}
/**
 * Create a GitHub gist loader
 */
export declare function createGitHubGistLoader(gistManager: GitHubGistManager): GitHubGistLoader;
//# sourceMappingURL=github-gist-loader.d.ts.map