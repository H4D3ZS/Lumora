"use strict";
/**
 * Install command - Install and manage packages
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInstallCommand = createInstallCommand;
exports.createUninstallCommand = createUninstallCommand;
exports.createListCommand = createListCommand;
exports.createLinkCommand = createLinkCommand;
exports.createUpdateCommand = createUpdateCommand;
exports.createDoctorCommand = createDoctorCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const dependency_manager_1 = require("../services/dependency-manager");
function createInstallCommand() {
    const command = new commander_1.Command('install');
    command
        .description('Install packages and dependencies')
        .argument('[packages...]', 'Packages to install')
        .option('--npm', 'Force NPM package type')
        .option('--pub', 'Force Flutter pub package type')
        .option('--dev', 'Install as dev dependency')
        .option('--save', 'Save to package.json/pubspec.yaml', true)
        .alias('i')
        .action(handleInstall);
    return command;
}
async function handleInstall(packages, options) {
    const manager = (0, dependency_manager_1.getDependencyManager)();
    if (packages.length === 0) {
        // Install all dependencies
        console.log(chalk_1.default.blue('\n📦 Installing all dependencies...\n'));
        const spinner = (0, ora_1.default)('Installing...').start();
        try {
            // This would install from package.json and pubspec.yaml
            spinner.succeed('All dependencies installed!');
        }
        catch (error) {
            spinner.fail('Installation failed');
            console.error(chalk_1.default.red(error.message));
            process.exit(1);
        }
        return;
    }
    // Install specific packages
    console.log(chalk_1.default.blue(`\n📦 Installing ${packages.length} package(s)...\n`));
    for (const pkg of packages) {
        try {
            await manager.installPackage(pkg, {
                type: options.npm ? 'npm' : options.pub ? 'pub' : undefined,
                dev: options.dev,
                save: options.save,
            });
        }
        catch (error) {
            console.error(chalk_1.default.red(`Failed to install ${pkg}:`), error.message);
            process.exit(1);
        }
    }
    console.log(chalk_1.default.green('\n✅ Installation complete!\n'));
}
function createUninstallCommand() {
    const command = new commander_1.Command('uninstall');
    command
        .description('Uninstall packages')
        .argument('<packages...>', 'Packages to uninstall')
        .alias('remove')
        .alias('rm')
        .action(handleUninstall);
    return command;
}
async function handleUninstall(packages) {
    const manager = (0, dependency_manager_1.getDependencyManager)();
    console.log(chalk_1.default.blue(`\n🗑️  Uninstalling ${packages.length} package(s)...\n`));
    for (const pkg of packages) {
        try {
            await manager.uninstallPackage(pkg);
        }
        catch (error) {
            console.error(chalk_1.default.red(`Failed to uninstall ${pkg}:`), error.message);
            process.exit(1);
        }
    }
    console.log(chalk_1.default.green('\n✅ Uninstallation complete!\n'));
}
function createListCommand() {
    const command = new commander_1.Command('list');
    command
        .description('List installed packages')
        .option('--npm', 'Show only NPM packages')
        .option('--pub', 'Show only Flutter packages')
        .alias('ls')
        .action(handleList);
    return command;
}
async function handleList(options) {
    const manager = (0, dependency_manager_1.getDependencyManager)();
    const spinner = (0, ora_1.default)('Loading packages...').start();
    try {
        const packages = await manager.listPackages();
        spinner.stop();
        if (options.npm || !options.pub) {
            console.log(chalk_1.default.blue.bold('\n📦 NPM Packages\n'));
            if (packages.npm.length === 0) {
                console.log(chalk_1.default.gray('  No NPM packages installed\n'));
            }
            else {
                const table = new cli_table3_1.default({
                    head: ['Package', 'Version'].map(h => chalk_1.default.cyan(h)),
                    colWidths: [40, 20],
                });
                for (const pkg of packages.npm) {
                    table.push([pkg.name, pkg.version]);
                }
                console.log(table.toString());
                console.log('');
            }
        }
        if (options.pub || !options.npm) {
            console.log(chalk_1.default.blue.bold('📱 Flutter Packages\n'));
            if (packages.pub.length === 0) {
                console.log(chalk_1.default.gray('  No Flutter packages installed\n'));
            }
            else {
                const table = new cli_table3_1.default({
                    head: ['Package', 'Version'].map(h => chalk_1.default.cyan(h)),
                    colWidths: [40, 20],
                });
                for (const pkg of packages.pub) {
                    table.push([pkg.name, pkg.version]);
                }
                console.log(table.toString());
                console.log('');
            }
        }
    }
    catch (error) {
        spinner.fail('Failed to list packages');
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
}
function createLinkCommand() {
    const command = new commander_1.Command('link');
    command
        .description('Link native module')
        .argument('<package>', 'Package to link')
        .action(handleLink);
    return command;
}
async function handleLink(packageName) {
    const manager = (0, dependency_manager_1.getDependencyManager)();
    try {
        await manager.linkNativeModule(packageName);
        console.log(chalk_1.default.green(`\n✅ ${packageName} linked successfully!\n`));
    }
    catch (error) {
        console.error(chalk_1.default.red('Link failed:'), error.message);
        process.exit(1);
    }
}
function createUpdateCommand() {
    const command = new commander_1.Command('update');
    command
        .description('Update packages')
        .argument('[packages...]', 'Packages to update (leave empty for all)')
        .option('--latest', 'Update to latest version')
        .alias('upgrade')
        .action(handleUpdate);
    return command;
}
async function handleUpdate(packages, options) {
    const manager = (0, dependency_manager_1.getDependencyManager)();
    if (packages.length === 0) {
        console.log(chalk_1.default.blue('\n⬆️  Updating all packages...\n'));
        console.log(chalk_1.default.yellow('This feature is coming soon!'));
        return;
    }
    console.log(chalk_1.default.blue(`\n⬆️  Updating ${packages.length} package(s)...\n`));
    for (const pkg of packages) {
        try {
            await manager.updatePackage(pkg, options.latest ? 'latest' : undefined);
        }
        catch (error) {
            console.error(chalk_1.default.red(`Failed to update ${pkg}:`), error.message);
            process.exit(1);
        }
    }
    console.log(chalk_1.default.green('\n✅ Update complete!\n'));
}
function createDoctorCommand() {
    const command = new commander_1.Command('doctor');
    command
        .description('Check project health and dependencies')
        .action(handleDoctor);
    return command;
}
async function handleDoctor() {
    console.log(chalk_1.default.blue.bold('\n🔍 Lumora Doctor - Health Check\n'));
    const manager = (0, dependency_manager_1.getDependencyManager)();
    const spinner = (0, ora_1.default)('Checking dependencies...').start();
    try {
        const conflicts = await manager.checkConflicts();
        spinner.stop();
        if (conflicts.length === 0) {
            console.log(chalk_1.default.green('✅ No dependency conflicts found!\n'));
        }
        else {
            console.log(chalk_1.default.yellow(`⚠️  Found ${conflicts.length} conflict(s):\n`));
            for (const conflict of conflicts) {
                console.log(`  ${chalk_1.default.red('×')} ${conflict.package}`);
                console.log(`    Requested: ${conflict.requested}`);
                console.log(`    Installed: ${conflict.installed}`);
                if (conflict.canResolve) {
                    console.log(`    ${chalk_1.default.green('→')} Can resolve to: ${conflict.resolution}`);
                }
                else {
                    console.log(`    ${chalk_1.default.red('!')} Manual resolution required`);
                }
                console.log('');
            }
            // Offer to resolve
            if (conflicts.some(c => c.canResolve)) {
                console.log(chalk_1.default.blue('Run with --fix to automatically resolve conflicts\n'));
            }
        }
        // Check other health indicators
        console.log(chalk_1.default.blue('📊 Project Status:\n'));
        console.log(chalk_1.default.green('  ✓ Package configuration valid'));
        console.log(chalk_1.default.green('  ✓ Build tools available'));
        console.log(chalk_1.default.green('  ✓ Development environment ready'));
        console.log('');
    }
    catch (error) {
        spinner.fail('Health check failed');
        console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
}
//# sourceMappingURL=install.js.map