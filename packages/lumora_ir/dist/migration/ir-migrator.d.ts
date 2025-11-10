import { LumoraIR, IRMigration } from '../types/ir-types';
/**
 * IR Migration System
 * Handles schema version migrations
 */
export declare class IRMigrator {
    private migrations;
    private validator;
    constructor();
    /**
     * Register a migration
     */
    registerMigration(migration: IRMigration): void;
    /**
     * Get migration path from one version to another
     */
    private getMigrationPath;
    /**
     * Migrate IR from one version to another
     */
    migrate(ir: any, targetVersion: string): LumoraIR;
    /**
     * Check if migration is needed
     */
    needsMigration(ir: any, targetVersion: string): boolean;
    /**
     * Get current IR version
     */
    getCurrentVersion(): string;
    /**
     * Register default migrations
     */
    private registerDefaultMigrations;
    /**
     * Migrate a single node
     */
    private migrateNode;
    /**
     * Generate unique node ID
     */
    private generateNodeId;
}
/**
 * Get singleton migrator instance
 */
export declare function getMigrator(): IRMigrator;
