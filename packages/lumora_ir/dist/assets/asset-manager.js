"use strict";
/**
 * Asset Manager
 * Handles syncing and managing assets between React and Flutter frameworks
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
exports.AssetManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class AssetManager {
    constructor(options) {
        this.reactAssetsDir = options.reactAssetsDir;
        this.flutterAssetsDir = options.flutterAssetsDir;
    }
    /**
     * Sync assets from React to Flutter
     */
    syncReactToFlutter(assetPaths) {
        const synced = [];
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
    syncFlutterToReact(assetPaths) {
        const synced = [];
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
    extractAssetReferences(ir) {
        const assets = new Set();
        const traverse = (node) => {
            if (!node)
                return;
            // Check for image sources
            if (node.type === 'Image' && node.props?.source) {
                const source = node.props.source;
                if (typeof source === 'string') {
                    assets.add(source);
                }
                else if (source.uri) {
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
     * Ensure directory exists, create if not
     */
    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    /**
     * Get all assets in a directory
     */
    getAllAssets(framework) {
        const baseDir = framework === 'react' ? this.reactAssetsDir : this.flutterAssetsDir;
        if (!fs.existsSync(baseDir)) {
            return [];
        }
        const assets = [];
        const traverse = (dir, relativePath = '') => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relPath = path.join(relativePath, entry.name);
                if (entry.isDirectory()) {
                    traverse(fullPath, relPath);
                }
                else {
                    assets.push(relPath);
                }
            }
        };
        traverse(baseDir);
        return assets;
    }
}
exports.AssetManager = AssetManager;
