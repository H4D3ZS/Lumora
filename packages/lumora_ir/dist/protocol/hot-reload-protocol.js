"use strict";
/**
 * Hot Reload Protocol
 * WebSocket-based protocol for real-time schema updates between dev server and devices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolErrorCode = exports.PROTOCOL_VERSION = void 0;
exports.isConnectMessage = isConnectMessage;
exports.isConnectedMessage = isConnectedMessage;
exports.isUpdateMessage = isUpdateMessage;
exports.isReloadMessage = isReloadMessage;
exports.isErrorMessage = isErrorMessage;
exports.isPingMessage = isPingMessage;
exports.isPongMessage = isPongMessage;
exports.isAckMessage = isAckMessage;
/**
 * Protocol version for compatibility checking
 */
exports.PROTOCOL_VERSION = '1.0.0';
/**
 * Type guard for message types
 */
function isConnectMessage(msg) {
    return msg.type === 'connect';
}
function isConnectedMessage(msg) {
    return msg.type === 'connected';
}
function isUpdateMessage(msg) {
    return msg.type === 'update';
}
function isReloadMessage(msg) {
    return msg.type === 'reload';
}
function isErrorMessage(msg) {
    return msg.type === 'error';
}
function isPingMessage(msg) {
    return msg.type === 'ping';
}
function isPongMessage(msg) {
    return msg.type === 'pong';
}
function isAckMessage(msg) {
    return msg.type === 'ack';
}
/**
 * Error codes for protocol errors
 */
var ProtocolErrorCode;
(function (ProtocolErrorCode) {
    ProtocolErrorCode["INVALID_MESSAGE"] = "INVALID_MESSAGE";
    ProtocolErrorCode["UNSUPPORTED_VERSION"] = "UNSUPPORTED_VERSION";
    ProtocolErrorCode["SESSION_NOT_FOUND"] = "SESSION_NOT_FOUND";
    ProtocolErrorCode["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    ProtocolErrorCode["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    ProtocolErrorCode["SCHEMA_VALIDATION_FAILED"] = "SCHEMA_VALIDATION_FAILED";
    ProtocolErrorCode["UPDATE_FAILED"] = "UPDATE_FAILED";
    ProtocolErrorCode["CHECKSUM_MISMATCH"] = "CHECKSUM_MISMATCH";
    ProtocolErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ProtocolErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ProtocolErrorCode || (exports.ProtocolErrorCode = ProtocolErrorCode = {}));
