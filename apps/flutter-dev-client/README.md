# Flutter-Dev-Client

Native Flutter application that connects to Dev-Proxy, receives JSON UI schemas, and renders them as native widgets in real-time.

## Purpose

The Flutter-Dev-Client is the mobile runtime for Lumora, enabling instant preview of UI changes on actual devices. It interprets JSON UI schemas and renders them as native Flutter widgets, providing a true native experience during development.

## Features

- **WebSocket Connection**: Real-time connection to Dev-Proxy server
- **Schema Interpretation**: Converts JSON UI schemas to Flutter widget trees
- **Native Rendering**: Renders primitives as native Flutter widgets
- **Event Bridge**: Sends UI events back to editors through WebSocket
- **Performance Optimized**: Isolate-based parsing for large schemas
- **Delta Updates**: Efficient incremental UI updates
- **Template Engine**: Dynamic value injection with placeholder resolution
- **Error Handling**: Graceful error display and recovery
- **Platform Support**: Works on both Android and iOS

## Installation

### Prerequisites

- Flutter SDK >= 3.0.0
- Dart SDK >= 3.0.0
- iOS 12.0+ or Android API 21+

### Setup

```bash
cd apps/flutter-dev-client
flutter pub get
```

## Running the App

### On Emulator/Simulator

```bash
flutter run
```

### On Physical Device

```bash
# List available devices
flutter devices

# Run on specific device
flutter run -d <device-id>
```

### Platform-Specific Commands

**Android**:
```bash
flutter run -d android
```

**iOS**:
```bash
flutter run -d ios
```

## Connecting to Dev-Proxy

### Method 1: QR Code Scanning (Recommended)

1. Start the Dev-Proxy server
2. Create a session: `curl http://localhost:3000/session/new`
3. Scan the QR code displayed in the terminal with the Flutter app
4. The app will automatically connect and authenticate

### Method 2: Manual Configuration

Edit the connection settings in the app or provide them via environment:

```dart
final wsUrl = 'ws://192.168.1.100:3000/ws';
final sessionId = 'abc123def456';
final token = 'deadbeef...';
```

**Important**: For physical devices, use your machine's LAN IP address instead of `localhost`.

## Supported Primitives

The Flutter-Dev-Client supports the following UI primitives:

### View
Container with layout properties.

**Props**:
- `padding` - Padding around content (number or object)
- `margin` - Margin around container (number or object)
- `backgroundColor` - Background color (hex string)
- `width` - Width constraint
- `height` - Height constraint

**Example**:
```json
{
  "type": "View",
  "props": {
    "padding": 16,
    "backgroundColor": "#FFFFFF"
  },
  "children": []
}
```

### Text
Text display with styling.

**Props**:
- `text` - Text content (string or template)
- `style` - Text style object
  - `fontSize` - Font size (number)
  - `fontWeight` - Font weight ("normal", "bold")
  - `color` - Text color (hex string)
- `textAlign` - Text alignment ("left", "center", "right")

**Example**:
```json
{
  "type": "Text",
  "props": {
    "text": "Hello World",
    "style": {
      "fontSize": 24,
      "fontWeight": "bold",
      "color": "#000000"
    }
  },
  "children": []
}
```

### Button
Interactive button with tap handler.

**Props**:
- `title` - Button text (string)
- `onTap` - Event handler (emit:action:payload format)
- `disabled` - Disabled state (boolean)
- `style` - Button style object

**Example**:
```json
{
  "type": "Button",
  "props": {
    "title": "Click Me",
    "onTap": "emit:buttonClicked:{\"id\":\"btn1\"}"
  },
  "children": []
}
```

### List
Scrollable list with lazy rendering.

**Props**:
- `scrollDirection` - Scroll direction ("vertical", "horizontal")
- `itemSpacing` - Spacing between items (number)

**Example**:
```json
{
  "type": "List",
  "props": {
    "scrollDirection": "vertical"
  },
  "children": [...]
}
```

### Image
Network image with caching.

**Props**:
- `src` - Image URL (string)
- `width` - Image width (number)
- `height` - Image height (number)
- `fit` - Image fit mode ("cover", "contain", "fill")

**Example**:
```json
{
  "type": "Image",
  "props": {
    "src": "https://example.com/image.png",
    "width": 200,
    "height": 200,
    "fit": "cover"
  },
  "children": []
}
```

### Input
Text input field.

**Props**:
- `placeholder` - Placeholder text (string)
- `value` - Initial value (string)
- `onChange` - Change event handler (emit:action:payload format)
- `keyboardType` - Keyboard type ("text", "number", "email")

**Example**:
```json
{
  "type": "Input",
  "props": {
    "placeholder": "Enter text...",
    "onChange": "emit:inputChanged:{}"
  },
  "children": []
}
```

## Schema Format

The Flutter-Dev-Client expects schemas in the following format:

```json
{
  "schemaVersion": "1.0",
  "root": {
    "type": "View",
    "props": {},
    "children": []
  }
}
```

### Schema Node Structure

Each node in the schema tree has:
- `type` - Widget type (View, Text, Button, List, Image, Input)
- `props` - Properties object (varies by type)
- `children` - Array of child nodes

## WebSocket Protocol

### Join Message

On connection, the app sends:

```json
{
  "type": "join",
  "payload": {
    "sessionId": "abc123",
    "token": "deadbeef...",
    "clientType": "device"
  }
}
```

### Receiving Messages

The app handles these message types:

**Full UI Schema**:
```json
{
  "type": "full_ui_schema",
  "meta": {...},
  "payload": {
    "schemaVersion": "1.0",
    "root": {...}
  }
}
```

**UI Schema Delta**:
```json
{
  "type": "ui_schema_delta",
  "meta": {...},
  "payload": {
    "op": "replace",
    "path": "/root/children/0/props/text",
    "value": "New Text"
  }
}
```

**Ping**:
```json
{
  "type": "ping",
  "meta": {...},
  "payload": {}
}
```

### Sending Events

The app sends events back to the editor:

```json
{
  "type": "event",
  "meta": {
    "sessionId": "abc123",
    "source": "device",
    "timestamp": 1699999999999
  },
  "payload": {
    "action": "buttonClicked",
    "data": {"id": "btn1"}
  }
}
```

## Template Engine

The Flutter-Dev-Client supports template placeholders for dynamic values:

**Schema**:
```json
{
  "type": "Text",
  "props": {
    "text": "Hello, {{userName}}!"
  }
}
```

**Render Context**:
```dart
final context = RenderContext({
  'userName': 'Alice'
});
```

**Result**: "Hello, Alice!"

## Performance Optimizations

### Isolate-Based Parsing

For schemas larger than 100KB, parsing is automatically offloaded to a Dart isolate to prevent UI thread blocking.

### Lazy List Rendering

Lists with more than 20 items automatically use `ListView.builder` for efficient lazy rendering.

### Delta Debouncing

Multiple delta updates within 300ms are batched and applied together to reduce rebuilds.

### Widget Key Management

Efficient widget keys ensure minimal rebuilds when schemas change.

## Error Handling

### Connection Errors

- **WebSocket Failure**: Shows retry dialog with exponential backoff
- **Authentication Failure**: Returns to QR scan screen
- **Network Timeout**: Displays offline indicator

### Schema Errors

- **Invalid JSON**: Displays error overlay with parsing details
- **Unsupported Version**: Shows warning, attempts best-effort rendering
- **Missing Props**: Uses default values, logs warning
- **Unknown Type**: Renders placeholder with type name

### Error UI

The app provides visual feedback for errors:

**Error Overlay**:
- Semi-transparent red background
- Error title and message
- Stack trace (in debug mode)
- Retry and Dismiss buttons

**Schema Error Widget**:
- Error icon
- Type name
- Error message

## Custom Renderers

Extend the Flutter-Dev-Client with custom widget renderers:

```dart
class CustomRenderer implements RendererFunction {
  @override
  Widget call(Map<String, dynamic> props, List<Widget> children) {
    return CustomWidget(
      customProp: props['customProp'],
      children: children,
    );
  }
}

// Register in main.dart
void main() {
  final registry = RendererRegistry();
  registry.register('CustomType', CustomRenderer());
  
  runApp(MyApp(registry: registry));
}
```

## Platform Configuration

### Android

**Minimum SDK**: API 21 (Android 5.0)
**Target SDK**: API 33 (Android 13)

**Default WebSocket URL**: `ws://10.0.2.2:3000/ws` (Android emulator)

### iOS

**Minimum Version**: iOS 12.0

**Default WebSocket URL**: `ws://localhost:3000/ws` (iOS simulator)

### Physical Devices

For physical devices, configure the WebSocket URL to use your machine's LAN IP:

```dart
final wsUrl = 'ws://192.168.1.100:3000/ws';
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Dev-Proxy

**Solutions**:
- Verify Dev-Proxy is running
- Check WebSocket URL is correct
- For physical devices, use LAN IP instead of localhost
- Ensure device and server are on the same network
- Check firewall settings

### Rendering Issues

**Problem**: Schema not rendering

**Solutions**:
- Check WebSocket messages in logs
- Validate JSON schema structure
- Verify schemaVersion is "1.0"
- Check for error overlays in the app

### Performance Issues

**Problem**: App is slow or unresponsive

**Solutions**:
- Check schema size (isolate parsing triggers at 100KB)
- Reduce number of children in lists
- Use delta updates instead of full schemas
- Check for excessive rebuilds in logs

## Development

### Running Tests

```bash
flutter test
```

### Running Specific Tests

```bash
flutter test test/schema_interpreter_test.dart
```

### Debug Mode

```bash
flutter run --debug
```

### Release Mode

```bash
flutter run --release
```

## Architecture

The Flutter-Dev-Client consists of several key components:

### Services Layer

- **DevProxyConnection**: WebSocket connection management
- **SessionManager**: Session state and authentication
- **EventBridge**: Event emission and handling
- **MessageParser**: WebSocket message parsing

### Interpreter Layer

- **SchemaInterpreter**: JSON schema to widget tree conversion
- **RendererRegistry**: Custom renderer registration
- **TemplateEngine**: Template placeholder resolution
- **DeltaDebouncer**: Delta update batching
- **IsolateParser**: Background parsing for large schemas

### Widget Layer

- **ErrorOverlay**: Error display widget
- **SchemaErrorWidget**: Schema error placeholder
- **ConnectionDialogs**: Connection status dialogs

## Contributing

Contributions are welcome! Please ensure:
- Code follows Flutter style guidelines
- Tests are included for new features
- Documentation is updated

## License

MIT License - see [LICENSE](../../LICENSE) for details
