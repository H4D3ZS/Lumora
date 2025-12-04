import 'package:flutter/material.dart';
import 'dart:developer' as developer;

/// Registry for native modules that can be invoked from the IR
class NativeModuleRegistry {
  static final NativeModuleRegistry _instance = NativeModuleRegistry._internal();
  
  factory NativeModuleRegistry() {
    return _instance;
  }
  
  NativeModuleRegistry._internal();
  
  final Map<String, Widget Function(Map<String, dynamic>)> _widgetFactory = {};
  final Map<String, Future<dynamic> Function(String, Map<String, dynamic>)> _methodHandlers = {};
  
  /// Registers a native widget factory
  void registerWidget(String type, Widget Function(Map<String, dynamic>) factory) {
    _widgetFactory[type] = factory;
  }
  
  /// Registers a native method handler
  void registerMethodHandler(String moduleName, Future<dynamic> Function(String, Map<String, dynamic>) handler) {
    _methodHandlers[moduleName] = handler;
  }
  
  /// Checks if a native widget is registered
  bool hasWidget(String type) {
    return _widgetFactory.containsKey(type);
  }
  
  /// Creates a native widget
  Widget? createWidget(String type, Map<String, dynamic> props) {
    final factory = _widgetFactory[type];
    if (factory != null) {
      return factory(props);
    }
    return null;
  }
  
  /// Invokes a native method
  Future<dynamic> invokeMethod(String module, String method, Map<String, dynamic> args) async {
    final handler = _methodHandlers[module];
    if (handler != null) {
      return handler(method, args);
    }
    throw Exception('Native module not found: $module');
  }
}

/// Widget to display when a native module is missing
class MissingNativeModuleWidget extends StatelessWidget {
  final String moduleName;
  
  const MissingNativeModuleWidget({super.key, required this.moduleName});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        border: Border.all(color: Colors.grey.shade400),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.extension_off, color: Colors.grey, size: 32),
          const SizedBox(height: 8),
          Text(
            'Native Module Missing',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade800,
            ),
          ),
          Text(
            moduleName,
            style: TextStyle(
              fontFamily: 'monospace',
              color: Colors.grey.shade700,
            ),
          ),
        ],
      ),
    );
  }
}
