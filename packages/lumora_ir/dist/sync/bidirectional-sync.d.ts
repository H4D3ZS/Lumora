import { FileWatcherConfig } from './file-watcher';
import { ChangeQueueConfig } from './change-queue';
import { SyncEngine, SyncConfig } from './sync-engine';
import { ConflictDetector, ConflictDetectorConfig, ConflictRecord } from './conflict-detector';
import { SyncStatusTracker, StatusUpdateEvent } from './sync-status';
/**
 * Bidirectional sync configuration
 */
export interface BidirectionalSyncConfig {
    sync: SyncConfig;
    watcher?: FileWatcherConfig;
    queue?: ChangeQueueConfig;
    conflictDetector?: ConflictDetectorConfig;
}
/**
 * Bidirectional Sync Coordinator
 * Orchestrates file watching, change queuing, sync, and conflict detection
 */
export declare class BidirectionalSync {
    private fileWatcher;
    private changeQueue;
    private syncEngine;
    private conflictDetector;
    private statusTracker;
    private config;
    private running;
    constructor(config: BidirectionalSyncConfig);
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Start bidirectional sync
     */
    start(): void;
    /**
     * Stop bidirectional sync
     */
    stop(): Promise<void>;
    /**
     * Process changes from queue
     */
    private processChanges;
    /**
     * Generate IR ID from event
     */
    private generateIRId;
    /**
     * Get React and Flutter file paths
     */
    private getFilePaths;
    /**
     * Get target file path (simplified version)
     */
    private getTargetPath;
    /**
     * Get status tracker
     */
    getStatusTracker(): SyncStatusTracker;
    /**
     * Get conflict detector
     */
    getConflictDetector(): ConflictDetector;
    /**
     * Get sync engine
     */
    getSyncEngine(): SyncEngine;
    /**
     * Check if running
     */
    isRunning(): boolean;
    /**
     * Get unresolved conflicts
     */
    getUnresolvedConflicts(): ConflictRecord[];
    /**
     * Resolve conflict
     */
    resolveConflict(conflictId: string): boolean;
    /**
     * Register status update handler
     */
    onStatusUpdate(handler: (event: StatusUpdateEvent) => void): void;
    /**
     * Register conflict handler
     */
    onConflict(handler: (conflict: ConflictRecord) => void): void;
}
