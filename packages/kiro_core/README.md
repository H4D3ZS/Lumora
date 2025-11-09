# Kiro Core

Core schema interpretation and rendering engine for the Lumora framework.

## Overview

`kiro_core` provides the fundamental building blocks for interpreting JSON UI schemas and rendering them as native Flutter widgets. This package is designed to be reusable across different Flutter applications that need runtime UI interpretation capabilities.

## Features

- **Schema Interpretation**: Convert JSON UI schemas to Flutter widget trees
- **Custom Renderers**: Register custom widget renderers via RendererRegistry
- **Event Bridge**: Send UI events back to connected systems
- **Template Engine**: Resolve template placeholders with dynamic data
- **Delta Updates**: Apply incremental schema updates efficiently
- **Performance Optimizations**: Isolate-based parsing for large schemas, lazy list rendering
- **Error Handling**: Comprehensive error widgets and validation

## Installation

Add this to your package's `pubspec.yaml` file:

```yaml
dependencies:
  kiro_core:
    path: ../kiro_core
```

## Usage

### Basic Schema Interpretation

```dart
import 'package:kiro_core/kiro_core.dart';

// Create interpreter
final interpreter = SchemaInterpreter();

// Interpret schema
final schema = {
  'schemaVersion': '1.0',
  'root': {
    'type': 'View',
    'props': {'padding': 16},
    'children': [
      {
        'type': 'Text',
        'props': {'text': 'Hello World'},
        'children': []
      }
    ]
  }
};

final widget = interpreter.interpretSchema(schema);
```

### Custom Renderers

```dart
// Create registry
final registry = RendererRegistry();

// Register custom renderer
registry.register('CustomCard', (props, children) {
  return Card(
    elevation: props['elevation'] ?? 2.0,
    child: Column(children: children),
  );
});

// Use with interpreter
final interpreter = SchemaInterpreter(registry: registry);
```

### Event Bridge

```dart
// Create event bridge with connection
final eventBridge = EventBridge(connection: myConnection);

// Emit events
eventBridge.emitEvent('button_tap', {'id': '123'});

// Create handlers from spec strings
final handler = eventBridge.createHandler('emit:button_tap:{}');
```

### Template Engine

```dart
// Create render context
final context = RenderContext();
context.set('name', 'John');
context.set('count', 5);

// Resolve templates
final result = TemplateEngine.resolve('Hello {{name}}!', context);
// Result: 'Hello John!'
```

## Components

- **SchemaInterpreter**: Main class for interpreting schemas
- **RendererRegistry**: Registry for custom widget renderers
- **EventBridge**: Handles UI event emission
- **TemplateEngine**: Resolves template placeholders
- **DeltaDebouncer**: Batches rapid delta updates
- **IsolateParser**: Parses large schemas in isolates
- **ErrorOverlay**: Displays schema errors
- **SchemaErrorWidget**: Placeholder for rendering errors

## License

MIT
