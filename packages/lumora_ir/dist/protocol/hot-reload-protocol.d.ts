/**
 * Hot Reload Protocol
 * WebSocket-based protocol for real-time schema updates between dev server and devices
 */
import { LumoraIR, LumoraNode } from '../types/ir-types';
/**
 * Protocol version for compatibility checking
 */
export declare const PROTOCOL_VERSION = "1.0.0";
/**
 * Message types supported by the hot reload protocol
 */
export type MessageType = 'connect' | 'connected' | 'update' | 'reload' | 'error' | 'ping' | 'pong' | 'ack';
/**
 * Base message structure for all protocol messages
 */
export interface HotReloadMessage {
    /** Message type identifier */
    type: MessageType;
    /** Session ID for routing */
    sessionId: string;
    /** Message timestamp (Unix milliseconds) */
    timestamp: number;
    /** Protocol version */
    version: string;
    /** Optional message payload */
    payload?: any;
}
/**
 * Connection request from device to server
 */
export interface ConnectMessage extends HotReloadMessage {
    type: 'connect';
    payload: {
        /** Device identifier (UUID) */
        deviceId: string;
        /** Device platform (ios, android, web) */
        platform: string;
        /** Device name for display */
        deviceName?: string;
        /** Client protocol version */
        clientVersion: string;
    };
}
/**
 * Connection acknowledgment from server
 */
export interface ConnectedMessage extends HotReloadMessage {
    type: 'connected';
    payload: {
        /** Server-assigned connection ID */
        connectionId: string;
        /** Initial schema to load */
        initialSchema?: LumoraIR;
        /** Server capabilities */
        capabilities: {
            incrementalUpdates: boolean;
            compression: boolean;
            statePreservation: boolean;
        };
    };
}
/**
 * Schema update from server to device
 */
export interface UpdateMessage extends HotReloadMessage {
    type: 'update';
    payload: SchemaUpdate;
}
/**
 * Schema update payload with full or incremental data
 */
export interface SchemaUpdate {
    /** Update type: full schema replacement or incremental delta */
    type: 'full' | 'incremental';
    /** Full schema (for full updates) */
    schema?: LumoraIR;
    /** Delta changes (for incremental updates) */
    delta?: SchemaDelta;
    /** Whether to preserve app state during update */
    preserveState: boolean;
    /** Update sequence number for ordering */
    sequenceNumber: number;
    /** Optional checksum for validation */
    checksum?: string;
}
/**
 * Incremental schema changes
 */
export interface SchemaDelta {
    /** Nodes added to the schema */
    added: LumoraNode[];
    /** Nodes modified in the schema */
    modified: LumoraNode[];
    /** Node IDs removed from the schema */
    removed: string[];
    /** Metadata changes */
    metadataChanges?: {
        version?: string;
        theme?: any;
        navigation?: any;
    };
}
/**
 * Full reload request (fallback when delta fails)
 */
export interface ReloadMessage extends HotReloadMessage {
    type: 'reload';
    payload: {
        /** Reason for reload */
        reason: 'error' | 'manual' | 'incompatible';
        /** Optional error details */
        error?: string;
    };
}
/**
 * Error notification
 */
export interface ErrorMessage extends HotReloadMessage {
    type: 'error';
    payload: {
        /** Error code */
        code: string;
        /** Human-readable error message */
        message: string;
        /** Error severity */
        severity: 'warning' | 'error' | 'fatal';
        /** Stack trace or additional details */
        details?: string;
        /** Whether the error is recoverable */
        recoverable: boolean;
    };
}
/**
 * Heartbeat ping from client
 */
export interface PingMessage extends HotReloadMessage {
    type: 'ping';
    payload?: {
        /** Optional client status */
        status?: 'idle' | 'rendering' | 'updating';
    };
}
/**
 * Heartbeat pong from server
 */
export interface PongMessage extends HotReloadMessage {
    type: 'pong';
    payload?: {
        /** Server timestamp for latency calculation */
        serverTime: number;
    };
}
/**
 * Acknowledgment of received update
 */
export interface AckMessage extends HotReloadMessage {
    type: 'ack';
    payload: {
        /** Sequence number being acknowledged */
        sequenceNumber: number;
        /** Whether update was applied successfully */
        success: boolean;
        /** Optional error if update failed */
        error?: string;
        /** Time taken to apply update (ms) */
        applyTime?: number;
    };
}
/**
 * Type guard for message types
 */
export declare function isConnectMessage(msg: HotReloadMessage): msg is ConnectMessage;
export declare function isConnectedMessage(msg: HotReloadMessage): msg is ConnectedMessage;
export declare function isUpdateMessage(msg: HotReloadMessage): msg is UpdateMessage;
export declare function isReloadMessage(msg: HotReloadMessage): msg is ReloadMessage;
export declare function isErrorMessage(msg: HotReloadMessage): msg is ErrorMessage;
export declare function isPingMessage(msg: HotReloadMessage): msg is PingMessage;
export declare function isPongMessage(msg: HotReloadMessage): msg is PongMessage;
export declare function isAckMessage(msg: HotReloadMessage): msg is AckMessage;
/**
 * Error codes for protocol errors
 */
export declare enum ProtocolErrorCode {
    INVALID_MESSAGE = "INVALID_MESSAGE",
    UNSUPPORTED_VERSION = "UNSUPPORTED_VERSION",
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
    SCHEMA_VALIDATION_FAILED = "SCHEMA_VALIDATION_FAILED",
    UPDATE_FAILED = "UPDATE_FAILED",
    CHECKSUM_MISMATCH = "CHECKSUM_MISMATCH",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
