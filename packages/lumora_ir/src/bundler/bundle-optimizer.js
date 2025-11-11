"use strict";
/**
 * Bundle Optimizer
 * Provides optimization features for schema bundles
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
exports.BundleOptimizer = void 0;
exports.getOptimizer = getOptimizer;
exports.resetOptimizer = resetOptimizer;
const crypto = __importStar(require("crypto"));
const zlib = __importStar(require("zlib"));
const util_1 = require("util");
const gzip = (0, util_1.promisify)(zlib.gzip);
const gunzip = (0, util_1.promisify)(zlib.gunzip);
class BundleOptimizer {
    /**
     * Optimize schemas with various techniques
     */
    async optimize(schemas, options = {}) {
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
    treeShake(schemas) {
        let removedNodes = 0;
        const usedNodeIds = new Set();
        const nodeRegistry = new Map();
        // Build node registry
        for (const schema of schemas.values()) {
            const registerNodes = (node) => {
                nodeRegistry.set(node.id, node);
                node.children.forEach(registerNodes);
            };
            schema.nodes.forEach(registerNodes);
        }
        // Mark nodes as used starting from root nodes
        for (const schema of schemas.values()) {
            const markUsed = (node) => {
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
            const filterUnused = (node) => {
                if (!usedNodeIds.has(node.id)) {
                    removedNodes++;
                    return null;
                }
                // Filter children
                node.children = node.children
                    .map(filterUnused)
                    .filter((n) => n !== null);
                return node;
            };
            schema.nodes = schema.nodes
                .map(filterUnused)
                .filter((n) => n !== null);
        }
        return { removedNodes };
    }
    /**
     * Minify schemas by removing unnecessary data
     */
    minify(schemas, options = {}) {
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
            const minifyNode = (node) => {
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
    findUnusedProps(node) {
        const unusedProps = [];
        // Check for props that are null or undefined
        for (const [key, value] of Object.entries(node.props)) {
            if (value === null || value === undefined) {
                unusedProps.push(key);
            }
            // Check for empty objects or arrays
            if (typeof value === 'object') {
                if (Array.isArray(value) && value.length === 0) {
                    unusedProps.push(key);
                }
                else if (Object.keys(value).length === 0) {
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
    async compressSchemas(schemas) {
        const compressed = new Map();
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
    async decompressSchemas(compressed) {
        const schemas = new Map();
        for (const [path, buffer] of compressed.entries()) {
            const decompressed = await gunzip(buffer);
            const json = decompressed.toString('utf-8');
            const schema = JSON.parse(json);
            schemas.set(path, schema);
        }
        return schemas;
    }
    /**
     * Compress assets using gzip
     */
    async compressAssets(assets) {
        const compressed = new Map();
        for (const [path, buffer] of assets.entries()) {
            const compressedBuffer = await gzip(buffer);
            compressed.set(path, compressedBuffer);
        }
        return compressed;
    }
    /**
     * Decompress assets
     */
    async decompressAssets(compressed) {
        const assets = new Map();
        for (const [path, buffer] of compressed.entries()) {
            const decompressed = await gunzip(buffer);
            assets.set(path, decompressed);
        }
        return assets;
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
     * Verify checksum
     */
    verifyChecksum(content, expectedChecksum) {
        const actualChecksum = this.calculateChecksum(content);
        return actualChecksum === expectedChecksum;
    }
    /**
     * Calculate total size of schemas
     */
    calculateTotalSize(schemas) {
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
    calculateCompressionRatio(originalSize, compressedSize) {
        if (originalSize === 0)
            return 1;
        return compressedSize / originalSize;
    }
    /**
     * Format size in human-readable format
     */
    formatSize(bytes) {
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
exports.BundleOptimizer = BundleOptimizer;
/**
 * Get singleton optimizer instance
 */
let optimizerInstance = null;
function getOptimizer() {
    if (!optimizerInstance) {
        optimizerInstance = new BundleOptimizer();
    }
    return optimizerInstance;
}
/**
 * Reset optimizer instance (useful for testing)
 */
function resetOptimizer() {
    optimizerInstance = null;
}
//# sourceMappingURL=bundle-optimizer.js.map