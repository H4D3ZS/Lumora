/**
 * Test Sync Handler
 * Handles automatic conversion of test files during sync
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestConverter, TestFile } from '../testing/test-converter';
import { MockConverter } from '../testing/mock-converter';

export interface TestSyncConfig {
  enabled: boolean;
  convertTests: boolean;
  convertMocks: boolean;
  generateStubs: boolean;
}

export interface TestConversionResult {
  success: boolean;
  sourceFile: string;
  targetFile?: string;
  error?: string;
  stubGenerated?: boolean;
}

/**
 * Test Sync Handler
 * Automatically converts test files between React and Flutter
 */
export class TestSyncHandler {
  private testConverter: TestConverter;
  private mockConverter: MockConverter;
  private config: TestSyncConfig;

  constructor(config?: Partial<TestSyncConfig>) {
    this.config = {
      enabled: true,
      convertTests: true,
      convertMocks: true,
      generateStubs: true,
      ...config,
    };

    this.testConverter = new TestConverter();
    this.mockConverter = new MockConverter();
  }

  /**
   * Check if file is a test file
   */
  isTestFile(filePath: string): boolean {
    // React test patterns
    if (filePath.match(/\.(test|spec)\.(tsx?|jsx?)$/)) {
      return true;
    }

    // Flutter test patterns
    if (filePath.match(/_test\.dart$/)) {
      return true;
    }

    // Test directory patterns
    if (filePath.includes('/__tests__/') || filePath.includes('/test/')) {
      return true;
    }

    return false;
  }

  /**
   * Get test framework from file path
   */
  getTestFramework(filePath: string): 'react' | 'flutter' | null {
    if (filePath.match(/\.(test|spec)\.(tsx?|jsx?)$/)) {
      return 'react';
    }

    if (filePath.match(/_test\.dart$/)) {
      return 'flutter';
    }

    return null;
  }

  /**
   * Convert test file
   */
  async convertTestFile(
    sourceFile: string,
    targetFile: string,
    sourceFramework: 'react' | 'flutter'
  ): Promise<TestConversionResult> {
    if (!this.config.enabled || !this.config.convertTests) {
      return {
        success: false,
        sourceFile,
        error: 'Test conversion is disabled',
      };
    }

    try {
      // Read source file
      const sourceContent = fs.readFileSync(sourceFile, 'utf-8');

      // Parse test file
      let testFile: TestFile;
      if (sourceFramework === 'react') {
        testFile = this.testConverter.parseReactTest(sourceContent);
      } else {
        testFile = this.testConverter.parseFlutterTest(sourceContent);
      }

      // Convert test
      let targetContent: string;
      try {
        if (sourceFramework === 'react') {
          targetContent = this.testConverter.convertReactToFlutter(testFile);
        } else {
          targetContent = this.testConverter.convertFlutterToReact(testFile);
        }
      } catch (conversionError) {
        // If conversion fails, generate stub if enabled
        if (this.config.generateStubs) {
          const targetFramework = sourceFramework === 'react' ? 'flutter' : 'react';
          const testName = path.basename(sourceFile, path.extname(sourceFile));
          const reason = conversionError instanceof Error 
            ? conversionError.message 
            : 'Conversion failed';

          targetContent = this.testConverter.generateTestStub(
            testName,
            targetFramework,
            reason
          );

          // Wrap stub in proper test structure
          targetContent = this.wrapTestStub(targetContent, targetFramework);

          // Write stub file
          this.ensureDirectoryExists(targetFile);
          fs.writeFileSync(targetFile, targetContent, 'utf-8');

          return {
            success: true,
            sourceFile,
            targetFile,
            stubGenerated: true,
          };
        }

        throw conversionError;
      }

      // Write target file
      this.ensureDirectoryExists(targetFile);
      fs.writeFileSync(targetFile, targetContent, 'utf-8');

      return {
        success: true,
        sourceFile,
        targetFile,
      };
    } catch (error) {
      return {
        success: false,
        sourceFile,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Wrap test stub in proper structure
   */
  private wrapTestStub(stub: string, framework: 'react' | 'flutter'): string {
    if (framework === 'flutter') {
      return `import 'package:flutter_test/flutter_test.dart';\n\nvoid main() {\n${stub}\n}\n`;
    } else {
      return `import { describe, it, expect } from '@jest/globals';\n\n${stub}\n`;
    }
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Get target test file path
   */
  getTargetTestPath(
    sourceFile: string,
    sourceFramework: 'react' | 'flutter',
    reactDir: string,
    flutterDir: string
  ): string {
    if (sourceFramework === 'react') {
      // React to Flutter: web/src/__tests__/Component.test.tsx -> test/component_test.dart
      const relativePath = path.relative(reactDir, sourceFile);
      
      // Remove __tests__ directory
      const withoutTestsDir = relativePath.replace('__tests__/', '');
      
      // Get base name without extension
      const baseName = path.basename(withoutTestsDir, path.extname(withoutTestsDir));
      
      // Remove .test or .spec suffix
      const cleanName = baseName.replace(/\.(test|spec)$/, '');
      
      // Convert to snake_case
      const snakeName = this.toSnakeCase(cleanName);
      
      // Get directory path
      const dirPath = path.dirname(withoutTestsDir);
      
      // Flutter test path: test/dir/name_test.dart
      return path.join(flutterDir, '..', 'test', dirPath, `${snakeName}_test.dart`);
    } else {
      // Flutter to React: test/component_test.dart -> web/src/__tests__/Component.test.tsx
      const relativePath = path.relative(path.join(flutterDir, '..', 'test'), sourceFile);
      
      // Get base name without _test.dart
      const baseName = path.basename(relativePath, '_test.dart');
      
      // Convert to PascalCase
      const pascalName = this.toPascalCase(baseName);
      
      // Get directory path
      const dirPath = path.dirname(relativePath);
      
      // React test path: web/src/dir/__tests__/Name.test.tsx
      return path.join(reactDir, dirPath, '__tests__', `${pascalName}.test.tsx`);
    }
  }

  /**
   * Convert to snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Enable test conversion
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable test conversion
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * Check if test conversion is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get configuration
   */
  getConfig(): TestSyncConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TestSyncConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
