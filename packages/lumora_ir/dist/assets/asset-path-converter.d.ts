/**
 * Asset Path Converter
 * Converts asset paths between React and Flutter conventions
 */
export interface PathConversionOptions {
    reactPublicPath?: string;
    flutterAssetsPath?: string;
}
export declare class AssetPathConverter {
    private reactPublicPath;
    private flutterAssetsPath;
    constructor(options?: PathConversionOptions);
    /**
     * Convert React asset path to Flutter asset path
     * React: /images/logo.png or ./images/logo.png
     * Flutter: assets/images/logo.png
     */
    reactToFlutter(reactPath: string): string;
    /**
     * Convert Flutter asset path to React asset path
     * Flutter: assets/images/logo.png
     * React: /images/logo.png
     */
    flutterToReact(flutterPath: string): string;
    /**
     * Convert image reference in IR node
     */
    convertImageReference(node: any, targetFramework: 'react' | 'flutter'): any;
    /**
     * Convert background image in style
     */
    convertBackgroundImage(style: any, targetFramework: 'react' | 'flutter'): any;
    /**
     * Convert font reference
     * React: fontFamily: 'MyFont'
     * Flutter: fontFamily: 'MyFont' (same, but needs pubspec.yaml config)
     */
    convertFontReference(fontFamily: string, targetFramework: 'react' | 'flutter'): string;
    /**
     * Get font file path for framework
     */
    getFontPath(fontFile: string, targetFramework: 'react' | 'flutter'): string;
    /**
     * Convert all asset references in IR
     */
    convertIRAssets(ir: any, targetFramework: 'react' | 'flutter'): any;
}
