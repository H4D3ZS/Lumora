/**
 * Hot Reload Protocol Module
 * Exports all protocol types and utilities
 */

export {
  // Protocol version
  PROTOCOL_VERSION,
  
  // Message types
  type MessageType,
  type HotReloadMessage,
  type ConnectMessage,
  type ConnectedMessage,
  type UpdateMessage,
  type SchemaUpdate,
  type SchemaDelta,
  type ReloadMessage,
  type ErrorMessage,
  type PingMessage,
  type PongMessage,
  type AckMessage,
  
  // Type guards
  isConnectMessage,
  isConnectedMessage,
  isUpdateMessage,
  isReloadMessage,
  isErrorMessage,
  isPingMessage,
  isPongMessage,
  isAckMessage,
  
  // Error codes
  ProtocolErrorCode,
} from './hot-reload-protocol';

export {
  // Serialization utilities
  serializeMessage,
  deserializeMessage,
  validateMessage,
  
  // Message builders
  createConnectMessage,
  createConnectedMessage,
  createUpdateMessage,
  createReloadMessage,
  createErrorMessage,
  createPingMessage,
  createPongMessage,
  createAckMessage,
  
  // Validation
  type ValidationResult,
  validateProtocolVersion,
  validateSessionId,
  validateChecksum,
} from './protocol-serialization';
