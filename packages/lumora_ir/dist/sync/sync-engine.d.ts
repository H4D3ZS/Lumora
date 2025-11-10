import { LumoraIR } from '../types/ir-types';
import { IRStorage } from '../storage/ir-storage';
import { QueuedChange } from './change-queue';
import { ConversionCache } from '../cache/conversion-cache';
import { ParallelProcessor } from '../workers/parallel-processor';
import { ProgressTracker } from '../progress/progress-tracker';
import { TestSyncHandler, TestSyncConfig } from './test-sync-handler';
/**
 * Converter function type
 */
export type ConverterFunction = (filePath: string) => Promise<LumoraIR>;
/**
 * Generator function type
 */
export type GeneratorFunction = (ir: LumoraIR, outputPath: string) => Promise<void>;
/**
 * Sync configuration
 */
export interface SyncConfig {
    reactDir: string;
    flutterDir: string;
    storageDir?: string;
    reactToIR?: ConverterFunction;
    flutterToIR?: ConverterFunction;
    irToReact?: GeneratorFunction;
    irToFlutter?: GeneratorFunction;
    enableParallelProcessing?: boolean;
    parallelThreshold?: number;
    testSync?: Partial<TestSyncConfig>;
}
/**
 * Sync result
 */
export interface SyncResult {
    success: boolean;
    sourceFile: string;
    targetFile?: string;
    irId?: string;
    error?: string;
}
/**
 * Sync Engine
 * Handles conversion and synchronization between React and Flutter
 */
export declare class SyncEngine {
    private config;
    private storage;
    private cache;
    private processor;
    private progress;
    private testSyncHandler;
    private enableParallel;
    private parallelThreshold;
    constructor(config: SyncConfig);
    /**
     * Process changes from queue
     */
    processChanges(changes: QueuedChange[]): Promise<SyncResult[]>;
    /**
     * Process changes in parallel
     */
    private processChangesParallel;
    /**
     * Process single change
     */
    private processChange;
    /**
     * Process test file
     */
    private processTestFile;
    /**
     * Convert file to IR
     */
    private convertToIR;
    /**
     * Generate target framework file
     */
    private generateTargetFile;
    /**
     * Get target file path
     */
    private getTargetPath;
    /**
     * Handle file deletion
     */
    private handleFileDeletion;
    /**
     * Generate IR ID from file path
     */
    private generateIRId;
    /**
     * Convert string to snake_case
     */
    private toSnakeCase;
    /**
     * Convert string to PascalCase
     */
    private toPascalCase;
    /**
     * Get IR storage
     */
    getStorage(): IRStorage;
    /**
     * Get conversion cache
     */
    getCache(): ConversionCache;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get parallel processor
     */
    getProcessor(): ParallelProcessor;
    /**
     * Enable parallel processing
     */
    enableParallelProcessing(): void;
    /**
     * Disable parallel processing
     */
    disableParallelProcessing(): void;
    /**
     * Check if parallel processing is enabled
     */
    isParallelProcessingEnabled(): boolean;
    /**
     * Get progress tracker
     */
    getProgressTracker(): ProgressTracker;
    /**
     * Get test sync handler
     */
    getTestSyncHandler(): TestSyncHandler;
    /**
     * Enable test sync
     */
    enableTestSync(): void;
    /**
     * Disable test sync
     */
    disableTestSync(): void;
    /**
     * Check if test sync is enabled
     */
    isTestSyncEnabled(): boolean;
}
