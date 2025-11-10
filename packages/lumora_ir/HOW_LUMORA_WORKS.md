# How Lumora Framework Works

## Overview

Lumora is a **bidirectional mobile development framework** that allows developers to write in either React/TypeScript or Flutter/Dart, with automatic real-time synchronization between both frameworks. Think of it as "React Native Expo meets Flutter" with bidirectional conversion.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LUMORA FRAMEWORK                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    DEVELOPER WRITES                          │ │
│  │                                                              │ │
│  │   React/TSX (web/)          OR         Flutter/Dart (lib/)  │ │
│  │   ├── components/                      ├── widgets/         │ │
│  │   ├── screens/                         ├── screens/         │ │
│  │   └── tests/                           └── tests/           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              FILE WATCHER (Chokidar)                         │ │
│  │  Detects changes in React or Flutter files within 100ms     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              CHANGE QUEUE (Debounced)                        │ │
│  │  Batches rapid changes, prioritizes by importance           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              CONFLICT DETECTOR                               │ │
│  │  Checks if both React & Flutter modified simultaneously     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                    ┌─────────┴─────────┐                          │
│                    │  No Conflict      │  Conflict                │
│                    ▼                   ▼                           │
│  ┌─────────────────────────┐  ┌──────────────────────┐           │
│  │    SYNC ENGINE          │  │  CONFLICT RESOLVER   │           │
│  │                         │  │  (Manual/Auto)       │           │
│  └─────────────────────────┘  └──────────────────────┘           │
│              │                                                     │
│              ▼                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              CONVERSION PIPELINE                             │ │
│  │                                                              │ │
│  │  React → AST → Lumora IR → Dart → Flutter                  │ │
│  │  Flutter → AST → Lumora IR → TSX → React                   │ │
│  │                                                              │ │
│  │  Components:                                                 │ │
│  │  • Parser (Babel/Dart Analyzer)                            │ │
│  │  • IR Generator                                             │ │
│  │  • Code Generator                                           │ │
│  │  • Widget Mapper                                            │ │
│  │  • Type Converter                                           │ │
│  │  • State Converter                                          │ │
│  │  • Test Converter (NEW!)                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│              │                                                     │
│              ▼                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              IR STORAGE (Versioned)                          │ │
│  │  Stores intermediate representation with history            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│              │                                                     │
│              ▼                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              TARGET FILE GENERATION                          │ │
│  │  Writes converted code to target framework directory        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│              │                                                     │
│              ▼                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              HOT RELOAD                                      │ │
│  │  • Web: React Fast Refresh                                  │ │
│  │  • Mobile: Flutter Hot Reload                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## How It Works: Step by Step

### 1. Developer Writes Code

```typescript
// Developer writes in React (web/src/components/Counter.tsx)
import React, { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <View>
      <Text>Count: {count}</Text>
      <Button onPress={() => setCount(count + 1)}>
        Increment
      </Button>
    </View>
  );
}
```

### 2. File Watcher Detects Change

```typescript
// FileWatcher (using Chokidar)
const watcher = chokidar.watch('web/src/**/*.{tsx,ts}', {
  ignoreInitial: false,
  awaitWriteFinish: { stabilityThreshold: 100 }
});

watcher.on('change', (filePath) => {
  // Detected: web/src/components/Counter.tsx changed
  changeQueue.enqueue({
    filePath: 'web/src/components/Counter.tsx',
    framework: 'react',
    type: 'change',
    timestamp: Date.now()
  });
});
```

### 3. Change Queue Batches Changes

```typescript
// ChangeQueue (debounced, 300ms)
// If you save multiple times rapidly, it batches them
const changes = [
  { file: 'Counter.tsx', time: 1000 },
  { file: 'Counter.tsx', time: 1100 },  // Batched
  { file: 'Counter.tsx', time: 1200 },  // Batched
];

// After 300ms of no changes, processes once
await processChanges(changes);
```

### 4. Conflict Detection

```typescript
// ConflictDetector checks if both sides modified
const conflict = conflictDetector.checkConflict(
  event,
  'react_components_Counter',
  'web/src/components/Counter.tsx',
  'lib/widgets/counter.dart'
);

if (conflict.hasConflict) {
  // Both React and Flutter files modified within 5 seconds
  // Show conflict resolution UI
  showConflictResolver(conflict);
} else {
  // No conflict, proceed with sync
  syncEngine.processChanges([change]);
}
```

### 5. Conversion Pipeline

#### Step 5a: Parse React to AST

```typescript
// Using Babel parser
import * as babel from '@babel/parser';

const ast = babel.parse(sourceCode, {
  sourceType: 'module',
  plugins: ['jsx', 'typescript']
});

// AST representation
{
  type: 'FunctionDeclaration',
  id: { name: 'Counter' },
  body: {
    type: 'BlockStatement',
    body: [
      { type: 'VariableDeclaration', ... },  // useState
      { type: 'ReturnStatement', ... }       // JSX
    ]
  }
}
```

#### Step 5b: Convert AST to Lumora IR

```typescript
// Generate framework-agnostic IR
const ir: LumoraIR = {
  version: '1.0.0',
  metadata: {
    sourceFramework: 'react',
    sourceFile: 'web/src/components/Counter.tsx',
    generatedAt: Date.now()
  },
  nodes: [
    {
      id: 'counter_root',
      type: 'Container',
      props: {},
      children: [
        {
          id: 'counter_text',
          type: 'Text',
          props: { text: 'Count: ${count}' },
          children: []
        },
        {
          id: 'counter_button',
          type: 'Button',
          props: { text: 'Increment' },
          events: [
            {
              name: 'onPress',
              handler: 'setCount(count + 1)',
              parameters: []
            }
          ],
          children: []
        }
      ],
      state: {
        type: 'local',
        variables: [
          {
            name: 'count',
            type: 'number',
            initialValue: 0,
            mutable: true
          }
        ]
      }
    }
  ]
};
```

#### Step 5c: Generate Flutter Code from IR

```typescript
// Code generator creates Flutter/Dart
const flutterCode = `
import 'package:flutter/material.dart';

class Counter extends StatefulWidget {
  const Counter({Key? key}) : super(key: key);

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        children: [
          Text('Count: $count'),
          ElevatedButton(
            onPressed: () {
              setState(() {
                count = count + 1;
              });
            },
            child: Text('Increment'),
          ),
        ],
      ),
    );
  }
}
`;

// Write to lib/widgets/counter.dart
fs.writeFileSync('lib/widgets/counter.dart', flutterCode);
```

### 6. IR Storage (Versioned)

```typescript
// Store IR with version history
storage.store('react_components_Counter', ir);

// Storage structure:
.lumora/ir/
  ├── react_components_Counter.json      // Latest version
  └── history/
      ├── react_components_Counter_v1.json
      ├── react_components_Counter_v2.json
      └── react_components_Counter_v3.json
```

### 7. Hot Reload

```typescript
// React side: Fast Refresh automatically picks up changes
// Flutter side: Hot reload triggered
flutter.hotReload('lib/widgets/counter.dart');

// Both apps update within 500ms!
```

## Development Modes

### Mode 1: React-First (Default for Web Developers)

```bash
lumora start --mode react
```

- **React files**: Editable (primary source)
- **Flutter files**: Read-only (auto-generated)
- Changes in React → Auto-sync to Flutter
- Changes in Flutter → Ignored (warning shown)

**Use case**: Web developers who want mobile apps

### Mode 2: Flutter-First (Default for Mobile Developers)

```bash
lumora start --mode flutter
```

- **Flutter files**: Editable (primary source)
- **React files**: Read-only (auto-generated)
- Changes in Flutter → Auto-sync to React
- Changes in React → Ignored (warning shown)

**Use case**: Mobile developers who want web apps

### Mode 3: Universal (Advanced)

```bash
lumora start --mode universal
```

- **Both React and Flutter**: Editable
- Changes in either → Sync to other
- Conflict detection enabled
- Manual conflict resolution when both modified

**Use case**: Teams with both React and Flutter developers

## Real-World Example: Complete Flow

### Scenario: Adding a Login Screen

```bash
# 1. Start Lumora in React-first mode
$ lumora start --mode react

✓ Lumora started in React-first mode
✓ Watching: web/src/**/*.{tsx,ts,test.tsx}
✓ Generating: lib/**/*.dart
✓ Dev server: http://localhost:3000
✓ QR code: [Scan to connect mobile device]
```

```typescript
// 2. Developer creates Login.tsx
// web/src/screens/Login.tsx
import React, { useState } from 'react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    // Login logic
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button onPress={handleLogin}>
        Login
      </Button>
    </View>
  );
}
```

```bash
# 3. Lumora detects change and auto-converts
[12:34:56] File changed: web/src/screens/Login.tsx
[12:34:56] Converting to IR...
[12:34:56] Generating Flutter code...
[12:34:56] ✓ Created: lib/screens/login.dart
[12:34:56] ✓ Hot reload: Mobile app updated
[12:34:56] ⚡ Sync completed in 234ms
```

```dart
// 4. Generated Flutter code (lib/screens/login.dart)
import 'package:flutter/material.dart';

class Login extends StatefulWidget {
  const Login({Key? key}) : super(key: key);

  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  String email = '';
  String password = '';

  Future<void> handleLogin() async {
    // Login logic
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        children: [
          Text('Login', style: Theme.of(context).textTheme.headline1),
          TextField(
            decoration: InputDecoration(hintText: 'Email'),
            onChanged: (value) => setState(() => email = value),
          ),
          TextField(
            decoration: InputDecoration(hintText: 'Password'),
            obscureText: true,
            onChanged: (value) => setState(() => password = value),
          ),
          ElevatedButton(
            onPressed: handleLogin,
            child: Text('Login'),
          ),
        ],
      ),
    );
  }
}
```

```bash
# 5. Developer views on both platforms simultaneously
# Web browser: http://localhost:3000/login
# Mobile device: Scanned QR code, shows same login screen
# Both update in real-time as you edit Login.tsx!
```

## Test Conversion (NEW!)

Tests are now automatically converted too!

```typescript
// web/src/screens/__tests__/Login.test.tsx
describe('Login', () => {
  it('should update email on input', () => {
    render(<Login />);
    const input = screen.getByPlaceholderText('Email');
    fireEvent.changeText(input, 'test@example.com');
    expect(input.value).toBe('test@example.com');
  });
});
```

```bash
# Lumora auto-converts test
[12:35:10] Test file changed: Login.test.tsx
[12:35:10] Converting test to Flutter...
[12:35:10] ✓ Created: test/screens/login_test.dart
```

```dart
// test/screens/login_test.dart (auto-generated)
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/screens/login.dart';

void main() {
  group('Login', () {
    testWidgets('should update email on input', (WidgetTester tester) async {
      await tester.pumpWidget(Login());
      final input = find.byType(TextField).first;
      await tester.enterText(input, 'test@example.com');
      expect(find.text('test@example.com'), findsOneWidget);
    });
  });
}
```

## Performance Optimizations

### 1. Caching
```typescript
// Conversion cache prevents re-parsing unchanged files
cache.getIR('Counter.tsx');  // Returns cached IR if file unchanged
```

### 2. Parallel Processing
```typescript
// Multiple files converted in parallel
await Promise.all([
  convert('Counter.tsx'),
  convert('Login.tsx'),
  convert('Profile.tsx')
]);
```

### 3. Incremental Updates
```typescript
// Only changed components re-converted
if (!storage.hasChanged(irId, newIR)) {
  return; // Skip conversion
}
```

### 4. Debouncing
```typescript
// Rapid saves batched into single conversion
changeQueue.debounce(300); // Wait 300ms after last change
```

## CLI Commands

```bash
# Start development server (like expo start)
lumora start [--mode react|flutter|universal]

# Manual conversion (optional)
lumora convert <file> [--to react|flutter]

# Convert entire project
lumora convert-project --from react --to flutter

# Watch mode (already running in lumora start)
lumora watch

# Generate production build
lumora build --platform web|android|ios

# Run tests (auto-converts and runs)
lumora test
```

## Configuration

```yaml
# lumora.yaml
mode: universal

directories:
  react: web/src
  flutter: lib
  storage: .lumora/ir

watch:
  patterns:
    react: ['**/*.tsx', '**/*.ts', '**/*.test.tsx']
    flutter: ['**/*.dart', '**/*_test.dart']
  ignore: ['**/node_modules/**', '**/build/**']

conversion:
  autoConvertTests: true
  preserveComments: true
  formatOnSave: true

sync:
  debounceMs: 300
  conflictWindowMs: 5000
  enableParallel: true

widgets:
  customMappings:
    MyButton: CustomButton
    MyCard: CustomCard
```

## Summary

**Lumora works like this:**

1. **You write code** in React or Flutter (your choice)
2. **File watcher detects** changes instantly
3. **Conversion pipeline** transforms code through Lumora IR
4. **Target framework code** is auto-generated
5. **Hot reload** updates both web and mobile
6. **Tests are converted** automatically too!

**No manual CLI commands needed during development** - just code and see changes everywhere!

It's like having React Native Expo and Flutter working together seamlessly. 🚀
