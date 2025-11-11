# Network Runtime Implementation

## Overview

The network runtime support provides a complete HTTP client implementation for the Lumora Flutter dev client. It enables network requests defined in the Lumora IR schema to be executed with proper error handling, retry logic, and loading state management.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Schema Interpreter                        │
│  (Parses network definitions from Lumora IR)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Network Manager                           │
│  - Request state tracking                                    │
│  - Loading state management                                  │
│  - Request lifecycle management                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Network Client                            │
│  - HTTP request execution                                    │
│  - Interceptor support                                       │
│  - Retry logic                                               │
│  - Error handling                                            │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. NetworkClient

Low-level HTTP client that handles:
- Making HTTP requests (GET, POST, PUT, PATCH, DELETE)
- Request/response interceptors
- Automatic retry with exponential backoff
- Timeout handling
- Error handling

**Key Features:**
- Configurable base URL and default headers
- Support for request/response/error interceptors
- Automatic retry on network errors and specific status codes
- JSON encoding/decoding
- Timeout support

### 2. NetworkManager

High-level manager that provides:
- Request state tracking (idle, loading, success, error, cancelled)
- Loading state queries
- Request cancellation
- Integration with Flutter's ChangeNotifier for reactive UI updates

**Key Features:**
- Track all network requests with unique IDs
- Query loading state for specific endpoints
- Cancel pending requests
- Notify listeners on state changes
- Request history management

### 3. Loading Widgets

UI components for displaying network states:
- `LoadingIndicator` - Simple circular progress indicator
- `LoadingOverlay` - Full-screen loading overlay
- `NetworkStateBuilder` - Builder widget for different network states
- `NetworkStateWidget` - Simplified state widget with defaults
- `ErrorDisplay` - Error display with retry option
- `LoadingButton` - Button with loading state
- `NetworkProgressBar` - Top progress bar for loading indication
- `ShimmerLoading` - Shimmer effect placeholder
- `ListShimmerLoading` - List of shimmer placeholders

## Usage Examples

### Basic GET Request

```dart
import 'package:flutter_dev_client/interpreter/network_manager.dart';
import 'package:flutter_dev_client/interpreter/network_client.dart';

// Create network manager
final networkManager = NetworkManager(
  baseURL: 'https://api.example.com',
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
);

// Execute GET request
try {
  final response = await networkManager.get<Map<String, dynamic>>(
    'fetch-users',
    '/users',
    queryParams: {'page': 1, 'limit': 10},
  );
  
  print('Users: ${response.data}');
} on NetworkError catch (error) {
  print('Error: ${error.message}');
}
```

### POST Request with Body

```dart
final response = await networkManager.post<Map<String, dynamic>>(
  'create-user',
  '/users',
  body: {
    'name': 'John Doe',
    'email': 'john@example.com',
  },
);

if (response.isSuccess) {
  print('User created: ${response.data}');
}
```

### Using NetworkStateWidget

```dart
import 'package:flutter/material.dart';
import 'package:flutter_dev_client/widgets/loading_widgets.dart';

class UserListScreen extends StatelessWidget {
  final NetworkManager networkManager;

  const UserListScreen({required this.networkManager});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Users')),
      body: NetworkStateWidget<List<dynamic>>(
        networkManager: networkManager,
        endpointId: 'fetch-users',
        builder: (context, users) {
          return ListView.builder(
            itemCount: users.length,
            itemBuilder: (context, index) {
              final user = users[index];
              return ListTile(
                title: Text(user['name']),
                subtitle: Text(user['email']),
              );
            },
          );
        },
        loadingWidget: const ListShimmerLoading(),
        onError: (error) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: ${error.message}')),
          );
        },
      ),
    );
  }
}
```

### Custom State Builder

```dart
NetworkStateBuilder<Map<String, dynamic>>(
  networkManager: networkManager,
  endpointId: 'fetch-user-profile',
  onIdle: (context) => const Text('Tap to load profile'),
  onLoading: (context) => const LoadingIndicator(message: 'Loading profile...'),
  onSuccess: (context, data) {
    return Column(
      children: [
        Text('Name: ${data['name']}'),
        Text('Email: ${data['email']}'),
      ],
    );
  },
  onError: (context, error) {
    return ErrorDisplay(
      error: error,
      onRetry: () {
        // Retry the request
        networkManager.get('fetch-user-profile', '/profile');
      },
    );
  },
)
```

### Request Interceptors

```dart
// Add authentication token to all requests
networkManager.addRequestInterceptor((request) {
  final token = getAuthToken();
  if (token != null && request.requiresAuth) {
    return NetworkRequest(
      url: request.url,
      method: request.method,
      headers: {
        ...?request.headers,
        'Authorization': 'Bearer $token',
      },
      body: request.body,
      timeout: request.timeout,
      requiresAuth: request.requiresAuth,
    );
  }
  return request;
});

// Log all requests
networkManager.addRequestInterceptor((request) {
  print('Request: ${request.method.name.toUpperCase()} ${request.url}');
  return request;
});
```

### Response Interceptors

```dart
// Log all responses
networkManager.addResponseInterceptor((response) {
  print('Response: ${response.statusCode} - ${response.statusText}');
  return response;
});

// Transform response data
networkManager.addResponseInterceptor((response) {
  if (response.data is Map<String, dynamic>) {
    final data = response.data as Map<String, dynamic>;
    // Add timestamp to all responses
    data['_receivedAt'] = DateTime.now().toIso8601String();
  }
  return response;
});
```

### Error Interceptors

```dart
// Handle authentication errors
networkManager.addErrorInterceptor((error) {
  if (error.statusCode == 401) {
    // Redirect to login
    navigateToLogin();
  }
  return error;
});

// Log all errors
networkManager.addErrorInterceptor((error) {
  print('Network Error: ${error.message}');
  if (error.statusCode != null) {
    print('Status Code: ${error.statusCode}');
  }
  return error;
});
```

### Retry Configuration

```dart
final networkManager = NetworkManager(
  baseURL: 'https://api.example.com',
  retryConfig: RetryConfig(
    enabled: true,
    maxAttempts: 3,
    initialDelay: Duration(seconds: 1),
    maxDelay: Duration(seconds: 10),
    backoffMultiplier: 2.0,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryOnNetworkError: true,
    retryOnTimeout: true,
  ),
);
```

### Loading Button

```dart
class SubmitButton extends StatefulWidget {
  final NetworkManager networkManager;

  const SubmitButton({required this.networkManager});

  @override
  State<SubmitButton> createState() => _SubmitButtonState();
}

class _SubmitButtonState extends State<SubmitButton> {
  bool _isLoading = false;

  Future<void> _handleSubmit() async {
    setState(() => _isLoading = true);

    try {
      await widget.networkManager.post(
        'submit-form',
        '/submit',
        body: {'data': 'value'},
      );
      
      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Submitted successfully')),
      );
    } catch (error) {
      // Show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $error')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LoadingButton(
      onPressed: _handleSubmit,
      isLoading: _isLoading,
      child: const Text('Submit'),
    );
  }
}
```

### Progress Bar

```dart
Scaffold(
  appBar: AppBar(
    title: const Text('My App'),
    bottom: PreferredSize(
      preferredSize: const Size.fromHeight(4),
      child: NetworkProgressBar(
        networkManager: networkManager,
        // Show progress for all requests
      ),
    ),
  ),
  body: MyContent(),
)
```

### Request Cancellation

```dart
// Cancel a specific request
networkManager.cancelRequest('request-id-123');

// Cancel all requests for an endpoint
networkManager.cancelEndpointRequests('fetch-users');

// Clear completed requests
networkManager.clearCompletedRequests();

// Clear all requests
networkManager.clearRequests();
```

### Checking Loading State

```dart
// Check if any request is loading
if (networkManager.hasLoadingRequests) {
  print('Some request is loading');
}

// Check if specific endpoint is loading
if (networkManager.isEndpointLoading('fetch-users')) {
  print('Users are loading');
}

// Get all requests for an endpoint
final requests = networkManager.getRequestsForEndpoint('fetch-users');
for (final request in requests) {
  print('Request ${request.requestId}: ${request.state.name}');
}
```

## Integration with Schema Interpreter

The network manager can be integrated with the schema interpreter to execute network requests defined in the Lumora IR:

```dart
class SchemaInterpreter {
  final NetworkManager networkManager;

  SchemaInterpreter({required this.networkManager});

  Future<void> executeNetworkAction(Map<String, dynamic> action) async {
    final endpointId = action['endpointId'] as String;
    final method = action['method'] as String;
    final url = action['url'] as String;
    final headers = action['headers'] as Map<String, String>?;
    final body = action['body'];

    switch (method.toUpperCase()) {
      case 'GET':
        await networkManager.get(endpointId, url, headers: headers);
        break;
      case 'POST':
        await networkManager.post(endpointId, url, headers: headers, body: body);
        break;
      case 'PUT':
        await networkManager.put(endpointId, url, headers: headers, body: body);
        break;
      case 'PATCH':
        await networkManager.patch(endpointId, url, headers: headers, body: body);
        break;
      case 'DELETE':
        await networkManager.delete(endpointId, url, headers: headers, body: body);
        break;
    }
  }
}
```

## Error Handling

The network runtime provides comprehensive error handling:

### Error Types

1. **HTTP Errors** - Status codes 4xx and 5xx
2. **Network Errors** - Connection failures, DNS errors
3. **Timeout Errors** - Request exceeds timeout duration
4. **Unknown Errors** - Unexpected errors

### Error Information

Each `NetworkError` includes:
- `message` - Human-readable error message
- `code` - Error code (HTTP_ERROR, NETWORK_ERROR, TIMEOUT, etc.)
- `statusCode` - HTTP status code (if applicable)
- `details` - Additional error details
- `stackTrace` - Stack trace for debugging

### Handling Errors

```dart
try {
  final response = await networkManager.get('fetch-data', '/data');
  // Handle success
} on NetworkError catch (error) {
  switch (error.code) {
    case 'HTTP_ERROR':
      if (error.statusCode == 404) {
        print('Resource not found');
      } else if (error.statusCode == 500) {
        print('Server error');
      }
      break;
    case 'NETWORK_ERROR':
      print('Network connection failed');
      break;
    case 'TIMEOUT':
      print('Request timed out');
      break;
    default:
      print('Unknown error: ${error.message}');
  }
}
```

## Performance Considerations

1. **Request Deduplication** - Consider implementing request deduplication for identical concurrent requests
2. **Caching** - Implement response caching for GET requests
3. **Request Pooling** - Reuse HTTP client connections
4. **Memory Management** - Clear old request history periodically
5. **Cancellation** - Cancel requests when widgets are disposed

## Testing

### Unit Tests

```dart
test('NetworkClient makes GET request', () async {
  final client = NetworkClient(baseURL: 'https://api.example.com');
  
  final response = await client.request(
    NetworkRequest(
      url: '/users',
      method: HttpMethod.get,
    ),
  );
  
  expect(response.isSuccess, true);
  expect(response.statusCode, 200);
});

test('NetworkManager tracks request state', () async {
  final manager = NetworkManager(baseURL: 'https://api.example.com');
  
  expect(manager.hasLoadingRequests, false);
  
  final future = manager.get('test', '/users');
  expect(manager.hasLoadingRequests, true);
  
  await future;
  expect(manager.hasLoadingRequests, false);
});
```

### Widget Tests

```dart
testWidgets('NetworkStateWidget shows loading state', (tester) async {
  final manager = NetworkManager(baseURL: 'https://api.example.com');
  
  await tester.pumpWidget(
    MaterialApp(
      home: NetworkStateWidget(
        networkManager: manager,
        endpointId: 'test',
        builder: (context, data) => Text('Data: $data'),
      ),
    ),
  );
  
  // Start request
  manager.get('test', '/data');
  await tester.pump();
  
  // Should show loading
  expect(find.byType(LoadingIndicator), findsOneWidget);
});
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 10.3**: Implement network client with request/response handling ✓
- **Requirement 10.4**: Implement interceptors for cross-cutting concerns ✓
- **Requirement 10.5**: Add loading states and UI updates ✓

## Future Enhancements

1. **Caching** - Add response caching with TTL
2. **Request Deduplication** - Prevent duplicate concurrent requests
3. **Upload Progress** - Track upload progress for file uploads
4. **Download Progress** - Track download progress for large files
5. **WebSocket Support** - Add WebSocket client for real-time communication
6. **GraphQL Support** - Add GraphQL query/mutation support
7. **Offline Queue** - Queue requests when offline and retry when online
8. **Request Mocking** - Mock network requests for testing
9. **Performance Monitoring** - Track request timing and performance metrics
10. **Rate Limiting** - Implement client-side rate limiting

## Related Files

- `network_client.dart` - Low-level HTTP client
- `network_manager.dart` - High-level network manager
- `loading_widgets.dart` - Loading state UI components
- `schema_interpreter.dart` - Schema interpreter integration
