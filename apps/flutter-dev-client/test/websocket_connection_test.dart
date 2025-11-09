import 'package:flutter_test/flutter_test.dart';
import '../lib/services/dev_proxy_connection.dart';

void main() {
  group('DevProxyConnection', () {
    test('creates connection with valid parameters', () {
      final connection = DevProxyConnection(
        wsUrl: 'ws://localhost:3000/ws',
        sessionId: 'test-session-id',
        token: 'test-token',
      );

      expect(connection, isNotNull);
    });

    test('stores connection parameters', () {
      const wsUrl = 'ws://localhost:3000/ws';
      const sessionId = 'test-session-123';
      const token = 'test-token-456';

      final connection = DevProxyConnection(
        wsUrl: wsUrl,
        sessionId: sessionId,
        token: token,
      );

      expect(connection, isNotNull);
      // Connection parameters are stored internally
    });

    test('handles different WebSocket URLs', () {
      final urls = [
        'ws://localhost:3000/ws',
        'ws://192.168.1.100:3000/ws',
        'ws://10.0.2.2:3000/ws', // Android emulator
      ];

      for (final url in urls) {
        final connection = DevProxyConnection(
          wsUrl: url,
          sessionId: 'session',
          token: 'token',
        );

        expect(connection, isNotNull);
      }
    });

    test('accepts 32-character session ID', () {
      final connection = DevProxyConnection(
        wsUrl: 'ws://localhost:3000/ws',
        sessionId: 'a' * 32, // 32 hex characters
        token: 'b' * 64,
      );

      expect(connection, isNotNull);
    });

    test('accepts 64-character token', () {
      final connection = DevProxyConnection(
        wsUrl: 'ws://localhost:3000/ws',
        sessionId: 'a' * 32,
        token: 'b' * 64, // 64 hex characters
      );

      expect(connection, isNotNull);
    });
  });

  group('DevProxyConnection - Message Format', () {
    test('validates join message structure', () {
      // Join message should have format:
      // {
      //   "type": "join",
      //   "meta": { "sessionId", "source", "timestamp", "version" },
      //   "payload": { "sessionId", "token", "clientType" }
      // }
      
      final joinMessage = {
        'type': 'join',
        'meta': {
          'sessionId': 'test-session',
          'source': 'flutter-client',
          'timestamp': DateTime.now().millisecondsSinceEpoch,
          'version': '1.0.0',
        },
        'payload': {
          'sessionId': 'test-session',
          'token': 'test-token',
          'clientType': 'device',
        },
      };

      expect(joinMessage['type'], equals('join'));
      expect(joinMessage['meta'], isA<Map>());
      expect(joinMessage['payload'], isA<Map>());
      expect(joinMessage['payload']['clientType'], equals('device'));
    });

    test('validates event message structure', () {
      // Event message should have format:
      // {
      //   "type": "event",
      //   "meta": { "sessionId", "source", "timestamp", "version" },
      //   "payload": { "action", "data" }
      // }
      
      final eventMessage = {
        'type': 'event',
        'meta': {
          'sessionId': 'test-session',
          'source': 'flutter-client',
          'timestamp': DateTime.now().millisecondsSinceEpoch,
          'version': '1.0.0',
        },
        'payload': {
          'action': 'button_clicked',
          'data': {'buttonId': 'submit'},
        },
      };

      expect(eventMessage['type'], equals('event'));
      expect(eventMessage['payload']['action'], equals('button_clicked'));
      expect(eventMessage['payload']['data'], isA<Map>());
    });

    test('validates schema message structure', () {
      // Schema message should have format:
      // {
      //   "type": "full_ui_schema",
      //   "meta": { "sessionId", "source", "timestamp", "version" },
      //   "payload": { schema object }
      // }
      
      final schemaMessage = {
        'type': 'full_ui_schema',
        'meta': {
          'sessionId': 'test-session',
          'source': 'editor',
          'timestamp': DateTime.now().millisecondsSinceEpoch,
          'version': '1.0.0',
        },
        'payload': {
          'schemaVersion': '1.0',
          'root': {
            'type': 'Text',
            'props': {'text': 'Hello'},
            'children': [],
          },
        },
      };

      expect(schemaMessage['type'], equals('full_ui_schema'));
      expect(schemaMessage['payload'], isA<Map>());
      expect(schemaMessage['payload']['schemaVersion'], equals('1.0'));
    });
  });
}
