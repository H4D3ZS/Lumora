/**
 * Team Manager
 * Manage teams, members, and permissions
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner: TeamMember;
  members: TeamMember[];
  projects: TeamProject[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  permissions: Permission[];
}

export type Permission =
  | 'project:create'
  | 'project:delete'
  | 'project:edit'
  | 'member:invite'
  | 'member:remove'
  | 'session:create'
  | 'session:join'
  | 'build:trigger'
  | 'ota:publish';

export interface TeamProject {
  id: string;
  name: string;
  path: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

export interface InviteToken {
  token: string;
  teamId: string;
  role: TeamMember['role'];
  expiresAt: Date;
  createdBy: string;
}

/**
 * Team Manager
 */
export class TeamManager {
  private configPath: string;
  private teams: Map<string, Team> = new Map();
  private invites: Map<string, InviteToken> = new Map();

  constructor() {
    this.configPath = path.join(os.homedir(), '.lumora', 'teams.json');
    this.loadTeams();
  }

  /**
   * Create a new team
   */
  async createTeam(name: string, owner: Omit<TeamMember, 'joinedAt' | 'permissions'>): Promise<Team> {
    const teamId = this.generateId();

    const team: Team = {
      id: teamId,
      name,
      owner: {
        ...owner,
        joinedAt: new Date(),
        permissions: this.getAllPermissions(),
      },
      members: [
        {
          ...owner,
          joinedAt: new Date(),
          permissions: this.getAllPermissions(),
        },
      ],
      projects: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.teams.set(teamId, team);
    await this.saveTeams();

    return team;
  }

  /**
   * Get team by ID
   */
  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId);
  }

  /**
   * List all teams
   */
  listTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  /**
   * Add member to team
   */
  async addMember(
    teamId: string,
    member: Omit<TeamMember, 'joinedAt' | 'permissions'>,
    permissions?: Permission[]
  ): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Check if member already exists
    if (team.members.some(m => m.email === member.email)) {
      throw new Error('Member already in team');
    }

    const defaultPermissions = this.getDefaultPermissions(member.role);

    team.members.push({
      ...member,
      joinedAt: new Date(),
      permissions: permissions || defaultPermissions,
    });

    team.updatedAt = new Date();
    await this.saveTeams();
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, memberId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Cannot remove owner
    if (team.owner.id === memberId) {
      throw new Error('Cannot remove team owner');
    }

    team.members = team.members.filter(m => m.id !== memberId);
    team.updatedAt = new Date();
    await this.saveTeams();
  }

  /**
   * Update member role
   */
  async updateMemberRole(teamId: string, memberId: string, role: TeamMember['role']): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const member = team.members.find(m => m.id === memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    member.role = role;
    member.permissions = this.getDefaultPermissions(role);
    team.updatedAt = new Date();
    await this.saveTeams();
  }

  /**
   * Add project to team
   */
  async addProject(teamId: string, project: Omit<TeamProject, 'id' | 'createdAt' | 'lastModified'>): Promise<TeamProject> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const teamProject: TeamProject = {
      id: this.generateId(),
      ...project,
      createdAt: new Date(),
      lastModified: new Date(),
    };

    team.projects.push(teamProject);
    team.updatedAt = new Date();
    await this.saveTeams();

    return teamProject;
  }

  /**
   * Remove project from team
   */
  async removeProject(teamId: string, projectId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    team.projects = team.projects.filter(p => p.id !== projectId);
    team.updatedAt = new Date();
    await this.saveTeams();
  }

  /**
   * Create invite token
   */
  async createInvite(teamId: string, role: TeamMember['role'], createdBy: string, expiresInDays: number = 7): Promise<InviteToken> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite: InviteToken = {
      token,
      teamId,
      role,
      expiresAt,
      createdBy,
    };

    this.invites.set(token, invite);
    await this.saveTeams();

    return invite;
  }

  /**
   * Accept invite
   */
  async acceptInvite(token: string, member: Omit<TeamMember, 'role' | 'joinedAt' | 'permissions'>): Promise<Team> {
    const invite = this.invites.get(token);
    if (!invite) {
      throw new Error('Invalid invite token');
    }

    if (new Date() > invite.expiresAt) {
      this.invites.delete(token);
      await this.saveTeams();
      throw new Error('Invite token expired');
    }

    const team = this.teams.get(invite.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    await this.addMember(invite.teamId, {
      ...member,
      role: invite.role,
    });

    this.invites.delete(token);
    await this.saveTeams();

    return team;
  }

  /**
   * Check permission
   */
  hasPermission(teamId: string, memberId: string, permission: Permission): boolean {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const member = team.members.find(m => m.id === memberId);
    if (!member) return false;

    return member.permissions.includes(permission);
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: TeamMember['role']): Permission[] {
    switch (role) {
      case 'owner':
      case 'admin':
        return this.getAllPermissions();

      case 'member':
        return [
          'project:edit',
          'session:create',
          'session:join',
          'build:trigger',
        ];

      case 'viewer':
        return ['session:join'];

      default:
        return [];
    }
  }

  /**
   * Get all available permissions
   */
  private getAllPermissions(): Permission[] {
    return [
      'project:create',
      'project:delete',
      'project:edit',
      'member:invite',
      'member:remove',
      'session:create',
      'session:join',
      'build:trigger',
      'ota:publish',
    ];
  }

  /**
   * Load teams from disk
   */
  private async loadTeams(): Promise<void> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const data = await fs.readJSON(this.configPath);

        if (data.teams) {
          this.teams = new Map(
            data.teams.map((team: any) => [
              team.id,
              {
                ...team,
                createdAt: new Date(team.createdAt),
                updatedAt: new Date(team.updatedAt),
                members: team.members.map((m: any) => ({
                  ...m,
                  joinedAt: new Date(m.joinedAt),
                })),
                projects: team.projects.map((p: any) => ({
                  ...p,
                  createdAt: new Date(p.createdAt),
                  lastModified: new Date(p.lastModified),
                })),
              },
            ])
          );
        }

        if (data.invites) {
          this.invites = new Map(
            data.invites.map((invite: any) => [
              invite.token,
              {
                ...invite,
                expiresAt: new Date(invite.expiresAt),
              },
            ])
          );
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }

  /**
   * Save teams to disk
   */
  private async saveTeams(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath));

      const data = {
        teams: Array.from(this.teams.values()),
        invites: Array.from(this.invites.values()),
      };

      await fs.writeJSON(this.configPath, data, { spaces: 2 });
    } catch (error) {
      console.error('Error saving teams:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate invite token
   */
  private generateToken(): string {
    return `invite-${Math.random().toString(36).substr(2, 20)}`;
  }
}

// Singleton instance
let teamManagerInstance: TeamManager | null = null;

export function getTeamManager(): TeamManager {
  if (!teamManagerInstance) {
    teamManagerInstance = new TeamManager();
  }
  return teamManagerInstance;
}
