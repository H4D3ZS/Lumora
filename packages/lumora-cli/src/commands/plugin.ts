/**
 * Plugin management commands
 * Search, discover, and manage Lumora plugins
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import { getPluginRegistry, PluginMetadata } from '../services/plugin-registry';
import { getDependencyManager } from '../services/dependency-manager';

export function createPluginCommand(): Command {
  const plugin = new Command('plugin')
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

async function handleSearch(query: string | undefined, options: any) {
  const spinner = ora('Searching plugins...').start();

  try {
    const registry = getPluginRegistry();
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
      console.log(chalk.yellow('\nNo plugins found.'));
      return;
    }

    console.log(chalk.bold(`\nFound ${plugins.length} plugin(s):\n`));

    const table = new Table({
      head: ['Name', 'Version', 'Type', 'Description', 'Downloads'],
      colWidths: [30, 12, 12, 50, 12],
      wordWrap: true,
    });

    for (const plugin of plugins) {
      table.push([
        chalk.cyan(plugin.name),
        plugin.version,
        getTypeColor(plugin.type),
        plugin.description.slice(0, 100),
        plugin.downloads ? plugin.downloads.toLocaleString() : 'N/A',
      ]);
    }

    console.log(table.toString());

    console.log(chalk.dim(`\nUse ${chalk.white('lumora plugin info <name>')} for more details`));
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to search plugins: ${error.message}`));
  }
}

async function handleInfo(pluginName: string) {
  const spinner = ora(`Getting info for ${pluginName}...`).start();

  try {
    const registry = getPluginRegistry();
    const plugin = await registry.getPluginInfo(pluginName);

    if (!plugin) {
      spinner.fail(chalk.red(`Plugin ${pluginName} not found`));
      return;
    }

    spinner.stop();

    console.log('\n' + chalk.bold.cyan(plugin.name));
    console.log(chalk.dim('─'.repeat(60)));
    console.log(`${chalk.bold('Version:')} ${plugin.version}`);
    console.log(`${chalk.bold('Type:')} ${getTypeColor(plugin.type)}`);
    console.log(`${chalk.bold('Description:')} ${plugin.description}`);
    console.log(`${chalk.bold('Author:')} ${plugin.author}`);
    console.log(`${chalk.bold('License:')} ${plugin.license}`);
    console.log(`${chalk.bold('Platforms:')} ${plugin.platforms.join(', ')}`);

    if (plugin.homepage) {
      console.log(`${chalk.bold('Homepage:')} ${chalk.blue(plugin.homepage)}`);
    }

    if (plugin.repository) {
      console.log(`${chalk.bold('Repository:')} ${chalk.blue(plugin.repository)}`);
    }

    if (plugin.keywords.length > 0) {
      console.log(`${chalk.bold('Keywords:')} ${plugin.keywords.join(', ')}`);
    }

    if (plugin.downloads) {
      console.log(`${chalk.bold('Downloads:')} ${plugin.downloads.toLocaleString()}`);
    }

    if (plugin.nativeModule) {
      console.log(chalk.bold('\nNative Module:'));
      console.log(`  Module: ${plugin.nativeModule.moduleName}`);
      if (plugin.nativeModule.ios) {
        console.log(`  iOS Pod: ${plugin.nativeModule.ios.podName || 'N/A'}`);
      }
      if (plugin.nativeModule.android) {
        console.log(`  Android Package: ${plugin.nativeModule.android.package || 'N/A'}`);
      }
    }

    if (plugin.dependencies && Object.keys(plugin.dependencies).length > 0) {
      console.log(chalk.bold('\nDependencies:'));
      for (const [dep, version] of Object.entries(plugin.dependencies)) {
        console.log(`  ${dep}: ${version}`);
      }
    }

    if (plugin.peerDependencies && Object.keys(plugin.peerDependencies).length > 0) {
      console.log(chalk.bold('\nPeer Dependencies:'));
      for (const [dep, version] of Object.entries(plugin.peerDependencies)) {
        console.log(`  ${dep}: ${version}`);
      }
    }

    console.log(chalk.dim('\n─'.repeat(60)));
    console.log(chalk.dim(`Install: ${chalk.white(`lumora plugin add ${pluginName}`)}`));
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to get plugin info: ${error.message}`));
  }
}

async function handleOfficial() {
  const spinner = ora('Loading official plugins...').start();

  try {
    const registry = getPluginRegistry();
    const plugins = await registry.listOfficialPlugins();

    spinner.stop();

    console.log(chalk.bold(`\nOfficial Lumora Plugins (${plugins.length}):\n`));

    const table = new Table({
      head: ['Name', 'Version', 'Type', 'Description'],
      colWidths: [30, 12, 12, 60],
      wordWrap: true,
    });

    for (const plugin of plugins) {
      table.push([
        chalk.cyan(plugin.name),
        plugin.version,
        getTypeColor(plugin.type),
        plugin.description,
      ]);
    }

    console.log(table.toString());
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to load official plugins: ${error.message}`));
  }
}

async function handleFeatured() {
  const spinner = ora('Loading featured plugins...').start();

  try {
    const registry = getPluginRegistry();
    const plugins = await registry.getFeaturedPlugins();

    spinner.stop();

    console.log(chalk.bold(`\nFeatured Plugins:\n`));

    for (const plugin of plugins) {
      console.log(chalk.bold.cyan(plugin.name) + chalk.dim(` v${plugin.version}`));
      console.log(`  ${plugin.description}`);
      console.log(chalk.dim(`  Type: ${plugin.type} | Platforms: ${plugin.platforms.join(', ')}`));
      console.log('');
    }

    console.log(chalk.dim(`Use ${chalk.white('lumora plugin info <name>')} for more details`));
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to load featured plugins: ${error.message}`));
  }
}

async function handleCheck(pluginName: string, options: any) {
  const spinner = ora(`Checking compatibility for ${pluginName}...`).start();

  try {
    const registry = getPluginRegistry();
    const compatibility = await registry.checkCompatibility(pluginName, options.version);

    spinner.stop();

    console.log(`\n${chalk.bold('Compatibility Check:')} ${pluginName}`);
    console.log(chalk.dim('─'.repeat(60)));

    if (compatibility.compatible) {
      console.log(chalk.green('✓ Plugin is compatible with your project'));
    } else {
      console.log(chalk.red('✗ Plugin has compatibility issues'));
    }

    if (compatibility.issues.length > 0) {
      console.log(chalk.bold.red('\nIssues:'));
      compatibility.issues.forEach((issue) => {
        console.log(chalk.red(`  • ${issue}`));
      });
    }

    if (compatibility.warnings.length > 0) {
      console.log(chalk.bold.yellow('\nWarnings:'));
      compatibility.warnings.forEach((warning) => {
        console.log(chalk.yellow(`  • ${warning}`));
      });
    }

    if (compatibility.compatible) {
      console.log(chalk.dim(`\n${chalk.white(`lumora plugin add ${pluginName}`)}`));
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to check compatibility: ${error.message}`));
  }
}

async function handleAdd(pluginName: string, options: any) {
  const spinner = ora(`Checking ${pluginName}...`).start();

  try {
    // First check compatibility
    const registry = getPluginRegistry();
    const compatibility = await registry.checkCompatibility(pluginName, options.version);

    if (!compatibility.compatible) {
      spinner.warn(chalk.yellow('Plugin has compatibility issues'));
      console.log(chalk.bold.red('\nIssues:'));
      compatibility.issues.forEach((issue) => {
        console.log(chalk.red(`  • ${issue}`));
      });

      const prompts = require('prompts');
      const response = await prompts({
        type: 'confirm',
        name: 'continue',
        message: 'Continue anyway?',
        initial: false,
      });

      if (!response.continue) {
        console.log(chalk.yellow('Installation cancelled'));
        return;
      }
    } else if (compatibility.warnings.length > 0) {
      spinner.warn(chalk.yellow('Plugin has warnings'));
      compatibility.warnings.forEach((warning) => {
        console.log(chalk.yellow(`  • ${warning}`));
      });
    }

    spinner.text = `Installing ${pluginName}...`;

    // Install the plugin
    const depManager = getDependencyManager();
    await depManager.installPackage(pluginName, {
      version: options.version,
      dev: options.dev,
      type: 'npm',
    });

    spinner.succeed(chalk.green(`✓ ${pluginName} installed successfully`));

    // Check if it's a native module and needs linking
    const plugin = await registry.getPluginInfo(pluginName);
    if (plugin?.nativeModule) {
      console.log(chalk.yellow('\nℹ This is a native module. You may need to:'));
      console.log(chalk.dim(`  1. Run ${chalk.white('lumora link ' + pluginName)}`));
      console.log(chalk.dim(`  2. Rebuild your app`));
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to install plugin: ${error.message}`));
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'native':
      return chalk.magenta(type);
    case 'ui':
      return chalk.blue(type);
    case 'utility':
      return chalk.green(type);
    default:
      return chalk.gray(type);
  }
}
