"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketBroker = void 0;
const ws_1 = require("ws");
const crypto_1 = __importDefault(require("crypto"));
/**
 * WebSocket broker configuration
 */
const JOIN_TIMEOUT_MS = 30 * 1000; // 30 seconds
const PING_INTERVAL_MS = 30 * 1000; // 30 seconds
const PONG_TIMEOUT_MS = 10 * 1000; // 10 seconds
/**
 * Security configuration
 */
const MAX_MESSAGE_SIZE = 10 * 1024 * 1024; // 10MB
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second
const RATE_LIMIT_MAX_MESSAGES = 100; // 100 messages per second per client
const MAX_DEVICES_PER_SESSION = 10;
const MAX_EDITORS_PER_SESSION = 5;
/**
 * WebSocketBroker handles WebSocket connections and message routing
 */
class WebSocketBroker {
    constructor(server, sessionManager) {
        this.sessionManager = sessionManager;
        this.pingInterval = null;
        // Initialize WebSocket server
        this.wss = new ws_1.WebSocketServer({
            server,
            path: '/ws',
            maxPayload: MAX_MESSAGE_SIZE
        });
        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });
        console.log('[WebSocketBroker] WebSocket server initialized on /ws');
    }
    /**
     * Handle new WebSocket connection
     */
    handleConnection(ws, req) {
        const clientId = crypto_1.default.randomBytes(8).toString('hex');
        ws.clientId = clientId;
        ws.isAlive = true;
        ws.lastPong = Date.now();
        ws.messageCount = 0;
        ws.rateLimitResetAt = Date.now() + RATE_LIMIT_WINDOW_MS;
        // Origin validation for CSRF protection
        const origin = req.headers.origin;
        if (origin && !this.isAllowedOrigin(origin)) {
            console.warn(`[WebSocket] Rejected connection from unauthorized origin: ${origin}`);
            ws.close(1008, 'Unauthorized origin');
            return;
        }
        console.log(`[WebSocket] New connection: ${clientId}`);
        // Set join timeout - client must send join message within 30 seconds
        ws.joinTimeout = setTimeout(() => {
            if (!ws.sessionId) {
                console.log(`[WebSocket] Join timeout for client ${clientId}`);
                ws.close(4000, 'Join timeout - no join message received within 30 seconds');
            }
        }, JOIN_TIMEOUT_MS);
        // Handle messages
        ws.on('message', (data) => {
            this.handleMessage(ws, data);
        });
        // Handle pong responses
        ws.on('pong', () => {
            ws.isAlive = true;
            ws.lastPong = Date.now();
        });
        // Handle connection close
        ws.on('close', (code, reason) => {
            this.handleClose(ws, code, reason.toString());
        });
        // Handle errors
        ws.on('error', (error) => {
            console.error(`[WebSocket] Error for client ${ws.clientId}:`, error.message);
        });
    }
    /**
     * Check if origin is allowed (for CSRF protection)
     * In development, we allow localhost and local network IPs
     */
    isAllowedOrigin(origin) {
        // Allow localhost and local network origins
        const allowedPatterns = [
            /^http:\/\/localhost(:\d+)?$/,
            /^http:\/\/127\.0\.0\.1(:\d+)?$/,
            /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
            /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
            /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+(:\d+)?$/,
        ];
        return allowedPatterns.some(pattern => pattern.test(origin));
    }
    /**
     * Check rate limit for a client
     * Returns true if within limit, false if exceeded
     */
    checkRateLimit(ws) {
        const now = Date.now();
        // Reset counter if window expired
        if (now > ws.rateLimitResetAt) {
            ws.messageCount = 1;
            ws.rateLimitResetAt = now + RATE_LIMIT_WINDOW_MS;
            return true;
        }
        // Check if limit exceeded
        if (ws.messageCount >= RATE_LIMIT_MAX_MESSAGES) {
            return false;
        }
        ws.messageCount++;
        return true;
    }
    /**
     * Handle incoming WebSocket message
     */
    handleMessage(ws, data) {
        try {
            // Check message size (additional check beyond maxPayload)
            if (data.length > MAX_MESSAGE_SIZE) {
                console.warn(`[WebSocket] Message too large from ${ws.clientId}: ${data.length} bytes`);
                ws.close(1009, 'Message too large');
                return;
            }
            // Check rate limit
            if (!this.checkRateLimit(ws)) {
                console.warn(`[WebSocket] Rate limit exceeded for client ${ws.clientId}`);
                ws.close(1008, 'Rate limit exceeded');
                return;
            }
            const message = JSON.parse(data.toString());
            // Handle join message
            if (message.type === 'join') {
                this.handleJoin(ws, message.payload);
                return;
            }
            // Handle ping message
            if (message.type === 'ping') {
                this.sendPong(ws);
                return;
            }
            // Handle pong message
            if (message.type === 'pong') {
                ws.isAlive = true;
                ws.lastPong = Date.now();
                return;
            }
            // All other messages require authentication
            if (!ws.sessionId) {
                console.warn(`[WebSocket] Unauthenticated message from ${ws.clientId}`);
                ws.close(4001, 'Not authenticated - send join message first');
                return;
            }
            // Validate session still exists and is not expired
            const validation = this.sessionManager.validateSession(ws.sessionId);
            if (!validation.valid) {
                console.warn(`[WebSocket] Session validation failed for ${ws.clientId}: ${validation.error}`);
                ws.close(4001, `Session ${validation.error === 'SESSION_EXPIRED' ? 'expired' : 'not found'}`);
                return;
            }
            // Handle event messages - broadcast to editor clients only
            if (message.type === 'event') {
                this.handleEvent(ws, message);
                return;
            }
            // Broadcast message to session
            this.broadcastToSession(ws.sessionId, message, ws.clientId);
        }
        catch (error) {
            console.error(`[WebSocket] Failed to parse message from ${ws.clientId}:`, error);
            // Track parse errors as suspicious activity
            if (!ws.clientId) {
                ws.close(1003, 'Invalid message format');
                return;
            }
            // Close connection on repeated parse errors (suspicious activity)
            ws.close(1003, 'Invalid message format');
        }
    }
    /**
     * Handle join message and authenticate client
     */
    handleJoin(ws, payload) {
        const { sessionId, token, clientType } = payload;
        console.log(`[WebSocket] Join request from ${ws.clientId}: session=${sessionId}, type=${clientType}`);
        // Clear join timeout
        if (ws.joinTimeout) {
            clearTimeout(ws.joinTimeout);
            ws.joinTimeout = undefined;
        }
        // Validate session
        const validation = this.sessionManager.validateSession(sessionId);
        if (!validation.valid) {
            console.warn(`[WebSocket] Invalid session for ${ws.clientId}: ${validation.error}`);
            ws.close(4001, `Authentication failed: ${validation.error}`);
            return;
        }
        const session = validation.session;
        // Validate token
        if (session.token !== token) {
            console.warn(`[WebSocket] Invalid token for ${ws.clientId}`);
            ws.close(4001, 'Authentication failed: Invalid token');
            return;
        }
        // Validate client type
        if (clientType !== 'device' && clientType !== 'editor') {
            console.warn(`[WebSocket] Invalid client type for ${ws.clientId}: ${clientType}`);
            ws.close(4001, 'Authentication failed: Invalid client type');
            return;
        }
        // Check connection limits per session
        const currentClients = session.connectedClients;
        const deviceCount = currentClients.filter(c => c.clientType === 'device').length;
        const editorCount = currentClients.filter(c => c.clientType === 'editor').length;
        if (clientType === 'device' && deviceCount >= MAX_DEVICES_PER_SESSION) {
            console.warn(`[WebSocket] Device limit reached for session ${sessionId}: ${deviceCount}/${MAX_DEVICES_PER_SESSION}`);
            ws.close(1008, `Maximum ${MAX_DEVICES_PER_SESSION} devices per session`);
            return;
        }
        if (clientType === 'editor' && editorCount >= MAX_EDITORS_PER_SESSION) {
            console.warn(`[WebSocket] Editor limit reached for session ${sessionId}: ${editorCount}/${MAX_EDITORS_PER_SESSION}`);
            ws.close(1008, `Maximum ${MAX_EDITORS_PER_SESSION} editors per session`);
            return;
        }
        // Add client to session
        ws.sessionId = sessionId;
        ws.clientType = clientType;
        const client = {
            clientId: ws.clientId,
            clientType,
            connection: ws,
            connectedAt: Date.now()
        };
        this.sessionManager.addClient(sessionId, client);
        console.log(`[WebSocket] Client ${ws.clientId} joined session ${sessionId} as ${clientType}`);
        // Send join acknowledgment
        this.sendMessage(ws, {
            type: 'join',
            meta: {
                sessionId,
                source: 'dev-proxy',
                timestamp: Date.now(),
                version: '1.0.0'
            },
            payload: {
                status: 'connected',
                clientId: ws.clientId
            }
        });
    }
    /**
     * Handle event message from device client
     * Broadcasts event to all editor clients in the session
     */
    handleEvent(ws, message) {
        const sessionId = ws.sessionId;
        const clientId = ws.clientId;
        const clientType = ws.clientType;
        console.log(`[Event] Received event from ${clientType} client ${clientId} in session ${sessionId}`);
        console.log(`[Event] Event action: ${message.payload?.action || 'unknown'}`);
        // Ensure meta fields are preserved from the original message
        const eventEnvelope = {
            type: 'event',
            meta: {
                ...message.meta,
                sessionId,
                timestamp: message.meta?.timestamp || Date.now(),
                version: message.meta?.version || '1.0.0'
            },
            payload: message.payload
        };
        // Broadcast to all editor clients in the session
        const editorCount = this.broadcastToSession(sessionId, eventEnvelope, clientId, 'editor');
        console.log(`[Event] Broadcast event to ${editorCount} editor client(s) in session ${sessionId}`);
    }
    /**
     * Handle connection close
     */
    handleClose(ws, code, reason) {
        console.log(`[WebSocket] Connection closed: ${ws.clientId}, code=${code}, reason=${reason}`);
        // Clear join timeout if exists
        if (ws.joinTimeout) {
            clearTimeout(ws.joinTimeout);
        }
        // Remove client from session
        if (ws.sessionId && ws.clientId) {
            this.sessionManager.removeClient(ws.sessionId, ws.clientId);
            console.log(`[WebSocket] Removed client ${ws.clientId} from session ${ws.sessionId}`);
        }
    }
    /**
     * Broadcast message to all clients in a session
     */
    broadcastToSession(sessionId, message, excludeClientId, targetClientType) {
        const clients = this.sessionManager.getSessionClients(sessionId);
        let sentCount = 0;
        for (const client of clients) {
            // Skip the sender if excludeClientId is provided
            if (excludeClientId && client.clientId === excludeClientId) {
                continue;
            }
            // Filter by client type if specified
            if (targetClientType && client.clientType !== targetClientType) {
                continue;
            }
            // Check if connection is open
            if (client.connection.readyState === ws_1.WebSocket.OPEN) {
                try {
                    this.sendMessage(client.connection, message);
                    sentCount++;
                }
                catch (error) {
                    console.error(`[WebSocket] Failed to send to client ${client.clientId}:`, error);
                }
            }
        }
        console.log(`[WebSocket] Broadcast to session ${sessionId}: ${sentCount}/${clients.length} clients${targetClientType ? ` (type: ${targetClientType})` : ''}`);
        return sentCount;
    }
    /**
     * Send message to a specific WebSocket connection
     */
    sendMessage(ws, message) {
        ws.send(JSON.stringify(message));
    }
    /**
     * Send pong response
     */
    sendPong(ws) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            this.sendMessage(ws, {
                type: 'pong',
                meta: {
                    sessionId: ws.sessionId || '',
                    source: 'dev-proxy',
                    timestamp: Date.now(),
                    version: '1.0.0'
                },
                payload: {}
            });
        }
    }
    /**
     * Start ping/pong health checks
     */
    startHealthChecks() {
        if (this.pingInterval) {
            return;
        }
        this.pingInterval = setInterval(() => {
            const now = Date.now();
            this.wss.clients.forEach((ws) => {
                const extWs = ws;
                // Check if client responded to last ping
                if (extWs.isAlive === false) {
                    console.log(`[WebSocket] Client ${extWs.clientId} failed health check, terminating`);
                    extWs.terminate();
                    return;
                }
                // Check if pong timeout exceeded
                if (extWs.lastPong && (now - extWs.lastPong) > PONG_TIMEOUT_MS) {
                    console.log(`[WebSocket] Client ${extWs.clientId} pong timeout, closing connection`);
                    extWs.close(1000, 'Pong timeout');
                    return;
                }
                // Mark as not alive and send ping
                extWs.isAlive = false;
                extWs.ping();
            });
        }, PING_INTERVAL_MS);
        console.log('[WebSocketBroker] Started health checks (ping every 30s)');
    }
    /**
     * Stop ping/pong health checks
     */
    stopHealthChecks() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
            console.log('[WebSocketBroker] Stopped health checks');
        }
    }
    /**
     * Close all connections and cleanup
     */
    shutdown() {
        this.stopHealthChecks();
        this.wss.close(() => {
            console.log('[WebSocketBroker] WebSocket server closed');
        });
    }
}
exports.WebSocketBroker = WebSocketBroker;
//# sourceMappingURL=websocket-broker.js.map