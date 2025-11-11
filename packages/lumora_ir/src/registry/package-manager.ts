/**
 * Package Manager
 * Manages package dependencies from pubspec.yaml and package.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Plugin, PluginMetadata, PluginCompatibility, PluginCapabilities } from './plugin-registry';

export interface PackageInfo {
  name: string;
  version: string;
  framework: 'react' | 'flutter';
  hasNativeDependencies: boolean;
  isLumoraCompatible: boolean;
  warnings: string[];
}

export interface PubspecYaml {
  name: string;
  version?: string;
  description?: string;
  environment?: {
    sdk?: string;
    flutter?: string;
  };
  dependencies?: Record<string, any>;
  dev_dependencies?: Record<string, any>;
}

export interface PackageJson {
  name: string;
  version?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/**
 * Package Manager
 * Parses and validates packages from pubspec.yaml and package.json
 */
export class PackageManager {
  private knownNativePackages: Set<string> = new Set([
    // Flutter native packages
    'camera',
    'image_picker',
    'path_provider',
    'shared_preferences',
    'sqflite',
    'url_launcher',
    'webview_flutter',
    'firebase_core',
    'firebase_auth',
    'firebase_messaging',
    'google_maps_flutter',
    'location',
    'permission_handler',
    'device_info_plus',
    'package_info_plus',
    'connectivity_plus',
    'battery_plus',
    // React Native packages
    'react-native-camera',
    'react-native-image-picker',
    'react-native-maps',
    'react-native-firebase',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    'react-native-permissions',
    'react-native-device-info',
    'react-native-webview',
  ]);

  private lumoraCompatiblePackages: Set<string> = new Set([
    // Flutter packages that work with Lumora
    'provider',
    'riverpod',
    'flutter_riverpod',
    'flutter_bloc',
    'bloc',
    'get',
    'get_it',
    'dio',
    'http',
    'json_annotation',
    'freezed_annotation',
    'equatable',
    // React packages that work with Lumora
    'react',
    'react-dom',
    'axios',
    'swr',
    'react-query',
    '@tanstack/react-query',
    'zustand',
    'jotai',
    'recoil',
  ]);

  /**
   * Parse pubspec.yaml file
   * @param filePath Path to pubspec.yaml
   * @returns Parsed pubspec data
   */
  parsePubspec(filePath: string): PubspecYaml {
    if (!fs.existsSync(filePath)) {
      throw new Error(`pubspec.yaml not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content) as PubspecYaml;

    if (!data || !data.name) {
      throw new Error(`Invalid pubspec.yaml: ${filePath}`);
    }

    return data;
  }

  /**
   * Parse package.json file
   * @param filePath Path to package.json
   * @returns Parsed package.json data
   */
  parsePackageJson(filePath: string): PackageJson {
    if (!fs.existsSync(filePath)) {
      throw new Error(`package.json not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content) as PackageJson;

    if (!data || !data.name) {
      throw new Error(`Invalid package.json: ${filePath}`);
    }

    return data;
  }

  /**
   * Check package compatibility
   * @param packageName Package name
   * @param version Package version
   * @param framework Framework (react or flutter)
   * @returns Package info with compatibility details
   */
  checkPackageCompatibility(
    packageName: string,
    version: string,
    framework: 'react' | 'flutter'
  ): PackageInfo {
    const warnings: string[] = [];
    const hasNativeDependencies = this.knownNativePackages.has(packageName);
    const isLumoraCompatible = this.lumoraCompatiblePackages.has(packageName);

    if (hasNativeDependencies) {
      warnings.push(
        `Package "${packageName}" contains native code and will not work in Lumora Go (dev preview mode).`
      );
      warnings.push(
        `Native packages are only available in production builds generated with "lumora build".`
      );
    }

    if (!isLumoraCompatible && !hasNativeDependencies) {
      warnings.push(
        `Package "${packageName}" compatibility with Lumora is unknown. It may or may not work.`
      );
      warnings.push(
        `If this package works well with Lumora, please let us know!`
      );
    }

    return {
      name: packageName,
      version,
      framework,
      hasNativeDependencies,
      isLumoraCompatible,
      warnings,
    };
  }

  /**
   * Get all packages from pubspec.yaml
   * @param filePath Path to pubspec.yaml
   * @returns Array of package info
   */
  getFlutterPackages(filePath: string): PackageInfo[] {
    const pubspec = this.parsePubspec(filePath);
    const packages: PackageInfo[] = [];

    if (pubspec.dependencies) {
      for (const [name, versionOrConfig] of Object.entries(pubspec.dependencies)) {
        // Skip Flutter SDK
        if (name === 'flutter') continue;

        const version = typeof versionOrConfig === 'string' 
          ? versionOrConfig 
          : versionOrConfig?.version || 'any';

        packages.push(this.checkPackageCompatibility(name, version, 'flutter'));
      }
    }

    return packages;
  }

  /**
   * Get all packages from package.json
   * @param filePath Path to package.json
   * @returns Array of package info
   */
  getReactPackages(filePath: string): PackageInfo[] {
    const packageJson = this.parsePackageJson(filePath);
    const packages: PackageInfo[] = [];

    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        // Skip React itself
        if (name === 'react' || name === 'react-dom') continue;

        packages.push(this.checkPackageCompatibility(name, version, 'react'));
      }
    }

    return packages;
  }

  /**
   * Convert package info to plugin
   * @param packageInfo Package info
   * @returns Plugin object
   */
  packageToPlugin(packageInfo: PackageInfo): Plugin {
    const metadata: PluginMetadata = {
      name: packageInfo.name,
      version: packageInfo.version,
    };

    const compatibility: PluginCompatibility = {
      platforms: packageInfo.hasNativeDependencies 
        ? ['ios', 'android'] 
        : ['ios', 'android', 'web'],
    };

    const capabilities: PluginCapabilities = {
      nativeCode: packageInfo.hasNativeDependencies,
    };

    return {
      metadata,
      compatibility,
      capabilities,
      enabled: true,
      installedAt: Date.now(),
    };
  }

  /**
   * Warn about native dependencies
   * @param packages Array of package info
   * @returns Array of warnings
   */
  warnAboutNativeDependencies(packages: PackageInfo[]): string[] {
    const warnings: string[] = [];
    const nativePackages = packages.filter(p => p.hasNativeDependencies);

    if (nativePackages.length > 0) {
      warnings.push(
        `⚠️  Found ${nativePackages.length} package(s) with native dependencies:`
      );
      nativePackages.forEach(p => {
        warnings.push(`   • ${p.name} (${p.version})`);
      });
      warnings.push('');
      warnings.push(
        '   These packages will NOT work in Lumora Go (dev preview mode).'
      );
      warnings.push(
        '   They will only be available in production builds.'
      );
    }

    return warnings;
  }

  /**
   * Add a known native package
   * @param packageName Package name
   */
  addKnownNativePackage(packageName: string): void {
    this.knownNativePackages.add(packageName);
  }

  /**
   * Add a Lumora-compatible package
   * @param packageName Package name
   */
  addLumoraCompatiblePackage(packageName: string): void {
    this.lumoraCompatiblePackages.add(packageName);
  }

  /**
   * Check if package has native dependencies
   * @param packageName Package name
   * @returns True if package has native dependencies
   */
  hasNativeDependencies(packageName: string): boolean {
    return this.knownNativePackages.has(packageName);
  }

  /**
   * Check if package is Lumora-compatible
   * @param packageName Package name
   * @returns True if package is known to be compatible
   */
  isLumoraCompatible(packageName: string): boolean {
    return this.lumoraCompatiblePackages.has(packageName);
  }

  /**
   * Get documentation URL for a package
   * @param packageName Package name
   * @param framework Framework (react or flutter)
   * @returns Documentation URL
   */
  getDocumentationUrl(packageName: string, framework: 'react' | 'flutter'): string {
    if (framework === 'flutter') {
      return `https://pub.dev/packages/${packageName}`;
    } else {
      return `https://www.npmjs.com/package/${packageName}`;
    }
  }

  /**
   * Find pubspec.yaml in project
   * @param projectPath Project root path
   * @returns Path to pubspec.yaml or null
   */
  findPubspec(projectPath: string): string | null {
    const pubspecPath = path.join(projectPath, 'pubspec.yaml');
    return fs.existsSync(pubspecPath) ? pubspecPath : null;
  }

  /**
   * Find package.json in project
   * @param projectPath Project root path
   * @returns Path to package.json or null
   */
  findPackageJson(projectPath: string): string | null {
    const packageJsonPath = path.join(projectPath, 'package.json');
    return fs.existsSync(packageJsonPath) ? packageJsonPath : null;
  }

  /**
   * Analyze project dependencies
   * @param projectPath Project root path
   * @returns Object with Flutter and React packages
   */
  analyzeProject(projectPath: string): {
    flutter: PackageInfo[];
    react: PackageInfo[];
    warnings: string[];
  } {
    const flutter: PackageInfo[] = [];
    const react: PackageInfo[] = [];
    const warnings: string[] = [];

    // Check for Flutter packages
    const pubspecPath = this.findPubspec(projectPath);
    if (pubspecPath) {
      try {
        flutter.push(...this.getFlutterPackages(pubspecPath));
      } catch (error: any) {
        warnings.push(`Error parsing pubspec.yaml: ${error.message}`);
      }
    }

    // Check for React packages
    const packageJsonPath = this.findPackageJson(projectPath);
    if (packageJsonPath) {
      try {
        react.push(...this.getReactPackages(packageJsonPath));
      } catch (error: any) {
        warnings.push(`Error parsing package.json: ${error.message}`);
      }
    }

    // Add native dependency warnings
    warnings.push(...this.warnAboutNativeDependencies([...flutter, ...react]));

    return { flutter, react, warnings };
  }
}

// Singleton instance
let managerInstance: PackageManager | null = null;

/**
 * Get the singleton instance of PackageManager
 * @returns PackageManager instance
 */
export function getPackageManager(): PackageManager {
  if (!managerInstance) {
    managerInstance = new PackageManager();
  }
  return managerInstance;
}

/**
 * Reset the manager instance (useful for testing)
 */
export function resetPackageManager(): void {
  managerInstance = null;
}
