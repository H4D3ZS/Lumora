/**
 * Lumora IR - Intermediate Representation System
 * Framework-agnostic representation for UI components
 */

// Types
export * from './types/ir-types';
export { TypeMapper, getTypeMapper, type TypeMapping, type GenericType } from './types/type-mapper';
export { 
  InterfaceConverter, 
  getInterfaceConverter,
  type TypeScriptInterface,
  type TypeScriptProperty,
  type TypeScriptMethod,
  type TypeScriptParameter,
  type DartClass,
  type DartProperty,
  type DartMethod,
  type DartParameter,
  type DartConstructor
} from './types/interface-converter';

// Validator
export { IRValidator, getValidator } from './validator/ir-validator';

// Storage
export { IRStorage } from './storage/ir-storage';

// Migration
export { IRMigrator, getMigrator } from './migration/ir-migrator';

// Widget Mapping Registry
export { 
  WidgetMappingRegistry, 
  getRegistry, 
  resetRegistry,
  type WidgetMapping,
  type PropMapping,
  type StyleMapping,
  type EventMapping,
  type FrameworkMapping,
  type WidgetMappings
} from './registry/widget-mapping-registry';

// Utility functions
export { createIR, createNode } from './utils/ir-utils';

// Sync Engine
export { 
  FileWatcher, 
  type FileWatcherConfig, 
  type FileChangeEvent 
} from './sync/file-watcher';

export { 
  ChangeQueue, 
  type ChangeQueueConfig, 
  type QueuedChange,
  ChangePriority 
} from './sync/change-queue';

export { 
  SyncEngine, 
  type SyncConfig, 
  type SyncResult,
  type ConverterFunction,
  type GeneratorFunction
} from './sync/sync-engine';

export {
  TestSyncHandler,
  type TestSyncConfig,
  type TestConversionResult
} from './sync/test-sync-handler';

export { 
  ConflictDetector, 
  type ConflictDetectorConfig, 
  type ConflictRecord,
  type ConflictDetectionResult
} from './sync/conflict-detector';

export { 
  SyncStatusTracker, 
  SyncStatus,
  type SyncOperation,
  type SyncStatistics,
  type StatusUpdateEvent
} from './sync/sync-status';

export { 
  BidirectionalSync, 
  type BidirectionalSyncConfig 
} from './sync/bidirectional-sync';

// Conflict Resolution
export {
  ConflictNotifier,
  NotificationChannel,
  type ConflictNotification,
  type NotificationHandler
} from './sync/conflict-notifier';

export {
  ConflictResolverUI,
  ResolutionOption,
  type ResolutionChoice,
  type DiffViewData
} from './sync/conflict-resolver-ui';

export {
  ConflictResolver,
  type ResolutionResult,
  type ResolverConverters
} from './sync/conflict-resolver';

// Asset Management
export {
  AssetManager,
  type AssetReference,
  type AssetSyncOptions
} from './assets/asset-manager';

export {
  AssetPathConverter,
  type PathConversionOptions
} from './assets/asset-path-converter';

export {
  ConfigUpdater,
  type AssetConfig,
  type FontConfig,
  type FontFile
} from './assets/config-updater';

// Configuration
export {
  ModeConfig,
  DevelopmentMode,
  loadModeConfig,
  initModeConfig,
  type LumoraConfig,
  type NamingConventions,
  type FormattingPreferences,
  type SyncSettings,
  type ConversionSettings,
  type ValidationSettings
} from './config/mode-config';

export {
  loadAndApplyConfig,
  initConfigWithMappings,
  reloadConfig
} from './config/config-loader';

// Utilities
export {
  applyFileNaming,
  applyIdentifierNaming,
  applyComponentNaming,
  generateFileName,
  generateClassName,
  generateIdentifierName,
  convertNamingConvention
} from './utils/naming-utils';

export {
  formatTypeScriptCode,
  formatDartCode,
  getIndentString,
  formatCodeBlock,
  applyTrailingComma,
  formatImports
} from './utils/formatting-utils';

// Mode-Aware Sync
export {
  ModeAwareWatcher,
  createModeAwareWatcher,
  type ModeAwareWatcherConfig
} from './sync/mode-aware-watcher';

export {
  ModeAwareSync,
  createModeAwareSync,
  type ModeAwareSyncConfig
} from './sync/mode-aware-sync';

// Cache
export {
  ConversionCache,
  getConversionCache,
  resetConversionCache,
  type ASTCacheEntry,
  type IRCacheEntry,
  type CacheStats,
  type CacheConfig
} from './cache/conversion-cache';

// Parallel Processing
export {
  ParallelProcessor,
  getParallelProcessor,
  resetParallelProcessor,
  type ProcessTask,
  type TaskResult,
  type WorkerPoolConfig
} from './workers/parallel-processor';

// Progress Tracking
export {
  ProgressTracker,
  getProgressTracker,
  resetProgressTracker,
  CLIProgressDisplay,
  type ProgressUpdate,
  type ProgressHandler
} from './progress/progress-tracker';

// Error Handling and Recovery
export {
  ErrorHandler,
  getErrorHandler,
  ErrorSeverity,
  ErrorCategory,
  type SourceLocation,
  type ErrorSuggestion,
  type LumoraError,
  type ParseErrorDetails
} from './errors/error-handler';

export {
  ConversionErrorHandler,
  getConversionErrorHandler,
  ConversionFailureReason,
  type ConversionErrorDetails,
  type AlternativeApproach
} from './errors/conversion-error-handler';

export {
  FallbackHandler,
  getFallbackHandler,
  FallbackStrategy,
  type FallbackResult,
  type UnmappedWidgetRecord
} from './errors/fallback-handler';

export {
  PartialConversionHandler,
  getPartialConversionHandler,
  ConversionIssueSeverity,
  type ConversionIssue,
  type PartialConversionResult,
  type TodoMarkerConfig
} from './errors/partial-conversion-handler';

export {
  FileBackupHandler,
  getFileBackupHandler,
  BackupStrategy,
  type BackupConfig,
  type BackupRecord
} from './errors/file-backup-handler';

// Documentation Conversion
export {
  parseJSDoc,
  parseDartdoc,
  jsdocToDartdoc,
  dartdocToJSDoc,
  extractInlineComments,
  type DocComment
} from './docs/doc-converter';

// Testing Support
export {
  TestConverter,
  type TestFile,
  type TestSuite,
  type TestCase,
  type TestAssertion,
  type MockDefinition as TestMockDefinition,
  type MockMethod as TestMockMethod
} from './testing/test-converter';

export {
  MockConverter,
  type MockDefinition,
  type MockMethod,
  type MockParameter,
  type MockProperty
} from './testing/mock-converter';

// Hot Reload Protocol
export {
  PROTOCOL_VERSION,
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
  isConnectMessage,
  isConnectedMessage,
  isUpdateMessage,
  isReloadMessage,
  isErrorMessage,
  isPingMessage,
  isPongMessage,
  isAckMessage,
  ProtocolErrorCode,
  serializeMessage,
  deserializeMessage,
  validateMessage,
  createConnectMessage,
  createConnectedMessage,
  createUpdateMessage,
  createReloadMessage,
  createErrorMessage,
  createPingMessage,
  createPongMessage,
  createAckMessage,
  type ValidationResult,
  validateProtocolVersion,
  validateSessionId,
  validateChecksum
} from './protocol';

// Bundler
export {
  SchemaBundler,
  getBundler,
  resetBundler,
  type BundleConfig,
  type Bundle,
  type BundleManifest,
  type SchemaReference,
  type BundleMetadata,
  BundleOptimizer,
  getOptimizer,
  resetOptimizer,
  type OptimizationOptions,
  type OptimizationResult,
  ManifestGenerator,
  getManifestGenerator,
  resetManifestGenerator,
  type ManifestConfig,
  type ManifestMetadata,
  type DependencyInfo,
  BundleValidator,
  getBundleValidator,
  resetBundleValidator,
  type ValidationOptions,
  type ValidationResult as BundleValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ValidationSummary,
} from './bundler';

// Parsers
export {
  ReactParser,
  getReactParser,
  resetReactParser,
  type ReactParserConfig,
  type ComponentInfo,
  type HookInfo,
} from './parsers';
