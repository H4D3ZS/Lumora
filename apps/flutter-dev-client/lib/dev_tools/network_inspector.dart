import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:collection';

/// Network Inspector - Expo Go-like network monitor
/// Tracks WebSocket messages, HTTP requests, and API calls
class NetworkInspector extends StatefulWidget {
  final bool enabled;

  const NetworkInspector({
    super.key,
    required this.enabled,
  });

  @override
  State<NetworkInspector> createState() => _NetworkInspectorState();
}

class _NetworkInspectorState extends State<NetworkInspector> {
  static final NetworkMonitor _monitor = NetworkMonitor.instance;

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) {
      return const SizedBox.shrink();
    }

    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: _buildPanel(),
    );
  }

  Widget _buildPanel() {
    return Container(
      height: MediaQuery.of(context).size.height * 0.4,
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
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
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.teal.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.network_check,
                    color: Colors.teal,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Network Inspector',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'WebSocket & HTTP Traffic',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.delete_sweep, color: Colors.white),
                  onPressed: () {
                    setState(() {
                      _monitor.clear();
                    });
                  },
                  tooltip: 'Clear',
                ),
              ],
            ),
          ),

          const Divider(color: Colors.white24, height: 1),

          // Requests list
          Expanded(
            child: StreamBuilder<List<NetworkRequest>>(
              stream: _monitor.requestsStream,
              initialData: _monitor.requests,
              builder: (context, snapshot) {
                final requests = snapshot.data ?? [];

                if (requests.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.network_check,
                          size: 48,
                          color: Colors.white.withOpacity(0.3),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No network activity',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.5),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: requests.length,
                  separatorBuilder: (_, __) => const Divider(color: Colors.white12, height: 16),
                  itemBuilder: (context, index) {
                    final request = requests[requests.length - 1 - index];
                    return _buildRequestItem(request);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequestItem(NetworkRequest request) {
    final statusColor = _getStatusColor(request.type);

    return InkWell(
      onTap: () => _showRequestDetails(request),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.2),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    request.type.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                if (request.duration != null)
                  Text(
                    '${request.duration}ms',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontFamily: 'monospace',
                    ),
                  ),
                const Spacer(),
                Text(
                  _formatTime(request.timestamp),
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              request.url,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontFamily: 'monospace',
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (request.payload != null) ...[
              const SizedBox(height: 4),
              Text(
                request.payload!,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 11,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String type) {
    switch (type.toLowerCase()) {
      case 'websocket':
        return Colors.blue;
      case 'http':
        return Colors.green;
      case 'error':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:'
        '${time.minute.toString().padLeft(2, '0')}:'
        '${time.second.toString().padLeft(2, '0')}';
  }

  void _showRequestDetails(NetworkRequest request) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => _buildDetailsSheet(request),
    );
  }

  Widget _buildDetailsSheet(NetworkRequest request) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
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
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Text(
                  'Request Details',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          const Divider(color: Colors.white24, height: 1),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDetailSection('Type', request.type.toUpperCase()),
                  const SizedBox(height: 16),
                  _buildDetailSection('URL', request.url),
                  const SizedBox(height: 16),
                  _buildDetailSection('Timestamp', request.timestamp.toString()),
                  if (request.duration != null) ...[
                    const SizedBox(height: 16),
                    _buildDetailSection('Duration', '${request.duration}ms'),
                  ],
                  if (request.payload != null) ...[
                    const SizedBox(height: 16),
                    _buildDetailSection('Payload', request.payload!),
                  ],
                  if (request.response != null) ...[
                    const SizedBox(height: 16),
                    _buildDetailSection('Response', request.response!),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailSection(String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Colors.teal,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.3),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            content,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontFamily: 'monospace',
            ),
          ),
        ),
      ],
    );
  }
}

/// Network request data model
class NetworkRequest {
  final String type;
  final String url;
  final DateTime timestamp;
  final int? duration;
  final String? payload;
  final String? response;
  final int? statusCode;

  NetworkRequest({
    required this.type,
    required this.url,
    required this.timestamp,
    this.duration,
    this.payload,
    this.response,
    this.statusCode,
  });
}

/// Global network monitor singleton
class NetworkMonitor {
  static final NetworkMonitor _instance = NetworkMonitor._internal();
  static NetworkMonitor get instance => _instance;

  NetworkMonitor._internal();

  final _requests = Queue<NetworkRequest>();
  static const int _maxRequests = 100;

  final _streamController = StreamController<List<NetworkRequest>>.broadcast();

  Stream<List<NetworkRequest>> get requestsStream => _streamController.stream;
  List<NetworkRequest> get requests => _requests.toList();

  void logWebSocketMessage(String message, {bool isOutgoing = false}) {
    _addRequest(NetworkRequest(
      type: 'websocket',
      url: isOutgoing ? 'Outgoing Message' : 'Incoming Message',
      timestamp: DateTime.now(),
      payload: message,
    ));
  }

  void logHttpRequest(
    String url,
    String method, {
    int? statusCode,
    int? duration,
    String? request,
    String? response,
  }) {
    _addRequest(NetworkRequest(
      type: 'http',
      url: '$method $url',
      timestamp: DateTime.now(),
      duration: duration,
      payload: request,
      response: response,
      statusCode: statusCode,
    ));
  }

  void logError(String url, String error) {
    _addRequest(NetworkRequest(
      type: 'error',
      url: url,
      timestamp: DateTime.now(),
      payload: error,
    ));
  }

  void _addRequest(NetworkRequest request) {
    _requests.add(request);
    if (_requests.length > _maxRequests) {
      _requests.removeFirst();
    }
    _streamController.add(_requests.toList());
  }

  void clear() {
    _requests.clear();
    _streamController.add([]);
  }

  void dispose() {
    _streamController.close();
  }
}
