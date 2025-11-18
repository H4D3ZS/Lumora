"use strict";
/**
 * Store commands
 * Prepare app for App Store and Play Store submission
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
exports.createStoreCommand = createStoreCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const store_assets_generator_1 = require("../services/store-assets-generator");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
function createStoreCommand() {
    const store = new commander_1.Command('store')
        .description('Prepare app for App Store and Play Store');
    // Generate assets
    store
        .command('generate-assets')
        .description('Generate app icons and screenshots for stores')
        .option('--icon <path>', 'Path to app icon (1024x1024 PNG)')
        .option('--screenshot <path>', 'Path to screenshot template')
        .option('--output <dir>', 'Output directory', './store-assets')
        .action(handleGenerateAssets);
    // Validate assets
    store
        .command('validate')
        .description('Validate app store assets and metadata')
        .action(handleValidate);
    // Generate metadata
    store
        .command('metadata')
        .description('Generate metadata templates for App Store and Play Store')
        .option('--app-name <name>', 'App name')
        .option('--output <dir>', 'Output directory', './store-assets')
        .action(handleMetadata);
    return store;
}
async function handleGenerateAssets(options) {
    const spinner = (0, ora_1.default)('Generating store assets...').start();
    try {
        // Validate inputs
        if (!options.icon) {
            spinner.fail(chalk_1.default.red('Icon source is required. Use --icon <path>'));
            return;
        }
        const iconPath = path.resolve(options.icon);
        if (!await fs.pathExists(iconPath)) {
            spinner.fail(chalk_1.default.red(`Icon not found: ${iconPath}`));
            return;
        }
        // Get app name from package.json
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        let appName = 'My App';
        if (await fs.pathExists(packageJsonPath)) {
            const packageJson = await fs.readJson(packageJsonPath);
            appName = packageJson.name || appName;
        }
        spinner.text = 'Generating icons and screenshots...';
        const generator = (0, store_assets_generator_1.getStoreAssetsGenerator)();
        const result = await generator.generateAssets({
            projectPath: process.cwd(),
            appName,
            iconSource: iconPath,
            screenshotSource: options.screenshot,
            outputDir: path.resolve(options.output),
        });
        spinner.succeed(chalk_1.default.green('Store assets generated successfully!'));
        console.log(chalk_1.default.bold('\n📦 Generated Assets:\n'));
        console.log(chalk_1.default.cyan('iOS Icons:'));
        console.log(`  ${result.icons.ios.length} icons generated`);
        console.log(chalk_1.default.dim(`  Location: ${options.output}/ios/AppIcon.appiconset/`));
        console.log(chalk_1.default.cyan('\nAndroid Icons:'));
        console.log(`  ${result.icons.android.length} icons generated`);
        console.log(chalk_1.default.dim(`  Location: ${options.output}/android/res/`));
        if (result.screenshots.ios.length > 0) {
            console.log(chalk_1.default.cyan('\niOS Screenshots:'));
            console.log(`  ${result.screenshots.ios.length} screenshots generated`);
            console.log(chalk_1.default.dim(`  Location: ${options.output}/ios/screenshots/`));
        }
        if (result.screenshots.android.length > 0) {
            console.log(chalk_1.default.cyan('\nAndroid Screenshots:'));
            console.log(`  ${result.screenshots.android.length} screenshots generated`);
            console.log(chalk_1.default.dim(`  Location: ${options.output}/android/screenshots/`));
        }
        console.log(chalk_1.default.cyan('\nMetadata Templates:'));
        console.log(`  ${result.metadata.length} templates generated`);
        result.metadata.forEach(file => {
            console.log(chalk_1.default.dim(`  - ${path.basename(file)}`));
        });
        console.log(chalk_1.default.yellow('\n💡 Next Steps:'));
        console.log('  1. Review and customize the metadata templates');
        console.log('  2. Add screenshots for all required device sizes');
        console.log('  3. Run "lumora store validate" to check compliance');
        console.log('  4. Upload assets to App Store Connect / Play Console');
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to generate assets: ${error.message}`));
        console.error(error);
    }
}
async function handleValidate() {
    const spinner = (0, ora_1.default)('Validating store assets...').start();
    try {
        const storeAssetsDir = path.join(process.cwd(), 'store-assets');
        if (!await fs.pathExists(storeAssetsDir)) {
            spinner.fail(chalk_1.default.red('Store assets directory not found. Run "lumora store generate-assets" first.'));
            return;
        }
        const issues = [];
        const warnings = [];
        // Check iOS assets
        const iosIconsDir = path.join(storeAssetsDir, 'ios', 'AppIcon.appiconset');
        if (await fs.pathExists(iosIconsDir)) {
            const contentsJson = path.join(iosIconsDir, 'Contents.json');
            if (!await fs.pathExists(contentsJson)) {
                issues.push('iOS Contents.json missing');
            }
            // Check for required icon sizes
            const requiredIcons = [
                'Icon-App-60x60@2x.png',
                'Icon-App-60x60@3x.png',
                'Icon-App-1024x1024@1x.png',
            ];
            for (const icon of requiredIcons) {
                if (!await fs.pathExists(path.join(iosIconsDir, icon))) {
                    issues.push(`Missing iOS icon: ${icon}`);
                }
            }
        }
        else {
            issues.push('iOS app icons directory not found');
        }
        // Check Android assets
        const androidResDir = path.join(storeAssetsDir, 'android', 'res');
        if (await fs.pathExists(androidResDir)) {
            const requiredDensities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
            for (const density of requiredDensities) {
                const iconPath = path.join(androidResDir, `mipmap-${density}`, 'ic_launcher.png');
                if (!await fs.pathExists(iconPath)) {
                    issues.push(`Missing Android icon for ${density}`);
                }
            }
        }
        else {
            issues.push('Android resources directory not found');
        }
        // Check metadata
        const iosMetadata = path.join(storeAssetsDir, 'ios', 'metadata.txt');
        if (!await fs.pathExists(iosMetadata)) {
            warnings.push('iOS metadata template missing');
        }
        const androidMetadata = path.join(storeAssetsDir, 'android', 'metadata.txt');
        if (!await fs.pathExists(androidMetadata)) {
            warnings.push('Android metadata template missing');
        }
        const privacyPolicy = path.join(storeAssetsDir, 'privacy-policy.md');
        if (!await fs.pathExists(privacyPolicy)) {
            warnings.push('Privacy policy template missing');
        }
        spinner.stop();
        if (issues.length === 0 && warnings.length === 0) {
            console.log(chalk_1.default.green('✓ All store assets are valid!'));
        }
        else {
            if (issues.length > 0) {
                console.log(chalk_1.default.red.bold('\n❌ Issues Found:\n'));
                issues.forEach(issue => console.log(chalk_1.default.red(`  • ${issue}`)));
            }
            if (warnings.length > 0) {
                console.log(chalk_1.default.yellow.bold('\n⚠ Warnings:\n'));
                warnings.forEach(warning => console.log(chalk_1.default.yellow(`  • ${warning}`)));
            }
            console.log(chalk_1.default.dim('\nRun "lumora store generate-assets" to regenerate missing assets.'));
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Validation failed: ${error.message}`));
    }
}
async function handleMetadata(options) {
    const spinner = (0, ora_1.default)('Generating metadata templates...').start();
    try {
        const appName = options.appName || 'My App';
        const outputDir = path.resolve(options.output);
        await fs.ensureDir(outputDir);
        const generator = (0, store_assets_generator_1.getStoreAssetsGenerator)();
        // Just generate metadata, not full assets
        const result = await generator.generateAssets({
            projectPath: process.cwd(),
            appName,
            outputDir,
        });
        spinner.succeed(chalk_1.default.green('Metadata templates generated!'));
        console.log(chalk_1.default.bold('\n📝 Metadata Templates:\n'));
        result.metadata.forEach(file => {
            console.log(chalk_1.default.cyan(`  ✓ ${path.basename(file)}`));
        });
        console.log(chalk_1.default.yellow('\n💡 Next Steps:'));
        console.log('  1. Open the metadata templates and fill in your app information');
        console.log('  2. Customize descriptions for your target audience');
        console.log('  3. Review privacy policy and update with your practices');
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to generate metadata: ${error.message}`));
    }
}
//# sourceMappingURL=store.js.map