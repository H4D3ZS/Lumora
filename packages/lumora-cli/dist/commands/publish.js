"use strict";
/**
 * Publish command - Publish OTA updates to Lumora Update Server
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
exports.createPublishCommand = createPublishCommand;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const prompts_1 = __importDefault(require("prompts"));
const commander_1 = require("commander");
const crypto = __importStar(require("crypto"));
function createPublishCommand() {
    const command = new commander_1.Command('publish');
    command
        .description('Publish an over-the-air update to Lumora Update Server')
        .option('-c, --channel <channel>', 'Update channel (production, staging, development)', 'production')
        .option('-p, --platform <platform>', 'Target platform (ios, android, web, all)', 'all')
        .option('-m, --message <message>', 'Release notes or description')
        .option('--server-url <url>', 'Update server URL', process.env.LUMORA_UPDATE_SERVER || 'http://localhost:3002')
        .option('--api-key <key>', 'API key for authentication', process.env.LUMORA_API_KEY)
        .option('--rollout <percentage>', 'Gradual rollout percentage (1-100)', '100')
        .option('--skip-confirmation', 'Skip confirmation prompt')
        .action(handlePublish);
    return command;
}
async function handlePublish(options) {
    console.log(chalk_1.default.blue.bold('\n📦 Lumora Publish - OTA Update\n'));
    try {
        // Load project configuration
        const projectConfig = await loadProjectConfig();
        if (!projectConfig) {
            console.error(chalk_1.default.red('❌ No Lumora project found. Run "lumora init" first.'));
            process.exit(1);
        }
        // Validate options
        const channel = options.channel || 'production';
        const platform = options.platform || 'all';
        const serverUrl = options.serverUrl || 'http://localhost:3002';
        const rolloutPercentage = parseInt(String(options.rolloutPercentage || '100'));
        // Validate channel
        if (!['production', 'staging', 'development', 'preview'].includes(channel)) {
            console.error(chalk_1.default.red(`❌ Invalid channel: ${channel}`));
            process.exit(1);
        }
        // Validate platform
        if (!['ios', 'android', 'web', 'all'].includes(platform)) {
            console.error(chalk_1.default.red(`❌ Invalid platform: ${platform}`));
            process.exit(1);
        }
        // Show publish plan
        console.log(chalk_1.default.cyan('📋 Publish Plan:'));
        console.log(`   Project: ${chalk_1.default.white(projectConfig.name)}`);
        console.log(`   Version: ${chalk_1.default.white(projectConfig.version)}`);
        console.log(`   Channel: ${chalk_1.default.yellow(channel)}`);
        console.log(`   Platform: ${chalk_1.default.yellow(platform)}`);
        console.log(`   Server: ${chalk_1.default.gray(serverUrl)}`);
        console.log(`   Rollout: ${chalk_1.default.yellow(rolloutPercentage + '%')}`);
        if (options.message) {
            console.log(`   Message: ${chalk_1.default.gray(options.message)}`);
        }
        console.log('');
        // Confirm publication (unless skipped)
        if (!options.skipConfirmation) {
            const { confirmed } = await (0, prompts_1.default)({
                type: 'confirm',
                name: 'confirmed',
                message: `Publish ${chalk_1.default.yellow(projectConfig.version)} to ${chalk_1.default.yellow(channel)}?`,
                initial: false,
            });
            if (!confirmed) {
                console.log(chalk_1.default.yellow('⚠️  Publication cancelled'));
                process.exit(0);
            }
        }
        // Build assets
        const spinner = (0, ora_1.default)('Building assets...').start();
        const assets = await buildAssets(projectConfig);
        spinner.succeed(`Built ${assets.length} assets`);
        // Create manifest
        spinner.start('Creating update manifest...');
        const manifest = await createManifest(projectConfig, assets, {
            channel,
            platform,
            message: options.message,
        });
        spinner.succeed('Created update manifest');
        // Publish to server
        spinner.start('Publishing to update server...');
        const result = await publishToServer(serverUrl, manifest, options.apiKey);
        spinner.succeed('Published successfully!');
        // Create deployment
        spinner.start('Creating deployment...');
        await createDeployment(serverUrl, result.updateId, channel, rolloutPercentage, options.apiKey);
        spinner.succeed('Deployment created');
        // Success summary
        console.log(chalk_1.default.green.bold('\n✅ Update published successfully!\n'));
        console.log(chalk_1.default.cyan('📊 Summary:'));
        console.log(`   Update ID: ${chalk_1.default.white(result.updateId)}`);
        console.log(`   Manifest URL: ${chalk_1.default.gray(serverUrl + result.manifest.manifestUrl)}`);
        console.log(`   Size: ${chalk_1.default.white(formatBytes(result.manifest.size))}`);
        console.log(`   Assets: ${chalk_1.default.white(assets.length)}`);
        console.log('');
        console.log(chalk_1.default.cyan('🚀 Your update is now live and will be delivered to devices!'));
        console.log('');
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Publication failed:'), error.message);
        if (error.response) {
            console.error(chalk_1.default.red('   Server response:'), error.response.data);
        }
        process.exit(1);
    }
}
async function loadProjectConfig() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!await fs.pathExists(packageJsonPath)) {
        return null;
    }
    const packageJson = await fs.readJson(packageJsonPath);
    // Check for Lumora config
    if (!packageJson.lumora) {
        return null;
    }
    return {
        name: packageJson.name,
        version: packageJson.version,
        ...packageJson.lumora,
    };
}
async function buildAssets(projectConfig) {
    const assets = [];
    // Build Flutter assets (if Flutter project)
    const flutterDir = path.join(process.cwd(), 'lib');
    if (await fs.pathExists(flutterDir)) {
        const dartFiles = await findFiles(flutterDir, '.dart');
        for (const file of dartFiles) {
            const content = await fs.readFile(file, 'utf-8');
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            const stats = await fs.stat(file);
            assets.push({
                key: path.relative(process.cwd(), file),
                path: file,
                url: `/assets/${hash}`,
                hash,
                size: stats.size,
                contentType: 'text/plain',
            });
        }
    }
    // Build React assets (if React project)
    const srcDir = path.join(process.cwd(), 'src');
    if (await fs.pathExists(srcDir)) {
        const jsFiles = await findFiles(srcDir, ['.tsx', '.ts', '.jsx', '.js']);
        for (const file of jsFiles) {
            const content = await fs.readFile(file, 'utf-8');
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            const stats = await fs.stat(file);
            assets.push({
                key: path.relative(process.cwd(), file),
                path: file,
                url: `/assets/${hash}`,
                hash,
                size: stats.size,
                contentType: 'application/javascript',
            });
        }
    }
    return assets;
}
async function findFiles(dir, extensions) {
    const exts = Array.isArray(extensions) ? extensions : [extensions];
    const files = [];
    async function walk(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                // Skip node_modules, build, dist, etc.
                if (!['node_modules', 'build', 'dist', '.git', '.dart_tool'].includes(entry.name)) {
                    await walk(fullPath);
                }
            }
            else if (entry.isFile()) {
                if (exts.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        }
    }
    await walk(dir);
    return files;
}
async function createManifest(projectConfig, assets, options) {
    return {
        version: projectConfig.version,
        channel: options.channel,
        platform: options.platform,
        runtimeVersion: projectConfig.runtimeVersion || '1.0.0',
        assets,
        metadata: {
            description: options.message,
            releaseNotes: options.message,
            author: process.env.USER || 'unknown',
            buildNumber: Date.now(),
            tags: [options.channel, options.platform],
        },
    };
}
async function publishToServer(serverUrl, manifest, apiKey) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (apiKey) {
        headers['X-API-Key'] = apiKey;
    }
    const response = await axios_1.default.post(`${serverUrl}/api/v1/updates/publish`, manifest, { headers });
    return response.data;
}
async function createDeployment(serverUrl, updateId, channel, rolloutPercentage, apiKey) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (apiKey) {
        headers['X-API-Key'] = apiKey;
    }
    await axios_1.default.post(`${serverUrl}/api/v1/deployments`, {
        manifestId: updateId,
        channel,
        rolloutPercentage,
    }, { headers });
}
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
//# sourceMappingURL=publish.js.map