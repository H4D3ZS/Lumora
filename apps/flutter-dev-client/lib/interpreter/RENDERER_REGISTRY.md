# Renderer Registry

The Renderer Registry allows you to extend the Flutter-Dev-Client with custom widget renderers beyond the core primitives (View, Text, Button, List, Image, Input).

## Overview

The `RendererRegistry` class provides a mechanism to:
- Register custom renderers for new widget types
- Override default renderers for core types
- Load renderers from plugin manifests
- Dynamically extend the schema interpreter without modifying core code

## Basic Usage

### Creating a Registry

```dart
import 'package:flutter/material.dart';
import 'interpreter/renderer_registry.dart';
import 'interpreter/schema_interpreter.dart';

// Create a registry
final registry = RendererRegistry();

// Register a custom renderer
registry.register('CustomCard', (props, children) {
  return Card(
    elevation: (props['elevation'] as num?)?.toDouble() ?? 2.0,
    margin: EdgeInsets.all((props['margin'] as num?)?.toDouble() ?? 8.0),
    child: Column(children: children),
  );
});

// Create interpreter with registry
final interpreter = SchemaInterpreter(registry: registry);
```

### Using Custom Renderers

Once registered, custom renderers can be used in schemas:

```json
{
  "schemaVersion": "1.0",
  "root": {
    "type": "CustomCard",
    "props": {
      "elevation": 4.0,
      "margin": 16.0
    },
    "children": [
      {
        "type": "Text",
        "props": {
          "text": "This is inside a custom card"
        },
        "children": []
      }
    ]
  }
}
```

## Advanced Usage

### Overriding Core Types

You can override default renderers for core types:

```dart
// Override the default Button renderer
registry.register('Button', (props, children) {
  return TextButton(
    onPressed: () {
      print('Custom button pressed');
    },
    style: TextButton.styleFrom(
      backgroundColor: Colors.blue,
      foregroundColor: Colors.white,
    ),
    child: Text(props['title'] as String? ?? 'Button'),
  );
});
```

### Complex Custom Renderers

Create more complex renderers with full Flutter widget capabilities:

```dart
registry.register('Badge', (props, children) {
  final text = props['text'] as String? ?? '';
  final color = _parseColor(props['color'] as String? ?? '#FF0000');
  final size = (props['size'] as num?)?.toDouble() ?? 20.0;
  
  return Container(
    padding: EdgeInsets.symmetric(horizontal: size * 0.4, vertical: size * 0.2),
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(size),
    ),
    child: Text(
      text,
      style: TextStyle(
        color: Colors.white,
        fontSize: size * 0.6,
        fontWeight: FontWeight.bold,
      ),
    ),
  );
});

Color _parseColor(String colorString) {
  String hexColor = colorString.replaceAll('#', '');
  if (hexColor.length == 6) {
    hexColor = 'FF$hexColor';
  }
  return Color(int.parse(hexColor, radix: 16));
}
```

### Accessing Event Bridge

Custom renderers can access the event bridge through props:

```dart
registry.register('InteractiveCard', (props, children) {
  return GestureDetector(
    onTap: () {
      // Emit event through event bridge
      final onTap = props['onTap'] as String?;
      if (onTap != null) {
        // Parse and emit event
        // Format: "emit:action:payload"
        print('Card tapped: $onTap');
      }
    },
    child: Card(
      child: Column(children: children),
    ),
  );
});
```

## Plugin System

### Plugin Manifest Format

Create a plugin manifest JSON file:

```json
{
  "name": "kiro-plugin-maps",
  "version": "1.0.0",
  "compatibility": "^1.0.0",
  "renderers": [
    {
      "type": "Map",
      "class": "MapRenderer",
      "dependencies": ["google_maps_flutter"]
    },
    {
      "type": "Chart",
      "class": "ChartRenderer",
      "dependencies": ["fl_chart"]
    }
  ]
}
```

### Loading Plugins

Load plugins on app initialization:

```dart
import 'interpreter/plugin_loader.dart';
import 'interpreter/renderer_registry.dart';

Future<void> initializePlugins() async {
  final registry = RendererRegistry();
  
  // Load a single plugin
  await PluginLoader.loadAndRegisterPlugin(
    'assets/plugins/my-plugin-manifest.json',
    registry,
    rendererFactory: (declaration) {
      // Create renderer based on declaration
      switch (declaration.type) {
        case 'Map':
          return (props, children) => MapWidget(props: props);
        case 'Chart':
          return (props, children) => ChartWidget(props: props);
        default:
          return (props, children) => Container();
      }
    },
  );
  
  // Or load multiple plugins
  await PluginLoader.loadPlugins(
    [
      'assets/plugins/plugin1.json',
      'assets/plugins/plugin2.json',
    ],
    registry,
    rendererFactory: createRendererFromDeclaration,
  );
}

RendererFunction createRendererFromDeclaration(RendererDeclaration declaration) {
  // Factory function to create renderers
  switch (declaration.type) {
    case 'Map':
      return (props, children) => MapWidget(props: props);
    case 'Chart':
      return (props, children) => ChartWidget(props: props);
    default:
      return (props, children) => Container(
        child: Text('Unknown type: ${declaration.type}'),
      );
  }
}
```

### Plugin Compatibility

The plugin loader validates compatibility using semantic versioning:

```dart
// Plugin manifest
{
  "compatibility": "^1.0.0"  // Compatible with 1.x.x
}

// Current framework version
PluginLoader.supportedCompatibility = '1.0';
```

## Registry Management

### Checking Registered Types

```dart
// Check if a type is registered
if (registry.hasRenderer('CustomCard')) {
  print('CustomCard renderer is available');
}

// Get all registered types
final types = registry.getRegisteredTypes();
print('Registered types: $types');

// Get count of registered renderers
print('Total renderers: ${registry.count}');
```

### Unregistering Renderers

```dart
// Unregister a specific type
registry.unregister('CustomCard');

// Clear all renderers
registry.clear();
```

## Integration with SchemaInterpreter

The SchemaInterpreter checks the registry before using default renderers:

1. When a schema node is encountered, the interpreter first checks if a custom renderer exists in the registry
2. If found, the custom renderer is used
3. If not found (or if the custom renderer returns null), the default renderer is used
4. If no default renderer exists, an error widget is displayed

This allows custom renderers to:
- Add new widget types
- Override core types
- Provide fallback behavior

## Example: Complete Integration

```dart
import 'package:flutter/material.dart';
import 'interpreter/renderer_registry.dart';
import 'interpreter/schema_interpreter.dart';
import 'interpreter/plugin_loader.dart';
import 'services/event_bridge.dart';
import 'services/dev_proxy_connection.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Create registry
  final registry = RendererRegistry();
  
  // Register custom renderers
  registry.register('Badge', (props, children) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.red,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        props['text'] as String? ?? '',
        style: const TextStyle(color: Colors.white, fontSize: 12),
      ),
    );
  });
  
  // Load plugins
  await PluginLoader.loadPlugins(
    ['assets/plugins/example-plugin-manifest.json'],
    registry,
    rendererFactory: (declaration) {
      // Create renderers based on plugin declarations
      return (props, children) => Container(
        child: Text('Plugin renderer: ${declaration.type}'),
      );
    },
  );
  
  runApp(MyApp(registry: registry));
}

class MyApp extends StatelessWidget {
  final RendererRegistry registry;
  
  const MyApp({required this.registry, super.key});
  
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: DevClientScreen(registry: registry),
    );
  }
}

class DevClientScreen extends StatefulWidget {
  final RendererRegistry registry;
  
  const DevClientScreen({required this.registry, super.key});
  
  @override
  State<DevClientScreen> createState() => _DevClientScreenState();
}

class _DevClientScreenState extends State<DevClientScreen> {
  late SchemaInterpreter interpreter;
  
  @override
  void initState() {
    super.initState();
    
    // Create connection and event bridge
    final connection = DevProxyConnection(
      wsUrl: 'ws://10.0.2.2:3000/ws',
      sessionId: 'test-session',
      token: 'test-token',
    );
    final eventBridge = EventBridge(connection: connection);
    
    // Create interpreter with registry and event bridge
    interpreter = SchemaInterpreter(
      registry: widget.registry,
      eventBridge: eventBridge,
    );
  }
  
  @override
  Widget build(BuildContext context) {
    // Use interpreter to render schemas
    return Scaffold(
      appBar: AppBar(title: const Text('Lumora Client')),
      body: Container(),
    );
  }
}
```

## Best Practices

1. **Register renderers early**: Register all custom renderers during app initialization, before creating the SchemaInterpreter
2. **Handle errors gracefully**: Custom renderers should handle missing or invalid props gracefully
3. **Use type safety**: Cast props to appropriate types with null safety
4. **Document custom types**: Document the expected props and behavior of custom renderers
5. **Test custom renderers**: Write widget tests for custom renderers to ensure they work correctly
6. **Version plugins carefully**: Use semantic versioning for plugin compatibility
7. **Validate props**: Validate required props and provide sensible defaults

## Troubleshooting

### Custom renderer not being used

- Check that the renderer is registered before creating the SchemaInterpreter
- Verify the type name matches exactly (case-sensitive)
- Check logs for registration confirmation

### Custom renderer returns null

- Ensure the renderer function returns a valid Widget
- Check for exceptions in the renderer function
- Verify props are being accessed correctly

### Plugin not loading

- Check the asset path is correct
- Verify the plugin manifest JSON is valid
- Check compatibility version matches
- Look for error logs from PluginLoader

## API Reference

### RendererRegistry

- `register(String type, RendererFunction renderer)` - Register a custom renderer
- `render(String type, Map<String, dynamic> props, List<Widget> children)` - Render a widget
- `hasRenderer(String type)` - Check if a renderer exists
- `getRegisteredTypes()` - Get list of registered types
- `unregister(String type)` - Remove a renderer
- `clear()` - Remove all renderers
- `count` - Get number of registered renderers

### PluginLoader

- `loadManifest(String assetPath)` - Load a plugin manifest
- `validateCompatibility(PluginManifest manifest)` - Validate plugin compatibility
- `registerRenderersFromManifest(...)` - Register renderers from manifest
- `loadAndRegisterPlugin(...)` - Load and register a single plugin
- `loadPlugins(...)` - Load and register multiple plugins

### SchemaInterpreter

- Constructor accepts optional `registry` parameter
- Checks registry before using default renderers
- Falls back to default behavior if custom renderer not found
