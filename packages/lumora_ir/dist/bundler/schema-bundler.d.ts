/**
 * Schema Bundler
 * Packages Lumora IR schemas with assets for distribution and deployment
 */
import { LumoraIR } from '../types/ir-types';
import { AssetReference } from '../assets/asset-manager';
export interface BundleConfig {
    entry: string;
    output: string;
    minify?: boolean;
    compress?: boolean;
    treeShake?: boolean;
    sourceMaps?: boolean;
    baseDir?: string;
}
export interface Bundle {
    manifest: BundleManifest;
    schemas: Map<string, LumoraIR>;
    assets: Map<string, Buffer>;
    metadata: BundleMetadata;
}
export interface BundleManifest {
    version: string;
    entry: string;
    schemas: SchemaReference[];
    assets: AssetReference[];
    dependencies: Record<string, string>;
    checksum: string;
    bundleSize: number;
}
export interface SchemaReference {
    path: string;
    checksum: string;
    size: number;
}
export interface BundleMetadata {
    createdAt: number;
    size: number;
    compressed: boolean;
    minified: boolean;
    treeShaken: boolean;
}
export declare class SchemaBundler {
    private baseDir;
    private assetManager?;
    constructor(baseDir?: string);
    /**
     * Bundle schemas and assets
     */
    bundle(config: BundleConfig): Promise<Bundle>;
    /**
     * Collect all schemas from entry point
     */
    private collectSchemas;
    /**
     * Load schema from file
     */
    private loadSchema;
    /**
     * Extract dependencies from schema
     */
    private extractDependencies;
    /**
     * Collect referenced assets from schemas
     */
    private collectAssets;
    /**
     * Extract asset references from schema
     */
    private extractAssetReferences;
    /**
     * Resolve asset path relative to base directory
     */
    private resolveAssetPath;
    /**
     * Tree shake unused nodes
     */
    private treeShake;
    /**
     * Minify schemas by removing metadata
     */
    private minify;
    /**
     * Generate bundle manifest
     */
    private generateManifest;
    /**
     * Calculate checksum for content
     */
    private calculateChecksum;
    /**
     * Calculate total bundle size
     */
    private calculateSize;
    /**
     * Compress bundle
     */
    private compress;
    /**
     * Get asset type from file extension
     */
    private getAssetType;
    /**
     * Extract package dependencies
     */
    private extractPackageDependencies;
    /**
     * Write bundle to disk
     */
    writeBundle(bundle: Bundle, outputPath: string): Promise<void>;
    /**
     * Load bundle from disk
     */
    loadBundle(bundlePath: string): Promise<Bundle>;
}
export declare function getBundler(baseDir?: string): SchemaBundler;
/**
 * Reset bundler instance (useful for testing)
 */
export declare function resetBundler(): void;
