/**
 * Store Assets Generator
 * Generates app icons, screenshots, and other assets for App Store and Play Store
 */
export interface AppIcon {
    size: number;
    scale: number;
    idiom: 'iphone' | 'ipad' | 'ios-marketing' | 'android';
    filename: string;
}
export interface Screenshot {
    width: number;
    height: number;
    device: string;
    filename: string;
}
export interface StoreAssetsConfig {
    projectPath: string;
    appName: string;
    iconSource?: string;
    screenshotSource?: string;
    outputDir?: string;
}
export interface StoreAssetsResult {
    icons: {
        ios: string[];
        android: string[];
    };
    screenshots: {
        ios: string[];
        android: string[];
    };
    metadata: string[];
}
export declare class StoreAssetsGenerator {
    private static readonly IOS_ICON_SIZES;
    private static readonly ANDROID_ICON_SIZES;
    private static readonly IOS_SCREENSHOT_SIZES;
    private static readonly ANDROID_SCREENSHOT_SIZES;
    /**
     * Generate all store assets
     */
    generateAssets(config: StoreAssetsConfig): Promise<StoreAssetsResult>;
    /**
     * Generate iOS app icons
     */
    private generateIOSIcons;
    /**
     * Generate Android app icons
     */
    private generateAndroidIcons;
    /**
     * Generate iOS screenshots
     */
    private generateIOSScreenshots;
    /**
     * Generate Android screenshots
     */
    private generateAndroidScreenshots;
    /**
     * Generate metadata templates
     */
    private generateMetadataTemplates;
    /**
     * Generate iOS Contents.json
     */
    private generateIOSContentsJson;
    /**
     * Resize image using ImageMagick or similar
     */
    private resizeImage;
    /**
     * Generate iOS metadata template
     */
    private generateIOSMetadataTemplate;
    /**
     * Generate Android metadata template
     */
    private generateAndroidMetadataTemplate;
    /**
     * Generate Privacy Policy template
     */
    private generatePrivacyPolicyTemplate;
}
export declare function getStoreAssetsGenerator(): StoreAssetsGenerator;
//# sourceMappingURL=store-assets-generator.d.ts.map