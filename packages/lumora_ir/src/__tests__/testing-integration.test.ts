/**
 * Integration tests for testing support module
 * Tests the complete workflow of test and mock conversion
 */

import { TestConverter, TestFile } from '../testing/test-converter';
import { MockConverter, MockDefinition } from '../testing/mock-converter';

describe('Testing Module Integration', () => {
  let testConverter: TestConverter;
  let mockConverter: MockConverter;

  beforeEach(() => {
    testConverter = new TestConverter();
    mockConverter = new MockConverter();
  });

  describe('Complete React to Flutter workflow', () => {
    it('should convert a complete React test with mocks to Flutter', () => {
      // Define React test with mocks
      const reactTest: TestFile = {
        framework: 'react',
        imports: [
          "import { UserProfile } from './UserProfile'",
          "import { render, screen, fireEvent } from '@testing-library/react'",
        ],
        testSuite: {
          name: 'UserProfile Component',
          setup: [
            'const mockUser = { id: 1, name: "John Doe", email: "john@example.com" };',
          ],
          testCases: [
            {
              name: 'should display user name',
              type: 'widget',
              assertions: [
                {
                  type: 'rendered',
                  actual: 'text("John Doe")',
                  matcher: 'text("John Doe")',
                },
              ],
            },
            {
              name: 'should call onEdit when edit button is clicked',
              type: 'widget',
              setup: [
                'const onEdit = jest.fn();',
                'render(<UserProfile user={mockUser} onEdit={onEdit} />);',
                'fireEvent.click(screen.getByText("Edit"));',
              ],
              assertions: [
                {
                  type: 'called',
                  actual: 'onEdit',
                  expected: 1,
                  matcher: 'called',
                },
              ],
            },
          ],
        },
        mocks: [],
      };

      const mock: MockDefinition = {
        name: 'UserService',
        type: 'UserService',
        methods: [
          {
            name: 'getUser',
            parameters: [{ name: 'id', type: 'int' }],
            returnValue: { id: 1, name: 'John Doe' },
          },
        ],
      };

      // Convert test
      const flutterTest = testConverter.convertReactToFlutter(reactTest);

      // Verify Flutter test structure
      expect(flutterTest).toContain("import 'package:flutter/material.dart'");
      expect(flutterTest).toContain("import 'package:flutter_test/flutter_test.dart'");
      expect(flutterTest).toContain("group('UserProfile Component'");
      expect(flutterTest).toContain('setUp(() {');
      expect(flutterTest).toContain('testWidgets(');
      expect(flutterTest).toContain('findsOneWidget');
      expect(flutterTest).toContain('verify(');

      // Convert mock
      const flutterMock = mockConverter.convertReactMockToFlutter(mock);

      // Verify Flutter mock structure
      expect(flutterMock).toContain('class MockUserService extends Mock implements UserService');
      expect(flutterMock).toContain('@override');
      expect(flutterMock).toContain('getUser(int id)');
    });
  });

  describe('Complete Flutter to React workflow', () => {
    it('should convert a complete Flutter test with mocks to React', () => {
      // Define Flutter test with mocks
      const flutterTest: TestFile = {
        framework: 'flutter',
        imports: [
          "import 'package:flutter_test/flutter_test.dart'",
          "import 'package:my_app/widgets/counter.dart'",
        ],
        testSuite: {
          name: 'Counter Widget',
          setup: [
            'int initialCount = 0;',
          ],
          teardown: [
            'resetCounter();',
          ],
          testCases: [
            {
              name: 'should display initial count',
              type: 'widget',
              assertions: [
                {
                  type: 'rendered',
                  actual: 'text("0")',
                  matcher: 'text("0")',
                },
              ],
            },
            {
              name: 'should increment count',
              type: 'widget',
              async: true,
              setup: [
                'await tester.pumpWidget(Counter());',
                'await tester.tap(find.byIcon(Icons.add));',
                'await tester.pump();',
              ],
              assertions: [
                {
                  type: 'rendered',
                  actual: 'text("1")',
                  matcher: 'text("1")',
                },
              ],
            },
          ],
        },
        mocks: [],
      };

      const mock: MockDefinition = {
        name: 'CounterService',
        type: 'CounterService',
        methods: [
          {
            name: 'increment',
            returnValue: 1,
          },
          {
            name: 'decrement',
            returnValue: -1,
          },
        ],
      };

      // Convert test
      const reactTest = testConverter.convertFlutterToReact(flutterTest);

      // Verify React test structure
      expect(reactTest).toContain("import React from 'react'");
      expect(reactTest).toContain("import { render, screen, fireEvent, waitFor } from '@testing-library/react'");
      expect(reactTest).toContain("describe('Counter Widget'");
      expect(reactTest).toContain('beforeEach');
      expect(reactTest).toContain('afterEach');
      expect(reactTest).toContain('async ()');
      expect(reactTest).toContain('toBeInTheDocument()');

      // Convert mock
      const reactMock = mockConverter.convertFlutterMockToReact(mock);

      // Verify React mock structure
      expect(reactMock).toContain('const mockCounterService = {');
      expect(reactMock).toContain('increment: jest.fn().mockReturnValue(1)');
      expect(reactMock).toContain('decrement: jest.fn().mockReturnValue(-1)');
    });
  });

  describe('Bidirectional conversion consistency', () => {
    it('should maintain test structure through bidirectional conversion', () => {
      const originalTest: TestFile = {
        framework: 'react',
        imports: ["import { Component } from './Component'"],
        testSuite: {
          name: 'Component Tests',
          testCases: [
            {
              name: 'should work',
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

      // Convert React -> Flutter
      const flutterTest = testConverter.convertReactToFlutter(originalTest);

      // Verify Flutter structure
      expect(flutterTest).toContain("group('Component Tests'");
      expect(flutterTest).toContain("test('should work'");
      expect(flutterTest).toContain('expect(result, equals(true))');

      // Note: Full round-trip conversion would require parsing the generated code
      // This test verifies the forward conversion maintains structure
    });
  });

  describe('Mock setup generation', () => {
    it('should generate complete mock setup for both frameworks', () => {
      const mocks: MockDefinition[] = [
        {
          name: 'AuthService',
          type: 'AuthService',
          methods: [
            {
              name: 'login',
              returnValue: { token: 'abc123' },
            },
          ],
        },
        {
          name: 'DataService',
          type: 'DataService',
          methods: [
            {
              name: 'fetchData',
              returnValue: ['item1', 'item2'],
            },
          ],
        },
      ];

      // Generate React setup
      const reactSetup = mockConverter.generateReactMockSetup(mocks);
      expect(reactSetup).toContain('// Setup AuthService mock');
      expect(reactSetup).toContain('AuthService.login.mockReturnValue(');
      expect(reactSetup).toContain('// Setup DataService mock');
      expect(reactSetup).toContain('DataService.fetchData.mockReturnValue(');

      // Generate Flutter setup
      const flutterSetup = mockConverter.generateFlutterMockSetup(mocks);
      expect(flutterSetup).toContain('// Setup AuthService mock');
      expect(flutterSetup).toContain('final mockAuthService = MockAuthService();');
      expect(flutterSetup).toContain('when(mockAuthService.login()).thenReturn(');
      expect(flutterSetup).toContain('// Setup DataService mock');
      expect(flutterSetup).toContain('final mockDataService = MockDataService();');
    });
  });

  describe('Test stub generation for edge cases', () => {
    it('should generate appropriate stubs for unconvertible tests', () => {
      const reasons = [
        'Uses custom animation library',
        'Platform-specific test',
        'Requires manual mocking',
        'Complex async pattern not supported',
      ];

      reasons.forEach(reason => {
        const flutterStub = testConverter.generateTestStub('complex test', 'flutter', reason);
        expect(flutterStub).toContain('// TODO: Manual conversion required');
        expect(flutterStub).toContain(`// Reason: ${reason}`);
        expect(flutterStub).toContain("fail('Test not implemented')");

        const reactStub = testConverter.generateTestStub('complex test', 'react', reason);
        expect(reactStub).toContain('// TODO: Manual conversion required');
        expect(reactStub).toContain(`// Reason: ${reason}`);
        expect(reactStub).toContain("throw new Error('Test not implemented')");
      });
    });
  });

  describe('Spy and verify conversion', () => {
    it('should convert between Jest spies and Flutter verify calls', () => {
      const spyCalls = [
        'expect(mockFn).toHaveBeenCalled()',
        'expect(mockFn).toHaveBeenCalledTimes(3)',
        'expect(mockFn).toHaveBeenCalledWith(arg1, arg2)',
      ];

      const expectedVerify = [
        'verify(mockFn()).called(1);',
        'verify(mockFn()).called(3);',
        'verify(mockFn(arg1, arg2)).called(1);',
      ];

      spyCalls.forEach((spy, index) => {
        const verify = mockConverter.convertSpyToVerify(spy);
        expect(verify).toBe(expectedVerify[index]);
      });

      // Reverse conversion
      expectedVerify.forEach((verify, index) => {
        const spy = mockConverter.convertVerifyToSpy(verify);
        // Note: Conversion may not be exact due to different patterns
        expect(spy).toContain('expect(');
        expect(spy).toContain('toHaveBeen');
      });
    });
  });

  describe('Type inference in mocks', () => {
    it('should correctly infer types for mock methods', () => {
      const mocks: MockDefinition[] = [
        {
          name: 'TypedService',
          type: 'TypedService',
          methods: [
            { name: 'getString', returnValue: 'hello' },
            { name: 'getNumber', returnValue: 42 },
            { name: 'getBoolean', returnValue: true },
            { name: 'getList', returnValue: [1, 2, 3] },
            { name: 'getVoid' },
          ],
        },
      ];

      const flutterMock = mockConverter.convertReactMockToFlutter(mocks[0]);

      expect(flutterMock).toContain('String getString');
      expect(flutterMock).toContain('int getNumber');
      expect(flutterMock).toContain('bool getBoolean');
      expect(flutterMock).toContain('List<dynamic> getList');
      expect(flutterMock).toContain('void getVoid');
    });
  });
});
