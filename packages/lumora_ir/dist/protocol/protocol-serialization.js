"use strict";
/**
 * Protocol Serialization and Validation
 * Handles message serialization, deserialization, and validation
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMessage = serializeMessage;
exports.deserializeMessage = deserializeMessage;
exports.validateMessage = validateMessage;
exports.validateProtocolVersion = validateProtocolVersion;
exports.validateSessionId = validateSessionId;
exports.calculateChecksum = calculateChecksum;
exports.validateChecksum = validateChecksum;
exports.createConnectMessage = createConnectMessage;
exports.createConnectedMessage = createConnectedMessage;
exports.createUpdateMessage = createUpdateMessage;
exports.createFullUpdate = createFullUpdate;
exports.createIncrementalUpdate = createIncrementalUpdate;
exports.createReloadMessage = createReloadMessage;
exports.createErrorMessage = createErrorMessage;
exports.createPingMessage = createPingMessage;
exports.createPongMessage = createPongMessage;
exports.createAckMessage = createAckMessage;
exports.calculateSchemaDelta = calculateSchemaDelta;
exports.shouldUseIncrementalUpdate = shouldUseIncrementalUpdate;
const crypto = __importStar(require("crypto"));
const hot_reload_protocol_1 = require("./hot-reload-protocol");
/**
 * Serialize a protocol message to JSON string
 */
function serializeMessage(message, options = {}) {
    if (options.validate) {
        const validation = validateMessage(message);
        if (!validation.valid) {
            throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
        }
    }
    return JSON.stringify(message, null, options.pretty ? 2 : 0);
}
/**
 * Deserialize a JSON string to protocol message
 */
function deserializeMessage(data, options = {}) {
    try {
        const json = typeof data === 'string' ? data : data.toString('utf-8');
        const message = JSON.parse(json);
        if (options.validate) {
            const validation = validateMessage(message);
            if (!validation.valid) {
                throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
            }
        }
        return message;
    }
    catch (error) {
        throw new Error(`Failed to deserialize message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Validate a protocol message
 */
function validateMessage(message) {
    const errors = [];
    // Check required base fields
    if (!message || typeof message !== 'object') {
        errors.push('Message must be an object');
        return { valid: false, errors };
    }
    if (!message.type || typeof message.type !== 'string') {
        errors.push('Message must have a type field');
    }
    if (!message.sessionId || typeof message.sessionId !== 'string') {
        errors.push('Message must have a sessionId field');
    }
    if (typeof message.timestamp !== 'number') {
        errors.push('Message must have a timestamp field');
    }
    if (!message.version || typeof message.version !== 'string') {
        errors.push('Message must have a version field');
    }
    // Validate message type
    const validTypes = [
        'connect', 'connected', 'update', 'reload', 'error', 'ping', 'pong', 'ack'
    ];
    if (!validTypes.includes(message.type)) {
        errors.push(`Invalid message type: ${message.type}`);
    }
    // Type-specific validation
    switch (message.type) {
        case 'connect':
            validateConnectMessage(message, errors);
            break;
        case 'connected':
            validateConnectedMessage(message, errors);
            break;
        case 'update':
            validateUpdateMessage(message, errors);
            break;
        case 'reload':
            validateReloadMessage(message, errors);
            break;
        case 'error':
            validateErrorMessage(message, errors);
            break;
        case 'ack':
            validateAckMessage(message, errors);
            break;
        // ping and pong have no required payload fields
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function validateConnectMessage(message, errors) {
    if (!message.payload) {
        errors.push('Connect message must have payload');
        return;
    }
    const { payload } = message;
    if (!payload.deviceId || typeof payload.deviceId !== 'string') {
        errors.push('Connect payload must have deviceId');
    }
    if (!payload.platform || typeof payload.platform !== 'string') {
        errors.push('Connect payload must have platform');
    }
    if (!payload.clientVersion || typeof payload.clientVersion !== 'string') {
        errors.push('Connect payload must have clientVersion');
    }
}
function validateConnectedMessage(message, errors) {
    if (!message.payload) {
        errors.push('Connected message must have payload');
        return;
    }
    const { payload } = message;
    if (!payload.connectionId || typeof payload.connectionId !== 'string') {
        errors.push('Connected payload must have connectionId');
    }
    if (!payload.capabilities || typeof payload.capabilities !== 'object') {
        errors.push('Connected payload must have capabilities');
    }
}
function validateUpdateMessage(message, errors) {
    if (!message.payload) {
        errors.push('Update message must have payload');
        return;
    }
    const { payload } = message;
    if (!payload.type || !['full', 'incremental'].includes(payload.type)) {
        errors.push('Update payload must have type (full or incremental)');
    }
    if (payload.type === 'full' && !payload.schema) {
        errors.push('Full update must have schema');
    }
    if (payload.type === 'incremental' && !payload.delta) {
        errors.push('Incremental update must have delta');
    }
    if (typeof payload.preserveState !== 'boolean') {
        errors.push('Update payload must have preserveState boolean');
    }
    if (typeof payload.sequenceNumber !== 'number') {
        errors.push('Update payload must have sequenceNumber');
    }
}
function validateReloadMessage(message, errors) {
    if (!message.payload) {
        errors.push('Reload message must have payload');
        return;
    }
    const { payload } = message;
    if (!payload.reason || !['error', 'manual', 'incompatible'].includes(payload.reason)) {
        errors.push('Reload payload must have reason (error, manual, or incompatible)');
    }
}
function validateErrorMessage(message, errors) {
    if (!message.payload) {
        errors.push('Error message must have payload');
        return;
    }
    const { payload } = message;
    if (!payload.code || typeof payload.code !== 'string') {
        errors.push('Error payload must have code');
    }
    if (!payload.message || typeof payload.message !== 'string') {
        errors.push('Error payload must have message');
    }
    if (!payload.severity || !['warning', 'error', 'fatal'].includes(payload.severity)) {
        errors.push('Error payload must have severity (warning, error, or fatal)');
    }
    if (typeof payload.recoverable !== 'boolean') {
        errors.push('Error payload must have recoverable boolean');
    }
}
function validateAckMessage(message, errors) {
    if (!message.payload) {
        errors.push('Ack message must have payload');
        return;
    }
    const { payload } = message;
    if (typeof payload.sequenceNumber !== 'number') {
        errors.push('Ack payload must have sequenceNumber');
    }
    if (typeof payload.success !== 'boolean') {
        errors.push('Ack payload must have success boolean');
    }
}
/**
 * Validate protocol version compatibility
 */
function validateProtocolVersion(clientVersion, serverVersion = hot_reload_protocol_1.PROTOCOL_VERSION) {
    const errors = [];
    const parseVersion = (version) => {
        const parts = version.split('.').map(Number);
        return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    };
    const [clientMajor, clientMinor] = parseVersion(clientVersion);
    const [serverMajor, serverMinor] = parseVersion(serverVersion);
    // Major version must match
    if (clientMajor !== serverMajor) {
        errors.push(`Incompatible protocol versions: client ${clientVersion}, server ${serverVersion}`);
    }
    // Warn if minor version differs
    if (clientMinor !== serverMinor) {
        errors.push(`Protocol minor version mismatch: client ${clientVersion}, server ${serverVersion} (may have limited features)`);
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Validate session ID format
 */
function validateSessionId(sessionId) {
    const errors = [];
    // Session ID should be a valid UUID v4 or similar format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!sessionId || typeof sessionId !== 'string') {
        errors.push('Session ID must be a string');
    }
    else if (sessionId.length < 8) {
        errors.push('Session ID too short');
    }
    else if (sessionId.length > 128) {
        errors.push('Session ID too long');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Calculate checksum for schema
 * Excludes timestamp to ensure consistent checksums for same content
 */
function calculateChecksum(schema) {
    // Deep clone and normalize timestamp for consistent checksums
    const schemaForChecksum = JSON.parse(JSON.stringify(schema));
    schemaForChecksum.metadata.generatedAt = 0;
    // Stringify with sorted keys for consistent ordering
    const json = JSON.stringify(schemaForChecksum, (key, value) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.keys(value)
                .sort()
                .reduce((sorted, key) => {
                sorted[key] = value[key];
                return sorted;
            }, {});
        }
        return value;
    });
    return crypto.createHash('sha256').update(json).digest('hex');
}
/**
 * Validate schema checksum
 */
function validateChecksum(schema, expectedChecksum) {
    const errors = [];
    const actualChecksum = calculateChecksum(schema);
    if (actualChecksum !== expectedChecksum) {
        errors.push(`Checksum mismatch: expected ${expectedChecksum}, got ${actualChecksum}`);
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Message builder utilities
 */
function createConnectMessage(sessionId, deviceId, platform, deviceName) {
    return {
        type: 'connect',
        sessionId,
        timestamp: Date.now(),
        version: hot_reload_protocol_1.PROTOCOL_VERSION,
        payload: {
            deviceId,
            platform,
            deviceName,
            clientVersion: hot_reload_protocol_1.PROTOCOL_VERSION,
        },
    };
}
function createConnectedMessage(sessionId, connectionId, initialSchema) {
    return {
        type: 'connected',
        sessionId,
        timestamp: Date.now(),
        version: hot_reload_protocol_1.PROTOCOL_VERSION,
        payload: {
            connectionId,
            initialSchema,
            capabilities: {
                incrementalUpdates: true,
                compression: false,
                statePreservation: true,
            },
        },
    };
}
function createUpdateMessage(sessionId, update) {
    return {
        type: 'update',
        sessionId,
        timestamp: Date.now(),
        version: hot_reload_protocol_1.PROTOCOL_VERSION,
        payload: update,
    };
}
function createFullUpdate(schema, sequenceNumber, preserveState = true) {
    return {
        type: 'full',
        schema,
        preserveState,
        sequenceNumber,
        checksum: calculateChecksum(schema),
    };
}
function createIncrementalUpdate(delta, sequenceNumber, preserveState = true) {
    return {
        type: 'incremental',
        delta,
        preserveState,
        sequenceNumber,
    };
}
function createReloadMessage(sessionId, reason, error) {
    return {
        type: 'reload',
        sessionId,
        timestamp: Date.now(),
        version: hot_reload_protocol_1.PROTOCOL_VERSION,
        payload: {
            reason,
            error,
        },
    };
}
function createErrorMessage(sessionId, code, message, severity, recoverable, details) {
    return {
        type: 'error',
        sessionId,
        timestamp: Date.now(),
        version: hot_reload_protocol_1.PROTOCOL_VERSION,
        payload: {
            code,
            message,
            severity,
            details,
            recoverable,
        },
    };
}
function createPingMessage(sessionId, status) {
    return {
        type: 'ping',
        sessionId,
        timestamp: Date.now(),
        version: hot_reload_protocol_1.PROTOCOL_VERSION,
        payload: status ? { status } : undefined,
    };
}
function createPongMessage(sessionId) {
    return {
        type: 'pong',
        sessionId,
        timestamp: Date.now(),
        version: hot_reload_protocol_1.PROTOCOL_VERSION,
        payload: {
            serverTime: Date.now(),
        },
    };
}
function createAckMessage(sessionId, sequenceNumber, success, error, applyTime) {
    return {
        type: 'ack',
        sessionId,
        timestamp: Date.now(),
        version: hot_reload_protocol_1.PROTOCOL_VERSION,
        payload: {
            sequenceNumber,
            success,
            error,
            applyTime,
        },
    };
}
/**
 * Calculate delta between two schemas
 */
function calculateSchemaDelta(oldSchema, newSchema) {
    const oldNodes = new Map(oldSchema.nodes.map(n => [n.id, n]));
    const newNodes = new Map(newSchema.nodes.map(n => [n.id, n]));
    const added = [];
    const modified = [];
    const removed = [];
    // Find added and modified nodes
    newNodes.forEach((node, id) => {
        const oldNode = oldNodes.get(id);
        if (!oldNode) {
            added.push(node);
        }
        else if (JSON.stringify(oldNode) !== JSON.stringify(node)) {
            modified.push(node);
        }
    });
    // Find removed nodes
    oldNodes.forEach((node, id) => {
        if (!newNodes.has(id)) {
            removed.push(id);
        }
    });
    // Check for metadata changes
    const metadataChanges = {};
    let hasMetadataChanges = false;
    if (oldSchema.version !== newSchema.version) {
        metadataChanges.version = newSchema.version;
        hasMetadataChanges = true;
    }
    if (JSON.stringify(oldSchema.theme) !== JSON.stringify(newSchema.theme)) {
        metadataChanges.theme = newSchema.theme;
        hasMetadataChanges = true;
    }
    if (JSON.stringify(oldSchema.navigation) !== JSON.stringify(newSchema.navigation)) {
        metadataChanges.navigation = newSchema.navigation;
        hasMetadataChanges = true;
    }
    return {
        added,
        modified,
        removed,
        metadataChanges: hasMetadataChanges ? metadataChanges : undefined,
    };
}
/**
 * Determine if incremental update is more efficient than full update
 */
function shouldUseIncrementalUpdate(delta, threshold = 10) {
    const totalChanges = delta.added.length + delta.modified.length + delta.removed.length;
    return totalChanges < threshold && totalChanges > 0;
}
