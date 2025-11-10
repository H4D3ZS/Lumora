# Hot Reload Protocol

This module implements the WebSocket-based hot reload protocol for real-time schema updates between the Lumora development server and connected devices.

## Overview

The hot reload protocol enables:
- Real-time schema updates to connected devices
- Incremental delta updates for efficiency
- State preservation during updates
- Connection management with heartbeat
- Error handling and recovery

## Usage

### Server-Side

```typescript
import {
  createConnectedMessage,
  createUpdateMessage,
  createFullUpdate,
  createIncrementalUpdate,
  calculateSchemaDelta,
  shouldUseIncrementalUpdate,
  serializeMessage,
  deserializeMessage,
} from '@lumora/ir/protocol';

// Handle connection
const connectedMsg = createConnectedMessage(
  sessionId,
  connectionId,
  initialSchema
);
ws.send(serializeMessage(connectedMsg));

// Send schema update
const delta = calculateSchemaDelta(oldSchema, newSchema);

if (shouldUseIncrementalUpdate(delta)) {
  const update = createIncrementalUpdate(delta, sequenceNumber);
  const updateMsg = createUpdateMessage(sessionId, update);
  ws.send(serializeMessage(updateMsg));
} else {
  const update = createFullUpdate(newSchema, sequenceNumber);
  const updateMsg = createUpdateMessage(sessionId, update);
  ws.send(serializeMessage(updateMsg));
}

// Handle incoming messages
ws.on('message', (data) => {
  const message = deserializeMessage(data, { validate: true });
  
  if (isPingMessage(message)) {
    const pong = createPongMessage(sessionId);
    ws.send(serializeMessage(pong));
  }
});
```

### Client-Side (Device)

```typescript
import {
  createConnectMessage,
  createAckMessage,
  createPingMessage,
  serializeMessage,
  deserializeMessage,
  isUpdateMessage,
  isPongMessage,
} from '@lumora/ir/protocol';

// Connect to server
const ws = new WebSocket(serverUrl);

ws.onopen = () => {
  const connectMsg = createConnectMessage(
    sessionId,
    deviceId,
    'ios',
    'iPhone 14 Pro'
  );
  ws.send(serializeMessage(connectMsg));
};

ws.onmessage = (event) => {
  const message = deserializeMessage(event.data, { validate: true });
  
  if (isUpdateMessage(message)) {
    const { payload } = message;
    
    try {
      if (payload.type === 'full') {
        applyFullUpdate(payload.schema);
      } else {
        applyIncrementalUpdate(payload.delta);
      }
      
      const ack = createAckMessage(
        sessionId,
        payload.sequenceNumber,
        true
      );
      ws.send(serializeMessage(ack));
    } catch (error) {
      const ack = createAckMessage(
        sessionId,
        payload.sequenceNumber,
        false,
        error.message
      );
      ws.send(serializeMessage(ack));
    }
  }
};

// Send heartbeat
setInterval(() => {
  const ping = createPingMessage(sessionId, 'idle');
  ws.send(serializeMessage(ping));
}, 30000);
```

## Message Types

### Connect
Device initiates connection with session ID and device info.

### Connected
Server acknowledges connection and sends initial schema.

### Update
Server sends schema update (full or incremental).

### Ack
Device acknowledges receipt and application of update.

### Reload
Either party requests full reload.

### Error
Either party reports an error.

### Ping/Pong
Heartbeat messages to maintain connection.

## Validation

All messages are validated against the protocol schema:

```typescript
import { validateMessage, validateProtocolVersion } from '@lumora/ir/protocol';

// Validate message structure
const result = validateMessage(message);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Validate protocol version compatibility
const versionResult = validateProtocolVersion(clientVersion, serverVersion);
if (!versionResult.valid) {
  console.error('Version incompatibility:', versionResult.errors);
}
```

## Delta Calculation

The protocol automatically calculates efficient deltas:

```typescript
import { calculateSchemaDelta, shouldUseIncrementalUpdate } from '@lumora/ir/protocol';

const delta = calculateSchemaDelta(oldSchema, newSchema);

console.log('Added nodes:', delta.added.length);
console.log('Modified nodes:', delta.modified.length);
console.log('Removed nodes:', delta.removed.length);

if (shouldUseIncrementalUpdate(delta)) {
  // Use incremental update
} else {
  // Use full update
}
```

## Checksum Validation

Ensure schema integrity with checksums:

```typescript
import { calculateChecksum, validateChecksum } from '@lumora/ir/protocol';

// Calculate checksum
const checksum = calculateChecksum(schema);

// Validate checksum
const result = validateChecksum(schema, expectedChecksum);
if (!result.valid) {
  console.error('Checksum mismatch!');
}
```

## Error Handling

```typescript
import { createErrorMessage, ProtocolErrorCode } from '@lumora/ir/protocol';

// Create error message
const errorMsg = createErrorMessage(
  sessionId,
  ProtocolErrorCode.UPDATE_FAILED,
  'Failed to apply schema update',
  'error',
  true, // recoverable
  stackTrace
);

ws.send(serializeMessage(errorMsg));
```

## Performance

- **Message Size**: Keep messages under 10MB
- **Update Frequency**: Max 10 updates/second
- **Heartbeat**: Every 30 seconds
- **Delta Threshold**: Use incremental for < 10 node changes

## Security

- Session IDs are cryptographically random (UUID v4)
- Rate limiting: 100 messages/second per connection
- All messages validated before processing
- Checksums verify schema integrity

## Testing

```typescript
import { validateMessage, serializeMessage, deserializeMessage } from '@lumora/ir/protocol';

// Test serialization round-trip
const original = createPingMessage(sessionId);
const serialized = serializeMessage(original);
const deserialized = deserializeMessage(serialized);

expect(deserialized).toEqual(original);

// Test validation
const result = validateMessage(deserialized);
expect(result.valid).toBe(true);
```

## See Also

- [PROTOCOL.md](./PROTOCOL.md) - Complete protocol specification
- [hot-reload-protocol.ts](./hot-reload-protocol.ts) - Type definitions
- [protocol-serialization.ts](./protocol-serialization.ts) - Serialization utilities
