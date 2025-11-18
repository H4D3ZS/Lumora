/**
 * Plugin Registry Service
 * Manages plugin discovery, compatibility checking, and marketplace
 */

import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as semver from 'semver';

// Types
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license: string;
  keywords: string[];

  // Lumora specific
  lumoraVersion: string; // Minimum Lumora version required
  type: 'native' | 'js' | 'ui' | 'utility';
  platforms: ('ios' | 'android' | 'web')[];

  // Native module info (if applicable)
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

  // Stats
  downloads?: number;
  stars?: number;
  lastUpdate?: string;

  // Dependencies
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

export class PluginRegistry {
  private registryUrl: string;
  private cacheDir: string;
  private cacheDuration = 3600000; // 1 hour

  constructor(registryUrl: string = 'https://registry.lumora.dev') {
    this.registryUrl = registryUrl;
    this.cacheDir = path.join(process.cwd(), '.lumora', 'plugin-cache');
    fs.ensureDirSync(this.cacheDir);
  }

  /**
   * Search for plugins in the registry
   */
  async searchPlugins(options: PluginSearchOptions = {}): Promise<PluginMetadata[]> {
    try {
      const params = new URLSearchParams();
      if (options.query) params.set('q', options.query);
      if (options.type) params.set('type', options.type);
      if (options.platform) params.set('platform', options.platform);
      if (options.official !== undefined) params.set('official', String(options.official));
      if (options.sortBy) params.set('sort', options.sortBy);
      if (options.limit) params.set('limit', String(options.limit));
      if (options.offset) params.set('offset', String(options.offset));

      const response = await axios.get(`${this.registryUrl}/api/plugins/search?${params.toString()}`);
      return response.data.plugins || [];
    } catch (error) {
      // Fallback to NPM search if registry is unavailable
      return this.searchNpmPlugins(options);
    }
  }

  /**
   * Fallback: Search NPM for Lumora plugins
   */
  private async searchNpmPlugins(options: PluginSearchOptions): Promise<PluginMetadata[]> {
    try {
      const query = options.query || 'lumora';
      const response = await axios.get(`https://registry.npmjs.org/-/v1/search`, {
        params: {
          text: `${query} lumora`,
          size: options.limit || 20,
        },
      });

      const plugins: PluginMetadata[] = [];
      for (const pkg of response.data.objects) {
        if (pkg.package.name.startsWith('@lumora/') || pkg.package.keywords?.includes('lumora')) {
          plugins.push(this.npmPackageToPlugin(pkg.package));
        }
      }
      return plugins;
    } catch (error) {
      console.error('Failed to search NPM:', error);
      return [];
    }
  }

  /**
   * Convert NPM package to plugin metadata
   */
  private npmPackageToPlugin(npmPackage: any): PluginMetadata {
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
  private inferPluginType(npmPackage: any): 'native' | 'js' | 'ui' | 'utility' {
    const name = npmPackage.name.toLowerCase();
    const keywords = (npmPackage.keywords || []).map((k: string) => k.toLowerCase());

    if (keywords.includes('native') || name.includes('native')) return 'native';
    if (keywords.includes('ui') || keywords.includes('component')) return 'ui';
    if (keywords.includes('utility') || keywords.includes('util')) return 'utility';
    return 'js';
  }

  /**
   * Get detailed information about a specific plugin
   */
  async getPluginInfo(pluginName: string): Promise<PluginMetadata | null> {
    try {
      // Try registry first
      const response = await axios.get(`${this.registryUrl}/api/plugins/${encodeURIComponent(pluginName)}`);
      return response.data;
    } catch (error) {
      // Fallback to NPM
      return this.getNpmPluginInfo(pluginName);
    }
  }

  /**
   * Get plugin info from NPM
   */
  private async getNpmPluginInfo(pluginName: string): Promise<PluginMetadata | null> {
    try {
      const response = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pluginName)}`);
      const latest = response.data['dist-tags']?.latest || Object.keys(response.data.versions).pop();
      const packageData = response.data.versions[latest];

      return this.npmPackageToPlugin({
        ...packageData,
        downloads: response.data.downloads,
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a plugin is compatible with current project
   */
  async checkCompatibility(
    pluginName: string,
    pluginVersion?: string
  ): Promise<PluginCompatibility> {
    const result: PluginCompatibility = {
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
        result.issues.push(
          `Plugin requires Lumora ${plugin.lumoraVersion}, but current version is ${currentLumoraVersion}`
        );
      }

      // Check platform compatibility
      const projectPlatforms = this.getProjectPlatforms();
      const incompatiblePlatforms = projectPlatforms.filter(
        (p) => !plugin.platforms.includes(p as any)
      );
      if (incompatiblePlatforms.length > 0) {
        result.warnings.push(
          `Plugin may not support: ${incompatiblePlatforms.join(', ')}`
        );
      }

      // Check peer dependencies
      if (plugin.peerDependencies) {
        const missingPeers = await this.checkPeerDependencies(plugin.peerDependencies);
        if (missingPeers.length > 0) {
          result.warnings.push(
            `Missing peer dependencies: ${missingPeers.join(', ')}`
          );
        }
      }

      // Check for conflicts
      const conflicts = await this.checkDependencyConflicts(plugin);
      if (conflicts.length > 0) {
        result.compatible = false;
        result.issues.push(...conflicts);
      }
    } catch (error) {
      result.compatible = false;
      result.issues.push(`Failed to check compatibility: ${error}`);
    }

    return result;
  }

  /**
   * Get current Lumora version from package.json
   */
  private getCurrentLumoraVersion(): string {
    try {
      const cliPackageJson = require(path.join(__dirname, '../../package.json'));
      return cliPackageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  /**
   * Get project platforms from configuration
   */
  private getProjectPlatforms(): string[] {
    try {
      const configPath = path.join(process.cwd(), 'lumora.config.json');
      if (fs.existsSync(configPath)) {
        const config = fs.readJsonSync(configPath);
        return config.platforms || ['ios', 'android', 'web'];
      }
    } catch {}
    return ['ios', 'android', 'web'];
  }

  /**
   * Check for missing peer dependencies
   */
  private async checkPeerDependencies(
    peerDeps: Record<string, string>
  ): Promise<string[]> {
    const missing: string[] = [];
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
      } else if (!semver.satisfies(semver.coerce(allDeps[dep])?.version || '0.0.0', version)) {
        missing.push(`${dep} (version mismatch)`);
      }
    }

    return missing;
  }

  /**
   * Check for dependency conflicts
   */
  private async checkDependencyConflicts(plugin: PluginMetadata): Promise<string[]> {
    const conflicts: string[] = [];

    if (!plugin.dependencies) return conflicts;

    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) return conflicts;

    const packageJson = fs.readJsonSync(packageJsonPath);
    const existingDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    for (const [dep, version] of Object.entries(plugin.dependencies)) {
      if (existingDeps[dep]) {
        const existingVersion = existingDeps[dep];
        if (!semver.intersects(version, existingVersion)) {
          conflicts.push(
            `Dependency conflict: ${dep} (plugin needs ${version}, project has ${existingVersion})`
          );
        }
      }
    }

    return conflicts;
  }

  /**
   * List official Lumora plugins
   */
  async listOfficialPlugins(): Promise<PluginMetadata[]> {
    return this.searchPlugins({ official: true, sortBy: 'downloads', limit: 50 });
  }

  /**
   * Get featured/recommended plugins
   */
  async getFeaturedPlugins(): Promise<PluginMetadata[]> {
    try {
      const response = await axios.get(`${this.registryUrl}/api/plugins/featured`);
      return response.data.plugins || [];
    } catch {
      // Fallback to official plugins
      return this.listOfficialPlugins();
    }
  }

  /**
   * Get plugin statistics
   */
  async getPluginStats(pluginName: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.registryUrl}/api/plugins/${encodeURIComponent(pluginName)}/stats`
      );
      return response.data;
    } catch {
      return null;
    }
  }
}

// Singleton instance
let registryInstance: PluginRegistry | null = null;

export function getPluginRegistry(): PluginRegistry {
  if (!registryInstance) {
    registryInstance = new PluginRegistry();
  }
  return registryInstance;
}
