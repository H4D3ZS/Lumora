/**
 * OTA Update Manager - Client-side update handler
 * Checks for, downloads, and installs over-the-air updates
 */

import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
import 'package:crypto/crypto.dart';

/// Update check result
class UpdateCheckResult {
  final bool updateAvailable;
  final String? updateId;
  final String? manifestUrl;
  final bool isRollback;
  final String directive;

  UpdateCheckResult({
    required this.updateAvailable,
    this.updateId,
    this.manifestUrl,
    this.isRollback = false,
    this.directive = 'no_update_available',
  });

  factory UpdateCheckResult.fromJson(Map<String, dynamic> json) {
    return UpdateCheckResult(
      updateAvailable: json['directive'] == 'normal',
      updateId: json['updateId'],
      manifestUrl: json['manifestUrl'],
      isRollback: json['isRollBackToEmbedded'] ?? false,
      directive: json['directive'] ?? 'no_update_available',
    );
  }
}

/// Update manifest
class UpdateManifest {
  final String id;
  final String version;
  final String channel;
  final String platform;
  final List<UpdateAsset> assets;
  final Map<String, dynamic> metadata;
  final String checksum;
  final int size;
  final String runtimeVersion;

  UpdateManifest({
    required this.id,
    required this.version,
    required this.channel,
    required this.platform,
    required this.assets,
    required this.metadata,
    required this.checksum,
    required this.size,
    required this.runtimeVersion,
  });

  factory UpdateManifest.fromJson(Map<String, dynamic> json) {
    return UpdateManifest(
      id: json['id'],
      version: json['version'],
      channel: json['channel'],
      platform: json['platform'],
      assets: (json['assets'] as List)
          .map((a) => UpdateAsset.fromJson(a))
          .toList(),
      metadata: json['metadata'] ?? {},
      checksum: json['checksum'],
      size: json['size'],
      runtimeVersion: json['runtimeVersion'],
    );
  }
}

/// Update asset
class UpdateAsset {
  final String key;
  final String url;
  final String hash;
  final int size;
  final String contentType;

  UpdateAsset({
    required this.key,
    required this.url,
    required this.hash,
    required this.size,
    required this.contentType,
  });

  factory UpdateAsset.fromJson(Map<String, dynamic> json) {
    return UpdateAsset(
      key: json['key'],
      url: json['url'],
      hash: json['hash'],
      size: json['size'],
      contentType: json['contentType'],
    );
  }
}

/// Update download progress
class UpdateProgress {
  final int downloaded;
  final int total;
  final double percentage;
  final String status;

  UpdateProgress({
    required this.downloaded,
    required this.total,
    required this.percentage,
    required this.status,
  });

  double get progress => percentage / 100.0;
}

/// OTA Update Manager
class OTAUpdateManager {
  final String serverUrl;
  final String projectId;
  final String channel;
  final String runtimeVersion;

  // Update state
  String? _currentUpdateId;
  UpdateManifest? _currentManifest;
  bool _isChecking = false;
  bool _isDownloading = false;

  // Callbacks
  final Function(UpdateCheckResult)? onUpdateAvailable;
  final Function(UpdateProgress)? onDownloadProgress;
  final Function(UpdateManifest)? onUpdateReady;
  final Function(String)? onError;

  OTAUpdateManager({
    required this.serverUrl,
    required this.projectId,
    required this.channel,
    required this.runtimeVersion,
    this.onUpdateAvailable,
    this.onDownloadProgress,
    this.onUpdateReady,
    this.onError,
  });

  /// Check for available updates
  Future<UpdateCheckResult> checkForUpdate() async {
    if (_isChecking) {
      throw Exception('Update check already in progress');
    }

    _isChecking = true;

    try {
      final prefs = await SharedPreferences.getInstance();
      final deviceId = prefs.getString('device_id') ?? 'unknown';
      final currentUpdateId = prefs.getString('current_update_id');

      // Request update check
      final response = await http.post(
        Uri.parse('$serverUrl/api/v1/updates/check'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'projectId': projectId,
          'runtimeVersion': runtimeVersion,
          'platform': Platform.isIOS ? 'ios' : 'android',
          'channel': channel,
          'currentUpdateId': currentUpdateId,
          'deviceId': deviceId,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('Update check failed: ${response.statusCode}');
      }

      final result = UpdateCheckResult.fromJson(jsonDecode(response.body));

      if (result.updateAvailable) {
        onUpdateAvailable?.call(result);
      }

      return result;
    } catch (e) {
      debugPrint('Update check error: $e');
      onError?.call('Update check failed: $e');
      rethrow;
    } finally {
      _isChecking = false;
    }
  }

  /// Download and install update
  Future<bool> downloadAndInstallUpdate(UpdateCheckResult updateCheck) async {
    if (_isDownloading) {
      throw Exception('Download already in progress');
    }

    if (!updateCheck.updateAvailable || updateCheck.manifestUrl == null) {
      return false;
    }

    _isDownloading = true;

    try {
      // Fetch manifest
      final manifestUrl = serverUrl + updateCheck.manifestUrl!;
      final manifestResponse = await http.get(Uri.parse(manifestUrl));

      if (manifestResponse.statusCode != 200) {
        throw Exception('Failed to fetch manifest');
      }

      final manifest = UpdateManifest.fromJson(
        jsonDecode(manifestResponse.body),
      );

      _currentManifest = manifest;

      // Download assets
      final updateDir = await _getUpdateDirectory(manifest.id);
      await updateDir.create(recursive: true);

      int totalSize = manifest.size;
      int downloadedSize = 0;

      for (final asset in manifest.assets) {
        // Notify progress
        onDownloadProgress?.call(UpdateProgress(
          downloaded: downloadedSize,
          total: totalSize,
          percentage: (downloadedSize / totalSize * 100),
          status: 'Downloading ${asset.key}...',
        ));

        // Download asset
        final assetUrl = serverUrl + asset.url;
        final assetResponse = await http.get(Uri.parse(assetUrl));

        if (assetResponse.statusCode != 200) {
          throw Exception('Failed to download asset: ${asset.key}');
        }

        // Verify hash
        final hash = sha256.convert(assetResponse.bodyBytes).toString();
        if (hash != asset.hash) {
          throw Exception('Asset hash mismatch: ${asset.key}');
        }

        // Save asset
        final assetFile = File('${updateDir.path}/${asset.key}');
        await assetFile.parent.create(recursive: true);
        await assetFile.writeAsBytes(assetResponse.bodyBytes);

        downloadedSize += asset.size;
      }

      // Save manifest
      final manifestFile = File('${updateDir.path}/manifest.json');
      await manifestFile.writeAsString(jsonEncode(manifest));

      // Mark as current update
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('current_update_id', manifest.id);
      await prefs.setString('current_update_version', manifest.version);

      _currentUpdateId = manifest.id;

      // Notify ready
      onUpdateReady?.call(manifest);

      debugPrint('✅ Update downloaded and installed: ${manifest.version}');
      return true;
    } catch (e) {
      debugPrint('Download error: $e');
      onError?.call('Download failed: $e');

      // Cleanup failed download
      if (_currentManifest != null) {
        try {
          final updateDir = await _getUpdateDirectory(_currentManifest!.id);
          if (await updateDir.exists()) {
            await updateDir.delete(recursive: true);
          }
        } catch (_) {}
      }

      return false;
    } finally {
      _isDownloading = false;
    }
  }

  /// Apply downloaded update (requires app restart)
  Future<void> applyUpdate() async {
    if (_currentManifest == null) {
      throw Exception('No update to apply');
    }

    // Mark update as applied
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('pending_update_id', _currentManifest!.id);
    await prefs.setBool('should_apply_update', true);

    debugPrint('Update marked for application on next launch');
  }

  /// Rollback to previous version
  Future<void> rollback() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final previousUpdateId = prefs.getString('previous_update_id');

      if (previousUpdateId != null) {
        // Restore previous update
        _currentUpdateId = previousUpdateId;
        await prefs.setString('current_update_id', previousUpdateId);
        await prefs.remove('previous_update_id');

        debugPrint('✅ Rolled back to: $previousUpdateId');
      } else {
        // Rollback to embedded version
        await prefs.remove('current_update_id');
        await prefs.remove('current_update_version');
        _currentUpdateId = null;

        debugPrint('✅ Rolled back to embedded version');
      }
    } catch (e) {
      debugPrint('Rollback error: $e');
      onError?.call('Rollback failed: $e');
      rethrow;
    }
  }

  /// Clear all downloaded updates
  Future<void> clearUpdates() async {
    try {
      final baseDir = await _getUpdatesBaseDirectory();
      if (await baseDir.exists()) {
        await baseDir.delete(recursive: true);
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('current_update_id');
      await prefs.remove('current_update_version');
      await prefs.remove('previous_update_id');
      await prefs.remove('pending_update_id');

      _currentUpdateId = null;
      _currentManifest = null;

      debugPrint('✅ All updates cleared');
    } catch (e) {
      debugPrint('Clear updates error: $e');
      rethrow;
    }
  }

  /// Get current update info
  Future<Map<String, String?>> getCurrentUpdateInfo() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'updateId': prefs.getString('current_update_id'),
      'version': prefs.getString('current_update_version'),
      'channel': channel,
    };
  }

  // Helper: Get updates base directory
  Future<Directory> _getUpdatesBaseDirectory() async {
    final appDir = await getApplicationDocumentsDirectory();
    return Directory('${appDir.path}/lumora_updates');
  }

  // Helper: Get update-specific directory
  Future<Directory> _getUpdateDirectory(String updateId) async {
    final baseDir = await _getUpdatesBaseDirectory();
    return Directory('${baseDir.path}/$updateId');
  }

  // Getters
  bool get isChecking => _isChecking;
  bool get isDownloading => _isDownloading;
  String? get currentUpdateId => _currentUpdateId;
  UpdateManifest? get currentManifest => _currentManifest;
}
