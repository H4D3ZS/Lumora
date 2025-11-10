/**
 * Parallel Processor - Process multiple files in parallel using worker threads
 */

import { Worker } from 'worker_threads';
import * as path from 'path';
import * as os from 'os';

/**
 * Task to be processed
 */
export interface ProcessTask<T = any, R = any> {
  id: string;
  type: string;
  data: T;
}

/**
 * Task result
 */
export interface TaskResult<R = any> {
  id: string;
  success: boolean;
  result?: R;
  error?: string;
  duration: number;
}

/**
 * Worker pool configuration
 */
export interface WorkerPoolConfig {
  maxWorkers?: number;
  workerScript?: string;
  timeout?: number;
}

/**
 * Worker info
 */
interface WorkerInfo {
  worker: Worker;
  busy: boolean;
  taskId?: string;
}

/**
 * Parallel Processor class
 */
export class ParallelProcessor {
  private workers: WorkerInfo[] = [];
  private taskQueue: Array<{
    task: ProcessTask;
    resolve: (result: TaskResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private config: Required<WorkerPoolConfig>;
  private initialized = false;

  constructor(config: WorkerPoolConfig = {}) {
    this.config = {
      maxWorkers: config.maxWorkers ?? Math.max(1, os.cpus().length - 1),
      workerScript: config.workerScript ?? path.join(__dirname, 'worker.js'),
      timeout: config.timeout ?? 30000,
    };
  }

  /**
   * Initialize worker pool
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    for (let i = 0; i < this.config.maxWorkers; i++) {
      await this.createWorker();
    }

    this.initialized = true;
  }

  /**
   * Create a worker
   */
  private async createWorker(): Promise<void> {
    const worker = new Worker(this.config.workerScript);
    
    const workerInfo: WorkerInfo = {
      worker,
      busy: false,
    };

    worker.on('message', (result: TaskResult) => {
      this.handleWorkerMessage(workerInfo, result);
    });

    worker.on('error', (error) => {
      this.handleWorkerError(workerInfo, error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
        this.removeWorker(workerInfo);
      }
    });

    this.workers.push(workerInfo);
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(workerInfo: WorkerInfo, result: TaskResult): void {
    workerInfo.busy = false;
    workerInfo.taskId = undefined;

    // Process next task in queue
    this.processNextTask();
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(workerInfo: WorkerInfo, error: Error): void {
    console.error('Worker error:', error);
    workerInfo.busy = false;
    workerInfo.taskId = undefined;

    // Process next task in queue
    this.processNextTask();
  }

  /**
   * Remove worker from pool
   */
  private removeWorker(workerInfo: WorkerInfo): void {
    const index = this.workers.indexOf(workerInfo);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }
  }

  /**
   * Process a task
   * @param task - Task to process
   * @returns Task result
   */
  async process<T, R>(task: ProcessTask<T, R>): Promise<TaskResult<R>> {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processNextTask();
    });
  }

  /**
   * Process multiple tasks in parallel
   * @param tasks - Array of tasks
   * @returns Array of results
   */
  async processMany<T, R>(tasks: ProcessTask<T, R>[]): Promise<TaskResult<R>[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const promises = tasks.map(task => this.process<T, R>(task));
    return Promise.all(promises);
  }

  /**
   * Process next task in queue
   */
  private processNextTask(): void {
    if (this.taskQueue.length === 0) {
      return;
    }

    // Find available worker
    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) {
      return;
    }

    // Get next task
    const queueItem = this.taskQueue.shift();
    if (!queueItem) {
      return;
    }

    const { task, resolve, reject } = queueItem;

    // Mark worker as busy
    availableWorker.busy = true;
    availableWorker.taskId = task.id;

    // Set timeout
    const timeout = setTimeout(() => {
      resolve({
        id: task.id,
        success: false,
        error: 'Task timeout',
        duration: this.config.timeout,
      });
      availableWorker.busy = false;
      availableWorker.taskId = undefined;
    }, this.config.timeout);

    // Send task to worker
    availableWorker.worker.postMessage(task);

    // Handle result
    const messageHandler = (result: TaskResult) => {
      if (result.id === task.id) {
        clearTimeout(timeout);
        availableWorker.worker.off('message', messageHandler);
        resolve(result);
      }
    };

    availableWorker.worker.on('message', messageHandler);
  }

  /**
   * Get worker pool statistics
   */
  getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    availableWorkers: number;
    queuedTasks: number;
  } {
    const busyWorkers = this.workers.filter(w => w.busy).length;
    
    return {
      totalWorkers: this.workers.length,
      busyWorkers,
      availableWorkers: this.workers.length - busyWorkers,
      queuedTasks: this.taskQueue.length,
    };
  }

  /**
   * Shutdown worker pool
   */
  async shutdown(): Promise<void> {
    const terminationPromises = this.workers.map(workerInfo => 
      workerInfo.worker.terminate()
    );

    await Promise.all(terminationPromises);
    this.workers = [];
    this.taskQueue = [];
    this.initialized = false;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Global processor instance
 */
let globalProcessor: ParallelProcessor | undefined;

/**
 * Get global processor instance
 * @param config - Worker pool configuration
 * @returns Global processor instance
 */
export function getParallelProcessor(config?: WorkerPoolConfig): ParallelProcessor {
  if (!globalProcessor) {
    globalProcessor = new ParallelProcessor(config);
  }
  return globalProcessor;
}

/**
 * Reset global processor instance
 */
export async function resetParallelProcessor(): Promise<void> {
  if (globalProcessor) {
    await globalProcessor.shutdown();
    globalProcessor = undefined;
  }
}
