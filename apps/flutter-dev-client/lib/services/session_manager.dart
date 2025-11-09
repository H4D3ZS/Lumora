import 'dart:async';
import 'dart:developer' as developer;

import 'dev_proxy_connection.dart';

/// Manages the session lifecycle including join flow and authentication
class SessionManager {
  final DevProxyConnection connection;
  
  bool _isJoined = false;
  bool _joinRejected = false;
  String? _rejectionReason;
  
  final StreamController<SessionEvent> _eventController =
      StreamController<SessionEvent>.broadcast();

  SessionManager({required this.connection});

  /// Whether the client has successfully joined the session
  bool get isJoined => _isJoined;

  /// Whether the join was rejected
  bool get joinRejected => _joinRejected;

  /// Reason for join rejection, if any
  String? get rejectionReason => _rejectionReason;

  /// Stream of session events
  Stream<SessionEvent> get events => _eventController.stream;

  /// Connects to Dev-Proxy and sends join message
  Future<void> connectAndJoin() async {
    _isJoined = false;
    _joinRejected = false;
    _rejectionReason = null;

    // Listen to connection state changes
    connection.messages.listen(_handleMessage);

    // Connect to WebSocket
    await connection.connect();

    // Wait a moment for connection to stabilize
    await Future.delayed(const Duration(milliseconds: 100));

    // Send join message
    if (connection.state == ConnectionState.connected) {
      _sendJoinMessage();
    }
  }

  /// Sends the join message to Dev-Proxy
  void _sendJoinMessage() {
    developer.log('Sending join message', name: 'SessionManager');

    final joinMessage = {
      'type': 'join',
      'payload': {
        'sessionId': connection.sessionId,
        'token': connection.token,
        'clientType': 'device',
      },
    };

    connection.sendMessage(joinMessage);
    
    // Set a timeout for join response
    Timer(const Duration(seconds: 5), () {
      if (!_isJoined && !_joinRejected) {
        developer.log('Join timeout - no response received', name: 'SessionManager');
        _handleJoinRejection('Join timeout - no response from server');
      }
    });
  }

  /// Handles incoming messages from Dev-Proxy
  void _handleMessage(Map<String, dynamic> message) {
    final type = message['type'] as String?;

    switch (type) {
      case 'join_accepted':
        _handleJoinAccepted(message);
        break;
      case 'join_rejected':
        _handleJoinRejected(message);
        break;
      case 'error':
        _handleError(message);
        break;
      default:
        // Other message types will be handled by message parser
        break;
    }
  }

  /// Handles successful join
  void _handleJoinAccepted(Map<String, dynamic> message) {
    developer.log('Join accepted', name: 'SessionManager');
    _isJoined = true;
    _joinRejected = false;
    _rejectionReason = null;
    _eventController.add(SessionEvent.joined);
  }

  /// Handles join rejection
  void _handleJoinRejected(Map<String, dynamic> message) {
    final payload = message['payload'] as Map<String, dynamic>?;
    final reason = payload?['reason'] as String? ?? 'Unknown reason';
    _handleJoinRejection(reason);
  }

  /// Handles join rejection with reason
  void _handleJoinRejection(String reason) {
    developer.log('Join rejected: $reason', name: 'SessionManager');
    _isJoined = false;
    _joinRejected = true;
    _rejectionReason = reason;
    _eventController.add(SessionEvent.joinRejected);
  }

  /// Handles error messages
  void _handleError(Map<String, dynamic> message) {
    final payload = message['payload'] as Map<String, dynamic>?;
    final errorMessage = payload?['message'] as String? ?? 'Unknown error';
    developer.log('Error received: $errorMessage', name: 'SessionManager');
    _eventController.add(SessionEvent.error);
  }

  /// Disconnects from the session
  void disconnect() {
    _isJoined = false;
    connection.disconnect();
  }

  /// Disposes resources
  void dispose() {
    _eventController.close();
    connection.dispose();
  }
}

/// Session events
enum SessionEvent {
  joined,
  joinRejected,
  error,
}
