"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsBroker = exports.sessionManager = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const session_manager_1 = require("./session-manager");
const websocket_broker_1 = require("./websocket-broker");
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3000;
// Initialize session manager
const sessionManager = new session_manager_1.SessionManager();
exports.sessionManager = sessionManager;
// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per second per session
const rateLimitMap = new Map();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Start automatic session cleanup
sessionManager.startCleanup();
/**
 * Rate limiting middleware for /send endpoint
 */
function checkRateLimit(sessionId) {
    const now = Date.now();
    const limit = rateLimitMap.get(sessionId);
    if (!limit || now > limit.resetAt) {
        // Create new rate limit window
        rateLimitMap.set(sessionId, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW_MS
        });
        return true;
    }
    if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    limit.count++;
    return true;
}
// Routes
/**
 * POST /session/new
 * Create a new development session
 */
app.post('/session/new', (req, res) => {
    try {
        const session = sessionManager.createSession();
        const wsUrl = `ws://localhost:${PORT}/ws`;
        // Generate QR code payload
        const qrPayload = JSON.stringify({
            wsUrl,
            sessionId: session.sessionId,
            token: session.token
        });
        // Print QR code to console (token is not logged for security)
        console.log('\n=== New Session Created ===');
        console.log(`Session ID: ${session.sessionId}`);
        console.log(`Expires: ${new Date(session.expiresAt).toISOString()}`);
        console.log('\nScan this QR code with Flutter-Dev-Client:\n');
        qrcode_terminal_1.default.generate(qrPayload, { small: true });
        console.log('\n===========================\n');
        // Return session details
        res.json({
            sessionId: session.sessionId,
            token: session.token,
            wsUrl,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt
        });
    }
    catch (error) {
        console.error('[Error] Failed to create session:', error);
        const errorResponse = {
            error: {
                code: 'SESSION_CREATION_FAILED',
                message: 'Failed to create session',
                timestamp: Date.now()
            }
        };
        res.status(500).json(errorResponse);
    }
});
/**
 * GET /session/:sessionId
 * Get session information
 */
app.get('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const validation = sessionManager.validateSession(sessionId);
    if (!validation.valid) {
        const statusCode = validation.error === 'SESSION_EXPIRED' ? 410 : 404;
        const errorResponse = {
            error: {
                code: validation.error,
                message: validation.error === 'SESSION_EXPIRED'
                    ? `Session ${sessionId} has expired`
                    : `Session with ID ${sessionId} does not exist`,
                timestamp: Date.now()
            }
        };
        return res.status(statusCode).json(errorResponse);
    }
    const session = validation.session;
    res.json({
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        connectedClients: session.connectedClients.length
    });
});
/**
 * POST /send/:sessionId
 * Send message to all device clients in a session
 */
app.post('/send/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    // Check rate limit first
    if (!checkRateLimit(sessionId)) {
        console.warn(`[RateLimit] Rate limit exceeded for session ${sessionId}`);
        const errorResponse = {
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Rate limit exceeded: maximum ${RATE_LIMIT_MAX_REQUESTS} requests per second`,
                timestamp: Date.now()
            }
        };
        return res.status(429).json(errorResponse);
    }
    // Validate session
    const validation = sessionManager.validateSession(sessionId);
    if (!validation.valid) {
        const statusCode = validation.error === 'SESSION_EXPIRED' ? 410 : 404;
        const errorResponse = {
            error: {
                code: validation.error,
                message: validation.error === 'SESSION_EXPIRED'
                    ? `Session ${sessionId} has expired`
                    : `Session with ID ${sessionId} does not exist`,
                timestamp: Date.now()
            }
        };
        console.error(`[Error] /send/:sessionId validation failed: ${validation.error} for session ${sessionId}`);
        return res.status(statusCode).json(errorResponse);
    }
    try {
        const envelope = req.body;
        // Add meta fields if missing
        if (!envelope.meta) {
            envelope.meta = {
                sessionId,
                source: 'http-api',
                timestamp: Date.now(),
                version: '1.0.0'
            };
        }
        else {
            envelope.meta.timestamp = envelope.meta.timestamp || Date.now();
            envelope.meta.version = envelope.meta.version || '1.0.0';
            envelope.meta.sessionId = sessionId;
        }
        // Broadcast to device clients only
        const clientCount = wsBroker.broadcastToSession(sessionId, envelope, undefined, 'device');
        console.log(`[HTTP] Message sent to session ${sessionId}: ${clientCount} device client(s)`);
        res.json({
            success: true,
            sessionId,
            clientCount,
            timestamp: Date.now()
        });
    }
    catch (error) {
        console.error(`[Error] Failed to send message to session ${sessionId}:`, error);
        const errorResponse = {
            error: {
                code: 'MESSAGE_SEND_FAILED',
                message: 'Failed to send message to session',
                timestamp: Date.now()
            }
        };
        res.status(500).json(errorResponse);
    }
});
/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        activeSessions: sessionManager.getActiveSessionCount(),
        timestamp: Date.now()
    });
});
// Start server
const server = app.listen(PORT, () => {
    console.log(`Dev-Proxy server running on port ${PORT}`);
    console.log(`Create a session: curl -X POST http://localhost:${PORT}/session/new`);
});
// Initialize WebSocket broker
const wsBroker = new websocket_broker_1.WebSocketBroker(server, sessionManager);
exports.wsBroker = wsBroker;
wsBroker.startHealthChecks();
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    wsBroker.stopHealthChecks();
    sessionManager.stopCleanup();
    wsBroker.shutdown();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    wsBroker.stopHealthChecks();
    sessionManager.stopCleanup();
    wsBroker.shutdown();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map