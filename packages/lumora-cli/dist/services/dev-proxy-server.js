"use strict";
/**
 * Dev-Proxy Server
 * Manages WebSocket connections and schema broadcasting
 * Now integrates with HotReloadServer for protocol-compliant hot reload
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
const http = __importStar(require("http"));
const qrcode = __importStar(require("qrcode-terminal"));
const chalk_1 = __importDefault(require("chalk"));
const os = __importStar(require("os"));
const hot_reload_server_1 = require("./hot-reload-server");
class DevProxyServer {
    constructor(config) {
        this.server = null;
        this.hotReloadServer = null;
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
            const stats = this.hotReloadServer?.getStats();
            res.json({
                status: 'ok',
                sessions: stats?.sessions || 0,
                totalDevices: stats?.totalDevices || 0,
            });
        });
        // Create session
        this.app.post('/session/new', (req, res) => {
            if (!this.hotReloadServer) {
                return res.status(503).json({ error: 'Server not ready' });
            }
            const hotReloadSession = this.hotReloadServer.createSession();
            // Also create legacy session for backward compatibility
            const session = {
                id: hotReloadSession.id,
                createdAt: hotReloadSession.createdAt,
                clients: new Set(),
            };
            this.sessions.set(hotReloadSession.id, session);
            res.json({
                sessionId: hotReloadSession.id,
                wsUrl: `ws://localhost:${this.config.port}/ws?session=${hotReloadSession.id}`,
                expiresAt: hotReloadSession.expiresAt,
            });
        });
        // Send schema to session (using hot reload protocol)
        this.app.post('/send/:sessionId', (req, res) => {
            const { sessionId } = req.params;
            const schema = req.body;
            if (!this.hotReloadServer) {
                return res.status(503).json({ error: 'Server not ready' });
            }
            // Use hot reload server to push update
            const result = this.hotReloadServer.pushUpdate(sessionId, schema, true);
            if (!result.success) {
                return res.status(404).json({ error: result.error || 'Failed to push update' });
            }
            res.json({
                success: true,
                clientsUpdated: result.devicesUpdated,
                updateType: result.updateType,
            });
        });
        // Get session info
        this.app.get('/session/:sessionId', (req, res) => {
            const { sessionId } = req.params;
            if (!this.hotReloadServer) {
                return res.status(503).json({ error: 'Server not ready' });
            }
            const hotReloadSession = this.hotReloadServer.getSession(sessionId);
            if (!hotReloadSession) {
                return res.status(404).json({ error: 'Session not found' });
            }
            const devices = this.hotReloadServer.getConnectedDevices(sessionId);
            res.json({
                sessionId: hotReloadSession.id,
                createdAt: hotReloadSession.createdAt,
                expiresAt: hotReloadSession.expiresAt,
                connectedDevices: devices.length,
                devices: devices.map(d => ({
                    connectionId: d.connectionId,
                    deviceId: d.deviceId,
                    platform: d.platform,
                    deviceName: d.deviceName,
                    connectedAt: d.connectedAt,
                })),
            });
        });
        // Get session health
        this.app.get('/session/:sessionId/health', (req, res) => {
            const { sessionId } = req.params;
            if (!this.hotReloadServer) {
                return res.status(503).json({ error: 'Server not ready' });
            }
            const health = this.hotReloadServer.getSessionHealth(sessionId);
            if (!health) {
                return res.status(404).json({ error: 'Session not found' });
            }
            res.json(health);
        });
        // Extend session
        this.app.post('/session/:sessionId/extend', (req, res) => {
            const { sessionId } = req.params;
            if (!this.hotReloadServer) {
                return res.status(503).json({ error: 'Server not ready' });
            }
            const success = this.hotReloadServer.extendSession(sessionId);
            if (!success) {
                return res.status(404).json({ error: 'Session not found' });
            }
            const session = this.hotReloadServer.getSession(sessionId);
            res.json({
                success: true,
                expiresAt: session?.expiresAt,
            });
        });
        // Delete session
        this.app.delete('/session/:sessionId', (req, res) => {
            const { sessionId } = req.params;
            if (!this.hotReloadServer) {
                return res.status(503).json({ error: 'Server not ready' });
            }
            const success = this.hotReloadServer.deleteSession(sessionId);
            if (!success) {
                return res.status(404).json({ error: 'Session not found' });
            }
            this.sessions.delete(sessionId);
            res.json({ success: true });
        });
        // Get server stats
        this.app.get('/stats', (req, res) => {
            if (!this.hotReloadServer) {
                return res.status(503).json({ error: 'Server not ready' });
            }
            const stats = this.hotReloadServer.getStats();
            res.json(stats);
        });
    }
    setupWebSocket() {
        if (!this.server)
            return;
        // Initialize hot reload server
        this.hotReloadServer = new hot_reload_server_1.HotReloadServer({
            server: this.server,
            path: '/ws',
            verbose: this.config.verbose || false,
        });
        console.log(chalk_1.default.green('✓ Hot reload server initialized'));
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
            // Stop hot reload server
            if (this.hotReloadServer) {
                this.hotReloadServer.stop();
            }
            // Close all legacy WebSocket connections
            this.sessions.forEach(session => {
                session.clients.forEach(client => {
                    client.close();
                });
            });
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
        if (!this.hotReloadServer) {
            throw new Error('Hot reload server not initialized');
        }
        const hotReloadSession = this.hotReloadServer.createSession();
        const session = {
            id: hotReloadSession.id,
            createdAt: hotReloadSession.createdAt,
            clients: new Set(),
        };
        this.sessions.set(hotReloadSession.id, session);
        return session;
    }
    /**
     * Get hot reload server instance
     */
    getHotReloadServer() {
        return this.hotReloadServer;
    }
    /**
     * Get local network IP address
     */
    getNetworkIP() {
        const interfaces = os.networkInterfaces();
        // Try to find a non-internal IPv4 address
        for (const name of Object.keys(interfaces)) {
            const iface = interfaces[name];
            if (!iface)
                continue;
            for (const addr of iface) {
                // Skip internal (loopback) and non-IPv4 addresses
                if (addr.family === 'IPv4' && !addr.internal) {
                    return addr.address;
                }
            }
        }
        return 'localhost';
    }
    displayQRCode(sessionId) {
        const networkIP = this.getNetworkIP();
        const wsUrl = `ws://${networkIP}:${this.config.port}/ws?session=${sessionId}`;
        const localhostUrl = `ws://localhost:${this.config.port}/ws?session=${sessionId}`;
        console.log(chalk_1.default.bold('📱 Scan this QR code with Lumora Dev Client:\n'));
        qrcode.generate(wsUrl, { small: true });
        console.log(chalk_1.default.gray(`\nSession ID: ${sessionId}`));
        console.log(chalk_1.default.gray(`Network URL: ${wsUrl}`));
        console.log(chalk_1.default.gray(`Localhost URL: ${localhostUrl}`));
        if (this.hotReloadServer) {
            const session = this.hotReloadServer.getSession(sessionId);
            if (session) {
                console.log(chalk_1.default.gray(`Expires: ${new Date(session.expiresAt).toLocaleString()}`));
            }
        }
        // Display connection instructions
        console.log(chalk_1.default.bold('\n📋 Connection Instructions:'));
        console.log(chalk_1.default.cyan('   1. Open Lumora Dev Client on your mobile device'));
        console.log(chalk_1.default.cyan('   2. Tap "Scan QR Code" button'));
        console.log(chalk_1.default.cyan('   3. Point your camera at the QR code above'));
        console.log(chalk_1.default.cyan('   4. Wait for connection confirmation'));
        console.log(chalk_1.default.gray('\n   Note: Ensure your device is on the same network as this computer'));
        console.log(chalk_1.default.gray(`   Network IP: ${networkIP}`));
    }
    getPort() {
        return this.config.port;
    }
    getSessions() {
        return this.sessions;
    }
    /**
     * Push schema update to session using hot reload protocol
     */
    pushSchemaUpdate(sessionId, schema, preserveState = true) {
        if (!this.hotReloadServer) {
            return {
                success: false,
                devicesUpdated: 0,
                updateType: 'full',
                error: 'Hot reload server not initialized',
            };
        }
        return this.hotReloadServer.pushUpdate(sessionId, schema, preserveState);
    }
}
exports.DevProxyServer = DevProxyServer;
//# sourceMappingURL=dev-proxy-server.js.map