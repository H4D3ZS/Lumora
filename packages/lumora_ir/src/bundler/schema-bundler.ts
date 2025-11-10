/**
 * Schema Bundler
 * Packages Lumora IR schemas with assets for distribution and deployment
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { LumoraIR, LumoraNode } from '../types/ir-types';
import { AssetManager, AssetReference } from '../assets/asset-manager';

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

export class SchemaBundler {
  private baseDir: string;
  private assetManager?: AssetManager;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
  }

  /**
   * Bundle schemas and assets
   */
  async bundle(config: BundleConfig): Promise<Bundle> {
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
    const manifest = this.generateManifest(
      config.entry,
      schemas,
      assets,
      config
    );

    // Create bundle
    let bundle: Bundle = {
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
  private async collectSchemas(entryPath: string): Promise<Map<string, LumoraIR>> {
    const schemas = new Map<string, LumoraIR>();
    const visited = new Set<string>();

    const collect = async (schemaPath: string) => {
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
  private async loadSchema(schemaPath: string): Promise<LumoraIR> {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    
    try {
      const schema = JSON.parse(content) as LumoraIR;
      
      // Validate basic structure
      if (!schema.version || !schema.metadata || !schema.nodes) {
        throw new Error('Invalid schema structure');
      }
      
      return schema;
    } catch (error) {
      throw new Error(`Failed to parse schema ${schemaPath}: ${error}`);
    }
  }

  /**
   * Extract dependencies from schema
   */
  private extractDependencies(schema: LumoraIR): string[] {
    const dependencies: Set<string> = new Set();

    const traverse = (node: LumoraNode) => {
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
  private async collectAssets(schemas: Map<string, LumoraIR>): Promise<Map<string, Buffer>> {
    const assets = new Map<string, Buffer>();
    const assetPaths = new Set<string>();

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
  private extractAssetReferences(schema: LumoraIR): string[] {
    const assets: Set<string> = new Set();

    const traverse = (node: LumoraNode) => {
      // Check for image sources
      if (node.type === 'Image' && node.props?.source) {
        const source = node.props.source;
        if (typeof source === 'string') {
          assets.add(source);
        } else if (source?.uri) {
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
  private resolveAssetPath(assetPath: string): string | null {
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
  private treeShake(schemas: Map<string, LumoraIR>): void {
    const usedNodeIds = new Set<string>();

    // Mark all nodes as used (simplified - in real implementation,
    // we would track which nodes are actually referenced)
    for (const schema of schemas.values()) {
      const markUsed = (node: LumoraNode) => {
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
  private minify(schemas: Map<string, LumoraIR>): void {
    for (const schema of schemas.values()) {
      // Remove optional metadata
      if (schema.metadata.author) {
        delete schema.metadata.author;
      }

      // Minify nodes
      const minifyNode = (node: LumoraNode) => {
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
  private generateManifest(
    entry: string,
    schemas: Map<string, LumoraIR>,
    assets: Map<string, Buffer>,
    config: BundleConfig
  ): BundleManifest {
    const schemaRefs: SchemaReference[] = [];
    
    for (const [schemaPath, schema] of schemas.entries()) {
      const content = JSON.stringify(schema);
      schemaRefs.push({
        path: path.relative(config.baseDir || this.baseDir, schemaPath),
        checksum: this.calculateChecksum(content),
        size: Buffer.byteLength(content, 'utf-8'),
      });
    }

    const assetRefs: AssetReference[] = [];
    
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
  private calculateChecksum(content: string | Buffer): string {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  /**
   * Calculate total bundle size
   */
  private calculateSize(
    schemas: Map<string, LumoraIR>,
    assets: Map<string, Buffer>
  ): number {
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
  private async compress(bundle: Bundle): Promise<Bundle> {
    const compressedSchemas = new Map<string, LumoraIR>();
    const compressedAssets = new Map<string, Buffer>();

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
  private getAssetType(assetPath: string): 'image' | 'font' | 'other' {
    const ext = path.extname(assetPath).toLowerCase();
    
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
    const fontExts = ['.ttf', '.otf', '.woff', '.woff2'];

    if (imageExts.includes(ext)) {
      return 'image';
    } else if (fontExts.includes(ext)) {
      return 'font';
    }
    
    return 'other';
  }

  /**
   * Extract package dependencies
   */
  private extractPackageDependencies(): Record<string, string> {
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
    } catch {
      return {};
    }
  }

  /**
   * Write bundle to disk
   */
  async writeBundle(bundle: Bundle, outputPath: string): Promise<void> {
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
    fs.writeFileSync(
      outputPath,
      JSON.stringify(bundleData, null, 2),
      'utf-8'
    );
  }

  /**
   * Load bundle from disk
   */
  async loadBundle(bundlePath: string): Promise<Bundle> {
    if (!fs.existsSync(bundlePath)) {
      throw new Error(`Bundle not found: ${bundlePath}`);
    }

    const content = fs.readFileSync(bundlePath, 'utf-8');
    const bundleData = JSON.parse(content);

    // Reconstruct schemas map
    const schemas = new Map<string, LumoraIR>();
    for (const { path: schemaPath, content: schemaContent } of bundleData.schemas) {
      schemas.set(schemaPath, schemaContent);
    }

    // Reconstruct assets map
    const assets = new Map<string, Buffer>();
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

/**
 * Get singleton bundler instance
 */
let bundlerInstance: SchemaBundler | null = null;

export function getBundler(baseDir?: string): SchemaBundler {
  if (!bundlerInstance || (baseDir && bundlerInstance['baseDir'] !== baseDir)) {
    bundlerInstance = new SchemaBundler(baseDir);
  }
  return bundlerInstance;
}

/**
 * Reset bundler instance (useful for testing)
 */
export function resetBundler(): void {
  bundlerInstance = null;
}
