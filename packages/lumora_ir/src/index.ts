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
  type LumoraConfig
} from './config/mode-config';

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
