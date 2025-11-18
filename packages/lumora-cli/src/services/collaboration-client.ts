/**
 * Collaboration Client
 * Client-side collaboration features
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { User, Message, CursorPosition } from './collaboration-server';

export interface ClientConfig {
  serverUrl: string;
  sessionId: string;
  user: User;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export interface FileChange {
  file: string;
  changes: TextChange[];
  version: number;
}

export interface TextChange {
  type: 'insert' | 'delete' | 'replace';
  position: number;
  text?: string;
  length?: number;
}

/**
 * Collaboration Client
 */
export class CollaborationClient extends EventEmitter {
  private config: Required<ClientConfig>;
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private fileVersions: Map<string, number> = new Map();

  constructor(config: ClientConfig) {
    super();
    this.config = {
      autoReconnect: true,
      reconnectDelay: 3000,
      ...config,
    };
  }

  /**
   * Connect to collaboration server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.config.serverUrl);

      const ws = this.ws;

      ws.on('open', () => {
        this.connected = true;
        console.log('Connected to collaboration server');

        // Join session
        this.send({
          type: 'join',
          userId: this.config.user.id,
          sessionId: this.config.sessionId,
          data: { user: this.config.user },
          timestamp: new Date(),
        });

        this.emit('connected');
        resolve();
      });

      ws.on('message', (data: string) => {
        try {
          const message: Message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        this.connected = false;
        console.log('Disconnected from collaboration server');
        this.emit('disconnected');

        if (this.config.autoReconnect) {
          this.scheduleReconnect();
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      });
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.send({
        type: 'leave',
        userId: this.config.user.id,
        sessionId: this.config.sessionId,
        timestamp: new Date(),
      });

      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Send file change
   */
  sendFileChange(file: string, content: string, changes: TextChange[]): void {
    const version = (this.fileVersions.get(file) || 0) + 1;
    this.fileVersions.set(file, version);

    this.send({
      type: 'file-change',
      userId: this.config.user.id,
      sessionId: this.config.sessionId,
      data: { file, content, changes, version },
      timestamp: new Date(),
    });
  }

  /**
   * Send cursor position
   */
  sendCursorMove(cursor: CursorPosition): void {
    this.send({
      type: 'cursor-move',
      userId: this.config.user.id,
      sessionId: this.config.sessionId,
      data: { cursor },
      timestamp: new Date(),
    });
  }

  /**
   * Send chat message
   */
  sendChat(message: string): void {
    this.send({
      type: 'chat',
      userId: this.config.user.id,
      sessionId: this.config.sessionId,
      data: { message },
      timestamp: new Date(),
    });
  }

  /**
   * Request sync
   */
  requestSync(): void {
    this.send({
      type: 'sync',
      userId: this.config.user.id,
      sessionId: this.config.sessionId,
      timestamp: new Date(),
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: Message): void {
    switch (message.type) {
      case 'join':
        this.emit('user:joined', message.data.user);
        break;

      case 'leave':
        this.emit('user:left', message.data.userId);
        break;

      case 'file-change':
        if (message.userId !== this.config.user.id) {
          this.emit('file:changed', {
            file: message.data.file,
            content: message.data.content,
            changes: message.data.changes,
            userId: message.userId,
          });
        }
        break;

      case 'cursor-move':
        if (message.userId !== this.config.user.id) {
          this.emit('cursor:moved', {
            userId: message.userId,
            cursor: message.data.cursor,
          });
        }
        break;

      case 'chat':
        this.emit('chat:message', {
          userId: message.userId,
          message: message.data.message,
          timestamp: message.timestamp,
        });
        break;

      case 'sync':
        this.emit('sync', {
          users: message.data.users,
          files: message.data.files,
        });
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Send message to server
   */
  private send(message: Message): void {
    if (this.ws && this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Not connected to server, message not sent');
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log('Attempting to reconnect...');
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.config.reconnectDelay);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
