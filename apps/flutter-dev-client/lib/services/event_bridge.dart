import 'dart:convert';
import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'dev_proxy_connection.dart';

/// Bridges UI events to the Dev Proxy via WebSocket
class EventBridge {
  final DevProxyConnection connection;

  EventBridge({required this.connection});

  /// Creates a callback handler from an event spec string
  /// Format: "emit:action:payload_json"
  VoidCallback createHandler(String eventSpec) {
    if (!eventSpec.startsWith('emit:')) {
      return () {
        developer.log('Invalid event spec: $eventSpec', name: 'EventBridge');
      };
    }

    try {
      final parts = eventSpec.split(':');
      if (parts.length < 3) {
        return () {
          developer.log('Invalid event spec format: $eventSpec', name: 'EventBridge');
        };
      }

      final action = parts[1];
      final payloadJson = parts.sublist(2).join(':'); // Rejoin payload if it contained colons
      
      Map<String, dynamic> payload = {};
      if (payloadJson.isNotEmpty) {
        try {
          payload = jsonDecode(payloadJson) as Map<String, dynamic>;
        } catch (e) {
          developer.log('Failed to parse event payload: $e', name: 'EventBridge');
        }
      }

      return () => _emitEvent(action, payload);
    } catch (e) {
      return () {
        developer.log('Error creating event handler: $e', name: 'EventBridge');
      };
    }
  }

  /// Emits an event to the Dev Proxy
  void _emitEvent(String action, Map<String, dynamic> data) {
    developer.log('Emitting event: $action', name: 'EventBridge');
    
    final eventMessage = {
      'type': 'event',
      'payload': {
        'action': action,
        'data': data,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      },
    };

    connection.sendMessage(eventMessage);
  }
}
