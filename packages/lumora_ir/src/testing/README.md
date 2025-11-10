# Testing Support Module

This module provides comprehensive test conversion between React (Jest/React Testing Library) and Flutter (widget tests) frameworks.

## Features

### Test Conversion
- Convert React Jest tests to Flutter widget tests
- Convert Flutter widget tests to React Jest tests
- Preserve test structure (setup, teardown, test cases)
- Convert assertions between frameworks
- Handle async tests

### Mock Conversion
- Convert React Jest mocks to Flutter mocks
- Convert Flutter mocks to React Jest mocks
- Generate mock setup code
- Convert spy/verify patterns

### Test Stub Generation
- Generate test stubs for unconvertible tests
- Add TODO comments with conversion reasons
- Maintain test structure for manual completion

## Usage

### Basic Test Conversion

```typescript
import { TestConverter, TestFile } from '@lumora/ir';

const converter = new TestConverter();

// Define a React test
const reactTest: TestFile = {
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

// Convert to Flutter
const flutterTest = converter.convertReactToFlutter(reactTest);
console.log(flutterTest);
```

### Mock Conversion

```typescript
import { MockConverter, MockDefinition } from '@lumora/ir';

const mockConverter = new MockConverter();

// Define a mock
const mock: MockDefinition = {
  name: 'UserService',
  type: 'UserService',
  methods: [
    {
      name: 'getUser',
      parameters: [{ name: 'id', type: 'string' }],
      returnValue: { id: '123', name: 'John' },
    },
  ],
};

// Convert to Flutter mock
const flutterMock = mockConverter.convertReactMockToFlutter(mock);

// Convert to React mock
const reactMock = mockConverter.convertFlutterMockToReact(mock);
```

### Test Stub Generation

```typescript
import { TestConverter } from '@lumora/ir';

const converter = new TestConverter();

// Generate a Flutter test stub
const stub = converter.generateTestStub(
  'complex animation test',
  'flutter',
  'Custom animation library not supported'
);

console.log(stub);
// Output:
// test('complex animation test', () {
//   // TODO: Manual conversion required
//   // Reason: Custom animation library not supported
//   fail('Test not implemented');
// });
```

## Assertion Mapping

### React to Flutter

| React (Jest) | Flutter |
|--------------|---------|
| `expect(x).toBe(y)` | `expect(x, equals(y))` |
| `expect(x).toContain(y)` | `expect(x, contains(y))` |
| `expect(() => x).toThrow()` | `expect(() => x, throwsA(isA<Exception>()))` |
| `expect(x).not.toBe(y)` | `expect(x, isNot(y))` |
| `expect(element).toBeInTheDocument()` | `expect(find.byWidget(element), findsOneWidget)` |

### Flutter to React

| Flutter | React (Jest) |
|---------|--------------|
| `expect(x, equals(y))` | `expect(x).toBe(y)` |
| `expect(x, contains(y))` | `expect(x).toContain(y)` |
| `expect(() => x, throwsA(isA<T>()))` | `expect(() => x).toThrow(T)` |
| `expect(x, isNot(y))` | `expect(x).not.toBe(y)` |
| `expect(find.text('Hello'), findsOneWidget)` | `expect(screen.getByText('Hello')).toBeInTheDocument()` |

## Mock Patterns

### React Mock Pattern

```typescript
const mockUserService = {
  getUser: jest.fn().mockReturnValue({ id: 1, name: 'John' }),
  updateUser: jest.fn().mockReturnValue(true),
};

// Setup
mockUserService.getUser.mockReturnValue({ id: 2, name: 'Jane' });

// Verify
expect(mockUserService.getUser).toHaveBeenCalled();
expect(mockUserService.getUser).toHaveBeenCalledTimes(2);
expect(mockUserService.getUser).toHaveBeenCalledWith('123');
```

### Flutter Mock Pattern

```dart
class MockUserService extends Mock implements UserService {}

void main() {
  final mockUserService = MockUserService();
  
  // Setup
  when(mockUserService.getUser()).thenReturn(User(id: 1, name: 'John'));
  
  // Verify
  verify(mockUserService.getUser()).called(1);
  verify(mockUserService.getUser()).called(2);
  verify(mockUserService.getUser('123')).called(1);
}
```

## Test Structure Mapping

### React Test Structure

```typescript
describe('Component Tests', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Teardown
  });

  it('should work', () => {
    expect(true).toBe(true);
  });

  it('should handle async', async () => {
    const result = await fetchData();
    expect(result).toBeDefined();
  });
});
```

### Flutter Test Structure

```dart
void main() {
  group('Component Tests', () {
    setUp(() {
      // Setup
    });

    tearDown(() {
      // Teardown
    });

    test('should work', () {
      expect(true, equals(true));
    });

    test('should handle async', () async {
      final result = await fetchData();
      expect(result, isNotNull);
    });
  });
}
```

## Supported Test Types

### Unit Tests
- Basic assertions
- Async/await operations
- Error handling
- Mock verification

### Widget/Component Tests
- Rendering tests
- User interaction tests
- State management tests
- Lifecycle tests

### Integration Tests
- End-to-end flows
- Multiple component interactions
- API integration tests

## Limitations

### Not Automatically Convertible
- Custom test utilities
- Framework-specific test helpers
- Complex animation tests
- Platform-specific tests
- Tests using unsupported libraries

For these cases, the converter generates test stubs with TODO comments indicating manual conversion is required.

## Best Practices

1. **Keep Tests Simple**: Simple tests convert more reliably
2. **Use Standard Patterns**: Stick to standard Jest/Flutter test patterns
3. **Document Complex Logic**: Add comments for complex test scenarios
4. **Review Generated Tests**: Always review and test generated code
5. **Handle Edge Cases**: Add manual tests for edge cases that don't convert well

## Examples

See `examples/test-conversion-example.ts` for comprehensive examples of:
- React to Flutter test conversion
- Flutter to React test conversion
- Mock conversion
- Test stub generation
- Mock setup code generation
- Spy/verify conversion

## API Reference

### TestConverter

#### Methods
- `convertReactToFlutter(testFile: TestFile): string` - Convert React test to Flutter
- `convertFlutterToReact(testFile: TestFile): string` - Convert Flutter test to React
- `parseReactTest(content: string): TestFile` - Parse React test file
- `parseFlutterTest(content: string): TestFile` - Parse Flutter test file
- `generateTestStub(name: string, framework: 'react' | 'flutter', reason: string): string` - Generate test stub

### MockConverter

#### Methods
- `convertReactMockToFlutter(mock: MockDefinition): string` - Convert React mock to Flutter
- `convertFlutterMockToReact(mock: MockDefinition): string` - Convert Flutter mock to React
- `parseReactMock(content: string): MockDefinition[]` - Parse React mocks
- `parseFlutterMock(content: string): MockDefinition[]` - Parse Flutter mocks
- `generateReactMockSetup(mocks: MockDefinition[]): string` - Generate React mock setup
- `generateFlutterMockSetup(mocks: MockDefinition[]): string` - Generate Flutter mock setup
- `convertSpyToVerify(spyCall: string): string` - Convert Jest spy to Flutter verify
- `convertVerifyToSpy(verifyCall: string): string` - Convert Flutter verify to Jest spy

## Requirements Satisfied

This module satisfies Requirement 19 from the Lumora Bidirectional Framework Phase 1 requirements:

- ✅ 19.1: Convert React tests (Jest) to Flutter widget tests
- ✅ 19.2: Convert Flutter widget tests to React tests (Jest/React Testing Library)
- ✅ 19.3: Convert test assertions using equivalent matchers
- ✅ 19.4: Generate equivalent mocks in target framework
- ✅ 19.5: Generate test stubs with TODO comments for unconvertible tests
