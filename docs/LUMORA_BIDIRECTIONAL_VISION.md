# Lumora: The Bidirectional Cross-Platform Framework

## The Ultimate Vision

**Lumora enables developers to write in their preferred language and framework, with seamless conversion between React and Flutter.**

### Two-Way Conversion

```
React/TypeScript ←→ Lumora Core ←→ Flutter/Dart
```

**React Developers** can:
- Write React/TypeScript code
- See it run natively on Flutter (mobile)
- Get production Flutter apps

**Flutter Developers** can:
- Write Flutter/Dart code
- See it run on web as React
- Collaborate with React developers

**Both get**:
- Instant preview via QR code
- Hot reload/refresh
- Native performance (no bridge!)
- Single codebase, multiple outputs

---

## Architecture: The Bidirectional Bridge

```
┌─────────────────────────────────────────────────────────────┐
│                      Lumora Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  React/TSX Source          Lumora IR          Flutter/Dart   │
│       Code                (Intermediate)          Code        │
│        ↓                  Representation           ↓          │
│        │                       ↕                   │          │
│        │                                           │          │
│   ┌────▼────┐                               ┌─────▼─────┐   │
│   │  React  │◄──────────────────────────────┤  Flutter  │   │
│   │   to    │      Dart-to-React            │    to     │   │
│   │ Flutter │       Transpiler              │   React   │   │
│   │Transpiler│                               │Transpiler │   │
│   └────┬────┘                               └─────┬─────┘   │
│        │                                           │          │
│        ▼                                           ▼          │
│                                                               │
│   Lumora IR (Intermediate Representation)                    │
│   ┌─────────────────────────────────────────────────┐       │
│   │  - Widget tree structure                         │       │
│   │  - Props and styling                             │       │
│   │  - State management                              │       │
│   │  - Event handlers                                │       │
│   │  - Navigation                                    │       │
│   └─────────────────────────────────────────────────┘       │
│                                                               │
│        ↓                                           ↓          │
│                                                               │
│   ┌────────────┐                           ┌──────────────┐ │
│   │   React    │                           │   Flutter    │ │
│   │   Output   │                           │   Output     │ │
│   │  (Web/RN)  │                           │  (Mobile)    │ │
│   └────────────┘                           └──────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Innovation: Lumora IR (Intermediate Representation)

Instead of direct React ↔ Flutter conversion, we use an **intermediate representation** that captures the essence of UI components in a framework-agnostic way.

```typescript
// Lumora IR Example
{
  type: "Container",
  props: {
    padding: { all: 16 },
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
  children: [
    {
      type: "Text",
      props: {
        content: "Hello World",
        style: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#000000"
        }
      }
    }
  ]
}
```

This IR can be converted to:
- **React/TypeScript** for web
- **Flutter/Dart** for mobile
- **React Native** for mobile (future)
- **SwiftUI** for iOS (future)
- **Jetpack Compose** for Android (future)

---

## Use Cases

### Use Case 1: React Developer Building Mobile App

**Developer**: Sarah (React expert, no Flutter knowledge)

**Workflow**:
```bash
# 1. Create project in React mode
lumora init my-app --mode=react

# 2. Write React/TypeScript code
# src/App.tsx
export default function App() {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24 }}>Hello from React!</Text>
      <Button onPress={() => alert('Clicked')}>
        Click Me
      </Button>
    </View>
  );
}

# 3. Start dev server
lumora start

# 4. Scan QR with Lumora Go
# App runs as NATIVE FLUTTER on mobile!

# 5. Build for production
lumora build:mobile
# Output: Native Flutter app (APK/IPA)
```

**What Sarah gets**:
- ✓ Writes familiar React code
- ✓ Instant preview on mobile device
- ✓ Native Flutter performance (no bridge!)
- ✓ Production Flutter app
- ✓ No need to learn Flutter/Dart

### Use Case 2: Flutter Developer Building Web App

**Developer**: Mike (Flutter expert, no React knowledge)

**Workflow**:
```bash
# 1. Create project in Flutter mode
lumora init my-app --mode=flutter

# 2. Write Flutter/Dart code
# lib/main.dart
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          Text('Hello from Flutter!', 
            style: TextStyle(fontSize: 24)),
          ElevatedButton(
            onPressed: () => print('Clicked'),
            child: Text('Click Me'),
          ),
        ],
      ),
    );
  }
}

# 3. Start dev server
lumora start

# 4. Open browser at localhost:3000
# App runs as REACT on web!

# 5. Build for production
lumora build:web
# Output: Optimized React app
```

**What Mike gets**:
- ✓ Writes familiar Flutter code
- ✓ Instant web preview
- ✓ Production React app
- ✓ No need to learn React/TypeScript

### Use Case 3: Mixed Team Collaboration

**Team**: 2 React devs + 2 Flutter devs

**Workflow**:
```bash
# 1. Create project in universal mode
lumora init my-app --mode=universal

# Project structure:
my-app/
├── src/              # React source (React devs work here)
│   └── App.tsx
├── lib/              # Flutter source (Flutter devs work here)
│   └── main.dart
├── lumora.yaml       # Sync configuration
└── .lumora/
    └── ir/           # Generated IR (auto-synced)

# 2. React dev writes component
# src/components/Header.tsx
export const Header = () => (
  <View style={{ padding: 16, backgroundColor: '#007AFF' }}>
    <Text style={{ color: 'white', fontSize: 20 }}>My App</Text>
  </View>
);

# 3. Lumora auto-converts to Flutter
# lib/components/header.dart (auto-generated)
class Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(color: Color(0xFF007AFF)),
      child: Text('My App',
        style: TextStyle(color: Colors.white, fontSize: 20)),
    );
  }
}

# 4. Flutter dev can use it
# lib/screens/home.dart
class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: Header(), // Using React dev's component!
      body: MyFlutterWidget(),
    );
  }
}

# 5. Both see changes in real-time
# React dev: sees changes in browser
# Flutter dev: sees changes on mobile device
```

**What the team gets**:
- ✓ Each dev works in their preferred language
- ✓ Components sync automatically
- ✓ Real-time collaboration
- ✓ Single source of truth (Lumora IR)
- ✓ Best of both worlds

---

## Technical Implementation

### Component 1: React-to-Flutter Transpiler

**Input**: React/TypeScript
**Output**: Flutter/Dart

```typescript
// React Input
const MyButton = ({ title, onPress }) => (
  <TouchableOpacity 
    style={{ padding: 12, backgroundColor: '#007AFF' }}
    onPress={onPress}
  >
    <Text style={{ color: 'white' }}>{title}</Text>
  </TouchableOpacity>
);
```

```dart
// Flutter Output (auto-generated)
class MyButton extends StatelessWidget {
  final String title;
  final VoidCallback onPress;
  
  const MyButton({
    required this.title,
    required this.onPress,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPress,
      child: Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Color(0xFF007AFF),
        ),
        child: Text(
          title,
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}
```

**Technology Stack**:
- Babel parser for React/TSX
- AST transformation
- Dart code generation
- Type inference

### Component 2: Flutter-to-React Transpiler

**Input**: Flutter/Dart
**Output**: React/TypeScript

```dart
// Flutter Input
class MyCard extends StatelessWidget {
  final String title;
  final String subtitle;
  
  const MyCard({
    required this.title,
    required this.subtitle,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(title, style: TextStyle(fontSize: 20)),
          Text(subtitle, style: TextStyle(fontSize: 14)),
        ],
      ),
    );
  }
}
```

```typescript
// React Output (auto-generated)
interface MyCardProps {
  title: string;
  subtitle: string;
}

export const MyCard: React.FC<MyCardProps> = ({ title, subtitle }) => {
  return (
    <View
      style={{
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
      }}
    >
      <Text style={{ fontSize: 20 }}>{title}</Text>
      <Text style={{ fontSize: 14 }}>{subtitle}</Text>
    </View>
  );
};
```

**Technology Stack**:
- Dart analyzer
- AST transformation
- TypeScript code generation
- Type mapping

### Component 3: Lumora IR (Intermediate Representation)

**Purpose**: Framework-agnostic representation of UI

```typescript
interface LumoraNode {
  type: string;
  props: Record<string, any>;
  children: LumoraNode[];
  metadata: {
    sourceFramework: 'react' | 'flutter';
    sourceFile: string;
    lineNumber: number;
  };
}

interface LumoraIR {
  version: string;
  nodes: LumoraNode[];
  stateManagement: {
    type: 'useState' | 'bloc' | 'riverpod' | 'provider';
    states: StateDefinition[];
  };
  navigation: {
    routes: Route[];
  };
  theme: {
    colors: Record<string, string>;
    typography: Record<string, TextStyle>;
  };
}
```

**Benefits**:
- Single source of truth
- Framework-agnostic
- Enables multi-target compilation
- Supports versioning and migration
- Enables advanced tooling

### Component 4: Bidirectional Sync Engine

**Watches both React and Flutter files**:

```typescript
class BidirectionalSync {
  private reactWatcher: FileWatcher;
  private flutterWatcher: FileWatcher;
  private irStore: IRStore;
  
  async syncReactToFlutter(reactFile: string) {
    // 1. Parse React file
    const ast = parseReact(reactFile);
    
    // 2. Convert to IR
    const ir = reactToIR(ast);
    
    // 3. Store IR
    await this.irStore.save(ir);
    
    // 4. Generate Flutter code
    const dartCode = irToFlutter(ir);
    
    // 5. Write Flutter file
    await writeFlutterFile(dartCode);
    
    // 6. Notify Flutter dev
    this.notifyFlutterDevs('Component updated from React');
  }
  
  async syncFlutterToReact(flutterFile: string) {
    // 1. Parse Flutter file
    const ast = parseFlutter(flutterFile);
    
    // 2. Convert to IR
    const ir = flutterToIR(ast);
    
    // 3. Store IR
    await this.irStore.save(ir);
    
    // 4. Generate React code
    const tsCode = irToReact(ir);
    
    // 5. Write React file
    await writeReactFile(tsCode);
    
    // 6. Notify React dev
    this.notifyReactDevs('Component updated from Flutter');
  }
}
```

---

## Widget/Component Mapping

### Core Mappings

| Lumora IR | React/RN | Flutter | Web HTML |
|-----------|----------|---------|----------|
| Container | View | Container | div |
| Text | Text | Text | span/p |
| Button | TouchableOpacity | ElevatedButton | button |
| Input | TextInput | TextField | input |
| Image | Image | Image | img |
| List | FlatList | ListView | ul/li |
| ScrollView | ScrollView | SingleChildScrollView | div (overflow) |
| Row | View (flexDirection: row) | Row | div (display: flex) |
| Column | View (flexDirection: column) | Column | div (flex-direction: column) |
| Stack | View (position: absolute) | Stack | div (position: relative) |

### Layout Mappings

| Lumora IR | React/RN | Flutter |
|-----------|----------|---------|
| Padding | style={{ padding }} | Padding widget |
| Margin | style={{ margin }} | Container margin |
| Flex | style={{ flex }} | Expanded/Flexible |
| Align | style={{ alignItems }} | Align widget |
| Center | style={{ justifyContent: 'center' }} | Center widget |

### State Management Mappings

| Lumora IR | React | Flutter |
|-----------|-------|---------|
| LocalState | useState | StatefulWidget |
| GlobalState | Context API | InheritedWidget |
| AsyncState | useEffect | FutureBuilder |
| StreamState | custom hook | StreamBuilder |

---

## Development Modes

### Mode 1: React-First Mode

```bash
lumora init my-app --mode=react
```

**Project Structure**:
```
my-app/
├── src/                    # Primary source (React)
│   ├── App.tsx
│   ├── components/
│   └── screens/
├── lib/                    # Auto-generated (Flutter)
│   ├── main.dart
│   ├── components/
│   └── screens/
├── web/                    # Web build output
├── mobile/                 # Mobile build output
└── lumora.yaml
```

**Workflow**:
1. Developer writes React/TypeScript
2. Lumora auto-generates Flutter code
3. Web preview shows React version
4. Mobile preview shows Flutter version (native!)
5. Production builds: React (web) + Flutter (mobile)

### Mode 2: Flutter-First Mode

```bash
lumora init my-app --mode=flutter
```

**Project Structure**:
```
my-app/
├── lib/                    # Primary source (Flutter)
│   ├── main.dart
│   ├── widgets/
│   └── screens/
├── src/                    # Auto-generated (React)
│   ├── App.tsx
│   ├── components/
│   └── screens/
├── web/                    # Web build output
├── mobile/                 # Mobile build output
└── lumora.yaml
```

**Workflow**:
1. Developer writes Flutter/Dart
2. Lumora auto-generates React code
3. Mobile preview shows Flutter version
4. Web preview shows React version
5. Production builds: Flutter (mobile) + React (web)

### Mode 3: Universal Mode (Mixed Team)

```bash
lumora init my-app --mode=universal
```

**Project Structure**:
```
my-app/
├── src/                    # React source (React devs)
│   └── components/
├── lib/                    # Flutter source (Flutter devs)
│   └── widgets/
├── .lumora/
│   ├── ir/                 # Intermediate representation
│   ├── sync-config.yaml    # Sync rules
│   └── conflict-resolution/ # Merge conflicts
├── web/                    # Web build
├── mobile/                 # Mobile build
└── lumora.yaml
```

**Workflow**:
1. React devs write in `src/`
2. Flutter devs write in `lib/`
3. Lumora syncs via IR
4. Conflicts resolved via UI
5. Both see changes in real-time
6. Production builds: Best of both

---

## CLI Commands

### Initialization

```bash
# React-first project
lumora init my-app --mode=react

# Flutter-first project
lumora init my-app --mode=flutter

# Universal project (both)
lumora init my-app --mode=universal

# With template
lumora init my-app --template=ecommerce --mode=react
```

### Development

```bash
# Start dev server
lumora start

# Start with specific mode
lumora start --react-only    # Only React preview
lumora start --flutter-only  # Only Flutter preview
lumora start --both          # Both previews

# Watch and sync
lumora sync --watch          # Auto-sync React ↔ Flutter

# Manual sync
lumora sync:react-to-flutter
lumora sync:flutter-to-react
```

### Building

```bash
# Build for web (React)
lumora build:web

# Build for mobile (Flutter)
lumora build:mobile
lumora build:android
lumora build:ios

# Build everything
lumora build:all

# Build with specific framework
lumora build:web --framework=react
lumora build:mobile --framework=flutter
```

### Conversion

```bash
# Convert React component to Flutter
lumora convert src/Button.tsx --to=flutter

# Convert Flutter widget to React
lumora convert lib/card.dart --to=react

# Batch convert
lumora convert src/components/*.tsx --to=flutter

# Preview conversion (don't write)
lumora convert src/App.tsx --to=flutter --dry-run
```

### Validation

```bash
# Validate conversions
lumora validate

# Check for conversion issues
lumora check:compatibility

# Show conversion coverage
lumora coverage
```

---

## Configuration: lumora.yaml

```yaml
version: 1.0

# Project mode
mode: universal  # react | flutter | universal

# Source directories
sources:
  react: src/
  flutter: lib/
  ir: .lumora/ir/

# Conversion settings
conversion:
  # React to Flutter
  reactToFlutter:
    enabled: true
    autoSync: true
    preserveComments: true
    generateTests: false
    
  # Flutter to React
  flutterToReact:
    enabled: true
    autoSync: true
    preserveComments: true
    generateTests: false

# Widget/Component mappings
mappings:
  # Custom mappings
  custom:
    MyCustomButton:
      react: CustomButton
      flutter: CustomButtonWidget
      
# State management
stateManagement:
  react: context  # useState | context | redux | mobx
  flutter: bloc   # bloc | riverpod | provider | getx

# Styling
styling:
  react: styled-components  # css | styled-components | emotion
  flutter: material         # material | cupertino | custom

# Build settings
build:
  web:
    framework: react
    outputDir: web/build
    
  mobile:
    framework: flutter
    outputDir: mobile/build

# Sync settings
sync:
  conflictResolution: manual  # manual | auto-react | auto-flutter
  notifyOnSync: true
  validateOnSync: true

# Development
dev:
  port: 3000
  hotReload: true
  openBrowser: true
  qrCode: true
```

---

## Advanced Features

### 1. Conflict Resolution

When both React and Flutter versions are modified:

```typescript
interface ConflictResolution {
  file: string;
  reactVersion: string;
  flutterVersion: string;
  irVersion: string;
  
  resolution: 'manual' | 'auto-react' | 'auto-flutter' | 'merge';
  
  // For manual resolution
  resolvedVersion?: string;
}
```

**UI for conflict resolution**:
```
┌─────────────────────────────────────────────────┐
│ Conflict Detected: Button.tsx / button.dart     │
├─────────────────────────────────────────────────┤
│                                                  │
│ React Version (modified 2 min ago)              │
│ ┌─────────────────────────────────────────────┐ │
│ │ <Button                                     │ │
│ │   style={{ backgroundColor: 'blue' }}       │ │
│ │   onPress={handlePress}                     │ │
│ │ >                                            │ │
│ │   Click Me                                   │ │
│ │ </Button>                                    │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Flutter Version (modified 1 min ago)            │
│ ┌─────────────────────────────────────────────┐ │
│ │ ElevatedButton(                             │ │
│ │   style: ButtonStyle(                       │ │
│ │     backgroundColor: Color(0xFF00FF00),     │ │
│ │   ),                                         │ │
│ │   onPressed: handlePress,                   │ │
│ │   child: Text('Click Me'),                  │ │
│ │ )                                            │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ [ Use React ] [ Use Flutter ] [ Merge ] [Edit] │
└─────────────────────────────────────────────────┘
```

### 2. Type Safety Across Frameworks

```typescript
// Shared type definitions
// types/shared.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

// Auto-generated Dart
// lib/types/shared.dart
class User {
  final String id;
  final String name;
  final String email;
  
  User({
    required this.id,
    required this.name,
    required this.email,
  });
}
```

### 3. Shared Business Logic

```typescript
// services/auth.ts (TypeScript)
export class AuthService {
  async login(email: string, password: string): Promise<User> {
    // Implementation
  }
}

// Auto-generated Dart
// lib/services/auth.dart
class AuthService {
  Future<User> login(String email, String password) async {
    // Implementation (same logic!)
  }
}
```

### 4. Platform-Specific Code

```typescript
// React (web-specific)
import { Platform } from 'lumora';

if (Platform.isWeb) {
  // Web-specific code
}

// Flutter (mobile-specific)
import 'package:lumora/platform.dart';

if (Platform.isMobile) {
  // Mobile-specific code
}
```

---

## Roadmap for Bidirectional Support

### Phase 1: Foundation (Months 1-6)
- [x] React-to-Flutter transpiler (current MVP)
- [ ] Flutter-to-React transpiler (new)
- [ ] Lumora IR design and implementation
- [ ] Bidirectional sync engine
- [ ] Conflict resolution UI

### Phase 2: Widget Parity (Months 7-9)
- [ ] 100+ widget mappings
- [ ] Layout system parity
- [ ] Styling system parity
- [ ] Animation parity
- [ ] Gesture parity

### Phase 3: State Management (Months 10-12)
- [ ] React state → Flutter state
- [ ] Flutter state → React state
- [ ] Shared state management
- [ ] State persistence
- [ ] State debugging tools

### Phase 4: Advanced Features (Months 13-15)
- [ ] Navigation sync
- [ ] Routing sync
- [ ] Deep linking
- [ ] Platform-specific code
- [ ] Performance optimization

### Phase 5: Developer Experience (Months 16-18)
- [ ] VS Code extension (both languages)
- [ ] Real-time collaboration
- [ ] Visual editor
- [ ] Component marketplace
- [ ] Documentation generator

---

## Benefits of Bidirectional Approach

### For React Developers
✓ Write React, get native Flutter mobile apps
✓ No need to learn Flutter/Dart
✓ Leverage React ecosystem
✓ Familiar tooling and workflow
✓ True native performance on mobile

### For Flutter Developers
✓ Write Flutter, get React web apps
✓ No need to learn React/TypeScript
✓ Leverage Flutter ecosystem
✓ Familiar tooling and workflow
✓ Optimized web performance

### For Mixed Teams
✓ Each dev works in preferred language
✓ Automatic code synchronization
✓ Real-time collaboration
✓ Shared component library
✓ Single source of truth (IR)
✓ No context switching

### For Companies
✓ Hire specialists (React OR Flutter)
✓ Maximize developer productivity
✓ Reduce training costs
✓ Faster time to market
✓ Better code quality
✓ Lower maintenance costs

---

## Competitive Advantage

### vs Expo (React Native)
✓ **Bidirectional**: React ↔ Flutter (Expo is React-only)
✓ **True Native**: Flutter has no bridge
✓ **Better Performance**: AOT compilation
✓ **Web Support**: React for web, Flutter for mobile

### vs Flutter
✓ **React Support**: React devs can contribute
✓ **Web Optimization**: React is better for web
✓ **Team Flexibility**: Mixed teams possible
✓ **Ecosystem Access**: Both React and Flutter ecosystems

### vs Other Cross-Platform
✓ **No Compromise**: Native performance everywhere
✓ **Developer Choice**: Write in preferred language
✓ **Best of Both**: React's web + Flutter's mobile
✓ **Future-Proof**: Can add more targets (SwiftUI, Compose)

---

## Conclusion

**Lumora with bidirectional conversion is the ultimate cross-platform framework.**

**Key Features**:
1. ✓ React → Flutter (for React devs)
2. ✓ Flutter → React (for Flutter devs)
3. ✓ Lumora IR (framework-agnostic)
4. ✓ Real-time sync
5. ✓ Conflict resolution
6. ✓ Mixed team support
7. ✓ Native performance (no bridge!)
8. ✓ 50+ device APIs
9. ✓ Cloud builds & OTA updates
10. ✓ Complete framework

**This is revolutionary!** No other framework offers true bidirectional conversion with native performance.

**Timeline**: 18 months to full bidirectional support
**Investment**: $2.5M (additional $400k for bidirectional features)
**Impact**: Unify React and Flutter ecosystems

---

**Document Version**: 1.0
**Created**: November 9, 2025
**Status**: Ultimate Vision - Ready to Build!
