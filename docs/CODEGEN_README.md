Note

Replace ws://<YOUR_HOST_OR_IP> in the QR output with your machine’s LAN IP when testing on a physical phone.

For remote demos, use a tunnel service (ngrok/localtunnel) and update wsUrl accordingly.


# Codegen — README

**Purpose:** Tools that convert React TSX files to a normalized UI schema and (optionally) generate Dart widget files per chosen state adapter.

---

## Installation

```bash
cd tools/codegen
npm install
```

---

## CLI Commands

### `tsx2schema` - Convert TSX to JSON Schema

Convert a TSX file to a JSON UI schema that can be interpreted by the Flutter-Dev-Client.

**Basic Usage:**
```bash
node cli.js tsx2schema <input.tsx> <output.json>
```

**Watch Mode:**
```bash
node cli.js tsx2schema <input.tsx> <output.json> --watch
```

**Examples:**
```bash
# Convert a single file
node cli.js tsx2schema examples/todo-app/web/src/App.tsx schema.json

# Watch for changes and auto-regenerate
node cli.js tsx2schema src/App.tsx schema.json --watch
```

**Arguments:**
- `<input>` - Path to the input TSX file
- `<output>` - Path to the output JSON schema file

**Options:**
- `-w, --watch` - Watch for file changes and regenerate automatically
- `-h, --help` - Display help for command

**Exit Codes:**
- `0` - Success
- `1` - Invalid arguments or configuration
- `2` - Parse error (invalid TSX syntax)
- `3` - File system error (file not found, permission denied)
- `4` - Generation error (no JSX found, conversion failed)

---

## Supported JSX Primitives (MVP)

- `View` - Container component
- `Text` - Text display
- `Button` - Interactive button
- `List` - List container
- `Image` - Image display
- `Input` - Text input field

---

## Supported Props

- **String literals**: `text="Hello"`
- **Numeric literals**: `padding={16}`
- **Boolean literals**: `disabled={true}`
- **Object expressions**: `style={{ fontSize: 24, fontWeight: "bold" }}`
- **Array expressions**: `items={[1, 2, 3]}`
- **Template literals**: `` text={`Hello, ${name}!`} `` (converted to `{{name}}` placeholders)
- **Event handlers**: `onTap={() => ...}` (converted to `emit:action:{}` pattern)

---

## How It Works

1. **Parse TSX**: Uses `@babel/parser` with JSX and TypeScript plugins to parse the TSX file into an AST
2. **Find Root Element**: Locates the top-level JSX element in the default export (or first JSXElement)
3. **Convert to Schema**: Walks the JSX tree recursively and converts each element to a normalized JSON node structure
4. **Write Output**: Writes the schema to the output file with proper formatting

---

## Schema Format

The generated schema follows this structure:

```json
{
  "schemaVersion": "1.0",
  "root": {
    "type": "View",
    "props": {
      "padding": 16,
      "backgroundColor": "#FFFFFF"
    },
    "children": [
      {
        "type": "Text",
        "props": {
          "text": "Hello World",
          "style": {
            "fontSize": 24,
            "fontWeight": "bold"
          }
        },
        "children": []
      }
    ]
  }
}
```

---

## Watch Mode

Watch mode monitors the input file for changes and automatically regenerates the schema when changes are detected.

**Features:**
- Detects file changes within 1 second
- Logs regeneration events with timestamps
- Continues watching until process is terminated (Ctrl+C)
- Uses `chokidar` for reliable file watching across platforms

**Example Output:**
```
[2025-11-09T09:25:06.970Z] Converting input.tsx to output.json...
✓ Schema generated successfully: output.json

👀 Watching input.tsx for changes... (Press Ctrl+C to stop)

[2025-11-09T09:25:08.908Z] Converting input.tsx to output.json...
✓ Schema generated successfully: output.json
```

---

## Error Handling

The CLI provides clear error messages for common issues:

**Missing Input File:**
```
✗ Error: Input file not found: nonexistent.tsx
Exit Code: 3
```

**Parse Error:**
```
✗ Parse Error: Unexpected token, expected "}" (4:12)
  at line 4, column 12
Exit Code: 2
```

**No JSX Found:**
```
✗ Generation Error: No JSX element found in the file. Make sure your component returns JSX.
Exit Code: 4
```

**Permission Error:**
```
✗ Error: Output directory is not writable: /readonly-dir
Exit Code: 3
```

---

## Additional Commands

### `create-app` - Scaffold New Projects

Create a new Lumora project with template files and directory structure.

**Basic Usage:**
```bash
node cli.js create-app <app-name> [options]
```

**Options:**
- `-a, --adapter <adapter>` - State management adapter: bloc, riverpod, provider, getx (default: bloc)
- `-d, --dir <directory>` - Target directory (default: current directory)
- `-h, --help` - Display help for command

**Examples:**
```bash
# Create app with Bloc adapter (default)
node cli.js create-app my_app

# Create app with Riverpod adapter
node cli.js create-app my_app --adapter=riverpod

# Create app in specific directory
node cli.js create-app my_app --adapter=bloc --dir=~/projects
```

**Generated Structure:**
```
my_app/
├── web/
│   ├── src/
│   │   └── App.tsx          # Example TSX component
│   ├── schema/              # Generated schemas
│   └── package.json         # Node.js dependencies
├── mobile/
│   ├── lib/
│   │   ├── main.dart       # Flutter entry point
│   │   └── features/       # Generated feature code
│   └── pubspec.yaml        # Flutter dependencies
├── kiro.config.json        # Lumora configuration
├── README.md               # Project documentation
└── .gitignore              # Git ignore rules
```

**Requirements:**
- App name must start with lowercase letter
- Only lowercase letters, numbers, and underscores allowed
- Directory must not already exist
- Scaffolding completes within 30 seconds

### `schema2dart` - Generate Dart Code

Generate production Dart code from JSON schemas with state management patterns.

**Basic Usage:**
```bash
node cli.js schema2dart <schema.json> <output-dir> [options]
```

**Options:**
- `-a, --adapter <adapter>` - State management adapter: bloc, riverpod, provider, getx (default: bloc)
- `-f, --feature <name>` - Feature name for generated files (default: feature)
- `-h, --help` - Display help for command

**Examples:**
```bash
# Generate with Bloc adapter
node cli.js schema2dart schema.json ./output -a bloc -f UserProfile

# Generate with Riverpod adapter
node cli.js schema2dart schema.json ./output -a riverpod -f Dashboard
```

See [SCHEMA2DART_README.md](./tools/codegen/SCHEMA2DART_README.md) for detailed documentation.

---

## Future Enhancements (Roadmap)

- Custom component mapping via `kiro.config.json`
- Test generation for domain logic
- Hot reload integration
- Component library support