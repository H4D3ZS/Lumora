/**
 * Hot Reload Server
 * WebSocket-based server for real-time schema updates with hot reload protocol
 */

import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import { randomBytes } from 'crypto';
import {
  HotReloadMessage,
  ConnectMessage,
  UpdateMessage,
  SchemaUpdate,
  SchemaDelta,
  PROTOCOL_VERSION,
  ProtocolErrorCode,
  isConnectMessage,
  isPingMessage,
  isAckMessage,
} from 'lumora-ir';
import {
  serializeMessage,
  deserializeMessage,
  validateMessage,
  validateProtocolVersion,
  createConnectedMessage,
  createUpdateMessage,
  createFullUpdate,
  createIncrementalUpdate,
  createPongMessage,
  createErrorMessage,
  calculateSchemaDelta,
  shouldUseIncrementalUpdate,
} from 'lumora-ir';
import { LumoraIR } from 'lumora-ir';

/**
 * Device connection information
 */
export interface DeviceConnection {
  /** Unique connection ID */
  connectionId: string;

  /** Device ID from client */
  deviceId: string;

  /** Device platform */
  platform: string;

  /** Device name */
  deviceName?: string;

  /** WebSocket connection */
  ws: WebSocket;

  /** Connection timestamp */
  connectedAt: number;

  /** Last ping timestamp */
  lastPing: number;

  /** Client protocol version */
  clientVersion: string;

  /** Last acknowledged sequence number */
  lastAckSequence: number;
}

/**
 * Session information
 */
export interface HotReloadSession {
  /** Session ID */
  id: string;

  /** Session creation timestamp */
  createdAt: number;

  /** Connected devices */
  devices: Map<string, DeviceConnection>;

  /** Current schema */
  currentSchema?: LumoraIR;

  /** Update sequence number */
  sequenceNumber: number;

  /** Session expiry timestamp */
  expiresAt: number;
}

/**
 * Hot Reload Server Configuration
 */
export interface HotReloadServerConfig {
  /** HTTP server to attach WebSocket to */
  server: http.Server;

  /** WebSocket path */
  path?: string;

  /** Session timeout in milliseconds (default: 8 hours) */
  sessionTimeout?: number;

  /** Heartbeat interval in milliseconds (default: 30 seconds) */
  heartbeatInterval?: number;

  /** Connection timeout in milliseconds (default: 60 seconds) */
  connectionTimeout?: number;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Hot Reload Server
 * Manages WebSocket connections and distributes schema updates
 */
export class HotReloadServer {
  private wss: WebSocketServer;
  private sessions: Map<string, HotReloadSession>;
  private config: Required<HotReloadServerConfig>;
  private heartbeatTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: HotReloadServerConfig) {
    this.config = {
      server: config.server,
      path: config.path || '/ws',
      sessionTimeout: config.sessionTimeout || 8 * 60 * 60 * 1000, // 8 hours
      heartbeatInterval: config.heartbeatInterval || 30 * 1000, // 30 seconds
      connectionTimeout: config.connectionTimeout || 60 * 1000, // 60 seconds
      verbose: config.verbose || false,
    };

    this.sessions = new Map();
    this.wss = new WebSocketServer({
      server: config.server,
      path: this.config.path,
    });

    this.setupWebSocketServer();
    this.startHeartbeat();
    this.startCleanup();
  }

  /**
   * Setup WebSocket server and connection handling
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      this.log('New WebSocket connection attempt');

      // Extract session ID from query parameters
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const sessionId = url.searchParams.get('session');

      if (!sessionId) {
        this.log('Connection rejected: No session ID provided');
        ws.close(4400, 'Session ID required');
        return;
      }

      // Validate session exists
      const session = this.sessions.get(sessionId);
      if (!session) {
        this.log(`Connection rejected: Session ${sessionId} not found`);
        ws.close(4404, 'Session not found');
        return;
      }

      // Check session expiry
      if (Date.now() > session.expiresAt) {
        this.log(`Connection rejected: Session ${sessionId} expired`);
        this.sessions.delete(sessionId);
        ws.close(4410, 'Session expired');
        return;
      }

      // Setup message handler for this connection
      this.setupConnectionHandlers(ws, sessionId, session);
    });

    this.wss.on('error', (error: Error) => {
      console.error('WebSocket server error:', error);
    });
  }

  /**
   * Setup handlers for a specific WebSocket connection
   */
  private setupConnectionHandlers(
    ws: WebSocket,
    sessionId: string,
    session: HotReloadSession
  ): void {
    let deviceConnection: DeviceConnection | null = null;

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = deserializeMessage(data, { validate: true });

        // Validate session ID matches
        if (message.sessionId !== sessionId) {
          this.sendError(
            ws,
            sessionId,
            ProtocolErrorCode.SESSION_NOT_FOUND,
            'Session ID mismatch',
            'error',
            false
          );
          ws.close(4400, 'Session ID mismatch');
          return;
        }

        // Handle connect message
        if (isConnectMessage(message)) {
          deviceConnection = this.handleConnect(ws, sessionId, session, message);
          return;
        }

        // Require connection before other messages
        if (!deviceConnection) {
          this.sendError(
            ws,
            sessionId,
            ProtocolErrorCode.AUTHENTICATION_FAILED,
            'Must send connect message first',
            'error',
            false
          );
          ws.close(4401, 'Not authenticated');
          return;
        }

        // Handle other message types
        if (isPingMessage(message)) {
          this.handlePing(deviceConnection, message);
        } else if (isAckMessage(message)) {
          this.handleAck(deviceConnection, message);
        } else if ((message.type as string) === 'log') {
          this.handleLog(deviceConnection, message);
        } else {
          this.log(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        this.sendError(
          ws,
          sessionId,
          ProtocolErrorCode.INVALID_MESSAGE,
          error instanceof Error ? error.message : 'Invalid message',
          'error',
          true
        );
      }
    });

    // Handle connection close
    ws.on('close', () => {
      if (deviceConnection) {
        this.handleDisconnect(session, deviceConnection);
      }
    });

    // Handle connection errors
    ws.on('error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      if (deviceConnection) {
        this.handleDisconnect(session, deviceConnection);
      }
    });
  }

  /**
   * Handle connect message from device
   */
  private handleConnect(
    ws: WebSocket,
    sessionId: string,
    session: HotReloadSession,
    message: ConnectMessage
  ): DeviceConnection {
    const { deviceId, platform, deviceName, clientVersion } = message.payload;

    // Validate protocol version
    const versionCheck = validateProtocolVersion(clientVersion, PROTOCOL_VERSION);
    if (!versionCheck.valid) {
      this.sendError(
        ws,
        sessionId,
        ProtocolErrorCode.UNSUPPORTED_VERSION,
        versionCheck.errors.join(', '),
        'fatal',
        false
      );
      ws.close(4426, 'Unsupported protocol version');
      throw new Error('Unsupported protocol version');
    }

    // Create device connection
    const connectionId = this.generateConnectionId();
    const deviceConnection: DeviceConnection = {
      connectionId,
      deviceId,
      platform,
      deviceName,
      ws,
      connectedAt: Date.now(),
      lastPing: Date.now(),
      clientVersion,
      lastAckSequence: 0,
    };

    // Register device in session
    session.devices.set(connectionId, deviceConnection);

    this.log(
      `Device connected: ${deviceName || deviceId} (${platform}) to session ${sessionId}`
    );
    this.log(`  Connection ID: ${connectionId}`);
    this.log(`  Total devices in session: ${session.devices.size}`);

    // Send connected acknowledgment with initial schema
    const connectedMsg = createConnectedMessage(
      sessionId,
      connectionId,
      session.currentSchema
    );

    this.sendMessage(ws, connectedMsg);

    return deviceConnection;
  }

  /**
   * Handle ping message from device
   */
  private handlePing(device: DeviceConnection, message: HotReloadMessage): void {
    device.lastPing = Date.now();

    // Send pong response
    const pongMsg = createPongMessage(message.sessionId);
    this.sendMessage(device.ws, pongMsg);

    this.log(`Ping from device ${device.deviceId}, sent pong`);
  }

  /**
   * Handle acknowledgment message from device
   */
  private handleAck(device: DeviceConnection, message: HotReloadMessage): void {
    const { sequenceNumber, success, error, applyTime } = message.payload;

    device.lastAckSequence = sequenceNumber;

    if (success) {
      this.log(
        `Device ${device.deviceId} acknowledged update ${sequenceNumber} (${applyTime}ms)`
      );
    } else {
      console.error(
        `Device ${device.deviceId} failed to apply update ${sequenceNumber}: ${error}`
      );
    }
  }

  /**
   * Handle device disconnection
   */
  private handleDisconnect(session: HotReloadSession, device: DeviceConnection): void {
    session.devices.delete(device.connectionId);

    this.log(
      `Device disconnected: ${device.deviceName || device.deviceId} from session ${session.id}`
    );
    this.log(`  Remaining devices in session: ${session.devices.size}`);
  }

  /**
   * Create a new session
   */
  createSession(): HotReloadSession {
    const sessionId = this.generateSessionId();
    const session: HotReloadSession = {
      id: sessionId,
      createdAt: Date.now(),
      devices: new Map(),
      sequenceNumber: 0,
      expiresAt: Date.now() + this.config.sessionTimeout,
    };

    this.sessions.set(sessionId, session);

    this.log(`Created session: ${sessionId}`);
    this.log(`  Expires at: ${new Date(session.expiresAt).toISOString()}`);

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): HotReloadSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Close all device connections
    session.devices.forEach(device => {
      device.ws.close(1000, 'Session closed');
    });

    this.sessions.delete(sessionId);
    this.log(`Deleted session: ${sessionId}`);

    return true;
  }

  /**
   * Send message to WebSocket
   */
  private sendMessage(ws: WebSocket, message: HotReloadMessage): void {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const data = serializeMessage(message, { validate: true });
      ws.send(data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Send error message to WebSocket
   */
  private sendError(
    ws: WebSocket,
    sessionId: string,
    code: string,
    message: string,
    severity: 'warning' | 'error' | 'fatal',
    recoverable: boolean,
    details?: string
  ): void {
    const errorMsg = createErrorMessage(
      sessionId,
      code,
      message,
      severity,
      recoverable,
      details
    );

    this.sendMessage(ws, errorMsg);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();

      this.sessions.forEach(session => {
        session.devices.forEach(device => {
          const timeSinceLastPing = now - device.lastPing;

          if (timeSinceLastPing > this.config.connectionTimeout) {
            this.log(
              `Device ${device.deviceId} timed out (no ping for ${timeSinceLastPing}ms)`
            );
            device.ws.close(1000, 'Connection timeout');
            this.handleDisconnect(session, device);
          }
        });
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * Start session cleanup
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();

      this.sessions.forEach((session, sessionId) => {
        if (now > session.expiresAt) {
          this.log(`Session ${sessionId} expired, cleaning up`);
          this.deleteSession(sessionId);
        }
      });
    }, 60 * 1000); // Check every minute
  }

  /**
   * Stop the server
   */
  stop(): void {
    this.log('Stopping hot reload server');

    // Clear timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // OPTIMIZATION: Clear all pending batches
    this.updateBatches.forEach((batch) => {
      clearTimeout(batch.timeout);
    });
    this.updateBatches.clear();

    // Close all sessions
    this.sessions.forEach((session, sessionId) => {
      this.deleteSession(sessionId);
    });

    // Close WebSocket server
    this.wss.close();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return randomBytes(8).toString('hex');
  }

  /**
   * Log message if verbose mode is enabled
   */


  /**
   * Handle log message from device
   */
  private handleLog(connection: DeviceConnection, message: any): void {
    const { payload } = message;
    const { message: logMessage, level } = payload;

    // Emit log event for CLI to display
    this.emitLog(connection, logMessage, level);
  }

  /**
   * Emit log event (to be handled by CLI)
   */
  private emitLog(connection: DeviceConnection, message: string, level: string): void {
    const chalk = require('chalk');
    const levelColor = level === 'error' ? chalk.red : (level === 'warn' ? chalk.yellow : chalk.blue);
    const platformIcon = connection.platform === 'ios' ? '🍎' : (connection.platform === 'android' ? '🤖' : '📱');
    const deviceName = connection.deviceName || connection.deviceId.substring(0, 8);

    console.log(
      `${platformIcon} ${chalk.bold(deviceName)} ${levelColor(`[${level.toUpperCase()}]`)} ${message}`
    );
  }

  /**
   * Log message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[HotReload] ${message}`);
    }
  }

  // ============================================================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================================================

  // Batch updates to reduce message overhead
  private updateBatches: Map<string, {
    schema: LumoraIR;
    preserveState: boolean;
    timeout: NodeJS.Timeout;
  }> = new Map();

  private readonly BATCH_DELAY_MS = 50; // 50ms batching window

  /**
   * Push schema update to all devices in a session
   * Automatically determines whether to use full or incremental update
   * OPTIMIZED: Batches rapid updates to reduce message overhead
   */
  pushUpdate(sessionId: string, schema: LumoraIR, preserveState: boolean = true): {
    success: boolean;
    devicesUpdated: number;
    updateType: 'full' | 'incremental';
    error?: string;
    batched?: boolean;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        devicesUpdated: 0,
        updateType: 'full',
        error: 'Session not found',
      };
    }

    // OPTIMIZATION: Batch rapid updates
    const existingBatch = this.updateBatches.get(sessionId);
    if (existingBatch) {
      // Clear existing timeout
      clearTimeout(existingBatch.timeout);

      // Update the batch with new schema
      existingBatch.schema = schema;
      existingBatch.preserveState = preserveState;

      // Set new timeout
      existingBatch.timeout = setTimeout(() => {
        this.flushUpdate(sessionId);
      }, this.BATCH_DELAY_MS);

      return {
        success: true,
        devicesUpdated: 0,
        updateType: 'full',
        batched: true,
      };
    }

    // Create new batch
    const timeout = setTimeout(() => {
      this.flushUpdate(sessionId);
    }, this.BATCH_DELAY_MS);

    this.updateBatches.set(sessionId, {
      schema,
      preserveState,
      timeout,
    });

    return {
      success: true,
      devicesUpdated: 0,
      updateType: 'full',
      batched: true,
    };
  }

  /**
   * Flush batched update immediately
   * OPTIMIZATION: Sends the accumulated update
   */
  private flushUpdate(sessionId: string): {
    success: boolean;
    devicesUpdated: number;
    updateType: 'full' | 'incremental';
    error?: string;
  } {
    const batch = this.updateBatches.get(sessionId);
    if (!batch) {
      return {
        success: false,
        devicesUpdated: 0,
        updateType: 'full',
        error: 'No batch found',
      };
    }

    // Remove batch
    this.updateBatches.delete(sessionId);

    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        devicesUpdated: 0,
        updateType: 'full',
        error: 'Session not found',
      };
    }

    // Increment sequence number
    session.sequenceNumber++;

    let update: SchemaUpdate;
    let updateType: 'full' | 'incremental';

    // Calculate delta if we have a previous schema
    if (session.currentSchema) {
      const delta = calculateSchemaDelta(session.currentSchema, batch.schema);

      // Decide whether to use incremental or full update
      if (shouldUseIncrementalUpdate(delta)) {
        update = createIncrementalUpdate(delta, session.sequenceNumber, batch.preserveState);
        updateType = 'incremental';
        this.log(
          `Incremental update for session ${sessionId}: ` +
          `${delta.added.length} added, ${delta.modified.length} modified, ` +
          `${delta.removed.length} removed`
        );
      } else {
        update = createFullUpdate(batch.schema, session.sequenceNumber, batch.preserveState);
        updateType = 'full';
        this.log(`Full update for session ${sessionId} (delta too large)`);
      }
    } else {
      // First update, always full
      update = createFullUpdate(batch.schema, session.sequenceNumber, batch.preserveState);
      updateType = 'full';
      this.log(`Initial full update for session ${sessionId}`);
    }

    // Update current schema
    session.currentSchema = batch.schema;

    // Broadcast to all connected devices
    const devicesUpdated = this.broadcastUpdate(session, update);

    return {
      success: true,
      devicesUpdated,
      updateType,
    };
  }

  /**
   * Push update immediately without batching
   * OPTIMIZATION: Bypasses batching for critical updates
   */
  pushUpdateImmediate(sessionId: string, schema: LumoraIR, preserveState: boolean = true): {
    success: boolean;
    devicesUpdated: number;
    updateType: 'full' | 'incremental';
    error?: string;
  } {
    // Cancel any pending batch
    const existingBatch = this.updateBatches.get(sessionId);
    if (existingBatch) {
      clearTimeout(existingBatch.timeout);
      this.updateBatches.delete(sessionId);
    }

    // Create temporary batch and flush immediately
    this.updateBatches.set(sessionId, {
      schema,
      preserveState,
      timeout: setTimeout(() => { }, 0), // Dummy timeout
    });

    return this.flushUpdate(sessionId);
  }

  /**
   * Broadcast update to all devices in a session
   */
  private broadcastUpdate(session: HotReloadSession, update: SchemaUpdate): number {
    let devicesUpdated = 0;

    const updateMsg = createUpdateMessage(session.id, update);

    session.devices.forEach(device => {
      if (device.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(device.ws, updateMsg);
        devicesUpdated++;

        this.log(
          `Sent ${update.type} update (seq ${update.sequenceNumber}) to device ${device.deviceId}`
        );
      }
    });

    return devicesUpdated;
  }

  /**
   * Push full schema update to a specific device
   * Useful for reconnection scenarios
   */
  pushUpdateToDevice(
    sessionId: string,
    connectionId: string,
    schema: LumoraIR,
    preserveState: boolean = true
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const device = session.devices.get(connectionId);
    if (!device) {
      return false;
    }

    if (device.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    // Increment sequence number
    session.sequenceNumber++;

    // Always send full update for individual device
    const update = createFullUpdate(schema, session.sequenceNumber, preserveState);
    const updateMsg = createUpdateMessage(sessionId, update);

    this.sendMessage(device.ws, updateMsg);

    this.log(
      `Sent full update (seq ${update.sequenceNumber}) to device ${device.deviceId}`
    );

    return true;
  }

  /**
   * Calculate delta between two schemas
   * Exposed for testing and external use
   */
  calculateDelta(oldSchema: LumoraIR, newSchema: LumoraIR): SchemaDelta {
    return calculateSchemaDelta(oldSchema, newSchema);
  }

  /**
   * Handle update acknowledgment tracking
   * Returns devices that haven't acknowledged the given sequence number
   */
  getUnacknowledgedDevices(sessionId: string, sequenceNumber: number): DeviceConnection[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    const unacknowledged: DeviceConnection[] = [];

    session.devices.forEach(device => {
      if (device.lastAckSequence < sequenceNumber) {
        unacknowledged.push(device);
      }
    });

    return unacknowledged;
  }

  /**
   * Get all connected devices for a session
   */
  getConnectedDevices(sessionId: string): DeviceConnection[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    return Array.from(session.devices.values());
  }

  /**
   * Get specific device connection
   */
  getDevice(sessionId: string, connectionId: string): DeviceConnection | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }

    return session.devices.get(connectionId);
  }

  /**
   * Check if a device is still connected and responsive
   */
  isDeviceHealthy(sessionId: string, connectionId: string): boolean {
    const device = this.getDevice(sessionId, connectionId);
    if (!device) {
      return false;
    }

    // Check WebSocket state
    if (device.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    // Check if device has pinged recently
    const timeSinceLastPing = Date.now() - device.lastPing;
    if (timeSinceLastPing > this.config.connectionTimeout) {
      return false;
    }

    return true;
  }

  /**
   * Manually disconnect a device
   */
  disconnectDevice(sessionId: string, connectionId: string, reason?: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const device = session.devices.get(connectionId);
    if (!device) {
      return false;
    }

    this.log(`Manually disconnecting device ${device.deviceId}: ${reason || 'No reason'}`);

    device.ws.close(1000, reason || 'Disconnected by server');
    this.handleDisconnect(session, device);

    return true;
  }

  /**
   * Extend session expiry time
   */
  extendSession(sessionId: string, additionalTime?: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const extension = additionalTime || this.config.sessionTimeout;
    session.expiresAt = Date.now() + extension;

    this.log(`Extended session ${sessionId} by ${extension}ms`);
    this.log(`  New expiry: ${new Date(session.expiresAt).toISOString()}`);

    return true;
  }

  /**
   * Get connection health status for all devices in a session
   */
  getSessionHealth(sessionId: string): {
    sessionId: string;
    totalDevices: number;
    healthyDevices: number;
    unhealthyDevices: number;
    devices: Array<{
      connectionId: string;
      deviceId: string;
      healthy: boolean;
      lastPing: number;
      timeSinceLastPing: number;
      lastAckSequence: number;
    }>;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const now = Date.now();
    const devices = Array.from(session.devices.values()).map(device => {
      const timeSinceLastPing = now - device.lastPing;
      const healthy =
        device.ws.readyState === WebSocket.OPEN &&
        timeSinceLastPing < this.config.connectionTimeout;

      return {
        connectionId: device.connectionId,
        deviceId: device.deviceId,
        healthy,
        lastPing: device.lastPing,
        timeSinceLastPing,
        lastAckSequence: device.lastAckSequence,
      };
    });

    const healthyDevices = devices.filter(d => d.healthy).length;

    return {
      sessionId,
      totalDevices: devices.length,
      healthyDevices,
      unhealthyDevices: devices.length - healthyDevices,
      devices,
    };
  }

  /**
   * Force cleanup of stale connections
   * Returns number of connections cleaned up
   */
  cleanupStaleConnections(): number {
    let cleaned = 0;
    const now = Date.now();

    this.sessions.forEach(session => {
      const devicesToRemove: DeviceConnection[] = [];

      session.devices.forEach(device => {
        const timeSinceLastPing = now - device.lastPing;

        if (
          device.ws.readyState !== WebSocket.OPEN ||
          timeSinceLastPing > this.config.connectionTimeout
        ) {
          devicesToRemove.push(device);
        }
      });

      devicesToRemove.forEach(device => {
        this.log(`Cleaning up stale connection: ${device.deviceId}`);
        device.ws.close(1000, 'Stale connection');
        this.handleDisconnect(session, device);
        cleaned++;
      });
    });

    if (cleaned > 0) {
      this.log(`Cleaned up ${cleaned} stale connections`);
    }

    return cleaned;
  }

  /**
   * Get server statistics
   */
  getStats(): {
    sessions: number;
    totalDevices: number;
    sessionDetails: Array<{
      id: string;
      devices: number;
      createdAt: number;
      expiresAt: number;
    }>;
  } {
    const sessionDetails = Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      devices: session.devices.size,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));

    const totalDevices = sessionDetails.reduce((sum, s) => sum + s.devices, 0);

    return {
      sessions: this.sessions.size,
      totalDevices,
      sessionDetails,
    };
  }
}
