"use strict";
/**
 * Plugin management commands
 * Search, discover, and manage Lumora plugins
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPluginCommand = createPluginCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const ora_1 = __importDefault(require("ora"));
const plugin_registry_1 = require("../services/plugin-registry");
const dependency_manager_1 = require("../services/dependency-manager");
function createPluginCommand() {
    const plugin = new commander_1.Command('plugin')
        .description('Manage Lumora plugins');
    // Search plugins
    plugin
        .command('search')
        .description('Search for plugins in the registry')
        .argument('[query]', 'Search query')
        .option('-t, --type <type>', 'Plugin type (native, js, ui, utility)')
        .option('-p, --platform <platform>', 'Platform (ios, android, web)')
        .option('--official', 'Only show official plugins')
        .option('-s, --sort <sort>', 'Sort by (downloads, stars, recent, relevance)', 'downloads')
        .option('-l, --limit <limit>', 'Number of results', '20')
        .action(handleSearch);
    // Plugin info
    plugin
        .command('info')
        .description('Get detailed information about a plugin')
        .argument('<plugin>', 'Plugin name')
        .action(handleInfo);
    // List official plugins
    plugin
        .command('official')
        .description('List official Lumora plugins')
        .action(handleOfficial);
    // Featured plugins
    plugin
        .command('featured')
        .description('List featured/recommended plugins')
        .action(handleFeatured);
    // Check compatibility
    plugin
        .command('check')
        .description('Check plugin compatibility with current project')
        .argument('<plugin>', 'Plugin name')
        .option('-v, --version <version>', 'Plugin version')
        .action(handleCheck);
    // Install plugin (wrapper around install command)
    plugin
        .command('add')
        .description('Install a plugin')
        .argument('<plugin>', 'Plugin name')
        .option('-v, --version <version>', 'Plugin version')
        .option('--dev', 'Install as dev dependency')
        .action(handleAdd);
    return plugin;
}
async function handleSearch(query, options) {
    const spinner = (0, ora_1.default)('Searching plugins...').start();
    try {
        const registry = (0, plugin_registry_1.getPluginRegistry)();
        const plugins = await registry.searchPlugins({
            query,
            type: options.type,
            platform: options.platform,
            official: options.official,
            sortBy: options.sort,
            limit: parseInt(options.limit),
        });
        spinner.stop();
        if (plugins.length === 0) {
            console.log(chalk_1.default.yellow('\nNo plugins found.'));
            return;
        }
        console.log(chalk_1.default.bold(`\nFound ${plugins.length} plugin(s):\n`));
        const table = new cli_table3_1.default({
            head: ['Name', 'Version', 'Type', 'Description', 'Downloads'],
            colWidths: [30, 12, 12, 50, 12],
            wordWrap: true,
        });
        for (const plugin of plugins) {
            table.push([
                chalk_1.default.cyan(plugin.name),
                plugin.version,
                getTypeColor(plugin.type),
                plugin.description.slice(0, 100),
                plugin.downloads ? plugin.downloads.toLocaleString() : 'N/A',
            ]);
        }
        console.log(table.toString());
        console.log(chalk_1.default.dim(`\nUse ${chalk_1.default.white('lumora plugin info <name>')} for more details`));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to search plugins: ${error.message}`));
    }
}
async function handleInfo(pluginName) {
    const spinner = (0, ora_1.default)(`Getting info for ${pluginName}...`).start();
    try {
        const registry = (0, plugin_registry_1.getPluginRegistry)();
        const plugin = await registry.getPluginInfo(pluginName);
        if (!plugin) {
            spinner.fail(chalk_1.default.red(`Plugin ${pluginName} not found`));
            return;
        }
        spinner.stop();
        console.log('\n' + chalk_1.default.bold.cyan(plugin.name));
        console.log(chalk_1.default.dim('─'.repeat(60)));
        console.log(`${chalk_1.default.bold('Version:')} ${plugin.version}`);
        console.log(`${chalk_1.default.bold('Type:')} ${getTypeColor(plugin.type)}`);
        console.log(`${chalk_1.default.bold('Description:')} ${plugin.description}`);
        console.log(`${chalk_1.default.bold('Author:')} ${plugin.author}`);
        console.log(`${chalk_1.default.bold('License:')} ${plugin.license}`);
        console.log(`${chalk_1.default.bold('Platforms:')} ${plugin.platforms.join(', ')}`);
        if (plugin.homepage) {
            console.log(`${chalk_1.default.bold('Homepage:')} ${chalk_1.default.blue(plugin.homepage)}`);
        }
        if (plugin.repository) {
            console.log(`${chalk_1.default.bold('Repository:')} ${chalk_1.default.blue(plugin.repository)}`);
        }
        if (plugin.keywords.length > 0) {
            console.log(`${chalk_1.default.bold('Keywords:')} ${plugin.keywords.join(', ')}`);
        }
        if (plugin.downloads) {
            console.log(`${chalk_1.default.bold('Downloads:')} ${plugin.downloads.toLocaleString()}`);
        }
        if (plugin.nativeModule) {
            console.log(chalk_1.default.bold('\nNative Module:'));
            console.log(`  Module: ${plugin.nativeModule.moduleName}`);
            if (plugin.nativeModule.ios) {
                console.log(`  iOS Pod: ${plugin.nativeModule.ios.podName || 'N/A'}`);
            }
            if (plugin.nativeModule.android) {
                console.log(`  Android Package: ${plugin.nativeModule.android.package || 'N/A'}`);
            }
        }
        if (plugin.dependencies && Object.keys(plugin.dependencies).length > 0) {
            console.log(chalk_1.default.bold('\nDependencies:'));
            for (const [dep, version] of Object.entries(plugin.dependencies)) {
                console.log(`  ${dep}: ${version}`);
            }
        }
        if (plugin.peerDependencies && Object.keys(plugin.peerDependencies).length > 0) {
            console.log(chalk_1.default.bold('\nPeer Dependencies:'));
            for (const [dep, version] of Object.entries(plugin.peerDependencies)) {
                console.log(`  ${dep}: ${version}`);
            }
        }
        console.log(chalk_1.default.dim('\n─'.repeat(60)));
        console.log(chalk_1.default.dim(`Install: ${chalk_1.default.white(`lumora plugin add ${pluginName}`)}`));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to get plugin info: ${error.message}`));
    }
}
async function handleOfficial() {
    const spinner = (0, ora_1.default)('Loading official plugins...').start();
    try {
        const registry = (0, plugin_registry_1.getPluginRegistry)();
        const plugins = await registry.listOfficialPlugins();
        spinner.stop();
        console.log(chalk_1.default.bold(`\nOfficial Lumora Plugins (${plugins.length}):\n`));
        const table = new cli_table3_1.default({
            head: ['Name', 'Version', 'Type', 'Description'],
            colWidths: [30, 12, 12, 60],
            wordWrap: true,
        });
        for (const plugin of plugins) {
            table.push([
                chalk_1.default.cyan(plugin.name),
                plugin.version,
                getTypeColor(plugin.type),
                plugin.description,
            ]);
        }
        console.log(table.toString());
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to load official plugins: ${error.message}`));
    }
}
async function handleFeatured() {
    const spinner = (0, ora_1.default)('Loading featured plugins...').start();
    try {
        const registry = (0, plugin_registry_1.getPluginRegistry)();
        const plugins = await registry.getFeaturedPlugins();
        spinner.stop();
        console.log(chalk_1.default.bold(`\nFeatured Plugins:\n`));
        for (const plugin of plugins) {
            console.log(chalk_1.default.bold.cyan(plugin.name) + chalk_1.default.dim(` v${plugin.version}`));
            console.log(`  ${plugin.description}`);
            console.log(chalk_1.default.dim(`  Type: ${plugin.type} | Platforms: ${plugin.platforms.join(', ')}`));
            console.log('');
        }
        console.log(chalk_1.default.dim(`Use ${chalk_1.default.white('lumora plugin info <name>')} for more details`));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to load featured plugins: ${error.message}`));
    }
}
async function handleCheck(pluginName, options) {
    const spinner = (0, ora_1.default)(`Checking compatibility for ${pluginName}...`).start();
    try {
        const registry = (0, plugin_registry_1.getPluginRegistry)();
        const compatibility = await registry.checkCompatibility(pluginName, options.version);
        spinner.stop();
        console.log(`\n${chalk_1.default.bold('Compatibility Check:')} ${pluginName}`);
        console.log(chalk_1.default.dim('─'.repeat(60)));
        if (compatibility.compatible) {
            console.log(chalk_1.default.green('✓ Plugin is compatible with your project'));
        }
        else {
            console.log(chalk_1.default.red('✗ Plugin has compatibility issues'));
        }
        if (compatibility.issues.length > 0) {
            console.log(chalk_1.default.bold.red('\nIssues:'));
            compatibility.issues.forEach((issue) => {
                console.log(chalk_1.default.red(`  • ${issue}`));
            });
        }
        if (compatibility.warnings.length > 0) {
            console.log(chalk_1.default.bold.yellow('\nWarnings:'));
            compatibility.warnings.forEach((warning) => {
                console.log(chalk_1.default.yellow(`  • ${warning}`));
            });
        }
        if (compatibility.compatible) {
            console.log(chalk_1.default.dim(`\n${chalk_1.default.white(`lumora plugin add ${pluginName}`)}`));
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to check compatibility: ${error.message}`));
    }
}
async function handleAdd(pluginName, options) {
    const spinner = (0, ora_1.default)(`Checking ${pluginName}...`).start();
    try {
        // First check compatibility
        const registry = (0, plugin_registry_1.getPluginRegistry)();
        const compatibility = await registry.checkCompatibility(pluginName, options.version);
        if (!compatibility.compatible) {
            spinner.warn(chalk_1.default.yellow('Plugin has compatibility issues'));
            console.log(chalk_1.default.bold.red('\nIssues:'));
            compatibility.issues.forEach((issue) => {
                console.log(chalk_1.default.red(`  • ${issue}`));
            });
            const prompts = require('prompts');
            const response = await prompts({
                type: 'confirm',
                name: 'continue',
                message: 'Continue anyway?',
                initial: false,
            });
            if (!response.continue) {
                console.log(chalk_1.default.yellow('Installation cancelled'));
                return;
            }
        }
        else if (compatibility.warnings.length > 0) {
            spinner.warn(chalk_1.default.yellow('Plugin has warnings'));
            compatibility.warnings.forEach((warning) => {
                console.log(chalk_1.default.yellow(`  • ${warning}`));
            });
        }
        spinner.text = `Installing ${pluginName}...`;
        // Install the plugin
        const depManager = (0, dependency_manager_1.getDependencyManager)();
        await depManager.installPackage(pluginName, {
            version: options.version,
            dev: options.dev,
            type: 'npm',
        });
        spinner.succeed(chalk_1.default.green(`✓ ${pluginName} installed successfully`));
        // Check if it's a native module and needs linking
        const plugin = await registry.getPluginInfo(pluginName);
        if (plugin?.nativeModule) {
            console.log(chalk_1.default.yellow('\nℹ This is a native module. You may need to:'));
            console.log(chalk_1.default.dim(`  1. Run ${chalk_1.default.white('lumora link ' + pluginName)}`));
            console.log(chalk_1.default.dim(`  2. Rebuild your app`));
        }
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`Failed to install plugin: ${error.message}`));
    }
}
function getTypeColor(type) {
    switch (type) {
        case 'native':
            return chalk_1.default.magenta(type);
        case 'ui':
            return chalk_1.default.blue(type);
        case 'utility':
            return chalk_1.default.green(type);
        default:
            return chalk_1.default.gray(type);
    }
}
//# sourceMappingURL=plugin.js.map