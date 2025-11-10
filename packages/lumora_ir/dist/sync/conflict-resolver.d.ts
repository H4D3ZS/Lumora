import { ConflictRecord, ConflictDetector } from './conflict-detector';
import { ResolutionOption, ResolutionChoice } from './conflict-resolver-ui';
import { IRStorage } from '../storage/ir-storage';
import { LumoraIR } from '../types/ir-types';
/**
 * Resolution result
 */
export interface ResolutionResult {
    success: boolean;
    conflictId: string;
    option: ResolutionOption;
    filesRegenerated?: {
        react?: string;
        flutter?: string;
    };
    error?: string;
}
/**
 * Converter and generator functions
 */
export interface ResolverConverters {
    reactToIR?: (filePath: string) => Promise<LumoraIR>;
    flutterToIR?: (filePath: string) => Promise<LumoraIR>;
    irToReact?: (ir: LumoraIR, outputPath: string) => Promise<void>;
    irToFlutter?: (ir: LumoraIR, outputPath: string) => Promise<void>;
}
/**
 * Conflict Resolver
 * Applies conflict resolution and regenerates files
 */
export declare class ConflictResolver {
    private conflictDetector;
    private storage;
    private converters;
    constructor(conflictDetector: ConflictDetector, storage: IRStorage, converters?: ResolverConverters);
    /**
     * Apply selected resolution
     */
    applyResolution(choice: ResolutionChoice): Promise<ResolutionResult>;
    /**
     * Use React version (overwrite Flutter)
     */
    private useReactVersion;
    /**
     * Use Flutter version (overwrite React)
     */
    private useFlutterVersion;
    /**
     * Handle manual merge
     * Creates backup files and waits for user to manually merge
     */
    private handleManualMerge;
    /**
     * Complete manual merge after user has edited files
     */
    resolveManualMerge(conflictId: string, sourceFramework: 'react' | 'flutter'): Promise<ResolutionResult>;
    /**
     * Skip resolution (keep conflict for later)
     */
    private skipResolution;
    /**
     * Update IR store with new IR
     */
    private updateIRStore;
    /**
     * Regenerate React file from IR
     */
    private regenerateReact;
    /**
     * Regenerate Flutter file from IR
     */
    private regenerateFlutter;
    /**
     * Regenerate both files from IR
     */
    regenerateBothFiles(conflictId: string, ir: LumoraIR): Promise<{
        react: string;
        flutter: string;
    }>;
    /**
     * Clear conflict record
     */
    private clearConflictRecord;
    /**
     * Create backup of file
     */
    private createBackup;
    /**
     * Restore from backup
     */
    restoreFromBackup(backupPath: string, originalPath: string): Promise<void>;
    /**
     * List all backups for a file
     */
    listBackups(filePath: string): string[];
    /**
     * Clean up old backups
     */
    cleanupBackups(filePath: string, keepCount?: number): void;
    /**
     * Get all unresolved conflicts
     */
    getUnresolvedConflicts(): ConflictRecord[];
    /**
     * Get conflict by ID
     */
    getConflict(conflictId: string): ConflictRecord | undefined;
    /**
     * Set converters
     */
    setConverters(converters: ResolverConverters): void;
}
