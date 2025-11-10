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
exports.ConfigUpdater = exports.AssetPathConverter = exports.AssetManager = exports.ConflictResolver = exports.ResolutionOption = exports.ConflictResolverUI = exports.NotificationChannel = exports.ConflictNotifier = exports.BidirectionalSync = exports.SyncStatus = exports.SyncStatusTracker = exports.ConflictDetector = exports.SyncEngine = exports.ChangePriority = exports.ChangeQueue = exports.FileWatcher = exports.createNode = exports.createIR = exports.resetRegistry = exports.getRegistry = exports.WidgetMappingRegistry = exports.getMigrator = exports.IRMigrator = exports.IRStorage = exports.getValidator = exports.IRValidator = exports.getInterfaceConverter = exports.InterfaceConverter = exports.getTypeMapper = exports.TypeMapper = void 0;
// Types
__exportStar(require("./types/ir-types"), exports);
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
