"use strict";
/**
 * Bundle Validator
 * Validates bundle integrity, schema structure, and asset references
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
exports.BundleValidator = void 0;
exports.getBundleValidator = getBundleValidator;
exports.resetBundleValidator = resetBundleValidator;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ir_validator_1 = require("../validator/ir-validator");
class BundleValidator {
    constructor(baseDir = process.cwd()) {
        this.baseDir = baseDir;
        this.irValidator = new ir_validator_1.IRValidator();
    }
    /**
     * Validate complete bundle
     */
    async validate(manifest, schemas, assets, options = {}) {
        const errors = [];
        const warnings = [];
        // Validate manifest structure
        const manifestValidation = this.validateManifestStructure(manifest);
        errors.push(...manifestValidation.errors);
        warnings.push(...manifestValidation.warnings);
        // Validate schemas
        if (options.validateSchemas !== false) {
            const schemaValidation = await this.validateSchemas(manifest.schemas, schemas, options.strict || false);
            errors.push(...schemaValidation.errors);
            warnings.push(...schemaValidation.warnings);
        }
        // Validate assets
        if (options.validateAssets !== false) {
            const assetValidation = this.validateAssets(manifest.assets, assets);
            errors.push(...assetValidation.errors);
            warnings.push(...assetValidation.warnings);
        }
        // Validate checksums
        if (options.validateChecksums !== false) {
            const checksumValidation = this.validateChecksums(manifest, schemas, assets);
            errors.push(...checksumValidation.errors);
        }
        // Validate dependencies
        if (options.validateDependencies !== false) {
            const depValidation = this.validateDependencies(manifest.dependencies);
            errors.push(...depValidation.errors);
            warnings.push(...depValidation.warnings);
        }
        const summary = {
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
    validateManifestStructure(manifest) {
        const errors = [];
        const warnings = [];
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
    async validateSchemas(schemaRefs, schemas, strict) {
        const errors = [];
        const warnings = [];
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
                }
                else {
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
                    type: 'schema',
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
    validateSchemaIntegrity(schema) {
        const errors = [];
        const nodeIds = new Set();
        const validateNode = (node, path) => {
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
    hasCircularReferences(schema) {
        const visited = new Set();
        const recursionStack = new Set();
        const detectCycle = (node) => {
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
    validateAssets(assetRefs, assets) {
        const errors = [];
        const warnings = [];
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
            const asset = assets.get(ref.sourcePath);
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
    validateChecksums(manifest, schemas, assets) {
        const errors = [];
        // Validate manifest checksum
        const manifestCopy = { ...manifest };
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
    validateDependencies(dependencies) {
        const errors = [];
        const warnings = [];
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
    findSchemaByPath(searchPath, schemas) {
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
    calculateChecksum(content) {
        return crypto
            .createHash('sha256')
            .update(content)
            .digest('hex');
    }
    /**
     * Validate version format (semver)
     */
    isValidVersion(version) {
        // Simple semver validation
        const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
        const rangeRegex = /^[\^~><=\s\d.]+$/;
        return semverRegex.test(version) || rangeRegex.test(version);
    }
    /**
     * Check if asset type matches file extension
     */
    isValidAssetType(assetPath, expectedType) {
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
    isDependencyInstalled(name) {
        try {
            const modulePath = path.join(this.baseDir, 'node_modules', name);
            return fs.existsSync(modulePath);
        }
        catch {
            return false;
        }
    }
    /**
     * Format validation result for display
     */
    formatValidationResult(result) {
        const lines = [];
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
exports.BundleValidator = BundleValidator;
/**
 * Get singleton validator instance
 */
let validatorInstance = null;
function getBundleValidator(baseDir) {
    if (!validatorInstance || (baseDir && validatorInstance['baseDir'] !== baseDir)) {
        validatorInstance = new BundleValidator(baseDir);
    }
    return validatorInstance;
}
/**
 * Reset validator instance (useful for testing)
 */
function resetBundleValidator() {
    validatorInstance = null;
}
