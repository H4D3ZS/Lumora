import 'dart:async';
import 'dart:developer' as developer;
import 'package:flutter/widgets.dart';

import '../interpreter/schema_interpreter.dart';
import 'dev_proxy_connection.dart';

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
  
  UpdateHandler({
    required this.interpreter,
    required this.connection,
  });
  
  /// Stream of update results
  Stream<UpdateResult> get updates => _updateController.stream;
  
  /// Current rendered widget
  Widget? get currentWidget => _currentWidget;
  
  /// Current schema
  Map<String, dynamic>? get currentSchema => _currentSchema;
  
  /// Update history
  List<UpdateMetric> get updateHistory => List.unmodifiable(_updateHistory);
  
  /// Handles an update message from the server
  Future<UpdateResult> handleUpdate(Map<String, dynamic> message) async {
    final startTime = DateTime.now().millisecondsSinceEpoch;
    
    try {
      final payload = message['payload'] as Map<String, dynamic>?;
      if (payload == null) {
        throw Exception('Update message missing payload');
      }
      
      final updateType = payload['type'] as String?;
      final sequenceNumber = payload['sequenceNumber'] as int?;
      final preserveState = payload['preserveState'] as bool? ?? true;
      
      if (sequenceNumber == null) {
        throw Exception('Update message missing sequence number');
      }
      
      developer.log(
        'Handling $updateType update (sequence: $sequenceNumber, preserveState: $preserveState)',
        name: 'UpdateHandler',
      );
      
      Widget? updatedWidget;
      
      switch (updateType) {
        case 'full':
          updatedWidget = await _applyFullUpdate(payload, preserveState);
          break;
          
        case 'incremental':
          updatedWidget = await _applyIncrementalUpdate(payload, preserveState);
          break;
          
        default:
          throw Exception('Unknown update type: $updateType');
      }
      
      if (updatedWidget != null) {
        _currentWidget = updatedWidget;
      }
      
      final endTime = DateTime.now().millisecondsSinceEpoch;
      final applyTime = endTime - startTime;
      
      // Send acknowledgment to server
      connection.sendAck(sequenceNumber, true, applyTime: applyTime);
      
      // Record metric
      final metric = UpdateMetric(
        sequenceNumber: sequenceNumber,
        updateType: updateType ?? 'unknown',
        applyTime: applyTime,
        success: true,
        timestamp: startTime,
      );
      _updateHistory.add(metric);
      
      // Keep only last 50 metrics
      if (_updateHistory.length > 50) {
        _updateHistory.removeAt(0);
      }
      
      final result = UpdateResult(
        success: true,
        widget: updatedWidget,
        applyTime: applyTime,
        updateType: updateType ?? 'unknown',
      );
      
      _updateController.add(result);
      
      developer.log(
        'Update applied successfully in ${applyTime}ms',
        name: 'UpdateHandler',
      );
      
      return result;
      
    } catch (e, stackTrace) {
      // Log detailed error information
      developer.log(
        'Failed to apply update: $e',
        name: 'UpdateHandler',
        error: e,
        stackTrace: stackTrace,
        level: 1000, // Error level
      );
      
      // Log the message that caused the error for debugging
      developer.log(
        'Failed update message: ${message.toString()}',
        name: 'UpdateHandler',
        level: 900, // Warning level
      );
      
      final endTime = DateTime.now().millisecondsSinceEpoch;
      final applyTime = endTime - startTime;
      
      // Send failure acknowledgment
      final payload = message['payload'] as Map<String, dynamic>?;
      final sequenceNumber = payload?['sequenceNumber'] as int?;
      if (sequenceNumber != null) {
        connection.sendAck(sequenceNumber, false, error: e.toString());
        
        developer.log(
          'Sent failure ack for sequence $sequenceNumber',
          name: 'UpdateHandler',
        );
      }
      
      // Record failed metric
      if (sequenceNumber != null) {
        final metric = UpdateMetric(
          sequenceNumber: sequenceNumber,
          updateType: payload?['type'] as String? ?? 'unknown',
          applyTime: applyTime,
          success: false,
          error: e.toString(),
          timestamp: startTime,
        );
        _updateHistory.add(metric);
        
        // Keep only last 50 metrics
        if (_updateHistory.length > 50) {
          _updateHistory.removeAt(0);
        }
      }
      
      final result = UpdateResult(
        success: false,
        error: e.toString(),
        stackTrace: stackTrace.toString(),
        applyTime: applyTime,
      );
      
      _updateController.add(result);
      
      return result;
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
