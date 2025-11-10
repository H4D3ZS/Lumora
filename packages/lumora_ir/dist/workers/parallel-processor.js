"use strict";
/**
 * Parallel Processor - Process multiple files in parallel using worker threads
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelProcessor = void 0;
exports.getParallelProcessor = getParallelProcessor;
exports.resetParallelProcessor = resetParallelProcessor;
const worker_threads_1 = require("worker_threads");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Parallel Processor class
 */
class ParallelProcessor {
    constructor(config = {}) {
        this.workers = [];
        this.taskQueue = [];
        this.initialized = false;
        this.config = {
            maxWorkers: config.maxWorkers ?? Math.max(1, os.cpus().length - 1),
            workerScript: config.workerScript ?? path.join(__dirname, 'worker.js'),
            timeout: config.timeout ?? 30000,
        };
    }
    /**
     * Initialize worker pool
     */
    async initialize() {
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
    async createWorker() {
        const worker = new worker_threads_1.Worker(this.config.workerScript);
        const workerInfo = {
            worker,
            busy: false,
        };
        worker.on('message', (result) => {
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
    handleWorkerMessage(workerInfo, result) {
        workerInfo.busy = false;
        workerInfo.taskId = undefined;
        // Process next task in queue
        this.processNextTask();
    }
    /**
     * Handle worker error
     */
    handleWorkerError(workerInfo, error) {
        console.error('Worker error:', error);
        workerInfo.busy = false;
        workerInfo.taskId = undefined;
        // Process next task in queue
        this.processNextTask();
    }
    /**
     * Remove worker from pool
     */
    removeWorker(workerInfo) {
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
    async process(task) {
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
    async processMany(tasks) {
        if (!this.initialized) {
            await this.initialize();
        }
        const promises = tasks.map(task => this.process(task));
        return Promise.all(promises);
    }
    /**
     * Process next task in queue
     */
    processNextTask() {
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
        const messageHandler = (result) => {
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
    getStats() {
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
    async shutdown() {
        const terminationPromises = this.workers.map(workerInfo => workerInfo.worker.terminate());
        await Promise.all(terminationPromises);
        this.workers = [];
        this.taskQueue = [];
        this.initialized = false;
    }
    /**
     * Check if initialized
     */
    isInitialized() {
        return this.initialized;
    }
}
exports.ParallelProcessor = ParallelProcessor;
/**
 * Global processor instance
 */
let globalProcessor;
/**
 * Get global processor instance
 * @param config - Worker pool configuration
 * @returns Global processor instance
 */
function getParallelProcessor(config) {
    if (!globalProcessor) {
        globalProcessor = new ParallelProcessor(config);
    }
    return globalProcessor;
}
/**
 * Reset global processor instance
 */
async function resetParallelProcessor() {
    if (globalProcessor) {
        await globalProcessor.shutdown();
        globalProcessor = undefined;
    }
}
