/**
 * Configuration Updater
 * Updates pubspec.yaml and package.json with asset references
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface AssetConfig {
  images: string[];
  fonts: FontConfig[];
}

export interface FontConfig {
  family: string;
  fonts: FontFile[];
}

export interface FontFile {
  asset: string;
  weight?: number;
  style?: string;
}

export class ConfigUpdater {
  /**
   * Update pubspec.yaml with Flutter assets
   */
  updatePubspecYaml(pubspecPath: string, assets: string[]): void {
    if (!fs.existsSync(pubspecPath)) {
      throw new Error(`pubspec.yaml not found at ${pubspecPath}`);
    }

    const content = fs.readFileSync(pubspecPath, 'utf8');
    const pubspec = yaml.load(content) as any;

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
  updatePubspecFonts(pubspecPath: string, fontConfigs: FontConfig[]): void {
    if (!fs.existsSync(pubspecPath)) {
      throw new Error(`pubspec.yaml not found at ${pubspecPath}`);
    }

    const content = fs.readFileSync(pubspecPath, 'utf8');
    const pubspec = yaml.load(content) as any;

    // Initialize flutter section if not exists
    if (!pubspec.flutter) {
      pubspec.flutter = {};
    }

    // Get existing fonts
    const existingFonts = pubspec.flutter.fonts || [];
    const fontMap = new Map<string, any>();

    // Index existing fonts by family
    for (const font of existingFonts) {
      fontMap.set(font.family, font);
    }

    // Add or update fonts
    for (const fontConfig of fontConfigs) {
      if (fontMap.has(fontConfig.family)) {
        // Merge with existing
        const existing = fontMap.get(fontConfig.family);
        const existingAssets = new Set(existing.fonts.map((f: any) => f.asset));
        
        for (const font of fontConfig.fonts) {
          if (!existingAssets.has(font.asset)) {
            existing.fonts.push(font);
          }
        }
      } else {
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
  updatePackageJson(packageJsonPath: string, assets: string[]): void {
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
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n',
      'utf8'
    );
  }

  /**
   * Extract font configurations from asset list
   */
  extractFontConfigs(assets: string[]): FontConfig[] {
    const fontMap = new Map<string, FontFile[]>();

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

      fontMap.get(family)!.push({
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
  private extractFontWeight(filename: string): number | undefined {
    const weightMap: Record<string, number> = {
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
  private extractFontStyle(filename: string): string | undefined {
    if (filename.includes('Italic')) {
      return 'italic';
    }
    return undefined;
  }

  /**
   * Get asset directories from configuration files
   */
  getAssetDirectories(projectRoot: string): { react: string; flutter: string } {
    return {
      react: path.join(projectRoot, 'public'),
      flutter: path.join(projectRoot, 'assets'),
    };
  }

  /**
   * Validate asset configuration
   */
  validateAssetConfig(pubspecPath: string, assets: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!fs.existsSync(pubspecPath)) {
      errors.push(`pubspec.yaml not found at ${pubspecPath}`);
      return { valid: false, errors };
    }

    const content = fs.readFileSync(pubspecPath, 'utf8');
    const pubspec = yaml.load(content) as any;

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
