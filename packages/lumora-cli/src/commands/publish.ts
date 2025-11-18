/**
 * Publish command - Publish OTA updates to Lumora Update Server
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { Command } from 'commander';
import * as crypto from 'crypto';

interface PublishOptions {
  channel?: string;
  platform?: string;
  message?: string;
  serverUrl?: string;
  apiKey?: string;
  rolloutPercentage?: number;
  skipConfirmation?: boolean;
}

export function createPublishCommand(): Command {
  const command = new Command('publish');

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

async function handlePublish(options: PublishOptions) {
  console.log(chalk.blue.bold('\n📦 Lumora Publish - OTA Update\n'));

  try {
    // Load project configuration
    const projectConfig = await loadProjectConfig();
    if (!projectConfig) {
      console.error(chalk.red('❌ No Lumora project found. Run "lumora init" first.'));
      process.exit(1);
    }

    // Validate options
    const channel = options.channel || 'production';
    const platform = options.platform || 'all';
    const serverUrl = options.serverUrl || 'http://localhost:3002';
    const rolloutPercentage = parseInt(String(options.rolloutPercentage || '100'));

    // Validate channel
    if (!['production', 'staging', 'development', 'preview'].includes(channel)) {
      console.error(chalk.red(`❌ Invalid channel: ${channel}`));
      process.exit(1);
    }

    // Validate platform
    if (!['ios', 'android', 'web', 'all'].includes(platform)) {
      console.error(chalk.red(`❌ Invalid platform: ${platform}`));
      process.exit(1);
    }

    // Show publish plan
    console.log(chalk.cyan('📋 Publish Plan:'));
    console.log(`   Project: ${chalk.white(projectConfig.name)}`);
    console.log(`   Version: ${chalk.white(projectConfig.version)}`);
    console.log(`   Channel: ${chalk.yellow(channel)}`);
    console.log(`   Platform: ${chalk.yellow(platform)}`);
    console.log(`   Server: ${chalk.gray(serverUrl)}`);
    console.log(`   Rollout: ${chalk.yellow(rolloutPercentage + '%')}`);
    if (options.message) {
      console.log(`   Message: ${chalk.gray(options.message)}`);
    }
    console.log('');

    // Confirm publication (unless skipped)
    if (!options.skipConfirmation) {
      const { confirmed } = await prompts({
        type: 'confirm',
        name: 'confirmed',
        message: `Publish ${chalk.yellow(projectConfig.version)} to ${chalk.yellow(channel)}?`,
        initial: false,
      });

      if (!confirmed) {
        console.log(chalk.yellow('⚠️  Publication cancelled'));
        process.exit(0);
      }
    }

    // Build assets
    const spinner = ora('Building assets...').start();
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
    console.log(chalk.green.bold('\n✅ Update published successfully!\n'));
    console.log(chalk.cyan('📊 Summary:'));
    console.log(`   Update ID: ${chalk.white(result.updateId)}`);
    console.log(`   Manifest URL: ${chalk.gray(serverUrl + result.manifest.manifestUrl)}`);
    console.log(`   Size: ${chalk.white(formatBytes(result.manifest.size))}`);
    console.log(`   Assets: ${chalk.white(assets.length)}`);
    console.log('');
    console.log(chalk.cyan('🚀 Your update is now live and will be delivered to devices!'));
    console.log('');

  } catch (error: any) {
    console.error(chalk.red('\n❌ Publication failed:'), error.message);
    if (error.response) {
      console.error(chalk.red('   Server response:'), error.response.data);
    }
    process.exit(1);
  }
}

async function loadProjectConfig(): Promise<any> {
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

async function buildAssets(projectConfig: any): Promise<any[]> {
  const assets: any[] = [];

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

async function findFiles(dir: string, extensions: string | string[]): Promise<string[]> {
  const exts = Array.isArray(extensions) ? extensions : [extensions];
  const files: string[] = [];

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, build, dist, etc.
        if (!['node_modules', 'build', 'dist', '.git', '.dart_tool'].includes(entry.name)) {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        if (exts.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
  }

  await walk(dir);
  return files;
}

async function createManifest(projectConfig: any, assets: any[], options: any): Promise<any> {
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

async function publishToServer(serverUrl: string, manifest: any, apiKey?: string): Promise<any> {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const response = await axios.post(
    `${serverUrl}/api/v1/updates/publish`,
    manifest,
    { headers }
  );

  return response.data;
}

async function createDeployment(
  serverUrl: string,
  updateId: string,
  channel: string,
  rolloutPercentage: number,
  apiKey?: string
): Promise<void> {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  await axios.post(
    `${serverUrl}/api/v1/deployments`,
    {
      manifestId: updateId,
      channel,
      rolloutPercentage,
    },
    { headers }
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
