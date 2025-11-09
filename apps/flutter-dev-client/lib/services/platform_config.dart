import 'dart:io';

/// Platform-specific configuration for WebSocket URLs
/// Handles different connection URLs for Android emulator, iOS simulator, and physical devices
class PlatformConfig {
  // Default WebSocket URLs for different platforms
  static const String _androidEmulatorUrl = 'ws://10.0.2.2:3000/ws';
  static const String _defaultUrl = 'ws://localhost:3000/ws';
  
  /// Gets the appropriate WebSocket URL based on the platform
  /// 
  /// - Android emulator: ws://10.0.2.2:3000/ws (special IP for host machine)
  /// - iOS simulator: ws://localhost:3000/ws
  /// - Physical devices: Use custom URL provided by user (LAN IP)
  /// 
  /// [customUrl] Optional custom WebSocket URL for physical devices or custom configurations
  static String getWebSocketUrl({String? customUrl}) {
    // If custom URL is provided, use it (for physical devices or custom setups)
    if (customUrl != null && customUrl.isNotEmpty) {
      return customUrl;
    }
    
    // Platform-specific defaults
    if (Platform.isAndroid) {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      return _androidEmulatorUrl;
    } else if (Platform.isIOS) {
      // iOS simulator can use localhost directly
      return _defaultUrl;
    }
    
    // Fallback to default
    return _defaultUrl;
  }
  
  /// Validates if a WebSocket URL is properly formatted
  static bool isValidWebSocketUrl(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.scheme == 'ws' || uri.scheme == 'wss';
    } catch (e) {
      return false;
    }
  }
  
  /// Gets platform name for debugging
  static String getPlatformName() {
    if (Platform.isAndroid) {
      return 'Android';
    } else if (Platform.isIOS) {
      return 'iOS';
    } else if (Platform.isMacOS) {
      return 'macOS';
    } else if (Platform.isWindows) {
      return 'Windows';
    } else if (Platform.isLinux) {
      return 'Linux';
    }
    return 'Unknown';
  }
  
  /// Checks if running on an emulator/simulator (best effort detection)
  static bool isEmulator() {
    // This is a simplified check - in production you might want more sophisticated detection
    if (Platform.isAndroid) {
      // Android emulators typically have specific characteristics
      // This is a basic check - more sophisticated detection would require platform channels
      return true; // Assume emulator for now
    } else if (Platform.isIOS) {
      // iOS simulators can be detected via platform channels
      return true; // Assume simulator for now
    }
    return false;
  }
}
