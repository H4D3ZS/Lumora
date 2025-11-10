import { FileChangeEvent } from './file-watcher';
/**
 * Change priority levels
 */
export declare enum ChangePriority {
    HIGH = 1,// Critical files (main app files)
    NORMAL = 2,// Regular component files
    LOW = 3
}
/**
 * Queued change with priority
 */
export interface QueuedChange {
    event: FileChangeEvent;
    priority: ChangePriority;
    queuedAt: number;
}
/**
 * Change queue configuration
 */
export interface ChangeQueueConfig {
    batchSize?: number;
    batchDelayMs?: number;
    maxQueueSize?: number;
}
/**
 * Change Queue System
 * Queues file changes for processing with batching and prioritization
 */
export declare class ChangeQueue {
    private queue;
    private config;
    private batchTimer?;
    private processing;
    private processHandlers;
    constructor(config?: ChangeQueueConfig);
    /**
     * Add change to queue
     */
    enqueue(event: FileChangeEvent): void;
    /**
     * Determine priority based on file path
     */
    private determinePriority;
    /**
     * Sort queue by priority
     */
    private sortQueue;
    /**
     * Schedule batch processing
     */
    private scheduleBatchProcessing;
    /**
     * Process batch of changes
     */
    private processBatch;
    /**
     * Deduplicate changes for same file (keep latest)
     */
    private deduplicateChanges;
    /**
     * Register process handler
     */
    onProcess(handler: (changes: QueuedChange[]) => Promise<void>): void;
    /**
     * Remove process handler
     */
    removeProcessHandler(handler: (changes: QueuedChange[]) => Promise<void>): void;
    /**
     * Get queue size
     */
    size(): number;
    /**
     * Clear queue
     */
    clear(): void;
    /**
     * Force immediate processing
     */
    flush(): Promise<void>;
    /**
     * Check if processing
     */
    isProcessing(): boolean;
}
