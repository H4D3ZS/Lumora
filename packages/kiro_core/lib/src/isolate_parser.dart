import 'dart:async';
import 'dart:convert';
import 'dart:isolate';
import 'dart:developer' as developer;

/// Utility class for parsing large JSON schemas in a separate isolate
/// to avoid blocking the UI thread
class IsolateParser {
  /// Threshold for using isolate parsing (100KB)
  static const int isolateThreshold = 100 * 1024; // 100KB in bytes

  /// Parses a JSON string in a separate isolate if it exceeds the threshold
  /// 
  /// Returns the parsed Map<String, dynamic> or throws an error
  static Future<Map<String, dynamic>> parseSchema(String jsonString) async {
    final sizeInBytes = utf8.encode(jsonString).length;
    
    developer.log(
      'Schema size: ${(sizeInBytes / 1024).toStringAsFixed(2)} KB',
      name: 'IsolateParser',
    );

    // Use isolate parsing for large schemas
    if (sizeInBytes > isolateThreshold) {
      developer.log(
        'Using isolate parsing for large schema',
        name: 'IsolateParser',
      );
      return _parseInIsolate(jsonString);
    } else {
      // Parse directly on main thread for small schemas
      developer.log(
        'Parsing on main thread',
        name: 'IsolateParser',
      );
      return jsonDecode(jsonString) as Map<String, dynamic>;
    }
  }

  /// Parses JSON in a separate isolate
  static Future<Map<String, dynamic>> _parseInIsolate(String jsonString) async {
    final receivePort = ReceivePort();
    
    try {
      // Spawn isolate with entry point
      await Isolate.spawn(
        _isolateEntryPoint,
        _IsolateMessage(
          jsonString: jsonString,
          sendPort: receivePort.sendPort,
        ),
      );

      // Wait for result from isolate
      final completer = Completer<Map<String, dynamic>>();
      
      receivePort.listen((message) {
        if (message is Map<String, dynamic>) {
          if (message.containsKey('error')) {
            completer.completeError(
              Exception(message['error']),
            );
          } else {
            completer.complete(message['result'] as Map<String, dynamic>);
          }
        }
        receivePort.close();
      });

      return await completer.future;
    } catch (e) {
      receivePort.close();
      rethrow;
    }
  }

  /// Entry point for the isolate
  static void _isolateEntryPoint(_IsolateMessage message) {
    try {
      // Parse JSON in isolate
      final result = jsonDecode(message.jsonString) as Map<String, dynamic>;
      
      // Send result back to main isolate
      message.sendPort.send({
        'result': result,
      });
    } catch (e) {
      // Send error back to main isolate
      message.sendPort.send({
        'error': e.toString(),
      });
    }
  }
}

/// Message structure for passing data to isolate
class _IsolateMessage {
  final String jsonString;
  final SendPort sendPort;

  _IsolateMessage({
    required this.jsonString,
    required this.sendPort,
  });
}
