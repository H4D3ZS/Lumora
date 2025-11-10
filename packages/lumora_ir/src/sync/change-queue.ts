import { FileChangeEvent } from './file-watcher';

/**
 * Change priority levels
 */
export enum ChangePriority {
  HIGH = 1,    // Critical files (main app files)
  NORMAL = 2,  // Regular component files
  LOW = 3,     // Test files, documentation
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
export class ChangeQueue {
  private queue: QueuedChange[] = [];
  private config: Required<ChangeQueueConfig>;
  private batchTimer?: NodeJS.Timeout;
  private processing = false;
  private processHandlers: Array<(changes: QueuedChange[]) => Promise<void>> = [];

  constructor(config: ChangeQueueConfig = {}) {
    this.config = {
      batchSize: config.batchSize || 10,
      batchDelayMs: config.batchDelayMs || 500,
      maxQueueSize: config.maxQueueSize || 100,
    };
  }

  /**
   * Add change to queue
   */
  enqueue(event: FileChangeEvent): void {
    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      console.warn(`Queue size limit reached (${this.config.maxQueueSize}), dropping oldest change`);
      this.queue.shift();
    }

    // Determine priority
    const priority = this.determinePriority(event);

    const queuedChange: QueuedChange = {
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
  private determinePriority(event: FileChangeEvent): ChangePriority {
    const filePath = event.filePath.toLowerCase();

    // High priority: main app files, entry points
    if (
      filePath.includes('main.') ||
      filePath.includes('app.') ||
      filePath.includes('index.')
    ) {
      return ChangePriority.HIGH;
    }

    // Low priority: test files, documentation
    if (
      filePath.includes('.test.') ||
      filePath.includes('.spec.') ||
      filePath.includes('__tests__') ||
      filePath.endsWith('.md')
    ) {
      return ChangePriority.LOW;
    }

    // Normal priority: everything else
    return ChangePriority.NORMAL;
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
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
  private scheduleBatchProcessing(): void {
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
  private async processBatch(): Promise<void> {
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
        } catch (error) {
          console.error('Error in process handler:', error);
        }
      }
    } finally {
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
  private deduplicateChanges(changes: QueuedChange[]): QueuedChange[] {
    const fileMap = new Map<string, QueuedChange>();

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
  onProcess(handler: (changes: QueuedChange[]) => Promise<void>): void {
    this.processHandlers.push(handler);
  }

  /**
   * Remove process handler
   */
  removeProcessHandler(handler: (changes: QueuedChange[]) => Promise<void>): void {
    const index = this.processHandlers.indexOf(handler);
    if (index !== -1) {
      this.processHandlers.splice(index, 1);
    }
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }
  }

  /**
   * Force immediate processing
   */
  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }
    await this.processBatch();
  }

  /**
   * Check if processing
   */
  isProcessing(): boolean {
    return this.processing;
  }
}

