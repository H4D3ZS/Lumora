/**
 * File Backup Handler - Preserves original files before overwriting
 * 
 * Creates backup copies of files before any modifications to prevent data loss.
 * Supports multiple backup strategies and automatic cleanup.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Backup strategy
 */
export enum BackupStrategy {
  TIMESTAMP = 'timestamp',       // filename.ext.backup.TIMESTAMP
  NUMBERED = 'numbered',          // filename.ext.backup.1, .backup.2, etc.
  SINGLE = 'single',              // filename.ext.backup (overwrites previous)
  DIRECTORY = 'directory',        // .lumora/backups/filename.ext.TIMESTAMP
}

/**
 * Backup configuration
 */
export interface BackupConfig {
  strategy: BackupStrategy;
  maxBackups?: number;           // Max number of backups to keep (for numbered/timestamp)
  backupDir?: string;            // Directory for backups (for directory strategy)
  enabled: boolean;
}

/**
 * Backup record
 */
export interface BackupRecord {
  originalFile: string;
  backupFile: string;
  timestamp: number;
  size: number;
  checksum?: string;
}

/**
 * File Backup Handler class
 */
export class FileBackupHandler {
  private static instance: FileBackupHandler;
  private config: BackupConfig = {
    strategy: BackupStrategy.TIMESTAMP,
    maxBackups: 5,
    enabled: true,
  };
  private backupRecords: Map<string, BackupRecord[]> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): FileBackupHandler {
    if (!FileBackupHandler.instance) {
      FileBackupHandler.instance = new FileBackupHandler();
    }
    return FileBackupHandler.instance;
  }

  /**
   * Configure backup behavior
   */
  public configure(config: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): BackupConfig {
    return { ...this.config };
  }

  /**
   * Create backup of a file
   */
  public async createBackup(filePath: string): Promise<BackupRecord | null> {
    if (!this.config.enabled) {
      return null;
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Cannot backup non-existent file: ${filePath}`);
    }

    // Check if file is readable
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`Cannot read file for backup: ${filePath}`);
    }

    // Generate backup file path
    const backupPath = this.generateBackupPath(filePath);

    // Ensure backup directory exists
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copy file to backup location
    try {
      fs.copyFileSync(filePath, backupPath);
    } catch (error: any) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }

    // Get file stats
    const stats = fs.statSync(backupPath);

    // Create backup record
    const record: BackupRecord = {
      originalFile: filePath,
      backupFile: backupPath,
      timestamp: Date.now(),
      size: stats.size,
    };

    // Store record
    const records = this.backupRecords.get(filePath) || [];
    records.push(record);
    this.backupRecords.set(filePath, records);

    // Cleanup old backups if needed
    await this.cleanupOldBackups(filePath);

    return record;
  }

  /**
   * Generate backup file path based on strategy
   */
  private generateBackupPath(filePath: string): string {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const basename = path.basename(filePath, ext);

    switch (this.config.strategy) {
      case BackupStrategy.TIMESTAMP: {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return path.join(dir, `${basename}${ext}.backup.${timestamp}`);
      }

      case BackupStrategy.NUMBERED: {
        const existingBackups = this.getExistingBackups(filePath);
        const nextNumber = existingBackups.length + 1;
        return path.join(dir, `${basename}${ext}.backup.${nextNumber}`);
      }

      case BackupStrategy.SINGLE: {
        return path.join(dir, `${basename}${ext}.backup`);
      }

      case BackupStrategy.DIRECTORY: {
        const backupDir = this.config.backupDir || path.join(dir, '.lumora', 'backups');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return path.join(backupDir, `${basename}${ext}.${timestamp}`);
      }

      default:
        return path.join(dir, `${basename}${ext}.backup`);
    }
  }

  /**
   * Get existing backup files for a file
   */
  private getExistingBackups(filePath: string): string[] {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const basename = path.basename(filePath, ext);

    if (!fs.existsSync(dir)) {
      return [];
    }

    const files = fs.readdirSync(dir);
    const backupPattern = new RegExp(`^${this.escapeRegex(basename)}${this.escapeRegex(ext)}\\.backup`);

    return files
      .filter(file => backupPattern.test(file))
      .map(file => path.join(dir, file))
      .sort();
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Cleanup old backups based on maxBackups setting
   */
  private async cleanupOldBackups(filePath: string): Promise<void> {
    if (!this.config.maxBackups || this.config.strategy === BackupStrategy.SINGLE) {
      return;
    }

    const records = this.backupRecords.get(filePath) || [];
    
    if (records.length <= this.config.maxBackups) {
      return;
    }

    // Sort by timestamp (oldest first)
    records.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest backups
    const toRemove = records.slice(0, records.length - this.config.maxBackups);
    
    for (const record of toRemove) {
      try {
        if (fs.existsSync(record.backupFile)) {
          fs.unlinkSync(record.backupFile);
        }
      } catch (error) {
        console.warn(`Failed to delete old backup: ${record.backupFile}`);
      }
    }

    // Update records
    const remaining = records.slice(records.length - this.config.maxBackups);
    this.backupRecords.set(filePath, remaining);
  }

  /**
   * Restore file from backup
   */
  public async restoreFromBackup(backupPath: string, targetPath?: string): Promise<void> {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    // Find original file path from records
    let originalPath = targetPath;
    
    if (!originalPath) {
      for (const [original, records] of this.backupRecords.entries()) {
        if (records.some(r => r.backupFile === backupPath)) {
          originalPath = original;
          break;
        }
      }
    }

    if (!originalPath) {
      throw new Error('Cannot determine original file path for restoration');
    }

    // Copy backup to original location
    try {
      fs.copyFileSync(backupPath, originalPath);
    } catch (error: any) {
      throw new Error(`Failed to restore from backup: ${error.message}`);
    }
  }

  /**
   * Get backup records for a file
   */
  public getBackupRecords(filePath: string): BackupRecord[] {
    return [...(this.backupRecords.get(filePath) || [])];
  }

  /**
   * Get all backup records
   */
  public getAllBackupRecords(): Map<string, BackupRecord[]> {
    return new Map(this.backupRecords);
  }

  /**
   * List all backups for a file
   */
  public listBackups(filePath: string): string {
    const records = this.getBackupRecords(filePath);

    if (records.length === 0) {
      return `No backups found for: ${filePath}`;
    }

    let output = `\nBackups for: ${filePath}\n`;
    output += '─'.repeat(60) + '\n\n';

    records.forEach((record, index) => {
      const date = new Date(record.timestamp);
      const size = this.formatFileSize(record.size);
      
      output += `${index + 1}. ${path.basename(record.backupFile)}\n`;
      output += `   Created: ${date.toISOString()}\n`;
      output += `   Size: ${size}\n`;
      output += `   Path: ${record.backupFile}\n\n`;
    });

    return output;
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }

  /**
   * Delete specific backup
   */
  public async deleteBackup(backupPath: string): Promise<void> {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    try {
      fs.unlinkSync(backupPath);
    } catch (error: any) {
      throw new Error(`Failed to delete backup: ${error.message}`);
    }

    // Remove from records
    for (const [filePath, records] of this.backupRecords.entries()) {
      const filtered = records.filter(r => r.backupFile !== backupPath);
      if (filtered.length !== records.length) {
        this.backupRecords.set(filePath, filtered);
        break;
      }
    }
  }

  /**
   * Delete all backups for a file
   */
  public async deleteAllBackups(filePath: string): Promise<number> {
    const records = this.getBackupRecords(filePath);
    let deleted = 0;

    for (const record of records) {
      try {
        if (fs.existsSync(record.backupFile)) {
          fs.unlinkSync(record.backupFile);
          deleted++;
        }
      } catch (error) {
        console.warn(`Failed to delete backup: ${record.backupFile}`);
      }
    }

    this.backupRecords.delete(filePath);
    return deleted;
  }

  /**
   * Get backup statistics
   */
  public getBackupStats(): {
    totalFiles: number;
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
  } {
    let totalBackups = 0;
    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    for (const records of this.backupRecords.values()) {
      totalBackups += records.length;
      
      for (const record of records) {
        totalSize += record.size;
        oldestTimestamp = Math.min(oldestTimestamp, record.timestamp);
        newestTimestamp = Math.max(newestTimestamp, record.timestamp);
      }
    }

    return {
      totalFiles: this.backupRecords.size,
      totalBackups,
      totalSize,
      oldestBackup: oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : undefined,
      newestBackup: newestTimestamp > 0 ? new Date(newestTimestamp) : undefined,
    };
  }

  /**
   * Format backup statistics
   */
  public formatBackupStats(): string {
    const stats = this.getBackupStats();

    let output = '\n';
    output += '═══════════════════════════════════════════════════════\n';
    output += '  Backup Statistics\n';
    output += '═══════════════════════════════════════════════════════\n\n';

    output += `Files with backups: ${stats.totalFiles}\n`;
    output += `Total backups: ${stats.totalBackups}\n`;
    output += `Total size: ${this.formatFileSize(stats.totalSize)}\n`;

    if (stats.oldestBackup) {
      output += `Oldest backup: ${stats.oldestBackup.toISOString()}\n`;
    }

    if (stats.newestBackup) {
      output += `Newest backup: ${stats.newestBackup.toISOString()}\n`;
    }

    output += '\n';
    output += '═══════════════════════════════════════════════════════\n';

    return output;
  }

  /**
   * Clear all backup records (does not delete files)
   */
  public clearRecords(): void {
    this.backupRecords.clear();
  }
}

/**
 * Get singleton instance of FileBackupHandler
 */
export function getFileBackupHandler(): FileBackupHandler {
  return FileBackupHandler.getInstance();
}
