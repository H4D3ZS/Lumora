/**
 * Manifest Generator
 * Generates bundle manifests with schema and asset references
 */
import { LumoraIR } from '../types/ir-types';
import { AssetReference } from '../assets/asset-manager';
export interface ManifestConfig {
    version?: string;
    entry: string;
    baseDir?: string;
    includeSourceMaps?: boolean;
    includeDependencies?: boolean;
}
export interface BundleManifest {
    version: string;
    entry: string;
    schemas: SchemaReference[];
    assets: AssetReference[];
    dependencies: Record<string, string>;
    checksum: string;
    bundleSize: number;
    createdAt: number;
    metadata?: ManifestMetadata;
}
export interface SchemaReference {
    path: string;
    checksum: string;
    size: number;
    sourceMap?: string;
}
export interface ManifestMetadata {
    generator: string;
    generatorVersion: string;
    platform: string;
    nodeVersion: string;
}
export interface DependencyInfo {
    name: string;
    version: string;
    resolved?: string;
    integrity?: string;
}
export declare class ManifestGenerator {
    private baseDir;
    constructor(baseDir?: string);
    /**
     * Generate bundle manifest
     */
    generate(config: ManifestConfig, schemas: Map<string, LumoraIR>, assets: Map<string, Buffer>): BundleManifest;
    /**
     * Generate schema references
     */
    private generateSchemaReferences;
    /**
     * Generate asset references
     */
    private generateAssetReferences;
    /**
     * Extract dependencies from package.json
     */
    private extractDependencies;
    /**
     * Extract detailed dependency information
     */
    extractDetailedDependencies(): DependencyInfo[];
    /**
     * Calculate total bundle size
     */
    private calculateBundleSize;
    /**
     * Calculate checksum for content
     */
    private calculateChecksum;
    /**
     * Calculate manifest checksum
     */
    private calculateManifestChecksum;
    /**
     * Generate manifest metadata
     */
    private generateMetadata;
    /**
     * Get generator version from package.json
     */
    private getGeneratorVersion;
    /**
     * Get asset type from file extension
     */
    private getAssetType;
    /**
     * Validate manifest structure
     */
    validateManifest(manifest: BundleManifest): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Write manifest to file
     */
    writeManifest(manifest: BundleManifest, outputPath: string): void;
    /**
     * Read manifest from file
     */
    readManifest(manifestPath: string): BundleManifest;
    /**
     * Compare two manifests
     */
    compareManifests(manifest1: BundleManifest, manifest2: BundleManifest): {
        schemasAdded: string[];
        schemasRemoved: string[];
        schemasModified: string[];
        assetsAdded: string[];
        assetsRemoved: string[];
    };
}
export declare function getManifestGenerator(baseDir?: string): ManifestGenerator;
/**
 * Reset generator instance (useful for testing)
 */
export declare function resetManifestGenerator(): void;
//# sourceMappingURL=manifest-generator.d.ts.map