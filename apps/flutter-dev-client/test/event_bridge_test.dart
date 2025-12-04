import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dev_client/services/event_bridge.dart';
import 'package:flutter_dev_client/services/dev_proxy_connection.dart';

void main() {
  group('EventBridge createHandler', () {
    late EventBridge eventBridge;
    late DevProxyConnection mockConnection;

    setUp(() {
      // Create a mock connection for testing
      mockConnection = DevProxyConnection(
        wsUrl: 'ws://test:3000/ws',
        sessionId: 'test-session',
        token: 'test-token',
      );
      eventBridge = EventBridge(connection: mockConnection);
    });

    test('parses simple emit spec with empty payload', () {
      final handler = eventBridge.createHandler('emit:button_tap:{}');
      expect(handler, isA<VoidCallback>());
    });

    test('parses emit spec with JSON object payload', () {
      final handler = eventBridge.createHandler('emit:item_selected:{"id":"123"}');
      expect(handler, isA<VoidCallback>());
    });

    test('returns no-op callback for invalid format without emit prefix', () {
      final handler = eventBridge.createHandler('invalid:action:payload');
      expect(handler, isA<VoidCallback>());
      // Handler should not throw when called
      expect(() => handler(), returnsNormally);
    });

    test('returns no-op callback for invalid format without colon separator', () {
      final handler = eventBridge.createHandler('emit:action_without_payload');
      expect(handler, isA<VoidCallback>());
      // Handler should not throw when called
      expect(() => handler(), returnsNormally);
    });

    test('handles empty payload string', () {
      final handler = eventBridge.createHandler('emit:button_tap:');
      expect(handler, isA<VoidCallback>());
      expect(() => handler(), returnsNormally);
    });
  });
}
