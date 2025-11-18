import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'dev_menu.dart';
import 'component_inspector.dart';
import 'performance_monitor.dart';
import 'network_inspector.dart';
import '../services/dev_proxy_connection.dart' as proxy;

/// Dev Tools Overlay - Main coordinator for all developer tools
/// Wraps the app and provides Expo Go-like dev experience
class DevToolsOverlay extends StatefulWidget {
  final Widget child;
  final bool enabled;
  final proxy.DevProxyConnection? connection;
  final Map<String, dynamic>? currentSchema;
  final VoidCallback? onReload;
  final VoidCallback? onDisconnect;

  const DevToolsOverlay({
    super.key,
    required this.child,
    this.enabled = true,
    this.connection,
    this.currentSchema,
    this.onReload,
    this.onDisconnect,
  });

  @override
  State<DevToolsOverlay> createState() => _DevToolsOverlayState();
}

class _DevToolsOverlayState extends State<DevToolsOverlay> {
  bool _inspectorEnabled = false;
  bool _performanceEnabled = false;
  bool _networkInspectorEnabled = false;

  Timer? _shakeDetectionTimer;
  int _shakeCount = 0;
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    if (widget.enabled) {
      _setupKeyboardShortcuts();
      _startShakeDetection();
    }
  }

  @override
  void dispose() {
    _shakeDetectionTimer?.cancel();
    super.dispose();
  }

  void _setupKeyboardShortcuts() {
    // Keyboard shortcuts for desktop/web
    // D key: Toggle dev menu
    // I key: Toggle inspector
    // P key: Toggle performance
    // N key: Toggle network inspector
    // R key: Reload
  }

  void _startShakeDetection() {
    // For now, we'll use a long press gesture on the corner
    // In a real implementation, this would use accelerometer data
    _shakeDetectionTimer = Timer.periodic(
      const Duration(seconds: 1),
      (_) {
        if (_shakeCount > 0) {
          _shakeCount = 0;
        }
      },
    );
  }

  void _openDevMenu() {
    if (!widget.enabled) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => DevMenu(
        onReload: () {
          Navigator.of(context).pop();
          widget.onReload?.call();
        },
        onToggleInspector: () {
          setState(() {
            _inspectorEnabled = !_inspectorEnabled;
            _performanceEnabled = false;
            _networkInspectorEnabled = false;
          });
          Navigator.of(context).pop();
        },
        onTogglePerformance: () {
          setState(() {
            _performanceEnabled = !_performanceEnabled;
            _inspectorEnabled = false;
            _networkInspectorEnabled = false;
          });
          Navigator.of(context).pop();
        },
        onToggleNetworkInspector: () {
          setState(() {
            _networkInspectorEnabled = !_networkInspectorEnabled;
            _inspectorEnabled = false;
            _performanceEnabled = false;
          });
          Navigator.of(context).pop();
        },
        onClearCache: () {
          Navigator.of(context).pop();
          _clearCache();
        },
        onDisconnect: widget.onDisconnect,
        connection: widget.connection,
        inspectorEnabled: _inspectorEnabled,
        performanceEnabled: _performanceEnabled,
        networkInspectorEnabled: _networkInspectorEnabled,
      ),
    );
  }

  void _clearCache() {
    // Clear various caches
    imageCache.clear();
    imageCache.clearLiveImages();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 12),
              Text('Cache cleared successfully'),
            ],
          ),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) {
      return widget.child;
    }

    return Scaffold(
      key: _scaffoldKey,
      body: Stack(
        children: [
          // Main app content with optional wrappers
          _buildAppContent(),

          // Network Inspector (bottom panel)
          if (_networkInspectorEnabled)
            NetworkInspector(enabled: _networkInspectorEnabled),

          // Dev menu trigger button (bottom-right corner)
          Positioned(
            right: 16,
            bottom: 16,
            child: GestureDetector(
              onLongPress: _openDevMenu,
              onDoubleTap: _openDevMenu,
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFF667eea),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.developer_mode,
                  color: Colors.white,
                  size: 28,
                ),
              ),
            ),
          ),

          // Keyboard shortcut hint (shows briefly on start)
          _buildShortcutHint(),
        ],
      ),
    );
  }

  Widget _buildAppContent() {
    Widget content = widget.child;

    // Wrap with Component Inspector if enabled
    if (_inspectorEnabled) {
      content = ComponentInspector(
        enabled: _inspectorEnabled,
        currentSchema: widget.currentSchema,
        child: content,
      );
    }

    // Wrap with Performance Monitor if enabled
    if (_performanceEnabled) {
      content = PerformanceMonitor(
        enabled: _performanceEnabled,
        child: content,
      );
    }

    return content;
  }

  Widget _buildShortcutHint() {
    return Positioned(
      bottom: 80,
      right: 16,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 1.0, end: 0.0),
        duration: const Duration(seconds: 3),
        curve: Curves.easeOut,
        builder: (context, value, child) {
          if (value == 0.0) return const SizedBox.shrink();

          return Opacity(
            opacity: value,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.8),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.touch_app, color: Colors.white, size: 16),
                  SizedBox(width: 8),
                  Text(
                    'Long press for dev menu',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Dev Tools Configuration
class DevToolsConfig {
  final bool enableInspector;
  final bool enablePerformanceMonitor;
  final bool enableNetworkInspector;
  final bool enableShakeGesture;
  final bool enableKeyboardShortcuts;
  final bool showHints;

  const DevToolsConfig({
    this.enableInspector = true,
    this.enablePerformanceMonitor = true,
    this.enableNetworkInspector = true,
    this.enableShakeGesture = true,
    this.enableKeyboardShortcuts = true,
    this.showHints = true,
  });

  static const DevToolsConfig defaultConfig = DevToolsConfig();

  static const DevToolsConfig allDisabled = DevToolsConfig(
    enableInspector: false,
    enablePerformanceMonitor: false,
    enableNetworkInspector: false,
    enableShakeGesture: false,
    enableKeyboardShortcuts: false,
    showHints: false,
  );
}

/// Dev Tools utilities
class DevTools {
  static bool _enabled = false;

  static bool get enabled => _enabled;

  static void enable() {
    _enabled = true;
  }

  static void disable() {
    _enabled = false;
  }

  static void log(String message, {String? tag}) {
    if (_enabled) {
      final prefix = tag != null ? '[$tag]' : '[DevTools]';
      debugPrint('$prefix $message');
    }
  }

  static void logPerformance(String operation, Duration duration) {
    if (_enabled) {
      debugPrint('[Performance] $operation took ${duration.inMilliseconds}ms');
    }
  }

  static void logNetwork(String method, String url, {int? statusCode}) {
    if (_enabled) {
      final status = statusCode != null ? ' ($statusCode)' : '';
      debugPrint('[Network] $method $url$status');
    }
  }
}
