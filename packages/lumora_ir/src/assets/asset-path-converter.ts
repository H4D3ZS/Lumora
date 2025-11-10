/**
 * Asset Path Converter
 * Converts asset paths between React and Flutter conventions
 */

import * as path from 'path';

export interface PathConversionOptions {
  reactPublicPath?: string;
  flutterAssetsPath?: string;
}

export class AssetPathConverter {
  private reactPublicPath: string;
  private flutterAssetsPath: string;

  constructor(options: PathConversionOptions = {}) {
    this.reactPublicPath = options.reactPublicPath || '/';
    this.flutterAssetsPath = options.flutterAssetsPath || 'assets/';
  }

  /**
   * Convert React asset path to Flutter asset path
   * React: /images/logo.png or ./images/logo.png
   * Flutter: assets/images/logo.png
   */
  reactToFlutter(reactPath: string): string {
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
  flutterToReact(flutterPath: string): string {
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
  convertImageReference(node: any, targetFramework: 'react' | 'flutter'): any {
    if (node.type !== 'Image' || !node.props?.source) {
      return node;
    }

    const updatedNode = { ...node };
    const source = node.props.source;

    if (typeof source === 'string') {
      // Simple string path
      updatedNode.props = {
        ...node.props,
        source: targetFramework === 'flutter' 
          ? this.reactToFlutter(source)
          : this.flutterToReact(source),
      };
    } else if (source.uri) {
      // Object with uri property
      updatedNode.props = {
        ...node.props,
        source: {
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
  convertBackgroundImage(style: any, targetFramework: 'react' | 'flutter'): any {
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
  convertFontReference(fontFamily: string, targetFramework: 'react' | 'flutter'): string {
    // Font family names are typically the same across frameworks
    // The difference is in configuration files (package.json vs pubspec.yaml)
    return fontFamily;
  }

  /**
   * Get font file path for framework
   */
  getFontPath(fontFile: string, targetFramework: 'react' | 'flutter'): string {
    if (targetFramework === 'flutter') {
      return path.join('assets/fonts', fontFile).replace(/\\/g, '/');
    } else {
      return path.join('/fonts', fontFile).replace(/\\/g, '/');
    }
  }

  /**
   * Convert all asset references in IR
   */
  convertIRAssets(ir: any, targetFramework: 'react' | 'flutter'): any {
    const convertNode = (node: any): any => {
      if (!node) return node;

      let updatedNode = { ...node };

      // Convert image references
      if (node.type === 'Image') {
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
