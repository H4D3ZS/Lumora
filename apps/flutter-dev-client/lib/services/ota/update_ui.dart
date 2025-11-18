/**
 * Update UI Components - User-facing update prompts and progress
 */

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'update_manager.dart';

/// Update available dialog
class UpdateAvailableDialog extends StatelessWidget {
  final UpdateManifest manifest;
  final VoidCallback onUpdate;
  final VoidCallback onSkip;

  const UpdateAvailableDialog({
    super.key,
    required this.manifest,
    required this.onUpdate,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.system_update, color: Colors.blue),
          ),
          const SizedBox(width: 12),
          const Text('Update Available'),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Version ${manifest.version}',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          if (manifest.metadata['description'] != null) ...[
            Text(
              manifest.metadata['description'],
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
          ],
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                _buildInfoRow('Channel', _getChannelBadge(manifest.channel)),
                const SizedBox(height: 4),
                _buildInfoRow('Size', _formatBytes(manifest.size)),
                if (manifest.metadata['releaseNotes'] != null) ...[
                  const SizedBox(height: 8),
                  const Divider(),
                  const SizedBox(height: 8),
                  Text(
                    manifest.metadata['releaseNotes'],
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: onSkip,
          child: const Text('Skip'),
        ),
        ElevatedButton.icon(
          onPressed: onUpdate,
          icon: const Icon(Icons.download),
          label: const Text('Update Now'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 12,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  String _getChannelBadge(String channel) {
    final badges = {
      'production': '🟢 Production',
      'staging': '🟡 Staging',
      'development': '🔵 Development',
      'preview': '🟣 Preview',
    };
    return badges[channel] ?? channel;
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

/// Update progress overlay
class UpdateProgressOverlay extends StatelessWidget {
  final UpdateProgress progress;
  final VoidCallback? onCancel;

  const UpdateProgressOverlay({
    super.key,
    required this.progress,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withOpacity(0.8),
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.cloud_download,
                size: 64,
                color: Colors.blue,
              ),
              const SizedBox(height: 24),
              const Text(
                'Downloading Update',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                progress.status,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progress.progress,
                  minHeight: 8,
                  backgroundColor: Colors.grey[200],
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.blue),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${progress.percentage.toStringAsFixed(1)}% • ${_formatBytes(progress.downloaded)} / ${_formatBytes(progress.total)}',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                  fontFamily: 'monospace',
                ),
              ),
              if (onCancel != null) ...[
                const SizedBox(height: 24),
                TextButton(
                  onPressed: onCancel,
                  child: const Text('Cancel'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

/// Update ready dialog
class UpdateReadyDialog extends StatelessWidget {
  final UpdateManifest manifest;
  final VoidCallback onRestart;
  final VoidCallback onLater;

  const UpdateReadyDialog({
    super.key,
    required this.manifest,
    required this.onRestart,
    required this.onLater,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.check_circle, color: Colors.green),
          ),
          const SizedBox(width: 12),
          const Text('Update Ready'),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Version ${manifest.version} has been downloaded',
            style: const TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue.withOpacity(0.3)),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline, color: Colors.blue, size: 20),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Restart the app to apply the update',
                    style: TextStyle(fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: onLater,
          child: const Text('Later'),
        ),
        ElevatedButton.icon(
          onPressed: onRestart,
          icon: const Icon(Icons.restart_alt),
          label: const Text('Restart Now'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green,
            foregroundColor: Colors.white,
          ),
        ),
      ],
    );
  }
}

/// Update error snackbar
SnackBar buildUpdateErrorSnackbar(String message) {
  return SnackBar(
    content: Row(
      children: [
        const Icon(Icons.error_outline, color: Colors.white),
        const SizedBox(width: 12),
        Expanded(
          child: Text(message),
        ),
      ],
    ),
    backgroundColor: Colors.red,
    duration: const Duration(seconds: 5),
    action: SnackBarAction(
      label: 'Dismiss',
      textColor: Colors.white,
      onPressed: () {},
    ),
  );
}

/// Update success snackbar
SnackBar buildUpdateSuccessSnackbar(String message) {
  return SnackBar(
    content: Row(
      children: [
        const Icon(Icons.check_circle, color: Colors.white),
        const SizedBox(width: 12),
        Expanded(
          child: Text(message),
        ),
      ],
    ),
    backgroundColor: Colors.green,
    duration: const Duration(seconds: 3),
  );
}

/// Update checker widget - Automatically checks for updates
class AutoUpdateChecker extends StatefulWidget {
  final OTAUpdateManager updateManager;
  final Duration checkInterval;
  final bool showDialogs;
  final Widget child;

  const AutoUpdateChecker({
    super.key,
    required this.updateManager,
    this.checkInterval = const Duration(hours: 1),
    this.showDialogs = true,
    required this.child,
  });

  @override
  State<AutoUpdateChecker> createState() => _AutoUpdateCheckerState();
}

class _AutoUpdateCheckerState extends State<AutoUpdateChecker> {
  UpdateProgress? _downloadProgress;
  bool _isDownloading = false;

  @override
  void initState() {
    super.initState();
    _checkForUpdates();
    _schedulePeriodicCheck();
  }

  void _schedulePeriodicCheck() {
    Future.delayed(widget.checkInterval, () {
      if (mounted) {
        _checkForUpdates();
        _schedulePeriodicCheck();
      }
    });
  }

  Future<void> _checkForUpdates() async {
    try {
      final result = await widget.updateManager.checkForUpdate();

      if (!mounted || !result.updateAvailable || !widget.showDialogs) return;

      // Fetch manifest
      final manifestUrl = widget.updateManager.serverUrl + result.manifestUrl!;
      final response = await http.get(Uri.parse(manifestUrl));
      final manifest = UpdateManifest.fromJson(jsonDecode(response.body));

      // Show update dialog
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => UpdateAvailableDialog(
            manifest: manifest,
            onUpdate: () {
              Navigator.of(context).pop();
              _startDownload(result);
            },
            onSkip: () => Navigator.of(context).pop(),
          ),
        );
      }
    } catch (e) {
      debugPrint('Auto update check failed: $e');
    }
  }

  Future<void> _startDownload(UpdateCheckResult updateCheck) async {
    setState(() {
      _isDownloading = true;
    });

    try {
      final success = await widget.updateManager.downloadAndInstallUpdate(updateCheck);

      if (mounted) {
        setState(() {
          _isDownloading = false;
          _downloadProgress = null;
        });

        if (success && widget.updateManager.currentManifest != null) {
          // Show ready dialog
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (context) => UpdateReadyDialog(
              manifest: widget.updateManager.currentManifest!,
              onRestart: _restartApp,
              onLater: () => Navigator.of(context).pop(),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isDownloading = false;
          _downloadProgress = null;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          buildUpdateErrorSnackbar('Update failed: $e'),
        );
      }
    }
  }

  void _restartApp() {
    // In a real implementation, use restart_app package or similar
    // For now, just close dialogs
    Navigator.of(context).popUntil((route) => route.isFirst);

    // Show message
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        buildUpdateSuccessSnackbar('Please restart the app manually'),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_isDownloading && _downloadProgress != null)
          UpdateProgressOverlay(
            progress: _downloadProgress!,
            onCancel: () {
              setState(() {
                _isDownloading = false;
                _downloadProgress = null;
              });
            },
          ),
      ],
    );
  }
}
