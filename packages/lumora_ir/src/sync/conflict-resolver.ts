import * as fs from 'fs';
import * as path from 'path';
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
export class ConflictResolver {
  private conflictDetector: ConflictDetector;
  private storage: IRStorage;
  private converters: ResolverConverters;

  constructor(
    conflictDetector: ConflictDetector,
    storage: IRStorage,
    converters: ResolverConverters = {}
  ) {
    this.conflictDetector = conflictDetector;
    this.storage = storage;
    this.converters = converters;
  }

  /**
   * Apply selected resolution
   */
  async applyResolution(choice: ResolutionChoice): Promise<ResolutionResult> {
    const { option, conflict } = choice;

    try {
      switch (option) {
        case ResolutionOption.USE_REACT:
          return await this.useReactVersion(conflict);
        
        case ResolutionOption.USE_FLUTTER:
          return await this.useFlutterVersion(conflict);
        
        case ResolutionOption.MANUAL_MERGE:
          return await this.handleManualMerge(conflict);
        
        case ResolutionOption.SKIP:
          return this.skipResolution(conflict);
        
        default:
          throw new Error(`Unknown resolution option: ${option}`);
      }
    } catch (error) {
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
  private async useReactVersion(conflict: ConflictRecord): Promise<ResolutionResult> {
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
      option: ResolutionOption.USE_REACT,
      filesRegenerated: {
        flutter: flutterFile,
      },
    };
  }

  /**
   * Use Flutter version (overwrite React)
   */
  private async useFlutterVersion(conflict: ConflictRecord): Promise<ResolutionResult> {
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
      option: ResolutionOption.USE_FLUTTER,
      filesRegenerated: {
        react: reactFile,
      },
    };
  }

  /**
   * Handle manual merge
   * Creates backup files and waits for user to manually merge
   */
  private async handleManualMerge(conflict: ConflictRecord): Promise<ResolutionResult> {
    // Create backup files
    const reactBackup = await this.createBackup(conflict.reactFile);
    const flutterBackup = await this.createBackup(conflict.flutterFile);

    // Mark conflict as pending manual resolution
    // User will need to manually edit files and then call resolveManualMerge()

    return {
      success: true,
      conflictId: conflict.id,
      option: ResolutionOption.MANUAL_MERGE,
      filesRegenerated: {
        react: reactBackup,
        flutter: flutterBackup,
      },
    };
  }

  /**
   * Complete manual merge after user has edited files
   */
  async resolveManualMerge(
    conflictId: string,
    sourceFramework: 'react' | 'flutter'
  ): Promise<ResolutionResult> {
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
    let regeneratedFile: string;
    if (sourceFramework === 'react') {
      regeneratedFile = await this.regenerateFlutter(ir, conflict.flutterFile);
    } else {
      regeneratedFile = await this.regenerateReact(ir, conflict.reactFile);
    }

    // Clear conflict record
    this.clearConflictRecord(conflictId);

    return {
      success: true,
      conflictId,
      option: ResolutionOption.MANUAL_MERGE,
      filesRegenerated: {
        [sourceFramework === 'react' ? 'flutter' : 'react']: regeneratedFile,
      },
    };
  }

  /**
   * Skip resolution (keep conflict for later)
   */
  private skipResolution(conflict: ConflictRecord): ResolutionResult {
    // Don't clear the conflict, just return success
    return {
      success: true,
      conflictId: conflict.id,
      option: ResolutionOption.SKIP,
    };
  }

  /**
   * Update IR store with new IR
   */
  private async updateIRStore(irId: string, ir: LumoraIR): Promise<void> {
    this.storage.store(irId, ir);
  }

  /**
   * Regenerate React file from IR
   */
  private async regenerateReact(ir: LumoraIR, outputPath: string): Promise<string> {
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
  private async regenerateFlutter(ir: LumoraIR, outputPath: string): Promise<string> {
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
  async regenerateBothFiles(
    conflictId: string,
    ir: LumoraIR
  ): Promise<{ react: string; flutter: string }> {
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
  private clearConflictRecord(conflictId: string): void {
    this.conflictDetector.resolveConflict(conflictId);
  }

  /**
   * Create backup of file
   */
  private async createBackup(filePath: string): Promise<string> {
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
    } catch (error) {
      console.error(`Failed to create backup of ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupPath: string, originalPath: string): Promise<void> {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    try {
      fs.copyFileSync(backupPath, originalPath);
    } catch (error) {
      console.error(`Failed to restore from backup ${backupPath}:`, error);
      throw error;
    }
  }

  /**
   * List all backups for a file
   */
  listBackups(filePath: string): string[] {
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
    } catch (error) {
      console.error(`Failed to list backups for ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Clean up old backups
   */
  cleanupBackups(filePath: string, keepCount: number = 5): void {
    const backups = this.listBackups(filePath);
    
    if (backups.length <= keepCount) {
      return;
    }

    const toDelete = backups.slice(keepCount);
    for (const backup of toDelete) {
      try {
        fs.unlinkSync(backup);
      } catch (error) {
        console.error(`Failed to delete backup ${backup}:`, error);
      }
    }
  }

  /**
   * Get all unresolved conflicts
   */
  getUnresolvedConflicts(): ConflictRecord[] {
    return this.conflictDetector.getUnresolvedConflicts();
  }

  /**
   * Get conflict by ID
   */
  getConflict(conflictId: string): ConflictRecord | undefined {
    return this.conflictDetector.getConflict(conflictId);
  }

  /**
   * Set converters
   */
  setConverters(converters: ResolverConverters): void {
    this.converters = { ...this.converters, ...converters };
  }
}
