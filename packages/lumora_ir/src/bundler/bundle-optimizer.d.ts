/**
 * Bundle Optimizer
 * Provides optimization features for schema bundles
 */
import { LumoraIR } from '../types/ir-types';
export interface OptimizationOptions {
    treeShake?: boolean;
    minify?: boolean;
    compress?: boolean;
    removeComments?: boolean;
    removeUnusedProps?: boolean;
}
export interface OptimizationResult {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    removedNodes: number;
    removedProps: number;
}
export declare class BundleOptimizer {
    /**
     * Optimize schemas with various techniques
     */
    optimize(schemas: Map<string, LumoraIR>, options?: OptimizationOptions): Promise<OptimizationResult>;
    /**
     * Tree shake unused nodes from schemas
     */
    treeShake(schemas: Map<string, LumoraIR>): {
        removedNodes: number;
    };
    /**
     * Minify schemas by removing unnecessary data
     */
    minify(schemas: Map<string, LumoraIR>, options?: {
        removeComments?: boolean;
        removeUnusedProps?: boolean;
    }): {
        removedProps: number;
    };
    /**
     * Find unused props in a node
     */
    private findUnusedProps;
    /**
     * Compress schemas using gzip
     */
    compressSchemas(schemas: Map<string, LumoraIR>): Promise<Map<string, Buffer>>;
    /**
     * Decompress schemas
     */
    decompressSchemas(compressed: Map<string, Buffer>): Promise<Map<string, LumoraIR>>;
    /**
     * Compress assets using gzip
     */
    compressAssets(assets: Map<string, Buffer>): Promise<Map<string, Buffer>>;
    /**
     * Decompress assets
     */
    decompressAssets(compressed: Map<string, Buffer>): Promise<Map<string, Buffer>>;
    /**
     * Calculate checksum for content
     */
    calculateChecksum(content: string | Buffer): string;
    /**
     * Verify checksum
     */
    verifyChecksum(content: string | Buffer, expectedChecksum: string): boolean;
    /**
     * Calculate total size of schemas
     */
    private calculateTotalSize;
    /**
     * Calculate compression ratio
     */
    calculateCompressionRatio(originalSize: number, compressedSize: number): number;
    /**
     * Format size in human-readable format
     */
    formatSize(bytes: number): string;
}
export declare function getOptimizer(): BundleOptimizer;
/**
 * Reset optimizer instance (useful for testing)
 */
export declare function resetOptimizer(): void;
//# sourceMappingURL=bundle-optimizer.d.ts.map