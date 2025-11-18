/**
 * Collaboration Client
 * Client-side collaboration features
 */
import { EventEmitter } from 'events';
import { User, CursorPosition } from './collaboration-server';
export interface ClientConfig {
    serverUrl: string;
    sessionId: string;
    user: User;
    autoReconnect?: boolean;
    reconnectDelay?: number;
}
export interface FileChange {
    file: string;
    changes: TextChange[];
    version: number;
}
export interface TextChange {
    type: 'insert' | 'delete' | 'replace';
    position: number;
    text?: string;
    length?: number;
}
/**
 * Collaboration Client
 */
export declare class CollaborationClient extends EventEmitter {
    private config;
    private ws;
    private connected;
    private reconnectTimer;
    private fileVersions;
    constructor(config: ClientConfig);
    /**
     * Connect to collaboration server
     */
    connect(): Promise<void>;
    /**
     * Disconnect from server
     */
    disconnect(): void;
    /**
     * Send file change
     */
    sendFileChange(file: string, content: string, changes: TextChange[]): void;
    /**
     * Send cursor position
     */
    sendCursorMove(cursor: CursorPosition): void;
    /**
     * Send chat message
     */
    sendChat(message: string): void;
    /**
     * Request sync
     */
    requestSync(): void;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Send message to server
     */
    private send;
    /**
     * Schedule reconnection
     */
    private scheduleReconnect;
    /**
     * Check if connected
     */
    isConnected(): boolean;
}
//# sourceMappingURL=collaboration-client.d.ts.map