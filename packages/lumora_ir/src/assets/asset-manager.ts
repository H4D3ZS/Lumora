/**
 * Asset Manager
 * Handles syncing and managing assets between React and Flutter frameworks
 */

import * as fs from 'fs';
import * as path from 'path';

export interface AssetReference {
  type: 'image' | 'font' | 'other';
  sourcePath: string;
  targetPath: string;
  framework: 'react' | 'flutter';
}

export interface AssetSyncOptions {
  reactAssetsDir: string;
  flutterAssetsDir: string;
  dryRun?: boolean;
}

export class AssetManager {
  private reactAssetsDir: string;
  private flutterAssetsDir: string;

  constructor(options: AssetSyncOptions) {
    this.reactAssetsDir = options.reactAssetsDir;
    this.flutterAssetsDir = options.flutterAssetsDir;
  }

  /**
   * Sync assets from React to Flutter
   */
  syncReactToFlutter(assetPaths: string[]): AssetReference[] {
    const synced: AssetReference[] = [];

    for (const assetPath of assetPaths) {
      const sourcePath = path.join(this.reactAssetsDir, assetPath);
      
      if (!fs.existsSync(sourcePath)) {
        console.warn(`Asset not found: ${sourcePath}`);
        continue;
      }

      const targetPath = path.join(this.flutterAssetsDir, assetPath);
      this.ensureDirectoryExists(path.dirname(targetPath));

      fs.copyFileSync(sourcePath, targetPath);

      synced.push({
        type: this.getAssetType(assetPath),
        sourcePath: assetPath,
        targetPath: assetPath,
        framework: 'flutter',
      });
    }

    return synced;
  }

  /**
   * Sync assets from Flutter to React
   */
  syncFlutterToReact(assetPaths: string[]): AssetReference[] {
    const synced: AssetReference[] = [];

    for (const assetPath of assetPaths) {
      const sourcePath = path.join(this.flutterAssetsDir, assetPath);
      
      if (!fs.existsSync(sourcePath)) {
        console.warn(`Asset not found: ${sourcePath}`);
        continue;
      }

      const targetPath = path.join(this.reactAssetsDir, assetPath);
      this.ensureDirectoryExists(path.dirname(targetPath));

      fs.copyFileSync(sourcePath, targetPath);

      synced.push({
        type: this.getAssetType(assetPath),
        sourcePath: assetPath,
        targetPath: assetPath,
        framework: 'react',
      });
    }

    return synced;
  }

  /**
   * Extract asset references from IR
   */
  extractAssetReferences(ir: any): string[] {
    const assets: Set<string> = new Set();

    const traverse = (node: any) => {
      if (!node) return;

      // Check for image sources
      if (node.type === 'Image' && node.props?.source) {
        const source = node.props.source;
        if (typeof source === 'string') {
          assets.add(source);
        } else if (source.uri) {
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

      // Traverse children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    };

    if (ir.nodes && Array.isArray(ir.nodes)) {
      ir.nodes.forEach(traverse);
    }

    return Array.from(assets);
  }

  /**
   * Determine asset type from file extension
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
   * Ensure directory exists, create if not
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Get all assets in a directory
   */
  getAllAssets(framework: 'react' | 'flutter'): string[] {
    const baseDir = framework === 'react' ? this.reactAssetsDir : this.flutterAssetsDir;
    
    if (!fs.existsSync(baseDir)) {
      return [];
    }

    const assets: string[] = [];
    
    const traverse = (dir: string, relativePath: string = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          traverse(fullPath, relPath);
        } else {
          assets.push(relPath);
        }
      }
    };

    traverse(baseDir);
    return assets;
  }
}
