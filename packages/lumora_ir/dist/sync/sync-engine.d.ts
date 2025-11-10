import { LumoraIR } from '../types/ir-types';
import { IRStorage } from '../storage/ir-storage';
import { QueuedChange } from './change-queue';
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
    constructor(config: SyncConfig);
    /**
     * Process changes from queue
     */
    processChanges(changes: QueuedChange[]): Promise<SyncResult[]>;
    /**
     * Process single change
     */
    private processChange;
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
}
