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
 * Operation info
 */
interface OperationInfo {
  id: string;
  total: number;
  current: number;
  startTime: number;
  message?: string;
}

/**
 * Progress Tracker class
 */
export class ProgressTracker {
  private operations: Map<string, OperationInfo> = new Map();
  private handlers: ProgressHandler[] = [];

  /**
   * Start tracking an operation
   * @param operationId - Unique operation ID
   * @param total - Total number of items
   * @param message - Optional message
   */
  start(operationId: string, total: number, message?: string): void {
    this.operations.set(operationId, {
      id: operationId,
      total,
      current: 0,
      startTime: Date.now(),
      message,
    });

    this.emitUpdate(operationId);
  }

  /**
   * Update progress
   * @param operationId - Operation ID
   * @param current - Current progress
   * @param message - Optional message
   */
  update(operationId: string, current: number, message?: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      return;
    }

    operation.current = current;
    if (message) {
      operation.message = message;
    }

    this.emitUpdate(operationId);
  }

  /**
   * Increment progress
   * @param operationId - Operation ID
   * @param increment - Amount to increment (default: 1)
   * @param message - Optional message
   */
  increment(operationId: string, increment: number = 1, message?: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      return;
    }

    operation.current += increment;
    if (message) {
      operation.message = message;
    }

    this.emitUpdate(operationId);
  }

  /**
   * Complete an operation
   * @param operationId - Operation ID
   * @param message - Optional completion message
   */
  complete(operationId: string, message?: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      return;
    }

    operation.current = operation.total;
    if (message) {
      operation.message = message;
    }

    this.emitUpdate(operationId);
    this.operations.delete(operationId);
  }

  /**
   * Cancel an operation
   * @param operationId - Operation ID
   */
  cancel(operationId: string): void {
    this.operations.delete(operationId);
  }

  /**
   * Get progress for an operation
   * @param operationId - Operation ID
   * @returns Progress update or undefined
   */
  getProgress(operationId: string): ProgressUpdate | undefined {
    const operation = this.operations.get(operationId);
    if (!operation) {
      return undefined;
    }

    return this.createUpdate(operation);
  }

  /**
   * Get all active operations
   * @returns Array of progress updates
   */
  getAllProgress(): ProgressUpdate[] {
    return Array.from(this.operations.values()).map(op => this.createUpdate(op));
  }

  /**
   * Register progress handler
   * @param handler - Progress handler function
   */
  onProgress(handler: ProgressHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Unregister progress handler
   * @param handler - Progress handler function
   */
  offProgress(handler: ProgressHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * Clear all handlers
   */
  clearHandlers(): void {
    this.handlers = [];
  }

  /**
   * Emit progress update
   * @param operationId - Operation ID
   */
  private emitUpdate(operationId: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      return;
    }

    const update = this.createUpdate(operation);
    
    for (const handler of this.handlers) {
      try {
        handler(update);
      } catch (error) {
        console.error('Error in progress handler:', error);
      }
    }
  }

  /**
   * Create progress update
   * @param operation - Operation info
   * @returns Progress update
   */
  private createUpdate(operation: OperationInfo): ProgressUpdate {
    const percentage = operation.total > 0 
      ? (operation.current / operation.total) * 100 
      : 0;

    const estimatedTimeRemaining = this.estimateTimeRemaining(operation);

    return {
      operationId: operation.id,
      current: operation.current,
      total: operation.total,
      percentage,
      message: operation.message,
      estimatedTimeRemaining,
    };
  }

  /**
   * Estimate time remaining
   * @param operation - Operation info
   * @returns Estimated time in milliseconds
   */
  private estimateTimeRemaining(operation: OperationInfo): number | undefined {
    if (operation.current === 0) {
      return undefined;
    }

    const elapsed = Date.now() - operation.startTime;
    const rate = operation.current / elapsed;
    const remaining = operation.total - operation.current;
    
    return remaining / rate;
  }

  /**
   * Format time remaining
   * @param milliseconds - Time in milliseconds
   * @returns Formatted time string
   */
  static formatTimeRemaining(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Format progress bar
   * @param percentage - Progress percentage
   * @param width - Bar width in characters
   * @returns Progress bar string
   */
  static formatProgressBar(percentage: number, width: number = 40): string {
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percentStr = percentage.toFixed(1).padStart(5);
    
    return `[${bar}] ${percentStr}%`;
  }
}

/**
 * CLI Progress Display
 */
export class CLIProgressDisplay {
  private tracker: ProgressTracker;
  private lastUpdate: Map<string, number> = new Map();
  private updateInterval: number;

  constructor(tracker: ProgressTracker, updateInterval: number = 100) {
    this.tracker = tracker;
    this.updateInterval = updateInterval;

    this.tracker.onProgress((update) => {
      this.displayUpdate(update);
    });
  }

  /**
   * Display progress update
   * @param update - Progress update
   */
  private displayUpdate(update: ProgressUpdate): void {
    const now = Date.now();
    const lastUpdate = this.lastUpdate.get(update.operationId) || 0;

    // Throttle updates
    if (now - lastUpdate < this.updateInterval) {
      return;
    }

    this.lastUpdate.set(update.operationId, now);

    // Clear line and display progress
    process.stdout.write('\r\x1b[K');
    
    const bar = ProgressTracker.formatProgressBar(update.percentage);
    let output = bar;

    if (update.message) {
      output += ` ${update.message}`;
    }

    if (update.estimatedTimeRemaining !== undefined) {
      const timeStr = ProgressTracker.formatTimeRemaining(update.estimatedTimeRemaining);
      output += ` (${timeStr} remaining)`;
    }

    process.stdout.write(output);

    // New line when complete
    if (update.percentage >= 100) {
      process.stdout.write('\n');
      this.lastUpdate.delete(update.operationId);
    }
  }
}

/**
 * Global progress tracker instance
 */
let globalTracker: ProgressTracker | undefined;

/**
 * Get global progress tracker
 * @returns Global tracker instance
 */
export function getProgressTracker(): ProgressTracker {
  if (!globalTracker) {
    globalTracker = new ProgressTracker();
  }
  return globalTracker;
}

/**
 * Reset global progress tracker
 */
export function resetProgressTracker(): void {
  if (globalTracker) {
    globalTracker.clearHandlers();
  }
  globalTracker = undefined;
}
