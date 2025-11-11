/**
 * Route Parser
 * Parses route patterns and extracts parameters
 */
import type { Route, RouteParam, RouteMatch } from './navigation-types';
/**
 * Route parser for extracting parameters and matching paths
 */
export declare class RouteParser {
    /**
     * Parse a route path pattern and extract parameter definitions
     *
     * @param path - Route path pattern (e.g., "/users/:id/posts/:postId")
     * @returns Array of route parameters
     *
     * @example
     * ```typescript
     * const params = RouteParser.extractParameters('/users/:id/posts/:postId');
     * // Returns: [
     * //   { name: 'id', type: 'string', required: true },
     * //   { name: 'postId', type: 'string', required: true }
     * // ]
     * ```
     */
    static extractParameters(path: string): RouteParam[];
    /**
     * Parse a path pattern into a regular expression for matching
     *
     * @param path - Route path pattern
     * @returns Regular expression and parameter names
     *
     * @example
     * ```typescript
     * const pattern = RouteParser.parsePathPattern('/users/:id');
     * // Returns: { regex: /^\/users\/([^\/]+)$/, params: ['id'] }
     * ```
     */
    static parsePathPattern(path: string): {
        regex: RegExp;
        params: string[];
    };
    /**
     * Match a URL path against a route pattern
     *
     * @param routePath - Route pattern (e.g., "/users/:id")
     * @param urlPath - Actual URL path (e.g., "/users/123")
     * @returns Extracted parameters or null if no match
     *
     * @example
     * ```typescript
     * const params = RouteParser.matchPath('/users/:id', '/users/123');
     * // Returns: { id: '123' }
     * ```
     */
    static matchPath(routePath: string, urlPath: string): Record<string, string> | null;
    /**
     * Find the best matching route for a given path
     *
     * @param routes - Array of routes to match against
     * @param path - URL path to match
     * @returns Best matching route with extracted parameters
     *
     * @example
     * ```typescript
     * const match = RouteParser.findMatchingRoute(routes, '/users/123');
     * // Returns: { route: {...}, params: { id: '123' }, score: 10 }
     * ```
     */
    static findMatchingRoute(routes: Route[], path: string): RouteMatch | null;
    /**
     * Calculate match score for a route
     * Higher score = better match
     *
     * @param routePath - Route pattern
     * @param urlPath - Actual URL path
     * @returns Match score
     */
    private static calculateMatchScore;
    /**
     * Parse query string from URL path
     *
     * @param path - URL path with optional query string
     * @returns Query parameters object
     *
     * @example
     * ```typescript
     * const query = RouteParser.parseQueryString('/users?sort=name&page=2');
     * // Returns: { sort: 'name', page: '2' }
     * ```
     */
    static parseQueryString(path: string): Record<string, any>;
    /**
     * Build a URL path from a route and parameters
     *
     * @param route - Route definition
     * @param params - Route parameters
     * @param query - Query parameters
     * @returns Complete URL path
     *
     * @example
     * ```typescript
     * const url = RouteParser.buildPath(
     *   { path: '/users/:id' },
     *   { id: '123' },
     *   { tab: 'posts' }
     * );
     * // Returns: '/users/123?tab=posts'
     * ```
     */
    static buildPath(route: Route, params?: Record<string, any>, query?: Record<string, any>): string;
    /**
     * Build query string from parameters object
     *
     * @param params - Query parameters
     * @returns Query string (without leading ?)
     *
     * @example
     * ```typescript
     * const query = RouteParser.buildQueryString({ sort: 'name', page: 2 });
     * // Returns: 'sort=name&page=2'
     * ```
     */
    static buildQueryString(params: Record<string, any>): string;
    /**
     * Validate route parameters against their definitions
     *
     * @param params - Actual parameters
     * @param definitions - Parameter definitions
     * @returns Validation result with errors
     *
     * @example
     * ```typescript
     * const result = RouteParser.validateParameters(
     *   { id: 'abc' },
     *   [{ name: 'id', type: 'number', required: true }]
     * );
     * // Returns: { valid: false, errors: ['Parameter id must be a number'] }
     * ```
     */
    static validateParameters(params: Record<string, any>, definitions: RouteParam[]): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Normalize a route path (remove trailing slashes, etc.)
     *
     * @param path - Route path
     * @returns Normalized path
     *
     * @example
     * ```typescript
     * const normalized = RouteParser.normalizePath('/users/123/');
     * // Returns: '/users/123'
     * ```
     */
    static normalizePath(path: string): string;
    /**
     * Check if a path is dynamic (contains parameters)
     *
     * @param path - Route path
     * @returns True if path contains parameters
     *
     * @example
     * ```typescript
     * RouteParser.isDynamicPath('/users/:id'); // true
     * RouteParser.isDynamicPath('/users'); // false
     * ```
     */
    static isDynamicPath(path: string): boolean;
    /**
     * Escape special regex characters in a string
     *
     * @param str - String to escape
     * @returns Escaped string
     */
    private static escapeRegex;
}
