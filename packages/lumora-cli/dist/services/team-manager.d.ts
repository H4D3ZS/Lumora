/**
 * Team Manager
 * Manage teams, members, and permissions
 */
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
export type Permission = 'project:create' | 'project:delete' | 'project:edit' | 'member:invite' | 'member:remove' | 'session:create' | 'session:join' | 'build:trigger' | 'ota:publish';
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
export declare class TeamManager {
    private configPath;
    private teams;
    private invites;
    constructor();
    /**
     * Create a new team
     */
    createTeam(name: string, owner: Omit<TeamMember, 'joinedAt' | 'permissions'>): Promise<Team>;
    /**
     * Get team by ID
     */
    getTeam(teamId: string): Team | undefined;
    /**
     * List all teams
     */
    listTeams(): Team[];
    /**
     * Add member to team
     */
    addMember(teamId: string, member: Omit<TeamMember, 'joinedAt' | 'permissions'>, permissions?: Permission[]): Promise<void>;
    /**
     * Remove member from team
     */
    removeMember(teamId: string, memberId: string): Promise<void>;
    /**
     * Update member role
     */
    updateMemberRole(teamId: string, memberId: string, role: TeamMember['role']): Promise<void>;
    /**
     * Add project to team
     */
    addProject(teamId: string, project: Omit<TeamProject, 'id' | 'createdAt' | 'lastModified'>): Promise<TeamProject>;
    /**
     * Remove project from team
     */
    removeProject(teamId: string, projectId: string): Promise<void>;
    /**
     * Create invite token
     */
    createInvite(teamId: string, role: TeamMember['role'], createdBy: string, expiresInDays?: number): Promise<InviteToken>;
    /**
     * Accept invite
     */
    acceptInvite(token: string, member: Omit<TeamMember, 'role' | 'joinedAt' | 'permissions'>): Promise<Team>;
    /**
     * Check permission
     */
    hasPermission(teamId: string, memberId: string, permission: Permission): boolean;
    /**
     * Get default permissions for role
     */
    private getDefaultPermissions;
    /**
     * Get all available permissions
     */
    private getAllPermissions;
    /**
     * Load teams from disk
     */
    private loadTeams;
    /**
     * Save teams to disk
     */
    private saveTeams;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Generate invite token
     */
    private generateToken;
}
export declare function getTeamManager(): TeamManager;
//# sourceMappingURL=team-manager.d.ts.map