import { WebSocket } from 'ws';
/**
 * Client connected to a session
 */
export interface Client {
    clientId: string;
    clientType: 'device' | 'editor';
    connection: WebSocket;
    connectedAt: number;
}
/**
 * Development session
 */
export interface Session {
    sessionId: string;
    token: string;
    createdAt: number;
    expiresAt: number;
    connectedClients: Client[];
}
/**
 * WebSocket envelope for all messages
 */
export interface WebSocketEnvelope {
    type: 'full_ui_schema' | 'ui_schema_delta' | 'dart_code_diff' | 'event' | 'ping' | 'pong' | 'join';
    meta: {
        sessionId: string;
        source: string;
        timestamp: number;
        version: string;
    };
    payload: any;
}
/**
 * Join message payload
 */
export interface JoinPayload {
    sessionId: string;
    token: string;
    clientType: 'device' | 'editor';
}
/**
 * Error response format
 */
export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        timestamp: number;
    };
}
//# sourceMappingURL=types.d.ts.map