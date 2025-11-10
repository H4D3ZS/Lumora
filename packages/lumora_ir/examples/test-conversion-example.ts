/**
 * Test Conversion Example
 * Demonstrates converting tests between React and Flutter
 */

import { TestConverter, MockConverter, TestFile, MockDefinition } from '../src/index';

// Example 1: Convert React test to Flutter
function exampleReactToFlutter() {
  console.log('=== Example 1: React to Flutter Test Conversion ===\n');

  const converter = new TestConverter();

  const reactTest: TestFile = {
    framework: 'react',
    imports: [
      "import { Counter } from './Counter'",
      "import { render, screen, fireEvent } from '@testing-library/react'",
    ],
    testSuite: {
      name: 'Counter Component',
      setup: [
        'const initialCount = 0;',
      ],
      testCases: [
        {
          name: 'should render initial count',
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
          name: 'should increment count on button press',
          type: 'widget',
          setup: [
            'await tester.pumpWidget(Counter());',
            'await tester.tap(find.byType(ElevatedButton));',
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

  const flutterTest = converter.convertReactToFlutter(reactTest);
  console.log('Generated Flutter Test:\n');
  console.log(flutterTest);
  console.log('\n');
}

// Example 2: Convert Flutter test to React
function exampleFlutterToReact() {
  console.log('=== Example 2: Flutter to React Test Conversion ===\n');

  const converter = new TestConverter();

  const flutterTest: TestFile = {
    framework: 'flutter',
    imports: [
      "import 'package:flutter_test/flutter_test.dart'",
      "import 'package:my_app/widgets/user_profile.dart'",
    ],
    testSuite: {
      name: 'UserProfile Widget',
      testCases: [
        {
          name: 'should display user name',
          type: 'unit',
          assertions: [
            {
              type: 'equals',
              actual: 'user.name',
              expected: 'John Doe',
              matcher: 'equals',
            },
          ],
        },
        {
          name: 'should handle async data loading',
          type: 'unit',
          async: true,
          assertions: [
            {
              type: 'equals',
              actual: 'await fetchUserData()',
              expected: 'userData',
              matcher: 'equals',
            },
          ],
        },
      ],
    },
    mocks: [],
  };

  const reactTest = converter.convertFlutterToReact(flutterTest);
  console.log('Generated React Test:\n');
  console.log(reactTest);
  console.log('\n');
}

// Example 3: Convert React mocks to Flutter
function exampleMockConversion() {
  console.log('=== Example 3: Mock Conversion ===\n');

  const mockConverter = new MockConverter();

  const reactMock: MockDefinition = {
    name: 'UserService',
    type: 'UserService',
    methods: [
      {
        name: 'getUser',
        parameters: [
          { name: 'id', type: 'string' },
        ],
        returnValue: { id: '123', name: 'John Doe', email: 'john@example.com' },
      },
      {
        name: 'updateUser',
        parameters: [
          { name: 'id', type: 'string' },
          { name: 'data', type: 'UserData' },
        ],
        returnValue: true,
      },
      {
        name: 'deleteUser',
        parameters: [
          { name: 'id', type: 'string' },
        ],
      },
    ],
  };

  console.log('React Mock to Flutter:\n');
  const flutterMock = mockConverter.convertReactMockToFlutter(reactMock);
  console.log(flutterMock);
  console.log('\n');

  console.log('Flutter Mock to React:\n');
  const reactMockCode = mockConverter.convertFlutterMockToReact(reactMock);
  console.log(reactMockCode);
  console.log('\n');
}

// Example 4: Generate test stubs for unconvertible tests
function exampleTestStubs() {
  console.log('=== Example 4: Test Stub Generation ===\n');

  const converter = new TestConverter();

  console.log('Flutter Test Stub:\n');
  const flutterStub = converter.generateTestStub(
    'should handle complex animation',
    'flutter',
    'Custom animation library not supported'
  );
  console.log(flutterStub);
  console.log('\n');

  console.log('React Test Stub:\n');
  const reactStub = converter.generateTestStub(
    'should integrate with third-party library',
    'react',
    'Third-party library requires manual mocking'
  );
  console.log(reactStub);
  console.log('\n');
}

// Example 5: Mock setup code generation
function exampleMockSetup() {
  console.log('=== Example 5: Mock Setup Code Generation ===\n');

  const mockConverter = new MockConverter();

  const mocks: MockDefinition[] = [
    {
      name: 'AuthService',
      type: 'AuthService',
      methods: [
        {
          name: 'login',
          returnValue: { token: 'abc123', userId: '456' },
        },
        {
          name: 'logout',
          returnValue: true,
        },
      ],
    },
    {
      name: 'DataService',
      type: 'DataService',
      methods: [
        {
          name: 'fetchData',
          returnValue: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
        },
      ],
    },
  ];

  console.log('React Mock Setup:\n');
  const reactSetup = mockConverter.generateReactMockSetup(mocks);
  console.log(reactSetup);
  console.log('\n');

  console.log('Flutter Mock Setup:\n');
  const flutterSetup = mockConverter.generateFlutterMockSetup(mocks);
  console.log(flutterSetup);
  console.log('\n');
}

// Example 6: Spy/Verify conversion
function exampleSpyVerifyConversion() {
  console.log('=== Example 6: Spy/Verify Conversion ===\n');

  const mockConverter = new MockConverter();

  console.log('Jest Spy to Flutter Verify:\n');
  const spyCalls = [
    'expect(mockFn).toHaveBeenCalled()',
    'expect(mockFn).toHaveBeenCalledTimes(3)',
    'expect(mockFn).toHaveBeenCalledWith(arg1, arg2)',
  ];

  spyCalls.forEach(call => {
    const flutterVerify = mockConverter.convertSpyToVerify(call);
    console.log(`  ${call}`);
    console.log(`  => ${flutterVerify}\n`);
  });

  console.log('Flutter Verify to Jest Spy:\n');
  const verifyCalls = [
    'verify(mockFn()).called(1)',
    'verify(mockFn()).called(3)',
    'verify(mockFn(arg1, arg2)).called(1)',
  ];

  verifyCalls.forEach(call => {
    const jestSpy = mockConverter.convertVerifyToSpy(call);
    console.log(`  ${call}`);
    console.log(`  => ${jestSpy}\n`);
  });
}

// Run all examples
function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Lumora Test Conversion Examples                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  exampleReactToFlutter();
  exampleFlutterToReact();
  exampleMockConversion();
  exampleTestStubs();
  exampleMockSetup();
  exampleSpyVerifyConversion();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         All Examples Completed Successfully!              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  exampleReactToFlutter,
  exampleFlutterToReact,
  exampleMockConversion,
  exampleTestStubs,
  exampleMockSetup,
  exampleSpyVerifyConversion,
};
