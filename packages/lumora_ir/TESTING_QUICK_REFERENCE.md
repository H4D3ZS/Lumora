# Testing Support - Quick Reference

## Quick Start

```typescript
import { TestConverter, MockConverter } from '@lumora/ir';

const testConverter = new TestConverter();
const mockConverter = new MockConverter();
```

## Common Operations

### Convert React Test to Flutter

```typescript
const reactTest: TestFile = {
  framework: 'react',
  imports: ["import { MyComponent } from './MyComponent'"],
  testSuite: {
    name: 'MyComponent Tests',
    testCases: [
      {
        name: 'should render',
        type: 'unit',
        assertions: [
          { type: 'equals', actual: 'result', expected: true, matcher: 'equals' }
        ]
      }
    ]
  },
  mocks: []
};

const flutterTest = testConverter.convertReactToFlutter(reactTest);
```

### Convert Flutter Test to React

```typescript
const flutterTest: TestFile = {
  framework: 'flutter',
  imports: ["import 'package:flutter_test/flutter_test.dart'"],
  testSuite: {
    name: 'Widget Tests',
    testCases: [
      {
        name: 'should work',
        type: 'unit',
        assertions: [
          { type: 'equals', actual: 'value', expected: 42, matcher: 'equals' }
        ]
      }
    ]
  },
  mocks: []
};

const reactTest = testConverter.convertFlutterToReact(flutterTest);
```

### Convert Mocks

```typescript
const mock: MockDefinition = {
  name: 'UserService',
  type: 'UserService',
  methods: [
    {
      name: 'getUser',
      parameters: [{ name: 'id', type: 'string' }],
      returnValue: { id: '123', name: 'John' }
    }
  ]
};

// React to Flutter
const flutterMock = mockConverter.convertReactMockToFlutter(mock);

// Flutter to React
const reactMock = mockConverter.convertFlutterMockToReact(mock);
```

### Generate Test Stub

```typescript
const stub = testConverter.generateTestStub(
  'complex test',
  'flutter',
  'Uses unsupported library'
);
```

## Assertion Types

| Type | React Example | Flutter Example |
|------|---------------|-----------------|
| `equals` | `expect(x).toBe(y)` | `expect(x, equals(y))` |
| `contains` | `expect(x).toContain(y)` | `expect(x, contains(y))` |
| `throws` | `expect(() => x).toThrow()` | `expect(() => x, throwsA(isA<T>()))` |
| `rendered` | `expect(el).toBeInTheDocument()` | `expect(find.byWidget(el), findsOneWidget)` |
| `called` | `expect(fn).toHaveBeenCalled()` | `verify(fn()).called(1)` |

## Mock Patterns

### React Mock Setup

```typescript
const mocks: MockDefinition[] = [
  {
    name: 'service',
    type: 'Service',
    methods: [
      { name: 'getData', returnValue: 'data' }
    ]
  }
];

const setup = mockConverter.generateReactMockSetup(mocks);
// Output: service.getData.mockReturnValue("data");
```

### Flutter Mock Setup

```typescript
const setup = mockConverter.generateFlutterMockSetup(mocks);
// Output: when(mockService.getData()).thenReturn("data");
```

## Spy/Verify Conversion

```typescript
// Jest to Flutter
mockConverter.convertSpyToVerify('expect(fn).toHaveBeenCalled()');
// => verify(fn()).called(1);

// Flutter to Jest
mockConverter.convertVerifyToSpy('verify(fn()).called(1)');
// => expect(fn).toHaveBeenCalled();
```

## Test Structure

### React
```typescript
{
  framework: 'react',
  testSuite: {
    name: 'Test Suite',
    setup: ['beforeEach code'],
    teardown: ['afterEach code'],
    testCases: [...]
  }
}
```

### Flutter
```typescript
{
  framework: 'flutter',
  testSuite: {
    name: 'Test Suite',
    setup: ['setUp code'],
    teardown: ['tearDown code'],
    testCases: [...]
  }
}
```

## CLI Usage (Future)

```bash
# Convert React test to Flutter
lumora convert-test --from react --to flutter test.spec.ts

# Convert Flutter test to React
lumora convert-test --from flutter --to react test_test.dart

# Generate test stub
lumora generate-test-stub --framework flutter --name "complex test"
```

## Best Practices

1. ✅ Keep tests simple and focused
2. ✅ Use standard testing patterns
3. ✅ Review generated tests before committing
4. ✅ Add manual tests for complex scenarios
5. ✅ Document test conversion limitations

## Common Issues

### Issue: Custom matchers not converted
**Solution:** Use test stubs for custom matchers

### Issue: Complex async patterns
**Solution:** Simplify async logic or use manual conversion

### Issue: Framework-specific utilities
**Solution:** Create equivalent utilities in target framework

## See Also

- [Full Documentation](src/testing/README.md)
- [Examples](examples/test-conversion-example.ts)
- [Implementation Summary](TASK_18_IMPLEMENTATION_SUMMARY.md)
