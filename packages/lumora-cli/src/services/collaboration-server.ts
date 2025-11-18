/**
 * Collaboration Server
 * Enables real-time collaboration and shared development sessions
 */

import { EventEmitter } from 'events';
import WebSocket, { WebSocketServer } from 'ws';
import * as http from 'http';
import express, { Request, Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface CollaborationConfig {
  port?: number;
  maxSessionSize?: number;
  sessionTimeout?: number; // milliseconds
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
  files: Map<string, string>; // filename -> content
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
export class CollaborationServer extends EventEmitter {
  private config: Required<CollaborationConfig>;
  private sessions: Map<string, Session> = new Map();
  private wss: WebSocketServer | null = null;
  private server: http.Server | null = null;
  private clients: Map<string, WebSocket> = new Map();

  constructor(config: CollaborationConfig = {}) {
    super();
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
  async start(): Promise<void> {
    const app = express();

    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../public/collaboration')));

    // API endpoints
    app.get('/api/sessions', (req: Request, res: Response) => {
      const sessions = Array.from(this.sessions.values()).map(s => ({
        id: s.id,
        name: s.name,
        owner: s.owner.name,
        userCount: s.users.size,
        createdAt: s.createdAt,
      }));
      res.json({ sessions });
    });

    app.post('/api/sessions', async (req: Request, res: Response) => {
      try {
        const { name, projectPath, user } = req.body;
        const session = await this.createSession(name, projectPath, user);
        res.json({ session: { id: session.id, name: session.name } });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/sessions/:id', (req: Request, res: Response) => {
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
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('New WebSocket connection');

      ws.on('message', (data: string) => {
        try {
          const message: Message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
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
  async stop(): Promise<void> {
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
  async createSession(name: string, projectPath: string, owner: User): Promise<Session> {
    const sessionId = this.generateSessionId();

    // Load project files
    const files = await this.loadProjectFiles(projectPath);

    const session: Session = {
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
  private handleMessage(ws: WebSocket, message: Message): void {
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
  private handleJoin(ws: WebSocket, session: Session, message: Message): void {
    if (session.users.size >= this.config.maxSessionSize) {
      this.sendError(ws, 'Session is full');
      return;
    }

    const user: User = message.data.user;
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
  private handleLeave(session: Session, message: Message): void {
    const user = session.users.get(message.userId);
    if (!user) return;

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
  private handleFileChange(session: Session, message: Message): void {
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
  private handleCursorMove(session: Session, message: Message): void {
    const user = session.users.get(message.userId);
    if (!user) return;

    user.cursor = message.data.cursor;

    // Broadcast cursor position to all other users
    this.broadcast(session, message, message.userId);
  }

  /**
   * Handle chat message
   */
  private handleChat(session: Session, message: Message): void {
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
  private handleSync(ws: WebSocket, session: Session, message: Message): void {
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
  private handleDisconnect(ws: WebSocket): void {
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
  private broadcast(session: Session, message: Message, excludeUserId?: string): void {
    session.users.forEach((user, userId) => {
      if (userId !== excludeUserId) {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          this.send(ws, message);
        }
      }
    });
  }

  /**
   * Send message to specific WebSocket
   */
  private send(ws: WebSocket, message: Message): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error message
   */
  private sendError(ws: WebSocket, error: string): void {
    this.send(ws, {
      type: 'error' as any,
      userId: 'system',
      sessionId: '',
      data: { error },
      timestamp: new Date(),
    });
  }

  /**
   * Load project files
   */
  private async loadProjectFiles(projectPath: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    const srcPath = path.join(projectPath, 'src');

    if (!await fs.pathExists(srcPath)) {
      return files;
    }

    const loadDir = async (dir: string, baseDir: string = srcPath) => {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          await loadDir(fullPath, baseDir);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
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
  private cleanupSessions(): void {
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      const inactiveTime = now - session.lastActivity.getTime();

      if (inactiveTime > this.config.sessionTimeout) {
        // Notify all users
        this.broadcast(session, {
          type: 'leave' as any,
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
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session info
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
}

// Singleton instance
let collaborationServerInstance: CollaborationServer | null = null;

export function getCollaborationServer(config?: CollaborationConfig): CollaborationServer {
  if (!collaborationServerInstance) {
    collaborationServerInstance = new CollaborationServer(config);
  }
  return collaborationServerInstance;
}
