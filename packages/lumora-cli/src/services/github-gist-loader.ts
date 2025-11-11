/**
 * GitHub Gist Loader for Lumora
 * 
 * Handles loading Lumora projects from GitHub Gists into the local workspace.
 * Provides functionality to fetch, parse, and extract project files.
 */

import * as fs from 'fs';
import * as path from 'path';
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
export class GitHubGistLoader {
  constructor(private gistManager: GitHubGistManager) {}

  /**
   * Load a project from a gist
   */
  async loadGist(options: LoadGistOptions): Promise<LoadGistResult> {
    try {
      // Extract gist ID if URL is provided
      const gistId = this.gistManager.extractGistId(options.gistId) || options.gistId;

      // Fetch gist information
      const gistInfo = await this.gistManager.getGist(gistId);

      // Parse project from gist
      const project = this.parseProject(gistInfo);

      // Validate project structure
      const validation = this.validateProject(project);
      if (!validation.valid) {
        throw new Error(`Invalid project structure:\n${validation.errors.join('\n')}`);
      }

      // Display warnings if any
      if (validation.warnings.length > 0) {
        console.warn('⚠️  Project warnings:');
        validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }

      // Determine project path
      const projectPath = path.join(options.outputDir, project.name);

      // Check if directory exists
      if (fs.existsSync(projectPath) && !options.overwrite) {
        throw new Error(
          `Directory ${projectPath} already exists. Use --overwrite to replace it.`
        );
      }

      // Create project directory
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }

      // Write files to disk
      const filesWritten: string[] = [];
      for (const [filePath, content] of project.files.entries()) {
        // Skip README if not requested
        if (!options.includeReadme && filePath.toLowerCase().startsWith('readme')) {
          continue;
        }

        const fullPath = path.join(projectPath, filePath);
        const fileDir = path.dirname(fullPath);

        // Create directory if needed
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }

        // Write file
        fs.writeFileSync(fullPath, content, 'utf-8');
        filesWritten.push(filePath);
      }

      // Write metadata file
      const metadataPath = path.join(projectPath, '.lumora-gist.json');
      fs.writeFileSync(
        metadataPath,
        JSON.stringify(project.metadata, null, 2),
        'utf-8'
      );
      filesWritten.push('.lumora-gist.json');

      return {
        gistInfo,
        filesWritten,
        projectName: project.name,
        projectPath,
      };
    } catch (error: any) {
      throw new Error(`Failed to load gist: ${error.message}`);
    }
  }

  /**
   * Parse project structure from gist
   */
  parseProject(gistInfo: GistInfo): ParsedProject {
    const files = new Map<string, string>();

    // Extract project name from description or use gist ID
    const projectName = this.extractProjectName(gistInfo.description) || `gist-${gistInfo.id}`;

    // Process all files
    for (const [filename, fileInfo] of gistInfo.files.entries()) {
      if (fileInfo.content) {
        files.set(filename, fileInfo.content);
      }
    }

    // Create metadata
    const metadata: ProjectMetadata = {
      description: gistInfo.description,
      author: gistInfo.owner,
      createdAt: gistInfo.createdAt,
      updatedAt: gistInfo.updatedAt,
      gistId: gistInfo.id,
      gistUrl: gistInfo.htmlUrl,
    };

    return {
      name: projectName,
      files,
      metadata,
    };
  }

  /**
   * Validate project structure
   */
  validateProject(project: ParsedProject): ValidateProjectResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if project has any files
    if (project.files.size === 0) {
      errors.push('Project has no files');
      return { valid: false, errors, warnings };
    }

    // Check for essential Lumora files
    const hasSchema = Array.from(project.files.keys()).some(
      f => f.endsWith('.json') && (f.includes('schema') || f === 'app.json')
    );
    const hasTsx = Array.from(project.files.keys()).some(f => f.endsWith('.tsx') || f.endsWith('.ts'));
    const hasPackageJson = project.files.has('package.json');

    if (!hasSchema && !hasTsx) {
      warnings.push('No schema or TSX files found. This may not be a valid Lumora project.');
    }

    if (!hasPackageJson) {
      warnings.push('No package.json found. Dependencies may need to be installed manually.');
    }

    // Check for large files (> 1MB)
    for (const [filename, content] of project.files.entries()) {
      const sizeInMB = Buffer.byteLength(content, 'utf-8') / (1024 * 1024);
      if (sizeInMB > 1) {
        warnings.push(`File ${filename} is large (${sizeInMB.toFixed(2)}MB)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Extract project name from description
   */
  private extractProjectName(description: string): string | null {
    // Try to extract from "Lumora Project: ProjectName" format
    const match = description.match(/Lumora Project:\s*(.+)/i);
    if (match) {
      return this.sanitizeProjectName(match[1]);
    }

    // Try to extract from first line
    const firstLine = description.split('\n')[0].trim();
    if (firstLine) {
      return this.sanitizeProjectName(firstLine);
    }

    return null;
  }

  /**
   * Sanitize project name for filesystem
   */
  private sanitizeProjectName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Get project metadata from loaded project
   */
  async getProjectMetadata(projectPath: string): Promise<ProjectMetadata | null> {
    try {
      const metadataPath = path.join(projectPath, '.lumora-gist.json');
      if (!fs.existsSync(metadataPath)) {
        return null;
      }

      const content = fs.readFileSync(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a directory is a gist-loaded project
   */
  async isGistProject(projectPath: string): Promise<boolean> {
    const metadata = await this.getProjectMetadata(projectPath);
    return metadata !== null;
  }

  /**
   * Update a gist-loaded project
   */
  async updateGistProject(projectPath: string): Promise<LoadGistResult> {
    const metadata = await this.getProjectMetadata(projectPath);
    if (!metadata) {
      throw new Error('Not a gist-loaded project. Missing .lumora-gist.json file.');
    }

    return this.loadGist({
      gistId: metadata.gistId,
      outputDir: path.dirname(projectPath),
      overwrite: true,
      includeReadme: true,
    });
  }

  /**
   * List all files in a gist
   */
  async listGistFiles(gistId: string): Promise<GistFileInfo[]> {
    const gistIdExtracted = this.gistManager.extractGistId(gistId) || gistId;
    const gistInfo = await this.gistManager.getGist(gistIdExtracted);
    return Array.from(gistInfo.files.values());
  }

  /**
   * Preview gist content without loading
   */
  async previewGist(gistId: string): Promise<{
    info: GistInfo;
    project: ParsedProject;
    validation: ValidateProjectResult;
  }> {
    const gistIdExtracted = this.gistManager.extractGistId(gistId) || gistId;
    const gistInfo = await this.gistManager.getGist(gistIdExtracted);
    const project = this.parseProject(gistInfo);
    const validation = this.validateProject(project);

    return {
      info: gistInfo,
      project,
      validation,
    };
  }
}

/**
 * Create a GitHub gist loader
 */
export function createGitHubGistLoader(gistManager: GitHubGistManager): GitHubGistLoader {
  return new GitHubGistLoader(gistManager);
}
