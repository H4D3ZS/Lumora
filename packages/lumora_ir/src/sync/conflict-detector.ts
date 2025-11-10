import * as fs from 'fs';
import * as path from 'path';
import { FileChangeEvent } from './file-watcher';
import { IRStorage } from '../storage/ir-storage';

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
export class ConflictDetector {
  private config: Required<ConflictDetectorConfig>;
  private storage: IRStorage;
  private recentChanges: Map<string, FileChangeEvent> = new Map();
  private conflicts: Map<string, ConflictRecord> = new Map();
  private conflictHandlers: Array<(conflict: ConflictRecord) => void> = [];

  constructor(config: ConflictDetectorConfig = {}) {
    this.config = {
      conflictWindowMs: config.conflictWindowMs || 5000, // 5 seconds
      storageDir: config.storageDir || '.lumora/ir',
    };
    this.storage = new IRStorage(this.config.storageDir);
    this.loadConflicts();
  }

  /**
   * Check for conflicts when processing a change
   */
  checkConflict(
    event: FileChangeEvent,
    irId: string,
    reactFile: string,
    flutterFile: string
  ): ConflictDetectionResult {
    const now = Date.now();
    const oppositeFramework = event.framework === 'react' ? 'flutter' : 'react';
    const oppositeFile = event.framework === 'react' ? flutterFile : reactFile;

    // Check if opposite framework file was recently changed
    const recentChange = this.recentChanges.get(oppositeFile);

    if (recentChange) {
      const timeDiff = now - recentChange.timestamp;

      // If both files changed within conflict window, it's a conflict
      if (timeDiff <= this.config.conflictWindowMs) {
        const conflict = this.createConflict(
          irId,
          reactFile,
          flutterFile,
          event.framework === 'react' ? event.timestamp : recentChange.timestamp,
          event.framework === 'flutter' ? event.timestamp : recentChange.timestamp
        );

        return {
          hasConflict: true,
          conflict,
        };
      }
    }

    // Record this change
    this.recentChanges.set(event.filePath, event);

    // Clean up old changes
    this.cleanupRecentChanges(now);

    return {
      hasConflict: false,
    };
  }

  /**
   * Compare timestamps of React and Flutter files
   * Returns true if both files have been modified recently
   */
  compareFileTimestamps(reactFile: string, flutterFile: string): {
    hasConflict: boolean;
    reactTimestamp?: number;
    flutterTimestamp?: number;
    timeDiff?: number;
  } {
    try {
      const reactStats = fs.existsSync(reactFile) ? fs.statSync(reactFile) : null;
      const flutterStats = fs.existsSync(flutterFile) ? fs.statSync(flutterFile) : null;

      if (!reactStats || !flutterStats) {
        return { hasConflict: false };
      }

      const reactTimestamp = reactStats.mtimeMs;
      const flutterTimestamp = flutterStats.mtimeMs;
      const timeDiff = Math.abs(reactTimestamp - flutterTimestamp);

      // If both files modified within conflict window, potential conflict
      const hasConflict = timeDiff <= this.config.conflictWindowMs;

      return {
        hasConflict,
        reactTimestamp,
        flutterTimestamp,
        timeDiff,
      };
    } catch (error) {
      console.error('Error comparing file timestamps:', error);
      return { hasConflict: false };
    }
  }

  /**
   * Compare IR versions for a given ID
   * Returns true if IR versions indicate conflicting changes
   */
  compareIRVersions(irId: string): {
    hasConflict: boolean;
    currentVersion?: number;
    versionHistory?: number[];
  } {
    try {
      const currentVersion = this.storage.getCurrentVersion(irId);
      const history = this.storage.getHistory(irId);

      if (!history || history.length === 0) {
        return { hasConflict: false };
      }

      // Check if there are multiple recent versions (indicating rapid changes)
      const recentVersions = history
        .filter(entry => Date.now() - entry.timestamp <= this.config.conflictWindowMs)
        .map(entry => entry.version);

      const hasConflict = recentVersions.length > 1;

      return {
        hasConflict,
        currentVersion,
        versionHistory: recentVersions,
      };
    } catch (error) {
      console.error('Error comparing IR versions:', error);
      return { hasConflict: false };
    }
  }

  /**
   * Identify conflicting changes between React and Flutter files
   * Performs comprehensive conflict detection
   */
  identifyConflictingChanges(
    irId: string,
    reactFile: string,
    flutterFile: string
  ): {
    hasConflict: boolean;
    conflictType?: 'timestamp' | 'version' | 'both';
    details?: any;
  } {
    const timestampResult = this.compareFileTimestamps(reactFile, flutterFile);
    const versionResult = this.compareIRVersions(irId);

    const hasTimestampConflict = timestampResult.hasConflict;
    const hasVersionConflict = versionResult.hasConflict;

    if (!hasTimestampConflict && !hasVersionConflict) {
      return { hasConflict: false };
    }

    let conflictType: 'timestamp' | 'version' | 'both';
    if (hasTimestampConflict && hasVersionConflict) {
      conflictType = 'both';
    } else if (hasTimestampConflict) {
      conflictType = 'timestamp';
    } else {
      conflictType = 'version';
    }

    return {
      hasConflict: true,
      conflictType,
      details: {
        timestamp: timestampResult,
        version: versionResult,
      },
    };
  }

  /**
   * Create conflict record
   */
  private createConflict(
    id: string,
    reactFile: string,
    flutterFile: string,
    reactTimestamp: number,
    flutterTimestamp: number
  ): ConflictRecord {
    // Get current IR version
    const irVersion = this.storage.getCurrentVersion(id);

    const conflict: ConflictRecord = {
      id,
      reactFile,
      flutterFile,
      reactTimestamp,
      flutterTimestamp,
      irVersion,
      detectedAt: Date.now(),
      resolved: false,
    };

    // Store conflict
    this.conflicts.set(id, conflict);
    this.saveConflicts();

    // Notify handlers
    for (const handler of this.conflictHandlers) {
      try {
        handler(conflict);
      } catch (error) {
        console.error('Error in conflict handler:', error);
      }
    }

    return conflict;
  }

  /**
   * Clean up old recent changes
   */
  private cleanupRecentChanges(now: number): void {
    for (const [filePath, event] of this.recentChanges.entries()) {
      if (now - event.timestamp > this.config.conflictWindowMs * 2) {
        this.recentChanges.delete(filePath);
      }
    }
  }

  /**
   * Get all conflicts
   */
  getConflicts(): ConflictRecord[] {
    return Array.from(this.conflicts.values());
  }

  /**
   * Get unresolved conflicts
   */
  getUnresolvedConflicts(): ConflictRecord[] {
    return Array.from(this.conflicts.values()).filter(c => !c.resolved);
  }

  /**
   * Get conflict by ID
   */
  getConflict(id: string): ConflictRecord | undefined {
    return this.conflicts.get(id);
  }

  /**
   * Mark conflict as resolved
   */
  resolveConflict(id: string): boolean {
    const conflict = this.conflicts.get(id);
    if (!conflict) {
      return false;
    }

    conflict.resolved = true;
    this.saveConflicts();
    return true;
  }

  /**
   * Delete conflict
   */
  deleteConflict(id: string): boolean {
    const deleted = this.conflicts.delete(id);
    if (deleted) {
      this.saveConflicts();
    }
    return deleted;
  }

  /**
   * Register conflict handler
   */
  onConflict(handler: (conflict: ConflictRecord) => void): void {
    this.conflictHandlers.push(handler);
  }

  /**
   * Remove conflict handler
   */
  removeConflictHandler(handler: (conflict: ConflictRecord) => void): void {
    const index = this.conflictHandlers.indexOf(handler);
    if (index !== -1) {
      this.conflictHandlers.splice(index, 1);
    }
  }

  /**
   * Save conflicts to disk
   */
  private saveConflicts(): void {
    const conflictsFile = path.join(this.config.storageDir, 'conflicts.json');
    const conflictsArray = Array.from(this.conflicts.values());
    
    try {
      fs.writeFileSync(conflictsFile, JSON.stringify(conflictsArray, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save conflicts:', error);
    }
  }

  /**
   * Load conflicts from disk
   */
  private loadConflicts(): void {
    const conflictsFile = path.join(this.config.storageDir, 'conflicts.json');
    
    if (!fs.existsSync(conflictsFile)) {
      return;
    }

    try {
      const content = fs.readFileSync(conflictsFile, 'utf8');
      const conflictsArray: ConflictRecord[] = JSON.parse(content);
      
      for (const conflict of conflictsArray) {
        this.conflicts.set(conflict.id, conflict);
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }

  /**
   * Clear all conflicts
   */
  clearConflicts(): void {
    this.conflicts.clear();
    this.saveConflicts();
  }

  /**
   * Clear recent changes
   */
  clearRecentChanges(): void {
    this.recentChanges.clear();
  }
}

