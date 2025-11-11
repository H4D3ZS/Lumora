"use strict";
/**
 * Package Manager
 * Manages package dependencies from pubspec.yaml and package.json
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageManager = void 0;
exports.getPackageManager = getPackageManager;
exports.resetPackageManager = resetPackageManager;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
/**
 * Package Manager
 * Parses and validates packages from pubspec.yaml and package.json
 */
class PackageManager {
    constructor() {
        this.knownNativePackages = new Set([
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
        this.lumoraCompatiblePackages = new Set([
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
    }
    /**
     * Parse pubspec.yaml file
     * @param filePath Path to pubspec.yaml
     * @returns Parsed pubspec data
     */
    parsePubspec(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`pubspec.yaml not found: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
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
    parsePackageJson(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`package.json not found: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
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
    checkPackageCompatibility(packageName, version, framework) {
        const warnings = [];
        const hasNativeDependencies = this.knownNativePackages.has(packageName);
        const isLumoraCompatible = this.lumoraCompatiblePackages.has(packageName);
        if (hasNativeDependencies) {
            warnings.push(`Package "${packageName}" contains native code and will not work in Lumora Go (dev preview mode).`);
            warnings.push(`Native packages are only available in production builds generated with "lumora build".`);
        }
        if (!isLumoraCompatible && !hasNativeDependencies) {
            warnings.push(`Package "${packageName}" compatibility with Lumora is unknown. It may or may not work.`);
            warnings.push(`If this package works well with Lumora, please let us know!`);
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
    getFlutterPackages(filePath) {
        const pubspec = this.parsePubspec(filePath);
        const packages = [];
        if (pubspec.dependencies) {
            for (const [name, versionOrConfig] of Object.entries(pubspec.dependencies)) {
                // Skip Flutter SDK
                if (name === 'flutter')
                    continue;
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
    getReactPackages(filePath) {
        const packageJson = this.parsePackageJson(filePath);
        const packages = [];
        if (packageJson.dependencies) {
            for (const [name, version] of Object.entries(packageJson.dependencies)) {
                // Skip React itself
                if (name === 'react' || name === 'react-dom')
                    continue;
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
    packageToPlugin(packageInfo) {
        const metadata = {
            name: packageInfo.name,
            version: packageInfo.version,
        };
        const compatibility = {
            platforms: packageInfo.hasNativeDependencies
                ? ['ios', 'android']
                : ['ios', 'android', 'web'],
        };
        const capabilities = {
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
    warnAboutNativeDependencies(packages) {
        const warnings = [];
        const nativePackages = packages.filter(p => p.hasNativeDependencies);
        if (nativePackages.length > 0) {
            warnings.push(`⚠️  Found ${nativePackages.length} package(s) with native dependencies:`);
            nativePackages.forEach(p => {
                warnings.push(`   • ${p.name} (${p.version})`);
            });
            warnings.push('');
            warnings.push('   These packages will NOT work in Lumora Go (dev preview mode).');
            warnings.push('   They will only be available in production builds.');
        }
        return warnings;
    }
    /**
     * Add a known native package
     * @param packageName Package name
     */
    addKnownNativePackage(packageName) {
        this.knownNativePackages.add(packageName);
    }
    /**
     * Add a Lumora-compatible package
     * @param packageName Package name
     */
    addLumoraCompatiblePackage(packageName) {
        this.lumoraCompatiblePackages.add(packageName);
    }
    /**
     * Check if package has native dependencies
     * @param packageName Package name
     * @returns True if package has native dependencies
     */
    hasNativeDependencies(packageName) {
        return this.knownNativePackages.has(packageName);
    }
    /**
     * Check if package is Lumora-compatible
     * @param packageName Package name
     * @returns True if package is known to be compatible
     */
    isLumoraCompatible(packageName) {
        return this.lumoraCompatiblePackages.has(packageName);
    }
    /**
     * Get documentation URL for a package
     * @param packageName Package name
     * @param framework Framework (react or flutter)
     * @returns Documentation URL
     */
    getDocumentationUrl(packageName, framework) {
        if (framework === 'flutter') {
            return `https://pub.dev/packages/${packageName}`;
        }
        else {
            return `https://www.npmjs.com/package/${packageName}`;
        }
    }
    /**
     * Find pubspec.yaml in project
     * @param projectPath Project root path
     * @returns Path to pubspec.yaml or null
     */
    findPubspec(projectPath) {
        const pubspecPath = path.join(projectPath, 'pubspec.yaml');
        return fs.existsSync(pubspecPath) ? pubspecPath : null;
    }
    /**
     * Find package.json in project
     * @param projectPath Project root path
     * @returns Path to package.json or null
     */
    findPackageJson(projectPath) {
        const packageJsonPath = path.join(projectPath, 'package.json');
        return fs.existsSync(packageJsonPath) ? packageJsonPath : null;
    }
    /**
     * Analyze project dependencies
     * @param projectPath Project root path
     * @returns Object with Flutter and React packages
     */
    analyzeProject(projectPath) {
        const flutter = [];
        const react = [];
        const warnings = [];
        // Check for Flutter packages
        const pubspecPath = this.findPubspec(projectPath);
        if (pubspecPath) {
            try {
                flutter.push(...this.getFlutterPackages(pubspecPath));
            }
            catch (error) {
                warnings.push(`Error parsing pubspec.yaml: ${error.message}`);
            }
        }
        // Check for React packages
        const packageJsonPath = this.findPackageJson(projectPath);
        if (packageJsonPath) {
            try {
                react.push(...this.getReactPackages(packageJsonPath));
            }
            catch (error) {
                warnings.push(`Error parsing package.json: ${error.message}`);
            }
        }
        // Add native dependency warnings
        warnings.push(...this.warnAboutNativeDependencies([...flutter, ...react]));
        return { flutter, react, warnings };
    }
}
exports.PackageManager = PackageManager;
// Singleton instance
let managerInstance = null;
/**
 * Get the singleton instance of PackageManager
 * @returns PackageManager instance
 */
function getPackageManager() {
    if (!managerInstance) {
        managerInstance = new PackageManager();
    }
    return managerInstance;
}
/**
 * Reset the manager instance (useful for testing)
 */
function resetPackageManager() {
    managerInstance = null;
}
