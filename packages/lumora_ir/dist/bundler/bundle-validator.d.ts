/**
 * Bundle Validator
 * Validates bundle integrity, schema structure, and asset references
 */
import { LumoraIR } from '../types/ir-types';
import { BundleManifest } from './manifest-generator';
export interface ValidationOptions {
    validateSchemas?: boolean;
    validateAssets?: boolean;
    validateChecksums?: boolean;
    validateDependencies?: boolean;
    strict?: boolean;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    summary: ValidationSummary;
}
export interface ValidationError {
    type: 'schema' | 'asset' | 'checksum' | 'dependency' | 'manifest';
    path?: string;
    message: string;
    details?: any;
}
export interface ValidationWarning {
    type: 'schema' | 'asset' | 'dependency';
    path?: string;
    message: string;
}
export interface ValidationSummary {
    totalSchemas: number;
    validSchemas: number;
    totalAssets: number;
    validAssets: number;
    totalErrors: number;
    totalWarnings: number;
}
export declare class BundleValidator {
    private irValidator;
    private baseDir;
    constructor(baseDir?: string);
    /**
     * Validate complete bundle
     */
    validate(manifest: BundleManifest, schemas: Map<string, LumoraIR>, assets: Map<string, Buffer>, options?: ValidationOptions): Promise<ValidationResult>;
    /**
     * Validate manifest structure
     */
    private validateManifestStructure;
    /**
     * Validate schemas
     */
    private validateSchemas;
    /**
     * Validate schema integrity
     */
    private validateSchemaIntegrity;
    /**
     * Check for circular references in schema
     */
    private hasCircularReferences;
    /**
     * Validate assets
     */
    private validateAssets;
    /**
     * Validate checksums
     */
    private validateChecksums;
    /**
     * Validate dependencies
     */
    private validateDependencies;
    /**
     * Find schema by path
     */
    private findSchemaByPath;
    /**
     * Calculate checksum
     */
    private calculateChecksum;
    /**
     * Validate version format (semver)
     */
    private isValidVersion;
    /**
     * Check if asset type matches file extension
     */
    private isValidAssetType;
    /**
     * Check if dependency is installed
     */
    private isDependencyInstalled;
    /**
     * Format validation result for display
     */
    formatValidationResult(result: ValidationResult): string;
}
export declare function getBundleValidator(baseDir?: string): BundleValidator;
/**
 * Reset validator instance (useful for testing)
 */
export declare function resetBundleValidator(): void;
