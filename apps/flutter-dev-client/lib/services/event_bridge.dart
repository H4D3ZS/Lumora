import 'dart:convert';
import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';

import 'dev_proxy_connection.dart';

/// Model representing a UI event from the Flutter client
class UIEvent {
  final String action;
  final Map<String, dynamic> payload;
  final String timestamp;
  final String sourceNodeId;

  UIEvent({
    required this.action,
    required this.payload,
    required this.timestamp,
    required this.sourceNodeId,
  });

  /// Converts UIEvent to JSON format
  Map<String, dynamic> toJson() => {
        'action': action,
        'payload': payload,
        'timestamp': timestamp,
        'sourceNodeId': sourceNodeId,
      };
}

/// EventBridge handles sending UI events from Flutter widgets back to Dev-Proxy
/// Events are triggered by user interactions (taps, input changes, etc.)
class EventBridge {
  final DevProxyConnection connection;

  EventBridge({required this.connection});

  /// Emits a UI event through the WebSocket connection
  /// 
  /// Creates a WebSocket envelope with type "event" and sends it to Dev-Proxy
  /// which will broadcast it to all connected editor clients in the session
  /// 
  /// Parameters:
  /// - action: The event action identifier (e.g., "button_tap", "input_change")
  /// - payload: Additional event data as key-value pairs
  /// - sourceNodeId: Optional identifier of the widget that triggered the event
  void emitEvent(
    String action,
    Map<String, dynamic> payload, {
    String? sourceNodeId,
  }) {
    final timestamp = DateTime.now().toIso8601String();
    
    final event = UIEvent(
      action: action,
      payload: payload,
      timestamp: timestamp,
      sourceNodeId: sourceNodeId ?? '',
    );

    final envelope = {
      'type': 'event',
      'meta': {
        'sessionId': connection.sessionId,
        'source': 'device',
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'version': '1.0',
      },
      'payload': event.toJson(),
    };

    developer.log(
      'Emitting event: $action',
      name: 'EventBridge',
    );

    connection.sendMessage(envelope);
  }

  /// Creates an event handler from an emit specification string
  /// 
  /// Parses strings in the format "emit:action:payload" and returns a VoidCallback
  /// that will emit the event when invoked.
  /// 
  /// Format examples:
  /// - "emit:button_tap:{}" - Simple action with empty payload
  /// - "emit:item_selected:{\"id\":\"123\"}" - Action with JSON payload
  /// - "emit:input_changed:{\"value\":\"text\"}" - Action with data
  /// 
  /// Parameters:
  /// - eventSpec: The event specification string in emit:action:payload format
  /// - sourceNodeId: Optional identifier of the widget that will trigger the event
  /// 
  /// Returns:
  /// - VoidCallback that emits the event when called
  /// - Returns a no-op callback if the format is invalid
  VoidCallback createHandler(String eventSpec, {String? sourceNodeId}) {
    try {
      // Check if the string starts with "emit:"
      if (!eventSpec.startsWith('emit:')) {
        developer.log(
          'Invalid event spec format: must start with "emit:"',
          name: 'EventBridge',
        );
        return () {}; // Return no-op callback
      }

      // Remove "emit:" prefix
      final specWithoutPrefix = eventSpec.substring(5);
      
      // Find the second colon that separates action from payload
      final colonIndex = specWithoutPrefix.indexOf(':');
      
      if (colonIndex == -1) {
        developer.log(
          'Invalid event spec format: missing action:payload separator',
          name: 'EventBridge',
        );
        return () {}; // Return no-op callback
      }

      // Extract action and payload string
      final action = specWithoutPrefix.substring(0, colonIndex);
      final payloadString = specWithoutPrefix.substring(colonIndex + 1);

      // Parse payload as JSON
      Map<String, dynamic> payload;
      try {
        // Handle empty payload
        if (payloadString.isEmpty || payloadString == '{}') {
          payload = {};
        } else {
          // Parse JSON payload
          final parsedPayload = _parseJsonPayload(payloadString);
          if (parsedPayload is Map<String, dynamic>) {
            payload = parsedPayload;
          } else {
            developer.log(
              'Payload is not a JSON object, wrapping in "value" key',
              name: 'EventBridge',
            );
            payload = {'value': parsedPayload};
          }
        }
      } catch (e) {
        developer.log(
          'Failed to parse payload JSON: $e, using raw string',
          name: 'EventBridge',
        );
        payload = {'value': payloadString};
      }

      // Return callback that emits the event
      return () {
        developer.log(
          'Handler invoked for action: $action',
          name: 'EventBridge',
        );
        emitEvent(action, payload, sourceNodeId: sourceNodeId);
      };
    } catch (e, stackTrace) {
      developer.log(
        'Error creating handler: $e',
        name: 'EventBridge',
        error: e,
        stackTrace: stackTrace,
      );
      return () {}; // Return no-op callback on error
    }
  }

  /// Parses a JSON string into a dynamic value
  /// 
  /// Uses dart:convert's jsonDecode for proper JSON parsing
  dynamic _parseJsonPayload(String jsonString) {
    final trimmed = jsonString.trim();
    
    // Handle empty string
    if (trimmed.isEmpty) {
      return <String, dynamic>{};
    }
    
    try {
      return jsonDecode(trimmed);
    } catch (e) {
      developer.log(
        'JSON decode failed: $e, returning raw string',
        name: 'EventBridge',
      );
      // If JSON parsing fails, return as a string value
      return trimmed;
    }
  }
}
