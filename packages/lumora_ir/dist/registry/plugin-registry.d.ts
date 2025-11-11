/**
 * Plugin Registry
 * Manages third-party plugins and packages for Lumora
 */
export interface PluginMetadata {
    name: string;
    version: string;
    description?: string;
    author?: string;
    homepage?: string;
    repository?: string;
    license?: string;
}
export interface PluginCompatibility {
    lumora?: string;
    react?: string;
    flutter?: string;
    dart?: string;
    platforms?: ('ios' | 'android' | 'web' | 'macos' | 'windows' | 'linux')[];
}
export interface PluginDependency {
    name: string;
    version: string;
    optional?: boolean;
}
export interface PluginWidget {
    name: string;
    type: 'component' | 'widget';
    framework: 'react' | 'flutter' | 'both';
    import?: string;
    props?: Record<string, any>;
}
export interface PluginCapabilities {
    widgets?: PluginWidget[];
    stateManagement?: boolean;
    navigation?: boolean;
    networking?: boolean;
    storage?: boolean;
    nativeCode?: boolean;
}
export interface Plugin {
    metadata: PluginMetadata;
    compatibility: PluginCompatibility;
    dependencies?: PluginDependency[];
    peerDependencies?: PluginDependency[];
    capabilities?: PluginCapabilities;
    enabled: boolean;
    installedAt?: number;
}
export interface PluginValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Plugin Registry
 * Manages plugin registration, compatibility checking, and dependency resolution
 */
export declare class PluginRegistry {
    private plugins;
    private lumoraVersion;
    constructor(lumoraVersion?: string);
    /**
     * Register a plugin
     * @param plugin Plugin to register
     * @returns Validation result
     */
    register(plugin: Plugin): PluginValidationResult;
    /**
     * Unregister a plugin
     * @param name Plugin name
     * @returns True if plugin was removed
     */
    unregister(name: string): boolean;
    /**
     * Get a plugin by name
     * @param name Plugin name
     * @returns Plugin or undefined
     */
    getPlugin(name: string): Plugin | undefined;
    /**
     * Get all registered plugins
     * @returns Array of plugins
     */
    getAllPlugins(): Plugin[];
    /**
     * Get enabled plugins
     * @returns Array of enabled plugins
     */
    getEnabledPlugins(): Plugin[];
    /**
     * Enable a plugin
     * @param name Plugin name
     * @returns True if plugin was enabled
     */
    enablePlugin(name: string): boolean;
    /**
     * Disable a plugin
     * @param name Plugin name
     * @returns True if plugin was disabled
     */
    disablePlugin(name: string): boolean;
    /**
     * Validate a plugin
     * @param plugin Plugin to validate
     * @returns Validation result
     */
    validatePlugin(plugin: Plugin): PluginValidationResult;
    /**
     * Check version compatibility using semver-like logic
     * @param currentVersion Current version
     * @param requiredRange Required version range
     * @returns True if compatible
     */
    private checkVersionCompatibility;
    /**
     * Parse version string
     */
    private parseVersion;
    /**
     * Compare two versions
     * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
     */
    private compareVersions;
    /**
     * Resolve plugin dependencies
     * @param pluginName Plugin name
     * @returns Array of dependency names in installation order
     */
    resolveDependencies(pluginName: string): string[];
    /**
     * Check for dependency conflicts
     * @param plugins Array of plugin names
     * @returns Array of conflict descriptions
     */
    checkDependencyConflicts(plugins: string[]): string[];
    /**
     * Get widgets provided by a plugin
     * @param pluginName Plugin name
     * @returns Array of plugin widgets
     */
    getPluginWidgets(pluginName: string): PluginWidget[];
    /**
     * Get all widgets from enabled plugins
     * @returns Array of all plugin widgets
     */
    getAllPluginWidgets(): PluginWidget[];
    /**
     * Check if a plugin has a specific capability
     * @param pluginName Plugin name
     * @param capability Capability name
     * @returns True if plugin has the capability
     */
    hasCapability(pluginName: string, capability: keyof PluginCapabilities): boolean;
    /**
     * Get plugins by capability
     * @param capability Capability name
     * @returns Array of plugins with the capability
     */
    getPluginsByCapability(capability: keyof PluginCapabilities): Plugin[];
    /**
     * Clear all plugins
     */
    clear(): void;
    /**
     * Get plugin count
     * @returns Number of registered plugins
     */
    getPluginCount(): number;
}
/**
 * Get the singleton instance of PluginRegistry
 * @returns PluginRegistry instance
 */
export declare function getPluginRegistry(): PluginRegistry;
/**
 * Reset the registry instance (useful for testing)
 */
export declare function resetPluginRegistry(): void;
