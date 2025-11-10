"use strict";
/**
 * File Backup Handler - Preserves original files before overwriting
 *
 * Creates backup copies of files before any modifications to prevent data loss.
 * Supports multiple backup strategies and automatic cleanup.
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
exports.FileBackupHandler = exports.BackupStrategy = void 0;
exports.getFileBackupHandler = getFileBackupHandler;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Backup strategy
 */
var BackupStrategy;
(function (BackupStrategy) {
    BackupStrategy["TIMESTAMP"] = "timestamp";
    BackupStrategy["NUMBERED"] = "numbered";
    BackupStrategy["SINGLE"] = "single";
    BackupStrategy["DIRECTORY"] = "directory";
})(BackupStrategy || (exports.BackupStrategy = BackupStrategy = {}));
/**
 * File Backup Handler class
 */
class FileBackupHandler {
    constructor() {
        this.config = {
            strategy: BackupStrategy.TIMESTAMP,
            maxBackups: 5,
            enabled: true,
        };
        this.backupRecords = new Map();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!FileBackupHandler.instance) {
            FileBackupHandler.instance = new FileBackupHandler();
        }
        return FileBackupHandler.instance;
    }
    /**
     * Configure backup behavior
     */
    configure(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Create backup of a file
     */
    async createBackup(filePath) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            throw new Error(`Failed to create backup: ${error.message}`);
        }
        // Get file stats
        const stats = fs.statSync(backupPath);
        // Create backup record
        const record = {
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
    generateBackupPath(filePath) {
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
    getExistingBackups(filePath) {
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
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Cleanup old backups based on maxBackups setting
     */
    async cleanupOldBackups(filePath) {
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
            }
            catch (error) {
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
    async restoreFromBackup(backupPath, targetPath) {
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
        }
        catch (error) {
            throw new Error(`Failed to restore from backup: ${error.message}`);
        }
    }
    /**
     * Get backup records for a file
     */
    getBackupRecords(filePath) {
        return [...(this.backupRecords.get(filePath) || [])];
    }
    /**
     * Get all backup records
     */
    getAllBackupRecords() {
        return new Map(this.backupRecords);
    }
    /**
     * List all backups for a file
     */
    listBackups(filePath) {
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
    formatFileSize(bytes) {
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        }
        else if (bytes < 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }
        else {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
    }
    /**
     * Delete specific backup
     */
    async deleteBackup(backupPath) {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        try {
            fs.unlinkSync(backupPath);
        }
        catch (error) {
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
    async deleteAllBackups(filePath) {
        const records = this.getBackupRecords(filePath);
        let deleted = 0;
        for (const record of records) {
            try {
                if (fs.existsSync(record.backupFile)) {
                    fs.unlinkSync(record.backupFile);
                    deleted++;
                }
            }
            catch (error) {
                console.warn(`Failed to delete backup: ${record.backupFile}`);
            }
        }
        this.backupRecords.delete(filePath);
        return deleted;
    }
    /**
     * Get backup statistics
     */
    getBackupStats() {
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
    formatBackupStats() {
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
    clearRecords() {
        this.backupRecords.clear();
    }
}
exports.FileBackupHandler = FileBackupHandler;
/**
 * Get singleton instance of FileBackupHandler
 */
function getFileBackupHandler() {
    return FileBackupHandler.getInstance();
}
