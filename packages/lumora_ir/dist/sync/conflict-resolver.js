"use strict";
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
exports.ConflictResolver = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const conflict_resolver_ui_1 = require("./conflict-resolver-ui");
/**
 * Conflict Resolver
 * Applies conflict resolution and regenerates files
 */
class ConflictResolver {
    constructor(conflictDetector, storage, converters = {}) {
        this.conflictDetector = conflictDetector;
        this.storage = storage;
        this.converters = converters;
    }
    /**
     * Apply selected resolution
     */
    async applyResolution(choice) {
        const { option, conflict } = choice;
        try {
            switch (option) {
                case conflict_resolver_ui_1.ResolutionOption.USE_REACT:
                    return await this.useReactVersion(conflict);
                case conflict_resolver_ui_1.ResolutionOption.USE_FLUTTER:
                    return await this.useFlutterVersion(conflict);
                case conflict_resolver_ui_1.ResolutionOption.MANUAL_MERGE:
                    return await this.handleManualMerge(conflict);
                case conflict_resolver_ui_1.ResolutionOption.SKIP:
                    return this.skipResolution(conflict);
                default:
                    throw new Error(`Unknown resolution option: ${option}`);
            }
        }
        catch (error) {
            return {
                success: false,
                conflictId: conflict.id,
                option,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Use React version (overwrite Flutter)
     */
    async useReactVersion(conflict) {
        // Convert React file to IR
        if (!this.converters.reactToIR) {
            throw new Error('React to IR converter not configured');
        }
        const ir = await this.converters.reactToIR(conflict.reactFile);
        // Update IR store
        await this.updateIRStore(conflict.id, ir);
        // Regenerate Flutter file
        const flutterFile = await this.regenerateFlutter(ir, conflict.flutterFile);
        // Clear conflict record
        this.clearConflictRecord(conflict.id);
        return {
            success: true,
            conflictId: conflict.id,
            option: conflict_resolver_ui_1.ResolutionOption.USE_REACT,
            filesRegenerated: {
                flutter: flutterFile,
            },
        };
    }
    /**
     * Use Flutter version (overwrite React)
     */
    async useFlutterVersion(conflict) {
        // Convert Flutter file to IR
        if (!this.converters.flutterToIR) {
            throw new Error('Flutter to IR converter not configured');
        }
        const ir = await this.converters.flutterToIR(conflict.flutterFile);
        // Update IR store
        await this.updateIRStore(conflict.id, ir);
        // Regenerate React file
        const reactFile = await this.regenerateReact(ir, conflict.reactFile);
        // Clear conflict record
        this.clearConflictRecord(conflict.id);
        return {
            success: true,
            conflictId: conflict.id,
            option: conflict_resolver_ui_1.ResolutionOption.USE_FLUTTER,
            filesRegenerated: {
                react: reactFile,
            },
        };
    }
    /**
     * Handle manual merge
     * Creates backup files and waits for user to manually merge
     */
    async handleManualMerge(conflict) {
        // Create backup files
        const reactBackup = await this.createBackup(conflict.reactFile);
        const flutterBackup = await this.createBackup(conflict.flutterFile);
        // Mark conflict as pending manual resolution
        // User will need to manually edit files and then call resolveManualMerge()
        return {
            success: true,
            conflictId: conflict.id,
            option: conflict_resolver_ui_1.ResolutionOption.MANUAL_MERGE,
            filesRegenerated: {
                react: reactBackup,
                flutter: flutterBackup,
            },
        };
    }
    /**
     * Complete manual merge after user has edited files
     */
    async resolveManualMerge(conflictId, sourceFramework) {
        const conflict = this.conflictDetector.getConflict(conflictId);
        if (!conflict) {
            throw new Error(`Conflict not found: ${conflictId}`);
        }
        // Convert the manually merged file to IR
        const sourceFile = sourceFramework === 'react' ? conflict.reactFile : conflict.flutterFile;
        const converter = sourceFramework === 'react' ? this.converters.reactToIR : this.converters.flutterToIR;
        if (!converter) {
            throw new Error(`${sourceFramework} to IR converter not configured`);
        }
        const ir = await converter(sourceFile);
        // Update IR store
        await this.updateIRStore(conflictId, ir);
        // Regenerate the other framework's file
        let regeneratedFile;
        if (sourceFramework === 'react') {
            regeneratedFile = await this.regenerateFlutter(ir, conflict.flutterFile);
        }
        else {
            regeneratedFile = await this.regenerateReact(ir, conflict.reactFile);
        }
        // Clear conflict record
        this.clearConflictRecord(conflictId);
        return {
            success: true,
            conflictId,
            option: conflict_resolver_ui_1.ResolutionOption.MANUAL_MERGE,
            filesRegenerated: {
                [sourceFramework === 'react' ? 'flutter' : 'react']: regeneratedFile,
            },
        };
    }
    /**
     * Skip resolution (keep conflict for later)
     */
    skipResolution(conflict) {
        // Don't clear the conflict, just return success
        return {
            success: true,
            conflictId: conflict.id,
            option: conflict_resolver_ui_1.ResolutionOption.SKIP,
        };
    }
    /**
     * Update IR store with new IR
     */
    async updateIRStore(irId, ir) {
        this.storage.store(irId, ir);
    }
    /**
     * Regenerate React file from IR
     */
    async regenerateReact(ir, outputPath) {
        if (!this.converters.irToReact) {
            throw new Error('IR to React generator not configured');
        }
        // Create backup before overwriting
        await this.createBackup(outputPath);
        // Generate React file
        await this.converters.irToReact(ir, outputPath);
        return outputPath;
    }
    /**
     * Regenerate Flutter file from IR
     */
    async regenerateFlutter(ir, outputPath) {
        if (!this.converters.irToFlutter) {
            throw new Error('IR to Flutter generator not configured');
        }
        // Create backup before overwriting
        await this.createBackup(outputPath);
        // Generate Flutter file
        await this.converters.irToFlutter(ir, outputPath);
        return outputPath;
    }
    /**
     * Regenerate both files from IR
     */
    async regenerateBothFiles(conflictId, ir) {
        const conflict = this.conflictDetector.getConflict(conflictId);
        if (!conflict) {
            throw new Error(`Conflict not found: ${conflictId}`);
        }
        const reactFile = await this.regenerateReact(ir, conflict.reactFile);
        const flutterFile = await this.regenerateFlutter(ir, conflict.flutterFile);
        return { react: reactFile, flutter: flutterFile };
    }
    /**
     * Clear conflict record
     */
    clearConflictRecord(conflictId) {
        this.conflictDetector.resolveConflict(conflictId);
    }
    /**
     * Create backup of file
     */
    async createBackup(filePath) {
        if (!fs.existsSync(filePath)) {
            return filePath;
        }
        const timestamp = Date.now();
        const ext = path.extname(filePath);
        const base = filePath.slice(0, -ext.length);
        const backupPath = `${base}.backup.${timestamp}${ext}`;
        try {
            fs.copyFileSync(filePath, backupPath);
            return backupPath;
        }
        catch (error) {
            console.error(`Failed to create backup of ${filePath}:`, error);
            throw error;
        }
    }
    /**
     * Restore from backup
     */
    async restoreFromBackup(backupPath, originalPath) {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        try {
            fs.copyFileSync(backupPath, originalPath);
        }
        catch (error) {
            console.error(`Failed to restore from backup ${backupPath}:`, error);
            throw error;
        }
    }
    /**
     * List all backups for a file
     */
    listBackups(filePath) {
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const base = path.basename(filePath, ext);
        const backupPattern = `${base}.backup.`;
        try {
            const files = fs.readdirSync(dir);
            return files
                .filter(file => file.startsWith(backupPattern))
                .map(file => path.join(dir, file))
                .sort()
                .reverse(); // Most recent first
        }
        catch (error) {
            console.error(`Failed to list backups for ${filePath}:`, error);
            return [];
        }
    }
    /**
     * Clean up old backups
     */
    cleanupBackups(filePath, keepCount = 5) {
        const backups = this.listBackups(filePath);
        if (backups.length <= keepCount) {
            return;
        }
        const toDelete = backups.slice(keepCount);
        for (const backup of toDelete) {
            try {
                fs.unlinkSync(backup);
            }
            catch (error) {
                console.error(`Failed to delete backup ${backup}:`, error);
            }
        }
    }
    /**
     * Get all unresolved conflicts
     */
    getUnresolvedConflicts() {
        return this.conflictDetector.getUnresolvedConflicts();
    }
    /**
     * Get conflict by ID
     */
    getConflict(conflictId) {
        return this.conflictDetector.getConflict(conflictId);
    }
    /**
     * Set converters
     */
    setConverters(converters) {
        this.converters = { ...this.converters, ...converters };
    }
}
exports.ConflictResolver = ConflictResolver;
