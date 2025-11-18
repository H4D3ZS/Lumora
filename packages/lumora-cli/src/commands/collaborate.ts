/**
 * Collaboration Commands
 * CLI commands for team collaboration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getCollaborationServer } from '../services/collaboration-server';
import { CollaborationClient } from '../services/collaboration-client';
import { getTeamManager, TeamMember } from '../services/team-manager';
import * as path from 'path';

/**
 * Create collaboration command
 */
export function createCollaborateCommand(): Command {
  const collaborateCommand = new Command('collab')
    .description('Team collaboration features');

  // lumora collab server
  collaborateCommand
    .command('server')
    .description('Start collaboration server')
    .option('-p, --port <port>', 'Server port', '3001')
    .action(async (options) => {
      const spinner = ora('Starting collaboration server...').start();

      try {
        const server = getCollaborationServer({
          port: parseInt(options.port),
        });

        await server.start();

        spinner.succeed(chalk.green('Collaboration server started!'));
        console.log(chalk.gray(`  Port: ${options.port}`));
        console.log(chalk.gray(`  WebSocket: ws://localhost:${options.port}`));
        console.log(chalk.gray('\n  Press Ctrl+C to stop\n'));

        // Keep process running
        process.on('SIGINT', async () => {
          console.log(chalk.yellow('\nShutting down...'));
          await server.stop();
          process.exit(0);
        });

      } catch (error: any) {
        spinner.fail(chalk.red('Failed to start server'));
        console.error(chalk.red(error.message));
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
        const answers = await inquirer.prompt([
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

        const spinner = ora('Creating session...').start();

        const server = getCollaborationServer();
        await server.start();

        const session = await server.createSession(
          answers.name,
          process.cwd(),
          {
            id: `user-${Date.now()}`,
            name: answers.userName,
            color: '#007bff',
          }
        );

        spinner.succeed(chalk.green('Session created!'));
        console.log(chalk.bold(`\n📡 Session ID: ${chalk.cyan(session.id)}\n`));
        console.log(chalk.white('Share this ID with your team to collaborate:'));
        console.log(chalk.gray(`  lumora collab join ${session.id}\n`));

        console.log(chalk.gray('Session is active. Press Ctrl+C to end\n'));

        process.on('SIGINT', async () => {
          console.log(chalk.yellow('\nEnding session...'));
          await server.stop();
          process.exit(0);
        });

      } catch (error: any) {
        console.error(chalk.red(`\n✗ ${error.message}\n`));
        process.exit(1);
      }
    });

  // lumora collab join
  collaborateCommand
    .command('join <session-id>')
    .description('Join a collaboration session')
    .option('-u, --user <name>', 'Your name')
    .action(async (sessionId: string, options) => {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'userName',
            message: 'Your name:',
            default: options.user,
            when: !options.user,
          },
        ]);

        const spinner = ora('Joining session...').start();

        const userName = options.user || answers.userName;
        const client = new CollaborationClient({
          serverUrl: 'ws://localhost:3001',
          sessionId,
          user: {
            id: `user-${Date.now()}`,
            name: userName,
            color: '#28a745',
          },
        });

        await client.connect();

        spinner.succeed(chalk.green('Joined session!'));
        console.log(chalk.gray('\nListening for changes...\n'));

        // Set up event listeners
        client.on('user:joined', (user) => {
          console.log(chalk.green(`✓ ${user.name} joined`));
        });

        client.on('user:left', (userId) => {
          console.log(chalk.yellow(`✗ User left (${userId})`));
        });

        client.on('file:changed', (data) => {
          console.log(chalk.blue(`📝 ${data.file} changed by user ${data.userId}`));
        });

        client.on('chat:message', (data) => {
          console.log(chalk.cyan(`💬 ${data.userId}: ${data.message}`));
        });

        process.on('SIGINT', () => {
          console.log(chalk.yellow('\nLeaving session...'));
          client.disconnect();
          process.exit(0);
        });

      } catch (error: any) {
        console.error(chalk.red(`\n✗ ${error.message}\n`));
        process.exit(1);
      }
    });

  // lumora collab list
  collaborateCommand
    .command('list')
    .description('List active collaboration sessions')
    .action(async () => {
      try {
        const server = getCollaborationServer();
        const sessions = server.getAllSessions();

        if (sessions.length === 0) {
          console.log(chalk.yellow('\nNo active sessions\n'));
          return;
        }

        console.log(chalk.bold('\n📡 Active Sessions:\n'));

        sessions.forEach(session => {
          console.log(chalk.white(`  ${chalk.bold(session.name)}`));
          console.log(chalk.gray(`    ID: ${session.id}`));
          console.log(chalk.gray(`    Owner: ${session.owner.name}`));
          console.log(chalk.gray(`    Users: ${session.users.size}`));
          console.log(chalk.gray(`    Created: ${session.createdAt.toLocaleString()}`));
          console.log('');
        });

      } catch (error: any) {
        console.error(chalk.red(`\n✗ ${error.message}\n`));
        process.exit(1);
      }
    });

  return collaborateCommand;
}

/**
 * Create team command
 */
export function createTeamCommand(): Command {
  const teamCommand = new Command('team')
    .description('Team management');

  const teamManager = getTeamManager();

  // lumora team create
  teamCommand
    .command('create <name>')
    .description('Create a new team')
    .action(async (name: string) => {
      try {
        const answers = await inquirer.prompt([
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

        const spinner = ora('Creating team...').start();

        const team = await teamManager.createTeam(name, {
          id: `user-${Date.now()}`,
          name: answers.ownerName,
          email: answers.ownerEmail,
          role: 'owner',
        });

        if (answers.description) {
          team.description = answers.description;
        }

        spinner.succeed(chalk.green('Team created!'));
        console.log(chalk.bold(`\n👥 Team: ${chalk.cyan(team.name)}\n`));
        console.log(chalk.gray(`  ID: ${team.id}`));
        console.log(chalk.gray(`  Owner: ${team.owner.name}`));
        console.log('');

      } catch (error: any) {
        console.error(chalk.red(`\n✗ ${error.message}\n`));
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
        console.log(chalk.yellow('\nNo teams found\n'));
        return;
      }

      console.log(chalk.bold('\n👥 Your Teams:\n'));

      teams.forEach(team => {
        console.log(chalk.white(`  ${chalk.bold(team.name)}`));
        console.log(chalk.gray(`    ID: ${team.id}`));
        console.log(chalk.gray(`    Owner: ${team.owner.name}`));
        console.log(chalk.gray(`    Members: ${team.members.length}`));
        console.log(chalk.gray(`    Projects: ${team.projects.length}`));
        console.log('');
      });
    });

  // lumora team invite
  teamCommand
    .command('invite <team-id>')
    .description('Create an invite link')
    .option('-r, --role <role>', 'Member role (admin, member, viewer)', 'member')
    .option('-d, --days <days>', 'Expiration days', '7')
    .action(async (teamId: string, options) => {
      try {
        const team = teamManager.getTeam(teamId);
        if (!team) {
          console.error(chalk.red('\n✗ Team not found\n'));
          process.exit(1);
        }

        const spinner = ora('Creating invite...').start();

        const invite = await teamManager.createInvite(
          teamId,
          options.role as TeamMember['role'],
          team.owner.id,
          parseInt(options.days)
        );

        spinner.succeed(chalk.green('Invite created!'));
        console.log(chalk.bold(`\n🔗 Invite Token:\n`));
        console.log(chalk.cyan(`  ${invite.token}\n`));
        console.log(chalk.white('Share this command with your teammate:'));
        console.log(chalk.gray(`  lumora team join ${invite.token}\n`));
        console.log(chalk.gray(`  Expires: ${invite.expiresAt.toLocaleString()}`));
        console.log('');

      } catch (error: any) {
        console.error(chalk.red(`\n✗ ${error.message}\n`));
        process.exit(1);
      }
    });

  // lumora team join
  teamCommand
    .command('join <token>')
    .description('Join a team with an invite token')
    .action(async (token: string) => {
      try {
        const answers = await inquirer.prompt([
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

        const spinner = ora('Joining team...').start();

        const team = await teamManager.acceptInvite(token, {
          id: `user-${Date.now()}`,
          name: answers.name,
          email: answers.email,
        });

        spinner.succeed(chalk.green('Joined team!'));
        console.log(chalk.bold(`\n👥 Welcome to ${chalk.cyan(team.name)}!\n`));
        console.log(chalk.gray(`  Owner: ${team.owner.name}`));
        console.log(chalk.gray(`  Members: ${team.members.length}`));
        console.log('');

      } catch (error: any) {
        console.error(chalk.red(`\n✗ ${error.message}\n`));
        process.exit(1);
      }
    });

  // lumora team members
  teamCommand
    .command('members <team-id>')
    .description('List team members')
    .action(async (teamId: string) => {
      const team = teamManager.getTeam(teamId);
      if (!team) {
        console.error(chalk.red('\n✗ Team not found\n'));
        process.exit(1);
      }

      console.log(chalk.bold(`\n👥 Members of ${team.name}:\n`));

      team.members.forEach(member => {
        console.log(chalk.white(`  ${chalk.bold(member.name)}`));
        console.log(chalk.gray(`    Email: ${member.email}`));
        console.log(chalk.gray(`    Role: ${member.role}`));
        console.log(chalk.gray(`    Joined: ${member.joinedAt.toLocaleDateString()}`));
        console.log('');
      });
    });

  return teamCommand;
}
