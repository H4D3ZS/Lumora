# Device Protocol Quick Reference

Quick reference guide for using the device communication protocol in the Lumora Flutter Dev Client.

## Quick Start

### 1. Create Connection

```dart
final connection = DevProxyConnection(
  wsUrl: 'ws://192.168.1.100:3000/ws',
  sessionId: 'session_abc123',
  token: 'auth_token_xyz',
  deviceName: 'My iPhone',
);
```

### 2. Listen to State Changes

```dart
connection.stateChanges.listen((state) {
  switch (state) {
    case ConnectionState.connecting:
      print('Connecting...');
      break;
    case ConnectionState.connected:
      print('Connected!');
      break;
    case ConnectionState.disconnected:
      print('Disconnected');
      break;
    case ConnectionState.error:
      print('Error: ${connection.lastError}');
      break;
  }
});
```

### 3. Connect

```dart
await connection.connect();
```

### 4. Listen to Messages

```dart
connection.messages.listen((message) {
  final type = message['type'];
  print('Received: $type');
  
  if (type == 'update') {
    // Handle schema update
  }
});
```

## Common Patterns

### Handle Connection Errors

```dart
connection.stateChanges.listen((state) async {
  if (state == ConnectionState.error) {
    if (connection.authenticationFailed) {
      // Show auth error dialog
      final action = await showAuthenticationErrorDialog(
        context,
        errorMessage: connection.lastError ?? 'Auth failed',
      );
      
      if (action == ProtocolErrorAction.scanQR) {
        await scanQRCode();
      }
    } else {
      // Show connection error dialog
      final action = await showConnectionErrorDialog(
        context,
        errorMessage: connection.lastError ?? 'Connection failed',
        attemptNumber: connection.reconnectAttempts,
      );
      
      if (action == ProtocolErrorAction.retry) {
        await connection.forceReconnect();
      }
    }
  }
});
```

### Send Acknowledgment

```dart
connection.sendAck(
  sequenceNumber: 42,
  success: true,
  applyTime: 150, // milliseconds
);
```

### Request Initial Schema

```dart
connection.requestInitialSchema();
```

### Force Reconnection

```dart
await connection.forceReconnect();
```

### Check Connection Health

```dart
if (connection.isHealthy()) {
  print('Connection is healthy');
} else {
  print('Connection may be stale');
}
```

## Error Dialogs

### Connection Error

```dart
final action = await showConnectionErrorDialog(
  context,
  errorMessage: 'Failed to connect to server',
  attemptNumber: 3,
  nextRetrySeconds: 8,
);
```

### Authentication Error

```dart
final action = await showAuthenticationErrorDialog(
  context,
  errorMessage: 'Invalid session token',
  errorCode: 'INVALID_TOKEN',
);
```

### Timeout Error

```dart
final action = await showTimeoutErrorDialog(
  context,
  errorMessage: 'Connection timed out',
  attemptNumber: 2,
);
```

### Server Error

```dart
final action = await showServerErrorDialog(
  context,
  errorMessage: 'Internal server error',
  errorCode: 'SERVER_ERROR',
);
```

## Protocol Messages

### Connect Message (Client → Server)

```dart
{
  'type': 'connect',
  'sessionId': 'session_123',
  'timestamp': 1234567890,
  'payload': {
    'deviceId': 'device_abc',
    'platform': 'android',
    'deviceName': 'Pixel 6',
    'clientVersion': '1.0.0',
    'token': 'auth_token',
  },
}
```

### Connected Message (Server → Client)

```dart
{
  'type': 'connected',
  'sessionId': 'session_123',
  'timestamp': 1234567890,
  'payload': {
    'connectionId': 'conn_xyz',
    'serverVersion': '1.0.0',
    'capabilities': ['hot-reload', 'delta-updates'],
    'initialSchema': { /* optional */ },
  },
}
```

### Ping Message (Client → Server)

```dart
{
  'type': 'ping',
  'sessionId': 'session_123',
  'timestamp': 1234567890,
}
```

### Pong Message (Server → Client)

```dart
{
  'type': 'pong',
  'sessionId': 'session_123',
  'timestamp': 1234567890,
}
```

### Update Message (Server → Client)

```dart
{
  'type': 'update',
  'sessionId': 'session_123',
  'timestamp': 1234567890,
  'payload': {
    'type': 'full', // or 'incremental'
    'schema': { /* full schema */ },
    'delta': { /* delta changes */ },
    'sequenceNumber': 42,
    'preserveState': true,
  },
}
```

### Acknowledgment Message (Client → Server)

```dart
{
  'type': 'ack',
  'sessionId': 'session_123',
  'timestamp': 1234567890,
  'payload': {
    'sequenceNumber': 42,
    'success': true,
    'error': 'optional error message',
    'applyTime': 150,
  },
}
```

### Error Message (Server → Client)

```dart
{
  'type': 'error',
  'sessionId': 'session_123',
  'timestamp': 1234567890,
  'payload': {
    'code': 'INVALID_TOKEN',
    'message': 'Authentication failed',
    'severity': 'fatal', // or 'error', 'warning'
    'recoverable': false,
  },
}
```

## Connection States

```dart
enum ConnectionState {
  disconnected,  // Not connected
  connecting,    // Attempting to connect
  connected,     // Successfully connected
  error,         // Error occurred
}
```

## Error Types

```dart
enum ProtocolErrorType {
  connection,      // Network/connection errors
  authentication,  // Auth failures
  timeout,         // Timeout errors
  serverError,     // Server-side errors
  unknown,         // Unknown errors
}
```

## User Actions

```dart
enum ProtocolErrorAction {
  dismiss,  // Dismiss dialog
  retry,    // Retry connection
  scanQR,   // Scan QR code
}
```

## Configuration

### Heartbeat Settings

```dart
const pingInterval = Duration(seconds: 30);
const timeoutThreshold = Duration(seconds: 60);
```

### Reconnection Settings

```dart
// Exponential backoff delays
Attempt 1: 1 second
Attempt 2: 2 seconds
Attempt 3: 4 seconds
Attempt 4: 8 seconds
Attempt 5: 16 seconds
Attempt 6+: 30 seconds (max)
```

## Troubleshooting

### Connection Fails Immediately

**Problem:** Connection fails right after calling `connect()`

**Solutions:**
- Check network connectivity
- Verify WebSocket URL is correct
- Ensure dev-proxy server is running
- Check firewall settings

### Authentication Fails

**Problem:** `authenticationFailed` flag is true

**Solutions:**
- Verify session ID is valid
- Check token is correct
- Ensure session hasn't expired
- Scan QR code again

### Frequent Disconnections

**Problem:** Connection drops frequently

**Solutions:**
- Check network stability
- Verify heartbeat is working
- Monitor server logs
- Check for firewall interference

### No Pong Received

**Problem:** `isHealthy()` returns false

**Solutions:**
- Check server is responding
- Verify network latency
- Check server logs for errors
- Try force reconnect

## Best Practices

### 1. Always Handle State Changes

```dart
connection.stateChanges.listen((state) {
  // Update UI based on state
});
```

### 2. Show User-Friendly Errors

```dart
if (state == ConnectionState.error) {
  await showProtocolErrorDialog(context, ...);
}
```

### 3. Clean Up Resources

```dart
@override
void dispose() {
  connection.dispose();
  super.dispose();
}
```

### 4. Monitor Connection Health

```dart
Timer.periodic(Duration(seconds: 10), (_) {
  if (!connection.isHealthy()) {
    // Show warning to user
  }
});
```

### 5. Log Important Events

```dart
connection.stateChanges.listen((state) {
  debugPrint('Connection state: $state');
});

connection.messages.listen((message) {
  debugPrint('Received: ${message['type']}');
});
```

## API Reference

### DevProxyConnection

#### Properties

- `state` - Current connection state
- `stateChanges` - Stream of state changes
- `messages` - Stream of incoming messages
- `reconnectAttempts` - Number of reconnection attempts
- `lastError` - Last error message
- `authenticationFailed` - Whether auth failed
- `connectionId` - Connection ID from server
- `lastReceivedSequence` - Last sequence number

#### Methods

- `connect()` - Establish connection
- `disconnect()` - Close connection
- `sendMessage(envelope)` - Send message
- `sendAck(seq, success, ...)` - Send acknowledgment
- `requestInitialSchema()` - Request schema
- `forceReconnect()` - Force immediate reconnect
- `cancelReconnect()` - Cancel scheduled reconnect
- `isHealthy()` - Check connection health
- `resetAuthenticationFailure()` - Reset auth flag
- `dispose()` - Clean up resources

## Examples

See `DEVICE_PROTOCOL_IMPLEMENTATION.md` for detailed examples and usage patterns.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the full documentation in `DEVICE_PROTOCOL_IMPLEMENTATION.md`
3. Check server logs for errors
4. Enable debug logging for detailed information
