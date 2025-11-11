/**
 * Hot Reload Server
 * WebSocket-based server for real-time schema updates with hot reload protocol
 */
import { WebSocket } from 'ws';
import * as http from 'http';
import { SchemaDelta } from 'lumora-ir/src/protocol/hot-reload-protocol';
import { LumoraIR } from 'lumora-ir/src/types/ir-types';
/**
 * Device connection information
 */
export interface DeviceConnection {
    /** Unique connection ID */
    connectionId: string;
    /** Device ID from client */
    deviceId: string;
    /** Device platform */
    platform: string;
    /** Device name */
    deviceName?: string;
    /** WebSocket connection */
    ws: WebSocket;
    /** Connection timestamp */
    connectedAt: number;
    /** Last ping timestamp */
    lastPing: number;
    /** Client protocol version */
    clientVersion: string;
    /** Last acknowledged sequence number */
    lastAckSequence: number;
}
/**
 * Session information
 */
export interface HotReloadSession {
    /** Session ID */
    id: string;
    /** Session creation timestamp */
    createdAt: number;
    /** Connected devices */
    devices: Map<string, DeviceConnection>;
    /** Current schema */
    currentSchema?: LumoraIR;
    /** Update sequence number */
    sequenceNumber: number;
    /** Session expiry timestamp */
    expiresAt: number;
}
/**
 * Hot Reload Server Configuration
 */
export interface HotReloadServerConfig {
    /** HTTP server to attach WebSocket to */
    server: http.Server;
    /** WebSocket path */
    path?: string;
    /** Session timeout in milliseconds (default: 8 hours) */
    sessionTimeout?: number;
    /** Heartbeat interval in milliseconds (default: 30 seconds) */
    heartbeatInterval?: number;
    /** Connection timeout in milliseconds (default: 60 seconds) */
    connectionTimeout?: number;
    /** Enable verbose logging */
    verbose?: boolean;
}
/**
 * Hot Reload Server
 * Manages WebSocket connections and distributes schema updates
 */
export declare class HotReloadServer {
    private wss;
    private sessions;
    private config;
    private heartbeatTimer?;
    private cleanupTimer?;
    constructor(config: HotReloadServerConfig);
    /**
     * Setup WebSocket server and connection handling
     */
    private setupWebSocketServer;
    /**
     * Setup handlers for a specific WebSocket connection
     */
    private setupConnectionHandlers;
    /**
     * Handle connect message from device
     */
    private handleConnect;
    /**
     * Handle ping message from device
     */
    private handlePing;
    /**
     * Handle acknowledgment message from device
     */
    private handleAck;
    /**
     * Handle device disconnection
     */
    private handleDisconnect;
    /**
     * Create a new session
     */
    createSession(): HotReloadSession;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): HotReloadSession | undefined;
    /**
     * Delete session
     */
    deleteSession(sessionId: string): boolean;
    /**
     * Send message to WebSocket
     */
    private sendMessage;
    /**
     * Send error message to WebSocket
     */
    private sendError;
    /**
     * Start heartbeat monitoring
     */
    private startHeartbeat;
    /**
     * Start session cleanup
     */
    private startCleanup;
    /**
     * Stop the server
     */
    stop(): void;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Generate unique connection ID
     */
    private generateConnectionId;
    /**
     * Log message if verbose mode is enabled
     */
    private log;
    private updateBatches;
    private readonly BATCH_DELAY_MS;
    /**
     * Push schema update to all devices in a session
     * Automatically determines whether to use full or incremental update
     * OPTIMIZED: Batches rapid updates to reduce message overhead
     */
    pushUpdate(sessionId: string, schema: LumoraIR, preserveState?: boolean): {
        success: boolean;
        devicesUpdated: number;
        updateType: 'full' | 'incremental';
        error?: string;
        batched?: boolean;
    };
    /**
     * Flush batched update immediately
     * OPTIMIZATION: Sends the accumulated update
     */
    private flushUpdate;
    /**
     * Push update immediately without batching
     * OPTIMIZATION: Bypasses batching for critical updates
     */
    pushUpdateImmediate(sessionId: string, schema: LumoraIR, preserveState?: boolean): {
        success: boolean;
        devicesUpdated: number;
        updateType: 'full' | 'incremental';
        error?: string;
    };
    /**
     * Broadcast update to all devices in a session
     */
    private broadcastUpdate;
    /**
     * Push full schema update to a specific device
     * Useful for reconnection scenarios
     */
    pushUpdateToDevice(sessionId: string, connectionId: string, schema: LumoraIR, preserveState?: boolean): boolean;
    /**
     * Calculate delta between two schemas
     * Exposed for testing and external use
     */
    calculateDelta(oldSchema: LumoraIR, newSchema: LumoraIR): SchemaDelta;
    /**
     * Handle update acknowledgment tracking
     * Returns devices that haven't acknowledged the given sequence number
     */
    getUnacknowledgedDevices(sessionId: string, sequenceNumber: number): DeviceConnection[];
    /**
     * Get all connected devices for a session
     */
    getConnectedDevices(sessionId: string): DeviceConnection[];
    /**
     * Get specific device connection
     */
    getDevice(sessionId: string, connectionId: string): DeviceConnection | undefined;
    /**
     * Check if a device is still connected and responsive
     */
    isDeviceHealthy(sessionId: string, connectionId: string): boolean;
    /**
     * Manually disconnect a device
     */
    disconnectDevice(sessionId: string, connectionId: string, reason?: string): boolean;
    /**
     * Extend session expiry time
     */
    extendSession(sessionId: string, additionalTime?: number): boolean;
    /**
     * Get connection health status for all devices in a session
     */
    getSessionHealth(sessionId: string): {
        sessionId: string;
        totalDevices: number;
        healthyDevices: number;
        unhealthyDevices: number;
        devices: Array<{
            connectionId: string;
            deviceId: string;
            healthy: boolean;
            lastPing: number;
            timeSinceLastPing: number;
            lastAckSequence: number;
        }>;
    } | null;
    /**
     * Force cleanup of stale connections
     * Returns number of connections cleaned up
     */
    cleanupStaleConnections(): number;
    /**
     * Get server statistics
     */
    getStats(): {
        sessions: number;
        totalDevices: number;
        sessionDetails: Array<{
            id: string;
            devices: number;
            createdAt: number;
            expiresAt: number;
        }>;
    };
}
//# sourceMappingURL=hot-reload-server.d.ts.map