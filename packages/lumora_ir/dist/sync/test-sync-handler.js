"use strict";
/**
 * Test Sync Handler
 * Handles automatic conversion of test files during sync
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
exports.TestSyncHandler = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const test_converter_1 = require("../testing/test-converter");
const mock_converter_1 = require("../testing/mock-converter");
/**
 * Test Sync Handler
 * Automatically converts test files between React and Flutter
 */
class TestSyncHandler {
    constructor(config) {
        this.config = {
            enabled: true,
            convertTests: true,
            convertMocks: true,
            generateStubs: true,
            ...config,
        };
        this.testConverter = new test_converter_1.TestConverter();
        this.mockConverter = new mock_converter_1.MockConverter();
    }
    /**
     * Check if file is a test file
     */
    isTestFile(filePath) {
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
    getTestFramework(filePath) {
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
    async convertTestFile(sourceFile, targetFile, sourceFramework) {
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
            let testFile;
            if (sourceFramework === 'react') {
                testFile = this.testConverter.parseReactTest(sourceContent);
            }
            else {
                testFile = this.testConverter.parseFlutterTest(sourceContent);
            }
            // Convert test
            let targetContent;
            try {
                if (sourceFramework === 'react') {
                    targetContent = this.testConverter.convertReactToFlutter(testFile);
                }
                else {
                    targetContent = this.testConverter.convertFlutterToReact(testFile);
                }
            }
            catch (conversionError) {
                // If conversion fails, generate stub if enabled
                if (this.config.generateStubs) {
                    const targetFramework = sourceFramework === 'react' ? 'flutter' : 'react';
                    const testName = path.basename(sourceFile, path.extname(sourceFile));
                    const reason = conversionError instanceof Error
                        ? conversionError.message
                        : 'Conversion failed';
                    targetContent = this.testConverter.generateTestStub(testName, targetFramework, reason);
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
        }
        catch (error) {
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
    wrapTestStub(stub, framework) {
        if (framework === 'flutter') {
            return `import 'package:flutter_test/flutter_test.dart';\n\nvoid main() {\n${stub}\n}\n`;
        }
        else {
            return `import { describe, it, expect } from '@jest/globals';\n\n${stub}\n`;
        }
    }
    /**
     * Ensure directory exists
     */
    ensureDirectoryExists(filePath) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    /**
     * Get target test file path
     */
    getTargetTestPath(sourceFile, sourceFramework, reactDir, flutterDir) {
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
        }
        else {
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
    toSnakeCase(str) {
        return str
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
    }
    /**
     * Convert to PascalCase
     */
    toPascalCase(str) {
        return str
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
    /**
     * Enable test conversion
     */
    enable() {
        this.config.enabled = true;
    }
    /**
     * Disable test conversion
     */
    disable() {
        this.config.enabled = false;
    }
    /**
     * Check if test conversion is enabled
     */
    isEnabled() {
        return this.config.enabled;
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
}
exports.TestSyncHandler = TestSyncHandler;
