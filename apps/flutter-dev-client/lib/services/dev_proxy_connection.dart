import 'dart:async';
import 'dart:convert';
import 'dart:developer' as developer;
import 'dart:io' show Platform;

import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:kiro_core/kiro_core.dart';

/// Protocol version for hot reload
const String protocolVersion = '1.0.0';

/// Manages WebSocket connection to Dev-Proxy server
/// Handles connection lifecycle, reconnection, and message streaming
/// Implements the Hot Reload Protocol for real-time schema updates
class DevProxyConnection implements MessageSender {
  final String wsUrl;
  @override
  final String sessionId;
  final String token;
  final String deviceId;
  final String? deviceName;

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
  
  // Connection ID assigned by server
  String? _connectionId;
  
  // Heartbeat timer for ping/pong
  Timer? _heartbeatTimer;
  DateTime? _lastPongReceived;
  
  // Sequence tracking for updates
  int _lastReceivedSequence = 0;

  DevProxyConnection({
    required this.wsUrl,
    required this.sessionId,
    required this.token,
    String? deviceId,
    this.deviceName,
  }) : deviceId = deviceId ?? _generateDeviceId();

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
  
  /// Connection ID assigned by server
  String? get connectionId => _connectionId;
  
  /// Last received sequence number
  int get lastReceivedSequence => _lastReceivedSequence;

  /// Stream of incoming WebSocket messages
  Stream<Map<String, dynamic>> get messages => _messageController.stream;
  
  /// Generate a unique device ID
  static String _generateDeviceId() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = (timestamp % 10000).toString().padLeft(4, '0');
    return 'device_$timestamp$random';
  }
  
  /// Get platform name
  static String _getPlatformName() {
    try {
      if (Platform.isAndroid) return 'android';
      if (Platform.isIOS) return 'ios';
      if (Platform.isMacOS) return 'macos';
      if (Platform.isWindows) return 'windows';
      if (Platform.isLinux) return 'linux';
      return 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  /// Establishes WebSocket connection to Dev-Proxy
  /// Implements Hot Reload Protocol connection handshake
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
      // Build WebSocket URL with session parameter
      final uri = Uri.parse(wsUrl);
      final wsUri = uri.replace(
        queryParameters: {
          ...uri.queryParameters,
          'session': sessionId,
        },
      );
      
      developer.log('Connecting to $wsUri', name: 'DevProxyConnection');
      
      _channel = WebSocketChannel.connect(wsUri);
      
      // Wait for connection to be established
      await _channel!.ready;
      
      _isConnecting = false;

      developer.log('WebSocket connected, sending connect message', name: 'DevProxyConnection');

      // Listen to incoming messages
      _subscription = _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnection,
        cancelOnError: false,
      );
      
      // Send connect message with authentication
      _sendConnectMessage();
      
    } catch (e) {
      developer.log('Connection failed: $e', name: 'DevProxyConnection', error: e);
      _lastError = e.toString();
      _isConnecting = false;
      _setState(ConnectionState.error);
      _scheduleReconnect();
    }
  }
  
  /// Sends connect message to authenticate with server
  void _sendConnectMessage() {
    final connectMessage = {
      'type': 'connect',
      'sessionId': sessionId,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'payload': {
        'deviceId': deviceId,
        'platform': _getPlatformName(),
        'deviceName': deviceName ?? 'Flutter Device',
        'clientVersion': protocolVersion,
        'token': token,
      },
    };
    
    sendMessage(connectMessage);
    developer.log('Sent connect message', name: 'DevProxyConnection');
  }

  /// Closes WebSocket connection and cleans up resources
  void disconnect() {
    developer.log('Disconnecting', name: 'DevProxyConnection');
    
    _shouldReconnect = false;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    
    _subscription?.cancel();
    _subscription = null;
    
    _channel?.sink.close();
    _channel = null;
    
    _connectionId = null;
    _lastPongReceived = null;
    
    _setState(ConnectionState.disconnected);
  }
  
  /// Starts heartbeat timer for ping/pong
  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _lastPongReceived = DateTime.now(); // Initialize on connection
    
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_state == ConnectionState.connected) {
        // Check if we've received a pong recently
        if (!isHealthy()) {
          developer.log(
            'Heartbeat timeout detected - no pong received in 60s',
            name: 'DevProxyConnection',
            level: 900,
          );
          _lastError = 'Connection timeout - no response from server';
          _handleDisconnection();
          return;
        }
        
        _sendPing();
      }
    });
  }
  
  /// Sends ping message to server
  void _sendPing() {
    final pingMessage = {
      'type': 'ping',
      'sessionId': sessionId,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
    
    sendMessage(pingMessage);
    developer.log('Sent ping', name: 'DevProxyConnection');
  }

  /// Sends a message through the WebSocket connection
  @override
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
        
        // Handle protocol messages
        switch (messageType) {
          case 'connected':
            _handleConnectedMessage(data);
            break;
            
          case 'pong':
            _handlePongMessage(data);
            break;
            
          case 'error':
            _handleErrorMessage(data);
            break;
            
          case 'update':
            _handleUpdateMessage(data);
            break;
            
          default:
            // Forward other messages to subscribers
            _messageController.add(data);
        }
      } else {
        developer.log('Received non-string message', name: 'DevProxyConnection');
      }
    } catch (e) {
      developer.log('Failed to parse message: $e', name: 'DevProxyConnection', error: e);
    }
  }
  
  /// Handles connected acknowledgment from server
  void _handleConnectedMessage(Map<String, dynamic> data) {
    final payload = data['payload'] as Map<String, dynamic>?;
    if (payload != null) {
      _connectionId = payload['connectionId'] as String?;
      final serverVersion = payload['serverVersion'] as String?;
      final capabilities = payload['capabilities'] as List<dynamic>?;
      
      developer.log(
        'Connected to server with connection ID: $_connectionId (server version: $serverVersion)',
        name: 'DevProxyConnection',
      );
      
      // Log server capabilities if provided
      if (capabilities != null && capabilities.isNotEmpty) {
        developer.log(
          'Server capabilities: ${capabilities.join(", ")}',
          name: 'DevProxyConnection',
        );
      }
      
      // Connection successful
      _setState(ConnectionState.connected);
      _reconnectAttempts = 0;
      _lastError = null;
      _authenticationFailed = false;
      
      // Start heartbeat
      _startHeartbeat();
      
      // Forward connected message with initial schema if present
      _messageController.add(data);
    }
  }
  
  /// Handles pong message from server
  void _handlePongMessage(Map<String, dynamic> data) {
    _lastPongReceived = DateTime.now();
    developer.log('Received pong', name: 'DevProxyConnection');
  }
  
  /// Handles error message from server
  void _handleErrorMessage(Map<String, dynamic> data) {
    final payload = data['payload'] as Map<String, dynamic>?;
    if (payload != null) {
      final errorCode = payload['code'] as String?;
      final errorMessage = payload['message'] as String?;
      final severity = payload['severity'] as String?;
      final recoverable = payload['recoverable'] as bool? ?? true;
      
      developer.log(
        'Server error: $errorCode - $errorMessage (severity: $severity, recoverable: $recoverable)',
        name: 'DevProxyConnection',
        level: severity == 'fatal' ? 1000 : 900,
      );
      
      _lastError = errorMessage ?? 'Unknown error';
      
      // Handle authentication errors
      if (errorCode == 'INVALID_TOKEN' || 
          errorCode == 'SESSION_NOT_FOUND' ||
          errorCode == 'AUTHENTICATION_FAILED') {
        _authenticationFailed = true;
        _shouldReconnect = false; // Don't auto-reconnect on auth failure
        _setState(ConnectionState.error);
        disconnect();
        return;
      }
      
      // Handle fatal errors
      if (severity == 'fatal' && !recoverable) {
        _shouldReconnect = false;
        _setState(ConnectionState.error);
        disconnect();
        return;
      }
      
      // Forward error to subscribers for display
      _messageController.add(data);
    }
  }
  
  /// Handles update message from server
  void _handleUpdateMessage(Map<String, dynamic> data) {
    final payload = data['payload'] as Map<String, dynamic>?;
    if (payload != null) {
      final sequenceNumber = payload['sequenceNumber'] as int?;
      if (sequenceNumber != null) {
        _lastReceivedSequence = sequenceNumber;
      }
    }
    
    // Forward update to subscribers
    _messageController.add(data);
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
      if (_shouldReconnect && !_authenticationFailed) {
        developer.log(
          'Attempting reconnection (attempt $_reconnectAttempts)',
          name: 'DevProxyConnection',
        );
        connect();
      }
    });
  }
  
  /// Cancels scheduled reconnection
  void cancelReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    developer.log('Cancelled scheduled reconnection', name: 'DevProxyConnection');
  }
  
  /// Forces immediate reconnection (bypasses backoff)
  Future<void> forceReconnect() async {
    developer.log('Forcing immediate reconnection', name: 'DevProxyConnection');
    cancelReconnect();
    disconnect();
    await Future.delayed(const Duration(milliseconds: 500));
    await connect();
  }

  /// Updates connection state and notifies listeners
  void _setState(ConnectionState newState) {
    if (_state != newState) {
      _state = newState;
      _stateController.add(newState);
      developer.log('State changed to: $newState', name: 'DevProxyConnection');
    }
  }

  /// Sends acknowledgment for received update
  void sendAck(int sequenceNumber, bool success, {String? error, int? applyTime}) {
    final ackMessage = {
      'type': 'ack',
      'sessionId': sessionId,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'payload': {
        'sequenceNumber': sequenceNumber,
        'success': success,
        if (error != null) 'error': error,
        if (applyTime != null) 'applyTime': applyTime,
      },
    };
    
    sendMessage(ackMessage);
    developer.log(
      'Sent ack for sequence $sequenceNumber (success: $success)',
      name: 'DevProxyConnection',
    );
  }
  
  /// Requests initial schema from server
  void requestInitialSchema() {
    final requestMessage = {
      'type': 'request_schema',
      'sessionId': sessionId,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'payload': {
        'deviceId': deviceId,
        'lastSequence': _lastReceivedSequence,
      },
    };
    
    sendMessage(requestMessage);
    developer.log('Requested initial schema', name: 'DevProxyConnection');
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
  
  /// Checks if connection is healthy (connected and receiving pongs)
  bool isHealthy() {
    if (_state != ConnectionState.connected) {
      return false;
    }
    
    if (_lastPongReceived == null) {
      // Just connected, consider healthy
      return true;
    }
    
    // Check if we've received a pong in the last 60 seconds
    final timeSinceLastPong = DateTime.now().difference(_lastPongReceived!);
    return timeSinceLastPong.inSeconds < 60;
  }
}

/// Connection state enum
enum ConnectionState {
  disconnected,
  connecting,
  connected,
  error,
}
