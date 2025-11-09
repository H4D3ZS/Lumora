# Schema Interpreter

This directory contains the core schema interpreter that converts JSON UI schemas into Flutter widgets at runtime.

## Performance Optimizations

The schema interpreter includes several performance optimizations to ensure smooth rendering even with large and complex UI schemas:

### 1. Lazy List Rendering

Lists with more than 20 children automatically use `ListView.builder` for lazy rendering instead of `ListView`. This prevents rendering all items upfront and improves memory usage and initial render time.

```dart
// Automatically uses ListView.builder for large lists
{
  "type": "List",
  "children": [...] // > 20 items
}
```

### 2. Isolate-Based Parsing

For very large JSON schemas (>100KB), the `IsolateParser` utility can parse JSON strings in a separate Dart isolate to avoid blocking the UI thread. This is particularly useful when receiving large schemas over the network.

```dart
import 'isolate_parser.dart';

// Parse large JSON string in isolate
final schema = await IsolateParser.parseSchema(jsonString);
final widget = interpreter.interpretSchema(schema);
```

### 3. Performance Monitoring

The interpreter tracks parsing and rendering time, logging warnings when operations exceed 2 seconds. In debug mode, detailed performance metrics can be displayed:

```dart
// Enable performance metrics in debug mode
interpreter.setShowPerformanceMetrics(true);
```

Performance metrics include:
- Total parsing and rendering time
- Start and end timestamps
- Warnings for operations exceeding 2 seconds

## Delta Updates

The interpreter supports incremental UI updates through delta operations, allowing efficient updates without re-sending the entire schema.

### Supported Delta Formats

#### 1. JSON Patch (RFC 6902)

JSON Patch provides precise operations for modifying specific parts of the schema:

```dart
// JSON Patch format
{
  "operations": [
    {
      "op": "replace",
      "path": "/root/props/backgroundColor",
      "value": "#FF0000"
    },
    {
      "op": "add",
      "path": "/root/children/-",
      "value": {
        "type": "Text",
        "props": { "text": "New item" }
      }
    }
  ]
}
```

Supported operations:
- `add`: Add a value at a path
- `remove`: Remove a value at a path
- `replace`: Replace a value at a path
- `move`: Move a value from one path to another
- `copy`: Copy a value from one path to another
- `test`: Test that a value at a path matches

#### 2. JSON Merge Patch (RFC 7396)

JSON Merge Patch provides a simpler format for partial updates:

```dart
// JSON Merge Patch format
{
  "root": {
    "props": {
      "backgroundColor": "#FF0000"
    }
  }
}
```

### Delta Debouncing

The `DeltaDebouncer` batches multiple rapid delta updates into a single application, preventing excessive rebuilds:

```dart
final debouncer = DeltaDebouncer(
  debounceDuration: Duration(milliseconds: 300),
  onBatchReady: (deltas) {
    // Apply batched deltas
    for (final delta in deltas) {
      interpreter.applyDelta(delta);
    }
  },
);

// Queue deltas - they will be batched
debouncer.addDelta(delta1);
debouncer.addDelta(delta2);
debouncer.addDelta(delta3);
// All three deltas applied together after 300ms
```

### Applying Deltas

```dart
// Apply a single delta
final updatedWidget = interpreter.applyDelta(delta);

// The interpreter maintains the current schema state
// and applies deltas incrementally
```

## Template Engine

The interpreter includes a template engine for resolving dynamic values in schemas using placeholder syntax.

### Template Placeholders

Template placeholders use `{{ }}` delimiters to inject dynamic values:

```dart
// Set context variables
interpreter.setContextVariable('userName', 'John');
interpreter.setContextVariable('messageCount', 5);

// Schema with placeholders
{
  "type": "Text",
  "props": {
    "text": "Hello {{userName}}, you have {{messageCount}} messages"
  }
}

// Renders as: "Hello John, you have 5 messages"
```

### Render Context

The render context stores variables that can be referenced in templates:

```dart
// Set single variable
interpreter.setContextVariable('name', 'Alice');

// Set multiple variables
interpreter.setContextVariables({
  'theme': 'dark',
  'language': 'en',
  'userId': 123,
});

// Get variable
final name = interpreter.getContextVariable('name');

// Clear all variables
interpreter.clearContext();
```

### Nested Context Scopes

The template engine supports nested context scopes for component hierarchies, allowing child components to inherit and override parent variables:

```dart
final parent = RenderContext();
parent.set('theme', 'dark');

final child = parent.createChild();
child.set('component', 'header');

// Child can access both its own and parent variables
child.get('theme'); // 'dark'
child.get('component'); // 'header'
```

### Template Resolution

Templates are automatically resolved during schema interpretation:

- **Strings**: Placeholders are replaced with variable values
- **Maps**: All string values are recursively resolved
- **Lists**: All elements are recursively resolved
- **Other types**: Numbers, booleans, etc. are unchanged

```dart
// Complex nested structure with templates
{
  "type": "View",
  "props": {
    "backgroundColor": "{{themeColor}}"
  },
  "children": [
    {
      "type": "Text",
      "props": {
        "text": "Welcome {{userName}}",
        "style": {
          "color": "{{textColor}}"
        }
      }
    }
  ]
}
```

### Missing Variables

If a variable is not found in the context, an empty string is used by default:

```dart
// No 'name' variable set
"Hello {{name}}" // Renders as: "Hello "
```

## Usage

```dart
final interpreter = SchemaInterpreter();

// Enable performance monitoring (optional)
interpreter.setShowPerformanceMetrics(true);

// Set context variables for templates
interpreter.setContextVariables({
  'userName': 'John',
  'theme': 'dark',
});

// Interpret initial schema (templates are resolved automatically)
final widget = interpreter.interpretSchema(schema);

// Later, apply delta updates
final updatedWidget = interpreter.applyDelta(delta);
```

## Supported Widget Types

- **View**: Renders as `Container` with padding and backgroundColor
- **Text**: Renders as `Text` with style properties
- **Button**: Renders as `ElevatedButton` with onTap handler
- **List**: Renders as `ListView` (or `ListView.builder` for large lists)
- **Image**: Renders as `Image.network` with caching
- **Input**: Renders as `TextField` with placeholder and value

## Error Handling

The interpreter provides robust error handling:
- Invalid schemas display error widgets with details
- Unknown widget types show placeholder widgets
- Missing required props use default values with warnings
- All errors are logged for debugging
