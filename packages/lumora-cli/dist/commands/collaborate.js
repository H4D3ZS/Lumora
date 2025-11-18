"use strict";
/**
 * Collaboration Commands
 * CLI commands for team collaboration
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCollaborateCommand = createCollaborateCommand;
exports.createTeamCommand = createTeamCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
const collaboration_server_1 = require("../services/collaboration-server");
const collaboration_client_1 = require("../services/collaboration-client");
const team_manager_1 = require("../services/team-manager");
const path = __importStar(require("path"));
/**
 * Create collaboration command
 */
function createCollaborateCommand() {
    const collaborateCommand = new commander_1.Command('collab')
        .description('Team collaboration features');
    // lumora collab server
    collaborateCommand
        .command('server')
        .description('Start collaboration server')
        .option('-p, --port <port>', 'Server port', '3001')
        .action(async (options) => {
        const spinner = (0, ora_1.default)('Starting collaboration server...').start();
        try {
            const server = (0, collaboration_server_1.getCollaborationServer)({
                port: parseInt(options.port),
            });
            await server.start();
            spinner.succeed(chalk_1.default.green('Collaboration server started!'));
            console.log(chalk_1.default.gray(`  Port: ${options.port}`));
            console.log(chalk_1.default.gray(`  WebSocket: ws://localhost:${options.port}`));
            console.log(chalk_1.default.gray('\n  Press Ctrl+C to stop\n'));
            // Keep process running
            process.on('SIGINT', async () => {
                console.log(chalk_1.default.yellow('\nShutting down...'));
                await server.stop();
                process.exit(0);
            });
        }
        catch (error) {
            spinner.fail(chalk_1.default.red('Failed to start server'));
            console.error(chalk_1.default.red(error.message));
            process.exit(1);
        }
    });
    // lumora collab start
    collaborateCommand
        .command('start')
        .description('Start a collaboration session')
        .option('-n, --name <name>', 'Session name')
        .action(async (options) => {
        try {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Session name:',
                    default: options.name || path.basename(process.cwd()),
                },
                {
                    type: 'input',
                    name: 'userName',
                    message: 'Your name:',
                },
            ]);
            const spinner = (0, ora_1.default)('Creating session...').start();
            const server = (0, collaboration_server_1.getCollaborationServer)();
            await server.start();
            const session = await server.createSession(answers.name, process.cwd(), {
                id: `user-${Date.now()}`,
                name: answers.userName,
                color: '#007bff',
            });
            spinner.succeed(chalk_1.default.green('Session created!'));
            console.log(chalk_1.default.bold(`\n📡 Session ID: ${chalk_1.default.cyan(session.id)}\n`));
            console.log(chalk_1.default.white('Share this ID with your team to collaborate:'));
            console.log(chalk_1.default.gray(`  lumora collab join ${session.id}\n`));
            console.log(chalk_1.default.gray('Session is active. Press Ctrl+C to end\n'));
            process.on('SIGINT', async () => {
                console.log(chalk_1.default.yellow('\nEnding session...'));
                await server.stop();
                process.exit(0);
            });
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n✗ ${error.message}\n`));
            process.exit(1);
        }
    });
    // lumora collab join
    collaborateCommand
        .command('join <session-id>')
        .description('Join a collaboration session')
        .option('-u, --user <name>', 'Your name')
        .action(async (sessionId, options) => {
        try {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'userName',
                    message: 'Your name:',
                    default: options.user,
                    when: !options.user,
                },
            ]);
            const spinner = (0, ora_1.default)('Joining session...').start();
            const userName = options.user || answers.userName;
            const client = new collaboration_client_1.CollaborationClient({
                serverUrl: 'ws://localhost:3001',
                sessionId,
                user: {
                    id: `user-${Date.now()}`,
                    name: userName,
                    color: '#28a745',
                },
            });
            await client.connect();
            spinner.succeed(chalk_1.default.green('Joined session!'));
            console.log(chalk_1.default.gray('\nListening for changes...\n'));
            // Set up event listeners
            client.on('user:joined', (user) => {
                console.log(chalk_1.default.green(`✓ ${user.name} joined`));
            });
            client.on('user:left', (userId) => {
                console.log(chalk_1.default.yellow(`✗ User left (${userId})`));
            });
            client.on('file:changed', (data) => {
                console.log(chalk_1.default.blue(`📝 ${data.file} changed by user ${data.userId}`));
            });
            client.on('chat:message', (data) => {
                console.log(chalk_1.default.cyan(`💬 ${data.userId}: ${data.message}`));
            });
            process.on('SIGINT', () => {
                console.log(chalk_1.default.yellow('\nLeaving session...'));
                client.disconnect();
                process.exit(0);
            });
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n✗ ${error.message}\n`));
            process.exit(1);
        }
    });
    // lumora collab list
    collaborateCommand
        .command('list')
        .description('List active collaboration sessions')
        .action(async () => {
        try {
            const server = (0, collaboration_server_1.getCollaborationServer)();
            const sessions = server.getAllSessions();
            if (sessions.length === 0) {
                console.log(chalk_1.default.yellow('\nNo active sessions\n'));
                return;
            }
            console.log(chalk_1.default.bold('\n📡 Active Sessions:\n'));
            sessions.forEach(session => {
                console.log(chalk_1.default.white(`  ${chalk_1.default.bold(session.name)}`));
                console.log(chalk_1.default.gray(`    ID: ${session.id}`));
                console.log(chalk_1.default.gray(`    Owner: ${session.owner.name}`));
                console.log(chalk_1.default.gray(`    Users: ${session.users.size}`));
                console.log(chalk_1.default.gray(`    Created: ${session.createdAt.toLocaleString()}`));
                console.log('');
            });
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n✗ ${error.message}\n`));
            process.exit(1);
        }
    });
    return collaborateCommand;
}
/**
 * Create team command
 */
function createTeamCommand() {
    const teamCommand = new commander_1.Command('team')
        .description('Team management');
    const teamManager = (0, team_manager_1.getTeamManager)();
    // lumora team create
    teamCommand
        .command('create <name>')
        .description('Create a new team')
        .action(async (name) => {
        try {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'ownerName',
                    message: 'Your name:',
                },
                {
                    type: 'input',
                    name: 'ownerEmail',
                    message: 'Your email:',
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'Team description (optional):',
                },
            ]);
            const spinner = (0, ora_1.default)('Creating team...').start();
            const team = await teamManager.createTeam(name, {
                id: `user-${Date.now()}`,
                name: answers.ownerName,
                email: answers.ownerEmail,
                role: 'owner',
            });
            if (answers.description) {
                team.description = answers.description;
            }
            spinner.succeed(chalk_1.default.green('Team created!'));
            console.log(chalk_1.default.bold(`\n👥 Team: ${chalk_1.default.cyan(team.name)}\n`));
            console.log(chalk_1.default.gray(`  ID: ${team.id}`));
            console.log(chalk_1.default.gray(`  Owner: ${team.owner.name}`));
            console.log('');
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n✗ ${error.message}\n`));
            process.exit(1);
        }
    });
    // lumora team list
    teamCommand
        .command('list')
        .description('List your teams')
        .action(async () => {
        const teams = teamManager.listTeams();
        if (teams.length === 0) {
            console.log(chalk_1.default.yellow('\nNo teams found\n'));
            return;
        }
        console.log(chalk_1.default.bold('\n👥 Your Teams:\n'));
        teams.forEach(team => {
            console.log(chalk_1.default.white(`  ${chalk_1.default.bold(team.name)}`));
            console.log(chalk_1.default.gray(`    ID: ${team.id}`));
            console.log(chalk_1.default.gray(`    Owner: ${team.owner.name}`));
            console.log(chalk_1.default.gray(`    Members: ${team.members.length}`));
            console.log(chalk_1.default.gray(`    Projects: ${team.projects.length}`));
            console.log('');
        });
    });
    // lumora team invite
    teamCommand
        .command('invite <team-id>')
        .description('Create an invite link')
        .option('-r, --role <role>', 'Member role (admin, member, viewer)', 'member')
        .option('-d, --days <days>', 'Expiration days', '7')
        .action(async (teamId, options) => {
        try {
            const team = teamManager.getTeam(teamId);
            if (!team) {
                console.error(chalk_1.default.red('\n✗ Team not found\n'));
                process.exit(1);
            }
            const spinner = (0, ora_1.default)('Creating invite...').start();
            const invite = await teamManager.createInvite(teamId, options.role, team.owner.id, parseInt(options.days));
            spinner.succeed(chalk_1.default.green('Invite created!'));
            console.log(chalk_1.default.bold(`\n🔗 Invite Token:\n`));
            console.log(chalk_1.default.cyan(`  ${invite.token}\n`));
            console.log(chalk_1.default.white('Share this command with your teammate:'));
            console.log(chalk_1.default.gray(`  lumora team join ${invite.token}\n`));
            console.log(chalk_1.default.gray(`  Expires: ${invite.expiresAt.toLocaleString()}`));
            console.log('');
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n✗ ${error.message}\n`));
            process.exit(1);
        }
    });
    // lumora team join
    teamCommand
        .command('join <token>')
        .description('Join a team with an invite token')
        .action(async (token) => {
        try {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Your name:',
                },
                {
                    type: 'input',
                    name: 'email',
                    message: 'Your email:',
                },
            ]);
            const spinner = (0, ora_1.default)('Joining team...').start();
            const team = await teamManager.acceptInvite(token, {
                id: `user-${Date.now()}`,
                name: answers.name,
                email: answers.email,
            });
            spinner.succeed(chalk_1.default.green('Joined team!'));
            console.log(chalk_1.default.bold(`\n👥 Welcome to ${chalk_1.default.cyan(team.name)}!\n`));
            console.log(chalk_1.default.gray(`  Owner: ${team.owner.name}`));
            console.log(chalk_1.default.gray(`  Members: ${team.members.length}`));
            console.log('');
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n✗ ${error.message}\n`));
            process.exit(1);
        }
    });
    // lumora team members
    teamCommand
        .command('members <team-id>')
        .description('List team members')
        .action(async (teamId) => {
        const team = teamManager.getTeam(teamId);
        if (!team) {
            console.error(chalk_1.default.red('\n✗ Team not found\n'));
            process.exit(1);
        }
        console.log(chalk_1.default.bold(`\n👥 Members of ${team.name}:\n`));
        team.members.forEach(member => {
            console.log(chalk_1.default.white(`  ${chalk_1.default.bold(member.name)}`));
            console.log(chalk_1.default.gray(`    Email: ${member.email}`));
            console.log(chalk_1.default.gray(`    Role: ${member.role}`));
            console.log(chalk_1.default.gray(`    Joined: ${member.joinedAt.toLocaleDateString()}`));
            console.log('');
        });
    });
    return teamCommand;
}
//# sourceMappingURL=collaborate.js.map