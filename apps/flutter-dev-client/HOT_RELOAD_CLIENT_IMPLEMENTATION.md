# Hot Reload Client Implementation

This document describes the implementation of the Hot Reload Client for Lumora Go (Flutter Dev Client).

## Overview

The Hot Reload Client implements the Hot Reload Protocol to enable real-time schema updates from the development server. It provides instant preview of UI changes without requiring app rebuilds.

## Architecture

### Components

1. **DevProxyConnection** (`lib/services/dev_proxy_connection.dart`)
   - WebSocket client implementation
   - Handles connection lifecycle and authentication
   - Implements automatic reconnection with exponential backoff
   - Manages heartbeat (ping/pong) to maintain connection health
   - Protocol version: 1.0.0

2. **UpdateHandler** (`lib/services/update_handler.dart`)
   - Handles schema update application
   - Supports both full and incremental delta updates
   - Preserves widget state during updates when requested
   - Tracks update performance metrics
   - Sends acknowledgments to server

3. **MessageParser** (`lib/services/message_parser.dart`)
   - Routes incoming WebSocket messages to appropriate handlers
   - Supports both legacy and hot reload protocol messages
   - Message types: `update`, `connected`, `ping`, `pong`, `error`

4. **Error Handling** (`lib/widgets/error_widgets.dart`)
   - UpdateErrorOverlay: Displays update failures with retry option
   - Preserves previous UI state when updates fail
   - Shows detailed error messages and stack traces for debugging

## Hot Reload Protocol

### Connection Flow

1. **Connect**: Client establishes WebSocket connection with session ID
2. **Authenticate**: Client sends `connect` message with device info and token
3. **Connected**: Server responds with `connected` message and optional initial schema
4. **Updates**: Server pushes `update` messages (full or incremental)
5. **Acknowledgment**: Client sends `ack` message after applying update
6. **Heartbeat**: Client and server exchange `ping`/`pong` messages every 30 seconds

### Message Types

#### Connect Message
```dart
{
  'type': 'connect',
  'sessionId': 'session-id',
  'timestamp': 1234567890,
  'payload': {
    'deviceId': 'device_1234567890',
    'platform': 'android',
    'deviceName': 'Flutter Device',
    'clientVersion': '1.0.0',
    'token': 'auth-token',
  },
}
```

#### Connected Message
```dart
{
  'type': 'connected',
  'sessionId': 'session-id',
  'timestamp': 1234567890,
  'payload': {
    'connectionId': 'conn-id',
    'initialSchema': { /* optional schema */ },
  },
}
```

#### Update Message (Full)
```dart
{
  'type': 'update',
  'sessionId': 'session-id',
  'timestamp': 1234567890,
  'payload': {
    'type': 'full',
    'schema': { /* complete schema */ },
    'sequenceNumber': 1,
    'preserveState': true,
  },
}
```

#### Update Message (Incremental)
```dart
{
  'type': 'update',
  'sessionId': 'session-id',
  'timestamp': 1234567890,
  'payload': {
    'type': 'incremental',
    'delta': {
      'operations': [ /* JSON Patch operations */ ],
    },
    'sequenceNumber': 2,
    'preserveState': true,
  },
}
```

#### Acknowledgment Message
```dart
{
  'type': 'ack',
  'sessionId': 'session-id',
  'timestamp': 1234567890,
  'payload': {
    'sequenceNumber': 1,
    'success': true,
    'applyTime': 150, // milliseconds
    'error': null, // or error message if failed
  },
}
```

#### Ping/Pong Messages
```dart
{
  'type': 'ping', // or 'pong'
  'sessionId': 'session-id',
  'timestamp': 1234567890,
}
```

## Features

### 1. WebSocket Client (Task 8.1)

**Implementation**: `DevProxyConnection`

- ✅ Connection to dev server with session ID
- ✅ Authentication via connect message with token
- ✅ Message handling for all protocol message types
- ✅ Automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
- ✅ Connection health monitoring via ping/pong
- ✅ Connection state tracking (disconnected, connecting, connected, error)

**Key Methods**:
- `connect()`: Establishes WebSocket connection and sends connect message
- `disconnect()`: Closes connection and cleans up resources
- `sendMessage()`: Sends messages to server
- `sendAck()`: Sends acknowledgment for received updates
- `isHealthy()`: Checks connection health based on pong responses

### 2. Update Application (Task 8.2)

**Implementation**: `UpdateHandler`

- ✅ Receive schema updates from server
- ✅ Apply full schema updates
- ✅ Apply incremental delta updates (JSON Patch)
- ✅ Preserve widget state during updates
- ✅ Performance tracking and metrics
- ✅ Automatic acknowledgment to server

**Key Methods**:
- `handleUpdate()`: Main entry point for processing update messages
- `_applyFullUpdate()`: Applies complete schema replacement
- `_applyIncrementalUpdate()`: Applies JSON Patch delta operations
- `_preserveState()`: Preserves render context variables

**Performance Metrics**:
- Update sequence number
- Update type (full/incremental)
- Apply time in milliseconds
- Success/failure status
- Error messages for failures

### 3. Error Handling (Task 8.3)

**Implementation**: `UpdateErrorOverlay` and error handling in `UpdateHandler`

- ✅ Display error overlay on update failures
- ✅ Show compilation/interpretation errors
- ✅ Allow manual reload after errors
- ✅ Log errors for debugging
- ✅ Preserve previous UI state when updates fail
- ✅ Detailed error messages with stack traces

**Error Recovery**:
1. Update fails → Error overlay displayed
2. Previous UI remains visible (dimmed in background)
3. User can:
   - **Retry**: Attempt to reload current schema
   - **Dismiss**: Close overlay and continue with previous UI
4. Error details logged to console for debugging

## Usage

### Basic Connection

```dart
final service = KiroClientService(
  wsUrl: 'ws://localhost:3000/ws',
  sessionId: 'my-session',
  token: 'auth-token',
);

final interpreter = SchemaInterpreter(eventBridge: eventBridge);
final updateHandler = UpdateHandler(
  interpreter: interpreter,
  connection: service.connection,
);

// Listen to updates
updateHandler.updates.listen((result) {
  if (result.success && result.widget != null) {
    setState(() {
      renderedUI = result.widget;
    });
  } else {
    // Show error
    showError(result.error);
  }
});

// Initialize connection
await service.initialize();
```

### Handling Update Messages

```dart
service.updateMessages.listen((message) async {
  await updateHandler.handleUpdate(message.updateData);
});
```

### Handling Connected Messages

```dart
service.connectedMessages.listen((message) {
  if (message.initialSchema != null) {
    // Handle initial schema
    final updateMessage = {
      'type': 'update',
      'payload': {
        'type': 'full',
        'schema': message.initialSchema,
        'sequenceNumber': 0,
        'preserveState': false,
      },
    };
    updateHandler.handleUpdate(updateMessage);
  }
});
```

## Performance

### Target Metrics

- **Connection Time**: < 2 seconds
- **Full Update Application**: < 500ms for typical schemas
- **Incremental Update Application**: < 100ms for small deltas
- **Heartbeat Interval**: 30 seconds
- **Connection Timeout**: 60 seconds

### Actual Performance

The UpdateHandler tracks performance metrics for each update:
- Apply time in milliseconds
- Success/failure rate
- Update type distribution (full vs incremental)

Access metrics via:
```dart
final metrics = updateHandler.updateHistory;
for (final metric in metrics) {
  print('Sequence ${metric.sequenceNumber}: ${metric.applyTime}ms');
}
```

## Error Handling

### Connection Errors

1. **Authentication Failed**: Shows dialog, stops reconnection
2. **Session Not Found**: Shows dialog, stops reconnection
3. **Network Error**: Automatic reconnection with backoff
4. **Timeout**: Automatic reconnection after 60 seconds

### Update Errors

1. **Invalid Schema**: Error overlay with details
2. **Delta Application Failed**: Error overlay, preserves previous UI
3. **Parsing Error**: Error overlay with stack trace

All errors are logged to console with:
- Error message
- Stack trace
- Failed message content (for debugging)

## Testing

### Manual Testing

1. Start dev server with hot reload enabled
2. Launch Flutter app
3. Connect to session
4. Make changes to schema
5. Verify updates appear instantly
6. Test error scenarios (invalid schema, network issues)

### Connection Health

Monitor connection health:
```dart
final isHealthy = service.connection.isHealthy();
final lastPong = service.connection.lastPongReceived;
```

### Update Metrics

View update performance:
```dart
final metrics = updateHandler.updateHistory;
final avgTime = metrics.map((m) => m.applyTime).reduce((a, b) => a + b) / metrics.length;
print('Average update time: ${avgTime}ms');
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to server
- Check WebSocket URL is correct
- Verify session ID exists on server
- Check network connectivity
- Review authentication token

**Problem**: Frequent disconnections
- Check network stability
- Verify server is running
- Review server logs for errors

### Update Issues

**Problem**: Updates not appearing
- Check update messages are being received
- Verify UpdateHandler is initialized
- Review console logs for errors
- Check schema validity

**Problem**: Updates failing
- Review error overlay details
- Check schema format
- Verify delta operations are valid
- Review stack trace in console

### Performance Issues

**Problem**: Slow update application
- Check schema size (large schemas take longer)
- Review update metrics
- Consider using incremental updates
- Check for complex widget trees

## Future Enhancements

- [ ] Compression for large schemas
- [ ] Batch update processing
- [ ] Update queue management
- [ ] Offline mode with update buffering
- [ ] Visual update indicators
- [ ] Performance profiling UI
- [ ] Update history viewer
- [ ] Connection quality indicators

## References

- Hot Reload Protocol Specification: `packages/lumora-cli/HOT_RELOAD_SERVER_IMPLEMENTATION.md`
- Schema Interpreter: `apps/flutter-dev-client/lib/interpreter/schema_interpreter.dart`
- Event Bridge: `packages/kiro_core/lib/src/event_bridge.dart`
