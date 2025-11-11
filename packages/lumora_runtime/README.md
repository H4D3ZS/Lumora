# Lumora Runtime

Runtime interpreter for Lumora IR schemas that renders Flutter widgets dynamically without compilation.

## Overview

Lumora Runtime is the core engine that powers instant preview in Lumora Go. It interprets Lumora IR schemas and builds Flutter widget trees on-the-fly, enabling developers to see their React/TSX code rendered as native Flutter widgets in real-time.

## Features

- **Dynamic Widget Interpretation**: Parse and render Lumora IR schemas as Flutter widgets
- **Extensible Widget Registry**: Register custom widgets and override core widgets
- **State Management**: Integrated state management with change notifications
- **Event Bridge**: Handle user interactions and sync with dev server
- **Efficient Updates**: Stable widget keys for optimal rebuild performance
- **Error Handling**: Graceful fallback widgets and error overlays

## Architecture

```
lumora_runtime/
├── interpreter/     # Schema interpretation and widget building
├── registry/        # Widget builder registry
├── state/          # State management system
├── events/         # Event handling and bridge
└── utils/          # Parsing utilities and helpers
```

## Usage

```dart
import 'package:lumora_runtime/lumora_runtime.dart';

// Create interpreter
final interpreter = LumoraInterpreter();

// Register core widgets (done in task 2.2)
interpreter.registry.registerCore();

// Build widget from schema
final schema = {
  'id': 'root',
  'type': 'View',
  'props': {'padding': 16},
  'children': [
    {
      'id': 'text1',
      'type': 'Text',
      'props': {'text': 'Hello, Lumora!'},
      'children': [],
    }
  ],
};

final widget = interpreter.buildFromSchema(schema);
```

## Components

### Schema Interpreter

The `LumoraInterpreter` class is the main entry point for interpreting schemas:

- Parses Lumora IR JSON into widget trees
- Resolves state references and event handlers
- Handles errors gracefully with fallback widgets
- Maintains widget keys for efficient updates

### Widget Registry

The `WidgetRegistry` manages widget builders:

- Maps widget type names to builder functions
- Supports custom widget registration
- Provides fallback for unknown widget types

### State Manager

The `StateManager` handles application state:

- Supports local and global state
- Provides change notifications for reactive updates
- Integrates with Flutter's ChangeNotifier

### Event Bridge

The `EventBridge` handles user interactions:

- Creates event handler functions for widgets
- Triggers registered callbacks
- Notifies listeners (e.g., dev server connection)

## Requirements

This package implements **Requirement 1.1** from the Lumora Engine Completion spec:

> WHEN Lumora Go receives a Lumora IR schema, THE Interpreter SHALL parse and render Flutter widgets within 500ms

## Next Steps

- Task 2: Build core widget registry with standard Flutter widgets
- Task 3: Implement prop resolution and computed values
- Task 4: Build state management system integration
- Task 5: Implement event bridge with dev server sync

## License

MIT License - See LICENSE file for details
