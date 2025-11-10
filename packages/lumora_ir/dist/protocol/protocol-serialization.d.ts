/**
 * Protocol Serialization and Validation
 * Handles message serialization, deserialization, and validation
 */
import { HotReloadMessage, ConnectMessage, ConnectedMessage, UpdateMessage, ReloadMessage, ErrorMessage, PingMessage, PongMessage, AckMessage, SchemaUpdate, SchemaDelta } from './hot-reload-protocol';
import { LumoraIR } from '../types/ir-types';
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
export declare function serializeMessage(message: HotReloadMessage, options?: SerializationOptions): string;
/**
 * Deserialize a JSON string to protocol message
 */
export declare function deserializeMessage(data: string | Buffer, options?: DeserializationOptions): HotReloadMessage;
/**
 * Validate a protocol message
 */
export declare function validateMessage(message: any): ValidationResult;
/**
 * Validate protocol version compatibility
 */
export declare function validateProtocolVersion(clientVersion: string, serverVersion?: string): ValidationResult;
/**
 * Validate session ID format
 */
export declare function validateSessionId(sessionId: string): ValidationResult;
/**
 * Calculate checksum for schema
 * Excludes timestamp to ensure consistent checksums for same content
 */
export declare function calculateChecksum(schema: LumoraIR): string;
/**
 * Validate schema checksum
 */
export declare function validateChecksum(schema: LumoraIR, expectedChecksum: string): ValidationResult;
/**
 * Message builder utilities
 */
export declare function createConnectMessage(sessionId: string, deviceId: string, platform: string, deviceName?: string): ConnectMessage;
export declare function createConnectedMessage(sessionId: string, connectionId: string, initialSchema?: LumoraIR): ConnectedMessage;
export declare function createUpdateMessage(sessionId: string, update: SchemaUpdate): UpdateMessage;
export declare function createFullUpdate(schema: LumoraIR, sequenceNumber: number, preserveState?: boolean): SchemaUpdate;
export declare function createIncrementalUpdate(delta: SchemaDelta, sequenceNumber: number, preserveState?: boolean): SchemaUpdate;
export declare function createReloadMessage(sessionId: string, reason: 'error' | 'manual' | 'incompatible', error?: string): ReloadMessage;
export declare function createErrorMessage(sessionId: string, code: string, message: string, severity: 'warning' | 'error' | 'fatal', recoverable: boolean, details?: string): ErrorMessage;
export declare function createPingMessage(sessionId: string, status?: 'idle' | 'rendering' | 'updating'): PingMessage;
export declare function createPongMessage(sessionId: string): PongMessage;
export declare function createAckMessage(sessionId: string, sequenceNumber: number, success: boolean, error?: string, applyTime?: number): AckMessage;
/**
 * Calculate delta between two schemas
 */
export declare function calculateSchemaDelta(oldSchema: LumoraIR, newSchema: LumoraIR): SchemaDelta;
/**
 * Determine if incremental update is more efficient than full update
 */
export declare function shouldUseIncrementalUpdate(delta: SchemaDelta, threshold?: number): boolean;
