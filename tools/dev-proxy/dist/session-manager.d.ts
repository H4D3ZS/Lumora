import { Session, Client } from './types';
/**
 * SessionManager handles session creation, storage, and cleanup
 */
export declare class SessionManager {
    private sessions;
    private cleanupInterval;
    constructor();
    /**
     * Generate a unique session ID
     */
    private generateSessionId;
    /**
     * Generate an ephemeral token for session authentication (32 bytes)
     *
     * Security measures:
     * - Uses cryptographically secure random bytes (crypto.randomBytes)
     * - 32 bytes (256 bits) provides strong security
     * - Tokens are ephemeral and expire with session lifetime
     * - Tokens should never be logged or exposed in URLs
     */
    private generateToken;
    /**
     * Create a new session
     */
    createSession(): Session;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): Session | null;
    /**
     * Check if session is expired
     */
    isSessionExpired(session: Session): boolean;
    /**
     * Validate session exists and is not expired
     */
    validateSession(sessionId: string): {
        valid: boolean;
        session?: Session;
        error?: string;
    };
    /**
     * Add client to session
     */
    addClient(sessionId: string, client: Client): boolean;
    /**
     * Remove client from session
     */
    removeClient(sessionId: string, clientId: string): boolean;
    /**
     * Get all clients in a session
     */
    getSessionClients(sessionId: string): Client[];
    /**
     * Remove expired sessions and close their connections
     */
    cleanupExpiredSessions(): number;
    /**
     * Start automatic cleanup of expired sessions (runs every 5 minutes)
     */
    startCleanup(): void;
    /**
     * Stop automatic cleanup
     */
    stopCleanup(): void;
    /**
     * Get total number of active sessions
     */
    getActiveSessionCount(): number;
    /**
     * Get all sessions (for testing/debugging)
     */
    getAllSessions(): Map<string, Session>;
}
//# sourceMappingURL=session-manager.d.ts.map