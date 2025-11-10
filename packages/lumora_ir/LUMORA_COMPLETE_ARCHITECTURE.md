# Lumora Complete Architecture

## The Big Picture

Lumora has **TWO systems** working together:

### System 1: Dev-Proxy + Flutter Dev Client (Instant Preview)
**For Development** - See your React code running on real devices instantly

### System 2: Lumora IR + Bidirectional Sync (Code Generation)
**For Production** - Generate production-ready Dart code from React

## Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LUMORA COMPLETE SYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  SYSTEM 1: INSTANT PREVIEW (Dev-Proxy + Flutter Dev Client)          │ │
│  │  Purpose: Real-time development and testing                           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Developer                                                                  │
│  Writes Code                                                                │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────┐                                                           │
│  │  React/TSX  │                                                           │
│  │  Component  │                                                           │
│  └─────────────┘                                                           │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────┐                                                           │
│  │  tsx2schema │  (Codegen Tool)                                           │
│  │  Converter  │                                                           │
│  └─────────────┘                                                           │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────┐                                                           │
│  │ JSON Schema │                                                           │
│  └─────────────┘                                                           │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        DEV-PROXY SERVER                             │  │
│  │  • Session Management                                               │  │
│  │  • QR Code Generation                                               │  │
│  │  • WebSocket Server                                                 │  │
│  │  • Schema Broadcasting                                              │  │
│  │  • Event Handling                                                   │  │
│  │                                                                     │  │
│  │  ┌────────────────────────────────────┐                            │  │
│  │  │  █▀▀▀▀▀█ ▀▀█▄ ▀ ▄▀█ █▀▀▀▀▀█        │                            │  │
│  │  │  █ ███ █ ▄▀▀█▀▄█▀  █ ███ █        │                            │  │
│  │  │  █ ▀▀▀ █ █▀ ▀▄ ▀█▄ █ ▀▀▀ █        │                            │  │
│  │  │  ▀▀▀▀▀▀▀ █▄▀ ▀ █ ▀ ▀▀▀▀▀▀▀        │                            │  │
│  │  │  Scan to connect mobile device     │                            │  │
│  │  └────────────────────────────────────┘                            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│      │                                                                       │
│      │ WebSocket                                                            │
│      │ (Real-time)                                                          │
│      ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                   FLUTTER DEV CLIENT (Mobile Device)                │  │
│  │                                                                     │  │
│  │  [Mobile Device]                                                    │  │
│  │  ┌─────────────────────────┐                                       │  │
│  │  │  Your App (Live!)       │                                       │  │
│  │  │  ┌───────────────────┐  │                                       │  │
│  │  │  │                   │  │                                       │  │
│  │  │  │  Native Flutter   │  │  ← Renders as REAL Flutter widgets   │  │
│  │  │  │  Widgets          │  │                                       │  │
│  │  │  │                   │  │                                       │  │
│  │  │  │  • Text           │  │                                       │  │
│  │  │  │  • Button         │  │                                       │  │
│  │  │  │  • Container      │  │                                       │  │
│  │  │  │  • ListView       │  │                                       │  │
│  │  │  │                   │  │                                       │  │
│  │  │  └───────────────────┘  │                                       │  │
│  │  └─────────────────────────┘                                       │  │
│  │                                                                     │  │
│  │  ✓ Instant preview (< 500ms)                                       │  │
│  │  ✓ Real-time updates                                               │  │
│  │  ✓ Native performance                                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  SYSTEM 2: CODE GENERATION (Lumora IR + Bidirectional Sync)          │ │
│  │  Purpose: Production-ready Dart code generation                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Developer                                                                  │
│  Writes Code                                                                │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────┐              ┌─────────────┐                             │
│  │  React/TSX  │      OR      │ Flutter/Dart│                             │
│  │  Component  │              │   Widget    │                             │
│  └─────────────┘              └─────────────┘                             │
│      │                              │                                       │
│      │                              │                                       │
│      └──────────┬───────────────────┘                                       │
│                 ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                    FILE WATCHER (Chokidar)                           │ │
│  │  Detects changes in React or Flutter files within 100ms             │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                 │                                                           │
│                 ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                    BIDIRECTIONAL SYNC ENGINE                         │ │
│  │                                                                      │ │
│  │  ┌────────────────┐         ┌────────────────┐                     │ │
│  │  │ React Parser   │         │ Flutter Parser │                     │ │
│  │  │ (Babel)        │         │ (Dart Analyzer)│                     │ │
│  │  └────────────────┘         └────────────────┘                     │ │
│  │         │                            │                              │ │
│  │         └────────────┬───────────────┘                              │ │
│  │                      ▼                                               │ │
│  │         ┌────────────────────────────┐                              │ │
│  │         │      LUMORA IR             │                              │ │
│  │         │  (Framework-Agnostic)      │                              │ │
│  │         │                            │                              │ │
│  │         │  • Widget tree             │                              │ │
│  │         │  • Props & state           │                              │ │
│  │         │  • Events & handlers       │                              │ │
│  │         │  • Styling                 │                              │ │
│  │         │  • Navigation              │                              │ │
│  │         │  • Tests (NEW!)            │                              │ │
│  │         └────────────────────────────┘                              │ │
│  │                      │                                               │ │
│  │         ┌────────────┴────────────┐                                 │ │
│  │         ▼                         ▼                                 │ │
│  │  ┌────────────────┐       ┌────────────────┐                       │ │
│  │  │ Dart Generator │       │ TSX Generator  │                       │ │
│  │  └────────────────┘       └────────────────┘                       │ │
│  │         │                         │                                 │ │
│  │         ▼                         ▼                                 │ │
│  │  ┌────────────────┐       ┌────────────────┐                       │ │
│  │  │ Flutter Code   │       │  React Code    │                       │ │
│  │  │ (Production)   │       │  (Production)  │                       │ │
│  │  └────────────────┘       └────────────────┘                       │ │
│  │                                                                      │ │
│  │  ✓ Automatic conversion                                             │ │
│  │  ✓ Bidirectional sync                                               │ │
│  │  ✓ Test conversion (NEW!)                                           │ │
│  │  ✓ Production-ready code                                            │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## How They Work Together

### Development Workflow

```
1. Start Dev-Proxy
   $ cd tools/dev-proxy && npm start
   ✓ QR code displayed

2. Start Flutter Dev Client
   $ cd apps/flutter-dev-client && flutter run
   ✓ Scan QR code
   ✓ Connected!

3. Start Lumora Sync (in another terminal)
   $ cd packages/lumora_ir
   $ lumora start --mode react
   ✓ Watching React files
   ✓ Auto-generating Flutter code

4. Write React code
   $ vim web/src/App.tsx
   [Write your component]
   Save (Ctrl+S)

5. MAGIC HAPPENS! ✨
   
   System 1 (Instant Preview):
   ✓ tsx2schema converts to JSON
   ✓ Dev-Proxy receives schema
   ✓ Flutter Dev Client renders
   ✓ You see it on device in < 500ms!
   
   System 2 (Code Generation):
   ✓ File watcher detects change
   ✓ Sync engine converts to IR
   ✓ Dart code generated
   ✓ Production code ready!

6. Result:
   ✓ Instant preview on device (System 1)
   ✓ Production Dart code (System 2)
   ✓ Tests auto-converted (System 2)
   ✓ Everything in sync!
```

## Two Paths to Production

### Path 1: Fast Path (Interpretation)
```
React/TSX → JSON Schema → Flutter Dev Client → Native Widgets
                                              ↑
                                        For development
                                        Instant preview
                                        No compilation
```

### Path 2: Native Path (Code Generation)
```
React/TSX → Lumora IR → Dart Code → Flutter Build → Native App
                                                    ↑
                                              For production
                                              Optimized
                                              App store ready
```

## Key Differences

| Feature | System 1 (Dev-Proxy) | System 2 (Lumora IR) |
|---------|---------------------|---------------------|
| **Purpose** | Instant preview | Production code |
| **Speed** | < 500ms | Depends on build |
| **Output** | Live rendering | Dart files |
| **Use Case** | Development | Production |
| **Compilation** | No | Yes |
| **Performance** | Good | Excellent |
| **Deployment** | No | Yes |

## Complete Example

### Step 1: Write React Component

```typescript
// web/src/components/Counter.tsx
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

### Step 2: System 1 (Instant Preview)

```bash
# tsx2schema converts to JSON
$ node cli.js tsx2schema Counter.tsx schema.json

# Push to Dev-Proxy
$ curl -X POST http://localhost:3000/send/abc123 -d @schema.json

# Mobile device shows:
┌─────────────────────────┐
│  Count: 0               │
│  ┌─────────────┐        │
│  │ Increment   │        │
│  └─────────────┘        │
└─────────────────────────┘

✓ Rendered in 234ms!
```

### Step 3: System 2 (Code Generation)

```bash
# Lumora sync automatically generates Dart
$ lumora start --mode react

[12:34:56] File changed: web/src/components/Counter.tsx
[12:34:56] Converting to IR...
[12:34:56] ✓ Generated: lib/widgets/counter.dart
[12:34:56] ⚡ Sync completed in 156ms
```

```dart
// lib/widgets/counter.dart (AUTO-GENERATED)
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
```

### Step 4: Build Production App

```bash
# Use the generated Dart code
$ cd mobile
$ flutter build apk --release

✓ Built build/app/outputs/flutter-apk/app-release.apk
✓ Ready for app store!
```

## Why Two Systems?

### System 1 (Dev-Proxy) Advantages
✅ **Instant feedback** - See changes in < 500ms
✅ **No compilation** - No waiting for builds
✅ **Real device testing** - Test on actual hardware
✅ **Hot reload** - Update without restart
✅ **Multiple devices** - Test on many devices at once

### System 2 (Lumora IR) Advantages
✅ **Production code** - Deploy to app stores
✅ **Optimized** - Full Flutter compilation
✅ **Bidirectional** - Edit React or Flutter
✅ **Test conversion** - Tests stay in sync
✅ **Type safety** - Full Dart type checking

## Best Practices

### During Development
1. Use **System 1** for rapid iteration
2. Scan QR code once
3. Edit React code
4. See changes instantly on device
5. Test interactions in real-time

### Before Production
1. Use **System 2** to generate Dart code
2. Review generated code
3. Run Flutter tests
4. Build production app
5. Deploy to app stores

### For Teams
1. React developers use **System 1** for preview
2. **System 2** keeps Flutter code in sync
3. Flutter developers can edit generated code
4. Changes sync bidirectionally
5. Everyone stays productive!

## Summary

**Lumora has TWO powerful systems:**

1. **Dev-Proxy + Flutter Dev Client** = Instant preview on real devices
   - Scan QR code
   - See React code as native Flutter
   - Real-time updates
   - Perfect for development

2. **Lumora IR + Bidirectional Sync** = Production code generation
   - Automatic conversion
   - Bidirectional sync
   - Test conversion
   - Production-ready Dart

**Together, they give you:**
- ✅ Instant preview (like Expo)
- ✅ Native performance (like Flutter)
- ✅ Familiar syntax (React/TSX)
- ✅ Production code (Dart)
- ✅ Bidirectional sync (React ↔ Flutter)
- ✅ Test conversion (Jest ↔ Flutter tests)

**It's the best of all worlds!** 🚀
