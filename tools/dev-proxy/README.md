# Dev-Proxy

Node.js server that manages development sessions, generates QR codes, and brokers WebSocket connections between editors and Flutter clients.

## Purpose

The Dev-Proxy acts as the central hub in Lumora's architecture, coordinating real-time communication between web-based editors and mobile device clients. It provides session management, QR code generation for easy device pairing, and efficient WebSocket message routing.

## Features

- **Session Management**: Create ephemeral development sessions with unique IDs and tokens
- **QR Code Generation**: Automatic ASCII QR code generation for quick device pairing
- **WebSocket Broker**: Real-time bidirectional communication between editors and devices
- **Multi-Session Support**: Isolated sessions for multiple concurrent developers
- **Connection Health**: Ping/pong mechanism to detect and handle disconnections
- **Message Broadcasting**: Efficient routing of UI schemas and events to connected clients

## Installation

```bash
cd tools/dev-proxy
npm install
```

## Running the Server

```bash
node dist/index.js
```

Or from the project root:

```bash
npm run dev-proxy
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Create Session

**Endpoint**: `GET /session/new`

Creates a new development session and returns connection details.

**Response**:
```json
{
  "sessionId": "abc123def456",
  "token": "deadbeef...",
  "wsUrl": "ws://localhost:3000/ws"
}
```

The server also prints an ASCII QR code to the terminal containing the connection information.

**Example**:
```bash
curl http://localhost:3000/session/new
```

### Send Schema to Session

**Endpoint**: `POST /send/:sessionId`

Pushes a UI schema or event to all connected devices in the specified session.

**Parameters**:
- `sessionId` - The session ID from `/session/new`

**Request Body** (WebSocket Envelope):
```json
{
  "type": "full_ui_schema",
  "meta": {
    "sessionId": "abc123",
    "source": "editor",
    "timestamp": 1699999999999,
    "version": "1.0"
  },
  "payload": {
    "schemaVersion": "1.0",
    "root": {
      "type": "View",
      "props": {},
      "children": []
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "clientCount": 2
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/send/abc123 \
  -H "Content-Type: application/json" \
  -d @schema.json
```

## WebSocket Protocol

### Connection

**URL**: `ws://localhost:3000/ws`

Clients must send a join message within 30 seconds of connecting.

### Join Message

After establishing a WebSocket connection, clients must authenticate by sending a join message:

```json
{
  "type": "join",
  "payload": {
    "sessionId": "abc123def456",
    "token": "deadbeef...",
    "clientType": "device"
  }
}
```

**Client Types**:
- `device` - Flutter mobile clients
- `editor` - Web-based editors or development tools

**Authentication**:
- Invalid sessionId or token will result in connection rejection (close code 4001)
- Sessions expire after 8 hours by default

### Message Envelope Format

All messages follow a standardized envelope structure:

```json
{
  "type": "full_ui_schema | ui_schema_delta | event | ping | pong",
  "meta": {
    "sessionId": "abc123",
    "source": "editor | device",
    "timestamp": 1699999999999,
    "version": "1.0"
  },
  "payload": {}
}
```

**Message Types**:
- `full_ui_schema` - Complete UI schema for rendering
- `ui_schema_delta` - Incremental UI updates (JSON Patch format)
- `event` - UI events from device (button taps, input changes)
- `ping` - Connection health check
- `pong` - Response to ping

### Connection Health

The server sends ping messages every 30 seconds to all connected clients. Clients must respond with a pong within 10 seconds or the connection will be closed.

## Session Management

### Session Lifecycle

1. **Creation**: Sessions are created via `/session/new` endpoint
2. **Active**: Sessions remain active for 8 hours by default
3. **Expiration**: Expired sessions are automatically cleaned up every 5 minutes
4. **Cleanup**: All WebSocket connections are closed when a session expires

### Session Isolation

Each session maintains its own:
- Connected client list
- Message queue
- Token for authentication

Messages are only broadcast to clients within the same session, ensuring complete isolation between concurrent development sessions.

## Configuration

Environment variables (optional):

- `PORT` - Server port (default: 3000)
- `SESSION_LIFETIME` - Session duration in milliseconds (default: 28800000 = 8 hours)
- `CLEANUP_INTERVAL` - Session cleanup interval in milliseconds (default: 300000 = 5 minutes)
- `PING_INTERVAL` - Ping interval in milliseconds (default: 30000)
- `PONG_TIMEOUT` - Pong timeout in milliseconds (default: 10000)

## Usage Patterns

### Editor Workflow

1. Editor calls `/session/new` to create a session
2. Editor receives sessionId, token, and wsUrl
3. Editor displays QR code or shares connection details with device
4. Editor posts schemas to `/send/:sessionId` or sends via WebSocket
5. Device clients in the session receive the schemas in real-time

### Device Workflow

1. Device scans QR code to get sessionId, token, and wsUrl
2. Device establishes WebSocket connection to wsUrl
3. Device sends join message with sessionId and token
4. Device receives UI schemas and renders them
5. Device sends events back through WebSocket

## Error Handling

### HTTP Errors

- `404 Not Found` - Invalid sessionId
- `410 Gone` - Session has expired
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### WebSocket Errors

- Close code `4001` - Invalid token or sessionId
- Close code `4002` - Join timeout (no join message within 30 seconds)
- Close code `4003` - Ping timeout (no pong response within 10 seconds)

## Troubleshooting

### Connection Issues

**Problem**: Device cannot connect to Dev-Proxy

**Solutions**:
- Ensure Dev-Proxy is running and accessible
- For physical devices, use your machine's LAN IP instead of localhost
- Check firewall settings to allow connections on port 3000
- Verify the device and server are on the same network

**Example**: Replace `ws://localhost:3000/ws` with `ws://192.168.1.100:3000/ws`

### Session Issues

**Problem**: Session not found or expired

**Solutions**:
- Create a new session with `/session/new`
- Check that the session hasn't expired (default 8 hours)
- Verify the sessionId is correct

### Message Delivery Issues

**Problem**: Schemas not reaching devices

**Solutions**:
- Verify devices are connected (check server logs)
- Ensure sessionId matches between sender and receiver
- Check message format follows envelope structure
- Verify JSON is valid

## Development

### Building

```bash
npm run build
```

### Running in Development

```bash
npm run dev
```

### Testing

```bash
# Test WebSocket client
node test-ws-client.js

# Test event broadcasting
node test-event-broadcast.js
```

## Architecture

The Dev-Proxy consists of three main components:

1. **Session Manager** (`session-manager.ts`)
   - Creates and manages sessions
   - Generates tokens and QR codes
   - Handles session expiration and cleanup

2. **WebSocket Broker** (`websocket-broker.ts`)
   - Manages WebSocket connections
   - Routes messages between clients
   - Handles ping/pong health checks

3. **HTTP Server** (`index.ts`)
   - Provides REST API endpoints
   - Integrates session manager and WebSocket broker
   - Handles HTTP requests and responses

## Security Considerations

- **Ephemeral Tokens**: Tokens are generated using cryptographically secure random bytes
- **Session Isolation**: Messages are strictly isolated between sessions
- **Token Validation**: All WebSocket messages validate the session token
- **Automatic Cleanup**: Expired sessions are automatically removed
- **Rate Limiting**: Prevents abuse through message rate limits

## Performance

- **In-Memory Storage**: Fast session lookup with O(1) complexity
- **Efficient Broadcasting**: Direct WebSocket message delivery
- **Connection Pooling**: Reuses connections for multiple messages
- **Minimal Overhead**: Lightweight message routing with low latency

## License

MIT License - see [LICENSE](../../LICENSE) for details
