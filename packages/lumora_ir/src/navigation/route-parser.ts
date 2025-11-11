/**
 * Route Parser
 * Parses route patterns and extracts parameters
 */

import type { Route, RouteParam, RouteMatch } from './navigation-types';

/**
 * Route parser for extracting parameters and matching paths
 */
export class RouteParser {
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
  static extractParameters(path: string): RouteParam[] {
    const params: RouteParam[] = [];
    const segments = path.split('/').filter(s => s.length > 0);

    for (const segment of segments) {
      if (segment.startsWith(':')) {
        // Required parameter
        const paramName = segment.slice(1);
        params.push({
          name: paramName,
          type: 'string',
          required: true,
          description: `Path parameter: ${paramName}`,
        });
      } else if (segment.startsWith('*')) {
        // Wildcard parameter (catch-all)
        const paramName = segment.slice(1) || 'wildcard';
        params.push({
          name: paramName,
          type: 'string',
          required: false,
          description: `Wildcard parameter: ${paramName}`,
        });
      } else if (segment.includes(':')) {
        // Optional parameter with pattern (e.g., "page:pageNum?")
        const match = segment.match(/^([^:]+):([^?]+)(\?)?$/);
        if (match) {
          const [, prefix, paramName, optional] = match;
          params.push({
            name: paramName,
            type: 'string',
            required: !optional,
            description: `Path parameter: ${paramName} (prefix: ${prefix})`,
          });
        }
      }
    }

    return params;
  }

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
  } {
    const params: string[] = [];
    let regexPattern = '^';

    const segments = path.split('/');
    for (const segment of segments) {
      if (segment.length === 0) {
        continue;
      }

      regexPattern += '\\/';

      if (segment.startsWith(':')) {
        // Required parameter - match any non-slash characters
        const paramName = segment.slice(1);
        params.push(paramName);
        regexPattern += '([^\\/]+)';
      } else if (segment.startsWith('*')) {
        // Wildcard - match everything including slashes
        const paramName = segment.slice(1) || 'wildcard';
        params.push(paramName);
        regexPattern += '(.*)';
      } else if (segment.includes(':')) {
        // Optional parameter with pattern
        const match = segment.match(/^([^:]+):([^?]+)(\?)?$/);
        if (match) {
          const [, prefix, paramName, optional] = match;
          params.push(paramName);
          if (optional) {
            regexPattern += `(?:${this.escapeRegex(prefix)}([^\\/]+))?`;
          } else {
            regexPattern += `${this.escapeRegex(prefix)}([^\\/]+)`;
          }
        } else {
          regexPattern += this.escapeRegex(segment);
        }
      } else {
        // Static segment
        regexPattern += this.escapeRegex(segment);
      }
    }

    regexPattern += '$';

    return {
      regex: new RegExp(regexPattern),
      params,
    };
  }

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
  static matchPath(
    routePath: string,
    urlPath: string
  ): Record<string, string> | null {
    const { regex, params } = this.parsePathPattern(routePath);
    const match = urlPath.match(regex);

    if (!match) {
      return null;
    }

    const result: Record<string, string> = {};
    params.forEach((paramName, index) => {
      result[paramName] = match[index + 1];
    });

    return result;
  }

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
  static findMatchingRoute(
    routes: Route[],
    path: string
  ): RouteMatch | null {
    const matches: RouteMatch[] = [];

    for (const route of routes) {
      const params = this.matchPath(route.path, path);
      if (params !== null) {
        // Calculate match score (higher = better match)
        // Static segments score higher than dynamic ones
        const score = this.calculateMatchScore(route.path, path);
        matches.push({
          route,
          params,
          query: this.parseQueryString(path),
          score,
        });
      }

      // Check aliases
      if (route.aliases) {
        for (const alias of route.aliases) {
          const params = this.matchPath(alias, path);
          if (params !== null) {
            const score = this.calculateMatchScore(alias, path);
            matches.push({
              route,
              params,
              query: this.parseQueryString(path),
              score,
            });
          }
        }
      }

      // Check nested routes
      if (route.children) {
        const childMatch = this.findMatchingRoute(route.children, path);
        if (childMatch) {
          matches.push(childMatch);
        }
      }
    }

    if (matches.length === 0) {
      return null;
    }

    // Return the best match (highest score)
    matches.sort((a, b) => b.score - a.score);
    return matches[0];
  }

  /**
   * Calculate match score for a route
   * Higher score = better match
   * 
   * @param routePath - Route pattern
   * @param urlPath - Actual URL path
   * @returns Match score
   */
  private static calculateMatchScore(routePath: string, urlPath: string): number {
    let score = 0;
    const routeSegments = routePath.split('/').filter(s => s.length > 0);
    const urlSegments = urlPath.split('/').filter(s => s.length > 0);

    for (let i = 0; i < Math.min(routeSegments.length, urlSegments.length); i++) {
      const routeSegment = routeSegments[i];
      const urlSegment = urlSegments[i];

      if (routeSegment === urlSegment) {
        // Exact match - highest score
        score += 10;
      } else if (routeSegment.startsWith(':')) {
        // Parameter match - medium score
        score += 5;
      } else if (routeSegment.startsWith('*')) {
        // Wildcard match - lowest score
        score += 1;
      }
    }

    // Penalize if lengths don't match (unless wildcard)
    if (routeSegments.length !== urlSegments.length) {
      const hasWildcard = routeSegments.some(s => s.startsWith('*'));
      if (!hasWildcard) {
        score -= 5;
      }
    }

    return score;
  }

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
  static parseQueryString(path: string): Record<string, any> {
    const queryIndex = path.indexOf('?');
    if (queryIndex === -1) {
      return {};
    }

    const queryString = path.slice(queryIndex + 1);
    const params: Record<string, any> = {};

    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        const decodedKey = decodeURIComponent(key);
        const decodedValue = value ? decodeURIComponent(value) : '';
        
        // Handle array parameters (e.g., tags[]=a&tags[]=b)
        if (decodedKey.endsWith('[]')) {
          const arrayKey = decodedKey.slice(0, -2);
          if (!params[arrayKey]) {
            params[arrayKey] = [];
          }
          params[arrayKey].push(decodedValue);
        } else {
          params[decodedKey] = decodedValue;
        }
      }
    }

    return params;
  }

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
  static buildPath(
    route: Route,
    params: Record<string, any> = {},
    query: Record<string, any> = {}
  ): string {
    let path = route.path;

    // Replace path parameters
    const pathParams = this.extractParameters(route.path);
    for (const param of pathParams) {
      const value = params[param.name];
      if (value !== undefined) {
        path = path.replace(`:${param.name}`, String(value));
      } else if (param.required) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }
    }

    // Add query string
    const queryString = this.buildQueryString(query);
    if (queryString) {
      path += '?' + queryString;
    }

    return path;
  }

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
  static buildQueryString(params: Record<string, any>): string {
    const pairs: string[] = [];

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        // Handle array parameters
        for (const item of value) {
          pairs.push(
            `${encodeURIComponent(key)}[]=${encodeURIComponent(String(item))}`
          );
        }
      } else {
        pairs.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        );
      }
    }

    return pairs.join('&');
  }

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
  static validateParameters(
    params: Record<string, any>,
    definitions: RouteParam[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const def of definitions) {
      const value = params[def.name];

      // Check required
      if (def.required && (value === undefined || value === null)) {
        errors.push(`Required parameter '${def.name}' is missing`);
        continue;
      }

      // Skip validation if not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (def.type === 'number' && actualType !== 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`Parameter '${def.name}' must be a number`);
        }
      } else if (def.type === 'boolean' && actualType !== 'boolean') {
        if (value !== 'true' && value !== 'false') {
          errors.push(`Parameter '${def.name}' must be a boolean`);
        }
      }

      // Pattern validation
      if (def.pattern && typeof value === 'string') {
        const regex = new RegExp(def.pattern);
        if (!regex.test(value)) {
          errors.push(
            `Parameter '${def.name}' does not match pattern: ${def.pattern}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

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
  static normalizePath(path: string): string {
    // Remove trailing slash (except for root)
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Ensure leading slash
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // Remove duplicate slashes
    path = path.replace(/\/+/g, '/');

    return path;
  }

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
  static isDynamicPath(path: string): boolean {
    return path.includes(':') || path.includes('*');
  }

  /**
   * Escape special regex characters in a string
   * 
   * @param str - String to escape
   * @returns Escaped string
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
