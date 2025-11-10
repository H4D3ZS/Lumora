/**
 * Bundle Validator
 * Validates bundle integrity, schema structure, and asset references
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { LumoraIR, LumoraNode } from '../types/ir-types';
import { IRValidator } from '../validator/ir-validator';
import { BundleManifest, SchemaReference } from './manifest-generator';
import { AssetReference } from '../assets/asset-manager';

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

export class BundleValidator {
  private irValidator: IRValidator;
  private baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
    this.irValidator = new IRValidator();
  }

  /**
   * Validate complete bundle
   */
  async validate(
    manifest: BundleManifest,
    schemas: Map<string, LumoraIR>,
    assets: Map<string, Buffer>,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate manifest structure
    const manifestValidation = this.validateManifestStructure(manifest);
    errors.push(...manifestValidation.errors);
    warnings.push(...manifestValidation.warnings);

    // Validate schemas
    if (options.validateSchemas !== false) {
      const schemaValidation = await this.validateSchemas(
        manifest.schemas,
        schemas,
        options.strict || false
      );
      errors.push(...schemaValidation.errors);
      warnings.push(...schemaValidation.warnings);
    }

    // Validate assets
    if (options.validateAssets !== false) {
      const assetValidation = this.validateAssets(
        manifest.assets,
        assets
      );
      errors.push(...assetValidation.errors);
      warnings.push(...assetValidation.warnings);
    }

    // Validate checksums
    if (options.validateChecksums !== false) {
      const checksumValidation = this.validateChecksums(
        manifest,
        schemas,
        assets
      );
      errors.push(...checksumValidation.errors);
    }

    // Validate dependencies
    if (options.validateDependencies !== false) {
      const depValidation = this.validateDependencies(manifest.dependencies);
      errors.push(...depValidation.errors);
      warnings.push(...depValidation.warnings);
    }

    const summary: ValidationSummary = {
      totalSchemas: manifest.schemas.length,
      validSchemas: manifest.schemas.length - errors.filter(e => e.type === 'schema').length,
      totalAssets: manifest.assets.length,
      validAssets: manifest.assets.length - errors.filter(e => e.type === 'asset').length,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary,
    };
  }

  /**
   * Validate manifest structure
   */
  private validateManifestStructure(
    manifest: BundleManifest
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (!manifest.version) {
      errors.push({
        type: 'manifest',
        message: 'Missing required field: version',
      });
    }

    if (!manifest.entry) {
      errors.push({
        type: 'manifest',
        message: 'Missing required field: entry',
      });
    }

    if (!manifest.schemas || !Array.isArray(manifest.schemas)) {
      errors.push({
        type: 'manifest',
        message: 'Missing or invalid field: schemas',
      });
    }

    if (!manifest.assets || !Array.isArray(manifest.assets)) {
      errors.push({
        type: 'manifest',
        message: 'Missing or invalid field: assets',
      });
    }

    if (!manifest.checksum) {
      errors.push({
        type: 'manifest',
        message: 'Missing required field: checksum',
      });
    }

    if (typeof manifest.bundleSize !== 'number') {
      errors.push({
        type: 'manifest',
        message: 'Missing or invalid field: bundleSize',
      });
    }

    // Validate version format
    if (manifest.version && !this.isValidVersion(manifest.version)) {
      warnings.push({
        type: 'schema',
        message: `Invalid version format: ${manifest.version}`,
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate schemas
   */
  private async validateSchemas(
    schemaRefs: SchemaReference[],
    schemas: Map<string, LumoraIR>,
    strict: boolean
  ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const ref of schemaRefs) {
      // Check if schema exists
      const schema = this.findSchemaByPath(ref.path, schemas);
      
      if (!schema) {
        errors.push({
          type: 'schema',
          path: ref.path,
          message: `Schema not found: ${ref.path}`,
        });
        continue;
      }

      // Validate schema structure using IRValidator
      const validation = this.irValidator.validate(schema);
      
      if (!validation.valid) {
        if (strict) {
          errors.push({
            type: 'schema',
            path: ref.path,
            message: `Invalid schema structure`,
            details: validation.errors,
          });
        } else {
          warnings.push({
            type: 'schema',
            path: ref.path,
            message: `Schema has validation issues`,
          });
        }
      }

      // Validate schema integrity
      const integrityErrors = this.validateSchemaIntegrity(schema);
      if (integrityErrors.length > 0) {
        errors.push(...integrityErrors.map(msg => ({
          type: 'schema' as const,
          path: ref.path,
          message: msg,
        })));
      }

      // Check for circular references
      if (this.hasCircularReferences(schema)) {
        warnings.push({
          type: 'schema',
          path: ref.path,
          message: 'Schema contains circular references',
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate schema integrity
   */
  private validateSchemaIntegrity(schema: LumoraIR): string[] {
    const errors: string[] = [];
    const nodeIds = new Set<string>();

    const validateNode = (node: LumoraNode, path: string) => {
      // Check for duplicate IDs
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id} at ${path}`);
      }
      nodeIds.add(node.id);

      // Validate node structure
      if (!node.type) {
        errors.push(`Missing node type at ${path}`);
      }

      if (!node.props || typeof node.props !== 'object') {
        errors.push(`Invalid props at ${path}`);
      }

      if (!Array.isArray(node.children)) {
        errors.push(`Invalid children at ${path}`);
      }

      // Validate children
      node.children.forEach((child, index) => {
        validateNode(child, `${path}.children[${index}]`);
      });
    };

    schema.nodes.forEach((node, index) => {
      validateNode(node, `nodes[${index}]`);
    });

    return errors;
  }

  /**
   * Check for circular references in schema
   */
  private hasCircularReferences(schema: LumoraIR): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (node: LumoraNode): boolean => {
      if (recursionStack.has(node.id)) {
        return true; // Circular reference detected
      }

      if (visited.has(node.id)) {
        return false; // Already processed
      }

      visited.add(node.id);
      recursionStack.add(node.id);

      // Check children
      for (const child of node.children) {
        if (detectCycle(child)) {
          return true;
        }
      }

      recursionStack.delete(node.id);
      return false;
    };

    return schema.nodes.some(node => detectCycle(node));
  }

  /**
   * Validate assets
   */
  private validateAssets(
    assetRefs: AssetReference[],
    assets: Map<string, Buffer>
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const ref of assetRefs) {
      // Check if asset exists
      if (!assets.has(ref.sourcePath)) {
        errors.push({
          type: 'asset',
          path: ref.sourcePath,
          message: `Asset not found: ${ref.sourcePath}`,
        });
        continue;
      }

      const asset = assets.get(ref.sourcePath)!;

      // Validate asset size
      if (asset.length === 0) {
        warnings.push({
          type: 'asset',
          path: ref.sourcePath,
          message: 'Asset is empty',
        });
      }

      // Validate asset type
      if (!this.isValidAssetType(ref.sourcePath, ref.type)) {
        warnings.push({
          type: 'asset',
          path: ref.sourcePath,
          message: `Asset type mismatch: expected ${ref.type}`,
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate checksums
   */
  private validateChecksums(
    manifest: BundleManifest,
    schemas: Map<string, LumoraIR>,
    assets: Map<string, Buffer>
  ): { errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // Validate manifest checksum
    const manifestCopy: any = { ...manifest };
    delete manifestCopy.checksum;
    const manifestContent = JSON.stringify(manifestCopy, null, 2);
    const calculatedChecksum = this.calculateChecksum(manifestContent);

    if (calculatedChecksum !== manifest.checksum) {
      errors.push({
        type: 'checksum',
        message: 'Manifest checksum mismatch',
        details: {
          expected: manifest.checksum,
          actual: calculatedChecksum,
        },
      });
    }

    // Validate schema checksums
    for (const ref of manifest.schemas) {
      const schema = this.findSchemaByPath(ref.path, schemas);
      
      if (schema) {
        const content = JSON.stringify(schema);
        const calculatedChecksum = this.calculateChecksum(content);

        if (calculatedChecksum !== ref.checksum) {
          errors.push({
            type: 'checksum',
            path: ref.path,
            message: 'Schema checksum mismatch',
            details: {
              expected: ref.checksum,
              actual: calculatedChecksum,
            },
          });
        }
      }
    }

    return { errors };
  }

  /**
   * Validate dependencies
   */
  private validateDependencies(
    dependencies: Record<string, string>
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const [name, version] of Object.entries(dependencies)) {
      // Validate version format
      if (!this.isValidVersion(version)) {
        warnings.push({
          type: 'dependency',
          message: `Invalid version format for ${name}: ${version}`,
        });
      }

      // Check if dependency is installed (optional)
      const isInstalled = this.isDependencyInstalled(name);
      if (!isInstalled) {
        warnings.push({
          type: 'dependency',
          message: `Dependency not installed: ${name}@${version}`,
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Find schema by path
   */
  private findSchemaByPath(
    searchPath: string,
    schemas: Map<string, LumoraIR>
  ): LumoraIR | undefined {
    // Try exact match first
    if (schemas.has(searchPath)) {
      return schemas.get(searchPath);
    }

    // Try relative path matching
    for (const [schemaPath, schema] of schemas.entries()) {
      const relativePath = path.relative(this.baseDir, schemaPath);
      if (relativePath === searchPath) {
        return schema;
      }
    }

    return undefined;
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(content: string | Buffer): string {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  /**
   * Validate version format (semver)
   */
  private isValidVersion(version: string): boolean {
    // Simple semver validation
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    const rangeRegex = /^[\^~><=\s\d.]+$/;
    
    return semverRegex.test(version) || rangeRegex.test(version);
  }

  /**
   * Check if asset type matches file extension
   */
  private isValidAssetType(
    assetPath: string,
    expectedType: 'image' | 'font' | 'other'
  ): boolean {
    const ext = path.extname(assetPath).toLowerCase();

    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
    const fontExts = ['.ttf', '.otf', '.woff', '.woff2'];

    switch (expectedType) {
      case 'image':
        return imageExts.includes(ext);
      case 'font':
        return fontExts.includes(ext);
      case 'other':
        return !imageExts.includes(ext) && !fontExts.includes(ext);
      default:
        return false;
    }
  }

  /**
   * Check if dependency is installed
   */
  private isDependencyInstalled(name: string): boolean {
    try {
      const modulePath = path.join(this.baseDir, 'node_modules', name);
      return fs.existsSync(modulePath);
    } catch {
      return false;
    }
  }

  /**
   * Format validation result for display
   */
  formatValidationResult(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('Bundle Validation Result');
    lines.push('='.repeat(50));
    lines.push('');

    // Summary
    lines.push('Summary:');
    lines.push(`  Schemas: ${result.summary.validSchemas}/${result.summary.totalSchemas} valid`);
    lines.push(`  Assets: ${result.summary.validAssets}/${result.summary.totalAssets} valid`);
    lines.push(`  Errors: ${result.summary.totalErrors}`);
    lines.push(`  Warnings: ${result.summary.totalWarnings}`);
    lines.push('');

    // Errors
    if (result.errors.length > 0) {
      lines.push('Errors:');
      result.errors.forEach((error, index) => {
        lines.push(`  ${index + 1}. [${error.type}] ${error.message}`);
        if (error.path) {
          lines.push(`     Path: ${error.path}`);
        }
      });
      lines.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
      lines.push('Warnings:');
      result.warnings.forEach((warning, index) => {
        lines.push(`  ${index + 1}. [${warning.type}] ${warning.message}`);
        if (warning.path) {
          lines.push(`     Path: ${warning.path}`);
        }
      });
      lines.push('');
    }

    // Overall status
    lines.push(result.valid ? '✓ Bundle is valid' : '✗ Bundle validation failed');

    return lines.join('\n');
  }
}

/**
 * Get singleton validator instance
 */
let validatorInstance: BundleValidator | null = null;

export function getBundleValidator(baseDir?: string): BundleValidator {
  if (!validatorInstance || (baseDir && validatorInstance['baseDir'] !== baseDir)) {
    validatorInstance = new BundleValidator(baseDir);
  }
  return validatorInstance;
}

/**
 * Reset validator instance (useful for testing)
 */
export function resetBundleValidator(): void {
  validatorInstance = null;
}
