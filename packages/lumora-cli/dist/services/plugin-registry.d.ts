/**
 * Plugin Registry Service
 * Manages plugin discovery, compatibility checking, and marketplace
 */
export interface PluginMetadata {
    name: string;
    version: string;
    description: string;
    author: string;
    homepage?: string;
    repository?: string;
    license: string;
    keywords: string[];
    lumoraVersion: string;
    type: 'native' | 'js' | 'ui' | 'utility';
    platforms: ('ios' | 'android' | 'web')[];
    nativeModule?: {
        moduleName: string;
        ios?: {
            podName?: string;
            frameworks?: string[];
        };
        android?: {
            package?: string;
            gradle?: string;
        };
    };
    downloads?: number;
    stars?: number;
    lastUpdate?: string;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
}
export interface PluginSearchOptions {
    query?: string;
    type?: 'native' | 'js' | 'ui' | 'utility';
    platform?: 'ios' | 'android' | 'web';
    official?: boolean;
    sortBy?: 'downloads' | 'stars' | 'recent' | 'relevance';
    limit?: number;
    offset?: number;
}
export interface PluginCompatibility {
    compatible: boolean;
    issues: string[];
    warnings: string[];
}
export declare class PluginRegistry {
    private registryUrl;
    private cacheDir;
    private cacheDuration;
    constructor(registryUrl?: string);
    /**
     * Search for plugins in the registry
     */
    searchPlugins(options?: PluginSearchOptions): Promise<PluginMetadata[]>;
    /**
     * Fallback: Search NPM for Lumora plugins
     */
    private searchNpmPlugins;
    /**
     * Convert NPM package to plugin metadata
     */
    private npmPackageToPlugin;
    /**
     * Infer plugin type from package metadata
     */
    private inferPluginType;
    /**
     * Get detailed information about a specific plugin
     */
    getPluginInfo(pluginName: string): Promise<PluginMetadata | null>;
    /**
     * Get plugin info from NPM
     */
    private getNpmPluginInfo;
    /**
     * Check if a plugin is compatible with current project
     */
    checkCompatibility(pluginName: string, pluginVersion?: string): Promise<PluginCompatibility>;
    /**
     * Get current Lumora version from package.json
     */
    private getCurrentLumoraVersion;
    /**
     * Get project platforms from configuration
     */
    private getProjectPlatforms;
    /**
     * Check for missing peer dependencies
     */
    private checkPeerDependencies;
    /**
     * Check for dependency conflicts
     */
    private checkDependencyConflicts;
    /**
     * List official Lumora plugins
     */
    listOfficialPlugins(): Promise<PluginMetadata[]>;
    /**
     * Get featured/recommended plugins
     */
    getFeaturedPlugins(): Promise<PluginMetadata[]>;
    /**
     * Get plugin statistics
     */
    getPluginStats(pluginName: string): Promise<any>;
}
export declare function getPluginRegistry(): PluginRegistry;
//# sourceMappingURL=plugin-registry.d.ts.map