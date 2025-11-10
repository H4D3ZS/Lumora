"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeQueue = exports.ChangePriority = void 0;
/**
 * Change priority levels
 */
var ChangePriority;
(function (ChangePriority) {
    ChangePriority[ChangePriority["HIGH"] = 1] = "HIGH";
    ChangePriority[ChangePriority["NORMAL"] = 2] = "NORMAL";
    ChangePriority[ChangePriority["LOW"] = 3] = "LOW";
})(ChangePriority || (exports.ChangePriority = ChangePriority = {}));
/**
 * Change Queue System
 * Queues file changes for processing with batching and prioritization
 */
class ChangeQueue {
    constructor(config = {}) {
        this.queue = [];
        this.processing = false;
        this.processHandlers = [];
        this.config = {
            batchSize: config.batchSize || 10,
            batchDelayMs: config.batchDelayMs || 500,
            maxQueueSize: config.maxQueueSize || 100,
        };
    }
    /**
     * Add change to queue
     */
    enqueue(event) {
        // Check queue size limit
        if (this.queue.length >= this.config.maxQueueSize) {
            console.warn(`Queue size limit reached (${this.config.maxQueueSize}), dropping oldest change`);
            this.queue.shift();
        }
        // Determine priority
        const priority = this.determinePriority(event);
        const queuedChange = {
            event,
            priority,
            queuedAt: Date.now(),
        };
        // Add to queue
        this.queue.push(queuedChange);
        // Sort queue by priority
        this.sortQueue();
        // Schedule batch processing
        this.scheduleBatchProcessing();
    }
    /**
     * Determine priority based on file path
     */
    determinePriority(event) {
        const filePath = event.filePath.toLowerCase();
        // High priority: main app files, entry points
        if (filePath.includes('main.') ||
            filePath.includes('app.') ||
            filePath.includes('index.')) {
            return ChangePriority.HIGH;
        }
        // Low priority: test files, documentation
        if (filePath.includes('.test.') ||
            filePath.includes('.spec.') ||
            filePath.includes('__tests__') ||
            filePath.endsWith('.md')) {
            return ChangePriority.LOW;
        }
        // Normal priority: everything else
        return ChangePriority.NORMAL;
    }
    /**
     * Sort queue by priority
     */
    sortQueue() {
        this.queue.sort((a, b) => {
            // First by priority
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            // Then by timestamp (older first)
            return a.queuedAt - b.queuedAt;
        });
    }
    /**
     * Schedule batch processing
     */
    scheduleBatchProcessing() {
        // Clear existing timer
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
        }
        // If queue is large enough, process immediately
        if (this.queue.length >= this.config.batchSize) {
            this.processBatch();
            return;
        }
        // Otherwise, schedule delayed processing
        this.batchTimer = setTimeout(() => {
            this.processBatch();
        }, this.config.batchDelayMs);
    }
    /**
     * Process batch of changes
     */
    async processBatch() {
        // Clear timer
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = undefined;
        }
        // Skip if already processing or queue is empty
        if (this.processing || this.queue.length === 0) {
            return;
        }
        this.processing = true;
        try {
            // Get batch of changes
            const batch = this.queue.splice(0, this.config.batchSize);
            // Deduplicate changes for same file (keep latest)
            const deduped = this.deduplicateChanges(batch);
            // Notify handlers
            for (const handler of this.processHandlers) {
                try {
                    await handler(deduped);
                }
                catch (error) {
                    console.error('Error in process handler:', error);
                }
            }
        }
        finally {
            this.processing = false;
            // If there are more items in queue, schedule next batch
            if (this.queue.length > 0) {
                this.scheduleBatchProcessing();
            }
        }
    }
    /**
     * Deduplicate changes for same file (keep latest)
     */
    deduplicateChanges(changes) {
        const fileMap = new Map();
        for (const change of changes) {
            const existing = fileMap.get(change.event.filePath);
            // Keep the latest change for each file
            if (!existing || change.queuedAt > existing.queuedAt) {
                fileMap.set(change.event.filePath, change);
            }
        }
        return Array.from(fileMap.values());
    }
    /**
     * Register process handler
     */
    onProcess(handler) {
        this.processHandlers.push(handler);
    }
    /**
     * Remove process handler
     */
    removeProcessHandler(handler) {
        const index = this.processHandlers.indexOf(handler);
        if (index !== -1) {
            this.processHandlers.splice(index, 1);
        }
    }
    /**
     * Get queue size
     */
    size() {
        return this.queue.length;
    }
    /**
     * Clear queue
     */
    clear() {
        this.queue = [];
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = undefined;
        }
    }
    /**
     * Force immediate processing
     */
    async flush() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = undefined;
        }
        await this.processBatch();
    }
    /**
     * Check if processing
     */
    isProcessing() {
        return this.processing;
    }
}
exports.ChangeQueue = ChangeQueue;
