/**
 * Flutter Network Parser
 * Parses Flutter network calls (http, dio, GraphQL) and converts to Network Schema
 */

import {
  NetworkSchema,
  Endpoint,
  HttpMethod,
  ParamDefinition,
  BodyDefinition,
  ResponseDefinition,
  EndpointCallbacks,
  Interceptor,
  CacheConfig,
  RetryConfig,
  AuthConfig,
  NETWORK_PRESETS
} from '../types/network-types';
import { ErrorHandler, getErrorHandler, ErrorSeverity, ErrorCategory } from '../errors/error-handler';

/**
 * Configuration for Flutter network parser
 */
export interface FlutterNetworkParserConfig {
  errorHandler?: ErrorHandler;
  strictMode?: boolean;
  detectLibraries?: boolean;
}

/**
 * Network call information extracted from Dart code
 */
export interface DartNetworkCallInfo {
  type: 'http' | 'dio' | 'graphql' | 'unknown';
  method: HttpMethod;
  url: string;
  options?: any;
  lineNumber: number;
  variableName?: string;
}

/**
 * Flutter Network Parser
 * Converts Flutter network calls to Network Schema
 */
export class FlutterNetworkParser {
  private sourceFile: string = '';
  private sourceCode: string = '';
  private errorHandler: ErrorHandler;
  private config: FlutterNetworkParserConfig;
  private endpoints: Endpoint[] = [];
  private interceptors: Interceptor[] = [];
  private detectedLibraries: Set<string> = new Set();

  constructor(config: FlutterNetworkParserConfig = {}) {
    this.config = {
      strictMode: false,
      detectLibraries: true,
      ...config,
    };
    this.errorHandler = config.errorHandler || getErrorHandler();
  }

  /**
   * Parse Flutter/Dart source code to extract network calls
   */
  parse(source: string, filename: string): NetworkSchema {
    this.sourceFile = filename;
    this.sourceCode = source;
    this.endpoints = [];
    this.interceptors = [];
    this.detectedLibraries.clear();

    try {
      // Detect imported libraries
      if (this.config.detectLibraries) {
        this.detectNetworkLibraries(source);
      }
      
      // Extract network calls
      this.extractNetworkCalls(source);
      
      // Extract dio interceptors if dio is used
      if (this.detectedLibraries.has('dio')) {
        this.extractDioInterceptors(source);
      }
      
      // Build network schema
      return this.buildNetworkSchema();
    } catch (error) {
      // Return empty schema on error
      return this.buildNetworkSchema();
    }
  }

  /**
   * Detect network libraries used in the code
   */
  private detectNetworkLibraries(source: string): void {
    const importRegex = /import\s+['"]package:([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(source)) !== null) {
      const packageName = match[1];
      
      if (packageName.startsWith('http/')) {
        this.detectedLibraries.add('http');
      } else if (packageName.startsWith('dio/')) {
        this.detectedLibraries.add('dio');
      } else if (packageName.includes('graphql')) {
        this.detectedLibraries.add('graphql');
      }
    }
  }

  /**
   * Extract network calls from source code
   */
  private extractNetworkCalls(source: string): void {
    // Parse http package calls
    if (this.detectedLibraries.has('http')) {
      this.extractHttpCalls(source);
    }
    
    // Parse dio calls
    if (this.detectedLibraries.has('dio')) {
      this.extractDioCalls(source);
    }
    
    // Parse GraphQL calls
    if (this.detectedLibraries.has('graphql')) {
      this.extractGraphQLCalls(source);
    }
  }

  /**
   * Extract http package calls
   */
  private extractHttpCalls(source: string): void {
    // Match http.get(), http.post(), etc.
    const httpMethodRegex = /http\.(get|post|put|patch|delete|head)\s*\(\s*(?:Uri\.parse\s*\(\s*)?['"]([^'"]+)['"]\)?/g;
    let match;
    
    while ((match = httpMethodRegex.exec(source)) !== null) {
      const method = match[1].toUpperCase() as HttpMethod;
      const url = match[2];
      const lineNumber = this.getLineNumber(source, match.index);
      
      const callInfo: DartNetworkCallInfo = {
        type: 'http',
        method,
        url,
        lineNumber
      };
      
      // Extract options from the call
      const options = this.extractHttpOptions(source, match.index);
      if (options) {
        callInfo.options = options;
      }
      
      const endpoint = this.convertToEndpoint(callInfo);
      if (endpoint) {
        this.endpoints.push(endpoint);
      }
    }
    
    // Match http.Request() calls
    const requestRegex = /http\.Request\s*\(\s*['"](\w+)['"]\s*,\s*Uri\.parse\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\)/g;
    
    while ((match = requestRegex.exec(source)) !== null) {
      const method = match[1].toUpperCase() as HttpMethod;
      const url = match[2];
      const lineNumber = this.getLineNumber(source, match.index);
      
      const endpoint = this.convertToEndpoint({
        type: 'http',
        method,
        url,
        lineNumber
      });
      
      if (endpoint) {
        this.endpoints.push(endpoint);
      }
    }
  }

  /**
   * Extract dio calls
   */
  private extractDioCalls(source: string): void {
    // Match dio.get(), dio.post(), etc.
    const dioMethodRegex = /(?:dio|_dio)\.(get|post|put|patch|delete|head)\s*(?:<[^>]+>)?\s*\(\s*['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = dioMethodRegex.exec(source)) !== null) {
      const method = match[1].toUpperCase() as HttpMethod;
      const url = match[2];
      const lineNumber = this.getLineNumber(source, match.index);
      
      const callInfo: DartNetworkCallInfo = {
        type: 'dio',
        method,
        url,
        lineNumber
      };
      
      // Extract options from the call
      const options = this.extractDioOptions(source, match.index);
      if (options) {
        callInfo.options = options;
      }
      
      const endpoint = this.convertToEndpoint(callInfo);
      if (endpoint) {
        this.endpoints.push(endpoint);
      }
    }
    
    // Match dio.request() calls
    const requestRegex = /(?:dio|_dio)\.request\s*(?:<[^>]+>)?\s*\(\s*['"]([^'"]+)['"]\s*,\s*options:\s*Options\s*\(\s*method:\s*['"](\w+)['"]/g;
    
    while ((match = requestRegex.exec(source)) !== null) {
      const url = match[1];
      const method = match[2].toUpperCase() as HttpMethod;
      const lineNumber = this.getLineNumber(source, match.index);
      
      const endpoint = this.convertToEndpoint({
        type: 'dio',
        method,
        url,
        lineNumber
      });
      
      if (endpoint) {
        this.endpoints.push(endpoint);
      }
    }
  }

  /**
   * Extract GraphQL calls
   */
  private extractGraphQLCalls(source: string): void {
    // Match GraphQL query/mutation calls
    const queryRegex = /(?:client|_client)\.(?:query|mutate)\s*\(\s*(?:QueryOptions|MutationOptions)\s*\(/g;
    let match;
    
    while ((match = queryRegex.exec(source)) !== null) {
      const lineNumber = this.getLineNumber(source, match.index);
      
      // Try to extract the query string
      const queryMatch = /document:\s*gql\s*\(\s*r?['"]([^'"]+)['"]\s*\)/g.exec(
        source.substring(match.index, match.index + 500)
      );
      
      if (queryMatch) {
        const query = queryMatch[1];
        const isQuery = query.trim().startsWith('query');
        const method: HttpMethod = isQuery ? 'GET' : 'POST';
        
        const endpoint = this.convertToEndpoint({
          type: 'graphql',
          method,
          url: '/graphql',
          options: { query },
          lineNumber
        });
        
        if (endpoint) {
          endpoint.metadata = {
            ...endpoint.metadata,
            sourceAPI: 'graphql'
          };
          this.endpoints.push(endpoint);
        }
      }
    }
  }

  /**
   * Extract http package options
   */
  private extractHttpOptions(source: string, startIndex: number): any {
    const options: any = {};
    
    // Look for headers parameter
    const headersMatch = /headers:\s*\{([^}]+)\}/g.exec(
      source.substring(startIndex, startIndex + 500)
    );
    
    if (headersMatch) {
      options.headers = this.parseMapLiteral(headersMatch[1]);
    }
    
    // Look for body parameter
    const bodyMatch = /body:\s*(?:jsonEncode\s*\()?([^,)]+)\)?/g.exec(
      source.substring(startIndex, startIndex + 500)
    );
    
    if (bodyMatch) {
      options.body = bodyMatch[1].trim();
    }
    
    return Object.keys(options).length > 0 ? options : null;
  }

  /**
   * Extract dio options
   */
  private extractDioOptions(source: string, startIndex: number): any {
    const options: any = {};
    
    // Look for data parameter
    const dataMatch = /data:\s*([^,)]+)/g.exec(
      source.substring(startIndex, startIndex + 500)
    );
    
    if (dataMatch) {
      options.data = dataMatch[1].trim();
    }
    
    // Look for queryParameters
    const queryMatch = /queryParameters:\s*\{([^}]+)\}/g.exec(
      source.substring(startIndex, startIndex + 500)
    );
    
    if (queryMatch) {
      options.queryParameters = this.parseMapLiteral(queryMatch[1]);
    }
    
    // Look for options parameter
    const optionsMatch = /options:\s*Options\s*\(([^)]+)\)/g.exec(
      source.substring(startIndex, startIndex + 1000)
    );
    
    if (optionsMatch) {
      const optionsStr = optionsMatch[1];
      
      // Extract headers
      const headersMatch = /headers:\s*\{([^}]+)\}/g.exec(optionsStr);
      if (headersMatch) {
        options.headers = this.parseMapLiteral(headersMatch[1]);
      }
      
      // Extract timeout
      const timeoutMatch = /(?:send|receive)Timeout:\s*Duration\s*\(\s*(?:milliseconds|seconds):\s*(\d+)/g.exec(optionsStr);
      if (timeoutMatch) {
        options.timeout = parseInt(timeoutMatch[1]);
      }
    }
    
    return Object.keys(options).length > 0 ? options : null;
  }

  /**
   * Extract dio interceptors
   */
  private extractDioInterceptors(source: string): void {
    // Match dio.interceptors.request.add() or dio.interceptors.response.add()
    const interceptorRegex = /(?:dio|_dio)\.interceptors\.(request|response)\.add\s*\(/g;
    let match;
    
    while ((match = interceptorRegex.exec(source)) !== null) {
      const type = match[1] as 'request' | 'response';
      const lineNumber = this.getLineNumber(source, match.index);
      
      // Try to extract the interceptor class name
      const classMatch = /add\s*\(\s*(\w+)\s*\(\s*\)\s*\)/g.exec(
        source.substring(match.index, match.index + 200)
      );
      
      if (classMatch) {
        const className = classMatch[1];
        
        this.interceptors.push({
          id: `${type}-interceptor-${this.interceptors.length + 1}`,
          name: className,
          type,
          handler: `// ${className} interceptor`,
          priority: this.interceptors.length + 1,
          enabled: true
        });
      }
    }
  }

  /**
   * Parse Dart map literal to object
   */
  private parseMapLiteral(mapStr: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Simple parsing - matches 'key': 'value' or "key": "value"
    const entryRegex = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = entryRegex.exec(mapStr)) !== null) {
      result[match[1]] = match[2];
    }
    
    return result;
  }

  /**
   * Get line number from index
   */
  private getLineNumber(source: string, index: number): number {
    return source.substring(0, index).split('\n').length;
  }

  /**
   * Convert network call info to endpoint
   */
  private convertToEndpoint(callInfo: DartNetworkCallInfo): Endpoint | null {
    const { url, method, options, lineNumber, type } = callInfo;
    
    // Parse URL to extract path params
    const { path, pathParams } = this.parseURL(url);
    
    // Generate endpoint ID and name
    const id = this.generateEndpointId(method, path);
    const name = this.generateEndpointName(method, path);
    
    const endpoint: Endpoint = {
      id,
      name,
      method,
      path,
      pathParams: pathParams.length > 0 ? pathParams : undefined,
      metadata: {
        sourceFramework: 'flutter',
        sourceAPI: type,
        tags: [method.toLowerCase()]
      }
    };
    
    // Extract headers
    if (options?.headers) {
      endpoint.headers = options.headers;
    }
    
    // Extract body (for POST, PUT, PATCH)
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (options?.body || options?.data) {
        endpoint.body = this.parseBody(options.body || options.data);
      }
    }
    
    // Extract query params
    if (options?.queryParameters) {
      endpoint.queryParams = this.parseQueryParams(options.queryParameters);
    }
    
    // Extract timeout
    if (options?.timeout) {
      endpoint.timeout = options.timeout;
    }
    
    return endpoint;
  }

  /**
   * Parse URL to extract path and path parameters
   */
  private parseURL(url: string): { path: string; pathParams: ParamDefinition[] } {
    const pathParams: ParamDefinition[] = [];
    
    // Remove base URL if present
    let path = url;
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    } catch {
      // Not a full URL, treat as path
    }
    
    // Extract path parameters (e.g., /users/$id or /users/:id)
    const paramRegex = /\$\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?|:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;
    
    while ((match = paramRegex.exec(path)) !== null) {
      const paramName = match[1] || match[2];
      pathParams.push({
        name: paramName,
        type: 'string',
        required: true
      });
    }
    
    // Replace Dart string interpolation with :param format
    path = path.replace(/\$\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?/g, ':$1');
    
    return { path, pathParams };
  }

  /**
   * Generate endpoint ID
   */
  private generateEndpointId(method: HttpMethod, path: string): string {
    const cleanPath = path.replace(/[/:]/g, '-').replace(/^-+|-+$/g, '');
    return `${method.toLowerCase()}-${cleanPath}`;
  }

  /**
   * Generate endpoint name
   */
  private generateEndpointName(method: HttpMethod, path: string): string {
    const parts = path.split('/').filter(p => p && !p.startsWith(':'));
    const resource = parts[parts.length - 1] || 'resource';
    
    const methodMap: Record<HttpMethod, string> = {
      'GET': 'get',
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'patch',
      'DELETE': 'delete',
      'HEAD': 'head',
      'OPTIONS': 'options'
    };
    
    const prefix = methodMap[method] || method.toLowerCase();
    const camelResource = resource.charAt(0).toUpperCase() + resource.slice(1);
    
    return `${prefix}${camelResource}`;
  }

  /**
   * Parse request body
   */
  private parseBody(body: any): BodyDefinition {
    if (typeof body === 'string') {
      // Try to detect if it's JSON
      if (body.includes('jsonEncode') || body.includes('{')) {
        return {
          type: 'json',
          required: true
        };
      }
      
      return {
        type: 'raw',
        required: true
      };
    }
    
    if (typeof body === 'object' && body !== null) {
      return {
        type: 'json',
        required: true,
        schema: body
      };
    }
    
    return {
      type: 'raw',
      required: true
    };
  }

  /**
   * Parse query parameters
   */
  private parseQueryParams(params: any): ParamDefinition[] {
    if (typeof params !== 'object' || params === null) {
      return [];
    }
    
    return Object.keys(params).map(key => ({
      name: key,
      type: typeof params[key],
      required: false,
      defaultValue: params[key]
    }));
  }

  /**
   * Build network schema from extracted data
   */
  private buildNetworkSchema(): NetworkSchema {
    // Determine base configuration based on detected libraries
    let baseConfig = NETWORK_PRESETS.restAPI.config;
    
    if (this.detectedLibraries.has('dio')) {
      // Dio typically uses JSON
      baseConfig = {
        ...baseConfig,
        defaultHeaders: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
    }
    
    return {
      ...baseConfig,
      endpoints: this.endpoints,
      interceptors: this.interceptors.length > 0 ? this.interceptors : undefined,
      metadata: {
        sourceFramework: 'flutter',
        generatedAt: Date.now()
      }
    };
  }
}

/**
 * Parse Flutter network calls from source code
 */
export function parseFlutterNetwork(source: string, filename: string, config?: FlutterNetworkParserConfig): NetworkSchema {
  const parser = new FlutterNetworkParser(config);
  return parser.parse(source, filename);
}
