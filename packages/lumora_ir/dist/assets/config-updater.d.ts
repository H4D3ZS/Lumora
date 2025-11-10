/**
 * Configuration Updater
 * Updates pubspec.yaml and package.json with asset references
 */
export interface AssetConfig {
    images: string[];
    fonts: FontConfig[];
}
export interface FontConfig {
    family: string;
    fonts: FontFile[];
}
export interface FontFile {
    asset: string;
    weight?: number;
    style?: string;
}
export declare class ConfigUpdater {
    /**
     * Update pubspec.yaml with Flutter assets
     */
    updatePubspecYaml(pubspecPath: string, assets: string[]): void;
    /**
     * Update pubspec.yaml with Flutter fonts
     */
    updatePubspecFonts(pubspecPath: string, fontConfigs: FontConfig[]): void;
    /**
     * Update package.json with React asset references
     * Note: React doesn't require explicit asset registration in package.json,
     * but we can add metadata for tracking
     */
    updatePackageJson(packageJsonPath: string, assets: string[]): void;
    /**
     * Extract font configurations from asset list
     */
    extractFontConfigs(assets: string[]): FontConfig[];
    /**
     * Extract font weight from filename
     */
    private extractFontWeight;
    /**
     * Extract font style from filename
     */
    private extractFontStyle;
    /**
     * Get asset directories from configuration files
     */
    getAssetDirectories(projectRoot: string): {
        react: string;
        flutter: string;
    };
    /**
     * Validate asset configuration
     */
    validateAssetConfig(pubspecPath: string, assets: string[]): {
        valid: boolean;
        errors: string[];
    };
}
