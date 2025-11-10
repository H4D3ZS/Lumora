/**
 * Progress Tracker - Track and display progress for long operations
 */
/**
 * Progress update event
 */
export interface ProgressUpdate {
    operationId: string;
    current: number;
    total: number;
    percentage: number;
    message?: string;
    estimatedTimeRemaining?: number;
}
/**
 * Progress handler function
 */
export type ProgressHandler = (update: ProgressUpdate) => void;
/**
 * Progress Tracker class
 */
export declare class ProgressTracker {
    private operations;
    private handlers;
    /**
     * Start tracking an operation
     * @param operationId - Unique operation ID
     * @param total - Total number of items
     * @param message - Optional message
     */
    start(operationId: string, total: number, message?: string): void;
    /**
     * Update progress
     * @param operationId - Operation ID
     * @param current - Current progress
     * @param message - Optional message
     */
    update(operationId: string, current: number, message?: string): void;
    /**
     * Increment progress
     * @param operationId - Operation ID
     * @param increment - Amount to increment (default: 1)
     * @param message - Optional message
     */
    increment(operationId: string, increment?: number, message?: string): void;
    /**
     * Complete an operation
     * @param operationId - Operation ID
     * @param message - Optional completion message
     */
    complete(operationId: string, message?: string): void;
    /**
     * Cancel an operation
     * @param operationId - Operation ID
     */
    cancel(operationId: string): void;
    /**
     * Get progress for an operation
     * @param operationId - Operation ID
     * @returns Progress update or undefined
     */
    getProgress(operationId: string): ProgressUpdate | undefined;
    /**
     * Get all active operations
     * @returns Array of progress updates
     */
    getAllProgress(): ProgressUpdate[];
    /**
     * Register progress handler
     * @param handler - Progress handler function
     */
    onProgress(handler: ProgressHandler): void;
    /**
     * Unregister progress handler
     * @param handler - Progress handler function
     */
    offProgress(handler: ProgressHandler): void;
    /**
     * Clear all handlers
     */
    clearHandlers(): void;
    /**
     * Emit progress update
     * @param operationId - Operation ID
     */
    private emitUpdate;
    /**
     * Create progress update
     * @param operation - Operation info
     * @returns Progress update
     */
    private createUpdate;
    /**
     * Estimate time remaining
     * @param operation - Operation info
     * @returns Estimated time in milliseconds
     */
    private estimateTimeRemaining;
    /**
     * Format time remaining
     * @param milliseconds - Time in milliseconds
     * @returns Formatted time string
     */
    static formatTimeRemaining(milliseconds: number): string;
    /**
     * Format progress bar
     * @param percentage - Progress percentage
     * @param width - Bar width in characters
     * @returns Progress bar string
     */
    static formatProgressBar(percentage: number, width?: number): string;
}
/**
 * CLI Progress Display
 */
export declare class CLIProgressDisplay {
    private tracker;
    private lastUpdate;
    private updateInterval;
    constructor(tracker: ProgressTracker, updateInterval?: number);
    /**
     * Display progress update
     * @param update - Progress update
     */
    private displayUpdate;
}
/**
 * Get global progress tracker
 * @returns Global tracker instance
 */
export declare function getProgressTracker(): ProgressTracker;
/**
 * Reset global progress tracker
 */
export declare function resetProgressTracker(): void;
