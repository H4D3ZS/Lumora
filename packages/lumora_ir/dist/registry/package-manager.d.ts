/**
 * Package Manager
 * Manages package dependencies from pubspec.yaml and package.json
 */
import { Plugin } from './plugin-registry';
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
export declare class PackageManager {
    private knownNativePackages;
    private lumoraCompatiblePackages;
    /**
     * Parse pubspec.yaml file
     * @param filePath Path to pubspec.yaml
     * @returns Parsed pubspec data
     */
    parsePubspec(filePath: string): PubspecYaml;
    /**
     * Parse package.json file
     * @param filePath Path to package.json
     * @returns Parsed package.json data
     */
    parsePackageJson(filePath: string): PackageJson;
    /**
     * Check package compatibility
     * @param packageName Package name
     * @param version Package version
     * @param framework Framework (react or flutter)
     * @returns Package info with compatibility details
     */
    checkPackageCompatibility(packageName: string, version: string, framework: 'react' | 'flutter'): PackageInfo;
    /**
     * Get all packages from pubspec.yaml
     * @param filePath Path to pubspec.yaml
     * @returns Array of package info
     */
    getFlutterPackages(filePath: string): PackageInfo[];
    /**
     * Get all packages from package.json
     * @param filePath Path to package.json
     * @returns Array of package info
     */
    getReactPackages(filePath: string): PackageInfo[];
    /**
     * Convert package info to plugin
     * @param packageInfo Package info
     * @returns Plugin object
     */
    packageToPlugin(packageInfo: PackageInfo): Plugin;
    /**
     * Warn about native dependencies
     * @param packages Array of package info
     * @returns Array of warnings
     */
    warnAboutNativeDependencies(packages: PackageInfo[]): string[];
    /**
     * Add a known native package
     * @param packageName Package name
     */
    addKnownNativePackage(packageName: string): void;
    /**
     * Add a Lumora-compatible package
     * @param packageName Package name
     */
    addLumoraCompatiblePackage(packageName: string): void;
    /**
     * Check if package has native dependencies
     * @param packageName Package name
     * @returns True if package has native dependencies
     */
    hasNativeDependencies(packageName: string): boolean;
    /**
     * Check if package is Lumora-compatible
     * @param packageName Package name
     * @returns True if package is known to be compatible
     */
    isLumoraCompatible(packageName: string): boolean;
    /**
     * Get documentation URL for a package
     * @param packageName Package name
     * @param framework Framework (react or flutter)
     * @returns Documentation URL
     */
    getDocumentationUrl(packageName: string, framework: 'react' | 'flutter'): string;
    /**
     * Find pubspec.yaml in project
     * @param projectPath Project root path
     * @returns Path to pubspec.yaml or null
     */
    findPubspec(projectPath: string): string | null;
    /**
     * Find package.json in project
     * @param projectPath Project root path
     * @returns Path to package.json or null
     */
    findPackageJson(projectPath: string): string | null;
    /**
     * Analyze project dependencies
     * @param projectPath Project root path
     * @returns Object with Flutter and React packages
     */
    analyzeProject(projectPath: string): {
        flutter: PackageInfo[];
        react: PackageInfo[];
        warnings: string[];
    };
}
/**
 * Get the singleton instance of PackageManager
 * @returns PackageManager instance
 */
export declare function getPackageManager(): PackageManager;
/**
 * Reset the manager instance (useful for testing)
 */
export declare function resetPackageManager(): void;
