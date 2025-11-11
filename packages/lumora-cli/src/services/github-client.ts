/**
 * GitHub API Client for Lumora
 * 
 * Provides integration with GitHub for project storage, sharing, and OTA updates.
 * Uses Octokit for GitHub API interactions with support for OAuth and PAT authentication.
 */

import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';
import { retry } from '@octokit/plugin-retry';

// Extend Octokit with plugins for rate limiting and retry logic
const OctokitWithPlugins = Octokit.plugin(throttling, retry);

export interface GitHubAuthConfig {
  type: 'oauth' | 'pat';
  token: string;
}

export interface GitHubClientConfig {
  auth: GitHubAuthConfig;
  userAgent?: string;
  baseUrl?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

export interface GitHubError {
  message: string;
  status?: number;
  type: 'auth' | 'rate_limit' | 'not_found' | 'network' | 'unknown';
}

/**
 * GitHub API Client
 * 
 * Handles authentication, rate limiting, and error handling for GitHub operations.
 */
export class GitHubClient {
  private octokit: InstanceType<typeof OctokitWithPlugins>;
  private rateLimitWarningThreshold = 10; // Warn when remaining requests < 10

  constructor(config: GitHubClientConfig) {
    this.octokit = new OctokitWithPlugins({
      auth: config.auth.token,
      userAgent: config.userAgent || 'lumora-cli/0.1.0',
      baseUrl: config.baseUrl,
      throttle: {
        onRateLimit: (retryAfter: number, options: any, octokit: any, retryCount: number) => {
          octokit.log.warn(
            `Request quota exhausted for request ${options.method} ${options.url}`
          );

          if (retryCount < 2) {
            octokit.log.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
          return false;
        },
        onSecondaryRateLimit: (retryAfter: number, options: any, octokit: any) => {
          octokit.log.warn(
            `Secondary rate limit hit for request ${options.method} ${options.url}`
          );
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
  async getRateLimit(): Promise<RateLimitInfo> {
    try {
      const response = await this.octokit.rateLimit.get();
      const { limit, remaining, reset, used } = response.data.rate;

      return {
        limit,
        remaining,
        reset: new Date(reset * 1000),
        used,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if rate limit is approaching threshold
   */
  async checkRateLimit(): Promise<void> {
    const rateLimit = await this.getRateLimit();
    
    if (rateLimit.remaining < this.rateLimitWarningThreshold) {
      console.warn(
        `⚠️  GitHub API rate limit warning: ${rateLimit.remaining}/${rateLimit.limit} requests remaining. ` +
        `Resets at ${rateLimit.reset.toLocaleTimeString()}`
      );
    }
  }

  /**
   * Verify authentication and get authenticated user
   */
  async verifyAuth(): Promise<{ login: string; name: string | null; email: string | null }> {
    try {
      const response = await this.octokit.users.getAuthenticated();
      return {
        login: response.data.login,
        name: response.data.name,
        email: response.data.email,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get the underlying Octokit instance for advanced operations
   */
  getOctokit(): InstanceType<typeof OctokitWithPlugins> {
    return this.octokit;
  }

  /**
   * Handle GitHub API errors and convert to GitHubError
   */
  private handleError(error: any): GitHubError {
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

/**
 * Create a GitHub client with authentication
 */
export function createGitHubClient(config: GitHubClientConfig): GitHubClient {
  return new GitHubClient(config);
}
