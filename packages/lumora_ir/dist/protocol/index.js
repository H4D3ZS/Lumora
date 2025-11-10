"use strict";
/**
 * Hot Reload Protocol Module
 * Exports all protocol types and utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChecksum = exports.validateSessionId = exports.validateProtocolVersion = exports.createAckMessage = exports.createPongMessage = exports.createPingMessage = exports.createErrorMessage = exports.createReloadMessage = exports.createUpdateMessage = exports.createConnectedMessage = exports.createConnectMessage = exports.validateMessage = exports.deserializeMessage = exports.serializeMessage = exports.ProtocolErrorCode = exports.isAckMessage = exports.isPongMessage = exports.isPingMessage = exports.isErrorMessage = exports.isReloadMessage = exports.isUpdateMessage = exports.isConnectedMessage = exports.isConnectMessage = exports.PROTOCOL_VERSION = void 0;
var hot_reload_protocol_1 = require("./hot-reload-protocol");
// Protocol version
Object.defineProperty(exports, "PROTOCOL_VERSION", { enumerable: true, get: function () { return hot_reload_protocol_1.PROTOCOL_VERSION; } });
// Type guards
Object.defineProperty(exports, "isConnectMessage", { enumerable: true, get: function () { return hot_reload_protocol_1.isConnectMessage; } });
Object.defineProperty(exports, "isConnectedMessage", { enumerable: true, get: function () { return hot_reload_protocol_1.isConnectedMessage; } });
Object.defineProperty(exports, "isUpdateMessage", { enumerable: true, get: function () { return hot_reload_protocol_1.isUpdateMessage; } });
Object.defineProperty(exports, "isReloadMessage", { enumerable: true, get: function () { return hot_reload_protocol_1.isReloadMessage; } });
Object.defineProperty(exports, "isErrorMessage", { enumerable: true, get: function () { return hot_reload_protocol_1.isErrorMessage; } });
Object.defineProperty(exports, "isPingMessage", { enumerable: true, get: function () { return hot_reload_protocol_1.isPingMessage; } });
Object.defineProperty(exports, "isPongMessage", { enumerable: true, get: function () { return hot_reload_protocol_1.isPongMessage; } });
Object.defineProperty(exports, "isAckMessage", { enumerable: true, get: function () { return hot_reload_protocol_1.isAckMessage; } });
// Error codes
Object.defineProperty(exports, "ProtocolErrorCode", { enumerable: true, get: function () { return hot_reload_protocol_1.ProtocolErrorCode; } });
var protocol_serialization_1 = require("./protocol-serialization");
// Serialization utilities
Object.defineProperty(exports, "serializeMessage", { enumerable: true, get: function () { return protocol_serialization_1.serializeMessage; } });
Object.defineProperty(exports, "deserializeMessage", { enumerable: true, get: function () { return protocol_serialization_1.deserializeMessage; } });
Object.defineProperty(exports, "validateMessage", { enumerable: true, get: function () { return protocol_serialization_1.validateMessage; } });
// Message builders
Object.defineProperty(exports, "createConnectMessage", { enumerable: true, get: function () { return protocol_serialization_1.createConnectMessage; } });
Object.defineProperty(exports, "createConnectedMessage", { enumerable: true, get: function () { return protocol_serialization_1.createConnectedMessage; } });
Object.defineProperty(exports, "createUpdateMessage", { enumerable: true, get: function () { return protocol_serialization_1.createUpdateMessage; } });
Object.defineProperty(exports, "createReloadMessage", { enumerable: true, get: function () { return protocol_serialization_1.createReloadMessage; } });
Object.defineProperty(exports, "createErrorMessage", { enumerable: true, get: function () { return protocol_serialization_1.createErrorMessage; } });
Object.defineProperty(exports, "createPingMessage", { enumerable: true, get: function () { return protocol_serialization_1.createPingMessage; } });
Object.defineProperty(exports, "createPongMessage", { enumerable: true, get: function () { return protocol_serialization_1.createPongMessage; } });
Object.defineProperty(exports, "createAckMessage", { enumerable: true, get: function () { return protocol_serialization_1.createAckMessage; } });
Object.defineProperty(exports, "validateProtocolVersion", { enumerable: true, get: function () { return protocol_serialization_1.validateProtocolVersion; } });
Object.defineProperty(exports, "validateSessionId", { enumerable: true, get: function () { return protocol_serialization_1.validateSessionId; } });
Object.defineProperty(exports, "validateChecksum", { enumerable: true, get: function () { return protocol_serialization_1.validateChecksum; } });
