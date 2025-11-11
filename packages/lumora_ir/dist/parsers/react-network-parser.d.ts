/**
 * React Network Parser
 * Parses React network calls (fetch, axios, React Query) and converts to Network Schema
 */
import * as parser from '@babel/parser';
import { NetworkSchema, HttpMethod } from '../types/network-types';
import { ErrorHandler } from '../errors/error-handler';
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
export declare class ReactNetworkParser {
    private ast;
    private sourceFile;
    private sourceCode;
    private errorHandler;
    private config;
    private endpoints;
    private interceptors;
    private detectedLibraries;
    constructor(config?: ReactNetworkParserConfig);
    parse(source: string, filename: string): NetworkSchema;
    private detectNetworkLibraries;
    private extractNetworkCalls;
    private identifyNetworkCall;
    private parseFetchCall;
    private parseAxiosCall;
    private parseAxiosGenericCall;
    private parseAxiosMethodCall;
    private extractAxiosInterceptors;
    private convertToEndpoint;
    private parseURL;
    private generateEndpointId;
    private generateEndpointName;
    private parseBody;
    private parseQueryParams;
    private buildNetworkSchema;
    private extractStringValue;
    private extractObjectExpression;
    private extractValue;
}
export declare function parseReactNetwork(source: string, filename: string, config?: ReactNetworkParserConfig): NetworkSchema;
