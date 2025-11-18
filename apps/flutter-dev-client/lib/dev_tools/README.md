# Lumora Dev Tools

Comprehensive developer tools for Lumora Go - providing an Expo Go-like development experience for Flutter applications.

## Features

### 1. 🔍 Component Inspector
Inspect any UI element in your app with tap-to-inspect functionality.

**Features:**
- Tap any element to select it
- View component properties and layout information
- See size, position, and constraints
- Inspect styling and props
- Component hierarchy tree view

**How to use:**
1. Open the Dev Menu (long press the dev tools button)
2. Toggle "Element Inspector"
3. Tap any element in your UI to inspect it
4. View detailed information in the inspector panel

### 2. ⚡ Performance Monitor
Real-time performance metrics and visualization.

**Metrics tracked:**
- FPS (Frames Per Second)
- Memory usage (MB)
- Frame time (ms)
- Dropped frames
- Widget build count

**Features:**
- Compact and expanded views
- Historical graphs for FPS and memory
- Color-coded indicators (green = good, red = issues)
- Minimal performance overhead

**How to use:**
1. Open the Dev Menu
2. Toggle "Performance Monitor"
3. Tap the compact indicator to expand
4. View real-time metrics and graphs

### 3. 🌐 Network Inspector
Monitor all network traffic including WebSocket and HTTP requests.

**Features:**
- WebSocket message logging
- HTTP request/response tracking
- Request duration timing
- Detailed request/response viewer
- Traffic history (last 100 requests)

**How to use:**
1. Open the Dev Menu
2. Toggle "Network Inspector"
3. View network activity in the bottom panel
4. Tap any request to see details

### 4. ⚙️ Developer Menu
Quick access to all development tools and actions.

**Features:**
- Reload app
- Toggle inspector
- Toggle performance monitor
- Toggle network inspector
- Clear cache
- View debug info
- Disconnect from server

**How to open:**
- Long press the floating dev tools button (bottom-right)
- Double tap the dev tools button
- Shake device (future enhancement)

## Integration

### Basic Setup

```dart
import 'package:flutter_dev_client/dev_tools/dev_tools.dart';

// Wrap your app with DevToolsOverlay
DevToolsOverlay(
  enabled: true, // Set to false in production
  connection: devProxyConnection,
  currentSchema: schema,
  onReload: () => reloadApp(),
  onDisconnect: () => disconnect(),
  child: MyApp(),
)
```

### Configuration

```dart
// Custom configuration
DevToolsOverlay(
  enabled: kDebugMode, // Only in debug mode
  connection: connection,
  currentSchema: schema,
  onReload: _handleReload,
  onDisconnect: _handleDisconnect,
  child: app,
)
```

### Network Logging

```dart
import 'package:flutter_dev_client/dev_tools/network_inspector.dart';

// Log WebSocket messages
NetworkMonitor.instance.logWebSocketMessage(
  message,
  isOutgoing: true,
);

// Log HTTP requests
NetworkMonitor.instance.logHttpRequest(
  url,
  'GET',
  statusCode: 200,
  duration: 150,
  response: responseBody,
);

// Log errors
NetworkMonitor.instance.logError(url, errorMessage);
```

## Architecture

```
DevToolsOverlay (Coordinator)
├── ComponentInspector
│   ├── Tap detection
│   ├── Widget info extraction
│   └── Inspector panel UI
├── PerformanceMonitor
│   ├── FPS tracker
│   ├── Memory monitor
│   ├── Frame timer
│   └── Graph visualization
├── NetworkInspector
│   ├── Request logger
│   ├── Traffic viewer
│   └── Details panel
└── DevMenu
    ├── Quick actions
    ├── Tool toggles
    └── Debug info
```

## Performance Considerations

### Impact
- Component Inspector: < 5ms per frame when enabled
- Performance Monitor: < 2ms per frame
- Network Inspector: Negligible (async logging)
- Dev Menu: Only active when open

### Best Practices
1. **Disable in production**: Always set `enabled: false` in production builds
2. **Use conditionally**: Enable only when needed
3. **Clear network logs**: Use "Clear" button to free memory
4. **Monitor impact**: Use Performance Monitor to check overhead

## Keyboard Shortcuts (Desktop/Web)

| Key | Action |
|-----|--------|
| `D` | Open Dev Menu |
| `I` | Toggle Inspector |
| `P` | Toggle Performance |
| `N` | Toggle Network |
| `R` | Reload App |
| `Esc` | Close overlays |

## API Reference

### DevToolsOverlay

```dart
DevToolsOverlay({
  required Widget child,
  bool enabled = true,
  DevProxyConnection? connection,
  Map<String, dynamic>? currentSchema,
  VoidCallback? onReload,
  VoidCallback? onDisconnect,
})
```

### ComponentInspector

```dart
ComponentInspector({
  required Widget child,
  required bool enabled,
  Map<String, dynamic>? currentSchema,
})
```

### PerformanceMonitor

```dart
PerformanceMonitor({
  required Widget child,
  required bool enabled,
})
```

### NetworkInspector

```dart
NetworkInspector({
  required bool enabled,
})
```

### NetworkMonitor (Singleton)

```dart
// Log WebSocket message
NetworkMonitor.instance.logWebSocketMessage(
  String message,
  {bool isOutgoing = false}
);

// Log HTTP request
NetworkMonitor.instance.logHttpRequest(
  String url,
  String method,
  {int? statusCode, int? duration, String? request, String? response}
);

// Log error
NetworkMonitor.instance.logError(String url, String error);

// Clear logs
NetworkMonitor.instance.clear();
```

## Comparison with Expo DevTools

| Feature | Expo Go | Lumora Dev Tools | Status |
|---------|---------|------------------|--------|
| Component Inspector | ✅ | ✅ | Complete |
| Performance Monitor | ✅ | ✅ | Complete |
| Network Inspector | ✅ | ✅ | Complete |
| Error Boundaries | ✅ | ✅ | Complete |
| Hot Reload | ✅ | ✅ | Complete |
| Element Inspector | ✅ | ✅ | Complete |
| Console Logs | ✅ | 🚧 | Planned |
| Debugger | ✅ | 🚧 | Planned |
| Profiler | ✅ | ✅ | Complete |

## Future Enhancements

- [ ] Console log viewer
- [ ] Redux DevTools integration
- [ ] Timeline profiler
- [ ] Screenshot/recording
- [ ] State time-travel debugging
- [ ] Accessibility inspector
- [ ] Layout grid overlay
- [ ] Color picker
- [ ] Ruler/measurement tool

## Examples

### Example 1: Basic Integration

```dart
import 'package:flutter/material.dart';
import 'package:flutter_dev_client/dev_tools/dev_tools.dart';

void main() {
  runApp(
    DevToolsOverlay(
      enabled: true,
      child: MyApp(),
    ),
  );
}
```

### Example 2: With Connection

```dart
DevToolsOverlay(
  enabled: true,
  connection: _service?.connection,
  currentSchema: _updateHandler?.currentSchema,
  onReload: _manualReload,
  onDisconnect: _disconnect,
  child: _buildApp(),
)
```

### Example 3: Conditional Enabling

```dart
DevToolsOverlay(
  enabled: kDebugMode && kIsWeb == false,
  child: MyApp(),
)
```

## Troubleshooting

### Inspector not showing
- Ensure DevToolsOverlay is above your app in the widget tree
- Check that `enabled: true` is set
- Verify you're tapping elements (not background)

### Performance monitor shows 0 FPS
- Wait a few seconds for metrics to populate
- Check that the app is rendering frames
- Ensure you're not in a blocking operation

### Network requests not appearing
- Ensure you're calling `NetworkMonitor.instance.logHttpRequest()`
- Check that the network inspector is enabled
- Verify the app is making network requests

## License

Part of the Lumora framework - see root LICENSE file.

## Contributing

See CONTRIBUTING.md in the root directory.
