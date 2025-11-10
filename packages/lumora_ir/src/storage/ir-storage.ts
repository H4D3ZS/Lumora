import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { LumoraIR, IRStorageEntry } from '../types/ir-types';
import { IRValidator, getValidator } from '../validator/ir-validator';

/**
 * IR Storage System
 * Manages storage and versioning of Lumora IR
 */
export class IRStorage {
  private storageDir: string;
  private validator: IRValidator = getValidator();

  constructor(storageDir: string = '.lumora/ir') {
    this.storageDir = storageDir;
    this.ensureStorageDir();
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Generate checksum for IR
   */
  private generateChecksum(ir: LumoraIR): string {
    const content = JSON.stringify(ir, null, 2);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get file path for IR entry
   */
  private getFilePath(id: string, version?: number): string {
    const filename = version !== undefined 
      ? `${id}.v${version}.json`
      : `${id}.json`;
    return path.join(this.storageDir, filename);
  }

  /**
   * Get history directory path
   */
  private getHistoryDir(id: string): string {
    return path.join(this.storageDir, 'history', id);
  }

  /**
   * Store IR with versioning
   */
  store(id: string, ir: LumoraIR): IRStorageEntry {
    // Validate IR before storing
    this.validator.validateOrThrow(ir);

    const timestamp = Date.now();
    const checksum = this.generateChecksum(ir);

    // Get current version
    const currentVersion = this.getCurrentVersion(id);
    const newVersion = currentVersion + 1;

    // Archive previous version to history BEFORE writing new version
    if (currentVersion > 0) {
      this.archiveVersion(id, currentVersion);
    }

    const entry: IRStorageEntry = {
      id,
      ir,
      version: newVersion,
      timestamp,
      checksum,
    };

    // Store current version
    const filePath = this.getFilePath(id);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8');

    return entry;
  }

  /**
   * Retrieve IR by id
   */
  retrieve(id: string, version?: number): IRStorageEntry | null {
    try {
      let filePath: string;

      if (version !== undefined) {
        // Retrieve specific version from history
        const historyDir = this.getHistoryDir(id);
        filePath = path.join(historyDir, `v${version}.json`);
      } else {
        // Retrieve latest version
        filePath = this.getFilePath(id);
      }

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const entry: IRStorageEntry = JSON.parse(content);

      // Validate retrieved IR
      this.validator.validateOrThrow(entry.ir);

      return entry;
    } catch (error) {
      console.error(`Failed to retrieve IR ${id}:`, error);
      return null;
    }
  }

  /**
   * Get current version number
   */
  getCurrentVersion(id: string): number {
    const filePath = this.getFilePath(id);
    
    if (!fs.existsSync(filePath)) {
      return 0;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const entry: IRStorageEntry = JSON.parse(content);
      return entry.version;
    } catch {
      return 0;
    }
  }

  /**
   * Archive version to history
   */
  private archiveVersion(id: string, version: number): void {
    const currentPath = this.getFilePath(id);
    
    if (!fs.existsSync(currentPath)) {
      return;
    }

    const historyDir = this.getHistoryDir(id);
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }

    const historyPath = path.join(historyDir, `v${version}.json`);
    fs.copyFileSync(currentPath, historyPath);
  }

  /**
   * Get version history for an IR
   */
  getHistory(id: string): IRStorageEntry[] {
    const historyDir = this.getHistoryDir(id);
    
    if (!fs.existsSync(historyDir)) {
      return [];
    }

    const files = fs.readdirSync(historyDir)
      .filter(f => f.endsWith('.json'))
      .sort();

    const history: IRStorageEntry[] = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(historyDir, file), 'utf8');
        const entry: IRStorageEntry = JSON.parse(content);
        history.push(entry);
      } catch (error) {
        console.error(`Failed to read history file ${file}:`, error);
      }
    }

    return history;
  }

  /**
   * Delete IR and its history
   */
  delete(id: string): boolean {
    try {
      // Delete current version
      const filePath = this.getFilePath(id);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete history
      const historyDir = this.getHistoryDir(id);
      if (fs.existsSync(historyDir)) {
        fs.rmSync(historyDir, { recursive: true, force: true });
      }

      return true;
    } catch (error) {
      console.error(`Failed to delete IR ${id}:`, error);
      return false;
    }
  }

  /**
   * List all stored IRs
   */
  list(): string[] {
    const files = fs.readdirSync(this.storageDir)
      .filter(f => f.endsWith('.json') && !f.includes('.v'));

    return files.map(f => f.replace('.json', ''));
  }

  /**
   * Check if IR has changed since last store
   */
  hasChanged(id: string, ir: LumoraIR): boolean {
    const current = this.retrieve(id);
    
    if (!current) {
      return true;
    }

    const newChecksum = this.generateChecksum(ir);
    return newChecksum !== current.checksum;
  }
}
