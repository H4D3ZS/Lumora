import 'dart:async';
import 'dart:developer' as developer;
import 'package:flutter/widgets.dart';

import '../interpreter/schema_interpreter.dart';
import 'dev_proxy_connection.dart';
import 'session_manager.dart';

/// Handles schema update application from hot reload server
/// Supports both full and incremental delta updates
/// Preserves widget state during updates when possible
class UpdateHandler {
  final SchemaInterpreter interpreter;
  final DevProxyConnection connection;
  
  // Update state
  Map<String, dynamic>? _currentSchema;
  Widget? _currentWidget;
  
  // Performance tracking
  final List<UpdateMetric> _updateHistory = [];
  
  // Update stream
  final StreamController<UpdateResult> _updateController =
      StreamController<UpdateResult>.broadcast();
  
  final SessionManager? sessionManager;

  UpdateHandler({
    required this.interpreter,
    required this.connection,
    this.sessionManager,
  });

  /// Stream of update results
  Stream<UpdateResult> get updates => _updateController.stream;

  /// Handles an update message from the server
  Future<void> handleUpdate(Map<String, dynamic> updateData) async {
    final startTime = DateTime.now().millisecondsSinceEpoch;
    final type = updateData['type'] as String?;
    final payload = updateData['payload'] as Map<String, dynamic>?;
    
    if (type != 'update' || payload == null) {
      developer.log('Invalid update message format', name: 'UpdateHandler', error: updateData);
      return;
    }
    
    final updateType = payload['type'] as String?;
    final sequenceNumber = payload['sequenceNumber'] as int? ?? 0;
    
    developer.log('Received update: $updateType (seq: $sequenceNumber)', name: 'UpdateHandler');
    
    try {
      final widget = await _applyUpdate(payload);
      final endTime = DateTime.now().millisecondsSinceEpoch;
      final duration = endTime - startTime;
      
      // Record metric
      _updateHistory.add(UpdateMetric(
        sequenceNumber: sequenceNumber,
        updateType: updateType ?? 'unknown',
        applyTime: duration,
        success: true,
        timestamp: endTime,
      ));
      
      // Notify listeners
      _updateController.add(UpdateResult(
        success: true,
        widget: widget,
        applyTime: duration,
        updateType: updateType,
      ));
      
    } catch (e, stackTrace) {
      final endTime = DateTime.now().millisecondsSinceEpoch;
      final duration = endTime - startTime;
      
      developer.log('Update failed: $e', name: 'UpdateHandler', error: e, stackTrace: stackTrace);
      
      // Record metric
      _updateHistory.add(UpdateMetric(
        sequenceNumber: sequenceNumber,
        updateType: updateType ?? 'unknown',
        applyTime: duration,
        success: false,
        error: e.toString(),
        timestamp: endTime,
      ));
      
      // Notify listeners
      _updateController.add(UpdateResult(
        success: false,
        error: e.toString(),
        stackTrace: stackTrace.toString(),
        applyTime: duration,
        updateType: updateType,
      ));
      
      rethrow;
    }
  }

  /// Applies an update based on its type
  Future<Widget?> _applyUpdate(Map<String, dynamic> payload) async {
    final updateType = payload['type'] as String?;
    final preserveState = payload['preserveState'] as bool? ?? true;
    
    switch (updateType) {
      case 'full':
        return _applyFullUpdate(payload, preserveState);
      case 'incremental':
        return _applyIncrementalUpdate(payload, preserveState);
      default:
        throw Exception('Unknown update type: $updateType');
    }
  }

  /// Applies a full schema update
  Future<Widget?> _applyFullUpdate(
    Map<String, dynamic> payload,
    bool preserveState,
  ) async {
    final schema = payload['schema'] as Map<String, dynamic>?;
    if (schema == null) {
      throw Exception('Full update missing schema');
    }
    
    developer.log('Applying full schema update', name: 'UpdateHandler');
    
    // Preserve state if requested and we have a current schema
    if (preserveState && _currentSchema != null) {
      _preserveState();
    }
    
    // Update current schema
    _currentSchema = Map<String, dynamic>.from(schema);
    
    // Cache the schema if session manager is available
    if (sessionManager != null) {
      sessionManager!.saveSchema(_currentSchema!);
    }

    // Interpret new schema
    final widget = interpreter.interpretSchema(_currentSchema!);
    
    return widget;
  }
  
  /// Applies an incremental delta update
  Future<Widget?> _applyIncrementalUpdate(
    Map<String, dynamic> payload,
    bool preserveState,
  ) async {
    final delta = payload['delta'] as Map<String, dynamic>?;
    if (delta == null) {
      throw Exception('Incremental update missing delta');
    }
    
    if (_currentSchema == null) {
      throw Exception('Cannot apply delta: no current schema');
    }
    
    developer.log('Applying incremental delta update', name: 'UpdateHandler');
    
    // Preserve state if requested
    if (preserveState) {
      _preserveState();
    }
    
    // Apply delta to current schema
    final widget = interpreter.applyDelta(delta);
    
    if (widget == null) {
      throw Exception('Delta application returned null widget');
    }
    
    // Update current schema from interpreter
    _currentSchema = interpreter.currentSchema;
    
    // Cache the schema if session manager is available
    if (sessionManager != null && _currentSchema != null) {
      sessionManager!.saveSchema(_currentSchema!);
    }

    return widget;
  }
  
  /// Preserves widget state before update
  void _preserveState() {
    // Get current render context from interpreter
    final currentContext = interpreter.renderContext;
    
    // The interpreter already maintains state in its render context
    // This method is a placeholder for any additional state preservation logic
    final contextVars = currentContext.getAll();
    developer.log(
      'Preserving state with ${contextVars.length} variables',
      name: 'UpdateHandler',
    );
  }
  
  /// Resets the update handler state
  void reset() {
    _currentSchema = null;
    _currentWidget = null;
    _updateHistory.clear();
    interpreter.clearContext();
    
    developer.log('Update handler reset', name: 'UpdateHandler');
  }
  
  /// Gets the current schema
  Map<String, dynamic>? get currentSchema => _currentSchema;

  /// Disposes resources
  void dispose() {
    _updateController.close();
  }
}

/// Result of an update operation
class UpdateResult {
  final bool success;
  final Widget? widget;
  final String? error;
  final String? stackTrace;
  final int applyTime;
  final String? updateType;
  
  UpdateResult({
    required this.success,
    this.widget,
    this.error,
    this.stackTrace,
    required this.applyTime,
    this.updateType,
  });
}

/// Metric for tracking update performance
class UpdateMetric {
  final int sequenceNumber;
  final String updateType;
  final int applyTime;
  final bool success;
  final String? error;
  final int timestamp;
  
  UpdateMetric({
    required this.sequenceNumber,
    required this.updateType,
    required this.applyTime,
    required this.success,
    this.error,
    required this.timestamp,
  });
  
  @override
  String toString() {
    return 'UpdateMetric(seq: $sequenceNumber, type: $updateType, '
        'time: ${applyTime}ms, success: $success)';
  }
}
