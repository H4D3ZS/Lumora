"use strict";
/**
 * Configuration Updater
 * Updates pubspec.yaml and package.json with asset references
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
exports.ConfigUpdater = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
class ConfigUpdater {
    /**
     * Update pubspec.yaml with Flutter assets
     */
    updatePubspecYaml(pubspecPath, assets) {
        if (!fs.existsSync(pubspecPath)) {
            throw new Error(`pubspec.yaml not found at ${pubspecPath}`);
        }
        const content = fs.readFileSync(pubspecPath, 'utf8');
        const pubspec = yaml.load(content);
        // Initialize flutter section if not exists
        if (!pubspec.flutter) {
            pubspec.flutter = {};
        }
        // Get existing assets
        const existingAssets = new Set(pubspec.flutter.assets || []);
        // Add new assets
        for (const asset of assets) {
            existingAssets.add(asset);
        }
        // Update assets array
        pubspec.flutter.assets = Array.from(existingAssets).sort();
        // Write back to file
        const updatedContent = yaml.dump(pubspec, {
            lineWidth: -1,
            noRefs: true,
        });
        fs.writeFileSync(pubspecPath, updatedContent, 'utf8');
    }
    /**
     * Update pubspec.yaml with Flutter fonts
     */
    updatePubspecFonts(pubspecPath, fontConfigs) {
        if (!fs.existsSync(pubspecPath)) {
            throw new Error(`pubspec.yaml not found at ${pubspecPath}`);
        }
        const content = fs.readFileSync(pubspecPath, 'utf8');
        const pubspec = yaml.load(content);
        // Initialize flutter section if not exists
        if (!pubspec.flutter) {
            pubspec.flutter = {};
        }
        // Get existing fonts
        const existingFonts = pubspec.flutter.fonts || [];
        const fontMap = new Map();
        // Index existing fonts by family
        for (const font of existingFonts) {
            fontMap.set(font.family, font);
        }
        // Add or update fonts
        for (const fontConfig of fontConfigs) {
            if (fontMap.has(fontConfig.family)) {
                // Merge with existing
                const existing = fontMap.get(fontConfig.family);
                const existingAssets = new Set(existing.fonts.map((f) => f.asset));
                for (const font of fontConfig.fonts) {
                    if (!existingAssets.has(font.asset)) {
                        existing.fonts.push(font);
                    }
                }
            }
            else {
                // Add new font family
                fontMap.set(fontConfig.family, fontConfig);
            }
        }
        // Update fonts array
        pubspec.flutter.fonts = Array.from(fontMap.values());
        // Write back to file
        const updatedContent = yaml.dump(pubspec, {
            lineWidth: -1,
            noRefs: true,
        });
        fs.writeFileSync(pubspecPath, updatedContent, 'utf8');
    }
    /**
     * Update package.json with React asset references
     * Note: React doesn't require explicit asset registration in package.json,
     * but we can add metadata for tracking
     */
    updatePackageJson(packageJsonPath, assets) {
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error(`package.json not found at ${packageJsonPath}`);
        }
        const content = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        // Add lumora metadata section
        if (!packageJson.lumora) {
            packageJson.lumora = {};
        }
        // Store asset references for tracking
        packageJson.lumora.assets = assets.sort();
        // Write back to file with proper formatting
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    }
    /**
     * Extract font configurations from asset list
     */
    extractFontConfigs(assets) {
        const fontMap = new Map();
        for (const asset of assets) {
            const ext = path.extname(asset).toLowerCase();
            if (!['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) {
                continue;
            }
            // Extract font family from path
            // Example: assets/fonts/Roboto-Regular.ttf -> Roboto
            const basename = path.basename(asset, ext);
            const familyMatch = basename.match(/^([A-Za-z]+)/);
            if (!familyMatch) {
                continue;
            }
            const family = familyMatch[1];
            // Extract weight and style
            const weight = this.extractFontWeight(basename);
            const style = this.extractFontStyle(basename);
            if (!fontMap.has(family)) {
                fontMap.set(family, []);
            }
            fontMap.get(family).push({
                asset,
                weight,
                style,
            });
        }
        return Array.from(fontMap.entries()).map(([family, fonts]) => ({
            family,
            fonts,
        }));
    }
    /**
     * Extract font weight from filename
     */
    extractFontWeight(filename) {
        const weightMap = {
            'Thin': 100,
            'ExtraLight': 200,
            'Light': 300,
            'Regular': 400,
            'Medium': 500,
            'SemiBold': 600,
            'Bold': 700,
            'ExtraBold': 800,
            'Black': 900,
        };
        for (const [key, value] of Object.entries(weightMap)) {
            if (filename.includes(key)) {
                return value;
            }
        }
        return undefined;
    }
    /**
     * Extract font style from filename
     */
    extractFontStyle(filename) {
        if (filename.includes('Italic')) {
            return 'italic';
        }
        return undefined;
    }
    /**
     * Get asset directories from configuration files
     */
    getAssetDirectories(projectRoot) {
        return {
            react: path.join(projectRoot, 'public'),
            flutter: path.join(projectRoot, 'assets'),
        };
    }
    /**
     * Validate asset configuration
     */
    validateAssetConfig(pubspecPath, assets) {
        const errors = [];
        if (!fs.existsSync(pubspecPath)) {
            errors.push(`pubspec.yaml not found at ${pubspecPath}`);
            return { valid: false, errors };
        }
        const content = fs.readFileSync(pubspecPath, 'utf8');
        const pubspec = yaml.load(content);
        const configuredAssets = new Set(pubspec.flutter?.assets || []);
        for (const asset of assets) {
            if (!configuredAssets.has(asset)) {
                errors.push(`Asset not configured in pubspec.yaml: ${asset}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
exports.ConfigUpdater = ConfigUpdater;
