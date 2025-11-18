import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:io' show Platform;
import '../services/dev_proxy_connection.dart' as proxy;

/// Developer Menu - Expo Go-like dev menu
/// Shake gesture or double-tap (3 fingers) to open
class DevMenu extends StatelessWidget {
  final VoidCallback? onReload;
  final VoidCallback? onToggleInspector;
  final VoidCallback? onTogglePerformance;
  final VoidCallback? onToggleNetworkInspector;
  final VoidCallback? onClearCache;
  final VoidCallback? onDisconnect;
  final proxy.DevProxyConnection? connection;
  final bool inspectorEnabled;
  final bool performanceEnabled;
  final bool networkInspectorEnabled;

  const DevMenu({
    super.key,
    this.onReload,
    this.onToggleInspector,
    this.onTogglePerformance,
    this.onToggleNetworkInspector,
    this.onClearCache,
    this.onDisconnect,
    this.connection,
    this.inspectorEnabled = false,
    this.performanceEnabled = false,
    this.networkInspectorEnabled = false,
  });

  @override
  Widget build(BuildContext context) {
    final serverInfo = connection != null ? _getConnectionInfo() : null;

    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[600],
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF667eea),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.developer_mode,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Developer Menu',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Lumora Go Dev Tools',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            // Connection Info
            if (serverInfo != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: serverInfo['isConnected'] ? Colors.green : Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          serverInfo['isConnected'] ? 'Connected' : 'Disconnected',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _buildInfoRow('Server', serverInfo['server']),
                    _buildInfoRow('Session', serverInfo['session']),
                    if (serverInfo['latency'] != null)
                      _buildInfoRow('Latency', '${serverInfo['latency']}ms'),
                  ],
                ),
              ),

            const Divider(color: Colors.white24, height: 1, indent: 20, endIndent: 20),

            // Main Actions
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Column(
                  children: [
                    _buildMenuItem(
                      context,
                      icon: Icons.refresh,
                      title: 'Reload',
                      subtitle: 'Reload the current app',
                      onTap: onReload,
                      iconColor: Colors.blue,
                    ),
                    _buildMenuItem(
                      context,
                      icon: inspectorEnabled ? Icons.visibility_off : Icons.visibility,
                      title: 'Element Inspector',
                      subtitle: inspectorEnabled ? 'Hide inspector' : 'Inspect UI elements',
                      onTap: onToggleInspector,
                      iconColor: Colors.purple,
                      trailing: Switch(
                        value: inspectorEnabled,
                        onChanged: (_) => onToggleInspector?.call(),
                        activeColor: Colors.purple,
                      ),
                    ),
                    _buildMenuItem(
                      context,
                      icon: Icons.speed,
                      title: 'Performance Monitor',
                      subtitle: performanceEnabled ? 'Hide monitor' : 'Show FPS, memory, CPU',
                      onTap: onTogglePerformance,
                      iconColor: Colors.orange,
                      trailing: Switch(
                        value: performanceEnabled,
                        onChanged: (_) => onTogglePerformance?.call(),
                        activeColor: Colors.orange,
                      ),
                    ),
                    _buildMenuItem(
                      context,
                      icon: Icons.network_check,
                      title: 'Network Inspector',
                      subtitle: networkInspectorEnabled ? 'Hide network logs' : 'Monitor network requests',
                      onTap: onToggleNetworkInspector,
                      iconColor: Colors.teal,
                      trailing: Switch(
                        value: networkInspectorEnabled,
                        onChanged: (_) => onToggleNetworkInspector?.call(),
                        activeColor: Colors.teal,
                      ),
                    ),
                    const Divider(color: Colors.white24, height: 24, indent: 20, endIndent: 20),
                    _buildMenuItem(
                      context,
                      icon: Icons.delete_sweep,
                      title: 'Clear Cache',
                      subtitle: 'Clear all cached data',
                      onTap: onClearCache,
                      iconColor: Colors.amber,
                    ),
                    _buildMenuItem(
                      context,
                      icon: Icons.bug_report,
                      title: 'Debug Info',
                      subtitle: 'Show debug information',
                      onTap: () => _showDebugInfo(context),
                      iconColor: Colors.cyan,
                    ),
                    const Divider(color: Colors.white24, height: 24, indent: 20, endIndent: 20),
                    _buildMenuItem(
                      context,
                      icon: Icons.link_off,
                      title: 'Disconnect',
                      subtitle: 'Disconnect from dev server',
                      onTap: () {
                        Navigator.of(context).pop();
                        onDisconnect?.call();
                      },
                      iconColor: Colors.red,
                    ),
                  ],
                ),
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.all(20),
              child: Text(
                'Shake device to open this menu',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.5),
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    VoidCallback? onTap,
    Color? iconColor,
    Widget? trailing,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (iconColor ?? Colors.white).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: iconColor ?? Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (trailing != null) trailing,
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: TextStyle(
              color: Colors.white.withOpacity(0.5),
              fontSize: 11,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontFamily: 'monospace',
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getConnectionInfo() {
    if (connection == null) {
      return {'isConnected': false};
    }

    return {
      'isConnected': connection!.state == proxy.ConnectionState.connected,
      'server': connection!.wsUrl,
      'session': connection!.sessionId ?? 'N/A',
      'latency': connection!.lastPingLatency,
    };
  }

  void _showDebugInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text(
          'Debug Information',
          style: TextStyle(color: Colors.white),
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDebugItem('Platform', Platform.operatingSystem),
              _buildDebugItem('Lumora Version', '1.2.7'),
              _buildDebugItem('Flutter Version', 'Stable'),
              if (connection != null) ...[
                const Divider(color: Colors.white24),
                _buildDebugItem('Connection State', connection!.state.toString()),
                _buildDebugItem('Reconnect Attempts', connection!.reconnectAttempts.toString()),
                _buildDebugItem('Is Healthy', connection!.isHealthy().toString()),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
          TextButton(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: _getDebugText()));
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Debug info copied to clipboard')),
              );
            },
            child: const Text('Copy'),
          ),
        ],
      ),
    );
  }

  Widget _buildDebugItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }

  String _getDebugText() {
    final buffer = StringBuffer();
    buffer.writeln('Platform: ${Platform.operatingSystem}');
    buffer.writeln('Lumora Version: 1.2.7');
    if (connection != null) {
      buffer.writeln('Connection State: ${connection!.state}');
      buffer.writeln('Server: ${connection!.wsUrl}');
      buffer.writeln('Session: ${connection!.sessionId}');
    }
    return buffer.toString();
  }
}

/// Shake detector for opening dev menu
class ShakeDetector {
  static const double _shakeThreshold = 2.7;
  final VoidCallback onShake;

  ShakeDetector({required this.onShake});

  // Note: Actual shake detection requires accelerometer package
  // For now, we'll provide a method to manually trigger
  void trigger() {
    onShake();
  }
}
