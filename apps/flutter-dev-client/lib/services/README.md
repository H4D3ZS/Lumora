# Kiro Flutter Dev Client Services

This directory contains the core services for the Kiro Flutter Dev Client WebSocket connection and message handling.

## Architecture

The services are organized into four main components:

### 1. DevProxyConnection (`dev_proxy_connection.dart`)

The low-level WebSocket connection manager that handles:
- Establishing WebSocket connections to Dev-Proxy
- Automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
- Connection state management (disconnected, connecting, connected, error)
- Message sending and receiving
- Stream-based message delivery

**Key Features:**
- Exponential backoff reconnection strategy
- Automatic cleanup of resources
- Broadcast stream for multiple listeners
- Comprehensive logging for debugging

**Usage:**
```dart
final connection = DevProxyConnection(
  wsUrl: 'ws://10.0.2.2:3000/ws',
  sessionId: 'session-id',
  token: 'session-token',
);

await connection.connect();

connection.messages.listen((message) {
  print('Received: $message');
});

connection.sendMessage({'type': 'ping'});
```

### 2. SessionManager (`session_manager.dart`)

Manages the session lifecycle and join flow:
- Sends join message after connection is established
- Handles join acceptance and rejection
- Tracks session state
- Emits session events (joined, joinRejected, error)

**Key Features:**
- Automatic join message sending on connection
- Join timeout handling (5 seconds)
- Session event streaming
- Join rejection reason tracking

**Usage:**
```dart
final sessionManager = SessionManager(connection: connection);

sessionManager.events.listen((event) {
  switch (event) {
    case SessionEvent.joined:
      print('Successfully joined session');
      break;
    case SessionEvent.joinRejected:
      print('Join rejected: ${sessionManager.rejectionReason}');
      break;
  }
});

await sessionManager.connectAndJoin();
```

### 3. MessageParser (`message_parser.dart`)

Parses and routes WebSocket messages based on envelope type:
- Validates envelope structure (type, meta, payload)
- Routes messages to type-specific streams
- Handles malformed messages gracefully
- Supports all message types: full_ui_schema, ui_schema_delta, event, ping, pong

**Key Features:**
- Type-safe message routing
- Envelope validation
- Separate streams for each message type
- Error handling and logging

**Message Types:**
- `UISchemaMessage` - Full UI schema updates
- `DeltaMessage` - Incremental UI schema changes
- `EventMessage` - UI events from editor
- `PingPongMessage` - Connection health checks

**Usage:**
```dart
final parser = MessageParser();

parser.schemaMessages.listen((message) {
  print('Schema: ${message.schema}');
});

parser.deltaMessages.listen((message) {
  print('Delta: ${message.delta}');
});

parser.parseMessage({
  'type': 'full_ui_schema',
  'meta': {'sessionId': 'abc'},
  'payload': {'schemaVersion': '1.0', 'root': {...}},
});
```

### 4. KiroClientService (`kiro_client_service.dart`)

The main service that integrates all components:
- Coordinates connection, session, and message parsing
- Provides unified API for the application
- Handles ping/pong automatically
- Manages service lifecycle

**Key Features:**
- Single entry point for all WebSocket functionality
- Automatic ping/pong handling (30-second intervals)
- Convenient event sending methods
- Complete lifecycle management

**Usage:**
```dart
final service = KiroClientService(
  wsUrl: 'ws://10.0.2.2:3000/ws',
  sessionId: 'session-id',
  token: 'session-token',
);

// Listen to events
service.sessionEvents.listen((event) { ... });
service.schemaMessages.listen((message) { ... });
service.deltaMessages.listen((message) { ... });

// Initialize and connect
await service.initialize();

// Send events
service.sendEvent('button_tap', {'buttonId': 'submit'});

// Cleanup
service.dispose();
```

## Connection Flow

1. **Initialize** - Create `KiroClientService` with connection parameters
2. **Connect** - Service establishes WebSocket connection via `DevProxyConnection`
3. **Join** - `SessionManager` sends join message with sessionId, token, and clientType
4. **Authenticate** - Dev-Proxy validates credentials and responds with join_accepted or join_rejected
5. **Ready** - Client is ready to receive schemas and send events
6. **Ping/Pong** - Automatic health checks every 30 seconds
7. **Reconnect** - Automatic reconnection on connection loss with exponential backoff

## Error Handling

All services include comprehensive error handling:
- Invalid envelope structures are logged and ignored
- Connection failures trigger automatic reconnection
- Join rejections are surfaced through session events
- Malformed messages don't crash the application
- All errors are logged with context for debugging

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 2.1**: WebSocket connection establishment
- **Requirement 2.2**: Join message with sessionId, token, and clientType
- **Requirement 2.3**: Token validation and rejection handling
- **Requirement 2.4**: Client addition to session on successful join
- **Requirement 2.5**: Connection maintenance and reconnection
- **Requirement 5.1**: Message parsing and envelope handling

## Testing

To test the services:

1. Start the Dev-Proxy server
2. Create a session and get sessionId and token
3. Run the Flutter app with connection parameters
4. Verify connection, join, and message handling in logs

## Next Steps

The next tasks will build on these services:
- Schema interpretation (Task 6)
- Event bridge for UI interactions (Task 9)
- Delta update handling (Task 8)
- Error UI components (Task 11)
