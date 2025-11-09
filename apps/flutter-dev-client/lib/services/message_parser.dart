import 'dart:async';
import 'dart:developer' as developer;

/// Parses and routes WebSocket messages based on envelope type
class MessageParser {
  final StreamController<UISchemaMessage> _schemaController =
      StreamController<UISchemaMessage>.broadcast();
  final StreamController<DeltaMessage> _deltaController =
      StreamController<DeltaMessage>.broadcast();
  final StreamController<EventMessage> _eventController =
      StreamController<EventMessage>.broadcast();
  final StreamController<PingPongMessage> _pingPongController =
      StreamController<PingPongMessage>.broadcast();

  /// Stream of full UI schema messages
  Stream<UISchemaMessage> get schemaMessages => _schemaController.stream;

  /// Stream of UI schema delta messages
  Stream<DeltaMessage> get deltaMessages => _deltaController.stream;

  /// Stream of event messages
  Stream<EventMessage> get eventMessages => _eventController.stream;

  /// Stream of ping/pong messages
  Stream<PingPongMessage> get pingPongMessages => _pingPongController.stream;

  /// Parses incoming WebSocket envelope and routes to appropriate stream
  void parseMessage(Map<String, dynamic> envelope) {
    try {
      // Validate envelope structure
      if (!_isValidEnvelope(envelope)) {
        developer.log(
          'Invalid envelope structure: $envelope',
          name: 'MessageParser',
        );
        return;
      }

      final type = envelope['type'] as String;
      final meta = envelope['meta'] as Map<String, dynamic>?;
      final payload = envelope['payload'];

      developer.log('Parsing message type: $type', name: 'MessageParser');

      // Route based on message type
      switch (type) {
        case 'full_ui_schema':
          _handleFullUISchema(payload, meta);
          break;
        case 'ui_schema_delta':
          _handleUISchemaDeltas(payload, meta);
          break;
        case 'event':
          _handleEvent(payload, meta);
          break;
        case 'ping':
          _handlePing(meta);
          break;
        case 'pong':
          _handlePong(meta);
          break;
        case 'join_accepted':
        case 'join_rejected':
        case 'error':
          // These are handled by SessionManager
          break;
        default:
          developer.log(
            'Unknown message type: $type',
            name: 'MessageParser',
          );
      }
    } catch (e, stackTrace) {
      developer.log(
        'Error parsing message: $e',
        name: 'MessageParser',
        error: e,
        stackTrace: stackTrace,
      );
    }
  }

  /// Validates envelope structure
  bool _isValidEnvelope(Map<String, dynamic> envelope) {
    if (!envelope.containsKey('type')) {
      developer.log('Missing type field', name: 'MessageParser');
      return false;
    }

    if (envelope['type'] is! String) {
      developer.log('Type field is not a string', name: 'MessageParser');
      return false;
    }

    // Meta and payload are optional but should be maps if present
    if (envelope.containsKey('meta') && envelope['meta'] is! Map) {
      developer.log('Meta field is not a map', name: 'MessageParser');
      return false;
    }

    return true;
  }

  /// Handles full UI schema messages
  void _handleFullUISchema(dynamic payload, Map<String, dynamic>? meta) {
    if (payload is! Map<String, dynamic>) {
      developer.log(
        'Invalid full_ui_schema payload type',
        name: 'MessageParser',
      );
      return;
    }

    final message = UISchemaMessage(
      schema: payload,
      meta: meta,
      timestamp: DateTime.now(),
    );

    _schemaController.add(message);
    developer.log('Full UI schema message routed', name: 'MessageParser');
  }

  /// Handles UI schema delta messages
  void _handleUISchemaDeltas(dynamic payload, Map<String, dynamic>? meta) {
    if (payload is! Map<String, dynamic>) {
      developer.log(
        'Invalid ui_schema_delta payload type',
        name: 'MessageParser',
      );
      return;
    }

    final message = DeltaMessage(
      delta: payload,
      meta: meta,
      timestamp: DateTime.now(),
    );

    _deltaController.add(message);
    developer.log('UI schema delta message routed', name: 'MessageParser');
  }

  /// Handles event messages
  void _handleEvent(dynamic payload, Map<String, dynamic>? meta) {
    if (payload is! Map<String, dynamic>) {
      developer.log(
        'Invalid event payload type',
        name: 'MessageParser',
      );
      return;
    }

    final message = EventMessage(
      action: payload['action'] as String? ?? '',
      payload: payload,
      meta: meta,
      timestamp: DateTime.now(),
    );

    _eventController.add(message);
    developer.log('Event message routed', name: 'MessageParser');
  }

  /// Handles ping messages
  void _handlePing(Map<String, dynamic>? meta) {
    final message = PingPongMessage(
      type: PingPongType.ping,
      meta: meta,
      timestamp: DateTime.now(),
    );

    _pingPongController.add(message);
    developer.log('Ping message routed', name: 'MessageParser');
  }

  /// Handles pong messages
  void _handlePong(Map<String, dynamic>? meta) {
    final message = PingPongMessage(
      type: PingPongType.pong,
      meta: meta,
      timestamp: DateTime.now(),
    );

    _pingPongController.add(message);
    developer.log('Pong message routed', name: 'MessageParser');
  }

  /// Disposes resources
  void dispose() {
    _schemaController.close();
    _deltaController.close();
    _eventController.close();
    _pingPongController.close();
  }
}

/// Full UI schema message
class UISchemaMessage {
  final Map<String, dynamic> schema;
  final Map<String, dynamic>? meta;
  final DateTime timestamp;

  UISchemaMessage({
    required this.schema,
    this.meta,
    required this.timestamp,
  });
}

/// UI schema delta message
class DeltaMessage {
  final Map<String, dynamic> delta;
  final Map<String, dynamic>? meta;
  final DateTime timestamp;

  DeltaMessage({
    required this.delta,
    this.meta,
    required this.timestamp,
  });
}

/// Event message
class EventMessage {
  final String action;
  final Map<String, dynamic> payload;
  final Map<String, dynamic>? meta;
  final DateTime timestamp;

  EventMessage({
    required this.action,
    required this.payload,
    this.meta,
    required this.timestamp,
  });
}

/// Ping/Pong message
class PingPongMessage {
  final PingPongType type;
  final Map<String, dynamic>? meta;
  final DateTime timestamp;

  PingPongMessage({
    required this.type,
    this.meta,
    required this.timestamp,
  });
}

/// Ping/Pong message type
enum PingPongType {
  ping,
  pong,
}
