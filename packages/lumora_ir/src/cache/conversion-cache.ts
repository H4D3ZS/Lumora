/**
 * Conversion Cache - Caches parsed ASTs and generated IR to improve performance
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { LumoraIR } from '../types/ir-types';

/**
 * Cache entry for parsed AST
 */
export interface ASTCacheEntry {
  filePath: string;
  fileHash: string;
  timestamp: number;
  ast: any;
}

/**
 * Cache entry for generated IR
 */
export interface IRCacheEntry {
  filePath: string;
  fileHash: string;
  timestamp: number;
  ir: LumoraIR;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  astHits: number;
  astMisses: number;
  irHits: number;
  irMisses: number;
  totalEntries: number;
  memoryUsage: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxEntries?: number;
  maxMemoryMB?: number;
  ttlSeconds?: number;
  enabled?: boolean;
}

/**
 * Conversion Cache class
 */
export class ConversionCache {
  private astCache: Map<string, ASTCacheEntry> = new Map();
  private irCache: Map<string, IRCacheEntry> = new Map();
  private stats: CacheStats = {
    astHits: 0,
    astMisses: 0,
    irHits: 0,
    irMisses: 0,
    totalEntries: 0,
    memoryUsage: 0,
  };
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
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
  getAST(filePath: string): any | undefined {
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
  setAST(filePath: string, ast: any): void {
    if (!this.config.enabled) {
      return;
    }

    const fileHash = this.getFileHash(filePath);
    const entry: ASTCacheEntry = {
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
  getIR(filePath: string): LumoraIR | undefined {
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
  setIR(filePath: string, ir: LumoraIR): void {
    if (!this.config.enabled) {
      return;
    }

    const fileHash = this.getFileHash(filePath);
    const entry: IRCacheEntry = {
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
  invalidate(filePath: string): void {
    this.astCache.delete(filePath);
    this.irCache.delete(filePath);
    this.updateStats();
  }

  /**
   * Clear all caches
   */
  clear(): void {
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
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit rate
   * @returns Hit rate as percentage
   */
  getHitRate(): { ast: number; ir: number; overall: number } {
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
  private getFileHash(filePath: string): string {
    try {
      if (!fs.existsSync(filePath)) {
        return '';
      }

      const stats = fs.statSync(filePath);
      // Use mtime and size for quick hash
      return `${stats.mtimeMs}-${stats.size}`;
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if entry has expired
   * @param timestamp - Entry timestamp
   * @returns True if expired
   */
  private isExpired(timestamp: number): boolean {
    const now = Date.now();
    const age = (now - timestamp) / 1000; // Convert to seconds
    return age > this.config.ttlSeconds;
  }

  /**
   * Evict entries if cache is too large
   */
  private evictIfNeeded(): void {
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
  private evictOldest(): void {
    // Collect all entries with timestamps
    const allEntries: Array<{ key: string; timestamp: number; type: 'ast' | 'ir' }> = [];

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
      } else {
        this.irCache.delete(entry.key);
      }
    }
  }

  /**
   * Estimate memory usage
   * @returns Estimated memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    let total = 0;

    // Rough estimation: JSON.stringify size
    for (const entry of this.astCache.values()) {
      try {
        total += JSON.stringify(entry.ast).length;
      } catch {
        total += 1000; // Fallback estimate
      }
    }

    for (const entry of this.irCache.values()) {
      try {
        total += JSON.stringify(entry.ir).length;
      } catch {
        total += 1000; // Fallback estimate
      }
    }

    return total;
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.totalEntries = this.astCache.size + this.irCache.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  /**
   * Enable cache
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable cache
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * Check if cache is enabled
   * @returns True if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

/**
 * Global cache instance
 */
let globalCache: ConversionCache | undefined;

/**
 * Get global cache instance
 * @param config - Cache configuration
 * @returns Global cache instance
 */
export function getConversionCache(config?: CacheConfig): ConversionCache {
  if (!globalCache) {
    globalCache = new ConversionCache(config);
  }
  return globalCache;
}

/**
 * Reset global cache instance
 */
export function resetConversionCache(): void {
  globalCache = undefined;
}
