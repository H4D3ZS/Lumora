# Hot Reload Server Quick Start Guide

## Overview

The Hot Reload Server enables real-time schema updates to connected mobile devices during development. It implements the Lumora hot reload protocol for reliable, efficient updates.

## Quick Start

### 1. Start the Server

```typescript
import { DevProxyServer } from 'lumora-cli/src/services';

const devProxy = new DevProxyServer({
  port: 3000,
  enableQR: true,
  verbose: true,
});

await devProxy.start();
```

### 2. Create a Session

```typescript
const session = await devProxy.createSession();
console.log(`Session ID: ${session.id}`);

// Display QR code for device connection
devProxy.displayQRCode(session.id);
```

### 3. Connect Device

On your mobile device:
1. Open Lumora Dev Client
2. Tap "Scan QR Code"
3. Point camera at the QR code
4. Device connects automatically

### 4. Push Schema Updates

```typescript
import { LumoraIR } from 'lumora-ir/src/types/ir-types';

const schema: LumoraIR = {
  version: '1.0',
  metadata: {
    sourceFramework: 'react',
    sourceFile: 'App.tsx',
    generatedAt: Date.now(),
  },
  nodes: [
    {
      id: 'root',
      type: 'View',
      props: { backgroundColor: '#fff' },
      children: [],
      metadata: { lineNumber: 1 },
    },
  ],
};

// Push update to all connected devices
const result = devProxy.pushSchemaUpdate(session.id, schema);
console.log(`Updated ${result.devicesUpdated} devices (${result.updateType})`);
```

## API Reference

### DevProxyServer

#### Constructor

```typescript
new DevProxyServer(config: DevProxyConfig)
```

**Config Options:**
- `port: number` - Server port (default: 3000)
- `enableQR: boolean` - Show QR codes (default: true)
- `verbose: boolean` - Enable verbose logging (default: false)

#### Methods

**`start(): Promise<void>`**
- Starts the HTTP and WebSocket servers

**`stop(): Promise<void>`**
- Stops all servers and closes connections

**`createSession(): Promise<Session>`**
- Creates a new development session
- Returns session with ID and metadata

**`displayQRCode(sessionId: string): void`**
- Displays QR code for device connection

**`pushSchemaUpdate(sessionId, schema, preserveState?): Result`**
- Pushes schema update to all devices in session
- Automatically chooses full or incremental update
- Returns update result with device count

**`getHotReloadServer(): HotReloadServer | null`**
- Returns underlying hot reload server instance
- For advanced usage

### HotReloadServer (Advanced)

#### Methods

**`createSession(): HotReloadSession`**
- Creates a new session with hot reload support

**`getSession(sessionId): HotReloadSession | undefined`**
- Retrieves session by ID

**`deleteSession(sessionId): boolean`**
- Deletes session and disconnects all devices

**`pushUpdate(sessionId, schema, preserveState?): Result`**
- Pushes update with automatic delta calculation
- Returns success status and device count

**`pushUpdateToDevice(sessionId, connectionId, schema): boolean`**
- Pushes update to specific device
- Useful for reconnection scenarios

**`getConnectedDevices(sessionId): DeviceConnection[]`**
- Returns all connected devices in session

**`getSessionHealth(sessionId): HealthStatus | null`**
- Returns health status of all devices
- Includes ping times and connection state

**`extendSession(sessionId, additionalTime?): boolean`**
- Extends session expiry time
- Default extension: 8 hours

**`cleanupStaleConnections(): number`**
- Manually cleanup dead connections
- Returns number of connections cleaned

**`getStats(): ServerStats`**
- Returns server statistics
- Includes session count and device count

## Update Types

### Full Update
- Sends complete schema
- Used for first update or large changes
- Includes checksum for validation

### Incremental Update
- Sends only changes (delta)
- Used for small changes (< 10 nodes)
- More efficient for minor edits

**Delta Structure:**
```typescript
{
  added: LumoraNode[],      // New nodes
  modified: LumoraNode[],   // Changed nodes
  removed: string[],        // Removed node IDs
  metadataChanges?: {...}   // Theme/navigation changes
}
```

## Connection Management

### Heartbeat

The server automatically monitors device health:
- Sends ping every 30 seconds
- Expects pong response
- Disconnects after 60 seconds of inactivity

### Session Expiry

Sessions expire after 8 hours by default:
- Automatic cleanup of expired sessions
- Can be extended with `extendSession()`
- Devices disconnected on expiry

### Health Monitoring

Check device health:
```typescript
const health = hotReloadServer.getSessionHealth(sessionId);

console.log(`Total devices: ${health.totalDevices}`);
console.log(`Healthy: ${health.healthyDevices}`);
console.log(`Unhealthy: ${health.unhealthyDevices}`);

health.devices.forEach(device => {
  console.log(`${device.deviceId}: ${device.healthy ? '✓' : '✗'}`);
  console.log(`  Last ping: ${device.timeSinceLastPing}ms ago`);
});
```

## HTTP Endpoints

### POST /session/new
Creates a new session
```bash
curl -X POST http://localhost:3000/session/new
```

Response:
```json
{
  "sessionId": "abc123...",
  "wsUrl": "ws://localhost:3000/ws?session=abc123...",
  "expiresAt": 1234567890
}
```

### POST /send/:sessionId
Pushes schema update
```bash
curl -X POST http://localhost:3000/send/abc123 \
  -H "Content-Type: application/json" \
  -d @schema.json
```

Response:
```json
{
  "success": true,
  "clientsUpdated": 2,
  "updateType": "incremental"
}
```

### GET /session/:sessionId
Gets session info
```bash
curl http://localhost:3000/session/abc123
```

Response:
```json
{
  "sessionId": "abc123",
  "createdAt": 1234567890,
  "expiresAt": 1234567890,
  "connectedDevices": 2,
  "devices": [...]
}
```

### GET /session/:sessionId/health
Gets session health
```bash
curl http://localhost:3000/session/abc123/health
```

### POST /session/:sessionId/extend
Extends session expiry
```bash
curl -X POST http://localhost:3000/session/abc123/extend
```

### DELETE /session/:sessionId
Deletes session
```bash
curl -X DELETE http://localhost:3000/session/abc123
```

### GET /stats
Gets server statistics
```bash
curl http://localhost:3000/stats
```

## WebSocket Protocol

### Connection

Connect to: `ws://localhost:3000/ws?session={sessionId}`

### Message Format

All messages follow this structure:
```typescript
{
  type: 'connect' | 'connected' | 'update' | 'ping' | 'pong' | 'ack' | 'error',
  sessionId: string,
  timestamp: number,
  version: string,
  payload?: any
}
```

### Client Messages

**Connect:**
```json
{
  "type": "connect",
  "sessionId": "abc123",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "payload": {
    "deviceId": "device-123",
    "platform": "ios",
    "deviceName": "iPhone 14",
    "clientVersion": "1.0.0"
  }
}
```

**Ping:**
```json
{
  "type": "ping",
  "sessionId": "abc123",
  "timestamp": 1234567890,
  "version": "1.0.0"
}
```

**Ack:**
```json
{
  "type": "ack",
  "sessionId": "abc123",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "payload": {
    "sequenceNumber": 5,
    "success": true,
    "applyTime": 150
  }
}
```

### Server Messages

**Connected:**
```json
{
  "type": "connected",
  "sessionId": "abc123",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "payload": {
    "connectionId": "conn-456",
    "initialSchema": {...},
    "capabilities": {
      "incrementalUpdates": true,
      "compression": false,
      "statePreservation": true
    }
  }
}
```

**Update:**
```json
{
  "type": "update",
  "sessionId": "abc123",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "payload": {
    "type": "incremental",
    "delta": {
      "added": [],
      "modified": [...],
      "removed": []
    },
    "preserveState": true,
    "sequenceNumber": 5
  }
}
```

**Pong:**
```json
{
  "type": "pong",
  "sessionId": "abc123",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "payload": {
    "serverTime": 1234567890
  }
}
```

## Error Handling

### Error Codes

- `INVALID_MESSAGE` - Malformed message
- `UNSUPPORTED_VERSION` - Protocol version mismatch
- `SESSION_NOT_FOUND` - Invalid session ID
- `SESSION_EXPIRED` - Session has expired
- `AUTHENTICATION_FAILED` - Connection not authenticated
- `SCHEMA_VALIDATION_FAILED` - Invalid schema
- `UPDATE_FAILED` - Update application failed
- `CHECKSUM_MISMATCH` - Schema checksum mismatch
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

### Error Message

```json
{
  "type": "error",
  "sessionId": "abc123",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "payload": {
    "code": "SESSION_EXPIRED",
    "message": "Session has expired",
    "severity": "fatal",
    "recoverable": false,
    "details": "..."
  }
}
```

## Best Practices

### 1. Session Management
- Create one session per development workflow
- Extend sessions for long development sessions
- Clean up sessions when done

### 2. Update Distribution
- Let the server choose update type automatically
- Use `preserveState: true` for UI-only changes
- Use `preserveState: false` for state structure changes

### 3. Error Handling
- Monitor session health regularly
- Handle connection errors gracefully
- Implement reconnection logic in client

### 4. Performance
- Batch multiple small changes when possible
- Use incremental updates for minor edits
- Monitor update latency

### 5. Security
- Use sessions only on trusted networks
- Implement authentication for production
- Use TLS/WSS for remote connections

## Troubleshooting

### Device Won't Connect
- Check session ID is correct
- Verify session hasn't expired
- Ensure device and server on same network
- Check firewall settings

### Updates Not Appearing
- Verify device is connected (check health)
- Check update was successful (check result)
- Ensure schema is valid
- Check device logs for errors

### Connection Drops
- Check network stability
- Verify heartbeat is working
- Increase connection timeout if needed
- Check for firewall interference

### High Latency
- Check network conditions
- Reduce schema size
- Use incremental updates
- Check server load

## Examples

See `packages/lumora-cli/src/services/__tests__/hot-reload-server.test.ts` for complete examples.
