"use strict";
/**
 * Plugin Registry
 * Manages third-party plugins and packages for Lumora
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRegistry = void 0;
exports.getPluginRegistry = getPluginRegistry;
exports.resetPluginRegistry = resetPluginRegistry;
/**
 * Plugin Registry
 * Manages plugin registration, compatibility checking, and dependency resolution
 */
class PluginRegistry {
    constructor(lumoraVersion = '0.1.0') {
        this.plugins = new Map();
        this.lumoraVersion = lumoraVersion;
    }
    /**
     * Register a plugin
     * @param plugin Plugin to register
     * @returns Validation result
     */
    register(plugin) {
        const validation = this.validatePlugin(plugin);
        if (!validation.valid) {
            return validation;
        }
        // Check if plugin already exists
        if (this.plugins.has(plugin.metadata.name)) {
            const existing = this.plugins.get(plugin.metadata.name);
            validation.warnings.push(`Plugin "${plugin.metadata.name}" is already registered (v${existing.metadata.version}). ` +
                `Replacing with v${plugin.metadata.version}.`);
        }
        this.plugins.set(plugin.metadata.name, plugin);
        return validation;
    }
    /**
     * Unregister a plugin
     * @param name Plugin name
     * @returns True if plugin was removed
     */
    unregister(name) {
        return this.plugins.delete(name);
    }
    /**
     * Get a plugin by name
     * @param name Plugin name
     * @returns Plugin or undefined
     */
    getPlugin(name) {
        return this.plugins.get(name);
    }
    /**
     * Get all registered plugins
     * @returns Array of plugins
     */
    getAllPlugins() {
        return Array.from(this.plugins.values());
    }
    /**
     * Get enabled plugins
     * @returns Array of enabled plugins
     */
    getEnabledPlugins() {
        return this.getAllPlugins().filter(p => p.enabled);
    }
    /**
     * Enable a plugin
     * @param name Plugin name
     * @returns True if plugin was enabled
     */
    enablePlugin(name) {
        const plugin = this.plugins.get(name);
        if (plugin) {
            plugin.enabled = true;
            return true;
        }
        return false;
    }
    /**
     * Disable a plugin
     * @param name Plugin name
     * @returns True if plugin was disabled
     */
    disablePlugin(name) {
        const plugin = this.plugins.get(name);
        if (plugin) {
            plugin.enabled = false;
            return true;
        }
        return false;
    }
    /**
     * Validate a plugin
     * @param plugin Plugin to validate
     * @returns Validation result
     */
    validatePlugin(plugin) {
        const errors = [];
        const warnings = [];
        // Validate metadata
        if (!plugin.metadata.name) {
            errors.push('Plugin name is required');
        }
        if (!plugin.metadata.version) {
            errors.push('Plugin version is required');
        }
        // Check Lumora compatibility
        if (plugin.compatibility.lumora) {
            const compatible = this.checkVersionCompatibility(this.lumoraVersion, plugin.compatibility.lumora);
            if (!compatible) {
                errors.push(`Plugin requires Lumora ${plugin.compatibility.lumora}, ` +
                    `but current version is ${this.lumoraVersion}`);
            }
        }
        // Check for native code
        if (plugin.capabilities?.nativeCode) {
            warnings.push('Plugin contains native code and will not work in Lumora Go (dev preview mode). ' +
                'Native code is only available in production builds.');
        }
        // Check platform compatibility
        if (plugin.compatibility.platforms && plugin.compatibility.platforms.length > 0) {
            const supportedPlatforms = plugin.compatibility.platforms.join(', ');
            warnings.push(`Plugin is only compatible with: ${supportedPlatforms}`);
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Check version compatibility using semver-like logic
     * @param currentVersion Current version
     * @param requiredRange Required version range
     * @returns True if compatible
     */
    checkVersionCompatibility(currentVersion, requiredRange) {
        // Simple semver check - in production, use a proper semver library
        const current = this.parseVersion(currentVersion);
        // Handle common patterns
        if (requiredRange.startsWith('^')) {
            // ^1.2.3 means >=1.2.3 <2.0.0
            const required = this.parseVersion(requiredRange.substring(1));
            return current.major === required.major &&
                (current.minor > required.minor ||
                    (current.minor === required.minor && current.patch >= required.patch));
        }
        else if (requiredRange.startsWith('~')) {
            // ~1.2.3 means >=1.2.3 <1.3.0
            const required = this.parseVersion(requiredRange.substring(1));
            return current.major === required.major &&
                current.minor === required.minor &&
                current.patch >= required.patch;
        }
        else if (requiredRange.startsWith('>=')) {
            const required = this.parseVersion(requiredRange.substring(2));
            return this.compareVersions(current, required) >= 0;
        }
        else if (requiredRange.startsWith('>')) {
            const required = this.parseVersion(requiredRange.substring(1));
            return this.compareVersions(current, required) > 0;
        }
        else {
            // Exact match
            const required = this.parseVersion(requiredRange);
            return this.compareVersions(current, required) === 0;
        }
    }
    /**
     * Parse version string
     */
    parseVersion(version) {
        const parts = version.trim().split('.');
        return {
            major: parseInt(parts[0] || '0', 10),
            minor: parseInt(parts[1] || '0', 10),
            patch: parseInt(parts[2] || '0', 10),
        };
    }
    /**
     * Compare two versions
     * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
     */
    compareVersions(v1, v2) {
        if (v1.major !== v2.major)
            return v1.major - v2.major;
        if (v1.minor !== v2.minor)
            return v1.minor - v2.minor;
        return v1.patch - v2.patch;
    }
    /**
     * Resolve plugin dependencies
     * @param pluginName Plugin name
     * @returns Array of dependency names in installation order
     */
    resolveDependencies(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin not found: ${pluginName}`);
        }
        const resolved = [];
        const visited = new Set();
        const resolve = (name) => {
            if (visited.has(name)) {
                return; // Already processed
            }
            visited.add(name);
            const p = this.plugins.get(name);
            if (!p) {
                throw new Error(`Dependency not found: ${name}`);
            }
            // Resolve dependencies first
            if (p.dependencies) {
                for (const dep of p.dependencies) {
                    if (!dep.optional) {
                        resolve(dep.name);
                    }
                }
            }
            resolved.push(name);
        };
        resolve(pluginName);
        return resolved;
    }
    /**
     * Check for dependency conflicts
     * @param plugins Array of plugin names
     * @returns Array of conflict descriptions
     */
    checkDependencyConflicts(plugins) {
        const conflicts = [];
        const versionMap = new Map();
        // Collect all dependencies and their required versions
        for (const pluginName of plugins) {
            const plugin = this.plugins.get(pluginName);
            if (!plugin)
                continue;
            if (plugin.dependencies) {
                for (const dep of plugin.dependencies) {
                    if (!versionMap.has(dep.name)) {
                        versionMap.set(dep.name, new Set());
                    }
                    versionMap.get(dep.name).add(dep.version);
                }
            }
        }
        // Check for version conflicts
        for (const [depName, versions] of versionMap.entries()) {
            if (versions.size > 1) {
                conflicts.push(`Dependency "${depName}" has conflicting version requirements: ${Array.from(versions).join(', ')}`);
            }
        }
        return conflicts;
    }
    /**
     * Get widgets provided by a plugin
     * @param pluginName Plugin name
     * @returns Array of plugin widgets
     */
    getPluginWidgets(pluginName) {
        const plugin = this.plugins.get(pluginName);
        return plugin?.capabilities?.widgets || [];
    }
    /**
     * Get all widgets from enabled plugins
     * @returns Array of all plugin widgets
     */
    getAllPluginWidgets() {
        const widgets = [];
        for (const plugin of this.getEnabledPlugins()) {
            if (plugin.capabilities?.widgets) {
                widgets.push(...plugin.capabilities.widgets);
            }
        }
        return widgets;
    }
    /**
     * Check if a plugin has a specific capability
     * @param pluginName Plugin name
     * @param capability Capability name
     * @returns True if plugin has the capability
     */
    hasCapability(pluginName, capability) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin || !plugin.capabilities) {
            return false;
        }
        return !!plugin.capabilities[capability];
    }
    /**
     * Get plugins by capability
     * @param capability Capability name
     * @returns Array of plugins with the capability
     */
    getPluginsByCapability(capability) {
        return this.getEnabledPlugins().filter(p => p.capabilities && !!p.capabilities[capability]);
    }
    /**
     * Clear all plugins
     */
    clear() {
        this.plugins.clear();
    }
    /**
     * Get plugin count
     * @returns Number of registered plugins
     */
    getPluginCount() {
        return this.plugins.size;
    }
}
exports.PluginRegistry = PluginRegistry;
// Singleton instance
let registryInstance = null;
/**
 * Get the singleton instance of PluginRegistry
 * @returns PluginRegistry instance
 */
function getPluginRegistry() {
    if (!registryInstance) {
        registryInstance = new PluginRegistry();
    }
    return registryInstance;
}
/**
 * Reset the registry instance (useful for testing)
 */
function resetPluginRegistry() {
    registryInstance = null;
}
