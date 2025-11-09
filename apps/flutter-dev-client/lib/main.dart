import 'package:flutter/material.dart';
import 'package:kiro_core/kiro_core.dart';
import 'services/kiro_client_service.dart';
import 'services/session_manager.dart';
import 'services/dev_proxy_connection.dart' as proxy;
import 'services/platform_config.dart';
import 'widgets/connection_dialogs.dart';

void main() {
  runApp(const KiroDevClientApp());
}

class KiroDevClientApp extends StatelessWidget {
  const KiroDevClientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kiro Dev Client',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
        // Platform-adaptive styling
        platform: TargetPlatform.android,
      ),
      home: const ConnectionScreen(),
    );
  }
}

class ConnectionScreen extends StatefulWidget {
  const ConnectionScreen({super.key});

  @override
  State<ConnectionScreen> createState() => _ConnectionScreenState();
}

class _ConnectionScreenState extends State<ConnectionScreen> {
  KiroClientService? _service;
  String _status = 'Not connected';
  bool _isConnecting = false;
  Widget? _renderedUI;
  bool _isParsing = false;
  SchemaInterpreter? _interpreter;
  EventBridge? _eventBridge;
  DeltaDebouncer? _deltaDebouncer;
  bool _showOfflineIndicator = false;

  // Default connection parameters (will be replaced with QR scan)
  // Use platform-specific WebSocket URL
  String? _customWsUrl; // Can be set via QR scan for physical devices
  final String _sessionId = 'test-session';
  final String _token = 'test-token';

  @override
  void dispose() {
    _service?.dispose();
    _deltaDebouncer?.dispose();
    super.dispose();
  }

  Future<void> _connect() async {
    if (_isConnecting) return;

    setState(() {
      _isConnecting = true;
      _status = 'Connecting...';
      _showOfflineIndicator = false;
    });

    try {
      // Get platform-specific WebSocket URL
      final wsUrl = PlatformConfig.getWebSocketUrl(customUrl: _customWsUrl);
      debugPrint('Connecting to: $wsUrl (Platform: ${PlatformConfig.getPlatformName()})');
      
      _service = KiroClientService(
        wsUrl: wsUrl,
        sessionId: _sessionId,
        token: _token,
      );

      // Create EventBridge with the service's connection
      _eventBridge = EventBridge(connection: _service!.connection);

      // Create SchemaInterpreter with EventBridge
      _interpreter = SchemaInterpreter(eventBridge: _eventBridge);

      // Listen to connection state changes
      _service!.connection.stateChanges.listen((state) {
        setState(() {
          _showOfflineIndicator = (state == proxy.ConnectionState.disconnected || 
                                   state == proxy.ConnectionState.error);
        });

        // Handle connection errors
        if (state == proxy.ConnectionState.error) {
          _handleConnectionError();
        }
      });

      // Listen to session events
      _service!.sessionEvents.listen((event) {
        setState(() {
          switch (event) {
            case SessionEvent.joined:
              _status = 'Connected and joined session';
              _showOfflineIndicator = false;
              break;
            case SessionEvent.joinRejected:
              _status = 'Join rejected: ${_service!.rejectionReason}';
              _handleAuthenticationFailure();
              break;
            case SessionEvent.error:
              _status = 'Error occurred';
              break;
          }
        });
      });

      // Listen to schema messages and render them
      _service!.schemaMessages.listen((message) async {
        debugPrint('Received schema: ${message.schema}');
        
        // Show loading indicator while parsing
        setState(() {
          _isParsing = true;
          _status = 'Parsing schema...';
        });
        
        try {
          // Interpret schema (may use isolate for large schemas)
          final widget = _interpreter!.interpretSchema(message.schema);
          
          setState(() {
            _renderedUI = widget;
            _isParsing = false;
            _status = 'Connected and joined session';
          });
        } catch (e) {
          debugPrint('Error interpreting schema: $e');
          setState(() {
            _isParsing = false;
            _status = 'Error rendering UI: $e';
          });
        }
      });

      // Initialize delta debouncer
      _deltaDebouncer = DeltaDebouncer(
        onBatchReady: _applyDeltaBatch,
      );

      // Listen to delta messages and queue them for debouncing
      _service!.deltaMessages.listen((message) {
        debugPrint('Received delta: ${message.delta}');
        _deltaDebouncer?.addDelta(message.delta);
      });

      await _service!.initialize();

      setState(() {
        _isConnecting = false;
      });
    } catch (e) {
      setState(() {
        _status = 'Connection failed: $e';
        _isConnecting = false;
        _showOfflineIndicator = true;
      });
    }
  }

  /// Handles connection errors with retry dialog
  void _handleConnectionError() async {
    if (!mounted) return;
    
    final connection = _service?.connection;
    if (connection == null) return;

    // Check if authentication failed
    if (connection.authenticationFailed) {
      _handleAuthenticationFailure();
      return;
    }

    // Calculate next retry delay
    final attemptNumber = connection.reconnectAttempts;
    final nextRetrySeconds = (1 << (attemptNumber - 1)).clamp(1, 30);

    // Show retry dialog
    final shouldRetry = await showConnectionRetryDialog(
      context,
      errorMessage: connection.lastError ?? 'Connection failed',
      attemptNumber: attemptNumber,
      nextRetrySeconds: nextRetrySeconds,
    );

    if (shouldRetry == true && mounted) {
      // User wants to retry immediately
      _service?.connection.connect();
    }
  }

  /// Handles authentication failure with QR scan option
  void _handleAuthenticationFailure() async {
    if (!mounted) return;

    final shouldScanQR = await showAuthenticationFailureDialog(context);

    if (shouldScanQR == true && mounted) {
      // Reset authentication failure flag
      _service?.connection.resetAuthenticationFailure();
      
      // Show QR scan screen (placeholder for now)
      setState(() {
        _status = 'Please scan QR code to reconnect';
        _service?.disconnect();
        _service = null;
        _renderedUI = null;
      });
    }
  }

  void _disconnect() {
    _service?.disconnect();
    _deltaDebouncer?.cancel();
    setState(() {
      _status = 'Disconnected';
      _renderedUI = null;
      _showOfflineIndicator = false;
    });
  }

  /// Sets custom WebSocket URL (for physical devices or custom configurations)
  void _setCustomWebSocketUrl(String url) {
    if (PlatformConfig.isValidWebSocketUrl(url)) {
      setState(() {
        _customWsUrl = url;
      });
    } else {
      debugPrint('Invalid WebSocket URL: $url');
    }
  }

  /// Applies a batch of delta updates
  void _applyDeltaBatch(List<Map<String, dynamic>> deltas) {
    if (deltas.isEmpty) {
      return;
    }

    debugPrint('Applying batch of ${deltas.length} deltas');

    setState(() {
      _isParsing = true;
      _status = 'Applying updates...';
    });

    try {
      // Apply each delta in sequence
      Widget? updatedWidget;
      for (final delta in deltas) {
        updatedWidget = _interpreter?.applyDelta(delta);
      }

      if (updatedWidget != null) {
        setState(() {
          _renderedUI = updatedWidget;
          _isParsing = false;
          _status = 'Connected and joined session';
        });
      } else {
        debugPrint('Delta application returned null widget');
        setState(() {
          _isParsing = false;
          _status = 'Error: No schema to update';
        });
      }
    } catch (e) {
      debugPrint('Error applying delta batch: $e');
      setState(() {
        _isParsing = false;
        _status = 'Error applying updates: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('Kiro Dev Client'),
        actions: [
          if (_service != null)
            IconButton(
              icon: const Icon(Icons.link_off),
              onPressed: _disconnect,
              tooltip: 'Disconnect',
            ),
        ],
      ),
      body: Column(
        children: [
          OfflineIndicator(isVisible: _showOfflineIndicator),
          Expanded(
            child: _isParsing
              ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(
                    'Parsing large schema...',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            )
          : _renderedUI != null
              ? SingleChildScrollView(
                  child: _renderedUI,
                )
              : Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.qr_code_scanner,
                      size: 100,
                      color: Colors.deepPurple,
                    ),
                    const SizedBox(height: 32),
                    Text(
                      _status,
                      style: Theme.of(context).textTheme.titleMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    if (!_isConnecting && _service == null)
                      ElevatedButton.icon(
                        onPressed: _connect,
                        icon: const Icon(Icons.link),
                        label: const Text('Connect to Dev-Proxy'),
                      ),
                    if (_isConnecting) const CircularProgressIndicator(),
                    if (_service != null && !_isConnecting && _renderedUI == null)
                      const Text(
                        'Connected. Waiting for UI schema...',
                        style: TextStyle(
                          fontSize: 16,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                  ],
                ),
              ),
          ),
        ],
      ),
    );
  }
}
