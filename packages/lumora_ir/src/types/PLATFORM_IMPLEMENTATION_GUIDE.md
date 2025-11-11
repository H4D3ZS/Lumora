# Platform Detection Implementation Guide

## Overview

This guide explains how to use the platform detection system in Lumora to write and generate platform-specific code for iOS, Android, Web, and desktop platforms.

## Components

### 1. Platform Types (`platform-types.ts`)

Defines the schema for platform-specific code:
- `PlatformCode` - Container for platform implementations
- `PlatformImplementation` - Code for specific platform(s)
- `CodeBlock` - Executable code with dependencies
- `PlatformSchema` - Complete platform configuration

### 2. Platform Parser (`platform-parser.ts`)

Extracts platform-specific code from source:
- `ReactPlatformParser` - Parses React/TypeScript platform checks
- `DartPlatformParser` - Parses Flutter/Dart platform checks

### 3. Platform Generator (`platform-generator.ts`)

Generates platform-specific code:
- `ReactPlatformGenerator` - Generates React/TypeScript code
- `DartPlatformGenerator` - Generates Flutter/Dart code
- `PlatformCodeGenerator` - Unified generator interface

### 4. Platform Manager (`platform_manager.dart`)

Runtime platform detection and execution (Flutter):
- Detects current platform
- Executes platform-specific code
- Handles fallbacks

## Usage Examples

### Writing Platform-Specific Code

#### React/TypeScript

```typescript
import { Platform } from 'react-native';

function MyComponent() {
  const handleAction = () => {
    if (Platform.OS === 'ios') {
      // iOS-specific implementation
      console.log('iOS action');
    } else if (Platform.OS === 'android') {
      // Android-specific implementation
      console.log('Android action');
    } else {
      // Fallback for other platforms
      console.log('Default action');
    }
  };

  return <Button onPress={handleAction}>Do Action</Button>;
}
```

#### Flutter/Dart

```dart
import 'dart:io' show Platform;

class MyWidget extends StatelessWidget {
  void handleAction() {
    if (Platform.isIOS) {
      // iOS-specific implementation
      print('iOS action');
    } else if (Platform.isAndroid) {
      // Android-specific implementation
      print('Android action');
    } else {
      // Fallback for other platforms
      print('Default action');
    }
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: handleAction,
      child: Text('Do Action'),
    );
  }
}
```

### Parsing Platform Code

#### Parse React Code

```typescript
import { ReactParser } from '@lumora/ir';

const parser = new ReactParser();
const ir = parser.parse(reactSource, 'MyComponent.tsx');

// Platform code is automatically extracted
if (ir.platform) {
  console.log('Found platform-specific code:');
  console.log(ir.platform.platformCode);
}
```

#### Parse Dart Code

```typescript
import { DartParser } from '@lumora/ir';

const parser = new DartParser();
const ir = parser.parse(dartSource, 'my_widget.dart');

// Platform code is automatically extracted
if (ir.platform) {
  console.log('Found platform-specific code:');
  console.log(ir.platform.platformCode);
}
```

### Generating Platform Code

#### Generate React Code

```typescript
import { ReactPlatformGenerator } from '@lumora/ir';

const generator = new ReactPlatformGenerator({
  addComments: true,
  includeFallback: true,
});

const code = generator.generateCode(ir.platform);
console.log(code);

// Output:
// if (Platform.OS === 'ios') {
//   console.log('iOS action');
// } else if (Platform.OS === 'android') {
//   console.log('Android action');
// } else {
//   console.log('Default action');
// }
```

#### Generate Dart Code

```typescript
import { DartPlatformGenerator } from '@lumora/ir';

const generator = new DartPlatformGenerator({
  addComments: true,
  includeFallback: true,
});

const code = generator.generateCode(ir.platform);
console.log(code);

// Output:
// if (Platform.isIOS) {
//   print('iOS action');
// } else if (Platform.isAndroid) {
//   print('Android action');
// } else {
//   print('Default action');
// }
```

### Runtime Platform Detection

#### In Flutter Dev Client

```dart
import 'package:flutter_dev_client/interpreter/platform_manager.dart';

final platformManager = PlatformManager();

// Get current platform
final platform = PlatformManager.getCurrentPlatform();
print('Running on: $platform'); // 'ios', 'android', etc.

// Check specific platform
if (PlatformManager.isPlatform('ios')) {
  print('This is iOS');
}

// Get platform capabilities
final capabilities = platformManager.getPlatformCapabilities();
print('Is mobile: ${capabilities['isMobile']}');
print('Supports native code: ${capabilities['supportsNativeCode']}');

// Get platform-specific value
final icon = platformManager.getPlatformValue({
  'ios': 'assets/icons/ios/icon.png',
  'android': 'assets/icons/android/icon.png',
}, fallback: 'assets/icons/default.png');
```

## Advanced Usage

### Optimizing for Target Platform

```typescript
import { PlatformCodeGenerator } from '@lumora/ir';

const generator = new PlatformCodeGenerator();

// Generate optimized code for specific platform
const optimizedCode = generator.generateOptimizedCode(
  ir.platform,
  'flutter',
  'ios' // Target platform
);

// This will only include iOS-specific code, removing other branches
```

### Custom Platform Conditions

```typescript
const platformCode: PlatformCode = {
  id: 'custom_check',
  implementations: [
    {
      platforms: ['ios'],
      code: {
        source: 'print("iOS 14+");',
        language: 'dart',
      },
      condition: 'Platform.isIOS && Platform.operatingSystemVersion >= "14.0"',
    },
  ],
  fallback: {
    source: 'print("Other platform");',
    language: 'dart',
  },
};
```

### Platform-Specific Assets

```typescript
const platformAsset: PlatformAsset = {
  id: 'app_icon',
  paths: {
    ios: 'assets/icons/ios/icon.png',
    android: 'assets/icons/android/icon.png',
    web: 'assets/icons/web/icon.png',
  },
  fallback: 'assets/icons/default.png',
};

// In Flutter runtime
final assetPath = platformManager.getPlatformAsset(platformAsset);
```

## Best Practices

### 1. Always Provide Fallbacks

```typescript
// ✅ Good - has fallback
if (Platform.OS === 'ios') {
  // iOS code
} else if (Platform.OS === 'android') {
  // Android code
} else {
  // Fallback for other platforms
}

// ❌ Bad - no fallback
if (Platform.OS === 'ios') {
  // iOS code
} else if (Platform.OS === 'android') {
  // Android code
}
// What happens on web?
```

### 2. Minimize Platform-Specific Code

```typescript
// ✅ Good - minimal platform code
const buttonStyle = Platform.OS === 'ios' 
  ? styles.iosButton 
  : styles.androidButton;

// ❌ Bad - too much platform-specific logic
if (Platform.OS === 'ios') {
  // 100 lines of iOS code
} else if (Platform.OS === 'android') {
  // 100 lines of Android code
}
```

### 3. Document Platform Requirements

```typescript
const platformCode: PlatformCode = {
  id: 'camera_access',
  implementations: [
    {
      platforms: ['ios'],
      code: {
        source: '// iOS camera code',
        language: 'dart',
        dependencies: ['image_picker'],
      },
    },
  ],
  metadata: {
    description: 'Camera access requires platform-specific permissions',
    warnings: [
      'iOS: Add NSCameraUsageDescription to Info.plist',
      'Android: Add CAMERA permission to AndroidManifest.xml',
    ],
  },
};
```

### 4. Test on All Platforms

Always test your platform-specific code on:
- iOS (physical device and simulator)
- Android (physical device and emulator)
- Web (if applicable)
- Desktop platforms (if applicable)

## Limitations

### Runtime Interpreter

The Flutter dev client cannot execute arbitrary Dart code at runtime. Platform-specific code in the interpreter:
- Can detect the current platform
- Can select appropriate values/assets
- Cannot execute dynamic Dart code

For full platform-specific functionality, generate production code.

### Code Generation

Generated code includes all platform checks. For production optimization:
- Use tree-shaking to remove unused platform code
- Generate platform-specific builds
- Use conditional compilation where possible

## Troubleshooting

### Platform Not Detected

```dart
// Check platform capabilities
final capabilities = platformManager.getPlatformCapabilities();
print(capabilities);

// Verify platform detection
print('Current platform: ${PlatformManager.getCurrentPlatform()}');
```

### Missing Fallback Warning

```typescript
// The parser will warn if no fallback is provided
const result = parser.extractPlatformCode(ast, source);
console.log('Warnings:', result.warnings);
```

### Platform Code Not Generated

```typescript
// Check if platform schema exists
if (!ir.platform) {
  console.log('No platform-specific code found');
}

// Verify platform code is valid
const isValid = platformManager.validatePlatformCode(platformCode);
console.log('Valid:', isValid);
```

## Integration with Other Features

### With State Management

```typescript
if (Platform.OS === 'ios') {
  setState({ value: getIOSValue() });
} else {
  setState({ value: getAndroidValue() });
}
```

### With Navigation

```typescript
if (Platform.OS === 'ios') {
  navigation.push('Screen', { transition: 'cupertino' });
} else {
  navigation.push('Screen', { transition: 'material' });
}
```

### With Network

```typescript
const baseURL = Platform.OS === 'web'
  ? 'https://api.example.com' // CORS-enabled
  : 'https://api-mobile.example.com'; // Mobile-optimized
```

## Future Enhancements

- Platform capability detection (camera, GPS, etc.)
- Platform-specific styling and theming
- Platform-specific performance optimizations
- Platform-specific accessibility features
- Automatic platform-specific code suggestions

## Related Documentation

- [Platform Schema](./PLATFORM_SCHEMA.md)
- [Platform Types](./platform-types.ts)
- [Platform Parser](../parsers/platform-parser.ts)
- [Platform Generator](../parsers/platform-generator.ts)
- [Platform Manager](../../../apps/flutter-dev-client/lib/interpreter/platform_manager.dart)
