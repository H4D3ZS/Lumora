/**
 * Dev-Proxy Server
 * Manages WebSocket connections and schema broadcasting
 * Now integrates with HotReloadServer for protocol-compliant hot reload
 */

import express, { Express } from 'express';
import { WebSocket } from 'ws';
import * as http from 'http';
import * as qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import * as os from 'os';
import { HotReloadServer, HotReloadSession } from './hot-reload-server';
import { LumoraIR } from 'lumora-ir';

export interface DevProxyConfig {
  port: number;
  enableQR: boolean;
  verbose?: boolean;
}

export interface Session {
  id: string;
  createdAt: number;
  clients: Set<WebSocket>;
}

export class DevProxyServer {
  private app: Express;
  private server: http.Server | null = null;
  private hotReloadServer: HotReloadServer | null = null;
  private sessions: Map<string, Session> = new Map();
  private config: DevProxyConfig;

  constructor(config: DevProxyConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }

  private setupRoutes() {
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
      const session: Session = {
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
      const schema = req.body as LumoraIR;

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

  private setupWebSocket() {
    if (!this.server) return;

    // Initialize hot reload server
    this.hotReloadServer = new HotReloadServer({
      server: this.server,
      path: '/ws',
      verbose: this.config.verbose || false,
    });

    console.log(chalk.green('✓ Hot reload server initialized'));
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = http.createServer(this.app);
        this.setupWebSocket();

        this.server.listen(this.config.port, () => {
          resolve();
        });

        this.server.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
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
      } else {
        resolve();
      }
    });
  }

  async createSession(): Promise<Session> {
    if (!this.hotReloadServer) {
      throw new Error('Hot reload server not initialized');
    }

    const hotReloadSession = this.hotReloadServer.createSession();

    const session: Session = {
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
  getHotReloadServer(): HotReloadServer | null {
    return this.hotReloadServer;
  }

  /**
   * Get local network IP address
   */
  private getNetworkIP(): string {
    const interfaces = os.networkInterfaces();
    
    // Try to find a non-internal IPv4 address
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;
      
      for (const addr of iface) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
    
    return 'localhost';
  }

  displayQRCode(sessionId: string) {
    const networkIP = this.getNetworkIP();
    const wsUrl = `ws://${networkIP}:${this.config.port}/ws?session=${sessionId}`;
    const localhostUrl = `ws://localhost:${this.config.port}/ws?session=${sessionId}`;

    console.log(chalk.bold('📱 Scan this QR code with Lumora Dev Client:\n'));
    qrcode.generate(wsUrl, { small: true });
    console.log(chalk.gray(`\nSession ID: ${sessionId}`));
    console.log(chalk.gray(`Network URL: ${wsUrl}`));
    console.log(chalk.gray(`Localhost URL: ${localhostUrl}`));

    if (this.hotReloadServer) {
      const session = this.hotReloadServer.getSession(sessionId);
      if (session) {
        console.log(chalk.gray(`Expires: ${new Date(session.expiresAt).toLocaleString()}`));
      }
    }

    // Display connection instructions
    console.log(chalk.bold('\n📋 Connection Instructions:'));
    console.log(chalk.cyan('   1. Open Lumora Dev Client on your mobile device'));
    console.log(chalk.cyan('   2. Tap "Scan QR Code" button'));
    console.log(chalk.cyan('   3. Point your camera at the QR code above'));
    console.log(chalk.cyan('   4. Wait for connection confirmation'));
    console.log(chalk.gray('\n   Note: Ensure your device is on the same network as this computer'));
    console.log(chalk.gray(`   Network IP: ${networkIP}`));
  }

  getPort(): number {
    return this.config.port;
  }

  getSessions(): Map<string, Session> {
    return this.sessions;
  }

  /**
   * Push schema update to session using hot reload protocol
   */
  pushSchemaUpdate(sessionId: string, schema: LumoraIR, preserveState: boolean = true): {
    success: boolean;
    devicesUpdated: number;
    updateType: 'full' | 'incremental';
    error?: string;
  } {
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
