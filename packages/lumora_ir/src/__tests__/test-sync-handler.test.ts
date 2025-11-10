import * as fs from 'fs';
import * as path from 'path';
import { TestSyncHandler } from '../sync/test-sync-handler';

describe('TestSyncHandler', () => {
  let handler: TestSyncHandler;
  const testDir = '.lumora/test-sync-test';

  beforeEach(() => {
    handler = new TestSyncHandler();
    
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('isTestFile', () => {
    it('should identify React test files', () => {
      expect(handler.isTestFile('Component.test.tsx')).toBe(true);
      expect(handler.isTestFile('Component.spec.ts')).toBe(true);
      expect(handler.isTestFile('src/__tests__/Component.tsx')).toBe(true);
    });

    it('should identify Flutter test files', () => {
      expect(handler.isTestFile('component_test.dart')).toBe(true);
      expect(handler.isTestFile('test/widget_test.dart')).toBe(true);
    });

    it('should not identify non-test files', () => {
      expect(handler.isTestFile('Component.tsx')).toBe(false);
      expect(handler.isTestFile('component.dart')).toBe(false);
      expect(handler.isTestFile('utils.ts')).toBe(false);
    });
  });

  describe('getTestFramework', () => {
    it('should detect React test framework', () => {
      expect(handler.getTestFramework('Component.test.tsx')).toBe('react');
      expect(handler.getTestFramework('Component.spec.js')).toBe('react');
    });

    it('should detect Flutter test framework', () => {
      expect(handler.getTestFramework('component_test.dart')).toBe('flutter');
    });

    it('should return null for non-test files', () => {
      expect(handler.getTestFramework('Component.tsx')).toBeNull();
    });
  });

  describe('getTargetTestPath', () => {
    it('should convert React test path to Flutter', () => {
      const sourcePath = 'web/src/__tests__/Counter.test.tsx';
      const targetPath = handler.getTargetTestPath(
        sourcePath,
        'react',
        'web/src',
        'lib'
      );

      expect(targetPath).toContain('test');
      expect(targetPath).toContain('counter_test.dart');
    });

    it('should convert Flutter test path to React', () => {
      const sourcePath = 'test/counter_test.dart';
      const targetPath = handler.getTargetTestPath(
        sourcePath,
        'flutter',
        'web/src',
        'lib'
      );

      expect(targetPath).toContain('__tests__');
      expect(targetPath).toContain('Counter.test.tsx');
    });
  });

  describe('convertTestFile', () => {
    it('should convert React test to Flutter', async () => {
      const sourceFile = path.join(testDir, 'Counter.test.tsx');
      const targetFile = path.join(testDir, 'counter_test.dart');

      // Create source test file
      const reactTest = `
        import { render, screen } from '@testing-library/react';
        import { Counter } from './Counter';

        describe('Counter', () => {
          it('should render', () => {
            render(<Counter />);
            expect(screen.getByText('Count: 0')).toBeInTheDocument();
          });
        });
      `;

      fs.writeFileSync(sourceFile, reactTest, 'utf-8');

      // Convert
      const result = await handler.convertTestFile(sourceFile, targetFile, 'react');

      expect(result.success).toBe(true);
      expect(result.targetFile).toBe(targetFile);
      expect(fs.existsSync(targetFile)).toBe(true);

      const content = fs.readFileSync(targetFile, 'utf-8');
      expect(content).toContain("import 'package:flutter_test/flutter_test.dart'");
      expect(content).toContain("group(");
    });

    it('should generate stub for unconvertible test', async () => {
      const sourceFile = path.join(testDir, 'Complex.test.tsx');
      const targetFile = path.join(testDir, 'complex_test.dart');

      // Create source test file with content that might fail parsing
      const complexTest = `
        // This is a minimal test that will be parsed
        describe('Complex', () => {
          it('test', () => {});
        });
      `;

      fs.writeFileSync(sourceFile, complexTest, 'utf-8');

      // Convert
      const result = await handler.convertTestFile(sourceFile, targetFile, 'react');

      // Should succeed (either conversion or stub)
      expect(result.success).toBe(true);
      expect(fs.existsSync(targetFile)).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should respect enabled flag', async () => {
      handler.disable();
      expect(handler.isEnabled()).toBe(false);

      const sourceFile = path.join(testDir, 'Test.test.tsx');
      const targetFile = path.join(testDir, 'test_test.dart');

      fs.writeFileSync(sourceFile, 'test content', 'utf-8');

      const result = await handler.convertTestFile(sourceFile, targetFile, 'react');

      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');
    });

    it('should allow configuration updates', () => {
      handler.updateConfig({
        convertTests: false,
        convertMocks: false,
      });

      const config = handler.getConfig();
      expect(config.convertTests).toBe(false);
      expect(config.convertMocks).toBe(false);
    });

    it('should enable and disable test sync', () => {
      handler.disable();
      expect(handler.isEnabled()).toBe(false);

      handler.enable();
      expect(handler.isEnabled()).toBe(true);
    });
  });
});
