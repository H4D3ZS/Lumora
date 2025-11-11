# QR Code System Implementation

## Overview

The QR code system enables seamless device connection to the Lumora development server. Users can scan a QR code displayed in the terminal to automatically connect their mobile device to the dev server without manual configuration.

## Architecture

### CLI Side (QR Code Generation)

**Location**: `packages/lumora-cli/src/services/dev-proxy-server.ts`

The CLI generates QR codes containing WebSocket connection information:

```typescript
displayQRCode(sessionId: string) {
  const networkIP = this.getNetworkIP();
  const wsUrl = `ws://${networkIP}:${this.config.port}/ws?session=${sessionId}`;
  
  // Generate and display QR code
  qrcode.generate(wsUrl, { small: true });
}
```

**Features**:
- Automatically detects network IP address
- Generates QR code with WebSocket URL and session ID
- Displays connection instructions
- Shows both network and localhost URLs
- Includes session expiration time

**QR Code Format**:
```
ws://[host]:[port]/ws?session=[sessionId]
```

Example:
```
ws://192.168.1.100:3000/ws?session=abc123-def456-ghi789
```

### Flutter Side (QR Code Scanning)

**Location**: `apps/flutter-dev-client/lib/widgets/qr_scanner_screen.dart`

The Flutter app uses the `mobile_scanner` package to scan QR codes:

**Features**:
- Real-time QR code scanning with camera
- Visual scanning frame overlay
- Torch/flashlight toggle
- Error handling and validation
- Automatic connection after successful scan

**QR Code Parsing**:
```dart
Map<String, String>? _parseQRData(String data) {
  final uri = Uri.parse(data);
  
  // Validate WebSocket scheme
  if (uri.scheme != 'ws' && uri.scheme != 'wss') {
    return null;
  }
  
  // Extract session ID
  final sessionId = uri.queryParameters['session'];
  if (sessionId == null || sessionId.isEmpty) {
    return null;
  }
  
  return {
    'wsUrl': '${uri.scheme}://${uri.host}:${uri.port}${uri.path}',
    'sessionId': sessionId,
  };
}
```

## User Flow

### 1. Start Development Server

```bash
cd packages/lumora-cli
npm start -- --qr
```

The CLI displays:
```
📱 Scan this QR code with Lumora Dev Client:

█████████████████████████████████
█████████████████████████████████
███ ▄▄▄▄▄ █▀█ █▄▄▀▄█ ▄▄▄▄▄ ███
███ █   █ █▀▀▀█ ▀ ▄█ █   █ ███
███ █▄▄▄█ █▀ █▀▀█▀▄█ █▄▄▄█ ███
...

Session ID: abc123-def456-ghi789
Network URL: ws://192.168.1.100:3000/ws?session=abc123-def456-ghi789
Localhost URL: ws://localhost:3000/ws?session=abc123-def456-ghi789
Expires: 11/11/2025, 10:30:00 PM

📋 Connection Instructions:
   1. Open Lumora Dev Client on your mobile device
   2. Tap "Scan QR Code" button
   3. Point your camera at the QR code above
   4. Wait for connection confirmation
   
   Note: Ensure your device is on the same network as this computer
   Network IP: 192.168.1.100
```

### 2. Open Flutter App

Launch the Lumora Dev Client app on your mobile device.

### 3. Scan QR Code

1. Tap the "Scan QR Code" button
2. Grant camera permissions if prompted
3. Point camera at the QR code in the terminal
4. Wait for automatic connection

### 4. Connected

Once scanned, the app:
- Extracts WebSocket URL and session ID
- Displays success message
- Automatically connects to the dev server
- Waits for schema updates

## Implementation Details

### Dependencies

**CLI**:
- `qrcode-terminal`: ASCII QR code generation for terminal display
- `os`: Network interface detection

**Flutter**:
- `mobile_scanner: ^3.5.5`: QR code scanning with camera

### Permissions

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
```

**iOS** (`ios/Runner/Info.plist`):
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required to scan QR codes for connecting to the development server.</string>
```

### Network IP Detection

The CLI automatically detects the local network IP address:

```typescript
private getNetworkIP(): string {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }
  
  return 'localhost';
}
```

This ensures the QR code contains the correct IP address for devices on the same network.

### Error Handling

**Invalid QR Code**:
- Non-WebSocket URLs are rejected
- Missing session IDs are rejected
- Error messages displayed for 3 seconds

**Camera Permissions**:
- App requests permissions on first use
- Clear error messages if denied
- Instructions to enable in settings

**Connection Failures**:
- Retry dialog with countdown
- Manual reconnection option
- Clear error messages

## Testing

### Unit Tests

Location: `apps/flutter-dev-client/test/qr_scanner_test.dart`

Tests cover:
- Valid WebSocket URL parsing
- Session ID extraction
- Localhost URLs
- Secure WebSocket (wss://) URLs
- Invalid URL handling
- Missing session parameters

Run tests:
```bash
cd apps/flutter-dev-client
flutter test test/qr_scanner_test.dart
```

### Manual Testing

1. **Local Network Connection**:
   - Start dev server on computer
   - Connect phone to same WiFi network
   - Scan QR code
   - Verify connection

2. **Emulator Connection**:
   - Use `ws://10.0.2.2:3000/ws?session=...` for Android emulator
   - Use `ws://localhost:3000/ws?session=...` for iOS simulator

3. **Error Cases**:
   - Scan invalid QR code
   - Scan QR code without session ID
   - Deny camera permissions
   - Test with server offline

## Troubleshooting

### QR Code Not Scanning

**Problem**: Camera doesn't detect QR code

**Solutions**:
- Ensure good lighting
- Hold phone steady
- Adjust distance from screen
- Use torch/flashlight toggle
- Try different screen brightness

### Connection Failed After Scan

**Problem**: QR code scans but connection fails

**Solutions**:
- Verify device is on same network as computer
- Check firewall settings (allow port 3000)
- Verify dev server is running
- Check network IP in terminal matches device network

### Camera Permission Denied

**Problem**: App can't access camera

**Solutions**:
- Go to device Settings > Apps > Lumora Dev Client > Permissions
- Enable Camera permission
- Restart app

### Android Emulator Connection

**Problem**: Emulator can't connect to localhost

**Solution**: Use special IP address `10.0.2.2` instead of `localhost`:
```
ws://10.0.2.2:3000/ws?session=...
```

## Future Enhancements

- [ ] Support for custom QR code formats
- [ ] QR code history/favorites
- [ ] Manual URL entry as fallback
- [ ] NFC connection as alternative
- [ ] Deep linking support
- [ ] QR code sharing via image/file

## Requirements Satisfied

This implementation satisfies requirement 14.1 from the design document:

✅ **14.1 Generate QR codes (CLI)**:
- Creates QR code with connection URL
- Includes session ID
- Displays in terminal
- Shows connection instructions

✅ **14.2 Scan QR codes (Lumora Go)**:
- Integrates QR scanner
- Parses QR code data
- Extracts connection URL
- Extracts session ID
