# Codegen Hook

## Description

This hook runs codegen tools to convert TSX files to JSON schemas and optionally generate production Dart code with state management.

## Trigger

**Type**: Manual or File Save

**When to use**:
- After editing TSX files
- When generating production Dart code
- During continuous development with watch mode

## Purpose

Automate the code transformation pipeline:
- Convert React TSX to JSON UI schemas
- Generate production Dart code from schemas
- Support watch mode for continuous regeneration
- Integrate with Dev-Proxy for instant preview

## Hook Configuration

```yaml
name: codegen
trigger: 
  - manual
  - file_save (*.tsx files)
description: Convert TSX to schema and generate Dart code
```

## Actions

### Mode 1: TSX to Schema Conversion

Convert a single TSX file to JSON schema:

```bash
cd tools/codegen
node cli.js tsx2schema <input.tsx> <output.json>
```

**Example**:
```bash
node cli.js tsx2schema web/src/App.tsx schema.json
```

### Mode 2: TSX to Schema with Watch Mode

Continuously monitor TSX file and regenerate on changes:

```bash
cd tools/codegen
node cli.js tsx2schema --watch <input.tsx> <output.json>
```

**Example**:
```bash
node cli.js tsx2schema --watch web/src/App.tsx schema.json
```

### Mode 3: Schema to Dart Code Generation

Generate production Dart code from schema:

```bash
cd tools/codegen
node cli.js schema2dart <schema.json> <output-dir> --adapter=<adapter>
```

**Example**:
```bash
node cli.js schema2dart schema.json mobile/lib/generated --adapter=bloc
```

### Mode 4: Full Pipeline (TSX → Schema → Dart)

Run complete transformation:

```bash
# Step 1: TSX to Schema
node cli.js tsx2schema web/src/App.tsx schema.json

# Step 2: Schema to Dart
node cli.js schema2dart schema.json mobile/lib/generated --adapter=bloc

# Step 3: Push to Dev-Proxy (optional)
curl -X POST http://localhost:3000/send/abc123def456 \
  -H "Content-Type: application/json" \
  -d @schema.json
```

## Expected Output

### TSX to Schema Output

```
🔄 Parsing TSX file: web/src/App.tsx
✓ Found default export: App component
✓ Extracted JSX tree with 15 nodes
✓ Converted to schema format
✓ Validated schema structure
✓ Written to: schema.json (12.5 KB)

Schema summary:
  - Version: 1.0
  - Root type: View
  - Total nodes: 15
  - Primitives used: View, Text, Button, List, Input
```

### Watch Mode Output

```
👀 Watching: web/src/App.tsx
✓ Initial schema generated: schema.json

[10:30:15] File changed: web/src/App.tsx
[10:30:15] Regenerating schema...
[10:30:16] ✓ Schema updated: schema.json (13.2 KB)

[10:31:42] File changed: web/src/App.tsx
[10:31:42] Regenerating schema...
[10:31:43] ✓ Schema updated: schema.json (13.8 KB)

Press Ctrl+C to stop watching...
```

### Schema to Dart Output

```
🔄 Generating Dart code from schema...
✓ Loaded schema: schema.json
✓ Loaded ui-mapping.json
✓ Selected adapter: bloc
✓ Loaded templates: bloc templates

Generating files:
  ✓ lib/generated/features/app/domain/entities/
  ✓ lib/generated/features/app/domain/usecases/
  ✓ lib/generated/features/app/data/models/
  ✓ lib/generated/features/app/data/repositories/
  ✓ lib/generated/features/app/presentation/bloc/
    - app_event.dart
    - app_state.dart
    - app_bloc.dart
  ✓ lib/generated/features/app/presentation/pages/
    - app_page.dart
  ✓ lib/generated/features/app/presentation/widgets/

✓ Generated 8 files in 2.3s
✓ Clean Architecture structure created

Next steps:
  1. cd mobile
  2. flutter pub get
  3. flutter run
```

## Error Handling

**Invalid TSX Syntax**:
```
Error: Failed to parse TSX file
  File: web/src/App.tsx
  Line: 15, Column: 8
  
  Unexpected token, expected ">"
  
  13 | <View>
  14 |   <Text>Hello World
> 15 |   <Button title="Click" />
     |        ^
  16 | </View>

Suggestion: Check for unclosed JSX tags
```

**Missing Input File**:
```
Error: Input file not found
  Path: web/src/App.tsx
  
Suggestion: Verify the file path is correct
  Current directory: /Users/dev/lumora-project/tools/codegen
```

**Invalid Adapter**:
```
Error: Unknown state adapter 'redux'
  
Supported adapters:
  - bloc (recommended for large apps)
  - riverpod (modern, performant)
  - provider (simple, lightweight)
  - getx (minimal boilerplate)

Example: node cli.js schema2dart schema.json output/ --adapter=bloc
```

**Schema Validation Error**:
```
Error: Invalid schema structure
  Missing required field: schemaVersion
  
Schema must include:
  {
    "schemaVersion": "1.0",
    "root": { ... }
  }
```

## Watch Mode Configuration

Create a `.codegenrc` file for watch mode settings:

```json
{
  "watch": {
    "debounce": 300,
    "ignored": ["node_modules", "build", "dist"],
    "autoPush": true,
    "sessionId": "abc123def456"
  }
}
```

With `autoPush: true`, schemas are automatically pushed to Dev-Proxy on regeneration.

## Integration with Dev-Proxy

### Auto-Push on Regeneration

```bash
# Set session ID
export KIRO_SESSION_ID=abc123def456

# Run with auto-push
node cli.js tsx2schema --watch --push web/src/App.tsx schema.json
```

Output:
```
[10:30:16] ✓ Schema updated: schema.json
[10:30:16] 📤 Pushing to Dev-Proxy...
[10:30:16] ✓ Pushed to session abc123def456 (2 devices)
```

### Manual Push

```bash
# Generate schema
node cli.js tsx2schema web/src/App.tsx schema.json

# Push to session
curl -X POST http://localhost:3000/send/abc123def456 \
  -H "Content-Type: application/json" \
  -d @schema.json
```

## Supported TSX Primitives

The codegen tool supports these core primitives:

| TSX Component | Schema Type | Flutter Widget |
|---------------|-------------|----------------|
| `<View>` | View | Container |
| `<Text>` | Text | Text |
| `<Button>` | Button | ElevatedButton |
| `<List>` | List | ListView |
| `<Image>` | Image | Image.network |
| `<Input>` | Input | TextField |

### Example TSX

```tsx
export default function App() {
  return (
    <View padding={16} backgroundColor="#FFFFFF">
      <Text 
        text="Hello Lumora" 
        style={{ fontSize: 24, fontWeight: "bold" }}
      />
      <Button 
        title="Click Me" 
        onTap="emit:button_clicked:{id:1}"
      />
      <List>
        <Text text="Item 1" />
        <Text text="Item 2" />
        <Text text="Item 3" />
      </List>
      <Input 
        placeholder="Enter text"
        onChange="emit:input_changed:{}"
      />
    </View>
  );
}
```

## State Adapter Templates

### Bloc Adapter

Generates:
- Event classes (`app_event.dart`)
- State classes (`app_state.dart`)
- Bloc logic (`app_bloc.dart`)
- Page with BlocProvider and BlocBuilder

**Best for**: Large apps, complex state, testability

### Riverpod Adapter

Generates:
- StateNotifier classes
- Provider declarations
- ConsumerWidget pages

**Best for**: Modern apps, performance-critical, modularity

### Provider Adapter

Generates:
- ChangeNotifier classes
- ChangeNotifierProvider wiring
- Consumer widgets

**Best for**: Small to medium apps, simplicity

### GetX Adapter

Generates:
- Controller classes
- GetMaterialApp bindings
- GetX widget usage

**Best for**: Rapid prototyping, minimal boilerplate

## Usage Examples

### Example 1: Quick Preview

```bash
# Generate schema and push to device
cd tools/codegen
node cli.js tsx2schema web/src/App.tsx schema.json
curl -X POST http://localhost:3000/send/abc123 -d @schema.json
```

### Example 2: Live Development

```bash
# Terminal 1: Start Dev-Proxy
cd tools/dev-proxy && npm start

# Terminal 2: Watch TSX and auto-push
cd tools/codegen
export KIRO_SESSION_ID=abc123
node cli.js tsx2schema --watch --push web/src/App.tsx schema.json

# Terminal 3: Run Flutter app
cd apps/flutter-dev-client && flutter run
```

### Example 3: Production Build

```bash
# Generate schema
cd tools/codegen
node cli.js tsx2schema web/src/App.tsx schema.json

# Generate Dart code
node cli.js schema2dart schema.json ../mobile/lib/generated --adapter=bloc

# Build Flutter app
cd ../mobile
flutter pub get
flutter build apk --release
```

## Integration with Kiro

This hook can be triggered from:
- Kiro command palette: "Generate Schema from TSX"
- File save event: Auto-trigger on .tsx file save
- Terminal: `kiro hook run codegen`
- Kiro sidebar: "Codegen" button

## Hook Parameters

When running through Kiro, the hook accepts parameters:

```yaml
parameters:
  mode:
    type: select
    options: [tsx2schema, schema2dart, full-pipeline]
    default: tsx2schema
  
  watch:
    type: boolean
    default: false
  
  adapter:
    type: select
    options: [bloc, riverpod, provider, getx]
    default: bloc
  
  autoPush:
    type: boolean
    default: false
```

## Related Hooks

- **create-app-hook**: Create new app before running codegen
- **proxy-launch-hook**: Start Dev-Proxy before pushing schemas

## Performance Tips

1. **Use Watch Mode**: Faster than manual regeneration
2. **Delta Updates**: Push only changes, not full schemas
3. **Debounce**: Wait 300ms after typing before regenerating
4. **Ignore Patterns**: Exclude node_modules, build folders
5. **Incremental Parsing**: Only parse changed files

## Advanced Usage

### Custom UI Mapping

Edit `tools/codegen/ui-mapping.json` to customize widget mappings:

```json
{
  "CustomCard": {
    "dart": "Card",
    "props": {
      "elevation": "elevation",
      "borderRadius": "shape.borderRadius"
    }
  }
}
```

### Custom Templates

Create custom adapter templates in `tools/codegen/templates/`:

```
templates/
  my-adapter/
    feature_controller.dart.hbs
    feature_page.dart.hbs
```

### Batch Processing

Process multiple TSX files:

```bash
for file in web/src/*.tsx; do
  node cli.js tsx2schema "$file" "schemas/$(basename $file .tsx).json"
done
```

## Notes

- TSX parsing uses Babel with jsx and typescript plugins
- Schema format is versioned (currently 1.0)
- Generated Dart code follows Clean Architecture
- Watch mode uses chokidar for efficient file monitoring
- Templates use Handlebars for code generation
- All generated code includes proper imports and exports
