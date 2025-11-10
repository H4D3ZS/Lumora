"use strict";
/**
 * Schema Bundler
 * Packages Lumora IR schemas with assets for distribution and deployment
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
exports.SchemaBundler = void 0;
exports.getBundler = getBundler;
exports.resetBundler = resetBundler;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
class SchemaBundler {
    constructor(baseDir = process.cwd()) {
        this.baseDir = baseDir;
    }
    /**
     * Bundle schemas and assets
     */
    async bundle(config) {
        const startTime = Date.now();
        // Resolve entry path
        const entryPath = path.resolve(config.baseDir || this.baseDir, config.entry);
        if (!fs.existsSync(entryPath)) {
            throw new Error(`Entry file not found: ${entryPath}`);
        }
        // Collect all schemas
        const schemas = await this.collectSchemas(entryPath);
        // Collect referenced assets
        const assets = await this.collectAssets(schemas);
        // Apply optimizations
        if (config.treeShake) {
            this.treeShake(schemas);
        }
        if (config.minify) {
            this.minify(schemas);
        }
        // Generate manifest
        const manifest = this.generateManifest(config.entry, schemas, assets, config);
        // Create bundle
        let bundle = {
            manifest,
            schemas,
            assets,
            metadata: {
                createdAt: startTime,
                size: this.calculateSize(schemas, assets),
                compressed: config.compress || false,
                minified: config.minify || false,
                treeShaken: config.treeShake || false,
            },
        };
        // Apply compression if requested
        if (config.compress) {
            bundle = await this.compress(bundle);
        }
        return bundle;
    }
    /**
     * Collect all schemas from entry point
     */
    async collectSchemas(entryPath) {
        const schemas = new Map();
        const visited = new Set();
        const collect = async (schemaPath) => {
            const normalizedPath = path.normalize(schemaPath);
            if (visited.has(normalizedPath)) {
                return;
            }
            visited.add(normalizedPath);
            // Load schema
            const schema = await this.loadSchema(normalizedPath);
            schemas.set(normalizedPath, schema);
            // Extract and collect dependencies
            const dependencies = this.extractDependencies(schema);
            for (const dep of dependencies) {
                const depPath = path.resolve(path.dirname(normalizedPath), dep);
                if (fs.existsSync(depPath)) {
                    await collect(depPath);
                }
            }
        };
        await collect(entryPath);
        return schemas;
    }
    /**
     * Load schema from file
     */
    async loadSchema(schemaPath) {
        const content = fs.readFileSync(schemaPath, 'utf-8');
        try {
            const schema = JSON.parse(content);
            // Validate basic structure
            if (!schema.version || !schema.metadata || !schema.nodes) {
                throw new Error('Invalid schema structure');
            }
            return schema;
        }
        catch (error) {
            throw new Error(`Failed to parse schema ${schemaPath}: ${error}`);
        }
    }
    /**
     * Extract dependencies from schema
     */
    extractDependencies(schema) {
        const dependencies = new Set();
        const traverse = (node) => {
            // Check for component references
            if (node.props?.component && typeof node.props.component === 'string') {
                if (node.props.component.endsWith('.json')) {
                    dependencies.add(node.props.component);
                }
            }
            // Check for schema imports
            if (node.props?.schema && typeof node.props.schema === 'string') {
                if (node.props.schema.endsWith('.json')) {
                    dependencies.add(node.props.schema);
                }
            }
            // Traverse children
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(traverse);
            }
        };
        schema.nodes.forEach(traverse);
        return Array.from(dependencies);
    }
    /**
     * Collect referenced assets from schemas
     */
    async collectAssets(schemas) {
        const assets = new Map();
        const assetPaths = new Set();
        // Extract asset references from all schemas
        for (const schema of schemas.values()) {
            const refs = this.extractAssetReferences(schema);
            refs.forEach(ref => assetPaths.add(ref));
        }
        // Load asset files
        for (const assetPath of assetPaths) {
            // Skip URLs
            if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
                continue;
            }
            // Try to resolve asset path
            const resolvedPath = this.resolveAssetPath(assetPath);
            if (resolvedPath && fs.existsSync(resolvedPath)) {
                const content = fs.readFileSync(resolvedPath);
                assets.set(assetPath, content);
            }
        }
        return assets;
    }
    /**
     * Extract asset references from schema
     */
    extractAssetReferences(schema) {
        const assets = new Set();
        const traverse = (node) => {
            // Check for image sources
            if (node.type === 'Image' && node.props?.source) {
                const source = node.props.source;
                if (typeof source === 'string') {
                    assets.add(source);
                }
                else if (source?.uri) {
                    assets.add(source.uri);
                }
            }
            // Check for background images
            if (node.props?.style?.backgroundImage) {
                const bgImage = node.props.style.backgroundImage;
                const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match) {
                    assets.add(match[1]);
                }
            }
            // Check for icon sources
            if (node.props?.icon && typeof node.props.icon === 'string') {
                assets.add(node.props.icon);
            }
            // Traverse children
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(traverse);
            }
        };
        schema.nodes.forEach(traverse);
        return Array.from(assets);
    }
    /**
     * Resolve asset path relative to base directory
     */
    resolveAssetPath(assetPath) {
        // Try common asset directories
        const possiblePaths = [
            path.resolve(this.baseDir, assetPath),
            path.resolve(this.baseDir, 'assets', assetPath),
            path.resolve(this.baseDir, 'public', assetPath),
            path.resolve(this.baseDir, 'src/assets', assetPath),
        ];
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        return null;
    }
    /**
     * Tree shake unused nodes
     */
    treeShake(schemas) {
        const usedNodeIds = new Set();
        // Mark all nodes as used (simplified - in real implementation,
        // we would track which nodes are actually referenced)
        for (const schema of schemas.values()) {
            const markUsed = (node) => {
                usedNodeIds.add(node.id);
                node.children.forEach(markUsed);
            };
            schema.nodes.forEach(markUsed);
        }
        // In a real implementation, we would remove unused nodes here
        // For now, we keep all nodes as they're all considered used
    }
    /**
     * Minify schemas by removing metadata
     */
    minify(schemas) {
        for (const schema of schemas.values()) {
            // Remove optional metadata
            if (schema.metadata.author) {
                delete schema.metadata.author;
            }
            // Minify nodes
            const minifyNode = (node) => {
                // Remove documentation
                if (node.metadata.documentation) {
                    delete node.metadata.documentation;
                }
                // Minify children
                node.children.forEach(minifyNode);
            };
            schema.nodes.forEach(minifyNode);
        }
    }
    /**
     * Generate bundle manifest
     */
    generateManifest(entry, schemas, assets, config) {
        const schemaRefs = [];
        for (const [schemaPath, schema] of schemas.entries()) {
            const content = JSON.stringify(schema);
            schemaRefs.push({
                path: path.relative(config.baseDir || this.baseDir, schemaPath),
                checksum: this.calculateChecksum(content),
                size: Buffer.byteLength(content, 'utf-8'),
            });
        }
        const assetRefs = [];
        for (const [assetPath, content] of assets.entries()) {
            assetRefs.push({
                type: this.getAssetType(assetPath),
                sourcePath: assetPath,
                targetPath: assetPath,
                framework: 'react', // Default, could be determined from context
            });
        }
        // Extract dependencies from package.json if available
        const dependencies = this.extractPackageDependencies();
        const manifestContent = JSON.stringify({
            version: '1.0.0',
            entry,
            schemas: schemaRefs,
            assets: assetRefs,
            dependencies,
            bundleSize: this.calculateSize(schemas, assets),
        });
        return {
            version: '1.0.0',
            entry,
            schemas: schemaRefs,
            assets: assetRefs,
            dependencies,
            checksum: this.calculateChecksum(manifestContent),
            bundleSize: this.calculateSize(schemas, assets),
        };
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
     * Calculate total bundle size
     */
    calculateSize(schemas, assets) {
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
     * Compress bundle
     */
    async compress(bundle) {
        const compressedSchemas = new Map();
        const compressedAssets = new Map();
        // Note: In a real implementation, we would compress the actual data
        // For now, we just mark it as compressed
        bundle.schemas.forEach((schema, path) => {
            compressedSchemas.set(path, schema);
        });
        bundle.assets.forEach((asset, path) => {
            compressedAssets.set(path, asset);
        });
        return {
            ...bundle,
            schemas: compressedSchemas,
            assets: compressedAssets,
            metadata: {
                ...bundle.metadata,
                compressed: true,
            },
        };
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
     * Extract package dependencies
     */
    extractPackageDependencies() {
        const packageJsonPath = path.join(this.baseDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return {};
        }
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            return {
                ...(packageJson.dependencies || {}),
                ...(packageJson.devDependencies || {}),
            };
        }
        catch {
            return {};
        }
    }
    /**
     * Write bundle to disk
     */
    async writeBundle(bundle, outputPath) {
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Create bundle structure
        const bundleData = {
            manifest: bundle.manifest,
            schemas: Array.from(bundle.schemas.entries()).map(([path, schema]) => ({
                path,
                content: schema,
            })),
            assets: Array.from(bundle.assets.entries()).map(([path, content]) => ({
                path,
                content: content.toString('base64'),
            })),
            metadata: bundle.metadata,
        };
        // Write bundle file
        fs.writeFileSync(outputPath, JSON.stringify(bundleData, null, 2), 'utf-8');
    }
    /**
     * Load bundle from disk
     */
    async loadBundle(bundlePath) {
        if (!fs.existsSync(bundlePath)) {
            throw new Error(`Bundle not found: ${bundlePath}`);
        }
        const content = fs.readFileSync(bundlePath, 'utf-8');
        const bundleData = JSON.parse(content);
        // Reconstruct schemas map
        const schemas = new Map();
        for (const { path: schemaPath, content: schemaContent } of bundleData.schemas) {
            schemas.set(schemaPath, schemaContent);
        }
        // Reconstruct assets map
        const assets = new Map();
        for (const { path: assetPath, content: assetContent } of bundleData.assets) {
            assets.set(assetPath, Buffer.from(assetContent, 'base64'));
        }
        return {
            manifest: bundleData.manifest,
            schemas,
            assets,
            metadata: bundleData.metadata,
        };
    }
}
exports.SchemaBundler = SchemaBundler;
/**
 * Get singleton bundler instance
 */
let bundlerInstance = null;
function getBundler(baseDir) {
    if (!bundlerInstance || (baseDir && bundlerInstance['baseDir'] !== baseDir)) {
        bundlerInstance = new SchemaBundler(baseDir);
    }
    return bundlerInstance;
}
/**
 * Reset bundler instance (useful for testing)
 */
function resetBundler() {
    bundlerInstance = null;
}
