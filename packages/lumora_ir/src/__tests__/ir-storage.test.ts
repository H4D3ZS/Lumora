import * as fs from 'fs';
import * as path from 'path';
import { IRStorage } from '../storage/ir-storage';
import { LumoraIR } from '../types/ir-types';

describe('IRStorage', () => {
  const testStorageDir = '.lumora/ir-test';
  let storage: IRStorage;

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
    storage = new IRStorage(testStorageDir);
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  const createTestIR = (): LumoraIR => ({
    version: '1.0.0',
    metadata: {
      sourceFramework: 'react',
      sourceFile: 'test.tsx',
      generatedAt: Date.now(),
    },
    nodes: [
      {
        id: 'node1',
        type: 'Container',
        props: { width: 100 },
        children: [],
        metadata: {
          lineNumber: 1,
        },
      },
    ],
  });

  describe('store', () => {
    it('should store IR successfully', () => {
      const ir = createTestIR();
      const entry = storage.store('test-component', ir);

      expect(entry.id).toBe('test-component');
      expect(entry.version).toBe(1);
      expect(entry.ir).toEqual(ir);
      expect(entry.checksum).toBeDefined();
    });

    it('should increment version on subsequent stores', () => {
      const ir = createTestIR();
      
      const entry1 = storage.store('test-component', ir);
      expect(entry1.version).toBe(1);

      const entry2 = storage.store('test-component', ir);
      expect(entry2.version).toBe(2);
    });

    it('should throw on invalid IR', () => {
      const invalidIR: any = {
        version: '1.0.0',
        nodes: [],
      };

      expect(() => storage.store('test', invalidIR)).toThrow();
    });
  });

  describe('retrieve', () => {
    it('should retrieve stored IR', () => {
      const ir = createTestIR();
      storage.store('test-component', ir);

      const retrieved = storage.retrieve('test-component');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.ir).toEqual(ir);
    });

    it('should return null for non-existent IR', () => {
      const retrieved = storage.retrieve('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should retrieve specific version from history', () => {
      const ir1 = createTestIR();
      storage.store('test-component', ir1);

      const ir2 = createTestIR();
      ir2.nodes[0].props.width = 200;
      storage.store('test-component', ir2);

      // Store a third version so version 2 gets archived
      const ir3 = createTestIR();
      ir3.nodes[0].props.width = 300;
      storage.store('test-component', ir3);

      const retrieved = storage.retrieve('test-component', 2);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.version).toBe(2);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return 0 for non-existent IR', () => {
      const version = storage.getCurrentVersion('non-existent');
      expect(version).toBe(0);
    });

    it('should return correct version', () => {
      const ir = createTestIR();
      storage.store('test-component', ir);

      const version = storage.getCurrentVersion('test-component');
      expect(version).toBe(1);
    });
  });

  describe('getHistory', () => {
    it('should return empty array for non-existent IR', () => {
      const history = storage.getHistory('non-existent');
      expect(history).toEqual([]);
    });

    it('should return version history', () => {
      const ir = createTestIR();
      
      storage.store('test-component', ir);
      storage.store('test-component', ir);
      storage.store('test-component', ir);

      const history = storage.getHistory('test-component');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('delete', () => {
    it('should delete IR and history', () => {
      const ir = createTestIR();
      storage.store('test-component', ir);
      storage.store('test-component', ir);

      const deleted = storage.delete('test-component');
      expect(deleted).toBe(true);

      const retrieved = storage.retrieve('test-component');
      expect(retrieved).toBeNull();
    });
  });

  describe('list', () => {
    it('should list all stored IRs', () => {
      const ir = createTestIR();
      
      storage.store('component1', ir);
      storage.store('component2', ir);
      storage.store('component3', ir);

      const list = storage.list();
      expect(list).toContain('component1');
      expect(list).toContain('component2');
      expect(list).toContain('component3');
    });

    it('should return empty array when no IRs stored', () => {
      const list = storage.list();
      expect(list).toEqual([]);
    });
  });

  describe('hasChanged', () => {
    it('should return true for new IR', () => {
      const ir = createTestIR();
      const changed = storage.hasChanged('test-component', ir);
      expect(changed).toBe(true);
    });

    it('should return false for unchanged IR', () => {
      const ir = createTestIR();
      storage.store('test-component', ir);

      const changed = storage.hasChanged('test-component', ir);
      expect(changed).toBe(false);
    });

    it('should return true for modified IR', () => {
      const ir1 = createTestIR();
      storage.store('test-component', ir1);

      const ir2 = createTestIR();
      ir2.nodes[0].props.width = 200;

      const changed = storage.hasChanged('test-component', ir2);
      expect(changed).toBe(true);
    });
  });
});
