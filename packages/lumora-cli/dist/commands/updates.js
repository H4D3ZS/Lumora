"use strict";
/**
 * Updates command - Manage OTA updates
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdatesCommand = createUpdatesCommand;
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const prompts_1 = __importDefault(require("prompts"));
const commander_1 = require("commander");
const cli_table3_1 = __importDefault(require("cli-table3"));
function createUpdatesCommand() {
    const command = new commander_1.Command('updates');
    command
        .description('Manage OTA updates')
        .option('--server-url <url>', 'Update server URL', process.env.LUMORA_UPDATE_SERVER || 'http://localhost:3002')
        .option('--api-key <key>', 'API key for authentication', process.env.LUMORA_API_KEY);
    // List updates
    command
        .command('list')
        .description('List published updates')
        .option('-c, --channel <channel>', 'Filter by channel')
        .option('-p, --platform <platform>', 'Filter by platform')
        .option('-l, --limit <number>', 'Limit results', '20')
        .action(handleList);
    // View update details
    command
        .command('view <updateId>')
        .description('View update details')
        .action(handleView);
    // Rollback update
    command
        .command('rollback <updateId>')
        .description('Rollback an update')
        .option('--target-version <version>', 'Target version to rollback to')
        .action(handleRollback);
    // Get stats
    command
        .command('stats')
        .description('View update statistics')
        .action(handleStats);
    // Configure update server
    command
        .command('configure')
        .description('Configure update server settings')
        .action(handleConfigure);
    return command;
}
async function handleList(options, command) {
    const parentOptions = command.parent?.opts() || {};
    const serverUrl = parentOptions.serverUrl || 'http://localhost:3002';
    try {
        const spinner = (0, ora_1.default)('Fetching updates...').start();
        const params = {
            limit: options.limit || 20,
        };
        if (options.channel)
            params.channel = options.channel;
        if (options.platform)
            params.platform = options.platform;
        const response = await axios_1.default.get(`${serverUrl}/api/v1/updates`, { params });
        spinner.stop();
        const updates = response.data.updates;
        if (updates.length === 0) {
            console.log(chalk_1.default.yellow('\n⚠️  No updates found\n'));
            return;
        }
        console.log(chalk_1.default.blue.bold(`\n📦 Updates (${updates.length} of ${response.data.total})\n`));
        const table = new cli_table3_1.default({
            head: ['ID', 'Version', 'Channel', 'Platform', 'Published', 'Size'].map(h => chalk_1.default.cyan(h)),
            colWidths: [38, 15, 15, 12, 22, 12],
        });
        for (const update of updates) {
            table.push([
                update.id.slice(0, 8) + '...',
                update.version,
                getChannelBadge(update.channel),
                update.platform,
                formatDate(update.publishedAt || update.createdAt),
                formatBytes(update.size),
            ]);
        }
        console.log(table.toString());
        console.log('');
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Failed to fetch updates:'), error.message);
        process.exit(1);
    }
}
async function handleView(updateId, options, command) {
    const parentOptions = command.parent?.opts() || {};
    const serverUrl = parentOptions.serverUrl || 'http://localhost:3002';
    try {
        const spinner = (0, ora_1.default)('Fetching update details...').start();
        const response = await axios_1.default.get(`${serverUrl}/api/v1/manifests/${updateId}`);
        spinner.stop();
        const update = response.data;
        console.log(chalk_1.default.blue.bold('\n📦 Update Details\n'));
        console.log(`${chalk_1.default.cyan('ID:')}            ${update.id}`);
        console.log(`${chalk_1.default.cyan('Version:')}       ${update.version}`);
        console.log(`${chalk_1.default.cyan('Channel:')}       ${getChannelBadge(update.channel)}`);
        console.log(`${chalk_1.default.cyan('Platform:')}      ${update.platform}`);
        console.log(`${chalk_1.default.cyan('Runtime:')}       ${update.runtimeVersion}`);
        console.log(`${chalk_1.default.cyan('Size:')}          ${formatBytes(update.size)}`);
        console.log(`${chalk_1.default.cyan('Checksum:')}      ${update.checksum.slice(0, 16)}...`);
        console.log(`${chalk_1.default.cyan('Published:')}     ${formatDate(update.publishedAt || update.createdAt)}`);
        if (update.metadata) {
            console.log(chalk_1.default.blue.bold('\n📝 Metadata\n'));
            if (update.metadata.description) {
                console.log(`${chalk_1.default.cyan('Description:')}  ${update.metadata.description}`);
            }
            if (update.metadata.author) {
                console.log(`${chalk_1.default.cyan('Author:')}       ${update.metadata.author}`);
            }
            if (update.metadata.buildNumber) {
                console.log(`${chalk_1.default.cyan('Build:')}        ${update.metadata.buildNumber}`);
            }
        }
        if (update.assets && update.assets.length > 0) {
            console.log(chalk_1.default.blue.bold(`\n📁 Assets (${update.assets.length})\n`));
            const assetTable = new cli_table3_1.default({
                head: ['Key', 'Hash', 'Size'].map(h => chalk_1.default.cyan(h)),
                colWidths: [40, 20, 12],
            });
            for (const asset of update.assets.slice(0, 10)) {
                assetTable.push([
                    asset.key.slice(0, 38),
                    asset.hash.slice(0, 16) + '...',
                    formatBytes(asset.size),
                ]);
            }
            console.log(assetTable.toString());
            if (update.assets.length > 10) {
                console.log(chalk_1.default.gray(`   ... and ${update.assets.length - 10} more`));
            }
        }
        console.log('');
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Failed to fetch update:'), error.message);
        process.exit(1);
    }
}
async function handleRollback(updateId, options, command) {
    const parentOptions = command.parent?.opts() || {};
    const serverUrl = parentOptions.serverUrl || 'http://localhost:3002';
    try {
        // Confirm rollback
        const { confirmed } = await (0, prompts_1.default)({
            type: 'confirm',
            name: 'confirmed',
            message: `Rollback update ${chalk_1.default.yellow(updateId.slice(0, 8))}?`,
            initial: false,
        });
        if (!confirmed) {
            console.log(chalk_1.default.yellow('⚠️  Rollback cancelled'));
            return;
        }
        const spinner = (0, ora_1.default)('Rolling back update...').start();
        const response = await axios_1.default.post(`${serverUrl}/api/v1/updates/${updateId}/rollback`, {
            targetVersion: options.targetVersion,
        });
        spinner.succeed('Update rolled back successfully!');
        console.log(chalk_1.default.green.bold('\n✅ Rollback complete\n'));
        console.log(`   Rolled back from: ${response.data.rolledBackFrom}`);
        if (response.data.rolledBackTo) {
            console.log(`   Rolled back to: ${response.data.rolledBackTo}`);
        }
        console.log('');
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Rollback failed:'), error.message);
        process.exit(1);
    }
}
async function handleStats(options, command) {
    const parentOptions = command.parent?.opts() || {};
    const serverUrl = parentOptions.serverUrl || 'http://localhost:3002';
    try {
        const spinner = (0, ora_1.default)('Fetching statistics...').start();
        const response = await axios_1.default.get(`${serverUrl}/api/v1/stats`);
        spinner.stop();
        const stats = response.data;
        console.log(chalk_1.default.blue.bold('\n📊 Update Statistics\n'));
        console.log(`${chalk_1.default.cyan('Total Downloads:')}      ${chalk_1.default.white(stats.totalDownloads.toLocaleString())}`);
        console.log(`${chalk_1.default.cyan('Successful Updates:')}   ${chalk_1.default.green(stats.successfulUpdates.toLocaleString())}`);
        console.log(`${chalk_1.default.cyan('Failed Updates:')}       ${chalk_1.default.red(stats.failedUpdates.toLocaleString())}`);
        console.log(`${chalk_1.default.cyan('Rollbacks:')}            ${chalk_1.default.yellow(stats.rollbacks.toLocaleString())}`);
        console.log(`${chalk_1.default.cyan('Active Users:')}         ${chalk_1.default.white(stats.activeUsers.toLocaleString())}`);
        if (stats.successfulUpdates > 0) {
            const successRate = (stats.successfulUpdates / (stats.successfulUpdates + stats.failedUpdates) * 100).toFixed(1);
            console.log(`${chalk_1.default.cyan('Success Rate:')}        ${chalk_1.default.green(successRate + '%')}`);
        }
        console.log('');
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Failed to fetch statistics:'), error.message);
        process.exit(1);
    }
}
async function handleConfigure() {
    console.log(chalk_1.default.blue.bold('\n⚙️  Lumora Update Server Configuration\n'));
    const responses = await (0, prompts_1.default)([
        {
            type: 'text',
            name: 'serverUrl',
            message: 'Update server URL:',
            initial: process.env.LUMORA_UPDATE_SERVER || 'http://localhost:3002',
        },
        {
            type: 'text',
            name: 'apiKey',
            message: 'API Key (optional):',
            initial: process.env.LUMORA_API_KEY || '',
        },
    ]);
    if (!responses.serverUrl) {
        console.log(chalk_1.default.yellow('⚠️  Configuration cancelled'));
        return;
    }
    // Save to .env file or config
    console.log(chalk_1.default.green('\n✅ Configuration saved!\n'));
    console.log(chalk_1.default.cyan('Add these to your environment:\n'));
    console.log(chalk_1.default.gray(`export LUMORA_UPDATE_SERVER="${responses.serverUrl}"`));
    if (responses.apiKey) {
        console.log(chalk_1.default.gray(`export LUMORA_API_KEY="${responses.apiKey}"`));
    }
    console.log('');
}
// Helper functions
function getChannelBadge(channel) {
    const badges = {
        production: chalk_1.default.green('production'),
        staging: chalk_1.default.yellow('staging'),
        development: chalk_1.default.blue('development'),
        preview: chalk_1.default.magenta('preview'),
    };
    return badges[channel] || channel;
}
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1)
        return 'just now';
    if (diffMins < 60)
        return `${diffMins}m ago`;
    if (diffHours < 24)
        return `${diffHours}h ago`;
    if (diffDays < 7)
        return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
//# sourceMappingURL=updates.js.map