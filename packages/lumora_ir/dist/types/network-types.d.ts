/**
 * Lumora Network Schema Type Definitions
 * Framework-agnostic intermediate representation for network operations
 *
 * This schema supports conversion between:
 * - React: fetch, axios, React Query, SWR
 * - Flutter: http package, dio, GraphQL
 */
/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
/**
 * Request content type
 */
export type ContentType = 'application/json' | 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain' | 'application/xml' | 'application/octet-stream';
/**
 * Response type
 */
export type ResponseType = 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream';
/**
 * Request state for tracking network operations
 */
export type RequestState = 'idle' | 'loading' | 'success' | 'error' | 'cancelled';
/**
 * Cache strategy
 */
export type CacheStrategy = 'no-cache' | 'cache-first' | 'network-first' | 'cache-only' | 'network-only' | 'stale-while-revalidate';
/**
 * Retry strategy
 */
export type RetryStrategy = 'none' | 'exponential' | 'linear' | 'fixed';
/**
 * Main network schema interface
 * Represents the complete network configuration for an application
 */
export interface NetworkSchema {
    /** Base URL for all endpoints */
    baseURL?: string;
    /** Default timeout in milliseconds */
    timeout?: number;
    /** Default headers for all requests */
    defaultHeaders?: Record<string, string>;
    /** API endpoints */
    endpoints: Endpoint[];
    /** Request/response interceptors */
    interceptors?: Interceptor[];
    /** Cache configuration */
    caching?: CacheConfig;
    /** Retry configuration */
    retry?: RetryConfig;
    /** Authentication configuration */
    auth?: AuthConfig;
    /** Metadata */
    metadata?: NetworkMetadata;
}
/**
 * Endpoint definition
 * Represents a single API endpoint
 */
export interface Endpoint {
    /** Unique identifier for the endpoint */
    id: string;
    /** Endpoint name (e.g., 'fetchUsers', 'createPost') */
    name: string;
    /** HTTP method */
    method: HttpMethod;
    /** URL path (can include path parameters like '/users/:id') */
    path: string;
    /** Path parameters */
    pathParams?: ParamDefinition[];
    /** Query parameters */
    queryParams?: ParamDefinition[];
    /** Request headers */
    headers?: Record<string, string>;
    /** Request body schema */
    body?: BodyDefinition;
    /** Response schema */
    response?: ResponseDefinition;
    /** Content type */
    contentType?: ContentType;
    /** Response type */
    responseType?: ResponseType;
    /** Timeout override for this endpoint */
    timeout?: number;
    /** Cache strategy for this endpoint */
    cacheStrategy?: CacheStrategy;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
    /** Retry configuration for this endpoint */
    retry?: RetryConfig;
    /** Whether this endpoint requires authentication */
    requiresAuth?: boolean;
    /** Callbacks */
    callbacks?: EndpointCallbacks;
    /** Metadata */
    metadata?: EndpointMetadata;
}
/**
 * Parameter definition
 */
export interface ParamDefinition {
    /** Parameter name */
    name: string;
    /** Parameter type */
    type: string;
    /** Whether parameter is required */
    required: boolean;
    /** Default value */
    defaultValue?: any;
    /** Validation rules */
    validation?: ValidationRule[];
    /** Description */
    description?: string;
}
/**
 * Validation rule
 */
export interface ValidationRule {
    /** Rule type */
    type: 'min' | 'max' | 'pattern' | 'enum' | 'custom';
    /** Rule value */
    value: any;
    /** Error message */
    message?: string;
}
/**
 * Request body definition
 */
export interface BodyDefinition {
    /** Body type */
    type: 'json' | 'form-data' | 'form-urlencoded' | 'raw' | 'binary';
    /** Body schema (for JSON bodies) */
    schema?: Record<string, any>;
    /** Fields (for form data) */
    fields?: FieldDefinition[];
    /** Whether body is required */
    required?: boolean;
}
/**
 * Field definition for form data
 */
export interface FieldDefinition {
    /** Field name */
    name: string;
    /** Field type */
    type: 'string' | 'number' | 'boolean' | 'file' | 'array';
    /** Whether field is required */
    required: boolean;
    /** Default value */
    defaultValue?: any;
    /** Validation rules */
    validation?: ValidationRule[];
}
/**
 * Response definition
 */
export interface ResponseDefinition {
    /** Success response schema */
    success?: ResponseSchema;
    /** Error response schemas by status code */
    errors?: Record<number, ResponseSchema>;
    /** Response transformation */
    transform?: string;
}
/**
 * Response schema
 */
export interface ResponseSchema {
    /** Status code */
    statusCode: number;
    /** Response body schema */
    schema?: Record<string, any>;
    /** Response headers */
    headers?: Record<string, string>;
    /** Description */
    description?: string;
}
/**
 * Endpoint callbacks
 */
export interface EndpointCallbacks {
    /** Called before request is sent */
    onRequest?: string;
    /** Called when request succeeds */
    onSuccess?: string;
    /** Called when request fails */
    onError?: string;
    /** Called when request completes (success or error) */
    onComplete?: string;
    /** Called when request is cancelled */
    onCancel?: string;
    /** Called on upload progress (for file uploads) */
    onUploadProgress?: string;
    /** Called on download progress (for file downloads) */
    onDownloadProgress?: string;
}
/**
 * Endpoint metadata
 */
export interface EndpointMetadata {
    /** Source framework where endpoint was defined */
    sourceFramework?: 'react' | 'flutter';
    /** Original API library used */
    sourceAPI?: string;
    /** Tags for categorization */
    tags?: string[];
    /** Documentation URL */
    documentation?: string;
    /** Whether endpoint is deprecated */
    deprecated?: boolean;
    /** Rate limit information */
    rateLimit?: RateLimitInfo;
}
/**
 * Rate limit information
 */
export interface RateLimitInfo {
    /** Maximum requests per window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
    /** What to do when limit is exceeded */
    onExceeded?: 'queue' | 'reject' | 'retry';
}
/**
 * Interceptor definition
 * Middleware for request/response processing
 */
export interface Interceptor {
    /** Interceptor ID */
    id: string;
    /** Interceptor name */
    name: string;
    /** Interceptor type */
    type: 'request' | 'response' | 'error';
    /** Handler function code */
    handler: string;
    /** Priority (lower numbers run first) */
    priority?: number;
    /** Whether interceptor is enabled */
    enabled?: boolean;
    /** Conditions for when to apply interceptor */
    conditions?: InterceptorCondition[];
}
/**
 * Interceptor condition
 */
export interface InterceptorCondition {
    /** Condition type */
    type: 'endpoint' | 'method' | 'path' | 'header' | 'custom';
    /** Condition value */
    value: any;
    /** Operator */
    operator?: 'equals' | 'contains' | 'matches' | 'startsWith' | 'endsWith';
}
/**
 * Cache configuration
 */
export interface CacheConfig {
    /** Whether caching is enabled */
    enabled: boolean;
    /** Default cache strategy */
    defaultStrategy?: CacheStrategy;
    /** Default TTL in milliseconds */
    defaultTTL?: number;
    /** Maximum cache size in bytes */
    maxSize?: number;
    /** Cache storage type */
    storage?: 'memory' | 'disk' | 'hybrid';
    /** Cache key generation strategy */
    keyStrategy?: 'url' | 'custom';
    /** Custom cache key generator */
    keyGenerator?: string;
    /** Cache invalidation rules */
    invalidation?: CacheInvalidationRule[];
}
/**
 * Cache invalidation rule
 */
export interface CacheInvalidationRule {
    /** Rule type */
    type: 'time' | 'mutation' | 'manual' | 'pattern';
    /** Rule configuration */
    config: any;
}
/**
 * Retry configuration
 */
export interface RetryConfig {
    /** Whether retry is enabled */
    enabled: boolean;
    /** Retry strategy */
    strategy: RetryStrategy;
    /** Maximum number of retry attempts */
    maxAttempts: number;
    /** Initial delay in milliseconds */
    initialDelay?: number;
    /** Maximum delay in milliseconds */
    maxDelay?: number;
    /** Backoff multiplier (for exponential strategy) */
    backoffMultiplier?: number;
    /** HTTP status codes to retry */
    retryableStatusCodes?: number[];
    /** Whether to retry on network errors */
    retryOnNetworkError?: boolean;
    /** Whether to retry on timeout */
    retryOnTimeout?: boolean;
    /** Custom retry condition */
    retryCondition?: string;
}
/**
 * Authentication configuration
 */
export interface AuthConfig {
    /** Authentication type */
    type: 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth' | 'custom';
    /** Token storage location */
    tokenStorage?: 'memory' | 'localStorage' | 'sessionStorage' | 'secure';
    /** Token header name */
    tokenHeader?: string;
    /** Token prefix (e.g., 'Bearer ') */
    tokenPrefix?: string;
    /** Refresh token configuration */
    refreshToken?: RefreshTokenConfig;
    /** Login endpoint */
    loginEndpoint?: string;
    /** Logout endpoint */
    logoutEndpoint?: string;
    /** Token validation endpoint */
    validateEndpoint?: string;
}
/**
 * Refresh token configuration
 */
export interface RefreshTokenConfig {
    /** Whether refresh token is enabled */
    enabled: boolean;
    /** Refresh endpoint */
    endpoint: string;
    /** Refresh token header name */
    tokenHeader?: string;
    /** When to refresh (time before expiry in ms) */
    refreshBeforeExpiry?: number;
    /** Whether to refresh automatically */
    autoRefresh?: boolean;
}
/**
 * Network metadata
 */
export interface NetworkMetadata {
    /** Source framework */
    sourceFramework?: 'react' | 'flutter';
    /** API specification format */
    specFormat?: 'openapi' | 'graphql' | 'custom';
    /** API version */
    apiVersion?: string;
    /** Generated at timestamp */
    generatedAt?: number;
}
/**
 * Network request state
 * Runtime state for tracking network requests
 */
export interface NetworkRequestState {
    /** Endpoint ID */
    endpointId: string;
    /** Request ID (unique per request) */
    requestId: string;
    /** Current state */
    state: RequestState;
    /** Request data */
    request?: {
        url: string;
        method: HttpMethod;
        headers: Record<string, string>;
        body?: any;
    };
    /** Response data */
    response?: {
        status: number;
        statusText: string;
        headers: Record<string, string>;
        data: any;
    };
    /** Error information */
    error?: {
        message: string;
        code?: string;
        statusCode?: number;
        details?: any;
    };
    /** Timing information */
    timing?: {
        startTime: number;
        endTime?: number;
        duration?: number;
    };
    /** Retry information */
    retryInfo?: {
        attempt: number;
        maxAttempts: number;
        nextRetryAt?: number;
    };
    /** Cache information */
    cacheInfo?: {
        hit: boolean;
        key?: string;
        expiresAt?: number;
    };
}
/**
 * Network client configuration
 * Runtime configuration for the network client
 */
export interface NetworkClientConfig {
    /** Network schema */
    schema: NetworkSchema;
    /** Whether to enable logging */
    logging?: boolean;
    /** Log level */
    logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
    /** Whether to enable metrics */
    metrics?: boolean;
    /** Custom error handler */
    errorHandler?: string;
    /** Custom request transformer */
    requestTransformer?: string;
    /** Custom response transformer */
    responseTransformer?: string;
}
/**
 * Common network presets
 * Pre-configured network patterns
 */
export interface NetworkPreset {
    /** Preset name */
    name: string;
    /** Preset description */
    description?: string;
    /** Network configuration */
    config: Partial<NetworkSchema>;
}
/**
 * Common network presets
 */
export declare const NETWORK_PRESETS: Record<string, NetworkPreset>;
/**
 * WebSocket configuration
 * For real-time communication
 */
export interface WebSocketConfig {
    /** WebSocket URL */
    url: string;
    /** Protocols */
    protocols?: string[];
    /** Reconnection configuration */
    reconnect?: {
        enabled: boolean;
        maxAttempts: number;
        delay: number;
        backoffMultiplier?: number;
    };
    /** Heartbeat configuration */
    heartbeat?: {
        enabled: boolean;
        interval: number;
        timeout: number;
        message?: string;
    };
    /** Message handlers */
    handlers?: {
        onOpen?: string;
        onMessage?: string;
        onError?: string;
        onClose?: string;
    };
}
/**
 * GraphQL specific types
 */
export interface GraphQLEndpoint extends Endpoint {
    /** GraphQL operation type */
    operationType: 'query' | 'mutation' | 'subscription';
    /** GraphQL query/mutation string */
    query: string;
    /** Variables schema */
    variables?: Record<string, any>;
    /** Operation name */
    operationName?: string;
}
/**
 * File upload configuration
 */
export interface FileUploadConfig {
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Allowed file types (MIME types) */
    allowedTypes?: string[];
    /** Whether to allow multiple files */
    multiple?: boolean;
    /** Upload chunk size for large files */
    chunkSize?: number;
    /** Whether to enable resumable uploads */
    resumable?: boolean;
}
