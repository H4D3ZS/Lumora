# Lumora CLI

Command-line interface for converting between React and Flutter using Lumora IR (Intermediate Representation).

## Installation

```bash
cd packages/lumora_ir
npm install
npm run build
npm link  # Optional: makes 'lumora' command available globally
```

## Commands

### `lumora convert`

Convert a file between React and Flutter.

#### Usage

```bash
lumora convert <input> [output] [options]
```

#### Arguments

- `<input>` - Input file path (React `.tsx` or Flutter `.dart`)
- `[output]` - Output file path (optional, auto-generated if not provided)

#### Options

- `-d, --dry-run` - Show what would be converted without writing files
- `-t, --target <framework>` - Target framework (`react` or `flutter`, auto-detected if not provided)
- `-w, --watch` - Watch for file changes and auto-convert
- `-h, --help` - Display help for command

#### Examples

**Convert React to Flutter:**
```bash
lumora convert src/components/Button.tsx
# Output: src/components/Button.dart
```

**Convert Flutter to React:**
```bash
lumora convert lib/widgets/button.dart
# Output: lib/widgets/button.tsx
```

**Specify custom output path:**
```bash
lumora convert src/Button.tsx output/Button.dart
```

**Dry run (preview without writing):**
```bash
lumora convert src/Button.tsx --dry-run
```

**Watch mode (auto-convert on file changes):**
```bash
lumora convert src/Button.tsx --watch
```

**Specify target framework explicitly:**
```bash
lumora convert src/Button.tsx --target flutter
```

## Error Handling

The CLI provides clear error messages with suggestions:

### File Not Found
```
✗ Error: Input file not found: src/Button.tsx

💡 Suggestions:
  • Verify the file path is correct
  • Check that the file exists and is readable
```

### Parse Error
```
✗ Parse Error: Unexpected token (15:4)
  at line 15, column 4

💡 Suggestions:
  • Check your TSX syntax
  • Ensure all brackets and parentheses are balanced
  • Verify imports are correct
```

### Validation Error
```
✗ Validation Error: IR structure is invalid
  1. nodes[0].type: must be string
  2. nodes[0].props: must be object

💡 Suggestions:
  • The generated IR structure is invalid
  • This may indicate an issue with the parser
  • Try simplifying your component and converting again
```

### Generation Error
```
✗ Generation Error: Cannot convert widget type 'CustomWidget'

💡 Suggestions:
  • The IR could not be converted to Flutter
  • Some features may not be supported yet
  • Check the IR structure for unsupported patterns
```

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Parse error
- `3` - File not found
- `4` - Conversion error
- `5` - Validation error

## Watch Mode

Watch mode continuously monitors the input file for changes and automatically reconverts:

```bash
lumora convert src/Button.tsx --watch
```

Output:
```
🔄 Converting react → flutter
   Input: src/Button.tsx
   Output: src/Button.dart

  → Parsing React file: src/Button.tsx
  ✓ Parsed React component
  → Validating IR structure
  ✓ IR validated successfully
  → Generating Flutter code: src/Button.dart
  ✓ Generated Flutter widget

✓ Conversion complete!
   Output: src/Button.dart

👀 Watching src/Button.tsx for changes... (Press Ctrl+C to stop)

[2025-11-10T05:14:01.621Z] File changed, reconverting...
...
```

Press `Ctrl+C` to stop watching.

## Dry Run Mode

Dry run mode shows what would be converted without actually writing files:

```bash
lumora convert src/Button.tsx --dry-run
```

Output:
```
🔄 Converting react → flutter
   Input: src/Button.tsx
   Output: src/Button.dart
   Mode: DRY RUN (no files will be written)

  → Parsing React file: src/Button.tsx
  ✓ Parsed React component
  → Validating IR structure
  ✓ IR validated successfully
  → Would generate flutter code (skipped in dry-run mode)

✓ Conversion complete!

📋 Dry run summary:
   • Source framework: react
   • Target file: src/Button.dart
   • IR nodes: 5

   Run without --dry-run to write the file
```

## Framework Detection

The CLI automatically detects the source framework based on file extension:

- `.tsx`, `.jsx`, `.ts`, `.js` → React
- `.dart` → Flutter

The target framework is automatically determined as the opposite of the source framework, unless explicitly specified with `--target`.

## Integration with Build Tools

### npm scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "convert": "lumora convert",
    "convert:watch": "lumora convert --watch"
  }
}
```

### Pre-commit hooks

Use with tools like `husky` to convert files before committing:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lumora convert src/**/*.tsx"
    }
  }
}
```

## Debugging

Set the `DEBUG` environment variable to see detailed error information:

```bash
DEBUG=1 lumora convert src/Button.tsx
```

## Requirements

- Node.js 16+
- TypeScript 5+
- For React files: Valid TSX/JSX syntax
- For Flutter files: Valid Dart syntax

## Limitations

Current implementation uses placeholder converters. In production, these would be replaced with:

- `TSXToIR` from `tools/codegen` for React parsing
- `FlutterToIR` from `tools/codegen` for Flutter parsing
- `IRToReact` from `tools/codegen` for React generation
- `IRToFlutter` from `tools/codegen` for Flutter generation

## Related Documentation

- [Lumora IR Specification](./README.md)
- [Widget Mapping Registry](./src/registry/README.md)
- [Bidirectional Sync](./SYNC_ENGINE_IMPLEMENTATION.md)
- [Conflict Resolution](./CONFLICT_RESOLUTION_IMPLEMENTATION.md)

## Support

For issues and questions:
- Check the [main README](../../README.md)
- Review [examples](./examples/)
- Open an issue on GitHub
