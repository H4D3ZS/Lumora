"use strict";
/**
 * Collaboration Client
 * Client-side collaboration features
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationClient = void 0;
const events_1 = require("events");
const ws_1 = __importDefault(require("ws"));
/**
 * Collaboration Client
 */
class CollaborationClient extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.ws = null;
        this.connected = false;
        this.reconnectTimer = null;
        this.fileVersions = new Map();
        this.config = {
            autoReconnect: true,
            reconnectDelay: 3000,
            ...config,
        };
    }
    /**
     * Connect to collaboration server
     */
    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new ws_1.default(this.config.serverUrl);
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
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(message);
                }
                catch (error) {
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
    disconnect() {
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
    sendFileChange(file, content, changes) {
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
    sendCursorMove(cursor) {
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
    sendChat(message) {
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
    requestSync() {
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
    handleMessage(message) {
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
    send(message) {
        if (this.ws && this.connected && this.ws.readyState === ws_1.default.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
        else {
            console.warn('Not connected to server, message not sent');
        }
    }
    /**
     * Schedule reconnection
     */
    scheduleReconnect() {
        if (this.reconnectTimer)
            return;
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
    isConnected() {
        return this.connected;
    }
}
exports.CollaborationClient = CollaborationClient;
//# sourceMappingURL=collaboration-client.js.map