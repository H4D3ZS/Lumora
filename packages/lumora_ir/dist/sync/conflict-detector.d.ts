import { FileChangeEvent } from './file-watcher';
/**
 * Conflict record
 */
export interface ConflictRecord {
    id: string;
    reactFile: string;
    flutterFile: string;
    reactTimestamp: number;
    flutterTimestamp: number;
    irVersion: number;
    detectedAt: number;
    resolved: boolean;
}
/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
    hasConflict: boolean;
    conflict?: ConflictRecord;
}
/**
 * Conflict detector configuration
 */
export interface ConflictDetectorConfig {
    conflictWindowMs?: number;
    storageDir?: string;
}
/**
 * Conflict Detector
 * Detects simultaneous changes to both React and Flutter versions
 */
export declare class ConflictDetector {
    private config;
    private storage;
    private recentChanges;
    private conflicts;
    private conflictHandlers;
    constructor(config?: ConflictDetectorConfig);
    /**
     * Check for conflicts when processing a change
     */
    checkConflict(event: FileChangeEvent, irId: string, reactFile: string, flutterFile: string): ConflictDetectionResult;
    /**
     * Compare timestamps of React and Flutter files
     * Returns true if both files have been modified recently
     */
    compareFileTimestamps(reactFile: string, flutterFile: string): {
        hasConflict: boolean;
        reactTimestamp?: number;
        flutterTimestamp?: number;
        timeDiff?: number;
    };
    /**
     * Compare IR versions for a given ID
     * Returns true if IR versions indicate conflicting changes
     */
    compareIRVersions(irId: string): {
        hasConflict: boolean;
        currentVersion?: number;
        versionHistory?: number[];
    };
    /**
     * Identify conflicting changes between React and Flutter files
     * Performs comprehensive conflict detection
     */
    identifyConflictingChanges(irId: string, reactFile: string, flutterFile: string): {
        hasConflict: boolean;
        conflictType?: 'timestamp' | 'version' | 'both';
        details?: any;
    };
    /**
     * Create conflict record
     */
    private createConflict;
    /**
     * Clean up old recent changes
     */
    private cleanupRecentChanges;
    /**
     * Get all conflicts
     */
    getConflicts(): ConflictRecord[];
    /**
     * Get unresolved conflicts
     */
    getUnresolvedConflicts(): ConflictRecord[];
    /**
     * Get conflict by ID
     */
    getConflict(id: string): ConflictRecord | undefined;
    /**
     * Mark conflict as resolved
     */
    resolveConflict(id: string): boolean;
    /**
     * Delete conflict
     */
    deleteConflict(id: string): boolean;
    /**
     * Register conflict handler
     */
    onConflict(handler: (conflict: ConflictRecord) => void): void;
    /**
     * Remove conflict handler
     */
    removeConflictHandler(handler: (conflict: ConflictRecord) => void): void;
    /**
     * Save conflicts to disk
     */
    private saveConflicts;
    /**
     * Load conflicts from disk
     */
    private loadConflicts;
    /**
     * Clear all conflicts
     */
    clearConflicts(): void;
    /**
     * Clear recent changes
     */
    clearRecentChanges(): void;
}
