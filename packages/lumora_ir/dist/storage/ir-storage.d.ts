import { LumoraIR, IRStorageEntry } from '../types/ir-types';
/**
 * IR Storage System
 * Manages storage and versioning of Lumora IR
 */
export declare class IRStorage {
    private storageDir;
    private validator;
    constructor(storageDir?: string);
    /**
     * Ensure storage directory exists
     */
    private ensureStorageDir;
    /**
     * Generate checksum for IR
     */
    private generateChecksum;
    /**
     * Get file path for IR entry
     */
    private getFilePath;
    /**
     * Get history directory path
     */
    private getHistoryDir;
    /**
     * Store IR with versioning
     */
    store(id: string, ir: LumoraIR): IRStorageEntry;
    /**
     * Retrieve IR by id
     */
    retrieve(id: string, version?: number): IRStorageEntry | null;
    /**
     * Get current version number
     */
    getCurrentVersion(id: string): number;
    /**
     * Archive version to history
     */
    private archiveVersion;
    /**
     * Get version history for an IR
     */
    getHistory(id: string): IRStorageEntry[];
    /**
     * Delete IR and its history
     */
    delete(id: string): boolean;
    /**
     * List all stored IRs
     */
    list(): string[];
    /**
     * Check if IR has changed since last store
     */
    hasChanged(id: string, ir: LumoraIR): boolean;
}
