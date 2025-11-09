# Lumora Codegen CLI - Quick Reference

## Installation

```bash
cd tools/codegen
npm install
```

## Commands

### create-app

Create a new Lumora project with template files and directory structure.

```bash
node cli.js create-app <app-name> [options]
```

**Options:**
- `-a, --adapter <adapter>` - State management adapter: bloc, riverpod, provider, getx (default: bloc)
- `-d, --dir <directory>` - Target directory (default: current directory)
- `-h, --help` - Display help

**Examples:**

```bash
# Create app with Bloc adapter (default)
node cli.js create-app my_app

# Create app with Riverpod adapter
node cli.js create-app my_app --adapter=riverpod

# Create app in specific directory
node cli.js create-app my_app --adapter=bloc --dir=~/projects

# Create app with GetX adapter
node cli.js create-app my_app --adapter=getx
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

### tsx2schema

Convert TSX files to JSON UI schemas.

```bash
node cli.js tsx2schema <input.tsx> <output.json> [options]
```

**Options:**
- `-w, --watch` - Watch for file changes and regenerate automatically
- `-h, --help` - Display help

**Examples:**

```bash
# Basic conversion
node cli.js tsx2schema src/App.tsx schema.json

# Watch mode
node cli.js tsx2schema src/App.tsx schema.json --watch

# With example file
node cli.js tsx2schema example.tsx example-output.json
```

### schema2dart

Convert JSON UI schemas to Dart widget code with state management.

```bash
node cli.js schema2dart <schema.json> <output-dir> [options]
```

**Options:**
- `-a, --adapter <adapter>` - State management adapter: bloc, riverpod, provider, getx (default: bloc)
- `-f, --feature <name>` - Feature name for generated files (default: feature)
- `-h, --help` - Display help

**Examples:**

```bash
# Generate with Bloc adapter
node cli.js schema2dart schema.json ./output -a bloc -f UserProfile

# Generate with Riverpod adapter
node cli.js schema2dart schema.json ./output -a riverpod -f Dashboard

# Generate with Provider adapter
node cli.js schema2dart schema.json ./output -a provider -f Settings

# Generate with GetX adapter
node cli.js schema2dart schema.json ./output -a getx -f Home
```

**See [SCHEMA2DART_README.md](./SCHEMA2DART_README.md) for detailed documentation.**

## Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| 0 | Success | File converted successfully |
| 1 | Invalid arguments | Missing required arguments |
| 2 | Parse error | Invalid TSX syntax |
| 3 | File system error | File not found, permission denied |
| 4 | Generation error | No JSX found in file |

## Error Messages

### File Not Found
```
✗ Error: Input file not found: nonexistent.tsx
```
**Solution:** Check the file path and ensure the file exists.

### Parse Error
```
✗ Parse Error: Unexpected token, expected "}" (4:12)
  at line 4, column 12
```
**Solution:** Fix the syntax error at the specified line and column.

### No JSX Found
```
✗ Generation Error: No JSX element found in the file. Make sure your component returns JSX.
```
**Solution:** Ensure your component returns JSX elements.

### Permission Denied
```
✗ Error: Output directory is not writable: /readonly-dir
```
**Solution:** Check directory permissions or choose a different output location.

## Watch Mode

Watch mode automatically regenerates the schema when the input file changes.

**Features:**
- Detects changes within 1 second
- Logs each regeneration with timestamp
- Continues until Ctrl+C is pressed

**Example Output:**
```
[2025-11-09T09:25:06.970Z] Converting input.tsx to output.json...
✓ Schema generated successfully: output.json

👀 Watching input.tsx for changes... (Press Ctrl+C to stop)

[2025-11-09T09:25:08.908Z] Converting input.tsx to output.json...
✓ Schema generated successfully: output.json
```

## Supported JSX Elements

- `View` - Container component
- `Text` - Text display
- `Button` - Interactive button
- `List` - List container
- `Image` - Image display
- `Input` - Text input field

## Supported Props

- String literals: `text="Hello"`
- Numbers: `padding={16}`
- Booleans: `disabled={true}`
- Objects: `style={{ fontSize: 24 }}`
- Arrays: `items={[1, 2, 3]}`
- Templates: `` text={`Hello ${name}`} `` → `"Hello {{name}}"`
- Functions: `onTap={() => ...}` → `"emit:action:{}"`

## Tips

1. **Use watch mode during development** for instant feedback
2. **Check exit codes** in scripts to handle errors properly
3. **Keep TSX files simple** - complex expressions may not convert perfectly
4. **Use the example.tsx** as a reference for supported patterns

## Troubleshooting

**Q: The CLI doesn't recognize my component**
A: Make sure you have a default export or the component is the first JSX element in the file.

**Q: Props aren't converting correctly**
A: Check that you're using supported prop types (literals, objects, arrays). Complex expressions may need simplification.

**Q: Watch mode isn't detecting changes**
A: Ensure the file path is correct and the file system supports file watching. Try saving the file again.

**Q: Getting "MODULE_NOT_FOUND" error**
A: Run `npm install` in the `tools/codegen` directory to install dependencies.

## Next Steps

After generating a schema:
1. Start the Dev-Proxy server
2. Connect your Flutter-Dev-Client via QR code
3. Push the schema to see it rendered on your device

See the main README for complete workflow instructions.
