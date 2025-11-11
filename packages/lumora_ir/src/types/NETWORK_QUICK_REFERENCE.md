# Network Schema Quick Reference

Quick reference guide for common network patterns in Lumora.

## Basic Patterns

### Simple GET Request

```typescript
{
  id: 'get-users',
  name: 'getUsers',
  method: 'GET',
  path: '/users'
}
```

### GET with Path Parameters

```typescript
{
  id: 'get-user',
  name: 'getUser',
  method: 'GET',
  path: '/users/:id',
  pathParams: [
    { name: 'id', type: 'string', required: true }
  ]
}
```

### GET with Query Parameters

```typescript
{
  id: 'search-users',
  name: 'searchUsers',
  method: 'GET',
  path: '/users/search',
  queryParams: [
    { name: 'q', type: 'string', required: true },
    { name: 'page', type: 'number', required: false, defaultValue: 1 },
    { name: 'limit', type: 'number', required: false, defaultValue: 10 }
  ]
}
```

### POST with JSON Body

```typescript
{
  id: 'create-user',
  name: 'createUser',
  method: 'POST',
  path: '/users',
  body: {
    type: 'json',
    required: true,
    schema: {
      name: 'string',
      email: 'string',
      age: 'number'
    }
  }
}
```

### PUT/PATCH Update

```typescript
{
  id: 'update-user',
  name: 'updateUser',
  method: 'PUT',
  path: '/users/:id',
  pathParams: [
    { name: 'id', type: 'string', required: true }
  ],
  body: {
    type: 'json',
    required: true,
    schema: {
      name: 'string',
      email: 'string'
    }
  }
}
```

### DELETE Request

```typescript
{
  id: 'delete-user',
  name: 'deleteUser',
  method: 'DELETE',
  path: '/users/:id',
  pathParams: [
    { name: 'id', type: 'string', required: true }
  ]
}
```

## Authentication Patterns

### Bearer Token

```typescript
{
  auth: {
    type: 'bearer',
    tokenHeader: 'Authorization',
    tokenPrefix: 'Bearer ',
    tokenStorage: 'secure'
  }
}
```

### API Key

```typescript
{
  auth: {
    type: 'api-key',
    tokenHeader: 'X-API-Key',
    tokenStorage: 'secure'
  }
}
```

### With Token Refresh

```typescript
{
  auth: {
    type: 'bearer',
    tokenHeader: 'Authorization',
    tokenPrefix: 'Bearer ',
    refreshToken: {
      enabled: true,
      endpoint: '/auth/refresh',
      autoRefresh: true,
      refreshBeforeExpiry: 300000 // 5 minutes
    }
  }
}
```

## Caching Patterns

### Cache First (Static Data)

```typescript
{
  cacheStrategy: 'cache-first',
  cacheTTL: 3600000 // 1 hour
}
```

### Network First (Dynamic Data)

```typescript
{
  cacheStrategy: 'network-first',
  cacheTTL: 300000 // 5 minutes
}
```

### Stale While Revalidate

```typescript
{
  cacheStrategy: 'stale-while-revalidate',
  cacheTTL: 600000 // 10 minutes
}
```

### No Cache (Mutations)

```typescript
{
  cacheStrategy: 'no-cache'
}
```

## Retry Patterns

### Exponential Backoff

```typescript
{
  retry: {
    enabled: true,
    strategy: 'exponential',
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
}
```

### Fixed Delay

```typescript
{
  retry: {
    enabled: true,
    strategy: 'fixed',
    maxAttempts: 3,
    initialDelay: 2000
  }
}
```

### Retry on Specific Errors

```typescript
{
  retry: {
    enabled: true,
    strategy: 'exponential',
    maxAttempts: 3,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryOnNetworkError: true,
    retryOnTimeout: true
  }
}
```

## Interceptor Patterns

### Add Auth Token

```typescript
{
  id: 'auth',
  type: 'request',
  priority: 1,
  handler: `
    async function(request) {
      const token = await getToken();
      request.headers['Authorization'] = \`Bearer \${token}\`;
      return request;
    }
  `
}
```

### Transform Response

```typescript
{
  id: 'transform',
  type: 'response',
  priority: 10,
  handler: `
    function(response) {
      response.data = transformKeys(response.data, 'camelCase');
      return response;
    }
  `
}
```

### Handle Errors

```typescript
{
  id: 'error-handler',
  type: 'error',
  priority: 1,
  handler: `
    async function(error) {
      if (error.response?.status === 401) {
        await refreshToken();
        return retryRequest(error.config);
      }
      throw error;
    }
  `
}
```

## File Upload Patterns

### Single File Upload

```typescript
{
  id: 'upload-file',
  method: 'POST',
  path: '/upload',
  contentType: 'multipart/form-data',
  body: {
    type: 'form-data',
    fields: [
      { name: 'file', type: 'file', required: true }
    ]
  },
  callbacks: {
    onUploadProgress: 'handleProgress'
  }
}
```

### Multiple Files with Metadata

```typescript
{
  id: 'upload-files',
  method: 'POST',
  path: '/upload/multiple',
  contentType: 'multipart/form-data',
  body: {
    type: 'form-data',
    fields: [
      { name: 'files', type: 'file', required: true },
      { name: 'folder', type: 'string', required: false },
      { name: 'tags', type: 'array', required: false }
    ]
  }
}
```

## Response Handling Patterns

### Success and Error Schemas

```typescript
{
  response: {
    success: {
      statusCode: 200,
      schema: {
        id: 'string',
        name: 'string',
        email: 'string'
      }
    },
    errors: {
      400: {
        statusCode: 400,
        schema: { error: 'string', message: 'string' },
        description: 'Validation error'
      },
      404: {
        statusCode: 404,
        schema: { error: 'string', message: 'string' },
        description: 'Not found'
      }
    }
  }
}
```

### With Callbacks

```typescript
{
  callbacks: {
    onRequest: 'beforeRequest',
    onSuccess: 'handleSuccess',
    onError: 'handleError',
    onComplete: 'afterRequest'
  }
}
```

## Validation Patterns

### Parameter Validation

```typescript
{
  queryParams: [
    {
      name: 'age',
      type: 'number',
      required: true,
      validation: [
        { type: 'min', value: 0, message: 'Age must be positive' },
        { type: 'max', value: 120, message: 'Age must be realistic' }
      ]
    }
  ]
}
```

### Body Validation

```typescript
{
  body: {
    type: 'json',
    required: true,
    schema: {
      email: 'string',
      password: 'string'
    }
  },
  callbacks: {
    onRequest: `
      function(request) {
        if (!isValidEmail(request.body.email)) {
          throw new Error('Invalid email format');
        }
        if (request.body.password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        return request;
      }
    `
  }
}
```

## Complete Examples

### REST API Configuration

```typescript
const restAPI: NetworkSchema = {
  baseURL: 'https://api.example.com',
  timeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  caching: {
    enabled: true,
    defaultStrategy: 'network-first',
    defaultTTL: 300000
  },
  retry: {
    enabled: true,
    strategy: 'exponential',
    maxAttempts: 3
  },
  endpoints: [
    {
      id: 'get-users',
      name: 'getUsers',
      method: 'GET',
      path: '/users',
      cacheStrategy: 'cache-first'
    },
    {
      id: 'create-user',
      name: 'createUser',
      method: 'POST',
      path: '/users',
      body: {
        type: 'json',
        required: true,
        schema: { name: 'string', email: 'string' }
      }
    }
  ]
};
```

### Authenticated API

```typescript
const authAPI: NetworkSchema = {
  baseURL: 'https://api.example.com',
  auth: {
    type: 'bearer',
    tokenHeader: 'Authorization',
    tokenPrefix: 'Bearer ',
    refreshToken: {
      enabled: true,
      endpoint: '/auth/refresh',
      autoRefresh: true
    }
  },
  interceptors: [
    {
      id: 'auth',
      type: 'request',
      handler: 'addAuthToken'
    },
    {
      id: 'error',
      type: 'error',
      handler: 'handleAuthError'
    }
  ],
  endpoints: [
    {
      id: 'get-profile',
      name: 'getProfile',
      method: 'GET',
      path: '/user/profile',
      requiresAuth: true
    }
  ]
};
```

## Common Presets

### Use REST API Preset

```typescript
import { NETWORK_PRESETS } from '@lumora/ir';

const schema: NetworkSchema = {
  ...NETWORK_PRESETS.restAPI.config,
  baseURL: 'https://api.example.com',
  endpoints: [/* ... */]
};
```

### Available Presets

- `restAPI` - Standard REST API with caching and retry
- `graphQL` - GraphQL API configuration
- `noCache` - No caching enabled
- `aggressive` - Aggressive caching for static content

## Troubleshooting

### Request Timeout

```typescript
// Increase timeout for slow endpoints
{
  timeout: 60000 // 1 minute
}
```

### CORS Issues

```typescript
// Add CORS headers
{
  defaultHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}
```

### Rate Limiting

```typescript
// Handle rate limits
{
  retry: {
    enabled: true,
    retryableStatusCodes: [429],
    strategy: 'exponential',
    maxAttempts: 5,
    maxDelay: 30000
  }
}
```

### Large Payloads

```typescript
// Increase timeout and disable retry
{
  timeout: 120000, // 2 minutes
  retry: { enabled: false }
}
```

## Best Practices Checklist

- ✅ Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- ✅ Define path and query parameters explicitly
- ✅ Add request/response schemas for type safety
- ✅ Configure caching for GET requests
- ✅ Disable caching for mutations (POST, PUT, DELETE)
- ✅ Implement retry logic for transient errors
- ✅ Add authentication for protected endpoints
- ✅ Use interceptors for cross-cutting concerns
- ✅ Handle errors gracefully with error schemas
- ✅ Add validation for user input
- ✅ Set appropriate timeouts
- ✅ Document endpoints with metadata
- ✅ Use callbacks for lifecycle events
- ✅ Monitor upload/download progress for files
- ✅ Implement token refresh for long-lived sessions

## Related Documentation

- [Full Network Schema Documentation](./NETWORK_SCHEMA.md)
- [Network Types](./network-types.ts)
- [IR Types](./ir-types.ts)

## License

MIT License - See LICENSE file for details
