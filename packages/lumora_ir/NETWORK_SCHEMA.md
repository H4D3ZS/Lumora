# Network Schema Documentation

## Overview

The Lumora Network Schema provides a framework-agnostic intermediate representation for network operations, enabling seamless conversion between React (fetch, axios, React Query) and Flutter (http, dio, GraphQL) network implementations.

## Core Concepts

### NetworkSchema

The main configuration object that defines all network operations for an application.

```typescript
interface NetworkSchema {
  baseURL?: string;                          // Base URL for all endpoints
  timeout?: number;                          // Default timeout in milliseconds
  defaultHeaders?: Record<string, string>;   // Headers applied to all requests
  endpoints: Endpoint[];                     // API endpoint definitions
  interceptors?: Interceptor[];              // Request/response middleware
  caching?: CacheConfig;                     // Cache configuration
  retry?: RetryConfig;                       // Retry configuration
  auth?: AuthConfig;                         // Authentication configuration
  metadata?: NetworkMetadata;                // Schema metadata
}
```

### Endpoint

Represents a single API endpoint with complete configuration.

```typescript
interface Endpoint {
  id: string;                    // Unique identifier
  name: string;                  // Function name (e.g., 'fetchUsers')
  method: HttpMethod;            // GET, POST, PUT, PATCH, DELETE, etc.
  path: string;                  // URL path with optional params (/users/:id)
  pathParams?: ParamDefinition[];
  queryParams?: ParamDefinition[];
  headers?: Record<string, string>;
  body?: BodyDefinition;
  response?: ResponseDefinition;
  contentType?: ContentType;
  responseType?: ResponseType;
  timeout?: number;
  cacheStrategy?: CacheStrategy;
  cacheTTL?: number;
  retry?: RetryConfig;
  requiresAuth?: boolean;
  callbacks?: EndpointCallbacks;
  metadata?: EndpointMetadata;
}
```

### Interceptor

Middleware for processing requests and responses.

```typescript
interface Interceptor {
  id: string;
  name: string;
  type: 'request' | 'response' | 'error';
  handler: string;               // Function code as string
  priority?: number;             // Lower numbers run first
  enabled?: boolean;
  conditions?: InterceptorCondition[];
}
```

## Usage Examples

### Basic REST API Configuration

```typescript
const networkSchema: NetworkSchema = {
  baseURL: 'https://api.example.com',
  timeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  endpoints: [
    {
      id: 'fetch-users',
      name: 'fetchUsers',
      method: 'GET',
      path: '/users',
      queryParams: [
        {
          name: 'page',
          type: 'number',
          required: false,
          defaultValue: 1
        },
        {
          name: 'limit',
          type: 'number',
          required: false,
          defaultValue: 10
        }
      ],
      response: {
        success: {
          statusCode: 200,
          schema: {
            users: 'User[]',
            total: 'number',
            page: 'number'
          }
        }
      },
      cacheStrategy: 'network-first',
      cacheTTL: 300000 // 5 minutes
    }
  ],
  caching: {
    enabled: true,
    defaultStrategy: 'network-first',
    defaultTTL: 300000,
    storage: 'memory'
  },
  retry: {
    enabled: true,
    strategy: 'exponential',
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryOnNetworkError: true,
    retryOnTimeout: true
  }
};
```

### POST Endpoint with Body

```typescript
const createUserEndpoint: Endpoint = {
  id: 'create-user',
  name: 'createUser',
  method: 'POST',
  path: '/users',
  body: {
    type: 'json',
    schema: {
      name: 'string',
      email: 'string',
      age: 'number'
    },
    required: true
  },
  response: {
    success: {
      statusCode: 201,
      schema: {
        id: 'string',
        name: 'string',
        email: 'string',
        createdAt: 'string'
      }
    },
    errors: {
      400: {
        statusCode: 400,
        schema: {
          error: 'string',
          details: 'any'
        },
        description: 'Invalid request body'
      },
      409: {
        statusCode: 409,
        schema: {
          error: 'string'
        },
        description: 'User already exists'
      }
    }
  },
  requiresAuth: true,
  callbacks: {
    onSuccess: 'handleUserCreated',
    onError: 'handleUserCreationError'
  }
};
```

### Authentication Interceptor

```typescript
const authInterceptor: Interceptor = {
  id: 'auth-interceptor',
  name: 'Add Authentication Token',
  type: 'request',
  priority: 1,
  handler: `
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers['Authorization'] = \`Bearer \${token}\`;
      }
      return config;
    }
  `,
  conditions: [
    {
      type: 'custom',
      value: 'requiresAuth === true'
    }
  ]
};
```

### Error Handling Interceptor

```typescript
const errorInterceptor: Interceptor = {
  id: 'error-interceptor',
  name: 'Handle API Errors',
  type: 'error',
  priority: 10,
  handler: `
    (error) => {
      if (error.response?.status === 401) {
        // Redirect to login
        navigateToLogin();
      } else if (error.response?.status === 403) {
        // Show permission denied message
        showError('Permission denied');
      }
      return Promise.reject(error);
    }
  `
};
```

## Cache Strategies

### Available Strategies

1. **no-cache**: Always fetch from network, never use cache
2. **cache-first**: Use cache if available, otherwise fetch
3. **network-first**: Fetch from network, fallback to cache on error
4. **cache-only**: Only use cache, never fetch
5. **network-only**: Always fetch, never use cache
6. **stale-while-revalidate**: Return cache immediately, fetch in background

### Example Configuration

```typescript
const cacheConfig: CacheConfig = {
  enabled: true,
  defaultStrategy: 'stale-while-revalidate',
  defaultTTL: 600000, // 10 minutes
  maxSize: 10485760, // 10MB
  storage: 'hybrid', // Use memory + disk
  keyStrategy: 'url',
  invalidation: [
    {
      type: 'mutation',
      config: {
        // Invalidate user cache when user is updated
        mutationEndpoints: ['updateUser', 'deleteUser'],
        affectedEndpoints: ['fetchUsers', 'fetchUser']
      }
    }
  ]
};
```

## Retry Configuration

### Retry Strategies

1. **none**: No retry
2. **exponential**: Exponential backoff (1s, 2s, 4s, 8s...)
3. **linear**: Linear backoff (1s, 2s, 3s, 4s...)
4. **fixed**: Fixed delay between retries

### Example Configuration

```typescript
const retryConfig: RetryConfig = {
  enabled: true,
  strategy: 'exponential',
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryOnNetworkError: true,
  retryOnTimeout: true,
  retryCondition: `
    (error) => {
      // Custom retry logic
      return error.code === 'NETWORK_ERROR' || 
             error.response?.status >= 500;
    }
  `
};
```

## Authentication

### Bearer Token Authentication

```typescript
const authConfig: AuthConfig = {
  type: 'bearer',
  tokenStorage: 'secure',
  tokenHeader: 'Authorization',
  tokenPrefix: 'Bearer ',
  refreshToken: {
    enabled: true,
    endpoint: '/auth/refresh',
    tokenHeader: 'X-Refresh-Token',
    refreshBeforeExpiry: 300000, // 5 minutes
    autoRefresh: true
  },
  loginEndpoint: '/auth/login',
  logoutEndpoint: '/auth/logout',
  validateEndpoint: '/auth/validate'
};
```

### API Key Authentication

```typescript
const apiKeyAuth: AuthConfig = {
  type: 'api-key',
  tokenHeader: 'X-API-Key',
  tokenStorage: 'secure'
};
```

## File Upload

### Multipart Form Data

```typescript
const uploadEndpoint: Endpoint = {
  id: 'upload-file',
  name: 'uploadFile',
  method: 'POST',
  path: '/upload',
  contentType: 'multipart/form-data',
  body: {
    type: 'form-data',
    fields: [
      {
        name: 'file',
        type: 'file',
        required: true
      },
      {
        name: 'description',
        type: 'string',
        required: false
      }
    ]
  },
  callbacks: {
    onUploadProgress: 'handleUploadProgress'
  },
  metadata: {
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
      onExceeded: 'queue'
    }
  }
};
```

## GraphQL Support

```typescript
const graphQLEndpoint: GraphQLEndpoint = {
  id: 'fetch-user-posts',
  name: 'fetchUserPosts',
  method: 'POST',
  path: '/graphql',
  operationType: 'query',
  query: `
    query GetUserPosts($userId: ID!, $limit: Int) {
      user(id: $userId) {
        id
        name
        posts(limit: $limit) {
          id
          title
          content
          createdAt
        }
      }
    }
  `,
  variables: {
    userId: 'string',
    limit: 'number'
  },
  operationName: 'GetUserPosts',
  cacheStrategy: 'cache-first',
  cacheTTL: 600000
};
```

## WebSocket Configuration

```typescript
const wsConfig: WebSocketConfig = {
  url: 'wss://api.example.com/ws',
  protocols: ['v1.chat'],
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    delay: 1000,
    backoffMultiplier: 1.5
  },
  heartbeat: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
    message: 'ping'
  },
  handlers: {
    onOpen: 'handleWebSocketOpen',
    onMessage: 'handleWebSocketMessage',
    onError: 'handleWebSocketError',
    onClose: 'handleWebSocketClose'
  }
};
```

## Network Presets

Pre-configured network patterns for common use cases:

### REST API Preset

```typescript
import { NETWORK_PRESETS } from '@lumora/ir';

const schema: NetworkSchema = {
  ...NETWORK_PRESETS.restAPI.config,
  baseURL: 'https://api.example.com',
  endpoints: [/* your endpoints */]
};
```

### GraphQL Preset

```typescript
const schema: NetworkSchema = {
  ...NETWORK_PRESETS.graphQL.config,
  baseURL: 'https://api.example.com/graphql',
  endpoints: [/* your endpoints */]
};
```

### Aggressive Caching Preset

```typescript
const schema: NetworkSchema = {
  ...NETWORK_PRESETS.aggressive.config,
  baseURL: 'https://api.example.com',
  endpoints: [/* your endpoints */]
};
```

## Runtime State Tracking

The network schema includes runtime state tracking for monitoring requests:

```typescript
interface NetworkRequestState {
  endpointId: string;
  requestId: string;
  state: 'idle' | 'loading' | 'success' | 'error' | 'cancelled';
  request?: {
    url: string;
    method: HttpMethod;
    headers: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
  };
  error?: {
    message: string;
    code?: string;
    statusCode?: number;
    details?: any;
  };
  timing?: {
    startTime: number;
    endTime?: number;
    duration?: number;
  };
  retryInfo?: {
    attempt: number;
    maxAttempts: number;
    nextRetryAt?: number;
  };
  cacheInfo?: {
    hit: boolean;
    key?: string;
    expiresAt?: number;
  };
}
```

## Conversion Examples

### React (fetch) to Network Schema

**React Code:**
```typescript
async function fetchUsers(page = 1) {
  const response = await fetch(`https://api.example.com/users?page=${page}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return response.json();
}
```

**Network Schema:**
```typescript
{
  id: 'fetch-users',
  name: 'fetchUsers',
  method: 'GET',
  path: '/users',
  queryParams: [
    { name: 'page', type: 'number', required: false, defaultValue: 1 }
  ],
  response: {
    success: {
      statusCode: 200,
      schema: { users: 'User[]' }
    }
  }
}
```

### Flutter (dio) to Network Schema

**Flutter Code:**
```dart
Future<List<User>> fetchUsers({int page = 1}) async {
  final dio = Dio();
  final response = await dio.get(
    'https://api.example.com/users',
    queryParameters: {'page': page},
  );
  
  return (response.data['users'] as List)
      .map((json) => User.fromJson(json))
      .toList();
}
```

**Network Schema:**
```typescript
{
  id: 'fetch-users',
  name: 'fetchUsers',
  method: 'GET',
  path: '/users',
  queryParams: [
    { name: 'page', type: 'number', required: false, defaultValue: 1 }
  ],
  response: {
    success: {
      statusCode: 200,
      schema: { users: 'User[]' }
    }
  }
}
```

## Best Practices

### 1. Use Descriptive Endpoint Names

```typescript
// Good
{ id: 'fetch-user-profile', name: 'fetchUserProfile' }

// Bad
{ id: 'get1', name: 'getData' }
```

### 2. Define Response Schemas

Always define expected response schemas for better type safety and validation:

```typescript
response: {
  success: {
    statusCode: 200,
    schema: {
      id: 'string',
      name: 'string',
      email: 'string'
    }
  }
}
```

### 3. Handle Errors Explicitly

Define error responses for common status codes:

```typescript
response: {
  success: { statusCode: 200, schema: { /* ... */ } },
  errors: {
    400: { statusCode: 400, description: 'Invalid request' },
    401: { statusCode: 401, description: 'Unauthorized' },
    404: { statusCode: 404, description: 'Not found' }
  }
}
```

### 4. Use Appropriate Cache Strategies

- **GET requests**: Use `cache-first` or `stale-while-revalidate`
- **POST/PUT/DELETE**: Use `no-cache` or `network-only`
- **Static content**: Use `cache-first` with long TTL

### 5. Implement Retry Logic

Enable retry for idempotent operations:

```typescript
retry: {
  enabled: true,
  strategy: 'exponential',
  maxAttempts: 3,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
}
```

### 6. Use Interceptors for Cross-Cutting Concerns

- Authentication
- Logging
- Error handling
- Request/response transformation

### 7. Validate Parameters

Define validation rules for parameters:

```typescript
queryParams: [
  {
    name: 'email',
    type: 'string',
    required: true,
    validation: [
      {
        type: 'pattern',
        value: '^[^@]+@[^@]+\\.[^@]+$',
        message: 'Invalid email format'
      }
    ]
  }
]
```

## Integration with Lumora IR

The network schema integrates seamlessly with the main Lumora IR:

```typescript
const lumoraIR: LumoraIR = {
  version: '1.0',
  metadata: {
    sourceFramework: 'react',
    sourceFile: 'App.tsx',
    generatedAt: Date.now()
  },
  nodes: [/* UI nodes */],
  network: {
    baseURL: 'https://api.example.com',
    endpoints: [/* endpoints */],
    interceptors: [/* interceptors */],
    caching: {/* cache config */},
    retry: {/* retry config */}
  }
};
```

## Requirements Mapping

This network schema design satisfies the following requirements from the Lumora Engine Completion spec:

- **Requirement 10.1**: Parse React network calls (fetch, axios, React Query)
- **Requirement 10.2**: Parse Flutter network calls (http, dio, GraphQL)
- **Requirement 10.3**: Implement network client with request/response handling
- **Requirement 10.4**: Implement interceptors for cross-cutting concerns
- **Requirement 10.5**: Add loading states and UI updates

## Future Enhancements

- OpenAPI/Swagger import
- GraphQL schema introspection
- WebSocket message schema
- Server-Sent Events (SSE) support
- Request/response mocking for testing
- Network performance monitoring
- Offline queue management
- Request deduplication
