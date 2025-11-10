"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncStatusTracker = exports.SyncStatus = void 0;
/**
 * Sync status types
 */
var SyncStatus;
(function (SyncStatus) {
    SyncStatus["IDLE"] = "idle";
    SyncStatus["WATCHING"] = "watching";
    SyncStatus["SYNCING"] = "syncing";
    SyncStatus["ERROR"] = "error";
    SyncStatus["CONFLICT"] = "conflict";
})(SyncStatus || (exports.SyncStatus = SyncStatus = {}));
/**
 * Sync Status Tracker
 * Tracks and reports sync status for CLI, web dashboard, and VS Code extension
 */
class SyncStatusTracker {
    constructor() {
        this.currentStatus = SyncStatus.IDLE;
        this.operations = new Map();
        this.statistics = {
            totalSyncs: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
            conflicts: 0,
            averageSyncTime: 0,
        };
        this.statusHandlers = [];
    }
    /**
     * Set sync status
     */
    setStatus(status, message) {
        this.currentStatus = status;
        this.notifyStatusUpdate({ status, message });
    }
    /**
     * Get current status
     */
    getStatus() {
        return this.currentStatus;
    }
    /**
     * Start sync operation
     */
    startOperation(sourceFile, framework) {
        const id = this.generateOperationId();
        const operation = {
            id,
            sourceFile,
            framework,
            status: 'pending',
            startedAt: Date.now(),
        };
        this.operations.set(id, operation);
        this.setStatus(SyncStatus.SYNCING, `Syncing ${sourceFile}`);
        this.notifyStatusUpdate({ status: this.currentStatus, operation });
        return id;
    }
    /**
     * Update operation status
     */
    updateOperation(id, updates) {
        const operation = this.operations.get(id);
        if (!operation) {
            return;
        }
        Object.assign(operation, updates);
        if (updates.status === 'processing') {
            this.notifyStatusUpdate({
                status: this.currentStatus,
                operation,
                message: `Processing ${operation.sourceFile}`,
            });
        }
    }
    /**
     * Complete operation
     */
    completeOperation(id, targetFile, error) {
        const operation = this.operations.get(id);
        if (!operation) {
            return;
        }
        operation.completedAt = Date.now();
        operation.targetFile = targetFile;
        operation.error = error;
        operation.status = error ? 'failed' : 'completed';
        // Update statistics
        this.statistics.totalSyncs++;
        if (error) {
            this.statistics.failedSyncs++;
        }
        else {
            this.statistics.successfulSyncs++;
        }
        this.statistics.lastSyncAt = operation.completedAt;
        // Update average sync time
        const syncTime = operation.completedAt - operation.startedAt;
        this.statistics.averageSyncTime =
            (this.statistics.averageSyncTime * (this.statistics.totalSyncs - 1) + syncTime) /
                this.statistics.totalSyncs;
        // Notify
        this.notifyStatusUpdate({
            status: error ? SyncStatus.ERROR : SyncStatus.WATCHING,
            operation,
            statistics: this.statistics,
            message: error ? `Failed: ${error}` : `Synced ${operation.sourceFile}`,
        });
        // Clean up old operations
        this.cleanupOperations();
        // Update status
        if (!error && this.currentStatus === SyncStatus.SYNCING) {
            this.setStatus(SyncStatus.WATCHING);
        }
        else if (error) {
            this.setStatus(SyncStatus.ERROR, error);
        }
    }
    /**
     * Record conflict
     */
    recordConflict() {
        this.statistics.conflicts++;
        this.setStatus(SyncStatus.CONFLICT, 'Conflict detected');
        this.notifyStatusUpdate({
            status: SyncStatus.CONFLICT,
            statistics: this.statistics,
        });
    }
    /**
     * Get active operations
     */
    getActiveOperations() {
        return Array.from(this.operations.values())
            .filter(op => op.status === 'pending' || op.status === 'processing');
    }
    /**
     * Get recent operations
     */
    getRecentOperations(limit = 10) {
        return Array.from(this.operations.values())
            .sort((a, b) => b.startedAt - a.startedAt)
            .slice(0, limit);
    }
    /**
     * Get statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }
    /**
     * Reset statistics
     */
    resetStatistics() {
        this.statistics = {
            totalSyncs: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
            conflicts: 0,
            averageSyncTime: 0,
        };
        this.notifyStatusUpdate({
            status: this.currentStatus,
            statistics: this.statistics,
        });
    }
    /**
     * Register status handler
     */
    onStatusUpdate(handler) {
        this.statusHandlers.push(handler);
    }
    /**
     * Remove status handler
     */
    removeStatusHandler(handler) {
        const index = this.statusHandlers.indexOf(handler);
        if (index !== -1) {
            this.statusHandlers.splice(index, 1);
        }
    }
    /**
     * Notify status update
     */
    notifyStatusUpdate(event) {
        const fullEvent = {
            status: event.status || this.currentStatus,
            message: event.message,
            operation: event.operation,
            statistics: event.statistics,
            timestamp: Date.now(),
        };
        for (const handler of this.statusHandlers) {
            try {
                handler(fullEvent);
            }
            catch (error) {
                console.error('Error in status handler:', error);
            }
        }
    }
    /**
     * Generate operation ID
     */
    generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Clean up old completed operations
     */
    cleanupOperations() {
        const maxOperations = 100;
        const operations = Array.from(this.operations.entries())
            .sort((a, b) => b[1].startedAt - a[1].startedAt);
        if (operations.length > maxOperations) {
            const toRemove = operations.slice(maxOperations);
            for (const [id] of toRemove) {
                this.operations.delete(id);
            }
        }
    }
    /**
     * Format status for CLI display
     */
    formatForCLI() {
        const statusSymbols = {
            [SyncStatus.IDLE]: '⚪',
            [SyncStatus.WATCHING]: '👀',
            [SyncStatus.SYNCING]: '🔄',
            [SyncStatus.ERROR]: '❌',
            [SyncStatus.CONFLICT]: '⚠️',
        };
        const symbol = statusSymbols[this.currentStatus];
        const activeOps = this.getActiveOperations();
        let output = `${symbol} Status: ${this.currentStatus}`;
        if (activeOps.length > 0) {
            output += ` (${activeOps.length} active)`;
        }
        if (this.statistics.totalSyncs > 0) {
            output += `\n📊 Stats: ${this.statistics.successfulSyncs}/${this.statistics.totalSyncs} successful`;
            if (this.statistics.conflicts > 0) {
                output += `, ${this.statistics.conflicts} conflicts`;
            }
            output += `, avg ${Math.round(this.statistics.averageSyncTime)}ms`;
        }
        return output;
    }
    /**
     * Format status for web dashboard
     */
    formatForWeb() {
        return {
            status: this.currentStatus,
            activeOperations: this.getActiveOperations(),
            recentOperations: this.getRecentOperations(5),
            statistics: this.statistics,
        };
    }
}
exports.SyncStatusTracker = SyncStatusTracker;
