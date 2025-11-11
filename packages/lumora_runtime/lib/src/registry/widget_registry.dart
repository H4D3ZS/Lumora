import 'package:flutter/material.dart';
import 'package:lumora_runtime/src/registry/widget_builder.dart';
import 'package:lumora_runtime/src/registry/core_widgets.dart';

/// Registry for widget builders
///
/// Maps widget type names to builder functions that create Flutter widgets.
/// Supports registration of core widgets and custom widgets with fallback handling.
class WidgetRegistry {
  WidgetRegistry({
    WidgetBuilderFunction? fallbackBuilder,
    this.enableLogging = true,
    bool registerCore = true,
  }) : _fallbackBuilder = fallbackBuilder ?? _defaultFallbackBuilder {
    if (registerCore) {
      registerCoreWidgets(this);
    }
  }

  final Map<String, WidgetBuilderFunction> _builders = {};
  final WidgetBuilderFunction _fallbackBuilder;
  final bool enableLogging;

  /// Register a widget builder
  ///
  /// Registers a builder function for a specific widget type.
  /// If a builder already exists for this type, it will be replaced.
  ///
  /// Example:
  /// ```dart
  /// registry.register('CustomButton', ({props, children, key}) {
  ///   return ElevatedButton(
  ///     key: key,
  ///     onPressed: props['onPress'],
  ///     child: Text(props['label'] ?? ''),
  ///   );
  /// });
  /// ```
  void register(String type, WidgetBuilderFunction builder) {
    if (type.isEmpty) {
      throw ArgumentError('Widget type cannot be empty');
    }
    _builders[type] = builder;
    if (enableLogging) {
      debugPrint('WidgetRegistry: Registered builder for type "$type"');
    }
  }

  /// Register multiple widget builders at once
  ///
  /// Useful for registering a collection of custom widgets.
  void registerAll(Map<String, WidgetBuilderFunction> builders) {
    builders.forEach((type, builder) {
      register(type, builder);
    });
  }

  /// Get a widget builder by type
  ///
  /// Returns the registered builder for the given type, or null if not found.
  /// Use [buildWidget] instead if you want automatic fallback handling.
  WidgetBuilderFunction? getBuilder(String type) {
    return _builders[type];
  }

  /// Build a widget using the registered builder or fallback
  ///
  /// This is the recommended method for building widgets as it automatically
  /// handles unknown widget types using the fallback builder.
  Widget buildWidget({
    required String type,
    required Map<String, dynamic> props,
    required List<Widget> children,
    Key? key,
  }) {
    final builder = _builders[type];
    
    if (builder != null) {
      try {
        return builder(props: props, children: children, key: key);
      } catch (e, stackTrace) {
        if (enableLogging) {
          debugPrint('WidgetRegistry: Error building widget of type "$type": $e');
          debugPrint('Stack trace: $stackTrace');
        }
        return _buildError(type, e.toString(), props, children, key);
      }
    }

    // Use fallback builder for unknown types
    if (enableLogging) {
      debugPrint('WidgetRegistry: Unknown widget type "$type", using fallback');
    }
    return _fallbackBuilder(props: props, children: children, key: key);
  }

  /// Check if a widget type is registered
  bool hasBuilder(String type) {
    return _builders.containsKey(type);
  }

  /// Unregister a widget builder
  ///
  /// Returns true if the builder was removed, false if it didn't exist.
  bool unregister(String type) {
    final removed = _builders.remove(type) != null;
    if (removed && enableLogging) {
      debugPrint('WidgetRegistry: Unregistered builder for type "$type"');
    }
    return removed;
  }

  /// Get all registered widget types
  List<String> get registeredTypes => _builders.keys.toList();

  /// Get the count of registered builders
  int get builderCount => _builders.length;

  /// Clear all registered builders
  void clear() {
    final count = _builders.length;
    _builders.clear();
    if (enableLogging) {
      debugPrint('WidgetRegistry: Cleared $count registered builders');
    }
  }

  /// Default fallback builder for unknown widget types
  ///
  /// Creates a Container with a warning message and renders children if present.
  static Widget _defaultFallbackBuilder({
    required Map<String, dynamic> props,
    required List<Widget> children,
    Key? key,
  }) {
    return Container(
      key: key,
      padding: const EdgeInsets.all(8.0),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.orange, width: 2),
        color: Colors.orange.withValues(alpha: 0.1),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.warning, color: Colors.orange, size: 16),
              SizedBox(width: 4),
              Text(
                'Unknown Widget',
                style: TextStyle(
                  color: Colors.orange,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          if (children.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...children,
          ],
        ],
      ),
    );
  }

  /// Build an error widget when a builder throws an exception
  Widget _buildError(
    String type,
    String error,
    Map<String, dynamic> props,
    List<Widget> children,
    Key? key,
  ) {
    return Container(
      key: key,
      padding: const EdgeInsets.all(8.0),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.red, width: 2),
        color: Colors.red.withValues(alpha: 0.1),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error, color: Colors.red, size: 16),
              const SizedBox(width: 4),
              Text(
                'Error in $type',
                style: const TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            error,
            style: const TextStyle(
              color: Colors.red,
              fontSize: 10,
            ),
          ),
          if (children.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...children,
          ],
        ],
      ),
    );
  }
}
