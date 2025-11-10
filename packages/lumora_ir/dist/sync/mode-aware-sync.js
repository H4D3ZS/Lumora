"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeAwareSync = void 0;
exports.createModeAwareSync = createModeAwareSync;
const mode_aware_watcher_1 = require("./mode-aware-watcher");
const change_queue_1 = require("./change-queue");
const sync_engine_1 = require("./sync-engine");
const conflict_detector_1 = require("./conflict-detector");
const sync_status_1 = require("./sync-status");
const mode_config_1 = require("../config/mode-config");
/**
 * Mode-Aware Bidirectional Sync
 * Orchestrates file watching, change queuing, sync, and conflict detection
 * with mode-aware behavior
 */
class ModeAwareSync {
    constructor(config) {
        this.running = false;
        this.config = config;
        this.modeConfig = config.modeConfig;
        // Initialize mode-aware watcher
        this.modeWatcher = (0, mode_aware_watcher_1.createModeAwareWatcher)(config.modeConfig);
        // Initialize components
        this.changeQueue = new change_queue_1.ChangeQueue(config.queue);
        this.syncEngine = new sync_engine_1.SyncEngine({
            reactDir: config.modeConfig.getReactDir(),
            flutterDir: config.modeConfig.getFlutterDir(),
            storageDir: config.modeConfig.getStorageDir(),
            ...config.sync,
        });
        // Configure conflict detector based on mode
        const conflictConfig = this.buildConflictDetectorConfig(config.conflictDetector);
        this.conflictDetector = new conflict_detector_1.ConflictDetector(conflictConfig);
        this.statusTracker = new sync_status_1.SyncStatusTracker();
        // Wire up event handlers
        this.setupEventHandlers();
    }
    /**
     * Build conflict detector configuration based on mode
     */
    buildConflictDetectorConfig(baseConfig) {
        const mode = this.modeConfig.getMode();
        // In React/Flutter mode, conflicts should not occur since only one side is editable
        // In Universal mode, conflicts can occur
        const enableConflictDetection = mode === mode_config_1.DevelopmentMode.UNIVERSAL;
        return {
            ...baseConfig,
            // Override conflict window if in single-source mode
            conflictWindowMs: enableConflictDetection
                ? (baseConfig?.conflictWindowMs || 5000)
                : 0, // No conflict detection in single-source mode
        };
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Mode-aware watcher -> Change queue
        this.modeWatcher.onChange((event) => {
            this.changeQueue.enqueue(event);
        });
        // Change queue -> Sync engine
        this.changeQueue.onProcess(async (changes) => {
            await this.processChanges(changes);
        });
        // Conflict detector -> Status tracker
        this.conflictDetector.onConflict((conflict) => {
            this.statusTracker.recordConflict();
            console.warn('Conflict detected:', conflict);
        });
    }
    /**
     * Start mode-aware sync
     */
    start() {
        if (this.running) {
            console.warn('Mode-aware sync is already running');
            return;
        }
        this.running = true;
        this.modeWatcher.start();
        this.statusTracker.setStatus(sync_status_1.SyncStatus.WATCHING, 'Watching for changes...');
        console.log('Mode-aware sync started');
        console.log(`Mode: ${this.modeConfig.getMode()}`);
        console.log(this.modeWatcher.getModeDescription());
    }
    /**
     * Stop mode-aware sync
     */
    async stop() {
        if (!this.running) {
            return;
        }
        this.running = false;
        // Flush pending changes
        await this.changeQueue.flush();
        // Stop watcher
        await this.modeWatcher.stop();
        this.statusTracker.setStatus(sync_status_1.SyncStatus.IDLE, 'Stopped');
        console.log('Mode-aware sync stopped');
    }
    /**
     * Process changes from queue
     */
    async processChanges(changes) {
        const mode = this.modeConfig.getMode();
        for (const change of changes) {
            const opId = this.statusTracker.startOperation(change.event.filePath, change.event.framework);
            try {
                this.statusTracker.updateOperation(opId, { status: 'processing' });
                // Check if this change should be processed based on mode
                if (!this.shouldProcessChange(change.event)) {
                    this.statusTracker.completeOperation(opId, undefined, 'Skipped: file is read-only in current mode');
                    continue;
                }
                // Check for conflicts (only in Universal mode)
                if (mode === mode_config_1.DevelopmentMode.UNIVERSAL) {
                    const irId = this.generateIRId(change.event);
                    const { reactFile, flutterFile } = this.getFilePaths(change.event);
                    const conflictResult = this.conflictDetector.checkConflict(change.event, irId, reactFile, flutterFile);
                    if (conflictResult.hasConflict) {
                        this.statusTracker.completeOperation(opId, undefined, 'Conflict detected - manual resolution required');
                        continue;
                    }
                }
                // Process sync
                const results = await this.syncEngine.processChanges([change]);
                const result = results[0];
                if (result.success) {
                    this.statusTracker.completeOperation(opId, result.targetFile);
                }
                else {
                    this.statusTracker.completeOperation(opId, undefined, result.error);
                }
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                this.statusTracker.completeOperation(opId, undefined, errorMsg);
                console.error('Error processing change:', error);
            }
        }
    }
    /**
     * Check if change should be processed based on mode
     */
    shouldProcessChange(event) {
        // Check if the file is read-only in current mode
        if (this.modeWatcher.isReadOnly(event.framework)) {
            console.warn(`Ignoring change to ${event.framework} file in ${this.modeConfig.getMode()} mode: ${event.filePath}`);
            return false;
        }
        return true;
    }
    /**
     * Generate IR ID from event
     */
    generateIRId(event) {
        const baseDir = event.framework === 'react'
            ? this.modeConfig.getReactDir()
            : this.modeConfig.getFlutterDir();
        const relativePath = event.filePath.replace(baseDir, '');
        const withoutExt = relativePath.replace(/\.(tsx?|jsx?|dart)$/, '');
        const normalized = withoutExt.replace(/[\/\\]/g, '_');
        return `${event.framework}_${normalized}`;
    }
    /**
     * Get React and Flutter file paths
     */
    getFilePaths(event) {
        if (event.framework === 'react') {
            return {
                reactFile: event.filePath,
                flutterFile: this.getTargetPath(event.filePath, 'react'),
            };
        }
        else {
            return {
                reactFile: this.getTargetPath(event.filePath, 'flutter'),
                flutterFile: event.filePath,
            };
        }
    }
    /**
     * Get target file path (simplified version)
     */
    getTargetPath(sourceFile, sourceFramework) {
        const reactDir = this.modeConfig.getReactDir();
        const flutterDir = this.modeConfig.getFlutterDir();
        if (sourceFramework === 'react') {
            return sourceFile
                .replace(reactDir, flutterDir)
                .replace(/\.(tsx?|jsx?)$/, '.dart');
        }
        else {
            return sourceFile
                .replace(flutterDir, reactDir)
                .replace(/\.dart$/, '.tsx');
        }
    }
    /**
     * Get mode configuration
     */
    getModeConfig() {
        return this.modeConfig;
    }
    /**
     * Get development mode
     */
    getMode() {
        return this.modeConfig.getMode();
    }
    /**
     * Get status tracker
     */
    getStatusTracker() {
        return this.statusTracker;
    }
    /**
     * Get conflict detector
     */
    getConflictDetector() {
        return this.conflictDetector;
    }
    /**
     * Get sync engine
     */
    getSyncEngine() {
        return this.syncEngine;
    }
    /**
     * Check if running
     */
    isRunning() {
        return this.running;
    }
    /**
     * Get unresolved conflicts
     */
    getUnresolvedConflicts() {
        return this.conflictDetector.getUnresolvedConflicts();
    }
    /**
     * Resolve conflict
     */
    resolveConflict(conflictId) {
        return this.conflictDetector.resolveConflict(conflictId);
    }
    /**
     * Register status update handler
     */
    onStatusUpdate(handler) {
        this.statusTracker.onStatusUpdate(handler);
    }
    /**
     * Register conflict handler
     */
    onConflict(handler) {
        this.conflictDetector.onConflict(handler);
    }
    /**
     * Get mode-aware watcher
     */
    getModeWatcher() {
        return this.modeWatcher;
    }
}
exports.ModeAwareSync = ModeAwareSync;
/**
 * Create mode-aware sync from mode configuration
 */
function createModeAwareSync(config) {
    return new ModeAwareSync(config);
}
