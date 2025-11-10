import { TestConverter, TestFile, TestCase, TestAssertion } from '../testing/test-converter';

describe('TestConverter', () => {
  let converter: TestConverter;

  beforeEach(() => {
    converter = new TestConverter();
  });

  describe('convertReactToFlutter', () => {
    it('should convert basic React test to Flutter', () => {
      const testFile: TestFile = {
        framework: 'react',
        imports: ["import { MyComponent } from './MyComponent'"],
        testSuite: {
          name: 'MyComponent Tests',
          testCases: [
            {
              name: 'should render correctly',
              type: 'unit',
              assertions: [
                {
                  type: 'equals',
                  actual: 'result',
                  expected: true,
                  matcher: 'equals',
                },
              ],
            },
          ],
        },
        mocks: [],
      };

      const result = converter.convertReactToFlutter(testFile);

      expect(result).toContain("import 'package:flutter/material.dart'");
      expect(result).toContain("import 'package:flutter_test/flutter_test.dart'");
      expect(result).toContain("group('MyComponent Tests'");
      expect(result).toContain("test('should render correctly'");
      expect(result).toContain('expect(result, equals(true))');
    });

    it('should convert widget test with setup', () => {
      const testFile: TestFile = {
        framework: 'react',
        imports: [],
        testSuite: {
          name: 'Widget Tests',
          setup: ['final widget = MyWidget();'],
          testCases: [
            {
              name: 'should display text',
              type: 'widget',
              assertions: [
                {
                  type: 'rendered',
                  actual: 'text("Hello")',
                  matcher: 'text("Hello")',
                },
              ],
            },
          ],
        },
        mocks: [],
      };

      const result = converter.convertReactToFlutter(testFile);

      expect(result).toContain('setUp(() {');
      expect(result).toContain('final widget = MyWidget();');
      expect(result).toContain('testWidgets(');
      expect(result).toContain('findsOneWidget');
    });

    it('should throw error for non-React test file', () => {
      const testFile: TestFile = {
        framework: 'flutter',
        imports: [],
        testSuite: { name: 'Test', testCases: [] },
        mocks: [],
      };

      expect(() => converter.convertReactToFlutter(testFile)).toThrow(
        'Input must be a React test file'
      );
    });
  });

  describe('convertFlutterToReact', () => {
    it('should convert basic Flutter test to React', () => {
      const testFile: TestFile = {
        framework: 'flutter',
        imports: ["import 'package:my_app/my_component.dart'"],
        testSuite: {
          name: 'MyComponent Tests',
          testCases: [
            {
              name: 'should work correctly',
              type: 'unit',
              assertions: [
                {
                  type: 'equals',
                  actual: 'result',
                  expected: 42,
                  matcher: 'equals',
                },
              ],
            },
          ],
        },
        mocks: [],
      };

      const result = converter.convertFlutterToReact(testFile);

      expect(result).toContain("import React from 'react'");
      expect(result).toContain("import { render, screen, fireEvent, waitFor } from '@testing-library/react'");
      expect(result).toContain("describe('MyComponent Tests'");
      expect(result).toContain("it('should work correctly'");
      expect(result).toContain('expect(result).toBe(42)');
    });

    it('should convert async test', () => {
      const testFile: TestFile = {
        framework: 'flutter',
        imports: [],
        testSuite: {
          name: 'Async Tests',
          testCases: [
            {
              name: 'should handle async operation',
              type: 'unit',
              async: true,
              assertions: [
                {
                  type: 'equals',
                  actual: 'await fetchData()',
                  expected: 'data',
                  matcher: 'equals',
                },
              ],
            },
          ],
        },
        mocks: [],
      };

      const result = converter.convertFlutterToReact(testFile);

      expect(result).toContain('async ()');
      expect(result).toContain('expect(await fetchData()).toBe("data")');
    });

    it('should throw error for non-Flutter test file', () => {
      const testFile: TestFile = {
        framework: 'react',
        imports: [],
        testSuite: { name: 'Test', testCases: [] },
        mocks: [],
      };

      expect(() => converter.convertFlutterToReact(testFile)).toThrow(
        'Input must be a Flutter test file'
      );
    });
  });

  describe('assertion conversion', () => {
    it('should convert equals assertion to Flutter', () => {
      const testFile: TestFile = {
        framework: 'react',
        imports: [],
        testSuite: {
          name: 'Test',
          testCases: [
            {
              name: 'test',
              type: 'unit',
              assertions: [
                {
                  type: 'equals',
                  actual: 'value',
                  expected: 'expected',
                  matcher: 'equals',
                },
              ],
            },
          ],
        },
        mocks: [],
      };

      const result = converter.convertReactToFlutter(testFile);
      expect(result).toContain('expect(value, equals("expected"))');
    });

    it('should convert contains assertion to Flutter', () => {
      const testFile: TestFile = {
        framework: 'react',
        imports: [],
        testSuite: {
          name: 'Test',
          testCases: [
            {
              name: 'test',
              type: 'unit',
              assertions: [
                {
                  type: 'contains',
                  actual: 'list',
                  expected: 'item',
                  matcher: 'contains',
                },
              ],
            },
          ],
        },
        mocks: [],
      };

      const result = converter.convertReactToFlutter(testFile);
      expect(result).toContain('expect(list, contains("item"))');
    });

    it('should convert throws assertion to Flutter', () => {
      const testFile: TestFile = {
        framework: 'react',
        imports: [],
        testSuite: {
          name: 'Test',
          testCases: [
            {
              name: 'test',
              type: 'unit',
              assertions: [
                {
                  type: 'throws',
                  actual: 'throwError()',
                  expected: 'Exception',
                  matcher: 'throws',
                },
              ],
            },
          ],
        },
        mocks: [],
      };

      const result = converter.convertReactToFlutter(testFile);
      expect(result).toContain('expect(() => throwError(), throwsA(isA<Exception>()))');
    });

    it('should convert negated assertion to Flutter', () => {
      const testFile: TestFile = {
        framework: 'react',
        imports: [],
        testSuite: {
          name: 'Test',
          testCases: [
            {
              name: 'test',
              type: 'unit',
              assertions: [
                {
                  type: 'equals',
                  actual: 'value',
                  expected: 'wrong',
                  matcher: 'equals',
                  negated: true,
                },
              ],
            },
          ],
        },
        mocks: [],
      };

      const result = converter.convertReactToFlutter(testFile);
      expect(result).toContain('expect(value, isNot("wrong"))');
    });
  });

  describe('parseReactTest', () => {
    it('should parse basic React test', () => {
      const content = `
        import React from 'react';
        import { render } from '@testing-library/react';
        
        describe('MyComponent', () => {
          it('should render', () => {
            expect(true).toBe(true);
          });
        });
      `;

      const result = converter.parseReactTest(content);

      expect(result.framework).toBe('react');
      expect(result.imports.length).toBeGreaterThan(0);
    });

    it('should detect async tests', () => {
      const content = `
        it('should fetch data', async () => {
          const data = await fetchData();
          expect(data).toBeDefined();
        });
      `;

      const result = converter.parseReactTest(content);

      expect(result.testSuite.testCases.some(tc => tc.async)).toBe(true);
    });
  });

  describe('parseFlutterTest', () => {
    it('should parse basic Flutter test', () => {
      const content = `
        import 'package:flutter_test/flutter_test.dart';
        
        void main() {
          test('should work', () {
            expect(true, equals(true));
          });
        }
      `;

      const result = converter.parseFlutterTest(content);

      expect(result.framework).toBe('flutter');
      expect(result.imports.length).toBeGreaterThan(0);
    });

    it('should detect widget tests', () => {
      const content = `
        testWidgets('should render widget', (WidgetTester tester) async {
          await tester.pumpWidget(MyWidget());
          expect(find.text('Hello'), findsOneWidget);
        });
      `;

      const result = converter.parseFlutterTest(content);

      expect(result.testSuite.testCases.some(tc => tc.type === 'widget')).toBe(true);
    });
  });

  describe('generateTestStub', () => {
    it('should generate Flutter test stub', () => {
      const stub = converter.generateTestStub(
        'complex test',
        'flutter',
        'Uses unsupported testing library'
      );

      expect(stub).toContain("test('complex test'");
      expect(stub).toContain('// TODO: Manual conversion required');
      expect(stub).toContain('// Reason: Uses unsupported testing library');
      expect(stub).toContain("fail('Test not implemented')");
    });

    it('should generate React test stub', () => {
      const stub = converter.generateTestStub(
        'complex test',
        'react',
        'Uses custom matchers'
      );

      expect(stub).toContain("it('complex test'");
      expect(stub).toContain('// TODO: Manual conversion required');
      expect(stub).toContain('// Reason: Uses custom matchers');
      expect(stub).toContain("throw new Error('Test not implemented')");
    });
  });

  describe('setup and teardown', () => {
    it('should convert beforeEach to setUp', () => {
      const testFile: TestFile = {
        framework: 'react',
        imports: [],
        testSuite: {
          name: 'Test',
          setup: ['const value = 42;', 'initializeTest();'],
          testCases: [],
        },
        mocks: [],
      };

      const result = converter.convertReactToFlutter(testFile);

      expect(result).toContain('setUp(() {');
      expect(result).toContain('const value = 42;');
      expect(result).toContain('initializeTest();');
    });

    it('should convert afterEach to tearDown', () => {
      const testFile: TestFile = {
        framework: 'react',
        imports: [],
        testSuite: {
          name: 'Test',
          teardown: ['cleanup();', 'resetState();'],
          testCases: [],
        },
        mocks: [],
      };

      const result = converter.convertReactToFlutter(testFile);

      expect(result).toContain('tearDown(() {');
      expect(result).toContain('cleanup();');
      expect(result).toContain('resetState();');
    });
  });
});
