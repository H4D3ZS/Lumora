/**
 * React Network Parser
 * Parses React network calls (fetch, axios, React Query) and converts to Network Schema
 */

import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import {
  NetworkSchema,
  Endpoint,
  HttpMethod,
  ParamDefinition,
  BodyDefinition,
  EndpointCallbacks,
  Interceptor,
  NETWORK_PRESETS
} from '../types/network-types';
import { ErrorHandler, getErrorHandler, ErrorSeverity, ErrorCategory } from '../errors/error-handler';

export interface ReactNetworkParserConfig {
  sourceType?: 'module' | 'script';
  plugins?: parser.ParserPlugin[];
  errorHandler?: ErrorHandler;
  detectLibraries?: boolean;
}

export interface NetworkCallInfo {
  type: 'fetch' | 'axios' | 'react-query' | 'swr' | 'unknown';
  method: HttpMethod;
  url: string;
  options?: any;
  lineNumber: number;
  variableName?: string;
}

export class ReactNetworkParser {
  private ast: t.File | null = null;
  private sourceFile: string = '';
  private sourceCode: string = '';
  private errorHandler: ErrorHandler;
  private config: ReactNetworkParserConfig;
  private endpoints: Endpoint[] = [];
  private interceptors: Interceptor[] = [];
  private detectedLibraries: Set<string> = new Set();

  constructor(config: ReactNetworkParserConfig = {}) {
    this.config = {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
      detectLibraries: true,
      ...config,
    };
    this.errorHandler = config.errorHandler || getErrorHandler();
  }

  parse(source: string, filename: string): NetworkSchema {
    this.sourceFile = filename;
    this.sourceCode = source;
    this.endpoints = [];
    this.interceptors = [];
    this.detectedLibraries.clear();

    try {
      this.ast = parser.parse(source, {
        sourceType: this.config.sourceType,
        plugins: this.config.plugins,
      });
      
      if (this.config.detectLibraries) {
        this.detectNetworkLibraries(this.ast);
      }
      
      this.extractNetworkCalls(this.ast);
      
      if (this.detectedLibraries.has('axios')) {
        this.extractAxiosInterceptors(this.ast);
      }
      
      return this.buildNetworkSchema();
    } catch (error) {
      return this.buildNetworkSchema();
    }
  }

  private detectNetworkLibraries(ast: t.File): void {
    traverse(ast, {
      ImportDeclaration: (path: NodePath<t.ImportDeclaration>) => {
        const source = path.node.source.value;
        if (source === 'axios') {
          this.detectedLibraries.add('axios');
        } else if (source === 'react-query' || source === '@tanstack/react-query') {
          this.detectedLibraries.add('react-query');
        } else if (source === 'swr') {
          this.detectedLibraries.add('swr');
        }
      }
    });
  }

  private extractNetworkCalls(ast: t.File): void {
    traverse(ast, {
      CallExpression: (path: NodePath<t.CallExpression>) => {
        const callInfo = this.identifyNetworkCall(path);
        if (callInfo) {
          const endpoint = this.convertToEndpoint(callInfo);
          if (endpoint) {
            this.endpoints.push(endpoint);
          }
        }
      }
    });
  }

  private identifyNetworkCall(path: NodePath<t.CallExpression>): NetworkCallInfo | null {
    const callee = path.node.callee;
    
    if (t.isIdentifier(callee) && callee.name === 'fetch') {
      return this.parseFetchCall(path);
    }
    
    if (this.detectedLibraries.has('axios')) {
      const axiosCall = this.parseAxiosCall(path);
      if (axiosCall) return axiosCall;
    }
    
    return null;
  }

  private parseFetchCall(path: NodePath<t.CallExpression>): NetworkCallInfo | null {
    const args = path.node.arguments;
    if (args.length === 0) return null;
    
    const url = this.extractStringValue(args[0]);
    if (!url) return null;
    
    let method: HttpMethod = 'GET';
    let options: any = {};
    
    if (args[1] && t.isObjectExpression(args[1])) {
      const methodProp = args[1].properties.find(
        p => t.isObjectProperty(p) && t.isIdentifier(p.key) && p.key.name === 'method'
      );
      
      if (methodProp && t.isObjectProperty(methodProp)) {
        const methodValue = this.extractStringValue(methodProp.value);
        if (methodValue) {
          method = methodValue.toUpperCase() as HttpMethod;
        }
      }
      
      options = this.extractObjectExpression(args[1]);
    }
    
    return {
      type: 'fetch',
      method,
      url,
      options,
      lineNumber: path.node.loc?.start.line || 0
    };
  }

  private parseAxiosCall(path: NodePath<t.CallExpression>): NetworkCallInfo | null {
    const callee = path.node.callee;
    
    if (t.isIdentifier(callee) && callee.name === 'axios') {
      return this.parseAxiosGenericCall(path);
    }
    
    if (t.isMemberExpression(callee) && 
        t.isIdentifier(callee.object) && callee.object.name === 'axios' &&
        t.isIdentifier(callee.property)) {
      return this.parseAxiosMethodCall(path, callee.property.name);
    }
    
    return null;
  }

  private parseAxiosGenericCall(path: NodePath<t.CallExpression>): NetworkCallInfo | null {
    const args = path.node.arguments;
    if (args.length === 0) return null;
    
    const configArg = args[0];
    if (!t.isObjectExpression(configArg)) {
      const url = this.extractStringValue(configArg);
      if (url) {
        const config = args[1] && t.isObjectExpression(args[1]) 
          ? this.extractObjectExpression(args[1]) 
          : {};
        return {
          type: 'axios',
          method: (config.method?.toUpperCase() as HttpMethod) || 'GET',
          url,
          options: config,
          lineNumber: path.node.loc?.start.line || 0
        };
      }
      return null;
    }
    
    const config = this.extractObjectExpression(configArg);
    const url = config.url;
    const method = (config.method?.toUpperCase() as HttpMethod) || 'GET';
    
    if (!url) return null;
    
    return {
      type: 'axios',
      method,
      url,
      options: config,
      lineNumber: path.node.loc?.start.line || 0
    };
  }

  private parseAxiosMethodCall(path: NodePath<t.CallExpression>, methodName: string): NetworkCallInfo | null {
    const args = path.node.arguments;
    if (args.length === 0) return null;
    
    const url = this.extractStringValue(args[0]);
    if (!url) return null;
    
    const method = methodName.toUpperCase() as HttpMethod;
    let options: any = {};
    
    if (['POST', 'PUT', 'PATCH'].includes(method) && args.length >= 2) {
      const dataArg = args[1];
      const configArg = args[2];
      
      if (t.isObjectExpression(dataArg)) {
        options.data = this.extractObjectExpression(dataArg);
      }
      
      if (configArg && t.isObjectExpression(configArg)) {
        options = { ...options, ...this.extractObjectExpression(configArg) };
      }
    } else if (args.length >= 2 && t.isObjectExpression(args[1])) {
      options = this.extractObjectExpression(args[1]);
    }
    
    return {
      type: 'axios',
      method,
      url,
      options,
      lineNumber: path.node.loc?.start.line || 0
    };
  }

  private extractAxiosInterceptors(ast: t.File): void {
    traverse(ast, {
      CallExpression: (path: NodePath<t.CallExpression>) => {
        const callee = path.node.callee;
        
        if (t.isMemberExpression(callee) && 
            t.isMemberExpression(callee.object) &&
            t.isMemberExpression(callee.object.object) &&
            t.isIdentifier(callee.object.object.object) &&
            callee.object.object.object.name === 'axios' &&
            t.isIdentifier(callee.object.object.property) &&
            callee.object.object.property.name === 'interceptors' &&
            t.isIdentifier(callee.property) &&
            callee.property.name === 'use') {
          
          const interceptorType = t.isIdentifier(callee.object.property) 
            ? callee.object.property.name 
            : null;
          
          if (interceptorType === 'request' || interceptorType === 'response') {
            this.interceptors.push({
              id: `${interceptorType}-interceptor-${this.interceptors.length + 1}`,
              name: `${interceptorType.charAt(0).toUpperCase() + interceptorType.slice(1)} Interceptor`,
              type: interceptorType as 'request' | 'response',
              handler: `function(${interceptorType}) { /* handler code */ }`,
              priority: this.interceptors.length + 1,
              enabled: true
            });
          }
        }
      }
    });
  }

  private convertToEndpoint(callInfo: NetworkCallInfo): Endpoint | null {
    const { url, method, options, lineNumber, type } = callInfo;
    
    const { path, pathParams } = this.parseURL(url);
    
    const id = this.generateEndpointId(method, path);
    const name = this.generateEndpointName(method, path);
    
    const endpoint: Endpoint = {
      id,
      name,
      method,
      path,
      pathParams: pathParams.length > 0 ? pathParams : undefined,
      metadata: {
        sourceFramework: 'react',
        sourceAPI: type,
        tags: [method.toLowerCase()]
      }
    };
    
    if (options?.headers) {
      endpoint.headers = options.headers;
    }
    
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (options?.body || options?.data) {
        endpoint.body = this.parseBody(options.body || options.data);
      }
    }
    
    if (options?.params) {
      endpoint.queryParams = this.parseQueryParams(options.params);
    }
    
    if (options?.timeout) {
      endpoint.timeout = options.timeout;
    }
    
    return endpoint;
  }

  private parseURL(url: string): { path: string; pathParams: ParamDefinition[] } {
    const pathParams: ParamDefinition[] = [];
    
    let path = url;
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    } catch {
      // Not a full URL, treat as path
    }
    
    const paramRegex = /\$\{([^}]+)\}|:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;
    
    while ((match = paramRegex.exec(path)) !== null) {
      const paramName = match[1] || match[2];
      pathParams.push({
        name: paramName,
        type: 'string',
        required: true
      });
    }
    
    path = path.replace(/\$\{([^}]+)\}/g, ':$1');
    
    return { path, pathParams };
  }

  private generateEndpointId(method: HttpMethod, path: string): string {
    const cleanPath = path.replace(/[/:]/g, '-').replace(/^-+|-+$/g, '');
    return `${method.toLowerCase()}-${cleanPath}`;
  }

  private generateEndpointName(method: HttpMethod, path: string): string {
    const parts = path.split('/').filter((p: string) => p && !p.startsWith(':'));
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

  private parseBody(body: any): BodyDefinition {
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

  private buildNetworkSchema(): NetworkSchema {
    let baseConfig = NETWORK_PRESETS.restAPI.config;
    
    if (this.detectedLibraries.has('axios')) {
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
        sourceFramework: 'react',
        generatedAt: Date.now()
      }
    };
  }

  private extractStringValue(node: t.Node): string | null {
    if (t.isStringLiteral(node)) {
      return node.value;
    }
    if (t.isTemplateLiteral(node)) {
      let result = '';
      for (let i = 0; i < node.quasis.length; i++) {
        result += node.quasis[i].value.raw;
        if (i < node.expressions.length) {
          const expr = node.expressions[i];
          if (t.isIdentifier(expr)) {
            result += `\${${expr.name}}`;
          } else {
            result += '${...}';
          }
        }
      }
      return result;
    }
    return null;
  }

  private extractObjectExpression(node: t.ObjectExpression): any {
    const result: any = {};
    
    for (const prop of node.properties) {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        const key = prop.key.name;
        const value = this.extractValue(prop.value);
        result[key] = value;
      }
    }
    
    return result;
  }

  private extractValue(node: t.Node): any {
    if (t.isStringLiteral(node)) {
      return node.value;
    }
    if (t.isNumericLiteral(node)) {
      return node.value;
    }
    if (t.isBooleanLiteral(node)) {
      return node.value;
    }
    if (t.isNullLiteral(node)) {
      return null;
    }
    if (t.isObjectExpression(node)) {
      return this.extractObjectExpression(node);
    }
    if (t.isArrayExpression(node)) {
      return node.elements.map(el => el ? this.extractValue(el) : null);
    }
    if (t.isIdentifier(node)) {
      return node.name;
    }
    if (t.isTemplateLiteral(node)) {
      return this.extractStringValue(node);
    }
    return undefined;
  }
}

export function parseReactNetwork(source: string, filename: string, config?: ReactNetworkParserConfig): NetworkSchema {
  const parser = new ReactNetworkParser(config);
  return parser.parse(source, filename);
}
