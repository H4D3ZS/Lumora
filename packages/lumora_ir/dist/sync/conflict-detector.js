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
exports.ConflictDetector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ir_storage_1 = require("../storage/ir-storage");
/**
 * Conflict Detector
 * Detects simultaneous changes to both React and Flutter versions
 */
class ConflictDetector {
    constructor(config = {}) {
        this.recentChanges = new Map();
        this.conflicts = new Map();
        this.conflictHandlers = [];
        this.config = {
            conflictWindowMs: config.conflictWindowMs || 5000, // 5 seconds
            storageDir: config.storageDir || '.lumora/ir',
        };
        this.storage = new ir_storage_1.IRStorage(this.config.storageDir);
        this.loadConflicts();
    }
    /**
     * Check for conflicts when processing a change
     */
    checkConflict(event, irId, reactFile, flutterFile) {
        const now = Date.now();
        const oppositeFramework = event.framework === 'react' ? 'flutter' : 'react';
        const oppositeFile = event.framework === 'react' ? flutterFile : reactFile;
        // Check if opposite framework file was recently changed
        const recentChange = this.recentChanges.get(oppositeFile);
        if (recentChange) {
            const timeDiff = now - recentChange.timestamp;
            // If both files changed within conflict window, it's a conflict
            if (timeDiff <= this.config.conflictWindowMs) {
                const conflict = this.createConflict(irId, reactFile, flutterFile, event.framework === 'react' ? event.timestamp : recentChange.timestamp, event.framework === 'flutter' ? event.timestamp : recentChange.timestamp);
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
    compareFileTimestamps(reactFile, flutterFile) {
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
        }
        catch (error) {
            console.error('Error comparing file timestamps:', error);
            return { hasConflict: false };
        }
    }
    /**
     * Compare IR versions for a given ID
     * Returns true if IR versions indicate conflicting changes
     */
    compareIRVersions(irId) {
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
        }
        catch (error) {
            console.error('Error comparing IR versions:', error);
            return { hasConflict: false };
        }
    }
    /**
     * Identify conflicting changes between React and Flutter files
     * Performs comprehensive conflict detection
     */
    identifyConflictingChanges(irId, reactFile, flutterFile) {
        const timestampResult = this.compareFileTimestamps(reactFile, flutterFile);
        const versionResult = this.compareIRVersions(irId);
        const hasTimestampConflict = timestampResult.hasConflict;
        const hasVersionConflict = versionResult.hasConflict;
        if (!hasTimestampConflict && !hasVersionConflict) {
            return { hasConflict: false };
        }
        let conflictType;
        if (hasTimestampConflict && hasVersionConflict) {
            conflictType = 'both';
        }
        else if (hasTimestampConflict) {
            conflictType = 'timestamp';
        }
        else {
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
    createConflict(id, reactFile, flutterFile, reactTimestamp, flutterTimestamp) {
        // Get current IR version
        const irVersion = this.storage.getCurrentVersion(id);
        const conflict = {
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
            }
            catch (error) {
                console.error('Error in conflict handler:', error);
            }
        }
        return conflict;
    }
    /**
     * Clean up old recent changes
     */
    cleanupRecentChanges(now) {
        for (const [filePath, event] of this.recentChanges.entries()) {
            if (now - event.timestamp > this.config.conflictWindowMs * 2) {
                this.recentChanges.delete(filePath);
            }
        }
    }
    /**
     * Get all conflicts
     */
    getConflicts() {
        return Array.from(this.conflicts.values());
    }
    /**
     * Get unresolved conflicts
     */
    getUnresolvedConflicts() {
        return Array.from(this.conflicts.values()).filter(c => !c.resolved);
    }
    /**
     * Get conflict by ID
     */
    getConflict(id) {
        return this.conflicts.get(id);
    }
    /**
     * Mark conflict as resolved
     */
    resolveConflict(id) {
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
    deleteConflict(id) {
        const deleted = this.conflicts.delete(id);
        if (deleted) {
            this.saveConflicts();
        }
        return deleted;
    }
    /**
     * Register conflict handler
     */
    onConflict(handler) {
        this.conflictHandlers.push(handler);
    }
    /**
     * Remove conflict handler
     */
    removeConflictHandler(handler) {
        const index = this.conflictHandlers.indexOf(handler);
        if (index !== -1) {
            this.conflictHandlers.splice(index, 1);
        }
    }
    /**
     * Save conflicts to disk
     */
    saveConflicts() {
        const conflictsFile = path.join(this.config.storageDir, 'conflicts.json');
        const conflictsArray = Array.from(this.conflicts.values());
        try {
            fs.writeFileSync(conflictsFile, JSON.stringify(conflictsArray, null, 2), 'utf8');
        }
        catch (error) {
            console.error('Failed to save conflicts:', error);
        }
    }
    /**
     * Load conflicts from disk
     */
    loadConflicts() {
        const conflictsFile = path.join(this.config.storageDir, 'conflicts.json');
        if (!fs.existsSync(conflictsFile)) {
            return;
        }
        try {
            const content = fs.readFileSync(conflictsFile, 'utf8');
            const conflictsArray = JSON.parse(content);
            for (const conflict of conflictsArray) {
                this.conflicts.set(conflict.id, conflict);
            }
        }
        catch (error) {
            console.error('Failed to load conflicts:', error);
        }
    }
    /**
     * Clear all conflicts
     */
    clearConflicts() {
        this.conflicts.clear();
        this.saveConflicts();
    }
    /**
     * Clear recent changes
     */
    clearRecentChanges() {
        this.recentChanges.clear();
    }
}
exports.ConflictDetector = ConflictDetector;
