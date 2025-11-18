"use strict";
/**
 * Plugin Registry Service
 * Manages plugin discovery, compatibility checking, and marketplace
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRegistry = void 0;
exports.getPluginRegistry = getPluginRegistry;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
class PluginRegistry {
    constructor(registryUrl = 'https://registry.lumora.dev') {
        this.cacheDuration = 3600000; // 1 hour
        this.registryUrl = registryUrl;
        this.cacheDir = path.join(process.cwd(), '.lumora', 'plugin-cache');
        fs.ensureDirSync(this.cacheDir);
    }
    /**
     * Search for plugins in the registry
     */
    async searchPlugins(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.query)
                params.set('q', options.query);
            if (options.type)
                params.set('type', options.type);
            if (options.platform)
                params.set('platform', options.platform);
            if (options.official !== undefined)
                params.set('official', String(options.official));
            if (options.sortBy)
                params.set('sort', options.sortBy);
            if (options.limit)
                params.set('limit', String(options.limit));
            if (options.offset)
                params.set('offset', String(options.offset));
            const response = await axios_1.default.get(`${this.registryUrl}/api/plugins/search?${params.toString()}`);
            return response.data.plugins || [];
        }
        catch (error) {
            // Fallback to NPM search if registry is unavailable
            return this.searchNpmPlugins(options);
        }
    }
    /**
     * Fallback: Search NPM for Lumora plugins
     */
    async searchNpmPlugins(options) {
        try {
            const query = options.query || 'lumora';
            const response = await axios_1.default.get(`https://registry.npmjs.org/-/v1/search`, {
                params: {
                    text: `${query} lumora`,
                    size: options.limit || 20,
                },
            });
            const plugins = [];
            for (const pkg of response.data.objects) {
                if (pkg.package.name.startsWith('@lumora/') || pkg.package.keywords?.includes('lumora')) {
                    plugins.push(this.npmPackageToPlugin(pkg.package));
                }
            }
            return plugins;
        }
        catch (error) {
            console.error('Failed to search NPM:', error);
            return [];
        }
    }
    /**
     * Convert NPM package to plugin metadata
     */
    npmPackageToPlugin(npmPackage) {
        return {
            name: npmPackage.name,
            version: npmPackage.version,
            description: npmPackage.description || '',
            author: typeof npmPackage.author === 'string' ? npmPackage.author : npmPackage.author?.name || 'Unknown',
            homepage: npmPackage.homepage,
            repository: typeof npmPackage.repository === 'string' ? npmPackage.repository : npmPackage.repository?.url,
            license: npmPackage.license || 'UNLICENSED',
            keywords: npmPackage.keywords || [],
            lumoraVersion: npmPackage.lumora?.minVersion || '*',
            type: this.inferPluginType(npmPackage),
            platforms: npmPackage.lumora?.platforms || ['ios', 'android', 'web'],
            downloads: npmPackage.downloads,
        };
    }
    /**
     * Infer plugin type from package metadata
     */
    inferPluginType(npmPackage) {
        const name = npmPackage.name.toLowerCase();
        const keywords = (npmPackage.keywords || []).map((k) => k.toLowerCase());
        if (keywords.includes('native') || name.includes('native'))
            return 'native';
        if (keywords.includes('ui') || keywords.includes('component'))
            return 'ui';
        if (keywords.includes('utility') || keywords.includes('util'))
            return 'utility';
        return 'js';
    }
    /**
     * Get detailed information about a specific plugin
     */
    async getPluginInfo(pluginName) {
        try {
            // Try registry first
            const response = await axios_1.default.get(`${this.registryUrl}/api/plugins/${encodeURIComponent(pluginName)}`);
            return response.data;
        }
        catch (error) {
            // Fallback to NPM
            return this.getNpmPluginInfo(pluginName);
        }
    }
    /**
     * Get plugin info from NPM
     */
    async getNpmPluginInfo(pluginName) {
        try {
            const response = await axios_1.default.get(`https://registry.npmjs.org/${encodeURIComponent(pluginName)}`);
            const latest = response.data['dist-tags']?.latest || Object.keys(response.data.versions).pop();
            const packageData = response.data.versions[latest];
            return this.npmPackageToPlugin({
                ...packageData,
                downloads: response.data.downloads,
            });
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Check if a plugin is compatible with current project
     */
    async checkCompatibility(pluginName, pluginVersion) {
        const result = {
            compatible: true,
            issues: [],
            warnings: [],
        };
        try {
            // Get plugin metadata
            const plugin = await this.getPluginInfo(pluginName);
            if (!plugin) {
                result.compatible = false;
                result.issues.push('Plugin not found in registry');
                return result;
            }
            // Check Lumora version compatibility
            const currentLumoraVersion = this.getCurrentLumoraVersion();
            if (plugin.lumoraVersion && !semver.satisfies(currentLumoraVersion, plugin.lumoraVersion)) {
                result.compatible = false;
                result.issues.push(`Plugin requires Lumora ${plugin.lumoraVersion}, but current version is ${currentLumoraVersion}`);
            }
            // Check platform compatibility
            const projectPlatforms = this.getProjectPlatforms();
            const incompatiblePlatforms = projectPlatforms.filter((p) => !plugin.platforms.includes(p));
            if (incompatiblePlatforms.length > 0) {
                result.warnings.push(`Plugin may not support: ${incompatiblePlatforms.join(', ')}`);
            }
            // Check peer dependencies
            if (plugin.peerDependencies) {
                const missingPeers = await this.checkPeerDependencies(plugin.peerDependencies);
                if (missingPeers.length > 0) {
                    result.warnings.push(`Missing peer dependencies: ${missingPeers.join(', ')}`);
                }
            }
            // Check for conflicts
            const conflicts = await this.checkDependencyConflicts(plugin);
            if (conflicts.length > 0) {
                result.compatible = false;
                result.issues.push(...conflicts);
            }
        }
        catch (error) {
            result.compatible = false;
            result.issues.push(`Failed to check compatibility: ${error}`);
        }
        return result;
    }
    /**
     * Get current Lumora version from package.json
     */
    getCurrentLumoraVersion() {
        try {
            const cliPackageJson = require(path.join(__dirname, '../../package.json'));
            return cliPackageJson.version || '1.0.0';
        }
        catch {
            return '1.0.0';
        }
    }
    /**
     * Get project platforms from configuration
     */
    getProjectPlatforms() {
        try {
            const configPath = path.join(process.cwd(), 'lumora.config.json');
            if (fs.existsSync(configPath)) {
                const config = fs.readJsonSync(configPath);
                return config.platforms || ['ios', 'android', 'web'];
            }
        }
        catch { }
        return ['ios', 'android', 'web'];
    }
    /**
     * Check for missing peer dependencies
     */
    async checkPeerDependencies(peerDeps) {
        const missing = [];
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return Object.keys(peerDeps);
        }
        const packageJson = fs.readJsonSync(packageJsonPath);
        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };
        for (const [dep, version] of Object.entries(peerDeps)) {
            if (!allDeps[dep]) {
                missing.push(dep);
            }
            else if (!semver.satisfies(semver.coerce(allDeps[dep])?.version || '0.0.0', version)) {
                missing.push(`${dep} (version mismatch)`);
            }
        }
        return missing;
    }
    /**
     * Check for dependency conflicts
     */
    async checkDependencyConflicts(plugin) {
        const conflicts = [];
        if (!plugin.dependencies)
            return conflicts;
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (!fs.existsSync(packageJsonPath))
            return conflicts;
        const packageJson = fs.readJsonSync(packageJsonPath);
        const existingDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        for (const [dep, version] of Object.entries(plugin.dependencies)) {
            if (existingDeps[dep]) {
                const existingVersion = existingDeps[dep];
                if (!semver.intersects(version, existingVersion)) {
                    conflicts.push(`Dependency conflict: ${dep} (plugin needs ${version}, project has ${existingVersion})`);
                }
            }
        }
        return conflicts;
    }
    /**
     * List official Lumora plugins
     */
    async listOfficialPlugins() {
        return this.searchPlugins({ official: true, sortBy: 'downloads', limit: 50 });
    }
    /**
     * Get featured/recommended plugins
     */
    async getFeaturedPlugins() {
        try {
            const response = await axios_1.default.get(`${this.registryUrl}/api/plugins/featured`);
            return response.data.plugins || [];
        }
        catch {
            // Fallback to official plugins
            return this.listOfficialPlugins();
        }
    }
    /**
     * Get plugin statistics
     */
    async getPluginStats(pluginName) {
        try {
            const response = await axios_1.default.get(`${this.registryUrl}/api/plugins/${encodeURIComponent(pluginName)}/stats`);
            return response.data;
        }
        catch {
            return null;
        }
    }
}
exports.PluginRegistry = PluginRegistry;
// Singleton instance
let registryInstance = null;
function getPluginRegistry() {
    if (!registryInstance) {
        registryInstance = new PluginRegistry();
    }
    return registryInstance;
}
//# sourceMappingURL=plugin-registry.js.map