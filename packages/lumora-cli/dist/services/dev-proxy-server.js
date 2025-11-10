"use strict";
/**
 * Dev-Proxy Server
 * Manages WebSocket connections and schema broadcasting
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
exports.DevProxyServer = void 0;
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const http = __importStar(require("http"));
const qrcode = __importStar(require("qrcode-terminal"));
const crypto_1 = require("crypto");
const chalk_1 = __importDefault(require("chalk"));
class DevProxyServer {
    constructor(config) {
        this.server = null;
        this.wss = null;
        this.sessions = new Map();
        this.config = config;
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', sessions: this.sessions.size });
        });
        // Create session
        this.app.post('/session/new', (req, res) => {
            const sessionId = this.generateSessionId();
            const session = {
                id: sessionId,
                createdAt: Date.now(),
                clients: new Set(),
            };
            this.sessions.set(sessionId, session);
            res.json({
                sessionId,
                wsUrl: `ws://localhost:${this.config.port}/ws?session=${sessionId}`,
            });
        });
        // Send schema to session
        this.app.post('/send/:sessionId', (req, res) => {
            const { sessionId } = req.params;
            const schema = req.body;
            const session = this.sessions.get(sessionId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            // Broadcast to all connected clients
            let sent = 0;
            session.clients.forEach(client => {
                if (client.readyState === ws_1.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'schema',
                        data: schema,
                    }));
                    sent++;
                }
            });
            res.json({ success: true, clientsUpdated: sent });
        });
        // Get session info
        this.app.get('/session/:sessionId', (req, res) => {
            const { sessionId } = req.params;
            const session = this.sessions.get(sessionId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            res.json({
                sessionId: session.id,
                createdAt: session.createdAt,
                connectedClients: session.clients.size,
            });
        });
    }
    setupWebSocket() {
        if (!this.server)
            return;
        this.wss = new ws_1.Server({ server: this.server });
        this.wss.on('connection', (ws, req) => {
            const url = new URL(req.url, `http://localhost:${this.config.port}`);
            const sessionId = url.searchParams.get('session');
            if (!sessionId) {
                ws.close(1008, 'Session ID required');
                return;
            }
            const session = this.sessions.get(sessionId);
            if (!session) {
                ws.close(1008, 'Session not found');
                return;
            }
            // Add client to session
            session.clients.add(ws);
            console.log(chalk_1.default.green(`✓ Device connected to session ${sessionId} (${session.clients.size} total)`));
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connected',
                sessionId,
                message: 'Connected to Lumora Dev-Proxy',
            }));
            // Handle messages from client
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleClientMessage(sessionId, message, ws);
                }
                catch (error) {
                    console.error(chalk_1.default.red('Error parsing message:'), error);
                }
            });
            // Handle disconnect
            ws.on('close', () => {
                session.clients.delete(ws);
                console.log(chalk_1.default.yellow(`✗ Device disconnected from session ${sessionId} (${session.clients.size} remaining)`));
            });
            // Handle errors
            ws.on('error', (error) => {
                console.error(chalk_1.default.red('WebSocket error:'), error);
            });
        });
    }
    handleClientMessage(sessionId, message, ws) {
        switch (message.type) {
            case 'event':
                // Handle UI events from device
                console.log(chalk_1.default.blue(`📱 Event from device: ${message.event}`));
                // Could forward to event handlers here
                break;
            case 'log':
                // Handle logs from device
                console.log(chalk_1.default.gray(`📱 Device log: ${message.message}`));
                break;
            case 'error':
                // Handle errors from device
                console.error(chalk_1.default.red(`📱 Device error: ${message.message}`));
                break;
            default:
                console.log(chalk_1.default.gray(`📱 Unknown message type: ${message.type}`));
        }
    }
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = http.createServer(this.app);
                this.setupWebSocket();
                this.server.listen(this.config.port, () => {
                    resolve();
                });
                this.server.on('error', reject);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async stop() {
        return new Promise((resolve) => {
            // Close all WebSocket connections
            this.sessions.forEach(session => {
                session.clients.forEach(client => {
                    client.close();
                });
            });
            // Close WebSocket server
            if (this.wss) {
                this.wss.close();
            }
            // Close HTTP server
            if (this.server) {
                this.server.close(() => {
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    async createSession() {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            createdAt: Date.now(),
            clients: new Set(),
        };
        this.sessions.set(sessionId, session);
        return session;
    }
    displayQRCode(sessionId) {
        const wsUrl = `ws://localhost:${this.config.port}/ws?session=${sessionId}`;
        console.log(chalk_1.default.bold('📱 Scan this QR code with Lumora Dev Client:\n'));
        qrcode.generate(wsUrl, { small: true });
        console.log(chalk_1.default.gray(`\nSession: ${sessionId}`));
        console.log(chalk_1.default.gray(`WebSocket URL: ${wsUrl}`));
    }
    generateSessionId() {
        return (0, crypto_1.randomBytes)(8).toString('hex');
    }
    getPort() {
        return this.config.port;
    }
    getSessions() {
        return this.sessions;
    }
}
exports.DevProxyServer = DevProxyServer;
//# sourceMappingURL=dev-proxy-server.js.map