/**
 * Parallel Processor - Process multiple files in parallel using worker threads
 */
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
 * Parallel Processor class
 */
export declare class ParallelProcessor {
    private workers;
    private taskQueue;
    private config;
    private initialized;
    constructor(config?: WorkerPoolConfig);
    /**
     * Initialize worker pool
     */
    initialize(): Promise<void>;
    /**
     * Create a worker
     */
    private createWorker;
    /**
     * Handle worker message
     */
    private handleWorkerMessage;
    /**
     * Handle worker error
     */
    private handleWorkerError;
    /**
     * Remove worker from pool
     */
    private removeWorker;
    /**
     * Process a task
     * @param task - Task to process
     * @returns Task result
     */
    process<T, R>(task: ProcessTask<T, R>): Promise<TaskResult<R>>;
    /**
     * Process multiple tasks in parallel
     * @param tasks - Array of tasks
     * @returns Array of results
     */
    processMany<T, R>(tasks: ProcessTask<T, R>[]): Promise<TaskResult<R>[]>;
    /**
     * Process next task in queue
     */
    private processNextTask;
    /**
     * Get worker pool statistics
     */
    getStats(): {
        totalWorkers: number;
        busyWorkers: number;
        availableWorkers: number;
        queuedTasks: number;
    };
    /**
     * Shutdown worker pool
     */
    shutdown(): Promise<void>;
    /**
     * Check if initialized
     */
    isInitialized(): boolean;
}
/**
 * Get global processor instance
 * @param config - Worker pool configuration
 * @returns Global processor instance
 */
export declare function getParallelProcessor(config?: WorkerPoolConfig): ParallelProcessor;
/**
 * Reset global processor instance
 */
export declare function resetParallelProcessor(): Promise<void>;
