import {
  PROTOCOL_VERSION,
  HotReloadMessage,
  ConnectMessage,
  UpdateMessage,
  SchemaUpdate,
  SchemaDelta,
  isConnectMessage,
  isUpdateMessage,
  isPingMessage,
  ProtocolErrorCode,
} from '../protocol/hot-reload-protocol';

import {
  serializeMessage,
  deserializeMessage,
  validateMessage,
  validateProtocolVersion,
  validateSessionId,
  calculateChecksum,
  validateChecksum,
  createConnectMessage,
  createConnectedMessage,
  createUpdateMessage,
  createFullUpdate,
  createIncrementalUpdate,
  createReloadMessage,
  createErrorMessage,
  createPingMessage,
  createPongMessage,
  createAckMessage,
  calculateSchemaDelta,
  shouldUseIncrementalUpdate,
} from '../protocol/protocol-serialization';

import { LumoraIR, LumoraNode } from '../types/ir-types';

describe('Hot Reload Protocol', () => {
  const sessionId = 'test-session-123';
  const deviceId = 'device-uuid-456';
  
  const createTestSchema = (): LumoraIR => ({
    version: '1.0.0',
    metadata: {
      sourceFramework: 'react',
      sourceFile: 'App.tsx',
      generatedAt: Date.now(),
    },
    nodes: [
      {
        id: 'node1',
        type: 'Container',
        props: { width: 100 },
        children: [],
        metadata: { lineNumber: 1 },
      },
    ],
  });

  describe('Message Type Guards', () => {
    it('should identify connect messages', () => {
      const msg = createConnectMessage(sessionId, deviceId, 'ios');
      expect(isConnectMessage(msg)).toBe(true);
      expect(isUpdateMessage(msg)).toBe(false);
    });

    it('should identify update messages', () => {
      const schema = createTestSchema();
      const update = createFullUpdate(schema, 1);
      const msg = createUpdateMessage(sessionId, update);
      expect(isUpdateMessage(msg)).toBe(true);
      expect(isConnectMessage(msg)).toBe(false);
    });

    it('should identify ping messages', () => {
      const msg = createPingMessage(sessionId);
      expect(isPingMessage(msg)).toBe(true);
      expect(isConnectMessage(msg)).toBe(false);
    });
  });

  describe('Message Serialization', () => {
    it('should serialize and deserialize connect message', () => {
      const original = createConnectMessage(sessionId, deviceId, 'ios', 'iPhone 14');
      const serialized = serializeMessage(original);
      const deserialized = deserializeMessage(serialized);

      expect(deserialized).toEqual(original);
      expect(deserialized.type).toBe('connect');
      expect(deserialized.payload.deviceId).toBe(deviceId);
    });

    it('should serialize and deserialize update message', () => {
      const schema = createTestSchema();
      const update = createFullUpdate(schema, 1);
      const original = createUpdateMessage(sessionId, update);
      const serialized = serializeMessage(original);
      const deserialized = deserializeMessage(serialized);

      expect(deserialized).toEqual(original);
      expect(deserialized.type).toBe('update');
      expect(deserialized.payload.type).toBe('full');
    });

    it('should handle pretty printing', () => {
      const msg = createPingMessage(sessionId);
      const pretty = serializeMessage(msg, { pretty: true });
      expect(pretty).toContain('\n');
      expect(pretty).toContain('  ');
    });

    it('should throw on invalid JSON', () => {
      expect(() => deserializeMessage('invalid json')).toThrow();
    });
  });

  describe('Message Validation', () => {
    it('should validate valid connect message', () => {
      const msg = createConnectMessage(sessionId, deviceId, 'ios');
      const result = validateMessage(msg);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject message without type', () => {
      const invalid: any = {
        sessionId,
        timestamp: Date.now(),
        version: PROTOCOL_VERSION,
      };
      const result = validateMessage(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject message without sessionId', () => {
      const invalid: any = {
        type: 'ping',
        timestamp: Date.now(),
        version: PROTOCOL_VERSION,
      };
      const result = validateMessage(invalid);
      expect(result.valid).toBe(false);
    });

    it('should reject message with invalid type', () => {
      const invalid: any = {
        type: 'invalid',
        sessionId,
        timestamp: Date.now(),
        version: PROTOCOL_VERSION,
      };
      const result = validateMessage(invalid);
      expect(result.valid).toBe(false);
    });

    it('should validate connect message payload', () => {
      const msg = createConnectMessage(sessionId, deviceId, 'ios');
      const result = validateMessage(msg);
      expect(result.valid).toBe(true);
    });

    it('should reject connect message without deviceId', () => {
      const invalid: any = {
        type: 'connect',
        sessionId,
        timestamp: Date.now(),
        version: PROTOCOL_VERSION,
        payload: {
          platform: 'ios',
          clientVersion: PROTOCOL_VERSION,
        },
      };
      const result = validateMessage(invalid);
      expect(result.valid).toBe(false);
    });

    it('should validate update message payload', () => {
      const schema = createTestSchema();
      const update = createFullUpdate(schema, 1);
      const msg = createUpdateMessage(sessionId, update);
      const result = validateMessage(msg);
      expect(result.valid).toBe(true);
    });

    it('should reject full update without schema', () => {
      const invalid: any = {
        type: 'update',
        sessionId,
        timestamp: Date.now(),
        version: PROTOCOL_VERSION,
        payload: {
          type: 'full',
          preserveState: true,
          sequenceNumber: 1,
        },
      };
      const result = validateMessage(invalid);
      expect(result.valid).toBe(false);
    });

    it('should reject incremental update without delta', () => {
      const invalid: any = {
        type: 'update',
        sessionId,
        timestamp: Date.now(),
        version: PROTOCOL_VERSION,
        payload: {
          type: 'incremental',
          preserveState: true,
          sequenceNumber: 1,
        },
      };
      const result = validateMessage(invalid);
      expect(result.valid).toBe(false);
    });
  });

  describe('Protocol Version Validation', () => {
    it('should accept matching versions', () => {
      const result = validateProtocolVersion('1.0.0', '1.0.0');
      expect(result.valid).toBe(true);
    });

    it('should reject different major versions', () => {
      const result = validateProtocolVersion('2.0.0', '1.0.0');
      expect(result.valid).toBe(false);
    });

    it('should warn on different minor versions', () => {
      const result = validateProtocolVersion('1.1.0', '1.0.0');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept same major and minor versions', () => {
      const result = validateProtocolVersion('1.0.1', '1.0.0');
      expect(result.valid).toBe(true);
    });
  });

  describe('Session ID Validation', () => {
    it('should accept valid session IDs', () => {
      const result = validateSessionId('abc123def456');
      expect(result.valid).toBe(true);
    });

    it('should reject empty session ID', () => {
      const result = validateSessionId('');
      expect(result.valid).toBe(false);
    });

    it('should reject too short session ID', () => {
      const result = validateSessionId('abc');
      expect(result.valid).toBe(false);
    });

    it('should reject too long session ID', () => {
      const longId = 'a'.repeat(200);
      const result = validateSessionId(longId);
      expect(result.valid).toBe(false);
    });
  });

  describe('Checksum Calculation', () => {
    it('should calculate consistent checksums', () => {
      const schema = createTestSchema();
      const checksum1 = calculateChecksum(schema);
      const checksum2 = calculateChecksum(schema);
      expect(checksum1).toBe(checksum2);
    });

    it('should produce different checksums for different schemas', () => {
      const schema1: LumoraIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'App.tsx',
          generatedAt: 12345,
        },
        nodes: [
          {
            id: 'node1',
            type: 'Container',
            props: { width: 100 },
            children: [],
            metadata: { lineNumber: 1 },
          },
        ],
      };
      
      const schema2: LumoraIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'App.tsx',
          generatedAt: 67890, // Different timestamp (should be ignored)
        },
        nodes: [
          {
            id: 'node1',
            type: 'Container',
            props: { width: 200 }, // Different width
            children: [],
            metadata: { lineNumber: 1 },
          },
        ],
      };
      
      const checksum1 = calculateChecksum(schema1);
      const checksum2 = calculateChecksum(schema2);
      
      expect(checksum1).not.toBe(checksum2);
    });

    it('should validate matching checksums', () => {
      const schema = createTestSchema();
      const checksum = calculateChecksum(schema);
      const result = validateChecksum(schema, checksum);
      expect(result.valid).toBe(true);
    });

    it('should reject mismatched checksums', () => {
      const schema = createTestSchema();
      const result = validateChecksum(schema, 'invalid-checksum');
      expect(result.valid).toBe(false);
    });
  });

  describe('Message Builders', () => {
    it('should create connect message', () => {
      const msg = createConnectMessage(sessionId, deviceId, 'ios', 'iPhone');
      expect(msg.type).toBe('connect');
      expect(msg.sessionId).toBe(sessionId);
      expect(msg.payload.deviceId).toBe(deviceId);
      expect(msg.payload.platform).toBe('ios');
      expect(msg.payload.deviceName).toBe('iPhone');
    });

    it('should create connected message', () => {
      const schema = createTestSchema();
      const msg = createConnectedMessage(sessionId, 'conn-123', schema);
      expect(msg.type).toBe('connected');
      expect(msg.payload.connectionId).toBe('conn-123');
      expect(msg.payload.initialSchema).toEqual(schema);
    });

    it('should create full update', () => {
      const schema = createTestSchema();
      const update = createFullUpdate(schema, 1, true);
      expect(update.type).toBe('full');
      expect(update.schema).toEqual(schema);
      expect(update.sequenceNumber).toBe(1);
      expect(update.preserveState).toBe(true);
      expect(update.checksum).toBeDefined();
    });

    it('should create incremental update', () => {
      const delta: SchemaDelta = {
        added: [],
        modified: [],
        removed: [],
      };
      const update = createIncrementalUpdate(delta, 2, false);
      expect(update.type).toBe('incremental');
      expect(update.delta).toEqual(delta);
      expect(update.sequenceNumber).toBe(2);
      expect(update.preserveState).toBe(false);
    });

    it('should create reload message', () => {
      const msg = createReloadMessage(sessionId, 'error', 'Test error');
      expect(msg.type).toBe('reload');
      expect(msg.payload.reason).toBe('error');
      expect(msg.payload.error).toBe('Test error');
    });

    it('should create error message', () => {
      const msg = createErrorMessage(
        sessionId,
        ProtocolErrorCode.UPDATE_FAILED,
        'Update failed',
        'error',
        true,
        'Stack trace'
      );
      expect(msg.type).toBe('error');
      expect(msg.payload.code).toBe(ProtocolErrorCode.UPDATE_FAILED);
      expect(msg.payload.severity).toBe('error');
      expect(msg.payload.recoverable).toBe(true);
    });

    it('should create ping message', () => {
      const msg = createPingMessage(sessionId, 'idle');
      expect(msg.type).toBe('ping');
      expect(msg.payload?.status).toBe('idle');
    });

    it('should create pong message', () => {
      const msg = createPongMessage(sessionId);
      expect(msg.type).toBe('pong');
      expect(msg.payload?.serverTime).toBeDefined();
    });

    it('should create ack message', () => {
      const msg = createAckMessage(sessionId, 5, true, undefined, 150);
      expect(msg.type).toBe('ack');
      expect(msg.payload.sequenceNumber).toBe(5);
      expect(msg.payload.success).toBe(true);
      expect(msg.payload.applyTime).toBe(150);
    });
  });

  describe('Delta Calculation', () => {
    it('should detect added nodes', () => {
      const oldSchema = createTestSchema();
      const newSchema = createTestSchema();
      newSchema.nodes.push({
        id: 'node2',
        type: 'Text',
        props: {},
        children: [],
        metadata: { lineNumber: 2 },
      });

      const delta = calculateSchemaDelta(oldSchema, newSchema);
      expect(delta.added).toHaveLength(1);
      expect(delta.added[0].id).toBe('node2');
      expect(delta.modified).toHaveLength(0);
      expect(delta.removed).toHaveLength(0);
    });

    it('should detect modified nodes', () => {
      const oldSchema = createTestSchema();
      const newSchema = createTestSchema();
      newSchema.nodes[0].props.width = 200;

      const delta = calculateSchemaDelta(oldSchema, newSchema);
      expect(delta.added).toHaveLength(0);
      expect(delta.modified).toHaveLength(1);
      expect(delta.modified[0].id).toBe('node1');
      expect(delta.removed).toHaveLength(0);
    });

    it('should detect removed nodes', () => {
      const oldSchema = createTestSchema();
      const newSchema = createTestSchema();
      newSchema.nodes = [];

      const delta = calculateSchemaDelta(oldSchema, newSchema);
      expect(delta.added).toHaveLength(0);
      expect(delta.modified).toHaveLength(0);
      expect(delta.removed).toHaveLength(1);
      expect(delta.removed[0]).toBe('node1');
    });

    it('should detect metadata changes', () => {
      const oldSchema = createTestSchema();
      const newSchema = createTestSchema();
      newSchema.version = '2.0.0';

      const delta = calculateSchemaDelta(oldSchema, newSchema);
      expect(delta.metadataChanges).toBeDefined();
      expect(delta.metadataChanges?.version).toBe('2.0.0');
    });

    it('should handle no changes', () => {
      const oldSchema = createTestSchema();
      const newSchema = createTestSchema();

      const delta = calculateSchemaDelta(oldSchema, newSchema);
      expect(delta.added).toHaveLength(0);
      expect(delta.modified).toHaveLength(0);
      expect(delta.removed).toHaveLength(0);
    });
  });

  describe('Update Strategy', () => {
    it('should recommend incremental for small changes', () => {
      const delta: SchemaDelta = {
        added: [],
        modified: [
          {
            id: 'node1',
            type: 'Container',
            props: {},
            children: [],
            metadata: { lineNumber: 1 },
          },
        ],
        removed: [],
      };

      expect(shouldUseIncrementalUpdate(delta)).toBe(true);
    });

    it('should recommend full update for large changes', () => {
      const delta: SchemaDelta = {
        added: Array(15).fill(null).map((_, i) => ({
          id: `node${i}`,
          type: 'Container',
          props: {},
          children: [],
          metadata: { lineNumber: i },
        })),
        modified: [],
        removed: [],
      };

      expect(shouldUseIncrementalUpdate(delta)).toBe(false);
    });

    it('should recommend full update for no changes', () => {
      const delta: SchemaDelta = {
        added: [],
        modified: [],
        removed: [],
      };

      expect(shouldUseIncrementalUpdate(delta)).toBe(false);
    });

    it('should use custom threshold', () => {
      const delta: SchemaDelta = {
        added: Array(3).fill(null).map((_, i) => ({
          id: `node${i}`,
          type: 'Container',
          props: {},
          children: [],
          metadata: { lineNumber: i },
        })),
        modified: [],
        removed: [],
      };

      expect(shouldUseIncrementalUpdate(delta, 5)).toBe(true);
      expect(shouldUseIncrementalUpdate(delta, 2)).toBe(false);
    });
  });

  describe('Validation with Serialization', () => {
    it('should validate during serialization when enabled', () => {
      const msg = createPingMessage(sessionId);
      expect(() => serializeMessage(msg, { validate: true })).not.toThrow();
    });

    it('should throw on invalid message during serialization', () => {
      const invalid: any = { type: 'invalid' };
      expect(() => serializeMessage(invalid, { validate: true })).toThrow();
    });

    it('should validate during deserialization when enabled', () => {
      const msg = createPingMessage(sessionId);
      const serialized = serializeMessage(msg);
      expect(() => deserializeMessage(serialized, { validate: true })).not.toThrow();
    });

    it('should throw on invalid message during deserialization', () => {
      const invalid = JSON.stringify({ type: 'invalid' });
      expect(() => deserializeMessage(invalid, { validate: true })).toThrow();
    });
  });
});
