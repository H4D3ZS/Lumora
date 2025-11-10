/**
 * Performance tests for Lumora IR system
 * Verifies conversion speed and performance targets
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { IRStorage } from '../storage/ir-storage';
import { IRValidator } from '../validator/ir-validator';
import { createIR, createNode } from '../utils/ir-utils';
import { LumoraIR, LumoraNode } from '../types/ir-types';

describe('Performance Tests', () => {
  let tempDir: string;
  let storage: IRStorage;
  let validator: IRValidator;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumora-perf-'));
    storage = new IRStorage(path.join(tempDir, '.lumora/ir'));
    validator = new IRValidator();
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('IR Creation Performance', () => {
    it('should create simple IR within 10ms', () => {
      const startTime = Date.now();
      
      const ir = createIR({
        sourceFramework: 'react',
        sourceFile: 'test.tsx',
        generatedAt: Date.now(),
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10);
      expect(ir).toBeDefined();
    });

    it('should create IR with 100 nodes within 50ms', () => {
      const nodes: LumoraNode[] = [];
      
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        nodes.push(createNode('Container', { id: i }));
      }

      const ir = createIR({
        sourceFramework: 'react',
        sourceFile: 'test.tsx',
        generatedAt: Date.now(),
      }, nodes);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50);
      expect(ir.nodes.length).toBe(100);
    });
  });

  describe('IR Validation Performance', () => {
    it('should validate simple IR within 10ms', () => {
      const ir = createIR({
        sourceFramework: 'react',
        sourceFile: 'test.tsx',
        generatedAt: Date.now(),
      });

      const startTime = Date.now();
      const result = validator.validate(ir);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10);
      expect(result.valid).toBe(true);
    });

    it('should validate IR with 100 nodes within 100ms', () => {
      const nodes: LumoraNode[] = [];
      for (let i = 0; i < 100; i++) {
        nodes.push(createNode('Container', { id: i }));
      }

      const ir = createIR({
        sourceFramework: 'react',
        sourceFile: 'test.tsx',
        generatedAt: Date.now(),
      }, nodes);

      const startTime = Date.now();
      const result = validator.validate(ir);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
      expect(result.valid).toBe(true);
    });
  });

  describe('IR Storage Performance', () => {
    it('should store simple IR within 50ms', () => {
      const ir = createIR({
        sourceFramework: 'react',
        sourceFile: 'test.tsx',
        generatedAt: Date.now(),
      });

      const startTime = Date.now();
      storage.store('test-component', ir);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
    });

    it('should retrieve IR within 20ms', () => {
      const ir = createIR({
        sourceFramework: 'react',
        sourceFile: 'test.tsx',
        generatedAt: Date.now(),
      });

      storage.store('test-component', ir);

      const startTime = Date.now();
      const retrieved = storage.retrieve('test-component');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(20);
      expect(retrieved).not.toBeNull();
    });

    it('should store 100 components within 2 seconds', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const ir = createIR({
          sourceFramework: 'react',
          sourceFile: `component-${i}.tsx`,
          generatedAt: Date.now(),
        });
        storage.store(`component-${i}`, ir);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Large Project Performance', () => {
    it('should handle IR with deeply nested nodes (depth 10)', () => {
      // Create deeply nested structure
      let currentNode = createNode('Text', { text: 'Deep' });
      
      for (let i = 0; i < 9; i++) {
        currentNode = createNode('Container', {}, [currentNode]);
      }

      const ir = createIR({
        sourceFramework: 'react',
        sourceFile: 'deep.tsx',
        generatedAt: Date.now(),
      }, [currentNode]);

      const startTime = Date.now();
      const result = validator.validate(ir);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(result.valid).toBe(true);
    });

    it('should handle IR with 500 nodes efficiently', () => {
      const nodes: LumoraNode[] = [];
      
      // Create a tree structure with 500 nodes
      for (let i = 0; i < 50; i++) {
        const children: LumoraNode[] = [];
        for (let j = 0; j < 10; j++) {
          children.push(createNode('Text', { text: `Item ${i}-${j}` }));
        }
        nodes.push(createNode('Container', {}, children));
      }

      const ir = createIR({
        sourceFramework: 'react',
        sourceFile: 'large.tsx',
        generatedAt: Date.now(),
      }, nodes);

      const startTime = Date.now();
      
      // Validate
      const validationResult = validator.validate(ir);
      
      // Store
      storage.store('large-component', ir);
      
      // Retrieve
      const retrieved = storage.retrieve('large-component');
      
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
      expect(validationResult.valid).toBe(true);
      expect(retrieved).not.toBeNull();
    });
  });

  describe('Batch Operations Performance', () => {
    it('should list 100 stored IRs within 100ms', () => {
      // Store 100 components
      for (let i = 0; i < 100; i++) {
        const ir = createIR({
          sourceFramework: 'react',
          sourceFile: `component-${i}.tsx`,
          generatedAt: Date.now(),
        });
        storage.store(`component-${i}`, ir);
      }

      const startTime = Date.now();
      const list = storage.list();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
      expect(list.length).toBe(100);
    });

    it('should check changes for 50 components within 200ms', () => {
      const irs: LumoraIR[] = [];
      
      // Store 50 components
      for (let i = 0; i < 50; i++) {
        const ir = createIR({
          sourceFramework: 'react',
          sourceFile: `component-${i}.tsx`,
          generatedAt: Date.now(),
        });
        storage.store(`component-${i}`, ir);
        irs.push(ir);
      }

      const startTime = Date.now();
      
      // Check if each has changed
      for (let i = 0; i < 50; i++) {
        storage.hasChanged(`component-${i}`, irs[i]);
      }
      
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory when creating many IRs', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and discard 1000 IRs
      for (let i = 0; i < 1000; i++) {
        const ir = createIR({
          sourceFramework: 'react',
          sourceFile: `test-${i}.tsx`,
          generatedAt: Date.now(),
        });
        // IR goes out of scope
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
