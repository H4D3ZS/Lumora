import { LumoraIR, IRMigration } from '../types/ir-types';
import { IRValidator, getValidator } from '../validator/ir-validator';

/**
 * IR Migration System
 * Handles schema version migrations
 */
export class IRMigrator {
  private migrations: Map<string, IRMigration> = new Map();
  private validator: IRValidator = getValidator();

  constructor() {
    this.registerDefaultMigrations();
  }

  /**
   * Register a migration
   */
  registerMigration(migration: IRMigration): void {
    const key = `${migration.fromVersion}->${migration.toVersion}`;
    this.migrations.set(key, migration);
  }

  /**
   * Get migration path from one version to another
   */
  private getMigrationPath(fromVersion: string, toVersion: string): IRMigration[] {
    const path: IRMigration[] = [];
    let currentVersion = fromVersion;

    // Simple linear migration path
    // In production, this could use graph traversal for complex paths
    while (currentVersion !== toVersion) {
      let found = false;

      for (const [key, migration] of this.migrations.entries()) {
        if (migration.fromVersion === currentVersion) {
          path.push(migration);
          currentVersion = migration.toVersion;
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error(
          `No migration path found from ${fromVersion} to ${toVersion}`
        );
      }

      // Prevent infinite loops
      if (path.length > 100) {
        throw new Error('Migration path too long, possible circular dependency');
      }
    }

    return path;
  }

  /**
   * Migrate IR from one version to another
   */
  migrate(ir: any, targetVersion: string): LumoraIR {
    const currentVersion = ir.version || '0.0.0';

    if (currentVersion === targetVersion) {
      // Already at target version, just validate
      this.validator.validateOrThrow(ir);
      return ir as LumoraIR;
    }

    // Get migration path
    const migrationPath = this.getMigrationPath(currentVersion, targetVersion);

    // Apply migrations in sequence
    let migratedIR = ir;
    for (const migration of migrationPath) {
      try {
        migratedIR = migration.migrate(migratedIR);
        migratedIR.version = migration.toVersion;
      } catch (error) {
        throw new Error(
          `Migration from ${migration.fromVersion} to ${migration.toVersion} failed: ${error}`
        );
      }
    }

    // Validate final result
    this.validator.validateOrThrow(migratedIR);

    return migratedIR as LumoraIR;
  }

  /**
   * Check if migration is needed
   */
  needsMigration(ir: any, targetVersion: string): boolean {
    const currentVersion = ir.version || '0.0.0';
    return currentVersion !== targetVersion;
  }

  /**
   * Get current IR version
   */
  getCurrentVersion(): string {
    return '1.0.0';
  }

  /**
   * Register default migrations
   */
  private registerDefaultMigrations(): void {
    // Migration from 0.0.0 to 1.0.0 (initial version)
    this.registerMigration({
      fromVersion: '0.0.0',
      toVersion: '1.0.0',
      migrate: (ir: any): LumoraIR => {
        // Add version if missing
        if (!ir.version) {
          ir.version = '1.0.0';
        }

        // Ensure metadata has required fields
        if (!ir.metadata) {
          ir.metadata = {
            sourceFramework: 'react',
            sourceFile: 'unknown',
            generatedAt: Date.now(),
          };
        }

        // Ensure nodes is an array
        if (!Array.isArray(ir.nodes)) {
          ir.nodes = [];
        }

        // Migrate nodes to ensure they have required fields
        ir.nodes = ir.nodes.map((node: any) => this.migrateNode(node));

        return ir as LumoraIR;
      },
    });

    // Example: Future migration from 1.0.0 to 1.1.0
    // this.registerMigration({
    //   fromVersion: '1.0.0',
    //   toVersion: '1.1.0',
    //   migrate: (ir: any): LumoraIR => {
    //     // Add new fields or transform existing ones
    //     return ir as LumoraIR;
    //   },
    // });
  }

  /**
   * Migrate a single node
   */
  private migrateNode(node: any): any {
    // Ensure node has required fields
    if (!node.id) {
      node.id = this.generateNodeId();
    }

    if (!node.type) {
      node.type = 'Unknown';
    }

    if (!node.props) {
      node.props = {};
    }

    if (!Array.isArray(node.children)) {
      node.children = [];
    }

    if (!node.metadata) {
      node.metadata = {
        lineNumber: 0,
      };
    }

    // Recursively migrate children
    node.children = node.children.map((child: any) => this.migrateNode(child));

    return node;
  }

  /**
   * Generate unique node ID
   */
  private generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let migratorInstance: IRMigrator | null = null;

/**
 * Get singleton migrator instance
 */
export function getMigrator(): IRMigrator {
  if (!migratorInstance) {
    migratorInstance = new IRMigrator();
  }
  return migratorInstance;
}
