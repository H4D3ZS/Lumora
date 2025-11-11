# Lumora Network Schema Documentation

## Overview

The Lumora Network Schema provides a framework-agnostic intermediate representation for network operations, enabling seamless conversion between React (fetch, axios, React Query) and Flutter (http, dio, GraphQL) network implementations.

## Table of Contents

1. [Core Interfaces](#core-interfaces)
2. [Network Schema](#network-schema)
3. [Endpoint Definition](#endpoint-definition)
4. [Interceptors](#interceptors)
5. [Caching](#caching)
6. [Authentication](#authentication)
7. [Error Handling](#error-handling)
8. [Examples](#examples)
9. [Best Practices](#best-practices)

## Core Interfaces

### NetworkSchema

The root interface that defines the complete network configuration for an application.

```typescript
interface NetworkSchema {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  endpoints: Endpoint[];
  interceptors?: Interceptor[];
  caching?: CacheConfig;
  retry?: RetryConfig;
  auth?: AuthConfig;
  metadata?: NetworkMetadata;
}
```

**Properties:**
- `baseURL`: Base URL prepended to all endpoint paths
- `timeout`: Default timeout in milliseconds (default: 30000)
- `defaultHeaders`: Headers applied to all requests
- `endpoints`: Array of API endpoint definitions
- `interceptors`: Request/response middleware
- `caching`: Cache configuration
- `retry`: Retry configuration
- `auth`: Authentication configuration
- `metadata`: Additional metadata

## Network Schema

### Basic Configuration

```typescript
const networkSchema: NetworkSchema = {
  baseURL: 'https://api.example.com',
  timeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-Version': '1.0'
  },
  endpoints: [
    // ... endpoint definitions
  ],
  caching: {
    enabled: true,
    defaultStrategy: 'network-first',
    defaultTTL: 300000 // 5 minutes
  },
  retry: {
    enabled: true,
    strategy: 'exponential',
    maxAttempts: 3
  }
};
```

## Endpoint Definition

### Basic Endpoint

```typescript
const getUserEndpoint: Endpoint = {
  id: 'get-user',
  name: 'getUser',
  method: 'GET',
  path: '/users/:id',
  pathParams: [
    {
      name: 'id',
      type: 'string',
      required: true
    }
  ],
  response: {
    success: {
      statusCode: 200,
      schema: {
        id: 'string',
        name: 'string',
        email: 'string',
        createdAt: 'string'
      }
    },
    errors: {
      404: {
        statusCode: 404,
        schema: {
          error: 'string',
          message: 'string'
        },
        description: 'User not found'
      }
    }
  },
  callbacks: {
    onSuccess: 'handleUserSuccess',
    onError: 'handleUserError'
  }
};
```

### POST Endpoint with Body

```typescript
const createPostEndpoint: Endpoint = {
  id: 'create-post',
  name: 'createPost',
  method: 'POST',
  path: '/posts',
  body: {
    type: 'json',
    required: true,
    schema: {
      title: 'string',
      content: 'string',
      tags: 'string[]',
      published: 'boolean'
    }
  },
  response: {
    success: {
      statusCode: 201,
      schema: {
        id: 'string',
        title: 'string',
        content: 'string',
        createdAt: 'string'
      }
    }
  },
  requiresAuth: true,
  callbacks: {
    onRequest: 'validatePostData',
    onSuccess: 'handlePostCreated',
    onError: 'handlePostError'
  }
};
```

### Query Parameters

```typescript
const searchEndpoint: Endpoint = {
  id: 'search-posts',
  name: 'searchPosts',
  method: 'GET',
  path: '/posts/search',
  queryParams: [
    {
      name: 'q',
      type: 'string',
      required: true,
      description: 'Search query'
    },
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
      defaultValue: 10,
      validation: [
        {
          type: 'min',
          value: 1,
          message: 'Limit must be at least 1'
        },
        {
          type: 'max',
          value: 100,
          message: 'Limit cannot exceed 100'
        }
      ]
    }
  ],
  cacheStrategy: 'cache-first',
  cacheTTL: 600000 // 10 minutes
};
```

### File Upload

```typescript
const uploadImageEndpoint: Endpoint = {
  id: 'upload-image',
  name: 'uploadImage',
  method: 'POST',
  path: '/images/upload',
  contentType: 'multipart/form-data',
  body: {
    type: 'form-data',
    required: true,
    fields: [
      {
        name: 'image',
        type: 'file',
        required: true,
        validation: [
          {
            type: 'custom',
            value: 'validateImageFile',
            message: 'Invalid image file'
          }
        ]
      },
      {
        name: 'title',
        type: 'string',
        required: false
      },
      {
        name: 'description',
        type: 'string',
        required: false
      }
    ]
  },
  callbacks: {
    onUploadProgress: 'handleUploadProgress',
    onSuccess: 'handleUploadSuccess',
    onError: 'handleUploadError'
  },
  requiresAuth: true
};
```

## Interceptors

### Request Interceptor

```typescript
const authInterceptor: Interceptor = {
  id: 'auth-interceptor',
  name: 'Authentication Interceptor',
  type: 'request',
  priority: 1,
  enabled: true,
  handler: `
    async function(request) {
      const token = await getAuthToken();
      if (token) {
        request.headers['Authorization'] = \`Bearer \${token}\`;
      }
      return request;
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

### Response Interceptor

```typescript
const responseTransformInterceptor: Interceptor = {
  id: 'response-transform',
  name: 'Response Transform Interceptor',
  type: 'response',
  priority: 10,
  handler: `
    function(response) {
      // Transform snake_case to camelCase
      if (response.data && typeof response.data === 'object') {
        response.data = transformKeys(response.data, 'camelCase');
      }
      return response;
    }
  `
};
```

### Error Interceptor

```typescript
const errorInterceptor: Interceptor = {
  id: 'error-handler',
  name: 'Global Error Handler',
  type: 'error',
  priority: 1,
  handler: `
    async function(error) {
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          // Retry the original request
          return retryRequest(error.config);
        } else {
          // Redirect to login
          navigateToLogin();
        }
      }
      
      // Log error
      logError(error);
      
      // Show user-friendly message
      showErrorToast(error.message);
      
      throw error;
    }
  `
};
```

## Caching

### Cache Configuration

```typescript
const cacheConfig: CacheConfig = {
  enabled: true,
  defaultStrategy: 'network-first',
  defaultTTL: 300000, // 5 minutes
  maxSize: 10485760, // 10 MB
  storage: 'hybrid', // Memory + disk
  keyStrategy: 'url',
  invalidation: [
    {
      type: 'mutation',
      config: {
        // Invalidate user cache when user is updated
        mutations: ['updateUser', 'deleteUser'],
        patterns: ['/users/*']
      }
    },
    {
      type: 'time',
      config: {
        // Clear cache every 24 hours
        interval: 86400000
      }
    }
  ]
};
```

### Cache Strategies

**no-cache**: Always fetch from network
```typescript
endpoint.cacheStrategy = 'no-cache';
```

**cache-first**: Use cache if available, otherwise fetch
```typescript
endpoint.cacheStrategy = 'cache-first';
endpoint.cacheTTL = 600000; // 10 minutes
```

**network-first**: Fetch from network, fallback to cache on error
```typescript
endpoint.cacheStrategy = 'network-first';
endpoint.cacheTTL = 300000; // 5 minutes
```

**stale-while-revalidate**: Return cache immediately, fetch in background
```typescript
endpoint.cacheStrategy = 'stale-while-revalidate';
endpoint.cacheTTL = 600000; // 10 minutes
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
const authConfig: AuthConfig = {
  type: 'api-key',
  tokenHeader: 'X-API-Key',
  tokenStorage: 'secure'
};
```

### OAuth Authentication

```typescript
const authConfig: AuthConfig = {
  type: 'oauth',
  tokenStorage: 'secure',
  tokenHeader: 'Authorization',
  tokenPrefix: 'Bearer ',
  refreshToken: {
    enabled: true,
    endpoint: '/oauth/token',
    autoRefresh: true
  }
};
```

## Error Handling

### Retry Configuration

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
    function(error) {
      // Custom retry logic
      return error.code === 'NETWORK_ERROR' || 
             error.response?.status >= 500;
    }
  `
};
```

### Error Response Handling

```typescript
const endpoint: Endpoint = {
  // ... other properties
  response: {
    success: {
      statusCode: 200,
      schema: { /* ... */ }
    },
    errors: {
      400: {
        statusCode: 400,
        schema: {
          error: 'string',
          message: 'string',
          fields: 'object'
        },
        description: 'Validation error'
      },
      401: {
        statusCode: 401,
        schema: {
          error: 'string',
          message: 'string'
        },
        description: 'Unauthorized'
      },
      404: {
        statusCode: 404,
        schema: {
          error: 'string',
          message: 'string'
        },
        description: 'Resource not found'
      },
      500: {
        statusCode: 500,
        schema: {
          error: 'string',
          message: 'string',
          trace: 'string'
        },
        description: 'Internal server error'
      }
    }
  }
};
```

## Examples

### Example 1: Simple REST API

```typescript
const simpleAPI: NetworkSchema = {
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  endpoints: [
    {
      id: 'get-posts',
      name: 'getPosts',
      method: 'GET',
      path: '/posts',
      cacheStrategy: 'cache-first',
      cacheTTL: 300000
    },
    {
      id: 'get-post',
      name: 'getPost',
      method: 'GET',
      path: '/posts/:id',
      pathParams: [
        { name: 'id', type: 'number', required: true }
      ]
    },
    {
      id: 'create-post',
      name: 'createPost',
      method: 'POST',
      path: '/posts',
      body: {
        type: 'json',
        required: true,
        schema: {
          title: 'string',
          body: 'string',
          userId: 'number'
        }
      }
    }
  ]
};
```

### Example 2: Authenticated API with Caching

```typescript
const authenticatedAPI: NetworkSchema = {
  baseURL: 'https://api.myapp.com/v1',
  timeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  auth: {
    type: 'bearer',
    tokenStorage: 'secure',
    tokenHeader: 'Authorization',
    tokenPrefix: 'Bearer ',
    refreshToken: {
      enabled: true,
      endpoint: '/auth/refresh',
      autoRefresh: true
    }
  },
  caching: {
    enabled: true,
    defaultStrategy: 'network-first',
    defaultTTL: 300000,
    storage: 'hybrid'
  },
  retry: {
    enabled: true,
    strategy: 'exponential',
    maxAttempts: 3,
    initialDelay: 1000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  },
  interceptors: [
    {
      id: 'auth-interceptor',
      name: 'Auth Interceptor',
      type: 'request',
      priority: 1,
      handler: 'addAuthToken'
    },
    {
      id: 'error-interceptor',
      name: 'Error Interceptor',
      type: 'error',
      priority: 1,
      handler: 'handleGlobalError'
    }
  ],
  endpoints: [
    {
      id: 'get-profile',
      name: 'getProfile',
      method: 'GET',
      path: '/user/profile',
      requiresAuth: true,
      cacheStrategy: 'cache-first',
      cacheTTL: 600000
    },
    {
      id: 'update-profile',
      name: 'updateProfile',
      method: 'PUT',
      path: '/user/profile',
      requiresAuth: true,
      body: {
        type: 'json',
        required: true,
        schema: {
          name: 'string',
          email: 'string',
          bio: 'string'
        }
      }
    }
  ]
};
```

### Example 3: GraphQL API

```typescript
const graphQLAPI: NetworkSchema = {
  baseURL: 'https://api.example.com/graphql',
  timeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  endpoints: [
    {
      id: 'get-user-query',
      name: 'getUserQuery',
      method: 'POST',
      path: '',
      body: {
        type: 'json',
        required: true,
        schema: {
          query: 'string',
          variables: 'object'
        }
      },
      metadata: {
        sourceAPI: 'graphql',
        tags: ['query', 'user']
      }
    } as GraphQLEndpoint
  ]
};
```

### Example 4: File Upload with Progress

```typescript
const fileUploadAPI: NetworkSchema = {
  baseURL: 'https://api.example.com',
  timeout: 120000, // 2 minutes for large files
  endpoints: [
    {
      id: 'upload-file',
      name: 'uploadFile',
      method: 'POST',
      path: '/files/upload',
      contentType: 'multipart/form-data',
      body: {
        type: 'form-data',
        required: true,
        fields: [
          {
            name: 'file',
            type: 'file',
            required: true
          },
          {
            name: 'folder',
            type: 'string',
            required: false,
            defaultValue: 'uploads'
          }
        ]
      },
      callbacks: {
        onUploadProgress: `
          function(progress) {
            const percent = (progress.loaded / progress.total) * 100;
            updateUploadProgress(percent);
          }
        `,
        onSuccess: 'handleUploadSuccess',
        onError: 'handleUploadError'
      },
      requiresAuth: true
    }
  ]
};
```

## Best Practices

### 1. Use Appropriate Cache Strategies

- **GET requests**: Use `cache-first` or `network-first` for data that doesn't change frequently
- **POST/PUT/DELETE**: Use `no-cache` for mutations
- **Real-time data**: Use `network-only` or `stale-while-revalidate`

### 2. Configure Timeouts Appropriately

- **Standard API calls**: 30 seconds
- **File uploads**: 2-5 minutes
- **Real-time operations**: 5-10 seconds

### 3. Implement Proper Error Handling

- Define error schemas for common status codes (400, 401, 404, 500)
- Use error interceptors for global error handling
- Provide user-friendly error messages

### 4. Use Interceptors Wisely

- Keep interceptors focused on single responsibilities
- Use priority to control execution order
- Add conditions to apply interceptors selectively

### 5. Secure Authentication

- Store tokens securely (use `secure` storage)
- Implement token refresh logic
- Handle 401 errors gracefully

### 6. Optimize Performance

- Enable caching for frequently accessed data
- Use appropriate cache TTLs
- Implement request deduplication
- Use pagination for large datasets

### 7. Handle Rate Limiting

- Configure retry strategies for 429 responses
- Implement exponential backoff
- Add rate limit information to metadata

### 8. Document Endpoints

- Add descriptions to endpoints
- Document request/response schemas
- Include examples in metadata
- Tag endpoints for categorization

### 9. Validate Input

- Add validation rules to parameters
- Validate request bodies before sending
- Provide clear validation error messages

### 10. Monitor and Log

- Enable logging for debugging
- Track request timing
- Monitor error rates
- Log important events (auth, errors, retries)

## Framework Conversion

### React (fetch) → Network Schema

```typescript
// React code
const response = await fetch('https://api.example.com/users/123', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer token123'
  }
});
const data = await response.json();

// Converts to Network Schema
{
  baseURL: 'https://api.example.com',
  endpoints: [{
    id: 'get-user',
    name: 'getUser',
    method: 'GET',
    path: '/users/:id',
    pathParams: [{ name: 'id', type: 'string', required: true }],
    requiresAuth: true
  }]
}
```

### Flutter (http) → Network Schema

```dart
// Flutter code
final response = await http.get(
  Uri.parse('https://api.example.com/users/123'),
  headers: {'Authorization': 'Bearer token123'},
);
final data = jsonDecode(response.body);

// Converts to same Network Schema as above
```

## Related Documentation

- [IR Types](./ir-types.ts)
- [Animation Schema](./ANIMATION_SCHEMA.md)
- [Navigation Types](../navigation/navigation-types.ts)
- [Main README](../../README.md)

## License

MIT License - See LICENSE file for details
