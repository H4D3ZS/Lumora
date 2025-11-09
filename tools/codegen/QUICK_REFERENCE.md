# Lumora Codegen - Quick Reference Card

## Commands

### tsx2schema - Convert TSX to JSON Schema

```bash
node cli.js tsx2schema <input.tsx> <output.json> [--watch]
```

**Examples:**
```bash
# Basic conversion
node cli.js tsx2schema App.tsx schema.json

# Watch mode (auto-regenerate on changes)
node cli.js tsx2schema App.tsx schema.json --watch
```

### schema2dart - Generate Dart Code

```bash
node cli.js schema2dart <schema.json> <output-dir> -a <adapter> -f <feature>
```

**Adapters:** `bloc` | `riverpod` | `provider` | `getx`

**Examples:**
```bash
# Bloc (default)
node cli.js schema2dart schema.json ./app -a bloc -f Home

# Riverpod
node cli.js schema2dart schema.json ./app -a riverpod -f Profile

# Provider
node cli.js schema2dart schema.json ./app -a provider -f Settings

# GetX
node cli.js schema2dart schema.json ./app -a getx -f Dashboard
```

## Supported Widgets

| TSX | Flutter | Props |
|-----|---------|-------|
| `<View>` | `Container` | padding, margin, backgroundColor, width, height |
| `<Text>` | `Text` | text, style (fontSize, fontWeight, color), textAlign |
| `<Button>` | `ElevatedButton` | title, onTap |
| `<List>` | `ListView` | children, scrollDirection |
| `<Image>` | `Image.network` | src, width, height |
| `<Input>` | `TextField` | placeholder, onChange |

## Generated Structure

```
lib/
  features/
    {feature}/
      domain/
        entities/
        usecases/
      data/
        models/
        repositories/
      presentation/
        {adapter}/     # bloc/, providers/, notifiers/, controllers/
        pages/
        widgets/
```

## Adapter Dependencies

Add to `pubspec.yaml`:

```yaml
# Bloc
flutter_bloc: ^8.1.3
equatable: ^2.0.5

# Riverpod
flutter_riverpod: ^2.4.0

# Provider
provider: ^6.0.5

# GetX
get: ^4.6.5
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Invalid arguments |
| 2 | Parse error |
| 3 | File system error |
| 4 | Generation error |

## Common Workflows

### Development (Fast Path)
```bash
# 1. Start Dev-Proxy
cd tools/dev-proxy && npm start

# 2. Watch TSX (auto-generate schema)
cd tools/codegen
node cli.js tsx2schema src/App.tsx schema.json --watch

# 3. Push schema to device
curl -X POST http://localhost:3000/send/{sessionId} \
  -H "Content-Type: application/json" \
  -d @schema.json
```

### Production (Native Path)
```bash
# 1. Convert TSX to schema
node cli.js tsx2schema src/App.tsx schema.json

# 2. Generate Dart code
node cli.js schema2dart schema.json ./my-app -a bloc -f App

# 3. Build Flutter app
cd my-app
flutter pub get
flutter build apk  # or: flutter build ios
```

## Tips

- Use `--watch` during development for instant feedback
- Choose adapter based on project size:
  - Small: Provider or GetX
  - Medium: Bloc or Riverpod
  - Large: Bloc or Riverpod
- Feature names are auto-converted to lowercase for files
- Generated code includes TODO comments for business logic
- Domain and data layers are scaffolded but need implementation

## Documentation

- [CLI_GUIDE.md](./CLI_GUIDE.md) - Complete CLI documentation
- [SCHEMA2DART_README.md](./SCHEMA2DART_README.md) - Detailed schema2dart guide
- [WORKFLOW_EXAMPLE.md](./WORKFLOW_EXAMPLE.md) - Complete workflow example
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Implementation details

## Help

```bash
# Show help
node cli.js --help
node cli.js tsx2schema --help
node cli.js schema2dart --help
```
