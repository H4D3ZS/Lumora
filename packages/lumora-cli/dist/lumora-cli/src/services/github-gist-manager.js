"use strict";
/**
 * GitHub Gist Manager for Lumora
 *
 * Provides Snack-like functionality using GitHub Gists for project sharing.
 * Enables creating, updating, forking, and loading Lumora projects via gists.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubGistManager = void 0;
exports.createGitHubGistManager = createGitHubGistManager;
/**
 * GitHub Gist Manager
 *
 * Implements Snack-like functionality for Lumora projects using GitHub Gists.
 * Allows developers to share projects without creating full repositories.
 */
class GitHubGistManager {
    constructor(client) {
        this.client = client;
    }
    /**
     * Create a new gist for a Lumora project
     */
    async createGist(options) {
        try {
            await this.client.checkRateLimit();
            const octokit = this.client.getOctokit();
            // Convert files array to GitHub Gist format
            const files = {};
            options.files.forEach(file => {
                files[file.filename] = { content: file.content };
            });
            const response = await octokit.gists.create({
                description: options.description,
                public: options.public ?? true,
                files,
            });
            return this.mapGistInfo(response.data);
        }
        catch (error) {
            throw new Error(`Failed to create gist: ${error.message}`);
        }
    }
    /**
     * Update an existing gist
     */
    async updateGist(options) {
        try {
            await this.client.checkRateLimit();
            const octokit = this.client.getOctokit();
            // Convert files array to GitHub Gist format if provided
            let files;
            if (options.files) {
                files = {};
                options.files.forEach(file => {
                    files[file.filename] = { content: file.content };
                });
            }
            const response = await octokit.gists.update({
                gist_id: options.gistId,
                description: options.description,
                files,
            });
            return this.mapGistInfo(response.data);
        }
        catch (error) {
            throw new Error(`Failed to update gist: ${error.message}`);
        }
    }
    /**
     * Get gist information
     */
    async getGist(gistId) {
        try {
            await this.client.checkRateLimit();
            const octokit = this.client.getOctokit();
            const response = await octokit.gists.get({
                gist_id: gistId,
            });
            return this.mapGistInfo(response.data);
        }
        catch (error) {
            throw new Error(`Failed to get gist: ${error.message}`);
        }
    }
    /**
     * Fork an existing gist
     */
    async forkGist(gistId) {
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
        }
        catch (error) {
            throw new Error(`Failed to fork gist: ${error.message}`);
        }
    }
    /**
     * Delete a gist
     */
    async deleteGist(gistId) {
        try {
            await this.client.checkRateLimit();
            const octokit = this.client.getOctokit();
            await octokit.gists.delete({
                gist_id: gistId,
            });
        }
        catch (error) {
            throw new Error(`Failed to delete gist: ${error.message}`);
        }
    }
    /**
     * List gists for the authenticated user
     */
    async listGists(options) {
        try {
            await this.client.checkRateLimit();
            const octokit = this.client.getOctokit();
            const response = await octokit.gists.list({
                per_page: options?.perPage ?? 30,
                page: options?.page ?? 1,
            });
            return response.data.map(gist => this.mapGistInfo(gist));
        }
        catch (error) {
            throw new Error(`Failed to list gists: ${error.message}`);
        }
    }
    /**
     * Generate shareable URLs for a gist
     */
    generateShareableUrls(gistId) {
        return {
            htmlUrl: `https://gist.github.com/${gistId}`,
            rawUrl: `https://gist.githubusercontent.com/${gistId}/raw`,
            embedUrl: `https://gist.github.com/${gistId}.js`,
        };
    }
    /**
     * Extract gist ID from various URL formats
     */
    extractGistId(url) {
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
    async gistExists(gistId) {
        try {
            await this.getGist(gistId);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get file content from a gist
     */
    async getGistFile(gistId, filename) {
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
        }
        catch (error) {
            throw new Error(`Failed to get gist file: ${error.message}`);
        }
    }
    /**
     * Create a Lumora project gist with standard structure
     */
    async createProjectGist(projectName, files, description) {
        const gistFiles = files.map(file => ({
            filename: file.path,
            content: file.content,
        }));
        // Add a README if not present
        const hasReadme = files.some(f => f.path.toLowerCase() === 'readme.md' || f.path.toLowerCase() === 'readme.txt');
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
    mapGistInfo(data) {
        const files = new Map();
        if (data.files) {
            Object.entries(data.files).forEach(([filename, fileData]) => {
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
exports.GitHubGistManager = GitHubGistManager;
/**
 * Create a GitHub gist manager
 */
function createGitHubGistManager(client) {
    return new GitHubGistManager(client);
}
//# sourceMappingURL=github-gist-manager.js.map