/**
 * Sync status types
 */
export declare enum SyncStatus {
    IDLE = "idle",
    WATCHING = "watching",
    SYNCING = "syncing",
    ERROR = "error",
    CONFLICT = "conflict"
}
/**
 * Sync operation
 */
export interface SyncOperation {
    id: string;
    sourceFile: string;
    targetFile?: string;
    framework: 'react' | 'flutter';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    startedAt: number;
    completedAt?: number;
    error?: string;
}
/**
 * Sync statistics
 */
export interface SyncStatistics {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    conflicts: number;
    averageSyncTime: number;
    lastSyncAt?: number;
}
/**
 * Status update event
 */
export interface StatusUpdateEvent {
    status: SyncStatus;
    message?: string;
    operation?: SyncOperation;
    statistics?: SyncStatistics;
    timestamp: number;
}
/**
 * Sync Status Tracker
 * Tracks and reports sync status for CLI, web dashboard, and VS Code extension
 */
export declare class SyncStatusTracker {
    private currentStatus;
    private operations;
    private statistics;
    private statusHandlers;
    /**
     * Set sync status
     */
    setStatus(status: SyncStatus, message?: string): void;
    /**
     * Get current status
     */
    getStatus(): SyncStatus;
    /**
     * Start sync operation
     */
    startOperation(sourceFile: string, framework: 'react' | 'flutter'): string;
    /**
     * Update operation status
     */
    updateOperation(id: string, updates: Partial<SyncOperation>): void;
    /**
     * Complete operation
     */
    completeOperation(id: string, targetFile?: string, error?: string): void;
    /**
     * Record conflict
     */
    recordConflict(): void;
    /**
     * Get active operations
     */
    getActiveOperations(): SyncOperation[];
    /**
     * Get recent operations
     */
    getRecentOperations(limit?: number): SyncOperation[];
    /**
     * Get statistics
     */
    getStatistics(): SyncStatistics;
    /**
     * Reset statistics
     */
    resetStatistics(): void;
    /**
     * Register status handler
     */
    onStatusUpdate(handler: (event: StatusUpdateEvent) => void): void;
    /**
     * Remove status handler
     */
    removeStatusHandler(handler: (event: StatusUpdateEvent) => void): void;
    /**
     * Notify status update
     */
    private notifyStatusUpdate;
    /**
     * Generate operation ID
     */
    private generateOperationId;
    /**
     * Clean up old completed operations
     */
    private cleanupOperations;
    /**
     * Format status for CLI display
     */
    formatForCLI(): string;
    /**
     * Format status for web dashboard
     */
    formatForWeb(): object;
}
