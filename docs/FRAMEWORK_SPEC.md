# Framework Specification

This document describes the overall architecture, packages, APIs, and extension points for the Lumora framework.

## Table of Contents

- [Core Design Principles](#core-design-principles)
- [Architecture Overview](#architecture-overview)
- [Packages & Responsibilities](#packages--responsibilities)
- [Component Mapping](#component-mapping)
- [State Management](#state-management)
- [Runtime Performance](#runtime-performance)
- [Security](#security)
- [Extensibility](#extensibility)
- [Testing & CI](#testing--ci)

---

## Core Design Principles

### Mobile-First Architecture

The Flutter-Dev-Client is the primary artifact and runtime target. All design decisions prioritize native mobile performance and developer experience on actual devices.

**Key Principles**:
- Native Flutter widgets over web-based rendering
- Real device testing over simulator-only development
- Platform-specific optimizations (iOS and Android)
- Instant preview on actual hardware via QR code pairing

### Two-Tier Runtime Model

Lumora provides two complementary runtime modes:

**1. Fast Path (Development)**
- JSON UI schemas interpreted at runtime
- Instant preview without compilation
- Rapid iteration and hot reload
- Ideal for prototyping and design exploration

**2. Native Path (Production)**
- Deterministic TSX to Dart code generation
- Full compilation to native ARM code
- Production-ready performance
- Proper state management integration

### Clean Architecture

All generated code follows Clean Architecture principles:

```
lib/
├── domain/          # Business logic and entities
│   ├── entities/    # Pure Dart objects
│   └── usecases/    # Business rules
├── data/            # Data sources and repositories
│   ├── models/      # Data transfer objects
│   └── repositories/# Data access implementations
└── presentation/    # UI and state management
    ├── pages/       # Screen widgets
    ├── widgets/     # Reusable UI components
    └── [adapter]/   # State management (bloc, providers, etc.)
```

**Benefits**:
- Clear separation of concerns
- Testable business logic
- Maintainable codebase
- Scalable architecture

### Adapter-Driven State Management

Support for multiple state management patterns allows teams to choose the approach that fits their project:

- **Bloc**: Event-driven, predictable, testable
- **Riverpod**: Modern, modular, scalable
- **Provider**: Simple, lightweight, familiar
- **GetX**: Minimal boilerplate, fast development

### Design Token System

Consistent UI across platforms through centralized design tokens:

- **Colors**: Primary, secondary, background, text colors
- **Typography**: Font sizes, weights, line heights
- **Spacing**: Padding, margin, gap values
- **Elevation**: Shadow and depth values

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Developer Workflow                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Author UI in React/TSX                              │
│  2. Convert to JSON Schema (tsx2schema)                 │
│  3. Preview on Device (Dev-Proxy + Flutter-Dev-Client)  │
│  4. Generate Dart Code (schema2dart)                    │
│  5. Build Production App                                │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   TSX File   │─────▶│ JSON Schema  │─────▶│  Dart Code   │
│  (Authoring) │      │ (Interpreted)│      │ (Production) │
└──────────────┘      └──────────────┘      └──────────────┘
       │                      │                      │
       │                      │                      │
       ▼                      ▼                      ▼
  Codegen Tool          Flutter-Dev-Client    Flutter Build
```

### Communication Flow

```
┌─────────────┐                                ┌─────────────┐
│   Editor    │◀──────── WebSocket ──────────▶│  Dev-Proxy  │
│  (Web/IDE)  │         (Events/Schemas)       │   (Node.js) │
└─────────────┘                                └─────────────┘
                                                      │
                                                      │ WebSocket
                                                      │ (Broadcast)
                                                      ▼
                                               ┌─────────────┐
                                               │   Flutter   │
                                               │ Dev-Client  │
                                               │  (Mobile)   │
                                               └─────────────┘
```

---

## Packages & Responsibilities

### packages/lumora_core (Dart)

**Purpose**: Core runtime interpretation engine for JSON UI schemas

**Components**:
- `SchemaInterpreter`: Converts JSON schemas to Flutter widget trees
- `RendererRegistry`: Manages custom widget renderers
- `EventBridge`: Sends UI events back to editor
- `TemplateEngine`: Resolves `{{variable}}` placeholders
- `DeltaDebouncer`: Batches and debounces schema updates
- `IsolateParser`: Background parsing for large schemas

**Usage**:
```dart
import 'package:lumora_core/lumora_core.dart';

final interpreter = SchemaInterpreter(
  registry: RendererRegistry(),
  eventBridge: EventBridge(connection),
);

final widget = interpreter.interpretSchema(jsonSchema);
```

### packages/lumora_ui_tokens (Dart)

**Purpose**: Design token definitions for consistent UI

**Components**:
- `LumoraColors`: Color palette constants
- `LumoraTypography`: Text style definitions
- `LumoraSpacing`: Spacing and sizing constants

**Usage**:
```dart
import 'package:lumora_ui_tokens/lumora_ui_tokens.dart';

Container(
  padding: LumoraSpacing.medium,
  color: LumoraColors.primary,
  child: Text(
    'Hello',
    style: LumoraTypography.heading1,
  ),
)
```

### tools/codegen (Node.js)

**Purpose**: TSX to schema conversion and Dart code generation

**Components**:
- `tsx-parser.js`: Babel-based TSX to JSON schema converter
- `dart-generator.js`: Schema to Dart code generator
- `create-app.js`: Project scaffolding tool
- `cli.js`: Command-line interface

**Commands**:
```bash
# Convert TSX to schema
node cli.js tsx2schema input.tsx output.json

# Generate Dart code
node cli.js schema2dart schema.json ./output -a bloc

# Create new project
node cli.js create-app my_app --adapter=riverpod
```

### tools/dev-proxy (Node.js)

**Purpose**: Development session management and WebSocket broker

**Components**:
- `session-manager.ts`: Session creation and lifecycle
- `websocket-broker.ts`: WebSocket connection management
- `index.ts`: HTTP server and API endpoints

**API**:
```bash
# Create session
curl http://localhost:3000/session/new

# Send schema
curl -X POST http://localhost:3000/send/:sessionId \
  -H "Content-Type: application/json" \
  -d @schema.json
```

---

## Component Mapping

### UI Mapping Configuration

The `ui-mapping.json` file defines how schema types map to Dart widgets:

```json
{
  "View": {
    "dart": "Container",
    "props": {
      "padding": "EdgeInsets.all",
      "margin": "EdgeInsets.all",
      "backgroundColor": "Color"
    }
  },
  "Text": {
    "dart": "Text",
    "props": {
      "text": "data",
      "style": "TextStyle"
    }
  },
  "Button": {
    "dart": "ElevatedButton",
    "props": {
      "title": "child",
      "onTap": "onPressed"
    }
  },
  "List": {
    "dart": "ListView",
    "props": {
      "scrollDirection": "Axis",
      "children": "children"
    }
  },
  "Image": {
    "dart": "Image.network",
    "props": {
      "src": "src",
      "width": "width",
      "height": "height",
      "fit": "BoxFit"
    }
  },
  "Input": {
    "dart": "TextField",
    "props": {
      "placeholder": "decoration.hintText",
      "value": "controller.text",
      "onChange": "onChanged"
    }
  }
}
```

### Custom Component Mapping

Extend mappings in `kiro.config.json`:

```json
{
  "adapter": "bloc",
  "mappings": {
    "customComponents": {
      "Card": {
        "dart": "Card",
        "props": {
          "elevation": "elevation",
          "borderRadius": "shape.borderRadius"
        }
      },
      "Avatar": {
        "dart": "CircleAvatar",
        "props": {
          "imageUrl": "backgroundImage",
          "radius": "radius"
        }
      }
    }
  },
  "designTokens": {
    "colors": {
      "primary": "#6200EE",
      "secondary": "#03DAC6"
    },
    "typography": {
      "heading1": {
        "fontSize": 32,
        "fontWeight": "bold"
      }
    },
    "spacing": {
      "small": 8,
      "medium": 16,
      "large": 24
    }
  }
}
```

---

## State Management

### Adapter Selection Logic

Choose the adapter based on project size and complexity:

| Project Size | Screens | Recommended Adapter | Rationale |
|-------------|---------|---------------------|-----------|
| Tiny | 1-5 | Provider or Riverpod | Simple state, minimal boilerplate |
| Small | 6-10 | Riverpod | Modular, testable, scalable |
| Medium | 11-20 | Bloc | Structured, event-driven, predictable |
| Large | 20+ | Riverpod or Bloc | Modular architecture, team scalability |

### Generated Code by Adapter

#### Bloc Adapter

**Generated Files**:
```
lib/features/feature_name/
├── domain/
│   ├── entities/
│   └── usecases/
├── data/
│   ├── models/
│   └── repositories/
└── presentation/
    ├── bloc/
    │   ├── feature_bloc.dart
    │   ├── feature_event.dart
    │   └── feature_state.dart
    └── pages/
        └── feature_page.dart
```

**Usage Pattern**:
```dart
BlocProvider(
  create: (context) => FeatureBloc(),
  child: BlocBuilder<FeatureBloc, FeatureState>(
    builder: (context, state) {
      // Build UI based on state
    },
  ),
)
```

#### Riverpod Adapter

**Generated Files**:
```
lib/features/feature_name/
├── domain/
│   ├── entities/
│   └── providers/
├── data/
│   ├── models/
│   └── repositories/
└── presentation/
    ├── providers/
    │   └── feature_provider.dart
    └── pages/
        └── feature_page.dart
```

**Usage Pattern**:
```dart
final featureProvider = StateNotifierProvider<FeatureNotifier, FeatureState>(
  (ref) => FeatureNotifier(),
);

class FeaturePage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(featureProvider);
    // Build UI based on state
  }
}
```

#### Provider Adapter

**Generated Files**:
```
lib/features/feature_name/
└── presentation/
    ├── notifiers/
    │   └── feature_notifier.dart
    └── pages/
        └── feature_page.dart
```

**Usage Pattern**:
```dart
ChangeNotifierProvider(
  create: (context) => FeatureNotifier(),
  child: Consumer<FeatureNotifier>(
    builder: (context, notifier, child) {
      // Build UI based on notifier state
    },
  ),
)
```

#### GetX Adapter

**Generated Files**:
```
lib/features/feature_name/
└── presentation/
    ├── controllers/
    │   └── feature_controller.dart
    ├── bindings/
    │   └── feature_binding.dart
    └── pages/
        └── feature_page.dart
```

**Usage Pattern**:
```dart
class FeaturePage extends GetView<FeatureController> {
  @override
  Widget build(BuildContext context) {
    return Obx(() {
      // Build UI based on controller state
    });
  }
}
```

---

## Runtime Performance

### Delta Update Model

Use JSON Patch or JSON Merge Patch for efficient incremental updates:

**JSON Patch Example**:
```json
{
  "type": "ui_schema_delta",
  "payload": {
    "op": "replace",
    "path": "/root/children/0/props/text",
    "value": "Updated Text"
  }
}
```

**JSON Merge Patch Example**:
```json
{
  "type": "ui_schema_delta",
  "payload": {
    "root": {
      "children": {
        "0": {
          "props": {
            "text": "Updated Text"
          }
        }
      }
    }
  }
}
```

### Performance Optimizations

**Debouncing**: Batch multiple updates within 300ms window
```dart
final debouncer = DeltaDebouncer(
  duration: Duration(milliseconds: 300),
  onUpdate: (deltas) => applyBatchedDeltas(deltas),
);
```

**Isolate Parsing**: Parse large schemas in background
```dart
if (schemaSize > 100 * 1024) {
  final parsed = await compute(parseSchema, schemaJson);
}
```

**Lazy Rendering**: Use ListView.builder for large lists
```dart
if (children.length > 20) {
  return ListView.builder(
    itemCount: children.length,
    itemBuilder: (context, index) => buildChild(children[index]),
  );
}
```

### Performance Benchmarks

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Session Creation | < 100ms | Time from request to response |
| Schema Push | < 500ms | Round-trip latency (local network) |
| Large Schema Parse | < 2s | 500KB JSON to widget tree |
| Delta Application | < 100ms | Apply single delta update |
| List Rendering | 60 FPS | Smooth scrolling with 100+ items |

---

## Security

### Session Security

**Ephemeral Tokens**:
- Generated using `crypto.randomBytes(32)`
- Valid only for session lifetime (default 8 hours)
- Never logged or exposed in URLs
- Validated on every WebSocket message

**Session Isolation**:
- Separate client lists per session
- Messages only broadcast within session
- Automatic cleanup on expiration

### Network Security

**Recommendations**:
- Use TLS/WSS for production or remote development
- Firewall Dev-Proxy to local network only
- Implement rate limiting (100 messages/second per client)
- Set message size limits (10MB maximum)

**Dev-Client Warnings**:
- Warn users about code execution risks
- Display session source information
- Require confirmation for remote sessions

### Schema Validation

**Security Measures**:
- Whitelist allowed widget types
- Sanitize string props to prevent injection
- Validate schema structure before interpretation
- No eval() or dynamic code execution
- Safe template placeholder resolution

---

## Extensibility

### Plugin System

Plugins can extend Lumora with custom renderers and transformations.

**Plugin Manifest** (`plugin.json`):
```json
{
  "name": "lumora-plugin-maps",
  "version": "1.0.0",
  "compatibility": "^1.0.0",
  "renderers": [
    {
      "type": "Map",
      "class": "MapRenderer",
      "dependencies": ["google_maps_flutter"]
    }
  ],
  "hooks": {
    "onBeforeSchemaEmit": "./hooks/transform.js",
    "onAfterRender": "./hooks/postprocess.js"
  }
}
```

**Custom Renderer** (Dart):
```dart
class MapRenderer implements RendererFunction {
  @override
  Widget call(Map<String, dynamic> props, List<Widget> children) {
    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: LatLng(props['lat'], props['lng']),
        zoom: props['zoom'] ?? 12,
      ),
    );
  }
}

// Register in app initialization
void main() {
  final registry = RendererRegistry();
  registry.register('Map', MapRenderer());
  runApp(MyApp(registry: registry));
}
```

### Lifecycle Hooks

**Schema Transformation Hooks** (Node.js):
```javascript
// hooks/transform.js
module.exports = {
  onBeforeSchemaEmit(schema) {
    // Transform schema before sending to device
    return transformCustomComponents(schema);
  },
  
  onAfterSchemaEmit(schema) {
    // Add metadata or validation
    return addMetadata(schema);
  }
};
```

**Render Hooks** (Dart):
```dart
class CustomRenderHook implements RenderHook {
  @override
  Widget onBeforeRender(SchemaNode node, RenderContext ctx) {
    // Modify node before rendering
    return modifyNode(node);
  }
  
  @override
  Widget onAfterRender(Widget widget, RenderContext ctx) {
    // Wrap or modify rendered widget
    return wrapWidget(widget);
  }
}
```

---

## Testing & CI

### Testing Strategy

**Unit Tests**:
- Schema parsing and validation
- Widget mapping logic
- Template placeholder resolution
- Event bridge message formatting

**Widget Tests**:
- Schema interpreter rendering
- Custom renderer integration
- Error widget display
- Event handler triggering

**Integration Tests**:
- WebSocket connection flow
- Full schema rendering end-to-end
- Delta updates
- Session management

### CI Configuration

**GitHub Actions Example**:
```yaml
name: Test and Build

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - run: flutter test
      - run: flutter analyze
  
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - run: flutter build apk --debug
  
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - run: flutter build ios --no-codesign
```

### Golden File Testing

Compare generated output against golden files:

```bash
# Generate golden files
npm run codegen:golden

# Compare against golden files
npm run codegen:test
```

---

## Future Enhancements

### Planned Features

- **Hot Reload Integration**: Seamless integration with Flutter hot reload
- **Component Library**: Pre-built component library with common patterns
- **Test Generation**: Automatic test generation for domain logic
- **Performance Profiling**: Built-in performance monitoring and profiling
- **Multi-Platform Support**: Web and desktop platform support
- **Plugin Marketplace**: Centralized plugin discovery and installation

### Roadmap

**Q1 2026**:
- Enhanced plugin system
- Component library v1
- Performance profiling tools

**Q2 2026**:
- Web platform support
- Desktop platform support (Windows, macOS, Linux)
- Advanced debugging tools

**Q3 2026**:
- Plugin marketplace
- Test generation
- CI/CD templates

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details
