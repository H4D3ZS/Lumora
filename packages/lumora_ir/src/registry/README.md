# Widget Mapping Registry

The Widget Mapping Registry provides bidirectional mappings between React and Flutter widgets, enabling seamless conversion between the two frameworks.

## Overview

The registry manages:
- Widget type mappings (e.g., React `div` ↔ Flutter `Container`)
- Property name mappings (e.g., React `children` ↔ Flutter `child`)
- Style property mappings (e.g., React `backgroundColor` ↔ Flutter `decoration.color`)
- Event handler mappings (e.g., React `onClick` ↔ Flutter `onPressed`)
- Import statements for each framework
- Fallback widgets for unmapped types

## Usage

### Basic Usage

```typescript
import { getRegistry } from '@lumora/ir';

const registry = getRegistry();

// Convert React component to Flutter widget
const flutterWidget = registry.getFlutterWidget('div');
// Returns: "Container"

// Convert Flutter widget to React component
const reactComponent = registry.getReactComponent('Text');
// Returns: "span"

// Get prop mapping
const propMapping = registry.getPropMapping('Text', 'children');
// Returns: { react: "children", flutter: "data", type: "string" }

// Convert prop names
const flutterProp = registry.getFlutterProp('Text', 'children');
// Returns: "data"

// Convert event names
const flutterEvent = registry.getFlutterEvent('Button', 'onClick');
// Returns: "onPressed"
```

### Loading Custom Mappings

```typescript
import { getRegistry } from '@lumora/ir';

const registry = getRegistry();

// Load custom mappings from your project
registry.loadCustomMappings('./path/to/custom-widget-mappings.yaml');
```

### Getting Widget Information

```typescript
// Get complete widget mapping
const mapping = registry.getMapping('Container');

// Check if mapping exists
const exists = registry.hasMapping('Container');

// Get all widget names
const allWidgets = registry.getAllWidgetNames();

// Get required imports
const flutterImport = registry.getImport('Container', 'flutter');
// Returns: "package:flutter/material.dart"

// Get fallback widget
const fallback = registry.getFallback('UnknownWidget', 'flutter');
// Returns: "Container"
```

## Widget Mappings Schema

Widget mappings are defined in YAML format:

```yaml
schemaVersion: "1.0"

WidgetName:
  react:
    component: "div"              # React component name
    import: "react-native"        # Optional import statement
  flutter:
    widget: "Container"           # Flutter widget name
    import: "package:flutter/material.dart"
  props:
    propName:
      react: "padding"            # React prop name
      flutter: "padding"          # Flutter prop name
      type: "number"              # Data type
      transform: "EdgeInsets.all" # Optional transformation
      default: 0                  # Optional default value
  styles:
    styleName:
      react: "backgroundColor"
      flutter: "decoration.color"
      type: "color"
      transform: "Color"
  events:
    eventName:
      react: "onClick"
      flutter: "onPressed"
      parameters: []              # Optional parameter mappings
  fallback:
    react: "div"                  # Fallback React component
    flutter: "Container"          # Fallback Flutter widget
  custom: false                   # Whether this is a custom mapping
```

## Supported Data Types

- `string`: Text values
- `number`: Numeric values (int, double, float)
- `boolean`: True/false values
- `color`: Color values (hex, rgb, named)
- `function`: Callback functions
- `widget`: Child widget/component
- `widgetList`: Array of child widgets
- `object`: Complex nested object
- `enum`: Enumerated values
- `axis`: Scroll direction (horizontal, vertical)
- `alignment`: Layout alignment values
- `textAlign`: Text alignment values
- `fontWeight`: Font weight values

## Transformation Functions

The registry supports various transformation functions for converting values between frameworks:

- `EdgeInsets.all`: Convert number to EdgeInsets
- `EdgeInsets.symmetric`: Convert object to symmetric EdgeInsets
- `Color`: Convert hex/rgb to Color object
- `TextStyle`: Convert style object to TextStyle
- `BoxDecoration`: Convert style object to BoxDecoration
- `Axis`: Convert string to Axis enum
- `MainAxisAlignment`: Convert string to alignment enum
- `CrossAxisAlignment`: Convert string to alignment enum
- `TextAlign`: Convert string to TextAlign enum
- `FontWeight`: Convert string/number to FontWeight
- `BorderRadius.circular`: Convert number to BorderRadius
- `Border`: Convert border object to Border
- `Icons`: Convert icon name to Icons enum
- `Duration.milliseconds`: Convert number to Duration

## Default Mappings

The registry includes 50+ default widget mappings covering:

### Layout Widgets
- Container, View, Row, Column, Stack
- Padding, Center, Align, SizedBox
- Expanded, Flexible, Spacer, Wrap

### Text Widgets
- Text

### Button Widgets
- Button, ElevatedButton, TextButton, OutlinedButton
- IconButton, TouchableOpacity, GestureDetector
- FloatingActionButton, InkWell

### Input Widgets
- TextField, TextInput, Checkbox, Radio
- Switch, Slider

### List Widgets
- ListView, FlatList, GridView, ListTile

### Image Widgets
- Image, ImageNetwork, Icon

### Card Widgets
- Card

### App Structure Widgets
- Scaffold, AppBar, Drawer, BottomNavigationBar
- TabBar, SafeArea

### Progress Indicators
- CircularProgressIndicator, LinearProgressIndicator

### Dialog Widgets
- AlertDialog, SnackBar

### Other Widgets
- Divider, Chip, Tooltip, RefreshIndicator
- Opacity, ClipRRect, SingleChildScrollView
- Form, AnimatedContainer

## Custom Mappings

You can define custom mappings in your project's `widget-mappings.yaml` file:

```yaml
schemaVersion: "1.0"

# Custom widget mapping
MyCustomWidget:
  react:
    component: "CustomComponent"
    import: "./components/CustomComponent"
  flutter:
    widget: "CustomWidget"
    import: "package:my_app/widgets/custom_widget.dart"
  props:
    title:
      react: "title"
      flutter: "title"
      type: "string"
  custom: true  # Mark as custom to override defaults
```

Load custom mappings:

```typescript
registry.loadCustomMappings('./widget-mappings.yaml');
```

## API Reference

### WidgetMappingRegistry

#### Methods

- `getMapping(widgetName: string): WidgetMapping | undefined`
  - Get complete widget mapping by name

- `getWidgetNameFromReact(reactComponent: string): string | undefined`
  - Get widget name from React component name

- `getWidgetNameFromFlutter(flutterWidget: string): string | undefined`
  - Get widget name from Flutter widget name

- `getFlutterWidget(reactComponent: string): string`
  - Convert React component to Flutter widget

- `getReactComponent(flutterWidget: string): string`
  - Convert Flutter widget to React component

- `getPropMapping(widgetName: string, propName: string): PropMapping | undefined`
  - Get property mapping for a widget

- `getFlutterProp(widgetName: string, reactProp: string): string`
  - Convert React prop name to Flutter prop name

- `getReactProp(widgetName: string, flutterProp: string): string`
  - Convert Flutter prop name to React prop name

- `getStyleMapping(widgetName: string, styleName: string): StyleMapping | undefined`
  - Get style property mapping

- `getEventMapping(widgetName: string, eventName: string): EventMapping | undefined`
  - Get event handler mapping

- `getFlutterEvent(widgetName: string, reactEvent: string): string`
  - Convert React event name to Flutter event name

- `getReactEvent(widgetName: string, flutterEvent: string): string`
  - Convert Flutter event name to React event name

- `getImport(widgetName: string, framework: 'react' | 'flutter'): string | undefined`
  - Get required import statement for a widget

- `getFallback(widgetName: string, framework: 'react' | 'flutter'): string`
  - Get fallback widget for unmapped types

- `getAllWidgetNames(): string[]`
  - Get all registered widget names

- `hasMapping(widgetName: string): boolean`
  - Check if a widget mapping exists

- `getSchemaVersion(): string`
  - Get the schema version

- `loadCustomMappings(customMappingsPath: string): void`
  - Load custom widget mappings from a file

### Singleton Functions

- `getRegistry(): WidgetMappingRegistry`
  - Get the singleton registry instance

- `resetRegistry(): void`
  - Reset the singleton instance (useful for testing)

## Examples

### Converting a React Component Tree

```typescript
import { getRegistry } from '@lumora/ir';

const registry = getRegistry();

function convertReactToFlutter(reactComponent: any) {
  const widgetName = registry.getWidgetNameFromReact(reactComponent.type);
  const flutterWidget = registry.getFlutterWidget(reactComponent.type);
  
  // Convert props
  const flutterProps = {};
  for (const [key, value] of Object.entries(reactComponent.props)) {
    const flutterPropName = registry.getFlutterProp(widgetName, key);
    flutterProps[flutterPropName] = value;
  }
  
  return {
    widget: flutterWidget,
    props: flutterProps
  };
}
```

### Converting Event Handlers

```typescript
import { getRegistry } from '@lumora/ir';

const registry = getRegistry();

function convertEventHandlers(widgetName: string, reactEvents: any) {
  const flutterEvents = {};
  
  for (const [eventName, handler] of Object.entries(reactEvents)) {
    const flutterEventName = registry.getFlutterEvent(widgetName, eventName);
    flutterEvents[flutterEventName] = handler;
  }
  
  return flutterEvents;
}

// Usage
const reactEvents = { onClick: () => console.log('clicked') };
const flutterEvents = convertEventHandlers('Button', reactEvents);
// Returns: { onPressed: () => console.log('clicked') }
```

## Testing

The registry includes comprehensive tests covering:
- Default mappings loading
- Widget lookup and conversion
- Property mappings
- Style mappings
- Event mappings
- Import statements
- Fallback behavior
- Custom mappings
- Singleton pattern

Run tests:
```bash
npm test -- --testPathPattern=widget-mapping-registry
```

## Contributing

To add new widget mappings:

1. Edit `src/schema/widget-mappings.yaml`
2. Add the widget mapping following the schema
3. Run tests to ensure mappings work correctly
4. Update documentation if needed

## License

MIT
