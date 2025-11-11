"use strict";
/**
 * Hot Reload Server
 * WebSocket-based server for real-time schema updates with hot reload protocol
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotReloadServer = void 0;
const ws_1 = require("ws");
const crypto_1 = require("crypto");
const hot_reload_protocol_1 = require("lumora-ir/src/protocol/hot-reload-protocol");
const protocol_serialization_1 = require("lumora-ir/src/protocol/protocol-serialization");
/**
 * Hot Reload Server
 * Manages WebSocket connections and distributes schema updates
 */
class HotReloadServer {
    constructor(config) {
        // ============================================================================
        // PERFORMANCE OPTIMIZATIONS
        // ============================================================================
        // Batch updates to reduce message overhead
        this.updateBatches = new Map();
        this.BATCH_DELAY_MS = 50; // 50ms batching window
        this.config = {
            server: config.server,
            path: config.path || '/ws',
            sessionTimeout: config.sessionTimeout || 8 * 60 * 60 * 1000, // 8 hours
            heartbeatInterval: config.heartbeatInterval || 30 * 1000, // 30 seconds
            connectionTimeout: config.connectionTimeout || 60 * 1000, // 60 seconds
            verbose: config.verbose || false,
        };
        this.sessions = new Map();
        this.wss = new ws_1.WebSocketServer({
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
    setupWebSocketServer() {
        this.wss.on('connection', (ws, req) => {
            this.log('New WebSocket connection attempt');
            // Extract session ID from query parameters
            const url = new URL(req.url, `http://${req.headers.host}`);
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
        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }
    /**
     * Setup handlers for a specific WebSocket connection
     */
    setupConnectionHandlers(ws, sessionId, session) {
        let deviceConnection = null;
        // Handle incoming messages
        ws.on('message', (data) => {
            try {
                const message = (0, protocol_serialization_1.deserializeMessage)(data, { validate: true });
                // Validate session ID matches
                if (message.sessionId !== sessionId) {
                    this.sendError(ws, sessionId, hot_reload_protocol_1.ProtocolErrorCode.SESSION_NOT_FOUND, 'Session ID mismatch', 'error', false);
                    ws.close(4400, 'Session ID mismatch');
                    return;
                }
                // Handle connect message
                if ((0, hot_reload_protocol_1.isConnectMessage)(message)) {
                    deviceConnection = this.handleConnect(ws, sessionId, session, message);
                    return;
                }
                // Require connection before other messages
                if (!deviceConnection) {
                    this.sendError(ws, sessionId, hot_reload_protocol_1.ProtocolErrorCode.AUTHENTICATION_FAILED, 'Must send connect message first', 'error', false);
                    ws.close(4401, 'Not authenticated');
                    return;
                }
                // Handle other message types
                if ((0, hot_reload_protocol_1.isPingMessage)(message)) {
                    this.handlePing(deviceConnection, message);
                }
                else if ((0, hot_reload_protocol_1.isAckMessage)(message)) {
                    this.handleAck(deviceConnection, message);
                }
                else {
                    this.log(`Unknown message type: ${message.type}`);
                }
            }
            catch (error) {
                console.error('Error handling message:', error);
                this.sendError(ws, sessionId, hot_reload_protocol_1.ProtocolErrorCode.INVALID_MESSAGE, error instanceof Error ? error.message : 'Invalid message', 'error', true);
            }
        });
        // Handle connection close
        ws.on('close', () => {
            if (deviceConnection) {
                this.handleDisconnect(session, deviceConnection);
            }
        });
        // Handle connection errors
        ws.on('error', (error) => {
            console.error('WebSocket connection error:', error);
            if (deviceConnection) {
                this.handleDisconnect(session, deviceConnection);
            }
        });
    }
    /**
     * Handle connect message from device
     */
    handleConnect(ws, sessionId, session, message) {
        const { deviceId, platform, deviceName, clientVersion } = message.payload;
        // Validate protocol version
        const versionCheck = (0, protocol_serialization_1.validateProtocolVersion)(clientVersion, hot_reload_protocol_1.PROTOCOL_VERSION);
        if (!versionCheck.valid) {
            this.sendError(ws, sessionId, hot_reload_protocol_1.ProtocolErrorCode.UNSUPPORTED_VERSION, versionCheck.errors.join(', '), 'fatal', false);
            ws.close(4426, 'Unsupported protocol version');
            throw new Error('Unsupported protocol version');
        }
        // Create device connection
        const connectionId = this.generateConnectionId();
        const deviceConnection = {
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
        this.log(`Device connected: ${deviceName || deviceId} (${platform}) to session ${sessionId}`);
        this.log(`  Connection ID: ${connectionId}`);
        this.log(`  Total devices in session: ${session.devices.size}`);
        // Send connected acknowledgment with initial schema
        const connectedMsg = (0, protocol_serialization_1.createConnectedMessage)(sessionId, connectionId, session.currentSchema);
        this.sendMessage(ws, connectedMsg);
        return deviceConnection;
    }
    /**
     * Handle ping message from device
     */
    handlePing(device, message) {
        device.lastPing = Date.now();
        // Send pong response
        const pongMsg = (0, protocol_serialization_1.createPongMessage)(message.sessionId);
        this.sendMessage(device.ws, pongMsg);
        this.log(`Ping from device ${device.deviceId}, sent pong`);
    }
    /**
     * Handle acknowledgment message from device
     */
    handleAck(device, message) {
        const { sequenceNumber, success, error, applyTime } = message.payload;
        device.lastAckSequence = sequenceNumber;
        if (success) {
            this.log(`Device ${device.deviceId} acknowledged update ${sequenceNumber} (${applyTime}ms)`);
        }
        else {
            console.error(`Device ${device.deviceId} failed to apply update ${sequenceNumber}: ${error}`);
        }
    }
    /**
     * Handle device disconnection
     */
    handleDisconnect(session, device) {
        session.devices.delete(device.connectionId);
        this.log(`Device disconnected: ${device.deviceName || device.deviceId} from session ${session.id}`);
        this.log(`  Remaining devices in session: ${session.devices.size}`);
    }
    /**
     * Create a new session
     */
    createSession() {
        const sessionId = this.generateSessionId();
        const session = {
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
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Delete session
     */
    deleteSession(sessionId) {
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
    sendMessage(ws, message) {
        if (ws.readyState !== ws_1.WebSocket.OPEN) {
            return;
        }
        try {
            const data = (0, protocol_serialization_1.serializeMessage)(message, { validate: true });
            ws.send(data);
        }
        catch (error) {
            console.error('Error sending message:', error);
        }
    }
    /**
     * Send error message to WebSocket
     */
    sendError(ws, sessionId, code, message, severity, recoverable, details) {
        const errorMsg = (0, protocol_serialization_1.createErrorMessage)(sessionId, code, message, severity, recoverable, details);
        this.sendMessage(ws, errorMsg);
    }
    /**
     * Start heartbeat monitoring
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            const now = Date.now();
            this.sessions.forEach(session => {
                session.devices.forEach(device => {
                    const timeSinceLastPing = now - device.lastPing;
                    if (timeSinceLastPing > this.config.connectionTimeout) {
                        this.log(`Device ${device.deviceId} timed out (no ping for ${timeSinceLastPing}ms)`);
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
    startCleanup() {
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
    stop() {
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
    generateSessionId() {
        return (0, crypto_1.randomBytes)(16).toString('hex');
    }
    /**
     * Generate unique connection ID
     */
    generateConnectionId() {
        return (0, crypto_1.randomBytes)(8).toString('hex');
    }
    /**
     * Log message if verbose mode is enabled
     */
    log(message) {
        if (this.config.verbose) {
            console.log(`[HotReload] ${message}`);
        }
    }
    /**
     * Push schema update to all devices in a session
     * Automatically determines whether to use full or incremental update
     * OPTIMIZED: Batches rapid updates to reduce message overhead
     */
    pushUpdate(sessionId, schema, preserveState = true) {
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
    flushUpdate(sessionId) {
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
        let update;
        let updateType;
        // Calculate delta if we have a previous schema
        if (session.currentSchema) {
            const delta = (0, protocol_serialization_1.calculateSchemaDelta)(session.currentSchema, batch.schema);
            // Decide whether to use incremental or full update
            if ((0, protocol_serialization_1.shouldUseIncrementalUpdate)(delta)) {
                update = (0, protocol_serialization_1.createIncrementalUpdate)(delta, session.sequenceNumber, batch.preserveState);
                updateType = 'incremental';
                this.log(`Incremental update for session ${sessionId}: ` +
                    `${delta.added.length} added, ${delta.modified.length} modified, ` +
                    `${delta.removed.length} removed`);
            }
            else {
                update = (0, protocol_serialization_1.createFullUpdate)(batch.schema, session.sequenceNumber, batch.preserveState);
                updateType = 'full';
                this.log(`Full update for session ${sessionId} (delta too large)`);
            }
        }
        else {
            // First update, always full
            update = (0, protocol_serialization_1.createFullUpdate)(batch.schema, session.sequenceNumber, batch.preserveState);
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
    pushUpdateImmediate(sessionId, schema, preserveState = true) {
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
    broadcastUpdate(session, update) {
        let devicesUpdated = 0;
        const updateMsg = (0, protocol_serialization_1.createUpdateMessage)(session.id, update);
        session.devices.forEach(device => {
            if (device.ws.readyState === ws_1.WebSocket.OPEN) {
                this.sendMessage(device.ws, updateMsg);
                devicesUpdated++;
                this.log(`Sent ${update.type} update (seq ${update.sequenceNumber}) to device ${device.deviceId}`);
            }
        });
        return devicesUpdated;
    }
    /**
     * Push full schema update to a specific device
     * Useful for reconnection scenarios
     */
    pushUpdateToDevice(sessionId, connectionId, schema, preserveState = true) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        const device = session.devices.get(connectionId);
        if (!device) {
            return false;
        }
        if (device.ws.readyState !== ws_1.WebSocket.OPEN) {
            return false;
        }
        // Increment sequence number
        session.sequenceNumber++;
        // Always send full update for individual device
        const update = (0, protocol_serialization_1.createFullUpdate)(schema, session.sequenceNumber, preserveState);
        const updateMsg = (0, protocol_serialization_1.createUpdateMessage)(sessionId, update);
        this.sendMessage(device.ws, updateMsg);
        this.log(`Sent full update (seq ${update.sequenceNumber}) to device ${device.deviceId}`);
        return true;
    }
    /**
     * Calculate delta between two schemas
     * Exposed for testing and external use
     */
    calculateDelta(oldSchema, newSchema) {
        return (0, protocol_serialization_1.calculateSchemaDelta)(oldSchema, newSchema);
    }
    /**
     * Handle update acknowledgment tracking
     * Returns devices that haven't acknowledged the given sequence number
     */
    getUnacknowledgedDevices(sessionId, sequenceNumber) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return [];
        }
        const unacknowledged = [];
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
    getConnectedDevices(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return [];
        }
        return Array.from(session.devices.values());
    }
    /**
     * Get specific device connection
     */
    getDevice(sessionId, connectionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return undefined;
        }
        return session.devices.get(connectionId);
    }
    /**
     * Check if a device is still connected and responsive
     */
    isDeviceHealthy(sessionId, connectionId) {
        const device = this.getDevice(sessionId, connectionId);
        if (!device) {
            return false;
        }
        // Check WebSocket state
        if (device.ws.readyState !== ws_1.WebSocket.OPEN) {
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
    disconnectDevice(sessionId, connectionId, reason) {
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
    extendSession(sessionId, additionalTime) {
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
    getSessionHealth(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        const now = Date.now();
        const devices = Array.from(session.devices.values()).map(device => {
            const timeSinceLastPing = now - device.lastPing;
            const healthy = device.ws.readyState === ws_1.WebSocket.OPEN &&
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
    cleanupStaleConnections() {
        let cleaned = 0;
        const now = Date.now();
        this.sessions.forEach(session => {
            const devicesToRemove = [];
            session.devices.forEach(device => {
                const timeSinceLastPing = now - device.lastPing;
                if (device.ws.readyState !== ws_1.WebSocket.OPEN ||
                    timeSinceLastPing > this.config.connectionTimeout) {
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
    getStats() {
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
exports.HotReloadServer = HotReloadServer;
//# sourceMappingURL=hot-reload-server.js.map