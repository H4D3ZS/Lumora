"use strict";
/**
 * Team Manager
 * Manage teams, members, and permissions
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamManager = void 0;
exports.getTeamManager = getTeamManager;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Team Manager
 */
class TeamManager {
    constructor() {
        this.teams = new Map();
        this.invites = new Map();
        this.configPath = path.join(os.homedir(), '.lumora', 'teams.json');
        this.loadTeams();
    }
    /**
     * Create a new team
     */
    async createTeam(name, owner) {
        const teamId = this.generateId();
        const team = {
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
    getTeam(teamId) {
        return this.teams.get(teamId);
    }
    /**
     * List all teams
     */
    listTeams() {
        return Array.from(this.teams.values());
    }
    /**
     * Add member to team
     */
    async addMember(teamId, member, permissions) {
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
    async removeMember(teamId, memberId) {
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
    async updateMemberRole(teamId, memberId, role) {
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
    async addProject(teamId, project) {
        const team = this.teams.get(teamId);
        if (!team) {
            throw new Error('Team not found');
        }
        const teamProject = {
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
    async removeProject(teamId, projectId) {
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
    async createInvite(teamId, role, createdBy, expiresInDays = 7) {
        const team = this.teams.get(teamId);
        if (!team) {
            throw new Error('Team not found');
        }
        const token = this.generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        const invite = {
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
    async acceptInvite(token, member) {
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
    hasPermission(teamId, memberId, permission) {
        const team = this.teams.get(teamId);
        if (!team)
            return false;
        const member = team.members.find(m => m.id === memberId);
        if (!member)
            return false;
        return member.permissions.includes(permission);
    }
    /**
     * Get default permissions for role
     */
    getDefaultPermissions(role) {
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
    getAllPermissions() {
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
    async loadTeams() {
        try {
            if (await fs.pathExists(this.configPath)) {
                const data = await fs.readJSON(this.configPath);
                if (data.teams) {
                    this.teams = new Map(data.teams.map((team) => [
                        team.id,
                        {
                            ...team,
                            createdAt: new Date(team.createdAt),
                            updatedAt: new Date(team.updatedAt),
                            members: team.members.map((m) => ({
                                ...m,
                                joinedAt: new Date(m.joinedAt),
                            })),
                            projects: team.projects.map((p) => ({
                                ...p,
                                createdAt: new Date(p.createdAt),
                                lastModified: new Date(p.lastModified),
                            })),
                        },
                    ]));
                }
                if (data.invites) {
                    this.invites = new Map(data.invites.map((invite) => [
                        invite.token,
                        {
                            ...invite,
                            expiresAt: new Date(invite.expiresAt),
                        },
                    ]));
                }
            }
        }
        catch (error) {
            console.error('Error loading teams:', error);
        }
    }
    /**
     * Save teams to disk
     */
    async saveTeams() {
        try {
            await fs.ensureDir(path.dirname(this.configPath));
            const data = {
                teams: Array.from(this.teams.values()),
                invites: Array.from(this.invites.values()),
            };
            await fs.writeJSON(this.configPath, data, { spaces: 2 });
        }
        catch (error) {
            console.error('Error saving teams:', error);
        }
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate invite token
     */
    generateToken() {
        return `invite-${Math.random().toString(36).substr(2, 20)}`;
    }
}
exports.TeamManager = TeamManager;
// Singleton instance
let teamManagerInstance = null;
function getTeamManager() {
    if (!teamManagerInstance) {
        teamManagerInstance = new TeamManager();
    }
    return teamManagerInstance;
}
//# sourceMappingURL=team-manager.js.map