#!/usr/bin/env node
/**
 * Lumora CLI
 * Expo-like development experience for Flutter
 */

import { Command } from 'commander';
import { startCommand } from './commands/start';
import { initCommand } from './commands/init';
import { buildCommand } from './commands/build';
import chalk from 'chalk';

const program = new Command();

program
  .name('lumora')
  .description('Lumora CLI - Write React, Run Flutter')
  .version('0.1.0');

// lumora start - Main development command (like expo start)
program
  .command('start')
  .description('Start Lumora development server with automatic updates')
  .option('-p, --port <port>', 'Port for Dev-Proxy server', '3000')
  .option('-m, --mode <mode>', 'Development mode: react, flutter, or universal', 'universal')
  .option('--no-qr', 'Disable QR code display')
  .option('--no-watch', 'Disable file watching')
  .option('--no-codegen', 'Disable automatic code generation')
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
