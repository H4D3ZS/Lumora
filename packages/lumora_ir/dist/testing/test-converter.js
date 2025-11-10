"use strict";
/**
 * Test Converter
 * Converts test files between React (Jest) and Flutter (widget tests)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestConverter = void 0;
class TestConverter {
    /**
     * Convert React Jest test to Flutter widget test
     */
    convertReactToFlutter(testFile) {
        if (testFile.framework !== 'react') {
            throw new Error('Input must be a React test file');
        }
        const imports = this.generateFlutterImports(testFile);
        const testSuite = this.generateFlutterTestSuite(testFile.testSuite);
        return `${imports}\n\n${testSuite}`;
    }
    /**
     * Convert Flutter widget test to React Jest test
     */
    convertFlutterToReact(testFile) {
        if (testFile.framework !== 'flutter') {
            throw new Error('Input must be a Flutter test file');
        }
        const imports = this.generateReactImports(testFile);
        const testSuite = this.generateReactTestSuite(testFile.testSuite);
        return `${imports}\n\n${testSuite}`;
    }
    /**
     * Generate Flutter imports
     */
    generateFlutterImports(testFile) {
        const imports = [
            "import 'package:flutter/material.dart';",
            "import 'package:flutter_test/flutter_test.dart';",
        ];
        // Add component imports
        testFile.imports.forEach(imp => {
            if (imp.includes('from')) {
                // Convert JS import to Dart import
                const match = imp.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
                if (match) {
                    const path = match[2].replace(/\.(tsx?|jsx?)$/, '.dart');
                    imports.push(`import 'package:${path}';`);
                }
            }
        });
        return imports.join('\n');
    }
    /**
     * Generate React imports
     */
    generateReactImports(testFile) {
        const imports = [
            "import React from 'react';",
            "import { render, screen, fireEvent, waitFor } from '@testing-library/react';",
            "import '@testing-library/jest-dom';",
        ];
        // Add component imports
        testFile.imports.forEach(imp => {
            if (imp.includes('package:')) {
                // Convert Dart import to JS import
                const match = imp.match(/import\s+['"]package:([^'"]+)['"]/);
                if (match) {
                    const path = match[1].replace(/\.dart$/, '');
                    imports.push(`import { Component } from './${path}';`);
                }
            }
        });
        return imports.join('\n');
    }
    /**
     * Generate Flutter test suite
     */
    generateFlutterTestSuite(suite) {
        const lines = [];
        lines.push(`void main() {`);
        lines.push(`  group('${suite.name}', () {`);
        // Setup
        if (suite.setup && suite.setup.length > 0) {
            lines.push(`    setUp(() {`);
            suite.setup.forEach(line => lines.push(`      ${line}`));
            lines.push(`    });`);
            lines.push('');
        }
        // Teardown
        if (suite.teardown && suite.teardown.length > 0) {
            lines.push(`    tearDown(() {`);
            suite.teardown.forEach(line => lines.push(`      ${line}`));
            lines.push(`    });`);
            lines.push('');
        }
        // Test cases
        suite.testCases.forEach(testCase => {
            lines.push(this.generateFlutterTestCase(testCase));
            lines.push('');
        });
        lines.push(`  });`);
        lines.push(`}`);
        return lines.join('\n');
    }
    /**
     * Generate React test suite
     */
    generateReactTestSuite(suite) {
        const lines = [];
        lines.push(`describe('${suite.name}', () => {`);
        // Setup
        if (suite.setup && suite.setup.length > 0) {
            lines.push(`  beforeEach(() => {`);
            suite.setup.forEach(line => lines.push(`    ${line}`));
            lines.push(`  });`);
            lines.push('');
        }
        // Teardown
        if (suite.teardown && suite.teardown.length > 0) {
            lines.push(`  afterEach(() => {`);
            suite.teardown.forEach(line => lines.push(`    ${line}`));
            lines.push(`  });`);
            lines.push('');
        }
        // Test cases
        suite.testCases.forEach(testCase => {
            lines.push(this.generateReactTestCase(testCase));
            lines.push('');
        });
        lines.push(`});`);
        return lines.join('\n');
    }
    /**
     * Generate Flutter test case
     */
    generateFlutterTestCase(testCase) {
        const lines = [];
        const testType = testCase.type === 'widget' ? 'testWidgets' : 'test';
        const params = testCase.type === 'widget' ? '(WidgetTester tester) async' : '() async';
        lines.push(`    ${testType}('${testCase.name}', ${params} {`);
        // Setup
        if (testCase.setup && testCase.setup.length > 0) {
            testCase.setup.forEach(line => lines.push(`      ${line}`));
            lines.push('');
        }
        // Assertions
        testCase.assertions.forEach(assertion => {
            const flutterAssertion = this.convertAssertionToFlutter(assertion);
            lines.push(`      ${flutterAssertion}`);
        });
        lines.push(`    });`);
        return lines.join('\n');
    }
    /**
     * Generate React test case
     */
    generateReactTestCase(testCase) {
        const lines = [];
        const testType = testCase.async ? 'it' : 'it';
        const asyncKeyword = testCase.async ? 'async ' : '';
        lines.push(`  ${testType}('${testCase.name}', ${asyncKeyword}() => {`);
        // Setup
        if (testCase.setup && testCase.setup.length > 0) {
            testCase.setup.forEach(line => lines.push(`    ${line}`));
            lines.push('');
        }
        // Assertions
        testCase.assertions.forEach(assertion => {
            const jestAssertion = this.convertAssertionToJest(assertion);
            lines.push(`    ${jestAssertion}`);
        });
        lines.push(`  });`);
        return lines.join('\n');
    }
    /**
     * Convert assertion to Flutter matcher
     */
    convertAssertionToFlutter(assertion) {
        const negation = assertion.negated ? 'isNot' : 'equals';
        switch (assertion.type) {
            case 'equals':
                return `expect(${assertion.actual}, ${assertion.negated ? 'isNot' : 'equals'}(${JSON.stringify(assertion.expected)}));`;
            case 'contains':
                return `expect(${assertion.actual}, contains(${JSON.stringify(assertion.expected)}));`;
            case 'throws':
                return `expect(() => ${assertion.actual}, throwsA(isA<${assertion.expected}>()));`;
            case 'rendered':
                return `expect(find.${assertion.matcher}, findsOneWidget);`;
            case 'called':
                return `verify(${assertion.actual}).called(${assertion.expected || 1});`;
            case 'custom':
                return `expect(${assertion.actual}, ${assertion.matcher});`;
            default:
                return `// TODO: Convert assertion type ${assertion.type}`;
        }
    }
    /**
     * Convert assertion to Jest matcher
     */
    convertAssertionToJest(assertion) {
        const negation = assertion.negated ? '.not' : '';
        switch (assertion.type) {
            case 'equals':
                return `expect(${assertion.actual})${negation}.toBe(${JSON.stringify(assertion.expected)});`;
            case 'contains':
                return `expect(${assertion.actual})${negation}.toContain(${JSON.stringify(assertion.expected)});`;
            case 'throws':
                return `expect(() => ${assertion.actual})${negation}.toThrow(${assertion.expected});`;
            case 'rendered':
                return `expect(screen.${assertion.matcher})${negation}.toBeInTheDocument();`;
            case 'called':
                return `expect(${assertion.actual})${negation}.toHaveBeenCalledTimes(${assertion.expected || 1});`;
            case 'custom':
                return `expect(${assertion.actual})${negation}.${assertion.matcher};`;
            default:
                return `// TODO: Convert assertion type ${assertion.type}`;
        }
    }
    /**
     * Parse React Jest test file
     */
    parseReactTest(content) {
        // Simplified parser - in production would use proper AST parsing
        const imports = [];
        const mocks = [];
        const testCases = [];
        // Extract imports
        const importRegex = /import\s+.*?from\s+['"].*?['"]/g;
        const importMatches = content.match(importRegex);
        if (importMatches) {
            imports.push(...importMatches);
        }
        // Extract test cases (simplified)
        const testRegex = /(?:it|test)\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:async\s*)?\(\)\s*=>\s*{([^}]+)}/g;
        let match;
        while ((match = testRegex.exec(content)) !== null) {
            testCases.push({
                name: match[1],
                type: 'unit',
                assertions: [],
                async: content.includes('async'),
            });
        }
        return {
            framework: 'react',
            imports,
            testSuite: {
                name: 'Test Suite',
                testCases,
            },
            mocks,
        };
    }
    /**
     * Parse Flutter widget test file
     */
    parseFlutterTest(content) {
        // Simplified parser - in production would use Dart analyzer
        const imports = [];
        const mocks = [];
        const testCases = [];
        // Extract imports
        const importRegex = /import\s+['"][^'"]+['"]/g;
        const importMatches = content.match(importRegex);
        if (importMatches) {
            imports.push(...importMatches);
        }
        // Extract test cases (simplified)
        const testRegex = /(?:test|testWidgets)\s*\(\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = testRegex.exec(content)) !== null) {
            testCases.push({
                name: match[1],
                type: content.includes('testWidgets') ? 'widget' : 'unit',
                assertions: [],
            });
        }
        return {
            framework: 'flutter',
            imports,
            testSuite: {
                name: 'Test Suite',
                testCases,
            },
            mocks,
        };
    }
    /**
     * Generate test stub for unconvertible tests
     */
    generateTestStub(testName, framework, reason) {
        if (framework === 'flutter') {
            return `
    test('${testName}', () {
      // TODO: Manual conversion required
      // Reason: ${reason}
      // Original test could not be automatically converted
      fail('Test not implemented');
    });`;
        }
        else {
            return `
  it('${testName}', () => {
    // TODO: Manual conversion required
    // Reason: ${reason}
    // Original test could not be automatically converted
    throw new Error('Test not implemented');
  });`;
        }
    }
}
exports.TestConverter = TestConverter;
