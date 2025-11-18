/// Lumora Dev Tools - Expo Go-like developer experience for Flutter
///
/// Provides comprehensive developer tools including:
/// - Component Inspector: Tap any UI element to inspect its properties
/// - Performance Monitor: Real-time FPS, memory, and frame time tracking
/// - Network Inspector: Monitor WebSocket and HTTP traffic
/// - Developer Menu: Quick access to all dev tools
///
/// Usage:
/// ```dart
/// DevToolsOverlay(
///   enabled: true,
///   connection: devProxyConnection,
///   currentSchema: schema,
///   onReload: () => reloadApp(),
///   onDisconnect: () => disconnect(),
///   child: MyApp(),
/// )
/// ```

library dev_tools;

export 'dev_tools_overlay.dart';
export 'dev_menu.dart';
export 'component_inspector.dart';
export 'performance_monitor.dart';
export 'network_inspector.dart';
