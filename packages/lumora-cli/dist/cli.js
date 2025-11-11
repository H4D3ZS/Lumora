#!/usr/bin/env node
"use strict";
/**
 * Lumora CLI
 * Expo-like development experience for Flutter
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const start_1 = require("./commands/start");
const init_1 = require("./commands/init");
const build_1 = require("./commands/build");
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const path_1 = require("path");
// Read version from package.json
const packageJson = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../package.json'), 'utf-8'));
const program = new commander_1.Command();
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
    .action(start_1.startCommand);
// lumora init - Initialize new project
program
    .command('init <project-name>')
    .description('Create a new Lumora project')
    .option('-t, --template <template>', 'Project template', 'default')
    .action(init_1.initCommand);
// lumora build - Build production app
program
    .command('build')
    .description('Build production Flutter app')
    .option('--platform <platform>', 'Platform: android, ios, or both', 'both')
    .option('--release', 'Build release version', true)
    .action(build_1.buildCommand);
// Note: Conversion happens automatically in lumora start
// No manual convert commands needed - it's all automatic!
// Error handling
program.on('command:*', () => {
    console.error(chalk_1.default.red(`\n✗ Invalid command: ${program.args.join(' ')}\n`));
    console.log(chalk_1.default.yellow('Run "lumora --help" for available commands.\n'));
    process.exit(1);
});
// Parse arguments
program.parse(process.argv);
// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=cli.js.map