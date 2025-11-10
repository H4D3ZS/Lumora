# Lumora Configuration Guide

This guide explains how to configure Lumora using the `lumora.yaml` configuration file.

## Table of Contents

- [Overview](#overview)
- [Configuration File Location](#configuration-file-location)
- [Configuration Options](#configuration-options)
- [Custom Widget Mappings](#custom-widget-mappings)
- [Naming Conventions](#naming-conventions)
- [Formatting Preferences](#formatting-preferences)
- [Examples](#examples)
- [Programmatic Usage](#programmatic-usage)

## Overview

Lumora uses a YAML configuration file (`lumora.yaml`) to customize its behavior. The configuration file is validated against a JSON schema to ensure correctness.

## Configuration File Location

The `lumora.yaml` file should be placed at the root of your project directory:

```
my-project/
├── lumora.yaml          # Configuration file
├── web/                 # React source
├── mobile/              # Flutter source
└── .lumora/             # Lumora IR storage
```

## Configuration Options

### Basic Configuration

```yaml
# Development mode: react, flutter, or universal
mode: universal

# Directory paths
reactDir: web/src
flutterDir: mobile/lib
storageDir: .lumora/ir
```

### Custom Widget Mappings

```yaml
# Path to custom widget mappings file (optional)
customMappings: custom-widget-mappings.yaml
```

See [Custom Widget Mappings](#custom-widget-mappings) section for details.

### Naming Conventions

```yaml
namingConventions:
  # File naming: snake_case, kebab-case, PascalCase, camelCase
  fileNaming: snake_case
  
  # Identifier naming: camelCase, PascalCase, snake_case
  identifierNaming: camelCase
  
  # Component/Widget class naming: PascalCase, camelCase
  componentNaming: PascalCase
```

### Formatting Preferences

```yaml
formatting:
  # Indentation size (1-8 spaces)
  indentSize: 2
  
  # Use tabs instead of spaces
  useTabs: false
  
  # Maximum line width (40-200)
  lineWidth: 80
  
  # Use semicolons in TypeScript/JavaScript
  semicolons: true
  
  # Trailing comma style: none, es5, all
  trailingComma: es5
  
  # Use single quotes in TypeScript/JavaScript
  singleQuote: true
```

### Synchronization Settings

```yaml
sync:
  # Enable automatic file synchronization
  enabled: true
  
  # Debounce delay in milliseconds (0-5000)
  debounceMs: 300
  
  # Glob patterns for files to exclude from sync
  excludePatterns:
    - "**/*.test.*"
    - "**/*.spec.*"
    - "**/node_modules/**"
    - "**/.git/**"
  
  # Enable automatic test file synchronization
  testSync: true
```

### Conversion Settings

```yaml
conversion:
  # Preserve comments during conversion
  preserveComments: true
  
  # Generate documentation comments in target framework
  generateDocumentation: true
  
  # Enable strict type checking during conversion
  strictTypeChecking: true
  
  # Behavior when encountering unmapped widgets: warn, error, ignore
  fallbackBehavior: warn
```

### Validation Settings

```yaml
validation:
  # Validate IR against schema
  validateIR: true
  
  # Validate generated code syntax
  validateGenerated: true
```

## Custom Widget Mappings

You can define custom widget mappings to extend or override the default mappings. Create a separate YAML file (e.g., `custom-widget-mappings.yaml`) and reference it in your `lumora.yaml`:

```yaml
# lumora.yaml
customMappings: custom-widget-mappings.yaml
```

### Custom Mapping Format

```yaml
# custom-widget-mappings.yaml
schemaVersion: "1.0"

CustomButton:
  react:
    component: "button"
  flutter:
    widget: "CustomButton"
    import: "package:my_app/widgets/custom_button.dart"
  props:
    label:
      react: "children"
      flutter: "label"
      type: "string"
  events:
    onClick:
      react: "onClick"
      flutter: "onPressed"
      parameters: []
  custom: true
```

### Overriding Default Mappings

To override a default mapping, use the same widget name and set `custom: true`:

```yaml
Text:
  react:
    component: "p"  # Use <p> instead of default <span>
  flutter:
    widget: "Text"
    import: "package:flutter/material.dart"
  custom: true
```

## Naming Conventions

Lumora can automatically apply naming conventions to generated files and identifiers.

### File Naming

- `snake_case`: `my_component.tsx`, `user_profile.dart`
- `kebab-case`: `my-component.tsx`, `user-profile.dart`
- `PascalCase`: `MyComponent.tsx`, `UserProfile.dart`
- `camelCase`: `myComponent.tsx`, `userProfile.dart`

### Identifier Naming

- `camelCase`: `myVariable`, `userName`
- `PascalCase`: `MyVariable`, `UserName`
- `snake_case`: `my_variable`, `user_name`

### Component Naming

- `PascalCase`: `MyComponent`, `UserProfile` (recommended)
- `camelCase`: `myComponent`, `userProfile`

## Formatting Preferences

### Indentation

```yaml
formatting:
  indentSize: 2      # 2 spaces per indent level
  useTabs: false     # Use spaces, not tabs
```

### Line Width

```yaml
formatting:
  lineWidth: 80      # Wrap lines at 80 characters
```

### TypeScript/JavaScript Formatting

```yaml
formatting:
  semicolons: true           # Add semicolons
  trailingComma: es5         # Trailing commas in arrays/objects
  singleQuote: true          # Use single quotes
```

## Examples

### React-First Project

```yaml
mode: react
reactDir: src
flutterDir: mobile/lib
storageDir: .lumora/ir

namingConventions:
  fileNaming: kebab-case
  identifierNaming: camelCase
  componentNaming: PascalCase

formatting:
  indentSize: 2
  useTabs: false
  lineWidth: 100
  semicolons: false
  trailingComma: all
  singleQuote: true
```

### Flutter-First Project

```yaml
mode: flutter
reactDir: web/src
flutterDir: lib
storageDir: .lumora/ir

namingConventions:
  fileNaming: snake_case
  identifierNaming: camelCase
  componentNaming: PascalCase

formatting:
  indentSize: 2
  useTabs: false
  lineWidth: 80
```

### Universal (Bidirectional) Project

```yaml
mode: universal
reactDir: web/src
flutterDir: mobile/lib
storageDir: .lumora/ir

customMappings: custom-mappings.yaml

namingConventions:
  fileNaming: snake_case
  identifierNaming: camelCase
  componentNaming: PascalCase

formatting:
  indentSize: 2
  useTabs: false
  lineWidth: 80
  semicolons: true
  trailingComma: es5
  singleQuote: true

sync:
  enabled: true
  debounceMs: 300
  testSync: true

conversion:
  preserveComments: true
  generateDocumentation: true
  strictTypeChecking: true
  fallbackBehavior: warn

validation:
  validateIR: true
  validateGenerated: true
```

## Programmatic Usage

### Loading Configuration

```typescript
import { loadAndApplyConfig } from '@lumora/ir';

// Load configuration and apply to all components
const { modeConfig, registry } = loadAndApplyConfig('./my-project');

console.log(`Mode: ${modeConfig.getMode()}`);
console.log(`React Dir: ${modeConfig.getReactDir()}`);
```

### Initializing Configuration

```typescript
import { initConfigWithMappings } from '@lumora/ir';

// Initialize new configuration with custom mappings
const { modeConfig, registry } = initConfigWithMappings(
  './my-project',
  'universal',
  'custom-mappings.yaml'
);
```

### Using Naming Conventions

```typescript
import { ModeConfig, applyFileNaming, generateFileName } from '@lumora/ir';

const config = new ModeConfig('./my-project');

// Apply naming conventions
const fileName = applyFileNaming('MyComponent', config);
// Result: "my_component" (if fileNaming is snake_case)

const fullFileName = generateFileName('UserProfile', 'tsx', config);
// Result: "user_profile.tsx"
```

### Using Formatting Preferences

```typescript
import { formatTypeScriptCode, formatDartCode } from '@lumora/ir';

const config = new ModeConfig('./my-project');

// Format TypeScript code
const tsCode = 'const x = 1\nconst y = 2';
const formatted = formatTypeScriptCode(tsCode, config);
// Applies indentation, semicolons, quotes, etc.

// Format Dart code
const dartCode = 'void main() {\nprint("Hello");\n}';
const formattedDart = formatDartCode(dartCode, config);
```

### Accessing Configuration Settings

```typescript
const config = new ModeConfig('./my-project');

// Get naming conventions
const naming = config.getNamingConventions();
console.log(naming.fileNaming);        // "snake_case"
console.log(naming.identifierNaming);  // "camelCase"

// Get formatting preferences
const formatting = config.getFormattingPreferences();
console.log(formatting.indentSize);    // 2
console.log(formatting.lineWidth);     // 80

// Get sync settings
const sync = config.getSyncSettings();
console.log(sync.enabled);             // true
console.log(sync.debounceMs);          // 300

// Get conversion settings
const conversion = config.getConversionSettings();
console.log(conversion.fallbackBehavior);  // "warn"

// Get validation settings
const validation = config.getValidationSettings();
console.log(validation.validateIR);    // true
```

## Schema Validation

Lumora automatically validates your configuration against a JSON schema. If validation fails, warnings will be displayed and default values will be used for invalid fields.

Example validation error:

```
Configuration validation warnings:
  - /mode: must be equal to one of the allowed values
  - /formatting/indentSize: must be >= 1 and <= 8
Using default values for invalid fields
```

## Best Practices

1. **Commit `lumora.yaml` to version control** - This ensures consistent configuration across your team.

2. **Use consistent naming conventions** - Choose one convention and stick with it throughout your project.

3. **Document custom mappings** - Add comments to your custom widget mappings file to explain their purpose.

4. **Test configuration changes** - After modifying `lumora.yaml`, test the conversion to ensure it works as expected.

5. **Use validation** - Keep `validateIR` and `validateGenerated` enabled to catch errors early.

6. **Adjust debounce timing** - If you experience lag during development, increase `debounceMs`. If changes aren't syncing fast enough, decrease it.

## Troubleshooting

### Configuration Not Loading

- Ensure `lumora.yaml` is at the project root
- Check YAML syntax (use a YAML validator)
- Look for validation warnings in the console

### Custom Mappings Not Working

- Verify the custom mappings file path is correct
- Ensure the file exists and is valid YAML
- Check that `custom: true` is set for custom mappings
- Look for console warnings about missing files

### Naming Conventions Not Applied

- Verify the naming convention is spelled correctly
- Check that you're using the configuration methods (e.g., `applyFileNaming`)
- Ensure the configuration is loaded before use

### Formatting Not Applied

- Check that formatting preferences are set correctly
- Verify you're calling the formatting functions
- Some formatting is basic - consider using dedicated formatters (Prettier, dart format) for production code

