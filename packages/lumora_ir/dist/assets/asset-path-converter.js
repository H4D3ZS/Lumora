"use strict";
/**
 * Asset Path Converter
 * Converts asset paths between React and Flutter conventions
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
exports.AssetPathConverter = void 0;
const path = __importStar(require("path"));
class AssetPathConverter {
    constructor(options = {}) {
        this.reactPublicPath = options.reactPublicPath || '/';
        this.flutterAssetsPath = options.flutterAssetsPath || 'assets/';
    }
    /**
     * Convert React asset path to Flutter asset path
     * React: /images/logo.png or ./images/logo.png
     * Flutter: assets/images/logo.png
     */
    reactToFlutter(reactPath) {
        // Remove leading slash or ./
        let cleanPath = reactPath.replace(/^\//, '').replace(/^\.\//, '');
        // Remove public path prefix if present
        if (this.reactPublicPath !== '/' && cleanPath.startsWith(this.reactPublicPath)) {
            cleanPath = cleanPath.substring(this.reactPublicPath.length);
        }
        // Add Flutter assets prefix
        return path.join(this.flutterAssetsPath, cleanPath).replace(/\\/g, '/');
    }
    /**
     * Convert Flutter asset path to React asset path
     * Flutter: assets/images/logo.png
     * React: /images/logo.png
     */
    flutterToReact(flutterPath) {
        // Remove Flutter assets prefix
        let cleanPath = flutterPath;
        if (cleanPath.startsWith(this.flutterAssetsPath)) {
            cleanPath = cleanPath.substring(this.flutterAssetsPath.length);
        }
        // Add React public path prefix
        const reactPath = path.join(this.reactPublicPath, cleanPath).replace(/\\/g, '/');
        // Ensure leading slash for absolute paths
        return reactPath.startsWith('/') ? reactPath : '/' + reactPath;
    }
    /**
     * Convert image reference in IR node
     */
    convertImageReference(node, targetFramework) {
        if ((node.type !== 'Image' && node.type !== 'img') || (!node.props?.source && !node.props?.src)) {
            return node;
        }
        const updatedNode = { ...node };
        const source = node.props.source || node.props.src;
        const propName = node.props.source ? 'source' : 'src';
        if (typeof source === 'string') {
            // Simple string path
            updatedNode.props = {
                ...node.props,
                [propName]: targetFramework === 'flutter'
                    ? this.reactToFlutter(source)
                    : this.flutterToReact(source),
            };
        }
        else if (source.uri) {
            // Object with uri property
            updatedNode.props = {
                ...node.props,
                [propName]: {
                    ...source,
                    uri: targetFramework === 'flutter'
                        ? this.reactToFlutter(source.uri)
                        : this.flutterToReact(source.uri),
                },
            };
        }
        return updatedNode;
    }
    /**
     * Convert background image in style
     */
    convertBackgroundImage(style, targetFramework) {
        if (!style?.backgroundImage) {
            return style;
        }
        const bgImage = style.backgroundImage;
        const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (!match) {
            return style;
        }
        const originalPath = match[1];
        const convertedPath = targetFramework === 'flutter'
            ? this.reactToFlutter(originalPath)
            : this.flutterToReact(originalPath);
        return {
            ...style,
            backgroundImage: `url('${convertedPath}')`,
        };
    }
    /**
     * Convert font reference
     * React: fontFamily: 'MyFont'
     * Flutter: fontFamily: 'MyFont' (same, but needs pubspec.yaml config)
     */
    convertFontReference(fontFamily, targetFramework) {
        // Font family names are typically the same across frameworks
        // The difference is in configuration files (package.json vs pubspec.yaml)
        return fontFamily;
    }
    /**
     * Get font file path for framework
     */
    getFontPath(fontFile, targetFramework) {
        if (targetFramework === 'flutter') {
            return path.join('assets/fonts', fontFile).replace(/\\/g, '/');
        }
        else {
            return path.join('/fonts', fontFile).replace(/\\/g, '/');
        }
    }
    /**
     * Convert all asset references in IR
     */
    convertIRAssets(ir, targetFramework) {
        const convertNode = (node) => {
            if (!node)
                return node;
            let updatedNode = { ...node };
            // Convert image references
            if (node.type === 'Image' || node.type === 'img') {
                updatedNode = this.convertImageReference(updatedNode, targetFramework);
            }
            // Convert background images in styles
            if (node.props?.style) {
                updatedNode.props = {
                    ...updatedNode.props,
                    style: this.convertBackgroundImage(node.props.style, targetFramework),
                };
            }
            // Recursively convert children
            if (node.children && Array.isArray(node.children)) {
                updatedNode.children = node.children.map(convertNode);
            }
            return updatedNode;
        };
        return {
            ...ir,
            nodes: ir.nodes ? ir.nodes.map(convertNode) : [],
        };
    }
}
exports.AssetPathConverter = AssetPathConverter;
