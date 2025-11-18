#!/usr/bin/env node
/**
 * Lumora CLI
 * Expo-like development experience for Flutter
 */

import { Command } from 'commander';
import { startCommand } from './commands/start';
import { initCommand } from './commands/init';
import { buildCommand } from './commands/build';
import { createPublishCommand } from './commands/publish';
import { createUpdatesCommand } from './commands/updates';
import {
  createInstallCommand,
  createUninstallCommand,
  createListCommand,
  createLinkCommand,
  createUpdateCommand,
  createDoctorCommand,
} from './commands/install';
import { createPluginCommand } from './commands/plugin';
import { createStoreCommand } from './commands/store';
import { createDocsCommand, createTemplateCommand, createTutorialCommand } from './commands/docs';
import { createCollaborateCommand, createTeamCommand } from './commands/collaborate';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('lumora')
  .description('Lumora CLI - Write React, Run Flutter')
  .version(packageJson.version);

// lumora start - Main development command (like expo start)
program
  .command('start')
  .description('Start Lumora development server with automatic updates')
  .option('-p, --port <port>', 'Port for Dev-Proxy server', '3000')
  .option('-m, --mode <mode>', 'Development mode: react, flutter, or universal', 'universal')
  .option('--no-qr', 'Disable QR code display')
  .option('--no-watch', 'Disable file watching')
  .option('--codegen', 'Enable automatic code generation (experimental)')
  .option('--web-only', 'Only start web server (no mobile)')
  .action(startCommand);

// lumora init - Initialize new project
program
  .command('init <project-name>')
  .description('Create a new Lumora project')
  .option('-t, --template <template>', 'Project template', 'default')
  .action(initCommand);

// lumora build - Build production app
program
  .command('build')
  .description('Build production Flutter app')
  .option('--platform <platform>', 'Platform: android, ios, or both', 'both')
  .option('--release', 'Build release version', true)
  .action(buildCommand);

// lumora publish - Publish OTA update
program.addCommand(createPublishCommand());

// lumora updates - Manage updates
program.addCommand(createUpdatesCommand());

// lumora install - Install packages
program.addCommand(createInstallCommand());

// lumora uninstall - Uninstall packages
program.addCommand(createUninstallCommand());

// lumora list - List packages
program.addCommand(createListCommand());

// lumora link - Link native module
program.addCommand(createLinkCommand());

// lumora update - Update packages
program.addCommand(createUpdateCommand());

// lumora doctor - Health check
program.addCommand(createDoctorCommand());

// lumora plugin - Plugin management
program.addCommand(createPluginCommand());

// lumora store - App Store preparation
program.addCommand(createStoreCommand());

// lumora docs - Documentation generation
program.addCommand(createDocsCommand());

// lumora template - Template management
program.addCommand(createTemplateCommand());

// lumora tutorial - Interactive tutorials
program.addCommand(createTutorialCommand());

// lumora collab - Collaboration features
program.addCommand(createCollaborateCommand());

// lumora team - Team management
program.addCommand(createTeamCommand());

// Note: Conversion happens automatically in lumora start
// No manual convert commands needed - it's all automatic!

// Error handling
program.on('command:*', () => {
  console.error(chalk.red(`\n✗ Invalid command: ${program.args.join(' ')}\n`));
  console.log(chalk.yellow('Run "lumora --help" for available commands.\n'));
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
