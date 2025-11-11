# Plugin System Quick Start Guide

## Overview

Lumora's plugin system helps you manage third-party packages and check their compatibility with the framework.

## Quick Commands

### Check Package Compatibility

```bash
# Check a Flutter package
lumora install provider --framework flutter --check-only

# Check a React package
lumora install axios --framework react --check-only
```

### Install Package (with instructions)

```bash
# Get installation instructions for Flutter package
lumora install camera --framework flutter

# Get installation instructions for React package
lumora install react-query --framework react
```

### Analyze Project Dependencies

```bash
# Analyze current project
lumora packages

# Analyze specific project
lumora packages --path ./my-app
```

## Understanding the Output

### Compatibility Icons

- ✓ **Compatible**: Package is known to work with Lumora
- ⚠️  **Native Code**: Package requires native code (won't work in dev mode)
- ? **Unknown**: Compatibility is unknown (may or may not work)

### Example Output

```
📦 Checking package: camera
   Framework: flutter

✓ Package found: camera
  Compatible: ⚠️  Unknown
  Native code: ⚠️  Yes

⚠️  Warnings:
   Package "camera" contains native code and will not work in Lumora Go.
   Native packages are only available in production builds.

📚 Documentation: https://pub.dev/packages/camera
```

## Native Dependencies

### What are Native Dependencies?

Packages that use platform-specific code (Swift/Kotlin/Java/Objective-C) to access device features.

### Where They Work

- ✅ **Production Builds**: Full native code support
- ❌ **Lumora Go (Dev Mode)**: Native code not available

### Common Native Packages

**Flutter:**
- `camera` - Camera access
- `image_picker` - Photo picker
- `firebase_*` - Firebase services
- `google_maps_flutter` - Google Maps
- `location` - GPS location
- `permission_handler` - Permissions

**React:**
- `react-native-camera` - Camera access
- `react-native-maps` - Maps
- `@react-native-firebase/*` - Firebase
- `react-native-permissions` - Permissions

## Known Compatible Packages

### Flutter State Management

```bash
lumora install provider --framework flutter
lumora install riverpod --framework flutter
lumora install flutter_bloc --framework flutter
lumora install get --framework flutter
```

### Flutter Networking

```bash
lumora install dio --framework flutter
lumora install http --framework flutter
```

### React State Management

```bash
lumora install zustand --framework react
lumora install jotai --framework react
lumora install react-query --framework react
```

### React Networking

```bash
lumora install axios --framework react
lumora install swr --framework react
```

## Workflow

### 1. Check Compatibility First

```bash
lumora install <package> --framework <flutter|react> --check-only
```

### 2. Review Warnings

Pay attention to:
- Native dependency warnings
- Platform compatibility
- Unknown compatibility status

### 3. Install Package

Follow the installation instructions provided:

**Flutter:**
```bash
flutter pub add <package>
```

**React:**
```bash
npm install <package>
```

### 4. Use in Your Code

Import and use the package normally. Lumora will handle conversion.

### 5. Test in Dev Mode

Run your app in Lumora Go to verify it works in dev preview mode.

### 6. Build for Production

Generate production code with full native support:

```bash
lumora build
```

## Programmatic Usage

### Check Package Compatibility

```typescript
import { getPackageManager } from 'lumora-ir';

const manager = getPackageManager();
const info = manager.checkPackageCompatibility(
  'provider',
  '6.0.0',
  'flutter'
);

console.log('Compatible:', info.isLumoraCompatible);
console.log('Native:', info.hasNativeDependencies);
console.log('Warnings:', info.warnings);
```

### Register Custom Plugin

```typescript
import { getPluginRegistry } from 'lumora-ir';

const registry = getPluginRegistry();

const plugin = {
  metadata: {
    name: 'my-plugin',
    version: '1.0.0',
  },
  compatibility: {
    lumora: '^0.1.0',
  },
  capabilities: {
    widgets: [
      {
        name: 'CustomButton',
        type: 'component',
        framework: 'react',
      },
    ],
  },
  enabled: true,
};

const result = registry.register(plugin);
if (result.valid) {
  console.log('Plugin registered!');
}
```

### Analyze Project

```typescript
const analysis = manager.analyzeProject('./my-project');

console.log('Flutter packages:', analysis.flutter);
console.log('React packages:', analysis.react);
console.log('Warnings:', analysis.warnings);
```

## Best Practices

1. **Always check compatibility first** before installing packages
2. **Read warnings carefully** - they indicate important limitations
3. **Test in dev mode** to verify packages work without native code
4. **Use compatible packages** when possible for best dev experience
5. **Document native dependencies** in your project README

## Troubleshooting

### Package Not Found

```
✗ Error: Package not found
```

**Solution**: Check package name spelling and framework

### Native Code Warning

```
⚠️  Package contains native code
```

**Solution**: This is expected. Package will work in production builds only.

### Unknown Compatibility

```
? Unknown compatibility
```

**Solution**: Package may work. Test in dev mode to verify.

## Getting Help

- 📚 **Documentation**: Check package docs at pub.dev or npmjs.com
- 💬 **Community**: Ask in Lumora community channels
- 🐛 **Issues**: Report compatibility issues on GitHub

## Next Steps

1. Try checking a package: `lumora install provider --framework flutter --check-only`
2. Analyze your project: `lumora packages`
3. Read the full documentation: `packages/lumora_ir/src/registry/README.md`
