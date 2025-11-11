# Platform Detection Quick Reference

## Quick Start

### Detect Platform in React
```typescript
if (Platform.OS === 'ios') {
  // iOS code
} else if (Platform.OS === 'android') {
  // Android code
} else {
  // Fallback
}
```

### Detect Platform in Flutter
```dart
if (Platform.isIOS) {
  // iOS code
} else if (Platform.isAndroid) {
  // Android code
} else {
  // Fallback
}
```

## Parsing

### Parse React Code
```typescript
import { ReactParser } from '@lumora/ir';

const parser = new ReactParser();
const ir = parser.parse(source, 'file.tsx');

// Platform code automatically extracted
if (ir.platform) {
  console.log(ir.platform.platformCode);
}
```

### Parse Dart Code
```typescript
import { DartParser } from '@lumora/ir';

const parser = new DartParser();
const ir = parser.parse(source, 'file.dart');

// Platform code automatically extracted
if (ir.platform) {
  console.log(ir.platform.platformCode);
}
```

## Code Generation

### Generate React Code
```typescript
import { ReactPlatformGenerator } from '@lumora/ir';

const generator = new ReactPlatformGenerator();
const code = generator.generateCode(ir.platform);
```

### Generate Flutter Code
```typescript
import { DartPlatformGenerator } from '@lumora/ir';

const generator = new DartPlatformGenerator();
const code = generator.generateCode(ir.platform);
```

### Unified Generator
```typescript
import { PlatformCodeGenerator } from '@lumora/ir';

const generator = new PlatformCodeGenerator();

// Generate for React
const reactCode = generator.generateCode(ir.platform, 'react');

// Generate for Flutter
const flutterCode = generator.generateCode(ir.platform, 'flutter');
```

## Runtime Detection

### Get Current Platform
```dart
import 'package:flutter_dev_client/interpreter/platform_manager.dart';

final platform = PlatformManager.getCurrentPlatform();
// Returns: 'ios', 'android', 'web', etc.
```

### Check Specific Platform
```dart
if (PlatformManager.isPlatform('ios')) {
  print('Running on iOS');
}
```

### Get Platform Value
```dart
final platformManager = PlatformManager();

final icon = platformManager.getPlatformValue({
  'ios': 'assets/icons/ios.png',
  'android': 'assets/icons/android.png',
}, fallback: 'assets/icons/default.png');
```

### Get Platform Capabilities
```dart
final capabilities = platformManager.getPlatformCapabilities();
print('Is mobile: ${capabilities['isMobile']}');
print('Platform: ${capabilities['platform']}');
```

## Optimization

### Optimize for Target Platform
```typescript
const generator = new PlatformCodeGenerator();

// Remove unused platform branches
const optimized = generator.optimizeForPlatform(
  ir.platform,
  'ios' // Target platform
);

// Generate optimized code
const code = generator.generateOptimizedCode(
  ir.platform,
  'flutter',
  'ios'
);
```

## Common Patterns

### Platform-Specific Styling
```typescript
const buttonStyle = Platform.OS === 'ios' 
  ? styles.iosButton 
  : styles.androidButton;
```

### Platform-Specific Navigation
```typescript
if (Platform.OS === 'ios') {
  navigation.push('Screen', { transition: 'cupertino' });
} else {
  navigation.push('Screen', { transition: 'material' });
}
```

### Platform-Specific API
```typescript
const baseURL = Platform.OS === 'web'
  ? 'https://api.example.com'
  : 'https://api-mobile.example.com';
```

## Supported Platforms

- `ios` - iOS devices
- `android` - Android devices
- `web` - Web browsers
- `macos` - macOS desktop
- `windows` - Windows desktop
- `linux` - Linux desktop

## Configuration

```typescript
const generator = new ReactPlatformGenerator({
  includeFallback: true,    // Include else blocks
  addComments: true,        // Add explanatory comments
  indent: '  ',            // Indentation string
});
```

## Warnings

The parser will warn about:
- Missing fallback implementations
- Unknown platform types
- Platform-specific dependencies

```typescript
const result = platformParser.extractPlatformCode(ast, source);
console.log('Warnings:', result.warnings);
```

## Best Practices

✅ **DO:**
- Always provide fallback implementations
- Minimize platform-specific code
- Document why platform code is needed
- Test on all target platforms

❌ **DON'T:**
- Write large platform-specific blocks
- Forget fallback implementations
- Use platform code for simple styling
- Ignore platform warnings

## Troubleshooting

### Platform Not Detected
```dart
// Check current platform
print(PlatformManager.getCurrentPlatform());

// Check capabilities
print(platformManager.getPlatformCapabilities());
```

### Code Not Generated
```typescript
// Verify platform schema exists
if (!ir.platform) {
  console.log('No platform code found');
}

// Check platform code is valid
const isValid = platformManager.validatePlatformCode(platformCode);
```

### Missing Imports
```typescript
// Generate required imports
const imports = generator.generateImports(ir.platform);
console.log(imports);
```

## Examples

### Complete React Example
```typescript
import { Platform } from 'react-native';

function CameraButton() {
  const openCamera = () => {
    if (Platform.OS === 'ios') {
      // iOS camera API
      IOSCamera.open();
    } else if (Platform.OS === 'android') {
      // Android camera API
      AndroidCamera.open();
    } else {
      // Web fallback - file input
      alert('Camera not available on web');
    }
  };

  return <Button onPress={openCamera}>Open Camera</Button>;
}
```

### Complete Flutter Example
```dart
import 'dart:io' show Platform;

class CameraButton extends StatelessWidget {
  void openCamera() {
    if (Platform.isIOS) {
      // iOS camera API
      IOSCamera.open();
    } else if (Platform.isAndroid) {
      // Android camera API
      AndroidCamera.open();
    } else {
      // Desktop fallback
      print('Camera not available on desktop');
    }
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: openCamera,
      child: Text('Open Camera'),
    );
  }
}
```

## Related Documentation

- [Platform Schema](./PLATFORM_SCHEMA.md) - Complete schema documentation
- [Implementation Guide](./PLATFORM_IMPLEMENTATION_GUIDE.md) - Detailed implementation guide
- [Platform Types](./platform-types.ts) - Type definitions
- [Platform Parser](../parsers/platform-parser.ts) - Parser implementation
- [Platform Generator](../parsers/platform-generator.ts) - Generator implementation
