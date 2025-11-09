import 'dart:async';
import 'dart:convert';
import 'dart:developer' as developer;

import 'package:web_socket_channel/web_socket_channel.dart';

/// Manages WebSocket connection to Dev-Proxy server
/// Handles connection lifecycle, reconnection, and message streaming
class DevProxyConnection {
  final String wsUrl;
  final String sessionId;
  final String token;

  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  final StreamController<Map<String, dynamic>> _messageController =
      StreamController<Map<String, dynamic>>.broadcast();

  // Reconnection state
  bool _isConnecting = false;
  bool _shouldReconnect = true;
  int _reconnectAttempts = 0;
  Timer? _reconnectTimer;

  // Connection state
  ConnectionState _state = ConnectionState.disconnected;
  
  // Connection state stream
  final StreamController<ConnectionState> _stateController =
      StreamController<ConnectionState>.broadcast();
  
  // Error information
  String? _lastError;
  bool _authenticationFailed = false;

  DevProxyConnection({
    required this.wsUrl,
    required this.sessionId,
    required this.token,
  });

  /// Current connection state
  ConnectionState get state => _state;
  
  /// Stream of connection state changes
  Stream<ConnectionState> get stateChanges => _stateController.stream;
  
  /// Number of reconnection attempts
  int get reconnectAttempts => _reconnectAttempts;
  
  /// Last error message
  String? get lastError => _lastError;
  
  /// Whether authentication failed
  bool get authenticationFailed => _authenticationFailed;

  /// Stream of incoming WebSocket messages
  Stream<Map<String, dynamic>> get messages => _messageController.stream;

  /// Establishes WebSocket connection to Dev-Proxy
  Future<void> connect() async {
    if (_isConnecting || _state == ConnectionState.connected) {
      developer.log('Already connecting or connected', name: 'DevProxyConnection');
      return;
    }

    _isConnecting = true;
    _shouldReconnect = true;
    _authenticationFailed = false;
    _lastError = null;
    _setState(ConnectionState.connecting);

    try {
      developer.log('Connecting to $wsUrl', name: 'DevProxyConnection');
      
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      
      // Wait for connection to be established
      await _channel!.ready;
      
      _setState(ConnectionState.connected);
      _reconnectAttempts = 0;
      _isConnecting = false;
      _lastError = null;

      developer.log('WebSocket connected successfully', name: 'DevProxyConnection');

      // Listen to incoming messages
      _subscription = _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnection,
        cancelOnError: false,
      );
    } catch (e) {
      developer.log('Connection failed: $e', name: 'DevProxyConnection', error: e);
      _lastError = e.toString();
      _isConnecting = false;
      _setState(ConnectionState.error);
      _scheduleReconnect();
    }
  }

  /// Closes WebSocket connection and cleans up resources
  void disconnect() {
    developer.log('Disconnecting', name: 'DevProxyConnection');
    
    _shouldReconnect = false;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    
    _subscription?.cancel();
    _subscription = null;
    
    _channel?.sink.close();
    _channel = null;
    
    _setState(ConnectionState.disconnected);
  }

  /// Sends a message through the WebSocket connection
  void sendMessage(Map<String, dynamic> envelope) {
    if (_state != ConnectionState.connected || _channel == null) {
      developer.log('Cannot send message: not connected', name: 'DevProxyConnection');
      return;
    }

    try {
      final jsonString = jsonEncode(envelope);
      _channel!.sink.add(jsonString);
      developer.log('Message sent: ${envelope['type']}', name: 'DevProxyConnection');
    } catch (e) {
      developer.log('Failed to send message: $e', name: 'DevProxyConnection', error: e);
    }
  }

  /// Handles incoming WebSocket messages
  void _handleMessage(dynamic message) {
    try {
      if (message is String) {
        final Map<String, dynamic> data = jsonDecode(message);
        final messageType = data['type'] as String?;
        
        developer.log('Message received: $messageType', name: 'DevProxyConnection');
        
        // Check for authentication rejection
        if (messageType == 'error' && data['payload'] != null) {
          final payload = data['payload'] as Map<String, dynamic>;
          final errorCode = payload['code'] as String?;
          
          if (errorCode == 'INVALID_TOKEN' || errorCode == 'SESSION_NOT_FOUND') {
            developer.log(
              'Authentication failed: $errorCode',
              name: 'DevProxyConnection',
            );
            _authenticationFailed = true;
            _shouldReconnect = false; // Don't auto-reconnect on auth failure
            _setState(ConnectionState.error);
            disconnect();
            return;
          }
        }
        
        _messageController.add(data);
      } else {
        developer.log('Received non-string message', name: 'DevProxyConnection');
      }
    } catch (e) {
      developer.log('Failed to parse message: $e', name: 'DevProxyConnection', error: e);
    }
  }

  /// Handles WebSocket errors
  void _handleError(dynamic error) {
    developer.log('WebSocket error: $error', name: 'DevProxyConnection', error: error);
    _lastError = error.toString();
    _setState(ConnectionState.error);
  }

  /// Handles WebSocket disconnection
  void _handleDisconnection() {
    developer.log('WebSocket disconnected', name: 'DevProxyConnection');
    
    _subscription?.cancel();
    _subscription = null;
    _channel = null;
    
    _setState(ConnectionState.disconnected);
    
    if (_shouldReconnect) {
      _scheduleReconnect();
    }
  }

  /// Schedules automatic reconnection with exponential backoff
  void _scheduleReconnect() {
    if (!_shouldReconnect || _reconnectTimer != null) {
      return;
    }

    _reconnectAttempts++;
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    final delaySeconds = (1 << (_reconnectAttempts - 1)).clamp(1, 30);
    
    developer.log(
      'Scheduling reconnect attempt $_reconnectAttempts in ${delaySeconds}s',
      name: 'DevProxyConnection',
    );

    _reconnectTimer = Timer(Duration(seconds: delaySeconds), () {
      _reconnectTimer = null;
      if (_shouldReconnect) {
        connect();
      }
    });
  }

  /// Updates connection state and notifies listeners
  void _setState(ConnectionState newState) {
    if (_state != newState) {
      _state = newState;
      _stateController.add(newState);
      developer.log('State changed to: $newState', name: 'DevProxyConnection');
    }
  }

  /// Disposes resources
  void dispose() {
    disconnect();
    _messageController.close();
    _stateController.close();
  }
  
  /// Resets authentication failure flag (for retry after QR scan)
  void resetAuthenticationFailure() {
    _authenticationFailed = false;
  }
}

/// Connection state enum
enum ConnectionState {
  disconnected,
  connecting,
  connected,
  error,
}
