# Device Protocol Implementation

This document describes the implementation of the device communication protocol for the Lumora Flutter Dev Client.

## Overview

The device protocol enables real-time communication between the Flutter dev client and the dev-proxy server using WebSocket connections. It implements the Hot Reload Protocol with authentication, heartbeat monitoring, and comprehensive error handling.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter Dev Client                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           DevProxyConnection (Protocol Client)        │  │
│  │  - WebSocket connection management                    │  │
│  │  - Authentication & session handling                  │  │
│  │  - Heartbeat (ping/pong) system                      │  │
│  │  - Automatic reconnection with backoff               │  │
│  │  - Error detection & reporting                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              KiroClientService                        │  │
│  │  - Message routing & parsing                         │  │
│  │  - Session management                                │  │
│  │  - Event handling                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              UpdateHandler                            │  │
│  │  - Schema interpretation                             │  │
│  │  - Delta application                                 │  │
│  │  - Widget rendering                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          ↕ WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    Dev-Proxy Server                          │
└─────────────────────────────────────────────────────────────┘
```

## Protocol Messages

### 1. Connection Flow

#### Client → Server: Connect Message
```json
{
  "type": "connect",
  "sessionId": "session_123",
  "timestamp": 1234567890,
  "payload": {
    "deviceId": "device_abc",
    "platform": "android",
    "deviceName": "Pixel 6",
    "clientVersion": "1.0.0",
    "token": "auth_token"
  }
}
```

#### Server → Client: Connected Acknowledgment
```json
{
  "type": "connected",
  "sessionId": "session_123",
  "timestamp": 1234567890,
  "payload": {
    "connectionId": "conn_xyz",
    "serverVersion": "1.0.0",
    "capabilities": ["hot-reload", "delta-updates"],
    "initialSchema": { /* optional initial schema */ }
  }
}
```

### 2. Heartbeat System

#### Client → Server: Ping
```json
{
  "type": "ping",
  "sessionId": "session_123",
  "timestamp": 1234567890
}
```

#### Server → Client: Pong
```json
{
  "type": "pong",
  "sessionId": "session_123",
  "timestamp": 1234567890
}
```

**Heartbeat Configuration:**
- Ping interval: 30 seconds
- Timeout threshold: 60 seconds (no pong received)
- Action on timeout: Disconnect and trigger reconnection

### 3. Schema Updates

#### Server → Client: Update Message
```json
{
  "type": "update",
  "sessionId": "session_123",
  "timestamp": 1234567890,
  "payload": {
    "type": "full" | "incremental",
    "schema": { /* full schema */ },
    "delta": { /* delta changes */ },
    "sequenceNumber": 42,
    "preserveState": true
  }
}
```

#### Client → Server: Acknowledgment
```json
{
  "type": "ack",
  "sessionId": "session_123",
  "timestamp": 1234567890,
  "payload": {
    "sequenceNumber": 42,
    "success": true,
    "error": "optional error message",
    "applyTime": 150
  }
}
```

### 4. Error Messages

#### Server → Client: Error
```json
{
  "type": "error",
  "sessionId": "session_123",
  "timestamp": 1234567890,
  "payload": {
    "code": "INVALID_TOKEN",
    "message": "Authentication failed",
    "severity": "fatal" | "error" | "warning",
    "recoverable": false
  }
}
```

**Error Codes:**
- `INVALID_TOKEN`: Authentication token is invalid
- `SESSION_NOT_FOUND`: Session ID doesn't exist
- `AUTHENTICATION_FAILED`: Authentication failed
- `CONNECTION_TIMEOUT`: Connection timed out
- `SERVER_ERROR`: Internal server error

## Connection States

```dart
enum ConnectionState {
  disconnected,  // Not connected
  connecting,    // Attempting to connect
  connected,     // Successfully connected and authenticated
  error,         // Error occurred
}
```

## Features

### 1. Authentication

The protocol client implements secure authentication:

- **Token-based authentication**: Each connection requires a valid token
- **Session validation**: Server validates session ID on connection
- **Error handling**: Authentication failures prevent automatic reconnection
- **Token refresh**: Users can scan QR code to get new credentials

### 2. Automatic Reconnection

Implements exponential backoff for reconnection:

```
Attempt 1: 1 second delay
Attempt 2: 2 seconds delay
Attempt 3: 4 seconds delay
Attempt 4: 8 seconds delay
Attempt 5: 16 seconds delay
Attempt 6+: 30 seconds delay (max)
```

**Reconnection is disabled for:**
- Authentication failures (requires new QR scan)
- Fatal server errors marked as non-recoverable

### 3. Heartbeat Monitoring

The heartbeat system ensures connection health:

- **Periodic pings**: Sent every 30 seconds when connected
- **Timeout detection**: If no pong received in 60 seconds, connection is considered dead
- **Automatic recovery**: Timeout triggers disconnection and reconnection

### 4. Error Handling

Comprehensive error handling with user-friendly dialogs:

#### Connection Errors
- Network failures
- WebSocket errors
- Server unreachable

**User Actions:**
- Retry immediately
- Dismiss (let automatic reconnection continue)

#### Authentication Errors
- Invalid token
- Session not found
- Authentication failed

**User Actions:**
- Scan QR code (get new credentials)
- Dismiss (disconnect)

#### Timeout Errors
- No response from server
- Heartbeat timeout
- Request timeout

**User Actions:**
- Retry immediately
- Dismiss

#### Server Errors
- Internal server errors
- Protocol errors
- Fatal errors

**User Actions:**
- Retry connection
- Scan QR code
- Dismiss

## API Reference

### DevProxyConnection

Main protocol client class.

#### Constructor
```dart
DevProxyConnection({
  required String wsUrl,
  required String sessionId,
  required String token,
  String? deviceId,
  String? deviceName,
})
```

#### Methods

**connect()**
```dart
Future<void> connect()
```
Establishes WebSocket connection and sends connect message.

**disconnect()**
```dart
void disconnect()
```
Closes connection and cleans up resources.

**sendMessage()**
```dart
void sendMessage(Map<String, dynamic> envelope)
```
Sends a message through the WebSocket connection.

**sendAck()**
```dart
void sendAck(int sequenceNumber, bool success, {String? error, int? applyTime})
```
Sends acknowledgment for received update.

**requestInitialSchema()**
```dart
void requestInitialSchema()
```
Requests initial schema from server.

**forceReconnect()**
```dart
Future<void> forceReconnect()
```
Forces immediate reconnection (bypasses backoff).

**cancelReconnect()**
```dart
void cancelReconnect()
```
Cancels scheduled reconnection.

**isHealthy()**
```dart
bool isHealthy()
```
Checks if connection is healthy (connected and receiving pongs).

#### Properties

**state**
```dart
ConnectionState get state
```
Current connection state.

**stateChanges**
```dart
Stream<ConnectionState> get stateChanges
```
Stream of connection state changes.

**messages**
```dart
Stream<Map<String, dynamic>> get messages
```
Stream of incoming WebSocket messages.

**reconnectAttempts**
```dart
int get reconnectAttempts
```
Number of reconnection attempts.

**lastError**
```dart
String? get lastError
```
Last error message.

**authenticationFailed**
```dart
bool get authenticationFailed
```
Whether authentication failed.

**connectionId**
```dart
String? get connectionId
```
Connection ID assigned by server.

## Error Dialog System

### Protocol Error Types

```dart
enum ProtocolErrorType {
  connection,      // Network/connection errors
  authentication,  // Auth failures
  timeout,         // Timeout errors
  serverError,     // Server-side errors
  unknown,         // Unknown errors
}
```

### Dialog Functions

**showProtocolErrorDialog()**
```dart
Future<ProtocolErrorAction?> showProtocolErrorDialog(
  BuildContext context, {
  required ProtocolErrorType errorType,
  required String errorMessage,
  String? errorCode,
  int? attemptNumber,
  int? nextRetrySeconds,
  bool canRetry = true,
})
```

**Convenience Functions:**
- `showTimeoutErrorDialog()`
- `showAuthenticationErrorDialog()`
- `showConnectionErrorDialog()`
- `showServerErrorDialog()`

### User Actions

```dart
enum ProtocolErrorAction {
  dismiss,  // Dismiss dialog
  retry,    // Retry connection
  scanQR,   // Scan QR code for new credentials
}
```

## Usage Example

### Basic Connection

```dart
// Create connection
final connection = DevProxyConnection(
  wsUrl: 'ws://192.168.1.100:3000/ws',
  sessionId: 'session_123',
  token: 'auth_token',
  deviceName: 'My Device',
);

// Listen to state changes
connection.stateChanges.listen((state) {
  print('Connection state: $state');
});

// Listen to messages
connection.messages.listen((message) {
  print('Received: ${message['type']}');
});

// Connect
await connection.connect();
```

### Error Handling

```dart
connection.stateChanges.listen((state) async {
  if (state == ConnectionState.error) {
    if (connection.authenticationFailed) {
      // Show authentication error dialog
      final action = await showAuthenticationErrorDialog(
        context,
        errorMessage: connection.lastError ?? 'Auth failed',
      );
      
      if (action == ProtocolErrorAction.scanQR) {
        // Navigate to QR scanner
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
        // Force immediate reconnection
        await connection.forceReconnect();
      }
    }
  }
});
```

## Testing

### Unit Tests

Test coverage includes:
- Connection establishment
- Authentication flow
- Heartbeat system
- Reconnection logic
- Error handling
- Message parsing

### Integration Tests

End-to-end tests verify:
- Full connection flow
- Schema updates
- Error recovery
- Reconnection scenarios

## Performance Considerations

### Connection Latency
- Initial connection: < 500ms (local network)
- Reconnection: < 2s (with backoff)
- Message round-trip: < 100ms (local network)

### Resource Usage
- WebSocket overhead: Minimal
- Heartbeat traffic: ~60 bytes every 30s
- Memory: < 1MB for connection state

### Optimization Tips
1. Use delta updates instead of full schemas
2. Batch multiple updates when possible
3. Implement message compression for large payloads
4. Monitor connection health proactively

## Troubleshooting

### Connection Fails Immediately
- Check network connectivity
- Verify WebSocket URL is correct
- Ensure dev-proxy server is running
- Check firewall settings

### Authentication Fails
- Verify session ID is valid
- Check token is correct
- Ensure session hasn't expired
- Try scanning QR code again

### Frequent Disconnections
- Check network stability
- Verify heartbeat is working
- Monitor server logs
- Check for firewall interference

### Slow Updates
- Check network latency
- Monitor message size
- Use delta updates
- Enable compression

## Future Enhancements

1. **Message Compression**: Gzip compression for large payloads
2. **Binary Protocol**: More efficient binary message format
3. **Multiplexing**: Multiple logical channels over one connection
4. **Priority Queue**: Prioritize critical messages
5. **Offline Queue**: Queue messages when disconnected
6. **Connection Pooling**: Multiple connections for redundancy

## References

- [Hot Reload Protocol Specification](../../tools/dev-proxy/README.md)
- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)
- [Flutter WebSocket Documentation](https://api.flutter.dev/flutter/dart-io/WebSocket-class.html)
