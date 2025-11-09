"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Session configuration
 */
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000; // 8 hours
/**
 * SessionManager handles session creation, storage, and cleanup
 */
class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.cleanupInterval = null;
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return crypto_1.default.randomBytes(16).toString('hex');
    }
    /**
     * Generate an ephemeral token for session authentication (32 bytes)
     */
    generateToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    /**
     * Create a new session
     */
    createSession() {
        const sessionId = this.generateSessionId();
        const token = this.generateToken();
        const createdAt = Date.now();
        const expiresAt = createdAt + SESSION_LIFETIME_MS;
        const session = {
            sessionId,
            token,
            createdAt,
            expiresAt,
            connectedClients: []
        };
        this.sessions.set(sessionId, session);
        return session;
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }
    /**
     * Check if session is expired
     */
    isSessionExpired(session) {
        return Date.now() > session.expiresAt;
    }
    /**
     * Validate session exists and is not expired
     */
    validateSession(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return { valid: false, error: 'SESSION_NOT_FOUND' };
        }
        if (this.isSessionExpired(session)) {
            this.sessions.delete(sessionId);
            return { valid: false, error: 'SESSION_EXPIRED' };
        }
        return { valid: true, session };
    }
    /**
     * Add client to session
     */
    addClient(sessionId, client) {
        const session = this.getSession(sessionId);
        if (!session) {
            return false;
        }
        session.connectedClients.push(client);
        return true;
    }
    /**
     * Remove client from session
     */
    removeClient(sessionId, clientId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return false;
        }
        const index = session.connectedClients.findIndex(c => c.clientId === clientId);
        if (index !== -1) {
            session.connectedClients.splice(index, 1);
            return true;
        }
        return false;
    }
    /**
     * Get all clients in a session
     */
    getSessionClients(sessionId) {
        const session = this.getSession(sessionId);
        return session ? session.connectedClients : [];
    }
    /**
     * Remove expired sessions and close their connections
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                // Close all WebSocket connections for this session
                session.connectedClients.forEach(client => {
                    if (client.connection && client.connection.readyState === 1) {
                        client.connection.close(1000, 'Session expired');
                    }
                });
                this.sessions.delete(sessionId);
                cleanedCount++;
                console.log(`[Cleanup] Removed expired session: ${sessionId}`);
            }
        }
        if (cleanedCount > 0) {
            console.log(`[Cleanup] Removed ${cleanedCount} expired session(s)`);
        }
        return cleanedCount;
    }
    /**
     * Start automatic cleanup of expired sessions (runs every 5 minutes)
     */
    startCleanup() {
        if (this.cleanupInterval) {
            return;
        }
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, 5 * 60 * 1000);
        console.log('[SessionManager] Started automatic cleanup (every 5 minutes)');
    }
    /**
     * Stop automatic cleanup
     */
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('[SessionManager] Stopped automatic cleanup');
        }
    }
    /**
     * Get total number of active sessions
     */
    getActiveSessionCount() {
        return this.sessions.size;
    }
    /**
     * Get all sessions (for testing/debugging)
     */
    getAllSessions() {
        return this.sessions;
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=session-manager.js.map