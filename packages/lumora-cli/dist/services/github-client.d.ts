/**
 * GitHub API Client for Lumora
 *
 * Provides integration with GitHub for project storage, sharing, and OTA updates.
 * Uses Octokit for GitHub API interactions with support for OAuth and PAT authentication.
 */
declare const OctokitWithPlugins: typeof import("@octokit/core").Octokit & import("@octokit/core/dist-types/types.d").Constructor<{
    paginate: import("@octokit/plugin-paginate-rest").PaginateInterface;
} & import("@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types").RestEndpointMethods & import("@octokit/plugin-rest-endpoint-methods").Api> & import("@octokit/core/dist-types/types.d").Constructor<{
    retry: {
        retryRequest: (error: import("@octokit/request-error").RequestError, retries: number, retryAfter: number) => import("@octokit/request-error").RequestError;
    };
}>;
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
export declare class GitHubClient {
    private octokit;
    private rateLimitWarningThreshold;
    constructor(config: GitHubClientConfig);
    /**
     * Get current rate limit information
     */
    getRateLimit(): Promise<RateLimitInfo>;
    /**
     * Check if rate limit is approaching threshold
     */
    checkRateLimit(): Promise<void>;
    /**
     * Verify authentication and get authenticated user
     */
    verifyAuth(): Promise<{
        login: string;
        name: string | null;
        email: string | null;
    }>;
    /**
     * Get the underlying Octokit instance for advanced operations
     */
    getOctokit(): InstanceType<typeof OctokitWithPlugins>;
    /**
     * Handle GitHub API errors and convert to GitHubError
     */
    private handleError;
}
/**
 * Create a GitHub client with authentication
 */
export declare function createGitHubClient(config: GitHubClientConfig): GitHubClient;
export {};
//# sourceMappingURL=github-client.d.ts.map