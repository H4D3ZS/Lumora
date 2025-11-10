/**
 * Conversion Cache - Caches parsed ASTs and generated IR to improve performance
 */
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
export declare class ConversionCache {
    private astCache;
    private irCache;
    private stats;
    private config;
    constructor(config?: CacheConfig);
    /**
     * Get cached AST
     * @param filePath - File path
     * @returns Cached AST or undefined
     */
    getAST(filePath: string): any | undefined;
    /**
     * Set cached AST
     * @param filePath - File path
     * @param ast - Parsed AST
     */
    setAST(filePath: string, ast: any): void;
    /**
     * Get cached IR
     * @param filePath - File path
     * @returns Cached IR or undefined
     */
    getIR(filePath: string): LumoraIR | undefined;
    /**
     * Set cached IR
     * @param filePath - File path
     * @param ir - Generated IR
     */
    setIR(filePath: string, ir: LumoraIR): void;
    /**
     * Invalidate cache for a file
     * @param filePath - File path
     */
    invalidate(filePath: string): void;
    /**
     * Clear all caches
     */
    clear(): void;
    /**
     * Get cache statistics
     * @returns Cache statistics
     */
    getStats(): CacheStats;
    /**
     * Get cache hit rate
     * @returns Hit rate as percentage
     */
    getHitRate(): {
        ast: number;
        ir: number;
        overall: number;
    };
    /**
     * Get file hash
     * @param filePath - File path
     * @returns File hash
     */
    private getFileHash;
    /**
     * Check if entry has expired
     * @param timestamp - Entry timestamp
     * @returns True if expired
     */
    private isExpired;
    /**
     * Evict entries if cache is too large
     */
    private evictIfNeeded;
    /**
     * Evict oldest entries
     */
    private evictOldest;
    /**
     * Estimate memory usage
     * @returns Estimated memory usage in bytes
     */
    private estimateMemoryUsage;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Enable cache
     */
    enable(): void;
    /**
     * Disable cache
     */
    disable(): void;
    /**
     * Check if cache is enabled
     * @returns True if enabled
     */
    isEnabled(): boolean;
}
/**
 * Get global cache instance
 * @param config - Cache configuration
 * @returns Global cache instance
 */
export declare function getConversionCache(config?: CacheConfig): ConversionCache;
/**
 * Reset global cache instance
 */
export declare function resetConversionCache(): void;
