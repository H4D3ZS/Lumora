/**
 * Flutter Network Parser
 * Parses Flutter network calls (http, dio, GraphQL) and converts to Network Schema
 */
import { NetworkSchema, HttpMethod } from '../types/network-types';
import { ErrorHandler } from '../errors/error-handler';
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
export declare class FlutterNetworkParser {
    private sourceFile;
    private sourceCode;
    private errorHandler;
    private config;
    private endpoints;
    private interceptors;
    private detectedLibraries;
    constructor(config?: FlutterNetworkParserConfig);
    /**
     * Parse Flutter/Dart source code to extract network calls
     */
    parse(source: string, filename: string): NetworkSchema;
    /**
     * Detect network libraries used in the code
     */
    private detectNetworkLibraries;
    /**
     * Extract network calls from source code
     */
    private extractNetworkCalls;
    /**
     * Extract http package calls
     */
    private extractHttpCalls;
    /**
     * Extract dio calls
     */
    private extractDioCalls;
    /**
     * Extract GraphQL calls
     */
    private extractGraphQLCalls;
    /**
     * Extract http package options
     */
    private extractHttpOptions;
    /**
     * Extract dio options
     */
    private extractDioOptions;
    /**
     * Extract dio interceptors
     */
    private extractDioInterceptors;
    /**
     * Parse Dart map literal to object
     */
    private parseMapLiteral;
    /**
     * Get line number from index
     */
    private getLineNumber;
    /**
     * Convert network call info to endpoint
     */
    private convertToEndpoint;
    /**
     * Parse URL to extract path and path parameters
     */
    private parseURL;
    /**
     * Generate endpoint ID
     */
    private generateEndpointId;
    /**
     * Generate endpoint name
     */
    private generateEndpointName;
    /**
     * Parse request body
     */
    private parseBody;
    /**
     * Parse query parameters
     */
    private parseQueryParams;
    /**
     * Build network schema from extracted data
     */
    private buildNetworkSchema;
}
/**
 * Parse Flutter network calls from source code
 */
export declare function parseFlutterNetwork(source: string, filename: string, config?: FlutterNetworkParserConfig): NetworkSchema;
