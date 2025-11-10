/**
 * Bundle Optimizer
 * Provides optimization features for schema bundles
 */

import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { LumoraIR, LumoraNode } from '../types/ir-types';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface OptimizationOptions {
  treeShake?: boolean;
  minify?: boolean;
  compress?: boolean;
  removeComments?: boolean;
  removeUnusedProps?: boolean;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  removedNodes: number;
  removedProps: number;
}

export class BundleOptimizer {
  /**
   * Optimize schemas with various techniques
   */
  async optimize(
    schemas: Map<string, LumoraIR>,
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> {
    const originalSize = this.calculateTotalSize(schemas);
    let removedNodes = 0;
    let removedProps = 0;

    // Apply tree shaking
    if (options.treeShake) {
      const result = this.treeShake(schemas);
      removedNodes += result.removedNodes;
    }

    // Apply minification
    if (options.minify) {
      const result = this.minify(schemas, {
        removeComments: options.removeComments !== false,
        removeUnusedProps: options.removeUnusedProps !== false,
      });
      removedProps += result.removedProps;
    }

    const optimizedSize = this.calculateTotalSize(schemas);
    const compressionRatio = originalSize > 0 ? optimizedSize / originalSize : 1;

    return {
      originalSize,
      optimizedSize,
      compressionRatio,
      removedNodes,
      removedProps,
    };
  }

  /**
   * Tree shake unused nodes from schemas
   */
  treeShake(schemas: Map<string, LumoraIR>): { removedNodes: number } {
    let removedNodes = 0;
    const usedNodeIds = new Set<string>();
    const nodeRegistry = new Map<string, LumoraNode>();

    // Build node registry
    for (const schema of schemas.values()) {
      const registerNodes = (node: LumoraNode) => {
        nodeRegistry.set(node.id, node);
        node.children.forEach(registerNodes);
      };
      schema.nodes.forEach(registerNodes);
    }

    // Mark nodes as used starting from root nodes
    for (const schema of schemas.values()) {
      const markUsed = (node: LumoraNode) => {
        if (usedNodeIds.has(node.id)) {
          return; // Already marked
        }

        usedNodeIds.add(node.id);

        // Mark children as used
        node.children.forEach(markUsed);

        // Mark referenced nodes as used
        if (node.props?.ref && typeof node.props.ref === 'string') {
          const refNode = nodeRegistry.get(node.props.ref);
          if (refNode) {
            markUsed(refNode);
          }
        }
      };

      schema.nodes.forEach(markUsed);
    }

    // Remove unused nodes
    for (const schema of schemas.values()) {
      const filterUnused = (node: LumoraNode): LumoraNode | null => {
        if (!usedNodeIds.has(node.id)) {
          removedNodes++;
          return null;
        }

        // Filter children
        node.children = node.children
          .map(filterUnused)
          .filter((n): n is LumoraNode => n !== null);

        return node;
      };

      schema.nodes = schema.nodes
        .map(filterUnused)
        .filter((n): n is LumoraNode => n !== null);
    }

    return { removedNodes };
  }

  /**
   * Minify schemas by removing unnecessary data
   */
  minify(
    schemas: Map<string, LumoraIR>,
    options: { removeComments?: boolean; removeUnusedProps?: boolean } = {}
  ): { removedProps: number } {
    let removedProps = 0;

    for (const schema of schemas.values()) {
      // Remove optional metadata
      if (schema.metadata.author) {
        delete schema.metadata.author;
        removedProps++;
      }

      if (schema.metadata.irVersion) {
        delete schema.metadata.irVersion;
        removedProps++;
      }

      // Minify nodes
      const minifyNode = (node: LumoraNode) => {
        // Remove documentation if requested
        if (options.removeComments && node.metadata.documentation) {
          delete node.metadata.documentation;
          removedProps++;
        }

        // Remove unused props
        if (options.removeUnusedProps) {
          const unusedProps = this.findUnusedProps(node);
          unusedProps.forEach(prop => {
            delete node.props[prop];
            removedProps++;
          });
        }

        // Minify children
        node.children.forEach(minifyNode);
      };

      schema.nodes.forEach(minifyNode);
    }

    return { removedProps };
  }

  /**
   * Find unused props in a node
   */
  private findUnusedProps(node: LumoraNode): string[] {
    const unusedProps: string[] = [];

    // Check for props that are null or undefined
    for (const [key, value] of Object.entries(node.props)) {
      if (value === null || value === undefined) {
        unusedProps.push(key);
      }

      // Check for empty objects or arrays
      if (typeof value === 'object') {
        if (Array.isArray(value) && value.length === 0) {
          unusedProps.push(key);
        } else if (Object.keys(value).length === 0) {
          unusedProps.push(key);
        }
      }

      // Check for empty strings
      if (typeof value === 'string' && value.trim() === '') {
        unusedProps.push(key);
      }
    }

    return unusedProps;
  }

  /**
   * Compress schemas using gzip
   */
  async compressSchemas(
    schemas: Map<string, LumoraIR>
  ): Promise<Map<string, Buffer>> {
    const compressed = new Map<string, Buffer>();

    for (const [path, schema] of schemas.entries()) {
      const json = JSON.stringify(schema);
      const buffer = Buffer.from(json, 'utf-8');
      const compressedBuffer = await gzip(buffer);
      compressed.set(path, compressedBuffer);
    }

    return compressed;
  }

  /**
   * Decompress schemas
   */
  async decompressSchemas(
    compressed: Map<string, Buffer>
  ): Promise<Map<string, LumoraIR>> {
    const schemas = new Map<string, LumoraIR>();

    for (const [path, buffer] of compressed.entries()) {
      const decompressed = await gunzip(buffer);
      const json = decompressed.toString('utf-8');
      const schema = JSON.parse(json) as LumoraIR;
      schemas.set(path, schema);
    }

    return schemas;
  }

  /**
   * Compress assets using gzip
   */
  async compressAssets(
    assets: Map<string, Buffer>
  ): Promise<Map<string, Buffer>> {
    const compressed = new Map<string, Buffer>();

    for (const [path, buffer] of assets.entries()) {
      const compressedBuffer = await gzip(buffer);
      compressed.set(path, compressedBuffer);
    }

    return compressed;
  }

  /**
   * Decompress assets
   */
  async decompressAssets(
    compressed: Map<string, Buffer>
  ): Promise<Map<string, Buffer>> {
    const assets = new Map<string, Buffer>();

    for (const [path, buffer] of compressed.entries()) {
      const decompressed = await gunzip(buffer);
      assets.set(path, decompressed);
    }

    return assets;
  }

  /**
   * Calculate checksum for content
   */
  calculateChecksum(content: string | Buffer): string {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  /**
   * Verify checksum
   */
  verifyChecksum(content: string | Buffer, expectedChecksum: string): boolean {
    const actualChecksum = this.calculateChecksum(content);
    return actualChecksum === expectedChecksum;
  }

  /**
   * Calculate total size of schemas
   */
  private calculateTotalSize(schemas: Map<string, LumoraIR>): number {
    let size = 0;

    for (const schema of schemas.values()) {
      const json = JSON.stringify(schema);
      size += Buffer.byteLength(json, 'utf-8');
    }

    return size;
  }

  /**
   * Calculate compression ratio
   */
  calculateCompressionRatio(
    originalSize: number,
    compressedSize: number
  ): number {
    if (originalSize === 0) return 1;
    return compressedSize / originalSize;
  }

  /**
   * Format size in human-readable format
   */
  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

/**
 * Get singleton optimizer instance
 */
let optimizerInstance: BundleOptimizer | null = null;

export function getOptimizer(): BundleOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new BundleOptimizer();
  }
  return optimizerInstance;
}

/**
 * Reset optimizer instance (useful for testing)
 */
export function resetOptimizer(): void {
  optimizerInstance = null;
}
