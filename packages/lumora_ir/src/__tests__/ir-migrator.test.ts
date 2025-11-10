import { IRMigrator } from '../migration/ir-migrator';
import { LumoraIR, IRMigration } from '../types/ir-types';

describe('IRMigrator', () => {
  let migrator: IRMigrator;

  beforeEach(() => {
    migrator = new IRMigrator();
  });

  describe('migrate', () => {
    it('should migrate from 0.0.0 to 1.0.0', () => {
      const oldIR: any = {
        version: '0.0.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        nodes: [],
      };

      const migratedIR = migrator.migrate(oldIR, '1.0.0');
      
      expect(migratedIR.version).toBe('1.0.0');
      expect(migratedIR.metadata).toBeDefined();
      expect(Array.isArray(migratedIR.nodes)).toBe(true);
    });

    it('should not migrate if already at target version', () => {
      const ir: LumoraIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        nodes: [],
      };

      const migratedIR = migrator.migrate(ir, '1.0.0');
      expect(migratedIR).toEqual(ir);
    });

    it('should add missing fields during migration', () => {
      const incompleteIR: any = {
        version: '0.0.0',
      };

      const migratedIR = migrator.migrate(incompleteIR, '1.0.0');
      
      expect(migratedIR.metadata).toBeDefined();
      expect(migratedIR.metadata.sourceFramework).toBeDefined();
      expect(migratedIR.metadata.sourceFile).toBeDefined();
      expect(migratedIR.metadata.generatedAt).toBeDefined();
      expect(Array.isArray(migratedIR.nodes)).toBe(true);
    });

    it('should migrate nodes with missing fields', () => {
      const irWithIncompleteNodes: any = {
        version: '0.0.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        nodes: [
          {
            type: 'Container',
          },
        ],
      };

      const migratedIR = migrator.migrate(irWithIncompleteNodes, '1.0.0');
      
      expect(migratedIR.nodes[0].id).toBeDefined();
      expect(migratedIR.nodes[0].props).toBeDefined();
      expect(Array.isArray(migratedIR.nodes[0].children)).toBe(true);
      expect(migratedIR.nodes[0].metadata).toBeDefined();
    });

    it('should throw on invalid migration path', () => {
      const ir: any = {
        version: '99.0.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        nodes: [],
      };

      expect(() => migrator.migrate(ir, '1.0.0')).toThrow();
    });
  });

  describe('needsMigration', () => {
    it('should return false if versions match', () => {
      const ir: LumoraIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        nodes: [],
      };

      expect(migrator.needsMigration(ir, '1.0.0')).toBe(false);
    });

    it('should return true if versions differ', () => {
      const ir: any = {
        version: '0.0.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        nodes: [],
      };

      expect(migrator.needsMigration(ir, '1.0.0')).toBe(true);
    });

    it('should return true if version is missing', () => {
      const ir: any = {
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        nodes: [],
      };

      expect(migrator.needsMigration(ir, '1.0.0')).toBe(true);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return current IR version', () => {
      const version = migrator.getCurrentVersion();
      expect(version).toBe('1.0.0');
    });
  });

  describe('registerMigration', () => {
    it('should allow registering custom migrations', () => {
      const customMigration: IRMigration = {
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        migrate: (ir: any): LumoraIR => {
          ir.version = '1.1.0';
          ir.customField = 'test';
          return ir as LumoraIR;
        },
      };

      migrator.registerMigration(customMigration);

      const ir: LumoraIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        nodes: [],
      };

      const migratedIR: any = migrator.migrate(ir, '1.1.0');
      expect(migratedIR.version).toBe('1.1.0');
      expect(migratedIR.customField).toBe('test');
    });
  });
});
