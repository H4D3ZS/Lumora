import 'package:flutter/material.dart';
import 'package:lumora_core/lumora_core.dart' hide DeltaDebouncer, ErrorOverlay;
import 'services/kiro_client_service.dart';
import 'services/session_manager.dart';
import 'services/dev_proxy_connection.dart' as proxy;
import 'services/platform_config.dart';
import 'services/update_handler.dart';
import 'widgets/connection_dialogs.dart';
import 'widgets/error_widgets.dart';
import 'widgets/qr_scanner_screen.dart';
import 'widgets/protocol_error_dialog.dart';
import 'interpreter/navigation_manager.dart';
import 'interpreter/schema_interpreter.dart' as local;
import 'interpreter/delta_debouncer.dart';
import 'dev_tools/dev_tools_overlay.dart';

import 'dart:async';
import 'services/global_error_handler.dart';

void main() {
  runZonedGuarded(() {
    WidgetsFlutterBinding.ensureInitialized();
    
    FlutterError.onError = (FlutterErrorDetails details) {
      FlutterError.presentError(details);
      GlobalErrorHandler().handleError(details.exception, details.stack);
    };
    
    runApp(const FlutterDevClient());
  }, (error, stack) {
    debugPrint('Caught global error: $error');
    GlobalErrorHandler().handleError(error, stack);
  });
}

class FlutterDevClient extends StatefulWidget {
  const FlutterDevClient({super.key});

  @override
  State<FlutterDevClient> createState() => _FlutterDevClientState();
}

class _FlutterDevClientState extends State<FlutterDevClient> {
  AppError? _currentError;
  StreamSubscription? _errorSubscription;

  @override
  void initState() {
    super.initState();
    _errorSubscription = GlobalErrorHandler().errorStream.listen((error) {
      setState(() {
        _currentError = error;
      });
    });
  }

  @override
  void dispose() {
    _errorSubscription?.cancel();
    super.dispose();
  }

  void _dismissError() {
    setState(() {
      _currentError = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lumora Go',
      debugShowCheckedModeBanner: false, // Hide debug banner (like Expo Go)
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF667eea), // Lumora brand color
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        // Platform-adaptive styling
        platform: TargetPlatform.android,
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
        ),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF667eea),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        platform: TargetPlatform.android,
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
        ),
      ),
      themeMode: ThemeMode.system, // Respect system theme
      builder: (context, child) {
        return Stack(
          children: [
            if (child != null) child,
            if (_currentError != null)
              ErrorOverlay(
                title: 'Runtime Error',
                message: _currentError!.error.toString(),
                stackTrace: _currentError!.stackTrace?.toString(),
                onDismiss: _dismissError,
                onRetry: () {
                  _dismissError();
                  // Ideally trigger a reload here if possible, but for now just dismiss
                },
              ),
          ],
        );
      },
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
  local.SchemaInterpreter? _interpreter;
  EventBridge? _eventBridge;
  DeltaDebouncer? _deltaDebouncer;
  UpdateHandler? _updateHandler;
  NavigationManager? _navigationManager;
  bool _showOfflineIndicator = false;
  
  // Error state
  String? _lastUpdateError;
  String? _lastUpdateStackTrace;
  Widget? _lastSuccessfulWidget;

  // Connection parameters (can be set via QR scan)
  String? _customWsUrl; // WebSocket URL from QR code
  String? _sessionId; // Session ID from QR code
  final String _token = 'test-token'; // Token for authentication

  @override
  void dispose() {
    _service?.dispose();
    _deltaDebouncer?.dispose();
    _updateHandler?.dispose();
    _navigationManager?.dispose();
    super.dispose();
  }

  Future<void> _connect() async {
    if (_isConnecting) return;

    // Check if we have connection parameters
    if (_customWsUrl == null || _sessionId == null) {
      setState(() {
        _status = 'Please scan QR code to connect';
      });
      return;
    }

    setState(() {
      _isConnecting = true;
      _status = 'Connecting...';
      _showOfflineIndicator = false;
    });

    try {
      // Use the WebSocket URL from QR code
      final wsUrl = _customWsUrl!;
      debugPrint('Connecting to: $wsUrl (Platform: ${PlatformConfig.getPlatformName()})');
      
      _service = KiroClientService(
        wsUrl: wsUrl,
        sessionId: _sessionId!,
        token: _token,
      );

      // Intercept logs and send to Dev Proxy
      // Note: This is a simple interception. For production, use runZonedGuarded.
      final originalPrint = debugPrint;
      debugPrint = (String? message, {int? wrapWidth}) {
        originalPrint(message, wrapWidth: wrapWidth);
        if (message != null && _service != null) {
          _service!.sendLog(message, 'info');
        }
      };

      // Create SessionManager
      final sessionManager = SessionManager(connection: _service!.connection);

      // Create EventBridge with the service's connection
      _eventBridge = EventBridge(connection: _service!.connection);

      // Create NavigationManager
      _navigationManager = NavigationManager();

      // Create SchemaInterpreter with EventBridge and NavigationManager
      _interpreter = local.SchemaInterpreter(
        eventBridge: _eventBridge,
        navigationManager: _navigationManager,
      );
      
      // Create UpdateHandler
      _updateHandler = UpdateHandler(
        interpreter: _interpreter!,
        connection: _service!.connection,
        sessionManager: sessionManager,
      );

      // Attempt to load cached schema if available
      _loadCachedSchema(sessionManager);

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
      
      // Listen to raw messages for server errors
      _service!.connection.messages.listen((message) {
        if (message['type'] == 'error') {
          _handleServerError(message);
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

      // Listen to update results from UpdateHandler
      _updateHandler!.updates.listen((result) {
        setState(() {
          if (result.success && result.widget != null) {
            // Success - update UI and clear errors
            _lastSuccessfulWidget = result.widget;
            _renderedUI = result.widget;
            _lastUpdateError = null;
            _lastUpdateStackTrace = null;
            _isParsing = false;
            _status = 'Connected and joined session';
            
            debugPrint('Update applied successfully in ${result.applyTime}ms');

            // Show feedback toast
            if (mounted) {
              final isFullUpdate = result.updateType == 'full';
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Row(
                    children: [
                      Icon(
                        isFullUpdate ? Icons.refresh : Icons.bolt,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Text(isFullUpdate 
                        ? 'Hot Restarted (State Reset)' 
                        : 'Hot Reloaded'
                      ),
                    ],
                  ),
                  backgroundColor: Colors.black87,
                  behavior: SnackBarBehavior.floating,
                  width: 280,
                  duration: const Duration(milliseconds: 1500),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
              );
            }
          } else {
            // Failure - show error overlay but keep previous widget
            _lastUpdateError = result.error;
            _lastUpdateStackTrace = result.stackTrace;
            _isParsing = false;
            _status = 'Update failed';
            
            debugPrint('Update failed: ${result.error}');
          }
        });
      });
      
      // Listen to update messages (hot reload protocol)
      _service!.updateMessages.listen((message) async {
        debugPrint('Received update message');
        
        // Show loading indicator while applying
        setState(() {
          _isParsing = true;
          _status = 'Applying update...';
        });
        
        try {
          // Handle via UpdateHandler
          await _updateHandler!.handleUpdate(message.updateData);
        } catch (e) {
          debugPrint('Error handling update: $e');
          setState(() {
            _isParsing = false;
            _status = 'Error applying update: $e';
          });
        }
      });
      
      // Listen to connected messages (hot reload protocol)
      _service!.connectedMessages.listen((message) async {
        debugPrint('Received connected message with connection ID: ${message.connectionId}');
        
        // If initial schema is provided, handle it
        if (message.initialSchema != null) {
          setState(() {
            _isParsing = true;
            _status = 'Loading initial schema...';
          });
          
          try {
            // Create a full update message format
            final updateMessage = {
              'type': 'update',
              'payload': {
                'type': 'full',
                'schema': message.initialSchema,
                'sequenceNumber': 0,
                'preserveState': false,
              },
            };
            
            // Handle via UpdateHandler
            await _updateHandler!.handleUpdate(updateMessage);
          } catch (e) {
            debugPrint('Error handling initial schema: $e');
            setState(() {
              _isParsing = false;
              _status = 'Error loading initial schema: $e';
            });
          }
        }
      });
      
      // Listen to schema messages (legacy support) and handle them via UpdateHandler
      _service!.schemaMessages.listen((message) async {
        debugPrint('Received schema: ${message.schema}');
        
        // Show loading indicator while parsing
        setState(() {
          _isParsing = true;
          _status = 'Parsing schema...';
        });
        
        try {
          // Create a full update message format
          final updateMessage = {
            'type': 'update',
            'payload': {
              'type': 'full',
              'schema': message.schema,
              'sequenceNumber': 0,
              'preserveState': false,
            },
          };
          
          // Handle via UpdateHandler
          await _updateHandler!.handleUpdate(updateMessage);
        } catch (e) {
          debugPrint('Error handling schema: $e');
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

    // Determine error type
    final errorMessage = connection.lastError ?? 'Connection failed';
    final attemptNumber = connection.reconnectAttempts;
    final nextRetrySeconds = (1 << (attemptNumber - 1)).clamp(1, 30);
    
    // Check if it's a timeout error
    final isTimeout = errorMessage.toLowerCase().contains('timeout') ||
                     !connection.isHealthy();

    // Show appropriate error dialog
    final action = isTimeout
        ? await showTimeoutErrorDialog(
            context,
            errorMessage: errorMessage,
            attemptNumber: attemptNumber,
          )
        : await showConnectionErrorDialog(
            context,
            errorMessage: errorMessage,
            attemptNumber: attemptNumber,
            nextRetrySeconds: nextRetrySeconds,
          );

    if (!mounted) return;

    // Handle user action
    switch (action) {
      case ProtocolErrorAction.retry:
        // User wants to retry immediately
        await _service?.connection.forceReconnect();
        break;
      case ProtocolErrorAction.scanQR:
        // Navigate to QR scanner
        await _scanQRCode();
        break;
      case ProtocolErrorAction.dismiss:
      case null:
        // User dismissed, let automatic reconnection continue
        break;
    }
  }

  /// Handles authentication failure with QR scan option
  void _handleAuthenticationFailure() async {
    if (!mounted) return;

    final connection = _service?.connection;
    final errorMessage = connection?.lastError ?? 'Authentication failed';
    
    // Show authentication error dialog
    final action = await showAuthenticationErrorDialog(
      context,
      errorMessage: errorMessage,
      errorCode: 'AUTHENTICATION_FAILED',
    );

    if (!mounted) return;

    // Handle user action
    switch (action) {
      case ProtocolErrorAction.scanQR:
        // Reset authentication failure flag
        _service?.connection.resetAuthenticationFailure();
        
        // Disconnect and clear state
        setState(() {
          _status = 'Please scan QR code to reconnect';
          _service?.disconnect();
          _service = null;
          _renderedUI = null;
          _lastSuccessfulWidget = null;
          _lastUpdateError = null;
          _lastUpdateStackTrace = null;
        });
        
        // Navigate to QR scanner
        await _scanQRCode();
        break;
      case ProtocolErrorAction.dismiss:
      case ProtocolErrorAction.retry:
      case null:
        // User dismissed, disconnect
        _disconnect();
        break;
    }
  }
  
  /// Handles server error messages
  void _handleServerError(Map<String, dynamic> message) async {
    if (!mounted) return;
    
    final payload = message['payload'] as Map<String, dynamic>?;
    if (payload == null) return;
    
    final errorCode = payload['code'] as String?;
    final errorMessage = payload['message'] as String? ?? 'Server error occurred';
    final severity = payload['severity'] as String?;
    final recoverable = payload['recoverable'] as bool? ?? true;
    
    debugPrint('Server error: $errorCode - $errorMessage (severity: $severity)');
    
    // Don't show dialog for non-fatal errors
    if (severity != 'fatal' && recoverable) {
      // Just show a snackbar for minor errors
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.warning_amber, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(child: Text(errorMessage)),
              ],
            ),
            backgroundColor: Colors.orange,
            duration: const Duration(seconds: 4),
          ),
        );
      }
      return;
    }
    
    // Show dialog for fatal errors
    final action = await showServerErrorDialog(
      context,
      errorMessage: errorMessage,
      errorCode: errorCode,
    );
    
    if (!mounted) return;
    
    // Handle user action
    switch (action) {
      case ProtocolErrorAction.retry:
        await _service?.connection.forceReconnect();
        break;
      case ProtocolErrorAction.scanQR:
        await _scanQRCode();
        break;
      case ProtocolErrorAction.dismiss:
      case null:
        if (!recoverable) {
          _disconnect();
        }
        break;
    }
  }

  void _disconnect() {
    _service?.disconnect();
    _deltaDebouncer?.cancel();
    _navigationManager?.clearHistory();
    setState(() {
      _status = 'Disconnected';
      _renderedUI = null;
      _lastSuccessfulWidget = null;
      _lastUpdateError = null;
      _lastUpdateStackTrace = null;
      _showOfflineIndicator = false;
    });
  }
  
  /// Manually reloads the current schema (for error recovery)
  void _manualReload() {
    if (_updateHandler == null) {
      debugPrint('Cannot reload: UpdateHandler not initialized');
      return;
    }
    
    final currentSchema = _updateHandler!.currentSchema;
    if (currentSchema == null) {
      debugPrint('Cannot reload: No current schema');
      return;
    }
    
    setState(() {
      _isParsing = true;
      _status = 'Reloading...';
      _lastUpdateError = null;
      _lastUpdateStackTrace = null;
    });
    
    try {
      // Re-interpret the current schema
      final widget = _interpreter!.interpretSchema(currentSchema);
      setState(() {
        _renderedUI = widget;
        _lastSuccessfulWidget = widget;
        _isParsing = false;
        _status = 'Connected and joined session';
      });
    } catch (e) {
      debugPrint('Manual reload failed: $e');
      setState(() {
        _isParsing = false;
        _status = 'Reload failed: $e';
      });
    }
  }

  /// Opens QR scanner and processes scanned connection data
  Future<void> _scanQRCode() async {
    try {
      final result = await Navigator.of(context).push<Map<String, String>>(
        MaterialPageRoute(
          builder: (context) => const QRScannerScreen(),
        ),
      );

      if (result != null && mounted) {
        // Extract connection data from QR code
        final wsUrl = result['wsUrl'];
        final sessionId = result['sessionId'];

        if (wsUrl != null && sessionId != null) {
          setState(() {
            _customWsUrl = wsUrl;
            _sessionId = sessionId;
            _status = 'QR code scanned successfully';
          });

          debugPrint('QR Code scanned - URL: $wsUrl, Session: $sessionId');

          // Show success message
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.white),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text('Connected to session: $sessionId'),
                    ),
                  ],
                ),
                backgroundColor: Colors.green,
                duration: const Duration(seconds: 3),
              ),
            );
          }

          // Auto-connect after successful scan
          await _connect();
        }
      }
    } catch (e) {
      debugPrint('Error scanning QR code: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text('Failed to scan QR code: $e'),
                ),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
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

  /// Loads cached schema from SessionManager
  Future<void> _loadCachedSchema(SessionManager sessionManager) async {
    final cachedSchema = await sessionManager.loadCachedSchema();
    if (cachedSchema != null && mounted) {
      debugPrint('Found cached schema, rendering...');
      try {
        final widget = _interpreter!.interpretSchema(cachedSchema);
        setState(() {
          _renderedUI = widget;
          _lastSuccessfulWidget = widget;
          _status = 'Loaded from cache (Offline)';
        });
      } catch (e) {
        debugPrint('Failed to render cached schema: $e');
      }
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
    final scaffoldContent = Scaffold(
      appBar: _renderedUI == null ? AppBar(
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.rocket_launch, size: 20),
            ),
            const SizedBox(width: 12),
            const Text('Lumora Go', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          if (_service != null)
            IconButton(
              icon: const Icon(Icons.link_off),
              onPressed: _disconnect,
              tooltip: 'Disconnect',
            ),
        ],
      ) : null, // Hide app bar when showing rendered UI (like Expo Go)
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
              : _lastUpdateError != null
              ? UpdateErrorOverlay(
                  errorMessage: _lastUpdateError!,
                  stackTrace: _lastUpdateStackTrace,
                  previousWidget: _lastSuccessfulWidget,
                  onRetry: _manualReload,
                  onDismiss: () {
                    setState(() {
                      _lastUpdateError = null;
                      _lastUpdateStackTrace = null;
                      // Restore last successful widget
                      if (_lastSuccessfulWidget != null) {
                        _renderedUI = _lastSuccessfulWidget;
                      }
                    });
                  },
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
                              Column(
                                children: [
                                  ElevatedButton.icon(
                                    onPressed: _scanQRCode,
                                    icon: const Icon(Icons.qr_code_scanner),
                                    label: const Text('Scan QR Code'),
                                    style: ElevatedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 32,
                                        vertical: 16,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  if (_customWsUrl != null && _sessionId != null)
                                    OutlinedButton.icon(
                                      onPressed: _connect,
                                      icon: const Icon(Icons.link),
                                      label: const Text('Connect Manually'),
                                    ),
                                ],
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
          ),
        ],
      ),
    );

    // Wrap with DevToolsOverlay only when connected and rendering UI
    if (_renderedUI != null && _service != null) {
      return DevToolsOverlay(
        enabled: true,
        connection: _service!.connection,
        currentSchema: _updateHandler?.currentSchema,
        onReload: _manualReload,
        onDisconnect: _disconnect,
        child: scaffoldContent,
      );
    }

    return scaffoldContent;
  }
}
