/**
 * File Backup Handler - Preserves original files before overwriting
 *
 * Creates backup copies of files before any modifications to prevent data loss.
 * Supports multiple backup strategies and automatic cleanup.
 */
/**
 * Backup strategy
 */
export declare enum BackupStrategy {
    TIMESTAMP = "timestamp",// filename.ext.backup.TIMESTAMP
    NUMBERED = "numbered",// filename.ext.backup.1, .backup.2, etc.
    SINGLE = "single",// filename.ext.backup (overwrites previous)
    DIRECTORY = "directory"
}
/**
 * Backup configuration
 */
export interface BackupConfig {
    strategy: BackupStrategy;
    maxBackups?: number;
    backupDir?: string;
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
export declare class FileBackupHandler {
    private static instance;
    private config;
    private backupRecords;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): FileBackupHandler;
    /**
     * Configure backup behavior
     */
    configure(config: Partial<BackupConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): BackupConfig;
    /**
     * Create backup of a file
     */
    createBackup(filePath: string): Promise<BackupRecord | null>;
    /**
     * Generate backup file path based on strategy
     */
    private generateBackupPath;
    /**
     * Get existing backup files for a file
     */
    private getExistingBackups;
    /**
     * Escape regex special characters
     */
    private escapeRegex;
    /**
     * Cleanup old backups based on maxBackups setting
     */
    private cleanupOldBackups;
    /**
     * Restore file from backup
     */
    restoreFromBackup(backupPath: string, targetPath?: string): Promise<void>;
    /**
     * Get backup records for a file
     */
    getBackupRecords(filePath: string): BackupRecord[];
    /**
     * Get all backup records
     */
    getAllBackupRecords(): Map<string, BackupRecord[]>;
    /**
     * List all backups for a file
     */
    listBackups(filePath: string): string;
    /**
     * Format file size for display
     */
    private formatFileSize;
    /**
     * Delete specific backup
     */
    deleteBackup(backupPath: string): Promise<void>;
    /**
     * Delete all backups for a file
     */
    deleteAllBackups(filePath: string): Promise<number>;
    /**
     * Get backup statistics
     */
    getBackupStats(): {
        totalFiles: number;
        totalBackups: number;
        totalSize: number;
        oldestBackup?: Date;
        newestBackup?: Date;
    };
    /**
     * Format backup statistics
     */
    formatBackupStats(): string;
    /**
     * Clear all backup records (does not delete files)
     */
    clearRecords(): void;
}
/**
 * Get singleton instance of FileBackupHandler
 */
export declare function getFileBackupHandler(): FileBackupHandler;
