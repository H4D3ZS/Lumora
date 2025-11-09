import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import crypto from 'crypto';
import { SessionManager } from './session-manager';
import { WebSocketEnvelope, JoinPayload, Client } from './types';

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
 * Extended WebSocket with custom properties
 */
interface ExtendedWebSocket extends WebSocket {
  clientId?: string;
  sessionId?: string;
  clientType?: 'device' | 'editor';
  isAlive?: boolean;
  lastPong?: number;
  joinTimeout?: NodeJS.Timeout;
  messageCount?: number;
  rateLimitResetAt?: number;
}

/**
 * Message priority levels
 */
enum MessagePriority {
  HIGH = 1,    // Events, ping/pong
  MEDIUM = 2,  // Delta updates
  LOW = 3      // Full schemas
}

/**
 * Prioritized message for queuing
 */
interface PrioritizedMessage {
  priority: MessagePriority;
  envelope: WebSocketEnvelope;
  targetClients: Client[];
}

/**
 * WebSocketBroker handles WebSocket connections and message routing
 */
export class WebSocketBroker {
  private wss: WebSocketServer;
  private sessionManager: SessionManager;
  private pingInterval: NodeJS.Timeout | null;

  constructor(server: Server, sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
    this.pingInterval = null;

    // Initialize WebSocket server with compression enabled
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      maxPayload: MAX_MESSAGE_SIZE,
      perMessageDeflate: {
        zlibDeflateOptions: {
          // See zlib defaults.
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        // Below options specified as default values.
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        serverMaxWindowBits: 10, // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10, // Limits zlib concurrency for perf.
        threshold: 1024 // Size (in bytes) below which messages should not be compressed.
      }
    });

    this.wss.on('connection', (ws: ExtendedWebSocket, req: any) => {
      this.handleConnection(ws, req);
    });
    console.log('[WebSocketBroker] WebSocket server initialized on /ws with compression enabled');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: ExtendedWebSocket, req: any): void {
    const clientId = crypto.randomBytes(8).toString('hex');
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
    ws.on('message', (data: Buffer) => {
      this.handleMessage(ws, data);
    });

    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastPong = Date.now();
    });

    // Handle connection close
    ws.on('close', (code: number, reason: Buffer) => {
      this.handleClose(ws, code, reason.toString());
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      console.error(`[WebSocket] Error for client ${ws.clientId}:`, error.message);
    });
  }

  /**
   * Check if origin is allowed (for CSRF protection)
   * In development, we allow localhost and local network IPs
   */
  private isAllowedOrigin(origin: string): boolean {
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
  private checkRateLimit(ws: ExtendedWebSocket): boolean {
    const now = Date.now();

    // Reset counter if window expired
    if (now > ws.rateLimitResetAt!) {
      ws.messageCount = 1;
      ws.rateLimitResetAt = now + RATE_LIMIT_WINDOW_MS;
      return true;
    }

    // Check if limit exceeded
    if (ws.messageCount! >= RATE_LIMIT_MAX_MESSAGES) {
      return false;
    }

    ws.messageCount!++;
    return true;
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(ws: ExtendedWebSocket, data: Buffer): void {
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

      const message = JSON.parse(data.toString()) as WebSocketEnvelope;

      // Handle join message
      if (message.type === 'join') {
        this.handleJoin(ws, message.payload as JoinPayload);
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

    } catch (error) {
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
  private handleJoin(ws: ExtendedWebSocket, payload: JoinPayload): void {
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

    const session = validation.session!;

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

    const client: Client = {
      clientId: ws.clientId!,
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
  private handleEvent(ws: ExtendedWebSocket, message: WebSocketEnvelope): void {
    const sessionId = ws.sessionId!;
    const clientId = ws.clientId!;
    const clientType = ws.clientType!;

    console.log(`[Event] Received event from ${clientType} client ${clientId} in session ${sessionId}`);
    console.log(`[Event] Event action: ${message.payload?.action || 'unknown'}`);

    // Ensure meta fields are preserved from the original message
    const eventEnvelope: WebSocketEnvelope = {
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
  private handleClose(ws: ExtendedWebSocket, code: number, reason: string): void {
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
   * Determines message priority based on type
   */
  private getMessagePriority(message: WebSocketEnvelope): MessagePriority {
    switch (message.type) {
      case 'event':
      case 'ping':
      case 'pong':
        return MessagePriority.HIGH;
      case 'ui_schema_delta':
        return MessagePriority.MEDIUM;
      case 'full_ui_schema':
      case 'dart_code_diff':
      default:
        return MessagePriority.LOW;
    }
  }

  /**
   * Broadcast message to all clients in a session
   */
  broadcastToSession(sessionId: string, message: WebSocketEnvelope, excludeClientId?: string, targetClientType?: 'device' | 'editor'): number {
    const startTime = Date.now();
    const priority = this.getMessagePriority(message);
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
      if (client.connection.readyState === WebSocket.OPEN) {
        try {
          this.sendMessage(client.connection, message);
          sentCount++;
        } catch (error) {
          console.error(`[WebSocket] Failed to send to client ${client.clientId}:`, error);
        }
      }
    }

    // Log broadcast latency with priority
    const latency = Date.now() - startTime;
    const priorityName = MessagePriority[priority];
    console.log(`[WebSocket] Broadcast to session ${sessionId}: ${sentCount}/${clients.length} clients${targetClientType ? ` (type: ${targetClientType})` : ''} [Priority: ${priorityName}]`);
    console.log(`[Performance] Broadcast latency: ${latency}ms`);
    
    return sentCount;
  }

  /**
   * Send message to a specific WebSocket connection
   */
  private sendMessage(ws: WebSocket, message: WebSocketEnvelope): void {
    ws.send(JSON.stringify(message));
  }

  /**
   * Send pong response
   */
  private sendPong(ws: ExtendedWebSocket): void {
    if (ws.readyState === WebSocket.OPEN) {
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
   * Start ping/pong health checks with efficient keep-alive
   */
  startHealthChecks(): void {
    if (this.pingInterval) {
      return;
    }

    this.pingInterval = setInterval(() => {
      const now = Date.now();
      let activeConnections = 0;
      let terminatedConnections = 0;

      this.wss.clients.forEach((ws: WebSocket) => {
        const extWs = ws as ExtendedWebSocket;

        // Check if client responded to last ping
        if (extWs.isAlive === false) {
          console.log(`[WebSocket] Client ${extWs.clientId} failed health check, terminating`);
          extWs.terminate();
          terminatedConnections++;
          return;
        }

        // Check if pong timeout exceeded
        if (extWs.lastPong && (now - extWs.lastPong) > PONG_TIMEOUT_MS) {
          console.log(`[WebSocket] Client ${extWs.clientId} pong timeout, closing connection`);
          extWs.close(1000, 'Pong timeout');
          terminatedConnections++;
          return;
        }

        // Mark as not alive and send ping (binary ping for efficiency)
        extWs.isAlive = false;
        extWs.ping();
        activeConnections++;
      });

      if (terminatedConnections > 0) {
        console.log(`[WebSocket] Health check: ${activeConnections} active, ${terminatedConnections} terminated`);
      }
    }, PING_INTERVAL_MS);

    console.log('[WebSocketBroker] Started health checks (ping every 30s with efficient keep-alive)');
  }

  /**
   * Stop ping/pong health checks
   */
  stopHealthChecks(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      console.log('[WebSocketBroker] Stopped health checks');
    }
  }

  /**
   * Get WebSocket connection count
   */
  getConnectionCount(): number {
    return this.wss.clients.size;
  }

  /**
   * Close all connections and cleanup
   */
  shutdown(): void {
    this.stopHealthChecks();
    this.wss.close(() => {
      console.log('[WebSocketBroker] WebSocket server closed');
    });
  }
}
