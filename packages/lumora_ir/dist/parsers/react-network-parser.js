"use strict";
/**
 * React Network Parser
 * Parses React network calls (fetch, axios, React Query) and converts to Network Schema
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactNetworkParser = void 0;
exports.parseReactNetwork = parseReactNetwork;
const parser = __importStar(require("@babel/parser"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
const network_types_1 = require("../types/network-types");
const error_handler_1 = require("../errors/error-handler");
class ReactNetworkParser {
    constructor(config = {}) {
        this.ast = null;
        this.sourceFile = '';
        this.sourceCode = '';
        this.endpoints = [];
        this.interceptors = [];
        this.detectedLibraries = new Set();
        this.config = {
            sourceType: 'module',
            plugins: ['jsx', 'typescript', 'decorators-legacy'],
            detectLibraries: true,
            ...config,
        };
        this.errorHandler = config.errorHandler || (0, error_handler_1.getErrorHandler)();
    }
    parse(source, filename) {
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
        }
        catch (error) {
            return this.buildNetworkSchema();
        }
    }
    detectNetworkLibraries(ast) {
        (0, traverse_1.default)(ast, {
            ImportDeclaration: (path) => {
                const source = path.node.source.value;
                if (source === 'axios') {
                    this.detectedLibraries.add('axios');
                }
                else if (source === 'react-query' || source === '@tanstack/react-query') {
                    this.detectedLibraries.add('react-query');
                }
                else if (source === 'swr') {
                    this.detectedLibraries.add('swr');
                }
            }
        });
    }
    extractNetworkCalls(ast) {
        (0, traverse_1.default)(ast, {
            CallExpression: (path) => {
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
    identifyNetworkCall(path) {
        const callee = path.node.callee;
        if (t.isIdentifier(callee) && callee.name === 'fetch') {
            return this.parseFetchCall(path);
        }
        if (this.detectedLibraries.has('axios')) {
            const axiosCall = this.parseAxiosCall(path);
            if (axiosCall)
                return axiosCall;
        }
        return null;
    }
    parseFetchCall(path) {
        const args = path.node.arguments;
        if (args.length === 0)
            return null;
        const url = this.extractStringValue(args[0]);
        if (!url)
            return null;
        let method = 'GET';
        let options = {};
        if (args[1] && t.isObjectExpression(args[1])) {
            const methodProp = args[1].properties.find(p => t.isObjectProperty(p) && t.isIdentifier(p.key) && p.key.name === 'method');
            if (methodProp && t.isObjectProperty(methodProp)) {
                const methodValue = this.extractStringValue(methodProp.value);
                if (methodValue) {
                    method = methodValue.toUpperCase();
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
    parseAxiosCall(path) {
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
    parseAxiosGenericCall(path) {
        const args = path.node.arguments;
        if (args.length === 0)
            return null;
        const configArg = args[0];
        if (!t.isObjectExpression(configArg)) {
            const url = this.extractStringValue(configArg);
            if (url) {
                const config = args[1] && t.isObjectExpression(args[1])
                    ? this.extractObjectExpression(args[1])
                    : {};
                return {
                    type: 'axios',
                    method: config.method?.toUpperCase() || 'GET',
                    url,
                    options: config,
                    lineNumber: path.node.loc?.start.line || 0
                };
            }
            return null;
        }
        const config = this.extractObjectExpression(configArg);
        const url = config.url;
        const method = config.method?.toUpperCase() || 'GET';
        if (!url)
            return null;
        return {
            type: 'axios',
            method,
            url,
            options: config,
            lineNumber: path.node.loc?.start.line || 0
        };
    }
    parseAxiosMethodCall(path, methodName) {
        const args = path.node.arguments;
        if (args.length === 0)
            return null;
        const url = this.extractStringValue(args[0]);
        if (!url)
            return null;
        const method = methodName.toUpperCase();
        let options = {};
        if (['POST', 'PUT', 'PATCH'].includes(method) && args.length >= 2) {
            const dataArg = args[1];
            const configArg = args[2];
            if (t.isObjectExpression(dataArg)) {
                options.data = this.extractObjectExpression(dataArg);
            }
            if (configArg && t.isObjectExpression(configArg)) {
                options = { ...options, ...this.extractObjectExpression(configArg) };
            }
        }
        else if (args.length >= 2 && t.isObjectExpression(args[1])) {
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
    extractAxiosInterceptors(ast) {
        (0, traverse_1.default)(ast, {
            CallExpression: (path) => {
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
                            type: interceptorType,
                            handler: `function(${interceptorType}) { /* handler code */ }`,
                            priority: this.interceptors.length + 1,
                            enabled: true
                        });
                    }
                }
            }
        });
    }
    convertToEndpoint(callInfo) {
        const { url, method, options, lineNumber, type } = callInfo;
        const { path, pathParams } = this.parseURL(url);
        const id = this.generateEndpointId(method, path);
        const name = this.generateEndpointName(method, path);
        const endpoint = {
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
    parseURL(url) {
        const pathParams = [];
        let path = url;
        try {
            const urlObj = new URL(url);
            path = urlObj.pathname;
        }
        catch {
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
    generateEndpointId(method, path) {
        const cleanPath = path.replace(/[/:]/g, '-').replace(/^-+|-+$/g, '');
        return `${method.toLowerCase()}-${cleanPath}`;
    }
    generateEndpointName(method, path) {
        const parts = path.split('/').filter((p) => p && !p.startsWith(':'));
        const resource = parts[parts.length - 1] || 'resource';
        const methodMap = {
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
    parseBody(body) {
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
    parseQueryParams(params) {
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
    buildNetworkSchema() {
        let baseConfig = network_types_1.NETWORK_PRESETS.restAPI.config;
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
    extractStringValue(node) {
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
                    }
                    else {
                        result += '${...}';
                    }
                }
            }
            return result;
        }
        return null;
    }
    extractObjectExpression(node) {
        const result = {};
        for (const prop of node.properties) {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                const key = prop.key.name;
                const value = this.extractValue(prop.value);
                result[key] = value;
            }
        }
        return result;
    }
    extractValue(node) {
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
exports.ReactNetworkParser = ReactNetworkParser;
function parseReactNetwork(source, filename, config) {
    const parser = new ReactNetworkParser(config);
    return parser.parse(source, filename);
}
