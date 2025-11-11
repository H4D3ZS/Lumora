"use strict";
/**
 * Lumora IR - Intermediate Representation System
 * Framework-agnostic representation for UI components
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIdentifierName = exports.generateClassName = exports.generateFileName = exports.applyComponentNaming = exports.applyIdentifierNaming = exports.applyFileNaming = exports.reloadConfig = exports.initConfigWithMappings = exports.loadAndApplyConfig = exports.initModeConfig = exports.loadModeConfig = exports.DevelopmentMode = exports.ModeConfig = exports.ConfigUpdater = exports.AssetPathConverter = exports.AssetManager = exports.ConflictResolver = exports.ResolutionOption = exports.ConflictResolverUI = exports.NotificationChannel = exports.ConflictNotifier = exports.BidirectionalSync = exports.SyncStatus = exports.SyncStatusTracker = exports.ConflictDetector = exports.TestSyncHandler = exports.SyncEngine = exports.ChangePriority = exports.ChangeQueue = exports.FileWatcher = exports.createNode = exports.createIR = exports.resetPackageManager = exports.getPackageManager = exports.PackageManager = exports.resetPluginRegistry = exports.getPluginRegistry = exports.PluginRegistry = exports.resetRegistry = exports.getRegistry = exports.WidgetMappingRegistry = exports.getMigrator = exports.IRMigrator = exports.IRStorage = exports.getValidator = exports.IRValidator = exports.getInterfaceConverter = exports.InterfaceConverter = exports.getTypeMapper = exports.TypeMapper = void 0;
exports.isErrorMessage = exports.isReloadMessage = exports.isUpdateMessage = exports.isConnectedMessage = exports.isConnectMessage = exports.PROTOCOL_VERSION = exports.MockConverter = exports.TestConverter = exports.extractInlineComments = exports.dartdocToJSDoc = exports.jsdocToDartdoc = exports.parseDartdoc = exports.parseJSDoc = exports.BackupStrategy = exports.getFileBackupHandler = exports.FileBackupHandler = exports.ConversionIssueSeverity = exports.getPartialConversionHandler = exports.PartialConversionHandler = exports.FallbackStrategy = exports.getFallbackHandler = exports.FallbackHandler = exports.ConversionFailureReason = exports.getConversionErrorHandler = exports.ConversionErrorHandler = exports.ErrorCategory = exports.ErrorSeverity = exports.getErrorHandler = exports.ErrorHandler = exports.CLIProgressDisplay = exports.resetProgressTracker = exports.getProgressTracker = exports.ProgressTracker = exports.resetParallelProcessor = exports.getParallelProcessor = exports.ParallelProcessor = exports.resetConversionCache = exports.getConversionCache = exports.ConversionCache = exports.createModeAwareSync = exports.ModeAwareSync = exports.createModeAwareWatcher = exports.ModeAwareWatcher = exports.formatImports = exports.applyTrailingComma = exports.formatCodeBlock = exports.getIndentString = exports.formatDartCode = exports.formatTypeScriptCode = exports.convertNamingConvention = void 0;
exports.getAdapter = exports.ProviderAdapter = exports.RiverpodAdapter = exports.BlocAdapter = exports.BaseStateAdapter = exports.StateBridge = exports.createPlatformGenerator = exports.PlatformCodeGenerator = exports.DartPlatformGenerator = exports.ReactPlatformGenerator = exports.DartPlatformParser = exports.ReactPlatformParser = exports.resetReactParser = exports.getReactParser = exports.ReactParser = exports.resetBundleValidator = exports.getBundleValidator = exports.BundleValidator = exports.resetManifestGenerator = exports.getManifestGenerator = exports.ManifestGenerator = exports.resetOptimizer = exports.getOptimizer = exports.BundleOptimizer = exports.resetBundler = exports.getBundler = exports.SchemaBundler = exports.calculateChecksum = exports.validateChecksum = exports.validateSessionId = exports.validateProtocolVersion = exports.shouldUseIncrementalUpdate = exports.calculateSchemaDelta = exports.createAckMessage = exports.createPongMessage = exports.createPingMessage = exports.createErrorMessage = exports.createReloadMessage = exports.createIncrementalUpdate = exports.createFullUpdate = exports.createUpdateMessage = exports.createConnectedMessage = exports.createConnectMessage = exports.validateMessage = exports.deserializeMessage = exports.serializeMessage = exports.ProtocolErrorCode = exports.isAckMessage = exports.isPongMessage = exports.isPingMessage = void 0;
exports.RouteParser = exports.isValidAdapterType = exports.getAllAdapters = void 0;
// Types
__exportStar(require("./types/ir-types"), exports);
__exportStar(require("./types/animation-types"), exports);
__exportStar(require("./types/network-types"), exports);
__exportStar(require("./types/platform-types"), exports);
var type_mapper_1 = require("./types/type-mapper");
Object.defineProperty(exports, "TypeMapper", { enumerable: true, get: function () { return type_mapper_1.TypeMapper; } });
Object.defineProperty(exports, "getTypeMapper", { enumerable: true, get: function () { return type_mapper_1.getTypeMapper; } });
var interface_converter_1 = require("./types/interface-converter");
Object.defineProperty(exports, "InterfaceConverter", { enumerable: true, get: function () { return interface_converter_1.InterfaceConverter; } });
Object.defineProperty(exports, "getInterfaceConverter", { enumerable: true, get: function () { return interface_converter_1.getInterfaceConverter; } });
// Validator
var ir_validator_1 = require("./validator/ir-validator");
Object.defineProperty(exports, "IRValidator", { enumerable: true, get: function () { return ir_validator_1.IRValidator; } });
Object.defineProperty(exports, "getValidator", { enumerable: true, get: function () { return ir_validator_1.getValidator; } });
// Storage
var ir_storage_1 = require("./storage/ir-storage");
Object.defineProperty(exports, "IRStorage", { enumerable: true, get: function () { return ir_storage_1.IRStorage; } });
// Migration
var ir_migrator_1 = require("./migration/ir-migrator");
Object.defineProperty(exports, "IRMigrator", { enumerable: true, get: function () { return ir_migrator_1.IRMigrator; } });
Object.defineProperty(exports, "getMigrator", { enumerable: true, get: function () { return ir_migrator_1.getMigrator; } });
// Widget Mapping Registry
var widget_mapping_registry_1 = require("./registry/widget-mapping-registry");
Object.defineProperty(exports, "WidgetMappingRegistry", { enumerable: true, get: function () { return widget_mapping_registry_1.WidgetMappingRegistry; } });
Object.defineProperty(exports, "getRegistry", { enumerable: true, get: function () { return widget_mapping_registry_1.getRegistry; } });
Object.defineProperty(exports, "resetRegistry", { enumerable: true, get: function () { return widget_mapping_registry_1.resetRegistry; } });
// Plugin Registry
var plugin_registry_1 = require("./registry/plugin-registry");
Object.defineProperty(exports, "PluginRegistry", { enumerable: true, get: function () { return plugin_registry_1.PluginRegistry; } });
Object.defineProperty(exports, "getPluginRegistry", { enumerable: true, get: function () { return plugin_registry_1.getPluginRegistry; } });
Object.defineProperty(exports, "resetPluginRegistry", { enumerable: true, get: function () { return plugin_registry_1.resetPluginRegistry; } });
// Package Manager
var package_manager_1 = require("./registry/package-manager");
Object.defineProperty(exports, "PackageManager", { enumerable: true, get: function () { return package_manager_1.PackageManager; } });
Object.defineProperty(exports, "getPackageManager", { enumerable: true, get: function () { return package_manager_1.getPackageManager; } });
Object.defineProperty(exports, "resetPackageManager", { enumerable: true, get: function () { return package_manager_1.resetPackageManager; } });
// Utility functions
var ir_utils_1 = require("./utils/ir-utils");
Object.defineProperty(exports, "createIR", { enumerable: true, get: function () { return ir_utils_1.createIR; } });
Object.defineProperty(exports, "createNode", { enumerable: true, get: function () { return ir_utils_1.createNode; } });
// Sync Engine
var file_watcher_1 = require("./sync/file-watcher");
Object.defineProperty(exports, "FileWatcher", { enumerable: true, get: function () { return file_watcher_1.FileWatcher; } });
var change_queue_1 = require("./sync/change-queue");
Object.defineProperty(exports, "ChangeQueue", { enumerable: true, get: function () { return change_queue_1.ChangeQueue; } });
Object.defineProperty(exports, "ChangePriority", { enumerable: true, get: function () { return change_queue_1.ChangePriority; } });
var sync_engine_1 = require("./sync/sync-engine");
Object.defineProperty(exports, "SyncEngine", { enumerable: true, get: function () { return sync_engine_1.SyncEngine; } });
var test_sync_handler_1 = require("./sync/test-sync-handler");
Object.defineProperty(exports, "TestSyncHandler", { enumerable: true, get: function () { return test_sync_handler_1.TestSyncHandler; } });
var conflict_detector_1 = require("./sync/conflict-detector");
Object.defineProperty(exports, "ConflictDetector", { enumerable: true, get: function () { return conflict_detector_1.ConflictDetector; } });
var sync_status_1 = require("./sync/sync-status");
Object.defineProperty(exports, "SyncStatusTracker", { enumerable: true, get: function () { return sync_status_1.SyncStatusTracker; } });
Object.defineProperty(exports, "SyncStatus", { enumerable: true, get: function () { return sync_status_1.SyncStatus; } });
var bidirectional_sync_1 = require("./sync/bidirectional-sync");
Object.defineProperty(exports, "BidirectionalSync", { enumerable: true, get: function () { return bidirectional_sync_1.BidirectionalSync; } });
// Conflict Resolution
var conflict_notifier_1 = require("./sync/conflict-notifier");
Object.defineProperty(exports, "ConflictNotifier", { enumerable: true, get: function () { return conflict_notifier_1.ConflictNotifier; } });
Object.defineProperty(exports, "NotificationChannel", { enumerable: true, get: function () { return conflict_notifier_1.NotificationChannel; } });
var conflict_resolver_ui_1 = require("./sync/conflict-resolver-ui");
Object.defineProperty(exports, "ConflictResolverUI", { enumerable: true, get: function () { return conflict_resolver_ui_1.ConflictResolverUI; } });
Object.defineProperty(exports, "ResolutionOption", { enumerable: true, get: function () { return conflict_resolver_ui_1.ResolutionOption; } });
var conflict_resolver_1 = require("./sync/conflict-resolver");
Object.defineProperty(exports, "ConflictResolver", { enumerable: true, get: function () { return conflict_resolver_1.ConflictResolver; } });
// Asset Management
var asset_manager_1 = require("./assets/asset-manager");
Object.defineProperty(exports, "AssetManager", { enumerable: true, get: function () { return asset_manager_1.AssetManager; } });
var asset_path_converter_1 = require("./assets/asset-path-converter");
Object.defineProperty(exports, "AssetPathConverter", { enumerable: true, get: function () { return asset_path_converter_1.AssetPathConverter; } });
var config_updater_1 = require("./assets/config-updater");
Object.defineProperty(exports, "ConfigUpdater", { enumerable: true, get: function () { return config_updater_1.ConfigUpdater; } });
// Configuration
var mode_config_1 = require("./config/mode-config");
Object.defineProperty(exports, "ModeConfig", { enumerable: true, get: function () { return mode_config_1.ModeConfig; } });
Object.defineProperty(exports, "DevelopmentMode", { enumerable: true, get: function () { return mode_config_1.DevelopmentMode; } });
Object.defineProperty(exports, "loadModeConfig", { enumerable: true, get: function () { return mode_config_1.loadModeConfig; } });
Object.defineProperty(exports, "initModeConfig", { enumerable: true, get: function () { return mode_config_1.initModeConfig; } });
var config_loader_1 = require("./config/config-loader");
Object.defineProperty(exports, "loadAndApplyConfig", { enumerable: true, get: function () { return config_loader_1.loadAndApplyConfig; } });
Object.defineProperty(exports, "initConfigWithMappings", { enumerable: true, get: function () { return config_loader_1.initConfigWithMappings; } });
Object.defineProperty(exports, "reloadConfig", { enumerable: true, get: function () { return config_loader_1.reloadConfig; } });
// Utilities
var naming_utils_1 = require("./utils/naming-utils");
Object.defineProperty(exports, "applyFileNaming", { enumerable: true, get: function () { return naming_utils_1.applyFileNaming; } });
Object.defineProperty(exports, "applyIdentifierNaming", { enumerable: true, get: function () { return naming_utils_1.applyIdentifierNaming; } });
Object.defineProperty(exports, "applyComponentNaming", { enumerable: true, get: function () { return naming_utils_1.applyComponentNaming; } });
Object.defineProperty(exports, "generateFileName", { enumerable: true, get: function () { return naming_utils_1.generateFileName; } });
Object.defineProperty(exports, "generateClassName", { enumerable: true, get: function () { return naming_utils_1.generateClassName; } });
Object.defineProperty(exports, "generateIdentifierName", { enumerable: true, get: function () { return naming_utils_1.generateIdentifierName; } });
Object.defineProperty(exports, "convertNamingConvention", { enumerable: true, get: function () { return naming_utils_1.convertNamingConvention; } });
var formatting_utils_1 = require("./utils/formatting-utils");
Object.defineProperty(exports, "formatTypeScriptCode", { enumerable: true, get: function () { return formatting_utils_1.formatTypeScriptCode; } });
Object.defineProperty(exports, "formatDartCode", { enumerable: true, get: function () { return formatting_utils_1.formatDartCode; } });
Object.defineProperty(exports, "getIndentString", { enumerable: true, get: function () { return formatting_utils_1.getIndentString; } });
Object.defineProperty(exports, "formatCodeBlock", { enumerable: true, get: function () { return formatting_utils_1.formatCodeBlock; } });
Object.defineProperty(exports, "applyTrailingComma", { enumerable: true, get: function () { return formatting_utils_1.applyTrailingComma; } });
Object.defineProperty(exports, "formatImports", { enumerable: true, get: function () { return formatting_utils_1.formatImports; } });
// Mode-Aware Sync
var mode_aware_watcher_1 = require("./sync/mode-aware-watcher");
Object.defineProperty(exports, "ModeAwareWatcher", { enumerable: true, get: function () { return mode_aware_watcher_1.ModeAwareWatcher; } });
Object.defineProperty(exports, "createModeAwareWatcher", { enumerable: true, get: function () { return mode_aware_watcher_1.createModeAwareWatcher; } });
var mode_aware_sync_1 = require("./sync/mode-aware-sync");
Object.defineProperty(exports, "ModeAwareSync", { enumerable: true, get: function () { return mode_aware_sync_1.ModeAwareSync; } });
Object.defineProperty(exports, "createModeAwareSync", { enumerable: true, get: function () { return mode_aware_sync_1.createModeAwareSync; } });
// Cache
var conversion_cache_1 = require("./cache/conversion-cache");
Object.defineProperty(exports, "ConversionCache", { enumerable: true, get: function () { return conversion_cache_1.ConversionCache; } });
Object.defineProperty(exports, "getConversionCache", { enumerable: true, get: function () { return conversion_cache_1.getConversionCache; } });
Object.defineProperty(exports, "resetConversionCache", { enumerable: true, get: function () { return conversion_cache_1.resetConversionCache; } });
// Parallel Processing
var parallel_processor_1 = require("./workers/parallel-processor");
Object.defineProperty(exports, "ParallelProcessor", { enumerable: true, get: function () { return parallel_processor_1.ParallelProcessor; } });
Object.defineProperty(exports, "getParallelProcessor", { enumerable: true, get: function () { return parallel_processor_1.getParallelProcessor; } });
Object.defineProperty(exports, "resetParallelProcessor", { enumerable: true, get: function () { return parallel_processor_1.resetParallelProcessor; } });
// Progress Tracking
var progress_tracker_1 = require("./progress/progress-tracker");
Object.defineProperty(exports, "ProgressTracker", { enumerable: true, get: function () { return progress_tracker_1.ProgressTracker; } });
Object.defineProperty(exports, "getProgressTracker", { enumerable: true, get: function () { return progress_tracker_1.getProgressTracker; } });
Object.defineProperty(exports, "resetProgressTracker", { enumerable: true, get: function () { return progress_tracker_1.resetProgressTracker; } });
Object.defineProperty(exports, "CLIProgressDisplay", { enumerable: true, get: function () { return progress_tracker_1.CLIProgressDisplay; } });
// Error Handling and Recovery
var error_handler_1 = require("./errors/error-handler");
Object.defineProperty(exports, "ErrorHandler", { enumerable: true, get: function () { return error_handler_1.ErrorHandler; } });
Object.defineProperty(exports, "getErrorHandler", { enumerable: true, get: function () { return error_handler_1.getErrorHandler; } });
Object.defineProperty(exports, "ErrorSeverity", { enumerable: true, get: function () { return error_handler_1.ErrorSeverity; } });
Object.defineProperty(exports, "ErrorCategory", { enumerable: true, get: function () { return error_handler_1.ErrorCategory; } });
var conversion_error_handler_1 = require("./errors/conversion-error-handler");
Object.defineProperty(exports, "ConversionErrorHandler", { enumerable: true, get: function () { return conversion_error_handler_1.ConversionErrorHandler; } });
Object.defineProperty(exports, "getConversionErrorHandler", { enumerable: true, get: function () { return conversion_error_handler_1.getConversionErrorHandler; } });
Object.defineProperty(exports, "ConversionFailureReason", { enumerable: true, get: function () { return conversion_error_handler_1.ConversionFailureReason; } });
var fallback_handler_1 = require("./errors/fallback-handler");
Object.defineProperty(exports, "FallbackHandler", { enumerable: true, get: function () { return fallback_handler_1.FallbackHandler; } });
Object.defineProperty(exports, "getFallbackHandler", { enumerable: true, get: function () { return fallback_handler_1.getFallbackHandler; } });
Object.defineProperty(exports, "FallbackStrategy", { enumerable: true, get: function () { return fallback_handler_1.FallbackStrategy; } });
var partial_conversion_handler_1 = require("./errors/partial-conversion-handler");
Object.defineProperty(exports, "PartialConversionHandler", { enumerable: true, get: function () { return partial_conversion_handler_1.PartialConversionHandler; } });
Object.defineProperty(exports, "getPartialConversionHandler", { enumerable: true, get: function () { return partial_conversion_handler_1.getPartialConversionHandler; } });
Object.defineProperty(exports, "ConversionIssueSeverity", { enumerable: true, get: function () { return partial_conversion_handler_1.ConversionIssueSeverity; } });
var file_backup_handler_1 = require("./errors/file-backup-handler");
Object.defineProperty(exports, "FileBackupHandler", { enumerable: true, get: function () { return file_backup_handler_1.FileBackupHandler; } });
Object.defineProperty(exports, "getFileBackupHandler", { enumerable: true, get: function () { return file_backup_handler_1.getFileBackupHandler; } });
Object.defineProperty(exports, "BackupStrategy", { enumerable: true, get: function () { return file_backup_handler_1.BackupStrategy; } });
// Documentation Conversion
var doc_converter_1 = require("./docs/doc-converter");
Object.defineProperty(exports, "parseJSDoc", { enumerable: true, get: function () { return doc_converter_1.parseJSDoc; } });
Object.defineProperty(exports, "parseDartdoc", { enumerable: true, get: function () { return doc_converter_1.parseDartdoc; } });
Object.defineProperty(exports, "jsdocToDartdoc", { enumerable: true, get: function () { return doc_converter_1.jsdocToDartdoc; } });
Object.defineProperty(exports, "dartdocToJSDoc", { enumerable: true, get: function () { return doc_converter_1.dartdocToJSDoc; } });
Object.defineProperty(exports, "extractInlineComments", { enumerable: true, get: function () { return doc_converter_1.extractInlineComments; } });
// Testing Support
var test_converter_1 = require("./testing/test-converter");
Object.defineProperty(exports, "TestConverter", { enumerable: true, get: function () { return test_converter_1.TestConverter; } });
var mock_converter_1 = require("./testing/mock-converter");
Object.defineProperty(exports, "MockConverter", { enumerable: true, get: function () { return mock_converter_1.MockConverter; } });
// Hot Reload Protocol
var protocol_1 = require("./protocol");
Object.defineProperty(exports, "PROTOCOL_VERSION", { enumerable: true, get: function () { return protocol_1.PROTOCOL_VERSION; } });
Object.defineProperty(exports, "isConnectMessage", { enumerable: true, get: function () { return protocol_1.isConnectMessage; } });
Object.defineProperty(exports, "isConnectedMessage", { enumerable: true, get: function () { return protocol_1.isConnectedMessage; } });
Object.defineProperty(exports, "isUpdateMessage", { enumerable: true, get: function () { return protocol_1.isUpdateMessage; } });
Object.defineProperty(exports, "isReloadMessage", { enumerable: true, get: function () { return protocol_1.isReloadMessage; } });
Object.defineProperty(exports, "isErrorMessage", { enumerable: true, get: function () { return protocol_1.isErrorMessage; } });
Object.defineProperty(exports, "isPingMessage", { enumerable: true, get: function () { return protocol_1.isPingMessage; } });
Object.defineProperty(exports, "isPongMessage", { enumerable: true, get: function () { return protocol_1.isPongMessage; } });
Object.defineProperty(exports, "isAckMessage", { enumerable: true, get: function () { return protocol_1.isAckMessage; } });
Object.defineProperty(exports, "ProtocolErrorCode", { enumerable: true, get: function () { return protocol_1.ProtocolErrorCode; } });
Object.defineProperty(exports, "serializeMessage", { enumerable: true, get: function () { return protocol_1.serializeMessage; } });
Object.defineProperty(exports, "deserializeMessage", { enumerable: true, get: function () { return protocol_1.deserializeMessage; } });
Object.defineProperty(exports, "validateMessage", { enumerable: true, get: function () { return protocol_1.validateMessage; } });
Object.defineProperty(exports, "createConnectMessage", { enumerable: true, get: function () { return protocol_1.createConnectMessage; } });
Object.defineProperty(exports, "createConnectedMessage", { enumerable: true, get: function () { return protocol_1.createConnectedMessage; } });
Object.defineProperty(exports, "createUpdateMessage", { enumerable: true, get: function () { return protocol_1.createUpdateMessage; } });
Object.defineProperty(exports, "createFullUpdate", { enumerable: true, get: function () { return protocol_1.createFullUpdate; } });
Object.defineProperty(exports, "createIncrementalUpdate", { enumerable: true, get: function () { return protocol_1.createIncrementalUpdate; } });
Object.defineProperty(exports, "createReloadMessage", { enumerable: true, get: function () { return protocol_1.createReloadMessage; } });
Object.defineProperty(exports, "createErrorMessage", { enumerable: true, get: function () { return protocol_1.createErrorMessage; } });
Object.defineProperty(exports, "createPingMessage", { enumerable: true, get: function () { return protocol_1.createPingMessage; } });
Object.defineProperty(exports, "createPongMessage", { enumerable: true, get: function () { return protocol_1.createPongMessage; } });
Object.defineProperty(exports, "createAckMessage", { enumerable: true, get: function () { return protocol_1.createAckMessage; } });
Object.defineProperty(exports, "calculateSchemaDelta", { enumerable: true, get: function () { return protocol_1.calculateSchemaDelta; } });
Object.defineProperty(exports, "shouldUseIncrementalUpdate", { enumerable: true, get: function () { return protocol_1.shouldUseIncrementalUpdate; } });
Object.defineProperty(exports, "validateProtocolVersion", { enumerable: true, get: function () { return protocol_1.validateProtocolVersion; } });
Object.defineProperty(exports, "validateSessionId", { enumerable: true, get: function () { return protocol_1.validateSessionId; } });
Object.defineProperty(exports, "validateChecksum", { enumerable: true, get: function () { return protocol_1.validateChecksum; } });
Object.defineProperty(exports, "calculateChecksum", { enumerable: true, get: function () { return protocol_1.calculateChecksum; } });
// Bundler
var bundler_1 = require("./bundler");
Object.defineProperty(exports, "SchemaBundler", { enumerable: true, get: function () { return bundler_1.SchemaBundler; } });
Object.defineProperty(exports, "getBundler", { enumerable: true, get: function () { return bundler_1.getBundler; } });
Object.defineProperty(exports, "resetBundler", { enumerable: true, get: function () { return bundler_1.resetBundler; } });
Object.defineProperty(exports, "BundleOptimizer", { enumerable: true, get: function () { return bundler_1.BundleOptimizer; } });
Object.defineProperty(exports, "getOptimizer", { enumerable: true, get: function () { return bundler_1.getOptimizer; } });
Object.defineProperty(exports, "resetOptimizer", { enumerable: true, get: function () { return bundler_1.resetOptimizer; } });
Object.defineProperty(exports, "ManifestGenerator", { enumerable: true, get: function () { return bundler_1.ManifestGenerator; } });
Object.defineProperty(exports, "getManifestGenerator", { enumerable: true, get: function () { return bundler_1.getManifestGenerator; } });
Object.defineProperty(exports, "resetManifestGenerator", { enumerable: true, get: function () { return bundler_1.resetManifestGenerator; } });
Object.defineProperty(exports, "BundleValidator", { enumerable: true, get: function () { return bundler_1.BundleValidator; } });
Object.defineProperty(exports, "getBundleValidator", { enumerable: true, get: function () { return bundler_1.getBundleValidator; } });
Object.defineProperty(exports, "resetBundleValidator", { enumerable: true, get: function () { return bundler_1.resetBundleValidator; } });
// Parsers
var parsers_1 = require("./parsers");
Object.defineProperty(exports, "ReactParser", { enumerable: true, get: function () { return parsers_1.ReactParser; } });
Object.defineProperty(exports, "getReactParser", { enumerable: true, get: function () { return parsers_1.getReactParser; } });
Object.defineProperty(exports, "resetReactParser", { enumerable: true, get: function () { return parsers_1.resetReactParser; } });
Object.defineProperty(exports, "ReactPlatformParser", { enumerable: true, get: function () { return parsers_1.ReactPlatformParser; } });
Object.defineProperty(exports, "DartPlatformParser", { enumerable: true, get: function () { return parsers_1.DartPlatformParser; } });
Object.defineProperty(exports, "ReactPlatformGenerator", { enumerable: true, get: function () { return parsers_1.ReactPlatformGenerator; } });
Object.defineProperty(exports, "DartPlatformGenerator", { enumerable: true, get: function () { return parsers_1.DartPlatformGenerator; } });
Object.defineProperty(exports, "PlatformCodeGenerator", { enumerable: true, get: function () { return parsers_1.PlatformCodeGenerator; } });
Object.defineProperty(exports, "createPlatformGenerator", { enumerable: true, get: function () { return parsers_1.createPlatformGenerator; } });
// State Bridge
var bridge_1 = require("./bridge");
Object.defineProperty(exports, "StateBridge", { enumerable: true, get: function () { return bridge_1.StateBridge; } });
Object.defineProperty(exports, "BaseStateAdapter", { enumerable: true, get: function () { return bridge_1.BaseStateAdapter; } });
Object.defineProperty(exports, "BlocAdapter", { enumerable: true, get: function () { return bridge_1.BlocAdapter; } });
Object.defineProperty(exports, "RiverpodAdapter", { enumerable: true, get: function () { return bridge_1.RiverpodAdapter; } });
Object.defineProperty(exports, "ProviderAdapter", { enumerable: true, get: function () { return bridge_1.ProviderAdapter; } });
Object.defineProperty(exports, "getAdapter", { enumerable: true, get: function () { return bridge_1.getAdapter; } });
Object.defineProperty(exports, "getAllAdapters", { enumerable: true, get: function () { return bridge_1.getAllAdapters; } });
Object.defineProperty(exports, "isValidAdapterType", { enumerable: true, get: function () { return bridge_1.isValidAdapterType; } });
// Navigation System
var navigation_1 = require("./navigation");
// Route Parser
Object.defineProperty(exports, "RouteParser", { enumerable: true, get: function () { return navigation_1.RouteParser; } });
