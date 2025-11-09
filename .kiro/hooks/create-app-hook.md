# Create App Hook

## Description

This hook scaffolds a new Lumora application with the chosen state management adapter, creating a complete project structure with example files and configuration.

## Trigger

**Type**: Manual

**When to use**: When starting a new Lumora project from scratch

## Purpose

Quickly initialize a new Lumora application with:
- Proper directory structure (web/, mobile/, docs/)
- Configuration files (kiro.config.json, package.json, pubspec.yaml)
- Example TSX components
- Flutter app boilerplate
- State management adapter setup
- README with getting started instructions

## Hook Configuration

```yaml
name: create-app
trigger: manual
description: Scaffold a new Lumora application
```

## Actions

### 1. Prompt for Project Details

Ask the user for:
- **App Name**: Project directory name (kebab-case recommended)
- **State Adapter**: Choice of bloc, riverpod, provider, or getx
- **Description**: Optional project description

### 2. Validate Input

- Ensure app name is valid (alphanumeric, hyphens, underscores only)
- Check that target directory doesn't already exist
- Verify adapter choice is supported

### 3. Execute Create App Command

```bash
cd tools/codegen
node cli.js create-app <app-name> --adapter=<adapter>
```

### 4. Post-Creation Steps

After successful creation:
1. Navigate to project directory: `cd <app-name>`
2. Install Node.js dependencies: `npm install`
3. Install Flutter dependencies: `cd mobile && flutter pub get`
4. Display success message with next steps

## Expected Output

```
✓ Created project directory: my-app/
✓ Generated configuration files
✓ Created web/ directory with example TSX
✓ Created mobile/ directory with Flutter app
✓ Initialized package.json and pubspec.yaml
✓ Set up bloc state management adapter

Next steps:
  1. cd my-app
  2. npm install
  3. cd mobile && flutter pub get
  4. Start Dev-Proxy: cd ../tools/dev-proxy && npm start
  5. Run Flutter app: cd ../mobile && flutter run

Your Lumora app is ready! 🚀
```

## Error Handling

**Directory Already Exists**:
```
Error: Directory 'my-app' already exists
Suggestion: Choose a different name or remove the existing directory
```

**Invalid App Name**:
```
Error: Invalid app name 'My App!'
Suggestion: Use alphanumeric characters, hyphens, or underscores only
Example: my-app, my_app, myapp
```

**Invalid Adapter**:
```
Error: Unknown adapter 'redux'
Supported adapters: bloc, riverpod, provider, getx
```

## Files Created

```
<app-name>/
├── .gitignore
├── README.md
├── kiro.config.json
├── web/
│   ├── package.json
│   └── src/
│       └── App.tsx
├── mobile/
│   ├── pubspec.yaml
│   ├── lib/
│   │   └── main.dart
│   ├── android/
│   └── ios/
└── docs/
    └── getting-started.md
```

## Configuration Template

The generated `kiro.config.json`:

```json
{
  "adapter": "bloc",
  "schemaVersion": "1.0",
  "codegen": {
    "outputDir": "mobile/lib/generated",
    "cleanArchitecture": true,
    "generateTests": false
  },
  "designTokens": {
    "colors": {
      "primary": "#6200EE",
      "secondary": "#03DAC6",
      "background": "#FFFFFF",
      "text": "#000000"
    },
    "typography": {
      "heading": {
        "fontSize": 24,
        "fontWeight": "bold"
      },
      "body": {
        "fontSize": 16,
        "fontWeight": "normal"
      }
    },
    "spacing": {
      "small": 8,
      "medium": 16,
      "large": 24
    }
  }
}
```

## Usage Example

```bash
# Using Kiro CLI
kiro hook run create-app

# Or directly
cd tools/codegen
node cli.js create-app todo-app --adapter=bloc
```

## Integration with Kiro

This hook can be triggered from:
- Kiro command palette: "Create New Lumora App"
- Kiro sidebar: "New Project" button
- Terminal: `kiro hook run create-app`

## Related Hooks

- **proxy-launch-hook**: Start Dev-Proxy after app creation
- **codegen-hook**: Generate schemas and Dart code for the new app

## Notes

- The hook uses templates from `tools/codegen/templates/create-app/`
- Adapter-specific files are generated based on the chosen state management pattern
- The generated app includes a working example (counter or todo list)
- All generated code follows Clean Architecture principles
