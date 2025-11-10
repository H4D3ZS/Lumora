/**
 * Integration test proving test sync works in real-time with SyncEngine
 */

import * as fs from 'fs';
import * as path from 'path';
import { SyncEngine, SyncConfig } from '../sync/sync-engine';
import { LumoraIR } from '../types/ir-types';
import { QueuedChange, ChangePriority } from '../sync/change-queue';

describe('SyncEngine Test Integration', () => {
  const testDir = '.lumora/sync-test-integration';
  const reactDir = path.join(testDir, 'web/src');
  const flutterDir = path.join(testDir, 'lib');
  const reactTestDir = path.join(reactDir, '__tests__');
  const flutterTestDir = path.join(testDir, 'test');

  let syncEngine: SyncEngine;

  // Dummy converters
  const reactToIR = async (filePath: string): Promise<LumoraIR> => ({
    version: '1.0.0',
    metadata: {
      sourceFramework: 'react',
      sourceFile: filePath,
      generatedAt: Date.now(),
    },
    nodes: [],
  });

  const flutterToIR = async (filePath: string): Promise<LumoraIR> => ({
    version: '1.0.0',
    metadata: {
      sourceFramework: 'flutter',
      sourceFile: filePath,
      generatedAt: Date.now(),
    },
    nodes: [],
  });

  const irToReact = async (ir: LumoraIR, outputPath: string): Promise<void> => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, '// Generated React code', 'utf-8');
  };

  const irToFlutter = async (ir: LumoraIR, outputPath: string): Promise<void> => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, '// Generated Flutter code', 'utf-8');
  };

  beforeEach(() => {
    // Clean up
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    // Create directories
    fs.mkdirSync(reactDir, { recursive: true });
    fs.mkdirSync(reactTestDir, { recursive: true });
    fs.mkdirSync(flutterDir, { recursive: true });
    fs.mkdirSync(flutterTestDir, { recursive: true });

    // Initialize sync engine with test sync enabled
    const config: SyncConfig = {
      reactDir,
      flutterDir,
      storageDir: path.join(testDir, '.lumora/ir'),
      reactToIR,
      flutterToIR,
      irToReact,
      irToFlutter,
      testSync: {
        enabled: true,
        convertTests: true,
        convertMocks: true,
        generateStubs: true,
      },
    };

    syncEngine = new SyncEngine(config);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Real-time test conversion', () => {
    it('should automatically detect and convert React test files', async () => {
      // Create a React test file
      const reactTestPath = path.join(reactTestDir, 'Counter.test.tsx');
      const reactTestContent = `
        import { render, screen } from '@testing-library/react';
        describe('Counter', () => {
          it('should work', () => {
            expect(true).toBe(true);
          });
        });
      `;

      fs.writeFileSync(reactTestPath, reactTestContent, 'utf-8');

      // Simulate file change event (what the file watcher would do)
      const change: QueuedChange = {
        event: {
          type: 'change',
          filePath: reactTestPath,
          framework: 'react',
          timestamp: Date.now(),
        },
        priority: ChangePriority.NORMAL,
        queuedAt: Date.now(),
      };

      // Process the change through sync engine
      const results = await syncEngine.processChanges([change]);

      // Verify the result
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].sourceFile).toBe(reactTestPath);
      expect(results[0].targetFile).toBeDefined();

      // Verify Flutter test file was created
      const targetFile = results[0].targetFile!;
      expect(fs.existsSync(targetFile)).toBe(true);
      expect(targetFile).toContain('test');
      expect(targetFile).toContain('.dart');
    });

    it('should automatically detect and convert Flutter test files', async () => {
      // Create a Flutter test file
      const flutterTestPath = path.join(flutterTestDir, 'counter_test.dart');
      const flutterTestContent = `
        import 'package:flutter_test/flutter_test.dart';
        void main() {
          test('should work', () {
            expect(true, equals(true));
          });
        }
      `;

      fs.writeFileSync(flutterTestPath, flutterTestContent, 'utf-8');

      // Simulate file change event
      const change: QueuedChange = {
        event: {
          type: 'change',
          filePath: flutterTestPath,
          framework: 'flutter',
          timestamp: Date.now(),
        },
        priority: ChangePriority.NORMAL,
        queuedAt: Date.now(),
      };

      // Process the change
      const results = await syncEngine.processChanges([change]);

      // Verify the result
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].sourceFile).toBe(flutterTestPath);
      expect(results[0].targetFile).toBeDefined();

      // Verify React test file was created
      const targetFile = results[0].targetFile!;
      expect(fs.existsSync(targetFile)).toBe(true);
      expect(targetFile).toContain('__tests__');
      expect(targetFile).toContain('.test.tsx');
    });

    it('should handle test files differently from component files', async () => {
      // Create a regular component file
      const componentPath = path.join(reactDir, 'Counter.tsx');
      fs.writeFileSync(componentPath, 'export function Counter() {}', 'utf-8');

      // Create a test file
      const testPath = path.join(reactTestDir, 'Counter.test.tsx');
      fs.writeFileSync(testPath, 'describe("Counter", () => {});', 'utf-8');

      // Process both
      const changes: QueuedChange[] = [
        {
          event: {
            type: 'change',
            filePath: componentPath,
            framework: 'react',
            timestamp: Date.now(),
          },
          priority: ChangePriority.NORMAL,
          queuedAt: Date.now(),
        },
        {
          event: {
            type: 'change',
            filePath: testPath,
            framework: 'react',
            timestamp: Date.now(),
          },
          priority: ChangePriority.NORMAL,
          queuedAt: Date.now(),
        },
      ];

      const results = await syncEngine.processChanges(changes);

      // Both should succeed
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true); // Component
      expect(results[1].success).toBe(true); // Test

      // Component goes through IR conversion
      expect(results[0].irId).toBeDefined();

      // Test goes through test converter (no IR)
      expect(results[1].targetFile).toBeDefined();
      expect(results[1].targetFile).toContain('test');
    });

    it('should respect test sync enabled/disabled flag', async () => {
      // Disable test sync
      syncEngine.disableTestSync();
      expect(syncEngine.isTestSyncEnabled()).toBe(false);

      // Create a test file
      const testPath = path.join(reactTestDir, 'Test.test.tsx');
      fs.writeFileSync(testPath, 'test content', 'utf-8');

      const change: QueuedChange = {
        event: {
          type: 'change',
          filePath: testPath,
          framework: 'react',
          timestamp: Date.now(),
        },
        priority: ChangePriority.NORMAL,
        queuedAt: Date.now(),
      };

      // Process change
      const results = await syncEngine.processChanges([change]);

      // Should fail because test sync is disabled
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('disabled');

      // Re-enable
      syncEngine.enableTestSync();
      expect(syncEngine.isTestSyncEnabled()).toBe(true);

      // Now it should work
      const results2 = await syncEngine.processChanges([change]);
      expect(results2[0].success).toBe(true);
    });

    it('should process multiple test files in parallel', async () => {
      // Create multiple test files
      const test1 = path.join(reactTestDir, 'Test1.test.tsx');
      const test2 = path.join(reactTestDir, 'Test2.test.tsx');
      const test3 = path.join(reactTestDir, 'Test3.test.tsx');

      fs.writeFileSync(test1, 'test 1', 'utf-8');
      fs.writeFileSync(test2, 'test 2', 'utf-8');
      fs.writeFileSync(test3, 'test 3', 'utf-8');

      const changes: QueuedChange[] = [test1, test2, test3].map(filePath => ({
        event: {
          type: 'change' as const,
          filePath,
          framework: 'react' as const,
          timestamp: Date.now(),
        },
        priority: ChangePriority.NORMAL,
        queuedAt: Date.now(),
      }));

      // Process all at once
      const startTime = Date.now();
      const results = await syncEngine.processChanges(changes);
      const duration = Date.now() - startTime;

      // All should succeed
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);

      // Should be reasonably fast (parallel processing)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Test sync handler integration', () => {
    it('should provide access to test sync handler', () => {
      const handler = syncEngine.getTestSyncHandler();
      expect(handler).toBeDefined();
      expect(handler.isEnabled()).toBe(true);
    });

    it('should allow configuration of test sync', () => {
      const handler = syncEngine.getTestSyncHandler();
      
      handler.updateConfig({
        convertTests: false,
        convertMocks: false,
      });

      const config = handler.getConfig();
      expect(config.convertTests).toBe(false);
      expect(config.convertMocks).toBe(false);
    });
  });
});
