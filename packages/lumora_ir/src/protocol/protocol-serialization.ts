/**
 * Protocol Serialization and Validation
 * Handles message serialization, deserialization, and validation
 */

import * as crypto from 'crypto';
import {
  HotReloadMessage,
  ConnectMessage,
  ConnectedMessage,
  UpdateMessage,
  ReloadMessage,
  ErrorMessage,
  PingMessage,
  PongMessage,
  AckMessage,
  SchemaUpdate,
  SchemaDelta,
  MessageType,
  PROTOCOL_VERSION,
  ProtocolErrorCode,
} from './hot-reload-protocol';
import { LumoraIR, LumoraNode } from '../types/ir-types';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Serialization options
 */
export interface SerializationOptions {
  /** Pretty print JSON (for debugging) */
  pretty?: boolean;
  
  /** Validate before serialization */
  validate?: boolean;
}

/**
 * Deserialization options
 */
export interface DeserializationOptions {
  /** Validate after deserialization */
  validate?: boolean;
  
  /** Strict mode (fail on unknown fields) */
  strict?: boolean;
}

/**
 * Serialize a protocol message to JSON string
 */
export function serializeMessage(
  message: HotReloadMessage,
  options: SerializationOptions = {}
): string {
  if (options.validate) {
    const validation = validateMessage(message);
    if (!validation.valid) {
      throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
    }
  }
  
  return JSON.stringify(message, null, options.pretty ? 2 : 0);
}

/**
 * Deserialize a JSON string to protocol message
 */
export function deserializeMessage(
  data: string | Buffer,
  options: DeserializationOptions = {}
): HotReloadMessage {
  try {
    const json = typeof data === 'string' ? data : data.toString('utf-8');
    const message = JSON.parse(json) as HotReloadMessage;
    
    if (options.validate) {
      const validation = validateMessage(message);
      if (!validation.valid) {
        throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    return message;
  } catch (error) {
    throw new Error(`Failed to deserialize message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate a protocol message
 */
export function validateMessage(message: any): ValidationResult {
  const errors: string[] = [];
  
  // Check required base fields
  if (!message || typeof message !== 'object') {
    errors.push('Message must be an object');
    return { valid: false, errors };
  }
  
  if (!message.type || typeof message.type !== 'string') {
    errors.push('Message must have a type field');
  }
  
  if (!message.sessionId || typeof message.sessionId !== 'string') {
    errors.push('Message must have a sessionId field');
  }
  
  if (typeof message.timestamp !== 'number') {
    errors.push('Message must have a timestamp field');
  }
  
  if (!message.version || typeof message.version !== 'string') {
    errors.push('Message must have a version field');
  }
  
  // Validate message type
  const validTypes: MessageType[] = [
    'connect', 'connected', 'update', 'reload', 'error', 'ping', 'pong', 'ack'
  ];
  
  if (!validTypes.includes(message.type)) {
    errors.push(`Invalid message type: ${message.type}`);
  }
  
  // Type-specific validation
  switch (message.type) {
    case 'connect':
      validateConnectMessage(message, errors);
      break;
    case 'connected':
      validateConnectedMessage(message, errors);
      break;
    case 'update':
      validateUpdateMessage(message, errors);
      break;
    case 'reload':
      validateReloadMessage(message, errors);
      break;
    case 'error':
      validateErrorMessage(message, errors);
      break;
    case 'ack':
      validateAckMessage(message, errors);
      break;
    // ping and pong have no required payload fields
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateConnectMessage(message: any, errors: string[]): void {
  if (!message.payload) {
    errors.push('Connect message must have payload');
    return;
  }
  
  const { payload } = message;
  
  if (!payload.deviceId || typeof payload.deviceId !== 'string') {
    errors.push('Connect payload must have deviceId');
  }
  
  if (!payload.platform || typeof payload.platform !== 'string') {
    errors.push('Connect payload must have platform');
  }
  
  if (!payload.clientVersion || typeof payload.clientVersion !== 'string') {
    errors.push('Connect payload must have clientVersion');
  }
}

function validateConnectedMessage(message: any, errors: string[]): void {
  if (!message.payload) {
    errors.push('Connected message must have payload');
    return;
  }
  
  const { payload } = message;
  
  if (!payload.connectionId || typeof payload.connectionId !== 'string') {
    errors.push('Connected payload must have connectionId');
  }
  
  if (!payload.capabilities || typeof payload.capabilities !== 'object') {
    errors.push('Connected payload must have capabilities');
  }
}

function validateUpdateMessage(message: any, errors: string[]): void {
  if (!message.payload) {
    errors.push('Update message must have payload');
    return;
  }
  
  const { payload } = message;
  
  if (!payload.type || !['full', 'incremental'].includes(payload.type)) {
    errors.push('Update payload must have type (full or incremental)');
  }
  
  if (payload.type === 'full' && !payload.schema) {
    errors.push('Full update must have schema');
  }
  
  if (payload.type === 'incremental' && !payload.delta) {
    errors.push('Incremental update must have delta');
  }
  
  if (typeof payload.preserveState !== 'boolean') {
    errors.push('Update payload must have preserveState boolean');
  }
  
  if (typeof payload.sequenceNumber !== 'number') {
    errors.push('Update payload must have sequenceNumber');
  }
}

function validateReloadMessage(message: any, errors: string[]): void {
  if (!message.payload) {
    errors.push('Reload message must have payload');
    return;
  }
  
  const { payload } = message;
  
  if (!payload.reason || !['error', 'manual', 'incompatible'].includes(payload.reason)) {
    errors.push('Reload payload must have reason (error, manual, or incompatible)');
  }
}

function validateErrorMessage(message: any, errors: string[]): void {
  if (!message.payload) {
    errors.push('Error message must have payload');
    return;
  }
  
  const { payload } = message;
  
  if (!payload.code || typeof payload.code !== 'string') {
    errors.push('Error payload must have code');
  }
  
  if (!payload.message || typeof payload.message !== 'string') {
    errors.push('Error payload must have message');
  }
  
  if (!payload.severity || !['warning', 'error', 'fatal'].includes(payload.severity)) {
    errors.push('Error payload must have severity (warning, error, or fatal)');
  }
  
  if (typeof payload.recoverable !== 'boolean') {
    errors.push('Error payload must have recoverable boolean');
  }
}

function validateAckMessage(message: any, errors: string[]): void {
  if (!message.payload) {
    errors.push('Ack message must have payload');
    return;
  }
  
  const { payload } = message;
  
  if (typeof payload.sequenceNumber !== 'number') {
    errors.push('Ack payload must have sequenceNumber');
  }
  
  if (typeof payload.success !== 'boolean') {
    errors.push('Ack payload must have success boolean');
  }
}

/**
 * Validate protocol version compatibility
 */
export function validateProtocolVersion(clientVersion: string, serverVersion: string = PROTOCOL_VERSION): ValidationResult {
  const errors: string[] = [];
  
  const parseVersion = (version: string): [number, number, number] => {
    const parts = version.split('.').map(Number);
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  };
  
  const [clientMajor, clientMinor] = parseVersion(clientVersion);
  const [serverMajor, serverMinor] = parseVersion(serverVersion);
  
  // Major version must match
  if (clientMajor !== serverMajor) {
    errors.push(`Incompatible protocol versions: client ${clientVersion}, server ${serverVersion}`);
  }
  
  // Warn if minor version differs
  if (clientMinor !== serverMinor) {
    errors.push(`Protocol minor version mismatch: client ${clientVersion}, server ${serverVersion} (may have limited features)`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate session ID format
 */
export function validateSessionId(sessionId: string): ValidationResult {
  const errors: string[] = [];
  
  // Session ID should be a valid UUID v4 or similar format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!sessionId || typeof sessionId !== 'string') {
    errors.push('Session ID must be a string');
  } else if (sessionId.length < 8) {
    errors.push('Session ID too short');
  } else if (sessionId.length > 128) {
    errors.push('Session ID too long');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate checksum for schema
 * Excludes timestamp to ensure consistent checksums for same content
 */
export function calculateChecksum(schema: LumoraIR): string {
  // Deep clone and normalize timestamp for consistent checksums
  const schemaForChecksum = JSON.parse(JSON.stringify(schema));
  schemaForChecksum.metadata.generatedAt = 0;
  
  // Stringify with sorted keys for consistent ordering
  const json = JSON.stringify(schemaForChecksum, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((sorted: any, key) => {
          sorted[key] = value[key];
          return sorted;
        }, {});
    }
    return value;
  });
  
  return crypto.createHash('sha256').update(json).digest('hex');
}

/**
 * Validate schema checksum
 */
export function validateChecksum(schema: LumoraIR, expectedChecksum: string): ValidationResult {
  const errors: string[] = [];
  
  const actualChecksum = calculateChecksum(schema);
  
  if (actualChecksum !== expectedChecksum) {
    errors.push(`Checksum mismatch: expected ${expectedChecksum}, got ${actualChecksum}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Message builder utilities
 */

export function createConnectMessage(
  sessionId: string,
  deviceId: string,
  platform: string,
  deviceName?: string
): ConnectMessage {
  return {
    type: 'connect',
    sessionId,
    timestamp: Date.now(),
    version: PROTOCOL_VERSION,
    payload: {
      deviceId,
      platform,
      deviceName,
      clientVersion: PROTOCOL_VERSION,
    },
  };
}

export function createConnectedMessage(
  sessionId: string,
  connectionId: string,
  initialSchema?: LumoraIR
): ConnectedMessage {
  return {
    type: 'connected',
    sessionId,
    timestamp: Date.now(),
    version: PROTOCOL_VERSION,
    payload: {
      connectionId,
      initialSchema,
      capabilities: {
        incrementalUpdates: true,
        compression: false,
        statePreservation: true,
      },
    },
  };
}

export function createUpdateMessage(
  sessionId: string,
  update: SchemaUpdate
): UpdateMessage {
  return {
    type: 'update',
    sessionId,
    timestamp: Date.now(),
    version: PROTOCOL_VERSION,
    payload: update,
  };
}

export function createFullUpdate(
  schema: LumoraIR,
  sequenceNumber: number,
  preserveState: boolean = true
): SchemaUpdate {
  return {
    type: 'full',
    schema,
    preserveState,
    sequenceNumber,
    checksum: calculateChecksum(schema),
  };
}

export function createIncrementalUpdate(
  delta: SchemaDelta,
  sequenceNumber: number,
  preserveState: boolean = true
): SchemaUpdate {
  return {
    type: 'incremental',
    delta,
    preserveState,
    sequenceNumber,
  };
}

export function createReloadMessage(
  sessionId: string,
  reason: 'error' | 'manual' | 'incompatible',
  error?: string
): ReloadMessage {
  return {
    type: 'reload',
    sessionId,
    timestamp: Date.now(),
    version: PROTOCOL_VERSION,
    payload: {
      reason,
      error,
    },
  };
}

export function createErrorMessage(
  sessionId: string,
  code: string,
  message: string,
  severity: 'warning' | 'error' | 'fatal',
  recoverable: boolean,
  details?: string
): ErrorMessage {
  return {
    type: 'error',
    sessionId,
    timestamp: Date.now(),
    version: PROTOCOL_VERSION,
    payload: {
      code,
      message,
      severity,
      details,
      recoverable,
    },
  };
}

export function createPingMessage(
  sessionId: string,
  status?: 'idle' | 'rendering' | 'updating'
): PingMessage {
  return {
    type: 'ping',
    sessionId,
    timestamp: Date.now(),
    version: PROTOCOL_VERSION,
    payload: status ? { status } : undefined,
  };
}

export function createPongMessage(
  sessionId: string
): PongMessage {
  return {
    type: 'pong',
    sessionId,
    timestamp: Date.now(),
    version: PROTOCOL_VERSION,
    payload: {
      serverTime: Date.now(),
    },
  };
}

export function createAckMessage(
  sessionId: string,
  sequenceNumber: number,
  success: boolean,
  error?: string,
  applyTime?: number
): AckMessage {
  return {
    type: 'ack',
    sessionId,
    timestamp: Date.now(),
    version: PROTOCOL_VERSION,
    payload: {
      sequenceNumber,
      success,
      error,
      applyTime,
    },
  };
}

/**
 * Calculate delta between two schemas
 */
export function calculateSchemaDelta(
  oldSchema: LumoraIR,
  newSchema: LumoraIR
): SchemaDelta {
  const oldNodes = new Map(oldSchema.nodes.map(n => [n.id, n]));
  const newNodes = new Map(newSchema.nodes.map(n => [n.id, n]));
  
  const added: LumoraNode[] = [];
  const modified: LumoraNode[] = [];
  const removed: string[] = [];
  
  // Find added and modified nodes
  newNodes.forEach((node, id) => {
    const oldNode = oldNodes.get(id);
    if (!oldNode) {
      added.push(node);
    } else if (JSON.stringify(oldNode) !== JSON.stringify(node)) {
      modified.push(node);
    }
  });
  
  // Find removed nodes
  oldNodes.forEach((node, id) => {
    if (!newNodes.has(id)) {
      removed.push(id);
    }
  });
  
  // Check for metadata changes
  const metadataChanges: any = {};
  let hasMetadataChanges = false;
  
  if (oldSchema.version !== newSchema.version) {
    metadataChanges.version = newSchema.version;
    hasMetadataChanges = true;
  }
  
  if (JSON.stringify(oldSchema.theme) !== JSON.stringify(newSchema.theme)) {
    metadataChanges.theme = newSchema.theme;
    hasMetadataChanges = true;
  }
  
  if (JSON.stringify(oldSchema.navigation) !== JSON.stringify(newSchema.navigation)) {
    metadataChanges.navigation = newSchema.navigation;
    hasMetadataChanges = true;
  }
  
  return {
    added,
    modified,
    removed,
    metadataChanges: hasMetadataChanges ? metadataChanges : undefined,
  };
}

/**
 * Determine if incremental update is more efficient than full update
 */
export function shouldUseIncrementalUpdate(delta: SchemaDelta, threshold: number = 10): boolean {
  const totalChanges = delta.added.length + delta.modified.length + delta.removed.length;
  return totalChanges < threshold && totalChanges > 0;
}
