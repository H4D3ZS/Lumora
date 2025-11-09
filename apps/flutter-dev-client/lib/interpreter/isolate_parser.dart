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
    final startTime = DateTime.now().millisecondsSinceEpoch;
    final sizeInBytes = utf8.encode(jsonString).length;
    
    developer.log(
      'Schema size: ${(sizeInBytes / 1024).toStringAsFixed(2)} KB',
      name: 'IsolateParser',
    );

    Map<String, dynamic> result;
    
    // Use isolate parsing for large schemas
    if (sizeInBytes > isolateThreshold) {
      developer.log(
        'Using isolate parsing for large schema (>${(isolateThreshold / 1024).toStringAsFixed(0)} KB)',
        name: 'IsolateParser',
      );
      result = await _parseInIsolate(jsonString);
      
      final duration = DateTime.now().millisecondsSinceEpoch - startTime;
      developer.log(
        'Isolate parsing completed in ${duration}ms',
        name: 'IsolateParser.Performance',
      );
    } else {
      // Parse directly on main thread for small schemas
      developer.log(
        'Parsing on main thread',
        name: 'IsolateParser',
      );
      result = jsonDecode(jsonString) as Map<String, dynamic>;
      
      final duration = DateTime.now().millisecondsSinceEpoch - startTime;
      developer.log(
        'Main thread parsing completed in ${duration}ms',
        name: 'IsolateParser.Performance',
      );
    }
    
    return result;
  }

  /// Parses JSON in a separate isolate
  static Future<Map<String, dynamic>> _parseInIsolate(String jsonString) async {
    final receivePort = ReceivePort();
    final isolateStartTime = DateTime.now().millisecondsSinceEpoch;
    
    try {
      developer.log(
        'Spawning isolate for JSON parsing',
        name: 'IsolateParser',
      );
      
      // Spawn isolate with entry point
      await Isolate.spawn(
        _isolateEntryPoint,
        _IsolateMessage(
          jsonString: jsonString,
          sendPort: receivePort.sendPort,
        ),
      );

      final spawnDuration = DateTime.now().millisecondsSinceEpoch - isolateStartTime;
      developer.log(
        'Isolate spawned in ${spawnDuration}ms',
        name: 'IsolateParser.Performance',
      );

      // Wait for result from isolate
      final completer = Completer<Map<String, dynamic>>();
      
      receivePort.listen((message) {
        if (message is Map<String, dynamic>) {
          if (message.containsKey('error')) {
            developer.log(
              'Isolate parsing failed: ${message['error']}',
              name: 'IsolateParser',
              level: 1000, // Error level
            );
            completer.completeError(
              Exception(message['error']),
            );
          } else {
            final totalDuration = DateTime.now().millisecondsSinceEpoch - isolateStartTime;
            developer.log(
              'Isolate parsing successful (total: ${totalDuration}ms)',
              name: 'IsolateParser.Performance',
            );
            completer.complete(message['result'] as Map<String, dynamic>);
          }
        }
        receivePort.close();
      });

      return await completer.future;
    } catch (e) {
      developer.log(
        'Isolate parsing error: $e',
        name: 'IsolateParser',
        error: e,
        level: 1000,
      );
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
