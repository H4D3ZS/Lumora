import 'dart:async';
import 'dart:developer' as developer;

import 'dev_proxy_connection.dart';
import 'message_parser.dart';
import 'session_manager.dart';

/// Main service that integrates WebSocket connection, session management,
/// and message parsing for the Kiro Flutter Dev Client
class KiroClientService {
  final String wsUrl;
  final String sessionId;
  final String token;

  late final DevProxyConnection _connection;
  late final SessionManager _sessionManager;
  late final MessageParser _messageParser;

  StreamSubscription? _messageSubscription;
  Timer? _pingTimer;

  KiroClientService({
    required this.wsUrl,
    required this.sessionId,
    required this.token,
  }) {
    _connection = DevProxyConnection(
      wsUrl: wsUrl,
      sessionId: sessionId,
      token: token,
    );
    _sessionManager = SessionManager(connection: _connection);
    _messageParser = MessageParser();
  }

  /// Access to the underlying connection (for EventBridge)
  DevProxyConnection get connection => _connection;

  /// Connection state
  ConnectionState get connectionState => _connection.state;

  /// Whether the client has joined the session
  bool get isJoined => _sessionManager.isJoined;

  /// Whether join was rejected
  bool get joinRejected => _sessionManager.joinRejected;

  /// Rejection reason if join was rejected
  String? get rejectionReason => _sessionManager.rejectionReason;

  /// Stream of session events
  Stream<SessionEvent> get sessionEvents => _sessionManager.events;

  /// Stream of UI schema messages
  Stream<UISchemaMessage> get schemaMessages => _messageParser.schemaMessages;

  /// Stream of delta messages
  Stream<DeltaMessage> get deltaMessages => _messageParser.deltaMessages;

  /// Stream of event messages
  Stream<EventMessage> get eventMessages => _messageParser.eventMessages;

  /// Stream of ping/pong messages
  Stream<PingPongMessage> get pingPongMessages => _messageParser.pingPongMessages;
  
  /// Stream of update messages (hot reload protocol)
  Stream<UpdateMessage> get updateMessages => _messageParser.updateMessages;
  
  /// Stream of connected messages (hot reload protocol)
  Stream<ConnectedMessage> get connectedMessages => _messageParser.connectedMessages;

  /// Initializes the service and connects to Dev-Proxy
  Future<void> initialize() async {
    developer.log('Initializing Kiro Client Service', name: 'KiroClientService');

    // Subscribe to incoming messages and route them to parser
    _messageSubscription = _connection.messages.listen((message) {
      _messageParser.parseMessage(message);
    });

    // Listen to ping messages and respond with pong
    _messageParser.pingPongMessages.listen((message) {
      if (message.type == PingPongType.ping) {
        _respondToPing();
      }
    });

    // Connect and join session
    await _sessionManager.connectAndJoin();

    // Start sending periodic pings if connected
    if (_connection.state == ConnectionState.connected) {
      _startPingTimer();
    }
  }

  /// Sends a message through the WebSocket connection
  void sendMessage(Map<String, dynamic> envelope) {
    _connection.sendMessage(envelope);
  }

  /// Sends an event to the Dev-Proxy
  void sendEvent(String action, Map<String, dynamic> payload) {
    final envelope = {
      'type': 'event',
      'meta': {
        'sessionId': sessionId,
        'source': 'device',
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'version': '1.0',
      },
      'payload': {
        'action': action,
        ...payload,
      },
    };

    sendMessage(envelope);
  }

  /// Responds to ping with pong
  void _respondToPing() {
    final pongMessage = {
      'type': 'pong',
      'meta': {
        'sessionId': sessionId,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      },
    };

    sendMessage(pongMessage);
    developer.log('Sent pong response', name: 'KiroClientService');
  }

  /// Starts periodic ping timer
  void _startPingTimer() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_connection.state == ConnectionState.connected) {
        final pingMessage = {
          'type': 'ping',
          'meta': {
            'sessionId': sessionId,
            'timestamp': DateTime.now().millisecondsSinceEpoch,
          },
        };
        sendMessage(pingMessage);
        developer.log('Sent ping', name: 'KiroClientService');
      }
    });
  }

  /// Disconnects from the service
  void disconnect() {
    developer.log('Disconnecting Kiro Client Service', name: 'KiroClientService');
    _pingTimer?.cancel();
    _pingTimer = null;
    _messageSubscription?.cancel();
    _messageSubscription = null;
    _sessionManager.disconnect();
  }

  /// Disposes all resources
  void dispose() {
    disconnect();
    _messageParser.dispose();
    _sessionManager.dispose();
  }
}
