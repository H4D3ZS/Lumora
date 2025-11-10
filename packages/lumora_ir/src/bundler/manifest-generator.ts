/**
 * Manifest Generator
 * Generates bundle manifests with schema and asset references
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
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

export class ManifestGenerator {
  private baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
  }

  /**
   * Generate bundle manifest
   */
  generate(
    config: ManifestConfig,
    schemas: Map<string, LumoraIR>,
    assets: Map<string, Buffer>
  ): BundleManifest {
    const schemaRefs = this.generateSchemaReferences(schemas, config);
    const assetRefs = this.generateAssetReferences(assets);
    const dependencies = config.includeDependencies !== false
      ? this.extractDependencies()
      : {};

    const bundleSize = this.calculateBundleSize(schemas, assets);

    const manifest: BundleManifest = {
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
  private generateSchemaReferences(
    schemas: Map<string, LumoraIR>,
    config: ManifestConfig
  ): SchemaReference[] {
    const references: SchemaReference[] = [];

    for (const [schemaPath, schema] of schemas.entries()) {
      const content = JSON.stringify(schema);
      const relativePath = path.relative(
        config.baseDir || this.baseDir,
        schemaPath
      );

      const ref: SchemaReference = {
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
  private generateAssetReferences(
    assets: Map<string, Buffer>
  ): AssetReference[] {
    const references: AssetReference[] = [];

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
  private extractDependencies(): Record<string, string> {
    const packageJsonPath = path.join(this.baseDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return {};
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps: Record<string, string> = {};

      // Include runtime dependencies
      if (packageJson.dependencies) {
        Object.assign(deps, packageJson.dependencies);
      }

      // Include peer dependencies
      if (packageJson.peerDependencies) {
        Object.assign(deps, packageJson.peerDependencies);
      }

      return deps;
    } catch (error) {
      console.warn('Failed to extract dependencies:', error);
      return {};
    }
  }

  /**
   * Extract detailed dependency information
   */
  extractDetailedDependencies(): DependencyInfo[] {
    const packageJsonPath = path.join(this.baseDir, 'package.json');
    const packageLockPath = path.join(this.baseDir, 'package-lock.json');

    if (!fs.existsSync(packageJsonPath)) {
      return [];
    }

    const dependencies: DependencyInfo[] = [];

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.peerDependencies || {}),
      };

      // Try to get detailed info from package-lock.json
      let lockData: any = {};
      if (fs.existsSync(packageLockPath)) {
        lockData = JSON.parse(fs.readFileSync(packageLockPath, 'utf-8'));
      }

      for (const [name, version] of Object.entries(deps)) {
        const info: DependencyInfo = {
          name,
          version: version as string,
        };

        // Add lock file info if available
        if (lockData.packages && lockData.packages[`node_modules/${name}`]) {
          const lockInfo = lockData.packages[`node_modules/${name}`];
          info.resolved = lockInfo.resolved;
          info.integrity = lockInfo.integrity;
        }

        dependencies.push(info);
      }
    } catch (error) {
      console.warn('Failed to extract detailed dependencies:', error);
    }

    return dependencies;
  }

  /**
   * Calculate total bundle size
   */
  private calculateBundleSize(
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
   * Calculate checksum for content
   */
  private calculateChecksum(content: string | Buffer): string {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  /**
   * Calculate manifest checksum
   */
  private calculateManifestChecksum(manifest: BundleManifest): string {
    // Create a copy without the checksum field
    const manifestCopy: any = { ...manifest };
    delete manifestCopy.checksum;

    const content = JSON.stringify(manifestCopy, null, 2);
    return this.calculateChecksum(content);
  }

  /**
   * Generate manifest metadata
   */
  private generateMetadata(): ManifestMetadata {
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
  private getGeneratorVersion(): string {
    try {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version || '1.0.0';
      }
    } catch {
      // Ignore errors
    }
    return '1.0.0';
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
   * Validate manifest structure
   */
  validateManifest(manifest: BundleManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

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
  writeManifest(manifest: BundleManifest, outputPath: string): void {
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      outputPath,
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );
  }

  /**
   * Read manifest from file
   */
  readManifest(manifestPath: string): BundleManifest {
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest not found: ${manifestPath}`);
    }

    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content) as BundleManifest;

    // Validate manifest
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(
        `Invalid manifest: ${validation.errors.join(', ')}`
      );
    }

    return manifest;
  }

  /**
   * Compare two manifests
   */
  compareManifests(
    manifest1: BundleManifest,
    manifest2: BundleManifest
  ): {
    schemasAdded: string[];
    schemasRemoved: string[];
    schemasModified: string[];
    assetsAdded: string[];
    assetsRemoved: string[];
  } {
    const schemas1 = new Map(manifest1.schemas.map(s => [s.path, s.checksum]));
    const schemas2 = new Map(manifest2.schemas.map(s => [s.path, s.checksum]));

    const schemasAdded: string[] = [];
    const schemasRemoved: string[] = [];
    const schemasModified: string[] = [];

    // Find added and modified schemas
    schemas2.forEach((checksum, path) => {
      if (!schemas1.has(path)) {
        schemasAdded.push(path);
      } else if (schemas1.get(path) !== checksum) {
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

/**
 * Get singleton manifest generator instance
 */
let generatorInstance: ManifestGenerator | null = null;

export function getManifestGenerator(baseDir?: string): ManifestGenerator {
  if (!generatorInstance || (baseDir && generatorInstance['baseDir'] !== baseDir)) {
    generatorInstance = new ManifestGenerator(baseDir);
  }
  return generatorInstance;
}

/**
 * Reset generator instance (useful for testing)
 */
export function resetManifestGenerator(): void {
  generatorInstance = null;
}
