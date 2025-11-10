"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidirectionalSync = void 0;
const file_watcher_1 = require("./file-watcher");
const change_queue_1 = require("./change-queue");
const sync_engine_1 = require("./sync-engine");
const conflict_detector_1 = require("./conflict-detector");
const sync_status_1 = require("./sync-status");
/**
 * Bidirectional Sync Coordinator
 * Orchestrates file watching, change queuing, sync, and conflict detection
 */
class BidirectionalSync {
    constructor(config) {
        this.running = false;
        this.config = config;
        // Initialize components
        this.fileWatcher = new file_watcher_1.FileWatcher({
            reactDir: config.sync.reactDir,
            flutterDir: config.sync.flutterDir,
            ...config.watcher,
        });
        this.changeQueue = new change_queue_1.ChangeQueue(config.queue);
        this.syncEngine = new sync_engine_1.SyncEngine(config.sync);
        this.conflictDetector = new conflict_detector_1.ConflictDetector(config.conflictDetector);
        this.statusTracker = new sync_status_1.SyncStatusTracker();
        // Wire up event handlers
        this.setupEventHandlers();
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // File watcher -> Change queue
        this.fileWatcher.onChange((event) => {
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
     * Start bidirectional sync
     */
    start() {
        if (this.running) {
            console.warn('Bidirectional sync is already running');
            return;
        }
        this.running = true;
        this.fileWatcher.start();
        this.statusTracker.setStatus(sync_status_1.SyncStatus.WATCHING, 'Watching for changes...');
        console.log('Bidirectional sync started');
        console.log(`Watching React: ${this.config.sync.reactDir}`);
        console.log(`Watching Flutter: ${this.config.sync.flutterDir}`);
    }
    /**
     * Stop bidirectional sync
     */
    async stop() {
        if (!this.running) {
            return;
        }
        this.running = false;
        // Flush pending changes
        await this.changeQueue.flush();
        // Stop file watcher
        await this.fileWatcher.stop();
        this.statusTracker.setStatus(sync_status_1.SyncStatus.IDLE, 'Stopped');
        console.log('Bidirectional sync stopped');
    }
    /**
     * Process changes from queue
     */
    async processChanges(changes) {
        for (const change of changes) {
            const opId = this.statusTracker.startOperation(change.event.filePath, change.event.framework);
            try {
                this.statusTracker.updateOperation(opId, { status: 'processing' });
                // Check for conflicts
                const irId = this.generateIRId(change.event);
                const { reactFile, flutterFile } = this.getFilePaths(change.event);
                const conflictResult = this.conflictDetector.checkConflict(change.event, irId, reactFile, flutterFile);
                if (conflictResult.hasConflict) {
                    // Skip sync if conflict detected
                    this.statusTracker.completeOperation(opId, undefined, 'Conflict detected - manual resolution required');
                    continue;
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
     * Generate IR ID from event
     */
    generateIRId(event) {
        const baseDir = event.framework === 'react'
            ? this.config.sync.reactDir
            : this.config.sync.flutterDir;
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
        // This is a simplified version - actual implementation in SyncEngine
        if (sourceFramework === 'react') {
            return sourceFile
                .replace(this.config.sync.reactDir, this.config.sync.flutterDir)
                .replace(/\.(tsx?|jsx?)$/, '.dart');
        }
        else {
            return sourceFile
                .replace(this.config.sync.flutterDir, this.config.sync.reactDir)
                .replace(/\.dart$/, '.tsx');
        }
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
}
exports.BidirectionalSync = BidirectionalSync;
