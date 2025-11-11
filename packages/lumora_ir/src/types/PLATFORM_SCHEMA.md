# Platform-Specific Code Schema

## Overview

The Platform Schema enables Lumora to handle platform-specific code for iOS, Android, Web, and desktop platforms. This allows developers to write conditional code that executes only on specific platforms while providing fallback implementations.

## Schema Structure

### PlatformCode

Represents a block of platform-specific code with implementations for different platforms.

```typescript
interface PlatformCode {
  id: string;
  implementations: PlatformImplementation[];
  fallback?: CodeBlock;
  metadata?: PlatformCodeMetadata;
}
```

**Example:**

```json
{
  "id": "camera_access",
  "implementations": [
    {
      "platforms": ["ios"],
      "code": {
        "source": "import UIKit; // iOS camera code",
        "language": "dart",
        "dependencies": ["image_picker"]
      }
    },
    {
      "platforms": ["android"],
      "code": {
        "source": "// Android camera code",
        "language": "dart",
        "dependencies": ["image_picker"]
      }
    }
  ],
  "fallback": {
    "source": "// Web fallback - file input",
    "language": "dart"
  }
}
```

### PlatformImplementation

Defines code for specific platform(s).

```typescript
interface PlatformImplementation {
  platforms: PlatformType[];
  code: CodeBlock;
  condition?: string;
}
```

### CodeBlock

Represents executable code with its dependencies.

```typescript
interface CodeBlock {
  source: string;
  language: 'dart' | 'typescript' | 'javascript';
  dependencies?: string[];
  imports?: string[];
}
```

## Platform Types

Supported platforms:
- `ios` - iOS devices
- `android` - Android devices
- `web` - Web browsers
- `macos` - macOS desktop
- `windows` - Windows desktop
- `linux` - Linux desktop

## Usage Examples

### React/TypeScript

```typescript
// Platform-specific code in React
function MyComponent() {
  const handleAction = () => {
    if (Platform.OS === 'ios') {
      // iOS-specific code
      console.log('Running on iOS');
    } else if (Platform.OS === 'android') {
      // Android-specific code
      console.log('Running on Android');
    } else {
      // Fallback for other platforms
      console.log('Running on other platform');
    }
  };
  
  return <Button onPress={handleAction}>Do Action</Button>;
}
```

### Flutter/Dart

```dart
// Platform-specific code in Flutter
import 'dart:io' show Platform;

class MyWidget extends StatelessWidget {
  void handleAction() {
    if (Platform.isIOS) {
      // iOS-specific code
      print('Running on iOS');
    } else if (Platform.isAndroid) {
      // Android-specific code
      print('Running on Android');
    } else {
      // Fallback for other platforms
      print('Running on other platform');
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

## Conversion to Lumora IR

Both React and Flutter platform checks are converted to the same platform schema:

```json
{
  "platform": {
    "platformCode": [
      {
        "id": "handleAction_platform_check",
        "implementations": [
          {
            "platforms": ["ios"],
            "code": {
              "source": "print('Running on iOS');",
              "language": "dart"
            }
          },
          {
            "platforms": ["android"],
            "code": {
              "source": "print('Running on Android');",
              "language": "dart"
            }
          }
        ],
        "fallback": {
          "source": "print('Running on other platform');",
          "language": "dart"
        }
      }
    ]
  }
}
```

## Code Generation

### Generating Flutter Code

```dart
// Generated Dart code
void handleAction() {
  if (Platform.isIOS) {
    print('Running on iOS');
  } else if (Platform.isAndroid) {
    print('Running on Android');
  } else {
    print('Running on other platform');
  }
}
```

### Generating React Code

```typescript
// Generated TypeScript code
const handleAction = () => {
  if (Platform.OS === 'ios') {
    console.log('Running on iOS');
  } else if (Platform.OS === 'android') {
    console.log('Running on Android');
  } else {
    console.log('Running on other platform');
  }
};
```

## Platform Detection Configuration

```typescript
interface PlatformDetectionConfig {
  targetPlatform?: PlatformType;
  includeFallback: boolean;
  warnOnPlatformCode: boolean;
  stripUnsupportedPlatforms: boolean;
}
```

**Example Configuration:**

```json
{
  "config": {
    "targetPlatform": "ios",
    "includeFallback": true,
    "warnOnPlatformCode": true,
    "stripUnsupportedPlatforms": false
  }
}
```

## Warnings and Best Practices

### Warnings

The system will warn about:
- Platform-specific dependencies that may not be available in Lumora Go
- Platform checks without fallback implementations
- Unsupported platform types

### Best Practices

1. **Always provide fallbacks**: Ensure your app works on all platforms
2. **Minimize platform-specific code**: Use cross-platform solutions when possible
3. **Document platform requirements**: Add metadata describing why platform-specific code is needed
4. **Test on all platforms**: Verify behavior on iOS, Android, and Web

## Platform Assets

Platform-specific assets can also be defined:

```typescript
interface PlatformAsset {
  id: string;
  paths: Record<PlatformType, string>;
  fallback?: string;
}
```

**Example:**

```json
{
  "platformAssets": [
    {
      "id": "app_icon",
      "paths": {
        "ios": "assets/icons/ios/icon.png",
        "android": "assets/icons/android/icon.png",
        "web": "assets/icons/web/icon.png"
      },
      "fallback": "assets/icons/default.png"
    }
  ]
}
```

## Runtime Behavior

### In Lumora Go (Development)

Platform-specific code is interpreted at runtime based on the actual device platform. The interpreter:
1. Detects the current platform
2. Executes the matching platform implementation
3. Falls back to default implementation if no match

### In Production (Generated Code)

Platform checks are preserved in the generated code, allowing the native platform APIs to determine behavior at runtime.

## Integration with Other Features

### With State Management

Platform-specific code can access and modify state:

```json
{
  "implementations": [
    {
      "platforms": ["ios"],
      "code": {
        "source": "setState(() { _value = getIOSValue(); });",
        "language": "dart"
      }
    }
  ]
}
```

### With Navigation

Platform-specific navigation behavior:

```json
{
  "implementations": [
    {
      "platforms": ["ios"],
      "code": {
        "source": "Navigator.pushCupertino(context, route);",
        "language": "dart"
      }
    },
    {
      "platforms": ["android"],
      "code": {
        "source": "Navigator.pushMaterial(context, route);",
        "language": "dart"
      }
    }
  ]
}
```

### With Network

Platform-specific network configurations:

```json
{
  "implementations": [
    {
      "platforms": ["web"],
      "code": {
        "source": "// Use CORS-enabled endpoint",
        "language": "dart"
      }
    }
  ]
}
```

## Error Handling

Platform-specific errors are handled gracefully:

```typescript
try {
  executePlatformCode(platformCode);
} catch (error) {
  if (platformCode.fallback) {
    executeFallback(platformCode.fallback);
  } else {
    throw new PlatformError(`No implementation for ${currentPlatform}`);
  }
}
```

## Future Enhancements

- Platform capability detection (camera, GPS, etc.)
- Platform-specific styling and theming
- Platform-specific performance optimizations
- Platform-specific accessibility features
