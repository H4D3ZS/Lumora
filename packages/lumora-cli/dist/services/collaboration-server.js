"use strict";
/**
 * Collaboration Server
 * Enables real-time collaboration and shared development sessions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationServer = void 0;
exports.getCollaborationServer = getCollaborationServer;
const events_1 = require("events");
const ws_1 = __importStar(require("ws"));
const http = __importStar(require("http"));
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * Collaboration Server
 */
class CollaborationServer extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.sessions = new Map();
        this.wss = null;
        this.server = null;
        this.clients = new Map();
        this.config = {
            port: config.port || 3001,
            maxSessionSize: config.maxSessionSize || 10,
            sessionTimeout: config.sessionTimeout || 4 * 60 * 60 * 1000, // 4 hours
            allowAnonymous: config.allowAnonymous ?? true,
        };
    }
    /**
     * Start the collaboration server
     */
    async start() {
        const app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use(express_1.default.static(path.join(__dirname, '../public/collaboration')));
        // API endpoints
        app.get('/api/sessions', (req, res) => {
            const sessions = Array.from(this.sessions.values()).map(s => ({
                id: s.id,
                name: s.name,
                owner: s.owner.name,
                userCount: s.users.size,
                createdAt: s.createdAt,
            }));
            res.json({ sessions });
        });
        app.post('/api/sessions', async (req, res) => {
            try {
                const { name, projectPath, user } = req.body;
                const session = await this.createSession(name, projectPath, user);
                res.json({ session: { id: session.id, name: session.name } });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        app.get('/api/sessions/:id', (req, res) => {
            const session = this.sessions.get(req.params.id);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            res.json({
                session: {
                    id: session.id,
                    name: session.name,
                    owner: session.owner,
                    users: Array.from(session.users.values()),
                    files: Object.fromEntries(session.files),
                },
            });
        });
        // Create HTTP server
        this.server = http.createServer(app);
        // Create WebSocket server
        this.wss = new ws_1.WebSocketServer({ server: this.server });
        this.wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection');
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(ws, message);
                }
                catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            ws.on('close', () => {
                // Find and remove user from session
                this.handleDisconnect(ws);
            });
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
        // Start cleanup interval
        setInterval(() => this.cleanupSessions(), 60 * 1000); // Every minute
        this.server.listen(this.config.port, () => {
            console.log(`Collaboration server running on port ${this.config.port}`);
            this.emit('started');
        });
    }
    /**
     * Stop the collaboration server
     */
    async stop() {
        if (this.wss) {
            this.wss.close();
        }
        if (this.server) {
            this.server.close();
        }
        this.sessions.clear();
        this.clients.clear();
        this.emit('stopped');
    }
    /**
     * Create a new collaboration session
     */
    async createSession(name, projectPath, owner) {
        const sessionId = this.generateSessionId();
        // Load project files
        const files = await this.loadProjectFiles(projectPath);
        const session = {
            id: sessionId,
            name,
            projectPath,
            owner,
            users: new Map([[owner.id, owner]]),
            files,
            createdAt: new Date(),
            lastActivity: new Date(),
        };
        this.sessions.set(sessionId, session);
        this.emit('session:created', session);
        return session;
    }
    /**
     * Handle incoming WebSocket message
     */
    handleMessage(ws, message) {
        const session = this.sessions.get(message.sessionId);
        if (!session) {
            this.sendError(ws, 'Session not found');
            return;
        }
        session.lastActivity = new Date();
        switch (message.type) {
            case 'join':
                this.handleJoin(ws, session, message);
                break;
            case 'leave':
                this.handleLeave(session, message);
                break;
            case 'file-change':
                this.handleFileChange(session, message);
                break;
            case 'cursor-move':
                this.handleCursorMove(session, message);
                break;
            case 'chat':
                this.handleChat(session, message);
                break;
            case 'sync':
                this.handleSync(ws, session, message);
                break;
            default:
                this.sendError(ws, 'Unknown message type');
        }
    }
    /**
     * Handle user join
     */
    handleJoin(ws, session, message) {
        if (session.users.size >= this.config.maxSessionSize) {
            this.sendError(ws, 'Session is full');
            return;
        }
        const user = message.data.user;
        session.users.set(user.id, user);
        this.clients.set(user.id, ws);
        // Notify all users
        this.broadcast(session, {
            type: 'join',
            userId: user.id,
            sessionId: session.id,
            data: { user },
            timestamp: new Date(),
        });
        // Send current state to new user
        this.send(ws, {
            type: 'sync',
            userId: 'system',
            sessionId: session.id,
            data: {
                users: Array.from(session.users.values()),
                files: Object.fromEntries(session.files),
            },
            timestamp: new Date(),
        });
        this.emit('user:joined', { session, user });
    }
    /**
     * Handle user leave
     */
    handleLeave(session, message) {
        const user = session.users.get(message.userId);
        if (!user)
            return;
        session.users.delete(message.userId);
        this.clients.delete(message.userId);
        // Notify all users
        this.broadcast(session, {
            type: 'leave',
            userId: message.userId,
            sessionId: session.id,
            data: { userId: message.userId },
            timestamp: new Date(),
        });
        this.emit('user:left', { session, user });
        // Delete session if empty
        if (session.users.size === 0) {
            this.sessions.delete(session.id);
            this.emit('session:deleted', session);
        }
    }
    /**
     * Handle file change
     */
    handleFileChange(session, message) {
        const { file, content, changes } = message.data;
        // Update file content
        session.files.set(file, content);
        // Broadcast to all other users
        this.broadcast(session, message, message.userId);
        this.emit('file:changed', { session, file, content, changes });
    }
    /**
     * Handle cursor move
     */
    handleCursorMove(session, message) {
        const user = session.users.get(message.userId);
        if (!user)
            return;
        user.cursor = message.data.cursor;
        // Broadcast cursor position to all other users
        this.broadcast(session, message, message.userId);
    }
    /**
     * Handle chat message
     */
    handleChat(session, message) {
        // Broadcast chat message to all users
        this.broadcast(session, message);
        this.emit('chat:message', {
            session,
            user: session.users.get(message.userId),
            message: message.data.message,
        });
    }
    /**
     * Handle sync request
     */
    handleSync(ws, session, message) {
        this.send(ws, {
            type: 'sync',
            userId: 'system',
            sessionId: session.id,
            data: {
                users: Array.from(session.users.values()),
                files: Object.fromEntries(session.files),
            },
            timestamp: new Date(),
        });
    }
    /**
     * Handle WebSocket disconnect
     */
    handleDisconnect(ws) {
        // Find user by WebSocket
        for (const [userId, client] of this.clients.entries()) {
            if (client === ws) {
                // Find session containing this user
                for (const session of this.sessions.values()) {
                    if (session.users.has(userId)) {
                        this.handleLeave(session, {
                            type: 'leave',
                            userId,
                            sessionId: session.id,
                            timestamp: new Date(),
                        });
                    }
                }
                this.clients.delete(userId);
                break;
            }
        }
    }
    /**
     * Broadcast message to all users in session
     */
    broadcast(session, message, excludeUserId) {
        session.users.forEach((user, userId) => {
            if (userId !== excludeUserId) {
                const ws = this.clients.get(userId);
                if (ws && ws.readyState === ws_1.default.OPEN) {
                    this.send(ws, message);
                }
            }
        });
    }
    /**
     * Send message to specific WebSocket
     */
    send(ws, message) {
        if (ws.readyState === ws_1.default.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    /**
     * Send error message
     */
    sendError(ws, error) {
        this.send(ws, {
            type: 'error',
            userId: 'system',
            sessionId: '',
            data: { error },
            timestamp: new Date(),
        });
    }
    /**
     * Load project files
     */
    async loadProjectFiles(projectPath) {
        const files = new Map();
        const srcPath = path.join(projectPath, 'src');
        if (!await fs.pathExists(srcPath)) {
            return files;
        }
        const loadDir = async (dir, baseDir = srcPath) => {
            const items = await fs.readdir(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = await fs.stat(fullPath);
                if (stat.isDirectory()) {
                    await loadDir(fullPath, baseDir);
                }
                else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const relativePath = path.relative(baseDir, fullPath);
                    files.set(relativePath, content);
                }
            }
        };
        await loadDir(srcPath);
        return files;
    }
    /**
     * Cleanup inactive sessions
     */
    cleanupSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            const inactiveTime = now - session.lastActivity.getTime();
            if (inactiveTime > this.config.sessionTimeout) {
                // Notify all users
                this.broadcast(session, {
                    type: 'leave',
                    userId: 'system',
                    sessionId,
                    data: { reason: 'Session timeout' },
                    timestamp: new Date(),
                });
                // Close all connections
                session.users.forEach((user, userId) => {
                    const ws = this.clients.get(userId);
                    if (ws) {
                        ws.close();
                        this.clients.delete(userId);
                    }
                });
                this.sessions.delete(sessionId);
                this.emit('session:timeout', session);
            }
        }
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get session info
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Get all sessions
     */
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
}
exports.CollaborationServer = CollaborationServer;
// Singleton instance
let collaborationServerInstance = null;
function getCollaborationServer(config) {
    if (!collaborationServerInstance) {
        collaborationServerInstance = new CollaborationServer(config);
    }
    return collaborationServerInstance;
}
//# sourceMappingURL=collaboration-server.js.map