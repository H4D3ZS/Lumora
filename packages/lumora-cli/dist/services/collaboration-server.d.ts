/**
 * Collaboration Server
 * Enables real-time collaboration and shared development sessions
 */
import { EventEmitter } from 'events';
export interface CollaborationConfig {
    port?: number;
    maxSessionSize?: number;
    sessionTimeout?: number;
    allowAnonymous?: boolean;
}
export interface User {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    color: string;
    cursor?: CursorPosition;
}
export interface CursorPosition {
    file: string;
    line: number;
    column: number;
}
export interface Session {
    id: string;
    name: string;
    projectPath: string;
    owner: User;
    users: Map<string, User>;
    files: Map<string, string>;
    createdAt: Date;
    lastActivity: Date;
}
export interface Message {
    type: 'join' | 'leave' | 'file-change' | 'cursor-move' | 'chat' | 'sync';
    userId: string;
    sessionId: string;
    data?: any;
    timestamp: Date;
}
/**
 * Collaboration Server
 */
export declare class CollaborationServer extends EventEmitter {
    private config;
    private sessions;
    private wss;
    private server;
    private clients;
    constructor(config?: CollaborationConfig);
    /**
     * Start the collaboration server
     */
    start(): Promise<void>;
    /**
     * Stop the collaboration server
     */
    stop(): Promise<void>;
    /**
     * Create a new collaboration session
     */
    createSession(name: string, projectPath: string, owner: User): Promise<Session>;
    /**
     * Handle incoming WebSocket message
     */
    private handleMessage;
    /**
     * Handle user join
     */
    private handleJoin;
    /**
     * Handle user leave
     */
    private handleLeave;
    /**
     * Handle file change
     */
    private handleFileChange;
    /**
     * Handle cursor move
     */
    private handleCursorMove;
    /**
     * Handle chat message
     */
    private handleChat;
    /**
     * Handle sync request
     */
    private handleSync;
    /**
     * Handle WebSocket disconnect
     */
    private handleDisconnect;
    /**
     * Broadcast message to all users in session
     */
    private broadcast;
    /**
     * Send message to specific WebSocket
     */
    private send;
    /**
     * Send error message
     */
    private sendError;
    /**
     * Load project files
     */
    private loadProjectFiles;
    /**
     * Cleanup inactive sessions
     */
    private cleanupSessions;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Get session info
     */
    getSession(sessionId: string): Session | undefined;
    /**
     * Get all sessions
     */
    getAllSessions(): Session[];
}
export declare function getCollaborationServer(config?: CollaborationConfig): CollaborationServer;
//# sourceMappingURL=collaboration-server.d.ts.map