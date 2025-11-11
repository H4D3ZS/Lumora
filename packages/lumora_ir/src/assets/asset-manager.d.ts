/**
 * Asset Manager
 * Handles syncing and managing assets between React and Flutter frameworks
 */
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
export declare class AssetManager {
    private reactAssetsDir;
    private flutterAssetsDir;
    constructor(options: AssetSyncOptions);
    /**
     * Sync assets from React to Flutter
     */
    syncReactToFlutter(assetPaths: string[]): AssetReference[];
    /**
     * Sync assets from Flutter to React
     */
    syncFlutterToReact(assetPaths: string[]): AssetReference[];
    /**
     * Extract asset references from IR
     */
    extractAssetReferences(ir: any): string[];
    /**
     * Determine asset type from file extension
     */
    private getAssetType;
    /**
     * Ensure directory exists, create if not
     */
    private ensureDirectoryExists;
    /**
     * Get all assets in a directory
     */
    getAllAssets(framework: 'react' | 'flutter'): string[];
}
//# sourceMappingURL=asset-manager.d.ts.map