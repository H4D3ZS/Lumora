import { ModeAwareWatcher } from './mode-aware-watcher';
import { ChangeQueueConfig } from './change-queue';
import { SyncEngine, SyncConfig } from './sync-engine';
import { ConflictDetector, ConflictDetectorConfig, ConflictRecord } from './conflict-detector';
import { SyncStatusTracker, StatusUpdateEvent } from './sync-status';
import { ModeConfig, DevelopmentMode } from '../config/mode-config';
/**
 * Mode-aware sync configuration
 */
export interface ModeAwareSyncConfig {
    modeConfig: ModeConfig;
    sync: Omit<SyncConfig, 'reactDir' | 'flutterDir'>;
    queue?: ChangeQueueConfig;
    conflictDetector?: ConflictDetectorConfig;
}
/**
 * Mode-Aware Bidirectional Sync
 * Orchestrates file watching, change queuing, sync, and conflict detection
 * with mode-aware behavior
 */
export declare class ModeAwareSync {
    private modeWatcher;
    private changeQueue;
    private syncEngine;
    private conflictDetector;
    private statusTracker;
    private modeConfig;
    private config;
    private running;
    constructor(config: ModeAwareSyncConfig);
    /**
     * Build conflict detector configuration based on mode
     */
    private buildConflictDetectorConfig;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Start mode-aware sync
     */
    start(): void;
    /**
     * Stop mode-aware sync
     */
    stop(): Promise<void>;
    /**
     * Process changes from queue
     */
    private processChanges;
    /**
     * Check if change should be processed based on mode
     */
    private shouldProcessChange;
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
     * Get mode configuration
     */
    getModeConfig(): ModeConfig;
    /**
     * Get development mode
     */
    getMode(): DevelopmentMode;
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
    /**
     * Get mode-aware watcher
     */
    getModeWatcher(): ModeAwareWatcher;
}
/**
 * Create mode-aware sync from mode configuration
 */
export declare function createModeAwareSync(config: ModeAwareSyncConfig): ModeAwareSync;
