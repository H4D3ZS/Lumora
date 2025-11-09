import 'package:flutter/material.dart';
import 'dart:developer' as developer;

/// Function signature for custom renderers
/// 
/// Parameters:
/// - props: The properties/attributes for the widget
/// - children: Pre-built child widgets
/// 
/// Returns: A Flutter Widget
typedef RendererFunction = Widget Function(
  Map<String, dynamic> props,
  List<Widget> children,
);

/// Registry for custom widget renderers
/// 
/// Allows registration of custom renderers that can be used by the SchemaInterpreter
/// to render widget types beyond the core primitives (View, Text, Button, etc.)
class RendererRegistry {
  final Map<String, RendererFunction> _renderers = {};

  /// Registers a custom renderer for a specific widget type
  /// 
  /// Parameters:
  /// - type: The widget type name (e.g., "Map", "Chart", "CustomButton")
  /// - renderer: The function that renders the widget
  /// 
  /// Example:
  /// ```dart
  /// registry.register('CustomCard', (props, children) {
  ///   return Card(
  ///     elevation: props['elevation'] ?? 2.0,
  ///     child: Column(children: children),
  ///   );
  /// });
  /// ```
  void register(String type, RendererFunction renderer) {
    if (_renderers.containsKey(type)) {
      developer.log(
        'Warning: Overwriting existing renderer for type: $type',
        name: 'RendererRegistry',
        level: 900, // Warning level
      );
    }
    
    _renderers[type] = renderer;
    developer.log(
      'Registered custom renderer for type: $type',
      name: 'RendererRegistry',
    );
  }

  /// Renders a widget using a registered custom renderer
  /// 
  /// Parameters:
  /// - type: The widget type to render
  /// - props: The properties for the widget
  /// - children: Pre-built child widgets
  /// 
  /// Returns: The rendered widget, or null if no renderer is found for the type
  Widget? render(String type, Map<String, dynamic> props, List<Widget> children) {
    final renderer = _renderers[type];
    
    if (renderer == null) {
      return null;
    }
    
    try {
      developer.log(
        'Rendering widget with custom renderer: $type',
        name: 'RendererRegistry',
      );
      return renderer(props, children);
    } catch (e, stackTrace) {
      developer.log(
        'Error rendering custom widget type $type: $e',
        name: 'RendererRegistry',
        error: e,
        stackTrace: stackTrace,
      );
      // Return null to allow fallback to default error handling
      return null;
    }
  }

  /// Checks if a renderer is registered for a specific type
  /// 
  /// Returns: true if a renderer exists for the type, false otherwise
  bool hasRenderer(String type) {
    return _renderers.containsKey(type);
  }

  /// Gets the list of all registered renderer types
  /// 
  /// Returns: A list of registered type names
  List<String> getRegisteredTypes() {
    return _renderers.keys.toList();
  }

  /// Unregisters a custom renderer for a specific type
  /// 
  /// Parameters:
  /// - type: The widget type to unregister
  /// 
  /// Returns: true if the renderer was removed, false if it didn't exist
  bool unregister(String type) {
    final removed = _renderers.remove(type) != null;
    if (removed) {
      developer.log(
        'Unregistered custom renderer for type: $type',
        name: 'RendererRegistry',
      );
    }
    return removed;
  }

  /// Clears all registered renderers
  void clear() {
    final count = _renderers.length;
    _renderers.clear();
    developer.log(
      'Cleared all custom renderers (removed $count renderers)',
      name: 'RendererRegistry',
    );
  }

  /// Gets the count of registered renderers
  int get count => _renderers.length;
}
