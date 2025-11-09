import { Server } from 'http';
import { SessionManager } from './session-manager';
import { WebSocketEnvelope } from './types';
/**
 * WebSocketBroker handles WebSocket connections and message routing
 */
export declare class WebSocketBroker {
    private wss;
    private sessionManager;
    private pingInterval;
    constructor(server: Server, sessionManager: SessionManager);
    /**
     * Handle new WebSocket connection
     */
    private handleConnection;
    /**
     * Check if origin is allowed (for CSRF protection)
     * In development, we allow localhost and local network IPs
     */
    private isAllowedOrigin;
    /**
     * Check rate limit for a client
     * Returns true if within limit, false if exceeded
     */
    private checkRateLimit;
    /**
     * Handle incoming WebSocket message
     */
    private handleMessage;
    /**
     * Handle join message and authenticate client
     */
    private handleJoin;
    /**
     * Handle event message from device client
     * Broadcasts event to all editor clients in the session
     */
    private handleEvent;
    /**
     * Handle connection close
     */
    private handleClose;
    /**
     * Broadcast message to all clients in a session
     */
    broadcastToSession(sessionId: string, message: WebSocketEnvelope, excludeClientId?: string, targetClientType?: 'device' | 'editor'): number;
    /**
     * Send message to a specific WebSocket connection
     */
    private sendMessage;
    /**
     * Send pong response
     */
    private sendPong;
    /**
     * Start ping/pong health checks
     */
    startHealthChecks(): void;
    /**
     * Stop ping/pong health checks
     */
    stopHealthChecks(): void;
    /**
     * Close all connections and cleanup
     */
    shutdown(): void;
}
//# sourceMappingURL=websocket-broker.d.ts.map