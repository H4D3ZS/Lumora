"use strict";
/**
 * Conversion Cache - Caches parsed ASTs and generated IR to improve performance
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
exports.ConversionCache = void 0;
exports.getConversionCache = getConversionCache;
exports.resetConversionCache = resetConversionCache;
const fs = __importStar(require("fs"));
/**
 * Conversion Cache class
 */
class ConversionCache {
    constructor(config = {}) {
        this.astCache = new Map();
        this.irCache = new Map();
        this.stats = {
            astHits: 0,
            astMisses: 0,
            irHits: 0,
            irMisses: 0,
            totalEntries: 0,
            memoryUsage: 0,
        };
        this.config = {
            maxEntries: config.maxEntries ?? 1000,
            maxMemoryMB: config.maxMemoryMB ?? 100,
            ttlSeconds: config.ttlSeconds ?? 3600,
            enabled: config.enabled ?? true,
        };
    }
    /**
     * Get cached AST
     * @param filePath - File path
     * @returns Cached AST or undefined
     */
    getAST(filePath) {
        if (!this.config.enabled) {
            return undefined;
        }
        const entry = this.astCache.get(filePath);
        if (!entry) {
            this.stats.astMisses++;
            return undefined;
        }
        // Check if file has changed
        const currentHash = this.getFileHash(filePath);
        if (currentHash !== entry.fileHash) {
            this.astCache.delete(filePath);
            this.stats.astMisses++;
            return undefined;
        }
        // Check if entry has expired
        if (this.isExpired(entry.timestamp)) {
            this.astCache.delete(filePath);
            this.stats.astMisses++;
            return undefined;
        }
        this.stats.astHits++;
        return entry.ast;
    }
    /**
     * Set cached AST
     * @param filePath - File path
     * @param ast - Parsed AST
     */
    setAST(filePath, ast) {
        if (!this.config.enabled) {
            return;
        }
        const fileHash = this.getFileHash(filePath);
        const entry = {
            filePath,
            fileHash,
            timestamp: Date.now(),
            ast,
        };
        this.astCache.set(filePath, entry);
        this.evictIfNeeded();
        this.updateStats();
    }
    /**
     * Get cached IR
     * @param filePath - File path
     * @returns Cached IR or undefined
     */
    getIR(filePath) {
        if (!this.config.enabled) {
            return undefined;
        }
        const entry = this.irCache.get(filePath);
        if (!entry) {
            this.stats.irMisses++;
            return undefined;
        }
        // Check if file has changed
        const currentHash = this.getFileHash(filePath);
        if (currentHash !== entry.fileHash) {
            this.irCache.delete(filePath);
            this.stats.irMisses++;
            return undefined;
        }
        // Check if entry has expired
        if (this.isExpired(entry.timestamp)) {
            this.irCache.delete(filePath);
            this.stats.irMisses++;
            return undefined;
        }
        this.stats.irHits++;
        return entry.ir;
    }
    /**
     * Set cached IR
     * @param filePath - File path
     * @param ir - Generated IR
     */
    setIR(filePath, ir) {
        if (!this.config.enabled) {
            return;
        }
        const fileHash = this.getFileHash(filePath);
        const entry = {
            filePath,
            fileHash,
            timestamp: Date.now(),
            ir,
        };
        this.irCache.set(filePath, entry);
        this.evictIfNeeded();
        this.updateStats();
    }
    /**
     * Invalidate cache for a file
     * @param filePath - File path
     */
    invalidate(filePath) {
        this.astCache.delete(filePath);
        this.irCache.delete(filePath);
        this.updateStats();
    }
    /**
     * Clear all caches
     */
    clear() {
        this.astCache.clear();
        this.irCache.clear();
        this.stats = {
            astHits: 0,
            astMisses: 0,
            irHits: 0,
            irMisses: 0,
            totalEntries: 0,
            memoryUsage: 0,
        };
    }
    /**
     * Get cache statistics
     * @returns Cache statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Get cache hit rate
     * @returns Hit rate as percentage
     */
    getHitRate() {
        const astTotal = this.stats.astHits + this.stats.astMisses;
        const irTotal = this.stats.irHits + this.stats.irMisses;
        const overallTotal = astTotal + irTotal;
        return {
            ast: astTotal > 0 ? (this.stats.astHits / astTotal) * 100 : 0,
            ir: irTotal > 0 ? (this.stats.irHits / irTotal) * 100 : 0,
            overall: overallTotal > 0 ? ((this.stats.astHits + this.stats.irHits) / overallTotal) * 100 : 0,
        };
    }
    /**
     * Get file hash
     * @param filePath - File path
     * @returns File hash
     */
    getFileHash(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return '';
            }
            const stats = fs.statSync(filePath);
            // Use mtime and size for quick hash
            return `${stats.mtimeMs}-${stats.size}`;
        }
        catch (error) {
            return '';
        }
    }
    /**
     * Check if entry has expired
     * @param timestamp - Entry timestamp
     * @returns True if expired
     */
    isExpired(timestamp) {
        const now = Date.now();
        const age = (now - timestamp) / 1000; // Convert to seconds
        return age > this.config.ttlSeconds;
    }
    /**
     * Evict entries if cache is too large
     */
    evictIfNeeded() {
        const totalEntries = this.astCache.size + this.irCache.size;
        // Evict by entry count
        if (totalEntries > this.config.maxEntries) {
            this.evictOldest();
        }
        // Evict by memory usage
        const memoryMB = this.estimateMemoryUsage() / (1024 * 1024);
        if (memoryMB > this.config.maxMemoryMB) {
            this.evictOldest();
        }
    }
    /**
     * Evict oldest entries
     */
    evictOldest() {
        // Collect all entries with timestamps
        const allEntries = [];
        for (const [key, entry] of this.astCache.entries()) {
            allEntries.push({ key, timestamp: entry.timestamp, type: 'ast' });
        }
        for (const [key, entry] of this.irCache.entries()) {
            allEntries.push({ key, timestamp: entry.timestamp, type: 'ir' });
        }
        // Sort by timestamp (oldest first)
        allEntries.sort((a, b) => a.timestamp - b.timestamp);
        // Remove oldest 10%
        const toRemove = Math.ceil(allEntries.length * 0.1);
        for (let i = 0; i < toRemove && i < allEntries.length; i++) {
            const entry = allEntries[i];
            if (entry.type === 'ast') {
                this.astCache.delete(entry.key);
            }
            else {
                this.irCache.delete(entry.key);
            }
        }
    }
    /**
     * Estimate memory usage
     * @returns Estimated memory usage in bytes
     */
    estimateMemoryUsage() {
        let total = 0;
        // Rough estimation: JSON.stringify size
        for (const entry of this.astCache.values()) {
            try {
                total += JSON.stringify(entry.ast).length;
            }
            catch {
                total += 1000; // Fallback estimate
            }
        }
        for (const entry of this.irCache.values()) {
            try {
                total += JSON.stringify(entry.ir).length;
            }
            catch {
                total += 1000; // Fallback estimate
            }
        }
        return total;
    }
    /**
     * Update statistics
     */
    updateStats() {
        this.stats.totalEntries = this.astCache.size + this.irCache.size;
        this.stats.memoryUsage = this.estimateMemoryUsage();
    }
    /**
     * Enable cache
     */
    enable() {
        this.config.enabled = true;
    }
    /**
     * Disable cache
     */
    disable() {
        this.config.enabled = false;
    }
    /**
     * Check if cache is enabled
     * @returns True if enabled
     */
    isEnabled() {
        return this.config.enabled;
    }
}
exports.ConversionCache = ConversionCache;
/**
 * Global cache instance
 */
let globalCache;
/**
 * Get global cache instance
 * @param config - Cache configuration
 * @returns Global cache instance
 */
function getConversionCache(config) {
    if (!globalCache) {
        globalCache = new ConversionCache(config);
    }
    return globalCache;
}
/**
 * Reset global cache instance
 */
function resetConversionCache() {
    globalCache = undefined;
}
