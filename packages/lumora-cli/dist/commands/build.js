"use strict";
/**
 * Lumora Build Command
 * Builds production Flutter app
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCommand = buildCommand;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Simple spinner replacement
const spinner = {
    text: '',
    start(text) {
        this.text = text;
        console.log(chalk_1.default.gray(`⏳ ${text}`));
        return this;
    },
    succeed(text) {
        console.log(chalk_1.default.green(`✓ ${text}`));
        return this;
    },
    fail(text) {
        console.log(chalk_1.default.red(`✗ ${text}`));
        return this;
    },
};
async function buildCommand(options) {
    console.log(chalk_1.default.bold.cyan('\n🏗️  Building Lumora app...\n'));
    try {
        const buildType = options.release ? 'release' : 'debug';
        if (options.platform === 'android' || options.platform === 'both') {
            spinner.start(`Building Android (${buildType})...`);
            await buildAndroid(buildType);
            spinner.succeed(chalk_1.default.green(`Android build complete`));
        }
        if (options.platform === 'ios' || options.platform === 'both') {
            spinner.start(`Building iOS (${buildType})...`);
            await buildIOS(buildType);
            spinner.succeed(chalk_1.default.green(`iOS build complete`));
        }
        console.log();
        console.log(chalk_1.default.bold.green('✓ Build completed successfully!\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Build failed'));
        console.error(chalk_1.default.red(`\nError: ${error instanceof Error ? error.message : String(error)}\n`));
        process.exit(1);
    }
}
async function buildAndroid(buildType) {
    const command = `cd mobile && flutter build apk --${buildType}`;
    await execAsync(command);
}
async function buildIOS(buildType) {
    const command = `cd mobile && flutter build ios --${buildType}`;
    await execAsync(command);
}
//# sourceMappingURL=build.js.map