# Plugin and Package Management System

This directory contains the plugin registry and package management system for Lumora.

## Overview

The plugin system allows Lumora to:
- Register and manage third-party plugins
- Check package compatibility with Lumora
- Parse and validate dependencies from `pubspec.yaml` and `package.json`
- Warn about native dependencies that won't work in dev preview mode
- Provide documentation links for packages

## Components

### PluginRegistry

Manages plugin registration, compatibility checking, and dependency resolution.

```typescript
import { getPluginRegistry, Plugin } from 'lumora-ir';

const registry = getPluginRegistry();

// Register a plugin
const plugin: Plugin = {
  metadata: {
    name: 'my-plugin',
    version: '1.0.0',
    description: 'A custom plugin',
  },
  compatibility: {
    lumora: '^0.1.0',
    platforms: ['ios', 'android', 'web'],
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
  console.log('Plugin registered successfully');
} else {
  console.error('Validation errors:', result.errors);
}
```

### PackageManager

Parses and validates packages from Flutter and React projects.

```typescript
import { getPackageManager } from 'lumora-ir';

const manager = getPackageManager();

// Check package compatibility
const packageInfo = manager.checkPackageCompatibility(
  'provider',
  '6.0.0',
  'flutter'
);

console.log('Compatible:', packageInfo.isLumoraCompatible);
console.log('Native code:', packageInfo.hasNativeDependencies);
console.log('Warnings:', packageInfo.warnings);

// Parse project dependencies
const analysis = manager.analyzeProject('./my-project');
console.log('Flutter packages:', analysis.flutter);
console.log('React packages:', analysis.react);
console.log('Warnings:', analysis.warnings);
```

## CLI Commands

### Install Command

Check package compatibility and get installation instructions:

```bash
# Check React package
lumora install axios --framework react

# Check Flutter package
lumora install provider --framework flutter

# Check only (don't install)
lumora install camera --framework flutter --check-only
```

### Packages Command

Analyze all dependencies in a project:

```bash
# Analyze current directory
lumora packages

# Analyze specific directory
lumora packages --path ./my-project
```

## Plugin Capabilities

Plugins can declare various capabilities:

- **widgets**: Custom UI components
- **stateManagement**: State management solutions
- **navigation**: Navigation systems
- **networking**: Network clients
- **storage**: Data persistence
- **nativeCode**: Native platform code (iOS/Android)

## Compatibility Checking

The system checks compatibility with:

- **Lumora version**: Using semver ranges (^, ~, >=, >)
- **Platform support**: iOS, Android, Web, macOS, Windows, Linux
- **Native dependencies**: Warns if package requires native code

## Native Dependencies

Packages with native code:
- ✅ Work in production builds
- ❌ Don't work in Lumora Go (dev preview mode)
- ⚠️  Generate warnings during installation

Common native packages:
- Flutter: `camera`, `image_picker`, `firebase_*`, `google_maps_flutter`
- React: `react-native-camera`, `react-native-maps`, `@react-native-firebase/*`

## Known Compatible Packages

### Flutter
- State management: `provider`, `riverpod`, `flutter_bloc`, `get`
- Networking: `dio`, `http`
- Utilities: `json_annotation`, `freezed_annotation`, `equatable`

### React
- State management: `zustand`, `jotai`, `recoil`, `react-query`
- Networking: `axios`, `swr`
- Core: `react`, `react-dom`

## Dependency Resolution

The plugin registry can resolve dependencies:

```typescript
// Register plugins with dependencies
registry.register(pluginA);
registry.register(pluginB); // depends on pluginA

// Resolve installation order
const order = registry.resolveDependencies('pluginB');
// Returns: ['pluginA', 'pluginB']

// Check for conflicts
const conflicts = registry.checkDependencyConflicts(['pluginA', 'pluginB']);
if (conflicts.length > 0) {
  console.error('Dependency conflicts:', conflicts);
}
```

## Widget Registration

Plugins can provide custom widgets:

```typescript
const plugin: Plugin = {
  metadata: { name: 'ui-kit', version: '1.0.0' },
  compatibility: {},
  capabilities: {
    widgets: [
      {
        name: 'CustomButton',
        type: 'component',
        framework: 'react',
        import: "import { CustomButton } from 'ui-kit';",
        props: {
          variant: 'primary' | 'secondary',
          size: 'small' | 'medium' | 'large',
        },
      },
    ],
  },
  enabled: true,
};

registry.register(plugin);

// Get all widgets from enabled plugins
const widgets = registry.getAllPluginWidgets();
```

## Best Practices

1. **Check compatibility before installing**: Use `lumora install --check-only`
2. **Review warnings**: Pay attention to native dependency warnings
3. **Test in dev mode**: Verify packages work in Lumora Go
4. **Document custom plugins**: Include clear metadata and capabilities
5. **Version constraints**: Use semver ranges for compatibility

## Error Handling

The system provides detailed error messages:

```typescript
const result = registry.register(plugin);

if (!result.valid) {
  // Critical errors that prevent registration
  result.errors.forEach(error => {
    console.error('Error:', error);
  });
}

// Non-critical warnings
result.warnings.forEach(warning => {
  console.warn('Warning:', warning);
});
```

## Future Enhancements

- Plugin marketplace
- Automatic dependency installation
- Plugin versioning and updates
- Custom widget code generation
- Plugin testing framework
