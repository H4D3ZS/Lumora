"use strict";
/**
 * Manifest Generator
 * Generates bundle manifests with schema and asset references
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
exports.ManifestGenerator = void 0;
exports.getManifestGenerator = getManifestGenerator;
exports.resetManifestGenerator = resetManifestGenerator;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ManifestGenerator {
    constructor(baseDir = process.cwd()) {
        this.baseDir = baseDir;
    }
    /**
     * Generate bundle manifest
     */
    generate(config, schemas, assets) {
        const schemaRefs = this.generateSchemaReferences(schemas, config);
        const assetRefs = this.generateAssetReferences(assets);
        const dependencies = config.includeDependencies !== false
            ? this.extractDependencies()
            : {};
        const bundleSize = this.calculateBundleSize(schemas, assets);
        const manifest = {
            version: config.version || '1.0.0',
            entry: config.entry,
            schemas: schemaRefs,
            assets: assetRefs,
            dependencies,
            checksum: '', // Will be calculated after
            bundleSize,
            createdAt: Date.now(),
            metadata: this.generateMetadata(),
        };
        // Calculate manifest checksum
        manifest.checksum = this.calculateManifestChecksum(manifest);
        return manifest;
    }
    /**
     * Generate schema references
     */
    generateSchemaReferences(schemas, config) {
        const references = [];
        for (const [schemaPath, schema] of schemas.entries()) {
            const content = JSON.stringify(schema);
            const relativePath = path.relative(config.baseDir || this.baseDir, schemaPath);
            const ref = {
                path: relativePath,
                checksum: this.calculateChecksum(content),
                size: Buffer.byteLength(content, 'utf-8'),
            };
            // Add source map if requested
            if (config.includeSourceMaps && schema.metadata.sourceFile) {
                ref.sourceMap = schema.metadata.sourceFile;
            }
            references.push(ref);
        }
        return references;
    }
    /**
     * Generate asset references
     */
    generateAssetReferences(assets) {
        const references = [];
        for (const [assetPath, content] of assets.entries()) {
            references.push({
                type: this.getAssetType(assetPath),
                sourcePath: assetPath,
                targetPath: assetPath,
                framework: 'react', // Default framework
            });
        }
        return references;
    }
    /**
     * Extract dependencies from package.json
     */
    extractDependencies() {
        const packageJsonPath = path.join(this.baseDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return {};
        }
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const deps = {};
            // Include runtime dependencies
            if (packageJson.dependencies) {
                Object.assign(deps, packageJson.dependencies);
            }
            // Include peer dependencies
            if (packageJson.peerDependencies) {
                Object.assign(deps, packageJson.peerDependencies);
            }
            return deps;
        }
        catch (error) {
            console.warn('Failed to extract dependencies:', error);
            return {};
        }
    }
    /**
     * Extract detailed dependency information
     */
    extractDetailedDependencies() {
        const packageJsonPath = path.join(this.baseDir, 'package.json');
        const packageLockPath = path.join(this.baseDir, 'package-lock.json');
        if (!fs.existsSync(packageJsonPath)) {
            return [];
        }
        const dependencies = [];
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const deps = {
                ...(packageJson.dependencies || {}),
                ...(packageJson.peerDependencies || {}),
            };
            // Try to get detailed info from package-lock.json
            let lockData = {};
            if (fs.existsSync(packageLockPath)) {
                lockData = JSON.parse(fs.readFileSync(packageLockPath, 'utf-8'));
            }
            for (const [name, version] of Object.entries(deps)) {
                const info = {
                    name,
                    version: version,
                };
                // Add lock file info if available
                if (lockData.packages && lockData.packages[`node_modules/${name}`]) {
                    const lockInfo = lockData.packages[`node_modules/${name}`];
                    info.resolved = lockInfo.resolved;
                    info.integrity = lockInfo.integrity;
                }
                dependencies.push(info);
            }
        }
        catch (error) {
            console.warn('Failed to extract detailed dependencies:', error);
        }
        return dependencies;
    }
    /**
     * Calculate total bundle size
     */
    calculateBundleSize(schemas, assets) {
        let size = 0;
        // Add schema sizes
        for (const schema of schemas.values()) {
            size += Buffer.byteLength(JSON.stringify(schema), 'utf-8');
        }
        // Add asset sizes
        for (const asset of assets.values()) {
            size += asset.length;
        }
        return size;
    }
    /**
     * Calculate checksum for content
     */
    calculateChecksum(content) {
        return crypto
            .createHash('sha256')
            .update(content)
            .digest('hex');
    }
    /**
     * Calculate manifest checksum
     */
    calculateManifestChecksum(manifest) {
        // Create a copy without the checksum field
        const manifestCopy = { ...manifest };
        delete manifestCopy.checksum;
        const content = JSON.stringify(manifestCopy, null, 2);
        return this.calculateChecksum(content);
    }
    /**
     * Generate manifest metadata
     */
    generateMetadata() {
        return {
            generator: 'lumora-bundler',
            generatorVersion: this.getGeneratorVersion(),
            platform: process.platform,
            nodeVersion: process.version,
        };
    }
    /**
     * Get generator version from package.json
     */
    getGeneratorVersion() {
        try {
            const packageJsonPath = path.join(__dirname, '../../package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                return packageJson.version || '1.0.0';
            }
        }
        catch {
            // Ignore errors
        }
        return '1.0.0';
    }
    /**
     * Get asset type from file extension
     */
    getAssetType(assetPath) {
        const ext = path.extname(assetPath).toLowerCase();
        const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
        const fontExts = ['.ttf', '.otf', '.woff', '.woff2'];
        if (imageExts.includes(ext)) {
            return 'image';
        }
        else if (fontExts.includes(ext)) {
            return 'font';
        }
        return 'other';
    }
    /**
     * Validate manifest structure
     */
    validateManifest(manifest) {
        const errors = [];
        // Check required fields
        if (!manifest.version) {
            errors.push('Missing required field: version');
        }
        if (!manifest.entry) {
            errors.push('Missing required field: entry');
        }
        if (!manifest.schemas || !Array.isArray(manifest.schemas)) {
            errors.push('Missing or invalid field: schemas');
        }
        if (!manifest.assets || !Array.isArray(manifest.assets)) {
            errors.push('Missing or invalid field: assets');
        }
        if (!manifest.checksum) {
            errors.push('Missing required field: checksum');
        }
        if (typeof manifest.bundleSize !== 'number') {
            errors.push('Missing or invalid field: bundleSize');
        }
        // Validate schema references
        if (manifest.schemas) {
            manifest.schemas.forEach((ref, index) => {
                if (!ref.path) {
                    errors.push(`Schema reference ${index}: missing path`);
                }
                if (!ref.checksum) {
                    errors.push(`Schema reference ${index}: missing checksum`);
                }
                if (typeof ref.size !== 'number') {
                    errors.push(`Schema reference ${index}: missing or invalid size`);
                }
            });
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Write manifest to file
     */
    writeManifest(manifest, outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');
    }
    /**
     * Read manifest from file
     */
    readManifest(manifestPath) {
        if (!fs.existsSync(manifestPath)) {
            throw new Error(`Manifest not found: ${manifestPath}`);
        }
        const content = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(content);
        // Validate manifest
        const validation = this.validateManifest(manifest);
        if (!validation.valid) {
            throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
        }
        return manifest;
    }
    /**
     * Compare two manifests
     */
    compareManifests(manifest1, manifest2) {
        const schemas1 = new Map(manifest1.schemas.map(s => [s.path, s.checksum]));
        const schemas2 = new Map(manifest2.schemas.map(s => [s.path, s.checksum]));
        const schemasAdded = [];
        const schemasRemoved = [];
        const schemasModified = [];
        // Find added and modified schemas
        schemas2.forEach((checksum, path) => {
            if (!schemas1.has(path)) {
                schemasAdded.push(path);
            }
            else if (schemas1.get(path) !== checksum) {
                schemasModified.push(path);
            }
        });
        // Find removed schemas
        schemas1.forEach((checksum, path) => {
            if (!schemas2.has(path)) {
                schemasRemoved.push(path);
            }
        });
        const assets1 = new Set(manifest1.assets.map(a => a.sourcePath));
        const assets2 = new Set(manifest2.assets.map(a => a.sourcePath));
        const assetsAdded = Array.from(assets2).filter(a => !assets1.has(a));
        const assetsRemoved = Array.from(assets1).filter(a => !assets2.has(a));
        return {
            schemasAdded,
            schemasRemoved,
            schemasModified,
            assetsAdded,
            assetsRemoved,
        };
    }
}
exports.ManifestGenerator = ManifestGenerator;
/**
 * Get singleton manifest generator instance
 */
let generatorInstance = null;
function getManifestGenerator(baseDir) {
    if (!generatorInstance || (baseDir && generatorInstance['baseDir'] !== baseDir)) {
        generatorInstance = new ManifestGenerator(baseDir);
    }
    return generatorInstance;
}
/**
 * Reset generator instance (useful for testing)
 */
function resetManifestGenerator() {
    generatorInstance = null;
}
