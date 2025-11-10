# Lumora CLI - Quick Reference

## Installation
```bash
cd packages/lumora_ir
npm install && npm run build
npm link  # Optional: global access
```

## Basic Usage

### Convert React → Flutter
```bash
lumora convert src/Button.tsx
# Output: src/Button.dart
```

### Convert Flutter → React
```bash
lumora convert lib/button.dart
# Output: lib/button.tsx
```

### Custom Output
```bash
lumora convert src/Button.tsx output/Button.dart
```

## Options

| Flag | Description | Example |
|------|-------------|---------|
| `-d, --dry-run` | Preview without writing | `lumora convert file.tsx --dry-run` |
| `-t, --target` | Specify target framework | `lumora convert file.tsx --target flutter` |
| `-w, --watch` | Watch for changes | `lumora convert file.tsx --watch` |
| `-h, --help` | Show help | `lumora convert --help` |
| `-V, --version` | Show version | `lumora --version` |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Parse error |
| 3 | File not found |
| 4 | Conversion error |
| 5 | Validation error |

## Common Workflows

### Development Workflow
```bash
# Start watch mode
lumora convert src/App.tsx --watch

# Edit src/App.tsx in your editor
# Changes auto-convert to src/App.dart
```

### Preview Changes
```bash
# See what would be generated
lumora convert src/Button.tsx --dry-run

# If satisfied, run without --dry-run
lumora convert src/Button.tsx
```

### Batch Conversion (via script)
```bash
# Create a script
for file in src/**/*.tsx; do
  lumora convert "$file"
done
```

## Error Examples

### File Not Found
```
✗ Error: Input file not found: src/Button.tsx
```
**Fix:** Check file path and permissions

### Invalid Target
```
✗ Error: Invalid target framework: angular
  Valid options: react, flutter
```
**Fix:** Use `react` or `flutter`

### Parse Error
```
✗ Parse Error: Unexpected token (15:4)
  at line 15, column 4
```
**Fix:** Check syntax at specified line

## Tips

1. **Use watch mode** during development for instant feedback
2. **Use dry-run** to preview before committing changes
3. **Set DEBUG=1** for detailed error information
4. **Check exit codes** in scripts for error handling

## Integration

### npm scripts
```json
{
  "scripts": {
    "convert": "lumora convert",
    "convert:watch": "lumora convert src/App.tsx --watch"
  }
}
```

### Pre-commit hook
```bash
#!/bin/sh
lumora convert src/**/*.tsx
```

## Help

```bash
lumora --help              # General help
lumora convert --help      # Command-specific help
```

## Documentation

- Full CLI docs: [CLI_README.md](./CLI_README.md)
- Implementation: [TASK_14_CLI_IMPLEMENTATION_SUMMARY.md](./TASK_14_CLI_IMPLEMENTATION_SUMMARY.md)
- Main docs: [README.md](./README.md)
