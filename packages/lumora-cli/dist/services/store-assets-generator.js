"use strict";
/**
 * Store Assets Generator
 * Generates app icons, screenshots, and other assets for App Store and Play Store
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
exports.StoreAssetsGenerator = void 0;
exports.getStoreAssetsGenerator = getStoreAssetsGenerator;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class StoreAssetsGenerator {
    /**
     * Generate all store assets
     */
    async generateAssets(config) {
        const result = {
            icons: { ios: [], android: [] },
            screenshots: { ios: [], android: [] },
            metadata: [],
        };
        // Create output directories
        const outputDir = config.outputDir || path.join(config.projectPath, 'store-assets');
        await fs.ensureDir(outputDir);
        // Generate iOS assets
        if (config.iconSource) {
            result.icons.ios = await this.generateIOSIcons(config.iconSource, outputDir);
            result.icons.android = await this.generateAndroidIcons(config.iconSource, outputDir);
        }
        // Generate Screenshots (if source provided)
        if (config.screenshotSource) {
            result.screenshots.ios = await this.generateIOSScreenshots(config.screenshotSource, outputDir);
            result.screenshots.android = await this.generateAndroidScreenshots(config.screenshotSource, outputDir);
        }
        // Generate metadata templates
        result.metadata = await this.generateMetadataTemplates(config.appName, outputDir);
        // Generate Contents.json for iOS
        await this.generateIOSContentsJson(outputDir);
        return result;
    }
    /**
     * Generate iOS app icons
     */
    async generateIOSIcons(sourcePath, outputDir) {
        const iosIconsDir = path.join(outputDir, 'ios', 'AppIcon.appiconset');
        await fs.ensureDir(iosIconsDir);
        const generatedIcons = [];
        for (const icon of StoreAssetsGenerator.IOS_ICON_SIZES) {
            const size = Math.floor(icon.size * icon.scale);
            const outputPath = path.join(iosIconsDir, icon.filename);
            try {
                await this.resizeImage(sourcePath, outputPath, size, size);
                generatedIcons.push(outputPath);
            }
            catch (error) {
                console.error(`Failed to generate ${icon.filename}:`, error);
            }
        }
        return generatedIcons;
    }
    /**
     * Generate Android app icons
     */
    async generateAndroidIcons(sourcePath, outputDir) {
        const androidResDir = path.join(outputDir, 'android', 'res');
        const generatedIcons = [];
        for (const icon of StoreAssetsGenerator.ANDROID_ICON_SIZES) {
            const iconDir = path.join(androidResDir, icon.folder);
            await fs.ensureDir(iconDir);
            const outputPath = path.join(iconDir, icon.filename);
            try {
                await this.resizeImage(sourcePath, outputPath, icon.size, icon.size);
                generatedIcons.push(outputPath);
            }
            catch (error) {
                console.error(`Failed to generate ${icon.filename}:`, error);
            }
        }
        return generatedIcons;
    }
    /**
     * Generate iOS screenshots
     */
    async generateIOSScreenshots(sourcePath, outputDir) {
        const screenshotsDir = path.join(outputDir, 'ios', 'screenshots');
        await fs.ensureDir(screenshotsDir);
        const generatedScreenshots = [];
        for (const screenshot of StoreAssetsGenerator.IOS_SCREENSHOT_SIZES) {
            const outputPath = path.join(screenshotsDir, screenshot.filename);
            try {
                await this.resizeImage(sourcePath, outputPath, screenshot.width, screenshot.height);
                generatedScreenshots.push(outputPath);
            }
            catch (error) {
                console.error(`Failed to generate ${screenshot.filename}:`, error);
            }
        }
        return generatedScreenshots;
    }
    /**
     * Generate Android screenshots
     */
    async generateAndroidScreenshots(sourcePath, outputDir) {
        const screenshotsDir = path.join(outputDir, 'android', 'screenshots');
        await fs.ensureDir(screenshotsDir);
        const generatedScreenshots = [];
        for (const screenshot of StoreAssetsGenerator.ANDROID_SCREENSHOT_SIZES) {
            const outputPath = path.join(screenshotsDir, screenshot.filename);
            try {
                await this.resizeImage(sourcePath, outputPath, screenshot.width, screenshot.height);
                generatedScreenshots.push(outputPath);
            }
            catch (error) {
                console.error(`Failed to generate ${screenshot.filename}:`, error);
            }
        }
        return generatedScreenshots;
    }
    /**
     * Generate metadata templates
     */
    async generateMetadataTemplates(appName, outputDir) {
        const metadataFiles = [];
        // iOS App Store metadata
        const iosMetadata = path.join(outputDir, 'ios', 'metadata.txt');
        await fs.writeFile(iosMetadata, this.generateIOSMetadataTemplate(appName));
        metadataFiles.push(iosMetadata);
        // Android Play Store metadata
        const androidMetadata = path.join(outputDir, 'android', 'metadata.txt');
        await fs.writeFile(androidMetadata, this.generateAndroidMetadataTemplate(appName));
        metadataFiles.push(androidMetadata);
        // Privacy Policy template
        const privacyPolicy = path.join(outputDir, 'privacy-policy.md');
        await fs.writeFile(privacyPolicy, this.generatePrivacyPolicyTemplate(appName));
        metadataFiles.push(privacyPolicy);
        return metadataFiles;
    }
    /**
     * Generate iOS Contents.json
     */
    async generateIOSContentsJson(outputDir) {
        const contentsJson = {
            images: StoreAssetsGenerator.IOS_ICON_SIZES.map(icon => ({
                size: `${icon.size}x${icon.size}`,
                idiom: icon.idiom,
                filename: icon.filename,
                scale: `${icon.scale}x`,
            })),
            info: {
                version: 1,
                author: 'lumora',
            },
        };
        const contentsPath = path.join(outputDir, 'ios', 'AppIcon.appiconset', 'Contents.json');
        await fs.writeFile(contentsPath, JSON.stringify(contentsJson, null, 2));
    }
    /**
     * Resize image using ImageMagick or similar
     */
    async resizeImage(inputPath, outputPath, width, height) {
        // Try to use ImageMagick (convert command)
        // Fallback to copying if not available
        try {
            await execAsync(`convert "${inputPath}" -resize ${width}x${height}! "${outputPath}"`);
        }
        catch (error) {
            // If ImageMagick is not available, just copy the file
            // In a real implementation, you'd use a Node.js image library
            console.warn('ImageMagick not found, copying original image');
            await fs.copy(inputPath, outputPath);
        }
    }
    /**
     * Generate iOS metadata template
     */
    generateIOSMetadataTemplate(appName) {
        return `# ${appName} - App Store Metadata

## App Name
${appName}

## Subtitle (30 characters max)
[Your app subtitle here]

## Description (4000 characters max)
[Describe your app here. Focus on features and benefits.]

## Keywords (100 characters max, comma-separated)
app, mobile, [add more keywords]

## Support URL
https://yourwebsite.com/support

## Marketing URL
https://yourwebsite.com

## Privacy Policy URL
https://yourwebsite.com/privacy

## App Category
[Choose category: Productivity, Entertainment, etc.]

## Age Rating
4+ (Choose appropriate rating)

## Copyright
© ${new Date().getFullYear()} [Your Company Name]

## What's New (4000 characters max)
Version 1.0.0:
- Initial release
- [List new features]

## App Preview/Screenshots
- Include 3-10 screenshots per device size
- Show key features and benefits
- Use descriptive captions
`;
    }
    /**
     * Generate Android metadata template
     */
    generateAndroidMetadataTemplate(appName) {
        return `# ${appName} - Play Store Metadata

## App Title (50 characters max)
${appName}

## Short Description (80 characters max)
[Brief description of your app]

## Full Description (4000 characters max)
[Detailed description of your app, features, and benefits]

## App Category
[Choose category: Tools, Entertainment, etc.]

## Content Rating
Everyone (Choose appropriate rating)

## Privacy Policy URL
https://yourwebsite.com/privacy

## Developer Email
support@yourcompany.com

## Developer Website
https://yourwebsite.com

## Screenshots
- Feature graphic: 1024 x 500
- Phone screenshots: 320-3840 px
- Tablet screenshots: 1200-7680 px
- Minimum 2 screenshots required

## Promotional Graphics (Optional)
- Feature Graphic: 1024 x 500 px
- Promo Graphic: 180 x 120 px
- TV Banner: 1280 x 720 px
`;
    }
    /**
     * Generate Privacy Policy template
     */
    generatePrivacyPolicyTemplate(appName) {
        return `# Privacy Policy for ${appName}

Last updated: ${new Date().toLocaleDateString()}

## Introduction

This privacy policy explains how ${appName} ("we", "us", or "our") collects, uses, and protects your personal information.

## Information We Collect

[Describe what information you collect]

## How We Use Your Information

[Explain how you use the collected information]

## Data Security

[Describe your security measures]

## Third-Party Services

[List any third-party services you use]

## Your Rights

[Explain user rights regarding their data]

## Changes to This Policy

[Explain how policy changes will be communicated]

## Contact Us

If you have questions about this privacy policy, please contact us at:
support@yourcompany.com
`;
    }
}
exports.StoreAssetsGenerator = StoreAssetsGenerator;
// iOS App Icon Sizes (from Apple Human Interface Guidelines)
StoreAssetsGenerator.IOS_ICON_SIZES = [
    // iPhone
    { size: 20, scale: 2, idiom: 'iphone', filename: 'Icon-App-20x20@2x.png' },
    { size: 20, scale: 3, idiom: 'iphone', filename: 'Icon-App-20x20@3x.png' },
    { size: 29, scale: 2, idiom: 'iphone', filename: 'Icon-App-29x29@2x.png' },
    { size: 29, scale: 3, idiom: 'iphone', filename: 'Icon-App-29x29@3x.png' },
    { size: 40, scale: 2, idiom: 'iphone', filename: 'Icon-App-40x40@2x.png' },
    { size: 40, scale: 3, idiom: 'iphone', filename: 'Icon-App-40x40@3x.png' },
    { size: 60, scale: 2, idiom: 'iphone', filename: 'Icon-App-60x60@2x.png' },
    { size: 60, scale: 3, idiom: 'iphone', filename: 'Icon-App-60x60@3x.png' },
    // iPad
    { size: 20, scale: 1, idiom: 'ipad', filename: 'Icon-App-20x20@1x.png' },
    { size: 20, scale: 2, idiom: 'ipad', filename: 'Icon-App-20x20@2x.png' },
    { size: 29, scale: 1, idiom: 'ipad', filename: 'Icon-App-29x29@1x.png' },
    { size: 29, scale: 2, idiom: 'ipad', filename: 'Icon-App-29x29@2x.png' },
    { size: 40, scale: 1, idiom: 'ipad', filename: 'Icon-App-40x40@1x.png' },
    { size: 40, scale: 2, idiom: 'ipad', filename: 'Icon-App-40x40@2x.png' },
    { size: 76, scale: 1, idiom: 'ipad', filename: 'Icon-App-76x76@1x.png' },
    { size: 76, scale: 2, idiom: 'ipad', filename: 'Icon-App-76x76@2x.png' },
    { size: 83.5, scale: 2, idiom: 'ipad', filename: 'Icon-App-83.5x83.5@2x.png' },
    // App Store
    { size: 1024, scale: 1, idiom: 'ios-marketing', filename: 'Icon-App-1024x1024@1x.png' },
];
// Android Icon Sizes
StoreAssetsGenerator.ANDROID_ICON_SIZES = [
    { size: 48, folder: 'mipmap-mdpi', filename: 'ic_launcher.png' },
    { size: 72, folder: 'mipmap-hdpi', filename: 'ic_launcher.png' },
    { size: 96, folder: 'mipmap-xhdpi', filename: 'ic_launcher.png' },
    { size: 144, folder: 'mipmap-xxhdpi', filename: 'ic_launcher.png' },
    { size: 192, folder: 'mipmap-xxxhdpi', filename: 'ic_launcher.png' },
    { size: 512, folder: 'playstore', filename: 'icon.png' },
];
// Screenshot Sizes
StoreAssetsGenerator.IOS_SCREENSHOT_SIZES = [
    // iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max)
    { width: 1290, height: 2796, device: 'iPhone 6.7"', filename: 'iphone-6.7-1.png' },
    // iPhone 6.5" (iPhone XS Max, 11 Pro Max)
    { width: 1242, height: 2688, device: 'iPhone 6.5"', filename: 'iphone-6.5-1.png' },
    // iPhone 5.5" (iPhone 8 Plus)
    { width: 1242, height: 2208, device: 'iPhone 5.5"', filename: 'iphone-5.5-1.png' },
    // iPad Pro 12.9"
    { width: 2048, height: 2732, device: 'iPad Pro 12.9"', filename: 'ipad-12.9-1.png' },
];
StoreAssetsGenerator.ANDROID_SCREENSHOT_SIZES = [
    { width: 1080, height: 1920, device: 'Phone', filename: 'phone-1.png' },
    { width: 1600, height: 2560, device: 'Tablet 10"', filename: 'tablet-10-1.png' },
];
// Singleton instance
let generatorInstance = null;
function getStoreAssetsGenerator() {
    if (!generatorInstance) {
        generatorInstance = new StoreAssetsGenerator();
    }
    return generatorInstance;
}
//# sourceMappingURL=store-assets-generator.js.map