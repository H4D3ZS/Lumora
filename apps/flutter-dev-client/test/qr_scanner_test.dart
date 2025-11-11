import 'package:flutter_test/flutter_test.dart';

void main() {
  group('QR Code Parsing', () {
    test('should parse valid WebSocket URL with session ID', () {
      const qrData = 'ws://192.168.1.100:3000/ws?session=test-session-123';
      final uri = Uri.parse(qrData);
      
      expect(uri.scheme, 'ws');
      expect(uri.host, '192.168.1.100');
      expect(uri.port, 3000);
      expect(uri.path, '/ws');
      expect(uri.queryParameters['session'], 'test-session-123');
    });

    test('should parse localhost WebSocket URL', () {
      const qrData = 'ws://localhost:3000/ws?session=local-session';
      final uri = Uri.parse(qrData);
      
      expect(uri.scheme, 'ws');
      expect(uri.host, 'localhost');
      expect(uri.port, 3000);
      expect(uri.queryParameters['session'], 'local-session');
    });

    test('should parse secure WebSocket URL', () {
      const qrData = 'wss://example.com:443/ws?session=secure-session';
      final uri = Uri.parse(qrData);
      
      expect(uri.scheme, 'wss');
      expect(uri.host, 'example.com');
      expect(uri.port, 443);
      expect(uri.queryParameters['session'], 'secure-session');
    });

    test('should extract connection data correctly', () {
      const qrData = 'ws://10.0.2.2:3000/ws?session=emulator-session';
      final uri = Uri.parse(qrData);
      
      final wsUrl = '${uri.scheme}://${uri.host}:${uri.port}${uri.path}';
      final sessionId = uri.queryParameters['session'];
      
      expect(wsUrl, 'ws://10.0.2.2:3000/ws');
      expect(sessionId, 'emulator-session');
    });

    test('should handle URL without session parameter', () {
      const qrData = 'ws://localhost:3000/ws';
      final uri = Uri.parse(qrData);
      
      expect(uri.queryParameters['session'], isNull);
    });

    test('should handle invalid URL format', () {
      const qrData = 'not-a-valid-url';
      final uri = Uri.parse(qrData);
      
      // Uri.parse doesn't throw, but creates a URI without scheme
      expect(uri.scheme, isEmpty);
      expect(uri.host, isEmpty);
    });
  });
}
