# Template Engine Example

This document demonstrates how to use the template engine in the Flutter-Dev-Client.

## Basic Usage

```dart
import 'package:flutter_dev_client/interpreter/schema_interpreter.dart';

// Create interpreter
final interpreter = SchemaInterpreter();

// Set context variables
interpreter.setContextVariables({
  'userName': 'Alice',
  'messageCount': 5,
  'theme': 'dark',
});

// Schema with template placeholders
final schema = {
  'schemaVersion': '1.0',
  'root': {
    'type': 'View',
    'props': {},
    'children': [
      {
        'type': 'Text',
        'props': {
          'text': 'Welcome {{userName}}!',
        },
        'children': [],
      },
      {
        'type': 'Text',
        'props': {
          'text': 'You have {{messageCount}} new messages',
        },
        'children': [],
      },
    ],
  },
};

// Interpret schema - templates are resolved automatically
final widget = interpreter.interpretSchema(schema);

// Result:
// - First Text widget displays: "Welcome Alice!"
// - Second Text widget displays: "You have 5 new messages"
```

## Advanced Features

### Nested Context Scopes

```dart
import 'package:flutter_dev_client/interpreter/template_engine.dart';

// Create parent context
final parentContext = RenderContext();
parentContext.set('theme', 'dark');
parentContext.set('language', 'en');

// Create child context that inherits from parent
final childContext = parentContext.createChild();
childContext.set('component', 'header');

// Child can access both its own and parent variables
print(childContext.get('theme')); // 'dark'
print(childContext.get('component')); // 'header'
```

### Dynamic Values

```dart
// Set different types of values
interpreter.setContextVariables({
  'name': 'John',           // String
  'age': 30,                // Number
  'active': true,           // Boolean
  'score': 95.5,            // Double
});

// All values are converted to strings in templates
final schema = {
  'schemaVersion': '1.0',
  'root': {
    'type': 'Text',
    'props': {
      'text': '{{name}} is {{age}} years old, active: {{active}}, score: {{score}}',
    },
    'children': [],
  },
};

// Result: "John is 30 years old, active: true, score: 95.5"
```

### Missing Variables

```dart
// If a variable is not set, empty string is used
final schema = {
  'schemaVersion': '1.0',
  'root': {
    'type': 'Text',
    'props': {
      'text': 'Hello {{unknownVariable}}!',
    },
    'children': [],
  },
};

// Result: "Hello !"
```

### Complex Nested Structures

```dart
interpreter.setContextVariables({
  'user': 'Alice',
  'city': 'New York',
  'color': '#FF5733',
});

final schema = {
  'schemaVersion': '1.0',
  'root': {
    'type': 'View',
    'props': {
      'backgroundColor': '{{color}}',
    },
    'children': [
      {
        'type': 'Text',
        'props': {
          'text': 'User: {{user}}',
          'style': {
            'fontSize': 24,
            'color': '{{color}}',
          },
        },
        'children': [],
      },
      {
        'type': 'Text',
        'props': {
          'text': 'Location: {{city}}',
        },
        'children': [],
      },
    ],
  },
};

// Templates are resolved recursively in all nested structures
```

## Use Cases

### 1. User Personalization

```dart
interpreter.setContextVariable('userName', currentUser.name);

// All UI elements can reference {{userName}}
```

### 2. Localization

```dart
interpreter.setContextVariables({
  'greeting': translations['greeting'],
  'buttonLabel': translations['submit'],
});
```

### 3. Theme Variables

```dart
interpreter.setContextVariables({
  'primaryColor': theme.primaryColor,
  'backgroundColor': theme.backgroundColor,
  'textColor': theme.textColor,
});
```

### 4. Dynamic Content

```dart
interpreter.setContextVariables({
  'itemCount': cart.items.length,
  'totalPrice': cart.total.toStringAsFixed(2),
  'currency': userSettings.currency,
});
```

## API Reference

### SchemaInterpreter Methods

- `setContextVariable(String name, dynamic value)` - Set a single variable
- `setContextVariables(Map<String, dynamic> variables)` - Set multiple variables
- `getContextVariable(String name)` - Get a variable value
- `clearContext()` - Clear all variables
- `renderContext` - Access the underlying RenderContext

### RenderContext Methods

- `set(String name, dynamic value)` - Set a variable
- `setAll(Map<String, dynamic> variables)` - Set multiple variables
- `get(String name)` - Get a variable value
- `has(String name)` - Check if variable exists
- `createChild()` - Create a child context with inheritance
- `clear()` - Clear all variables in current context
- `getAll()` - Get all variables in current context

### TemplateEngine Static Methods

- `resolve(String value, RenderContext context)` - Resolve placeholders in a string
- `resolveValue(dynamic value, RenderContext context)` - Resolve any value recursively
- `resolveMap(Map<String, dynamic> map, RenderContext context)` - Resolve all values in a map
- `resolveList(List<dynamic> list, RenderContext context)` - Resolve all elements in a list
- `hasPlaceholders(String value)` - Check if string contains placeholders
- `extractVariableNames(String value)` - Extract all variable names from a string
