# Automatic Test Sync - Complete Example

## Overview

This document demonstrates how Lumora automatically converts test files between React and Flutter during development, just like it converts component files.

## Setup

```bash
# Start Lumora in universal mode
$ lumora start --mode universal

✓ Lumora started in Universal mode
✓ Watching React: web/src/**/*.{tsx,ts,test.tsx}
✓ Watching Flutter: lib/**/*.{dart} and test/**/*_test.dart
✓ Test sync: ENABLED
✓ Dev server: http://localhost:3000
✓ Mobile preview: Scan QR code
```

## Example 1: Writing React Test (Auto-Converts to Flutter)

### Step 1: Create React Component

```typescript
// web/src/components/Counter.tsx
import React, { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <View>
      <Text testID="count-text">Count: {count}</Text>
      <Button testID="increment-btn" onPress={() => setCount(count + 1)}>
        Increment
      </Button>
    </View>
  );
}
```

```bash
[12:00:00] File changed: web/src/components/Counter.tsx
[12:00:00] Converting to IR...
[12:00:00] ✓ Generated: lib/widgets/counter.dart
[12:00:00] ⚡ Sync completed in 156ms
```

### Step 2: Write React Test

```typescript
// web/src/components/__tests__/Counter.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Counter } from '../Counter';

describe('Counter Component', () => {
  it('should display initial count', () => {
    render(<Counter />);
    expect(screen.getByTestId('count-text')).toHaveTextContent('Count: 0');
  });

  it('should increment count when button pressed', () => {
    render(<Counter />);
    const button = screen.getByTestId('increment-btn');
    
    fireEvent.press(button);
    
    expect(screen.getByTestId('count-text')).toHaveTextContent('Count: 1');
  });

  it('should increment multiple times', () => {
    render(<Counter />);
    const button = screen.getByTestId('increment-btn');
    
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);
    
    expect(screen.getByTestId('count-text')).toHaveTextContent('Count: 3');
  });
});
```

### Step 3: Lumora Auto-Converts Test

```bash
[12:01:00] Test file changed: web/src/components/__tests__/Counter.test.tsx
[12:01:00] Detected: React test file
[12:01:00] Converting test to Flutter...
[12:01:00] ✓ Test converted: test/widgets/counter_test.dart
[12:01:00] ⚡ Test sync completed in 89ms
```

### Step 4: Generated Flutter Test (Automatic!)

```dart
// test/widgets/counter_test.dart (AUTO-GENERATED)
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/widgets/counter.dart';

void main() {
  group('Counter Component', () {
    testWidgets('should display initial count', (WidgetTester tester) async {
      await tester.pumpWidget(Counter());
      expect(find.text('Count: 0'), findsOneWidget);
    });

    testWidgets('should increment count when button pressed', (WidgetTester tester) async {
      await tester.pumpWidget(Counter());
      final button = find.byType(ElevatedButton);
      
      await tester.tap(button);
      await tester.pump();
      
      expect(find.text('Count: 1'), findsOneWidget);
    });

    testWidgets('should increment multiple times', (WidgetTester tester) async {
      await tester.pumpWidget(Counter());
      final button = find.byType(ElevatedButton);
      
      await tester.tap(button);
      await tester.tap(button);
      await tester.tap(button);
      await tester.pump();
      
      expect(find.text('Count: 3'), findsOneWidget);
    });
  });
}
```

### Step 5: Run Tests on Both Platforms

```bash
# Run React tests
$ npm test
PASS  src/components/__tests__/Counter.test.tsx
  Counter Component
    ✓ should display initial count (45ms)
    ✓ should increment count when button pressed (23ms)
    ✓ should increment multiple times (31ms)

# Run Flutter tests
$ flutter test
00:01 +3: All tests passed!
```

## Example 2: Writing Flutter Test (Auto-Converts to React)

### Step 1: Create Flutter Widget

```dart
// lib/widgets/user_profile.dart
import 'package:flutter/material.dart';

class UserProfile extends StatelessWidget {
  final String name;
  final String email;
  final VoidCallback onEdit;

  const UserProfile({
    Key? key,
    required this.name,
    required this.email,
    required this.onEdit,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        children: [
          Text(name, key: Key('name-text')),
          Text(email, key: Key('email-text')),
          ElevatedButton(
            key: Key('edit-button'),
            onPressed: onEdit,
            child: Text('Edit'),
          ),
        ],
      ),
    );
  }
}
```

```bash
[12:05:00] File changed: lib/widgets/user_profile.dart
[12:05:00] Converting to IR...
[12:05:00] ✓ Generated: web/src/components/UserProfile.tsx
[12:05:00] ⚡ Sync completed in 142ms
```

### Step 2: Write Flutter Test

```dart
// test/widgets/user_profile_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/widgets/user_profile.dart';

void main() {
  group('UserProfile Widget', () {
    testWidgets('should display user information', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: UserProfile(
            name: 'John Doe',
            email: 'john@example.com',
            onEdit: () {},
          ),
        ),
      );

      expect(find.text('John Doe'), findsOneWidget);
      expect(find.text('john@example.com'), findsOneWidget);
    });

    testWidgets('should call onEdit when button pressed', (WidgetTester tester) async {
      bool editCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: UserProfile(
            name: 'John Doe',
            email: 'john@example.com',
            onEdit: () => editCalled = true,
          ),
        ),
      );

      await tester.tap(find.byKey(Key('edit-button')));
      await tester.pump();

      expect(editCalled, equals(true));
    });
  });
}
```

### Step 3: Lumora Auto-Converts Test

```bash
[12:06:00] Test file changed: test/widgets/user_profile_test.dart
[12:06:00] Detected: Flutter test file
[12:06:00] Converting test to React...
[12:06:00] ✓ Test converted: web/src/components/__tests__/UserProfile.test.tsx
[12:06:00] ⚡ Test sync completed in 76ms
```

### Step 4: Generated React Test (Automatic!)

```typescript
// web/src/components/__tests__/UserProfile.test.tsx (AUTO-GENERATED)
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProfile } from '../UserProfile';

describe('UserProfile Widget', () => {
  it('should display user information', () => {
    render(
      <UserProfile
        name="John Doe"
        email="john@example.com"
        onEdit={() => {}}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should call onEdit when button pressed', () => {
    let editCalled = false;

    render(
      <UserProfile
        name="John Doe"
        email="john@example.com"
        onEdit={() => { editCalled = true; }}
      />
    );

    fireEvent.press(screen.getByText('Edit'));

    expect(editCalled).toBe(true);
  });
});
```

## Example 3: Test with Mocks (Auto-Converted)

### React Test with Mocks

```typescript
// web/src/services/__tests__/UserService.test.tsx
import { UserService } from '../UserService';
import { ApiClient } from '../ApiClient';

jest.mock('../ApiClient');

describe('UserService', () => {
  let userService: UserService;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    mockApiClient = new ApiClient() as jest.Mocked<ApiClient>;
    mockApiClient.get.mockResolvedValue({ id: 1, name: 'John' });
    userService = new UserService(mockApiClient);
  });

  it('should fetch user by id', async () => {
    const user = await userService.getUser(1);
    
    expect(mockApiClient.get).toHaveBeenCalledWith('/users/1');
    expect(user).toEqual({ id: 1, name: 'John' });
  });
});
```

### Auto-Generated Flutter Test with Mocks

```dart
// test/services/user_service_test.dart (AUTO-GENERATED)
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:my_app/services/user_service.dart';
import 'package:my_app/services/api_client.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  group('UserService', () {
    late UserService userService;
    late MockApiClient mockApiClient;

    setUp(() {
      mockApiClient = MockApiClient();
      when(mockApiClient.get(any)).thenAnswer((_) async => {'id': 1, 'name': 'John'});
      userService = UserService(mockApiClient);
    });

    test('should fetch user by id', () async {
      final user = await userService.getUser(1);
      
      verify(mockApiClient.get('/users/1')).called(1);
      expect(user, equals({'id': 1, 'name': 'John'}));
    });
  });
}
```

## Example 4: Unconvertible Test (Stub Generated)

### Complex React Test

```typescript
// web/src/animations/__tests__/ComplexAnimation.test.tsx
import { ComplexAnimation } from '../ComplexAnimation';
import { useSpring, animated } from 'react-spring';

describe('ComplexAnimation', () => {
  it('should animate with spring physics', () => {
    // Uses react-spring specific APIs
    const { result } = renderHook(() => useSpring({ x: 0 }));
    // Complex animation testing...
  });
});
```

### Auto-Generated Stub

```bash
[12:10:00] Test file changed: ComplexAnimation.test.tsx
[12:10:00] Converting test to Flutter...
[12:10:00] ⚠️  Conversion not possible: Uses custom animation library
[12:10:00] ✓ Test stub generated: test/animations/complex_animation_test.dart
[12:10:00] ⚡ Test sync completed in 45ms
```

```dart
// test/animations/complex_animation_test.dart (STUB GENERATED)
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('should animate with spring physics', () {
    // TODO: Manual conversion required
    // Reason: Uses custom animation library (react-spring)
    // Original test could not be automatically converted
    // Please implement this test manually
    fail('Test not implemented');
  });
}
```

## Configuration

### Enable/Disable Test Sync

```yaml
# lumora.yaml
sync:
  testSync:
    enabled: true           # Enable automatic test conversion
    convertTests: true      # Convert test files
    convertMocks: true      # Convert mock definitions
    generateStubs: true     # Generate stubs for unconvertible tests
```

### Programmatic Control

```typescript
import { SyncEngine } from '@lumora/ir';

const syncEngine = new SyncEngine({
  reactDir: 'web/src',
  flutterDir: 'lib',
  testSync: {
    enabled: true,
    convertTests: true,
    convertMocks: true,
    generateStubs: true,
  },
});

// Disable test sync temporarily
syncEngine.disableTestSync();

// Re-enable
syncEngine.enableTestSync();

// Check status
console.log(syncEngine.isTestSyncEnabled()); // true/false
```

## Benefits

### 1. Maintain Test Coverage
- Write tests in your preferred framework
- Automatically get tests in the other framework
- No manual test porting needed

### 2. Faster Development
- No context switching between test frameworks
- Tests update in real-time like components
- Catch bugs on both platforms immediately

### 3. Consistent Testing
- Same test logic on both platforms
- Reduces platform-specific bugs
- Easier to maintain test suites

### 4. Team Collaboration
- React developers write React tests
- Flutter developers write Flutter tests
- Both test suites stay in sync automatically

## Limitations

### Not Auto-Convertible
- Custom test utilities
- Framework-specific test helpers
- Complex animation tests
- Platform-specific tests
- Tests using unsupported libraries

**Solution**: Lumora generates test stubs with TODO comments for manual implementation.

## Summary

With Lumora's automatic test sync:

1. **Write tests** in React or Flutter (your choice)
2. **Save the file** - Lumora detects it's a test
3. **Auto-conversion** happens in < 100ms
4. **Run tests** on both platforms
5. **No manual work** needed!

Just like components, tests are automatically synchronized between React and Flutter. Write once, test everywhere! 🚀
