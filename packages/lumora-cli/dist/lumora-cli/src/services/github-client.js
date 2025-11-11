"use strict";
/**
 * GitHub API Client for Lumora
 *
 * Provides integration with GitHub for project storage, sharing, and OTA updates.
 * Uses Octokit for GitHub API interactions with support for OAuth and PAT authentication.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubClient = void 0;
exports.createGitHubClient = createGitHubClient;
const rest_1 = require("@octokit/rest");
const plugin_throttling_1 = require("@octokit/plugin-throttling");
const plugin_retry_1 = require("@octokit/plugin-retry");
// Extend Octokit with plugins for rate limiting and retry logic
const OctokitWithPlugins = rest_1.Octokit.plugin(plugin_throttling_1.throttling, plugin_retry_1.retry);
/**
 * GitHub API Client
 *
 * Handles authentication, rate limiting, and error handling for GitHub operations.
 */
class GitHubClient {
    constructor(config) {
        this.rateLimitWarningThreshold = 10; // Warn when remaining requests < 10
        this.octokit = new OctokitWithPlugins({
            auth: config.auth.token,
            userAgent: config.userAgent || 'lumora-cli/0.1.0',
            baseUrl: config.baseUrl,
            throttle: {
                onRateLimit: (retryAfter, options, octokit, retryCount) => {
                    octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
                    if (retryCount < 2) {
                        octokit.log.info(`Retrying after ${retryAfter} seconds!`);
                        return true;
                    }
                    return false;
                },
                onSecondaryRateLimit: (retryAfter, options, octokit) => {
                    octokit.log.warn(`Secondary rate limit hit for request ${options.method} ${options.url}`);
                    return true;
                },
            },
            retry: {
                doNotRetry: ['400', '401', '403', '404', '422'],
            },
        });
    }
    /**
     * Get current rate limit information
     */
    async getRateLimit() {
        try {
            const response = await this.octokit.rateLimit.get();
            const { limit, remaining, reset, used } = response.data.rate;
            return {
                limit,
                remaining,
                reset: new Date(reset * 1000),
                used,
            };
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Check if rate limit is approaching threshold
     */
    async checkRateLimit() {
        const rateLimit = await this.getRateLimit();
        if (rateLimit.remaining < this.rateLimitWarningThreshold) {
            console.warn(`⚠️  GitHub API rate limit warning: ${rateLimit.remaining}/${rateLimit.limit} requests remaining. ` +
                `Resets at ${rateLimit.reset.toLocaleTimeString()}`);
        }
    }
    /**
     * Verify authentication and get authenticated user
     */
    async verifyAuth() {
        try {
            const response = await this.octokit.users.getAuthenticated();
            return {
                login: response.data.login,
                name: response.data.name,
                email: response.data.email,
            };
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Get the underlying Octokit instance for advanced operations
     */
    getOctokit() {
        return this.octokit;
    }
    /**
     * Handle GitHub API errors and convert to GitHubError
     */
    handleError(error) {
        if (error.status === 401) {
            return {
                message: 'Authentication failed. Please check your GitHub token.',
                status: 401,
                type: 'auth',
            };
        }
        if (error.status === 403) {
            if (error.message?.includes('rate limit')) {
                return {
                    message: 'GitHub API rate limit exceeded. Please try again later.',
                    status: 403,
                    type: 'rate_limit',
                };
            }
            return {
                message: 'Access forbidden. Please check your permissions.',
                status: 403,
                type: 'auth',
            };
        }
        if (error.status === 404) {
            return {
                message: 'Resource not found.',
                status: 404,
                type: 'not_found',
            };
        }
        if (error.request && !error.response) {
            return {
                message: 'Network error. Please check your internet connection.',
                type: 'network',
            };
        }
        return {
            message: error.message || 'An unknown error occurred.',
            status: error.status,
            type: 'unknown',
        };
    }
}
exports.GitHubClient = GitHubClient;
/**
 * Create a GitHub client with authentication
 */
function createGitHubClient(config) {
    return new GitHubClient(config);
}
//# sourceMappingURL=github-client.js.map