/**
 * Dev-Proxy Server
 * Manages WebSocket connections and schema broadcasting
 */

import express, { Express } from 'express';
import { Server as WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as qrcode from 'qrcode-terminal';
import { randomBytes } from 'crypto';
import chalk from 'chalk';

export interface DevProxyConfig {
  port: number;
  enableQR: boolean;
}

export interface Session {
  id: string;
  createdAt: number;
  clients: Set<WebSocket>;
}

export class DevProxyServer {
  private app: Express;
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
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
      res.json({ status: 'ok', sessions: this.sessions.size });
    });

    // Create session
    this.app.post('/session/new', (req, res) => {
      const sessionId = this.generateSessionId();
      const session: Session = {
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
        if (client.readyState === WebSocket.OPEN) {
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

  private setupWebSocket() {
    if (!this.server) return;

    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url!, `http://localhost:${this.config.port}`);
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
      console.log(chalk.green(`✓ Device connected to session ${sessionId} (${session.clients.size} total)`));

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
        } catch (error) {
          console.error(chalk.red('Error parsing message:'), error);
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        session.clients.delete(ws);
        console.log(chalk.yellow(`✗ Device disconnected from session ${sessionId} (${session.clients.size} remaining)`));
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(chalk.red('WebSocket error:'), error);
      });
    });
  }

  private handleClientMessage(sessionId: string, message: any, ws: WebSocket) {
    switch (message.type) {
      case 'event':
        // Handle UI events from device
        console.log(chalk.blue(`📱 Event from device: ${message.event}`));
        // Could forward to event handlers here
        break;

      case 'log':
        // Handle logs from device
        console.log(chalk.gray(`📱 Device log: ${message.message}`));
        break;

      case 'error':
        // Handle errors from device
        console.error(chalk.red(`📱 Device error: ${message.message}`));
        break;

      default:
        console.log(chalk.gray(`📱 Unknown message type: ${message.type}`));
    }
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
      } else {
        resolve();
      }
    });
  }

  async createSession(): Promise<Session> {
    const sessionId = this.generateSessionId();
    const session: Session = {
      id: sessionId,
      createdAt: Date.now(),
      clients: new Set(),
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  displayQRCode(sessionId: string) {
    const wsUrl = `ws://localhost:${this.config.port}/ws?session=${sessionId}`;
    
    console.log(chalk.bold('📱 Scan this QR code with Lumora Dev Client:\n'));
    qrcode.generate(wsUrl, { small: true });
    console.log(chalk.gray(`\nSession: ${sessionId}`));
    console.log(chalk.gray(`WebSocket URL: ${wsUrl}`));
  }

  private generateSessionId(): string {
    return randomBytes(8).toString('hex');
  }

  getPort(): number {
    return this.config.port;
  }

  getSessions(): Map<string, Session> {
    return this.sessions;
  }
}
