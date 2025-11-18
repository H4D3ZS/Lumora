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
const publish_1 = require("./commands/publish");
const updates_1 = require("./commands/updates");
const install_1 = require("./commands/install");
const plugin_1 = require("./commands/plugin");
const store_1 = require("./commands/store");
const docs_1 = require("./commands/docs");
const collaborate_1 = require("./commands/collaborate");
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
// lumora publish - Publish OTA update
program.addCommand((0, publish_1.createPublishCommand)());
// lumora updates - Manage updates
program.addCommand((0, updates_1.createUpdatesCommand)());
// lumora install - Install packages
program.addCommand((0, install_1.createInstallCommand)());
// lumora uninstall - Uninstall packages
program.addCommand((0, install_1.createUninstallCommand)());
// lumora list - List packages
program.addCommand((0, install_1.createListCommand)());
// lumora link - Link native module
program.addCommand((0, install_1.createLinkCommand)());
// lumora update - Update packages
program.addCommand((0, install_1.createUpdateCommand)());
// lumora doctor - Health check
program.addCommand((0, install_1.createDoctorCommand)());
// lumora plugin - Plugin management
program.addCommand((0, plugin_1.createPluginCommand)());
// lumora store - App Store preparation
program.addCommand((0, store_1.createStoreCommand)());
// lumora docs - Documentation generation
program.addCommand((0, docs_1.createDocsCommand)());
// lumora template - Template management
program.addCommand((0, docs_1.createTemplateCommand)());
// lumora tutorial - Interactive tutorials
program.addCommand((0, docs_1.createTutorialCommand)());
// lumora collab - Collaboration features
program.addCommand((0, collaborate_1.createCollaborateCommand)());
// lumora team - Team management
program.addCommand((0, collaborate_1.createTeamCommand)());
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