/**
 * Lumora Build Command
 * Builds production Flutter app
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Simple spinner replacement
const spinner = {
  text: '',
  start(text: string) {
    this.text = text;
    console.log(chalk.gray(`⏳ ${text}`));
    return this;
  },
  succeed(text: string) {
    console.log(chalk.green(`✓ ${text}`));
    return this;
  },
  fail(text: string) {
    console.log(chalk.red(`✗ ${text}`));
    return this;
  },
};

export interface BuildOptions {
  platform: 'android' | 'ios' | 'both';
  release: boolean;
}

export async function buildCommand(options: BuildOptions) {
  console.log(chalk.bold.cyan('\n🏗️  Building Lumora app...\n'));

  try {
    const buildType = options.release ? 'release' : 'debug';

    if (options.platform === 'android' || options.platform === 'both') {
      spinner.start(`Building Android (${buildType})...`);
      await buildAndroid(buildType);
      spinner.succeed(chalk.green(`Android build complete`));
    }

    if (options.platform === 'ios' || options.platform === 'both') {
      spinner.start(`Building iOS (${buildType})...`);
      await buildIOS(buildType);
      spinner.succeed(chalk.green(`iOS build complete`));
    }

    console.log();
    console.log(chalk.bold.green('✓ Build completed successfully!\n'));

  } catch (error) {
    spinner.fail(chalk.red('Build failed'));
    console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  }
}

async function buildAndroid(buildType: string): Promise<void> {
  const command = `cd mobile && flutter build apk --${buildType}`;
  await execAsync(command);
}

async function buildIOS(buildType: string): Promise<void> {
  const command = `cd mobile && flutter build ios --${buildType}`;
  await execAsync(command);
}
