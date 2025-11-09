# Codegen-Tool

Command-line tool that converts React TSX files to JSON UI schemas and generates production Dart code with state management patterns.

## Purpose

The Codegen-Tool bridges React/TSX development with Flutter by providing two key capabilities:
1. **TSX to Schema**: Convert React components to JSON UI schemas for instant preview
2. **Schema to Dart**: Generate production-ready Flutter code with proper state management

## Features

- **TSX Parsing**: Parse React/TSX files using Babel AST
- **Schema Generation**: Convert JSX to normalized JSON schemas
- **Watch Mode**: Auto-regenerate schemas on file changes
- **Dart Code Generation**: Generate Flutter code from schemas
- **State Management**: Support for Bloc, Riverpod, Provider, and GetX
- **Clean Architecture**: Generate proper domain/data/presentation structure
- **Project Scaffolding**: Create new projects with templates
- **Custom Mappings**: Configurable widget and prop transformations

## Installation

```bash
cd tools/codegen
npm install
```

## CLI Commands

### tsx2schema - Convert TSX to JSON Schema

Convert a TSX file to a JSON UI schema that can be interpreted by the Flutter-Dev-Client.

**Basic Usage**:
```bash
node cli.js tsx2schema <input.tsx> <output.json>
```

**Watch Mode**:
```bash
node cli.js tsx2schema <input.tsx> <output.json> --watch
```

**Examples**:
```bash
# Convert a single file
node cli.js tsx2schema examples/todo-app/App.tsx schema.json

# Watch for changes and auto-regenerate
node cli.js tsx2schema src/App.tsx schema.json --watch
```

**Arguments**:
- `<input>` - Path to the input TSX file
- `<output>` - Path to the output JSON schema file

**Options**:
- `-w, --watch` - Watch for file changes and regenerate automatically
- `-h, --help` - Display help for command

**Exit Codes**:
- `0` - Success
- `1` - Invalid arguments or configuration
- `2` - Parse error (invalid TSX syntax)
- `3` - File system error (file not found, permission denied)
- `4` - Generation error (no JSX found, conversion failed)

### schema2dart - Generate Dart Code

Generate production Dart code from JSON schemas with state management patterns.

**Basic Usage**:
```bash
node cli.js schema2dart <schema.json> <output-dir> [options]
```

**Options**:
- `-a, --adapter <adapter>` - State management adapter: bloc, riverpod, provider, getx (default: bloc)
- `-f, --feature <name>` - Feature name for generated files (default: feature)
- `-h, --help` - Display help for command

**Examples**:
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

**Generated Structure** (Bloc example):
```
output/
└── lib/
    └── features/
        └── user_profile/
            ├── domain/
            │   ├── entities/
            │   └── usecases/
            ├── data/
            │   ├── models/
            │   └── repositories/
            └── presentation/
                ├── bloc/
                │   ├── user_profile_bloc.dart
                │   ├── user_profile_event.dart
                │   └── user_profile_state.dart
                ├── pages/
                │   └── user_profile_page.dart
                └── widgets/
```

### create-app - Scaffold New Projects

Create a new Lumora project with template files and directory structure.

**Basic Usage**:
```bash
node cli.js create-app <app-name> [options]
```

**Options**:
- `-a, --adapter <adapter>` - State management adapter: bloc, riverpod, provider, getx (default: bloc)
- `-d, --dir <directory>` - Target directory (default: current directory)
- `-h, --help` - Display help for command

**Examples**:
```bash
# Create app with Bloc adapter (default)
node cli.js create-app my_app

# Create app with Riverpod adapter
node cli.js create-app my_app --adapter=riverpod

# Create app in specific directory
node cli.js create-app my_app --adapter=bloc --dir=~/projects
```

**Generated Structure**:
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

**Requirements**:
- App name must start with lowercase letter
- Only lowercase letters, numbers, and underscores allowed
- Directory must not already exist
- Scaffolding completes within 30 seconds

## Supported JSX Primitives

The Codegen-Tool supports the following JSX primitives:

### View
Container component with layout properties.

**TSX**:
```tsx
<View padding={16} backgroundColor="#FFFFFF">
  {children}
</View>
```

**Schema**:
```json
{
  "type": "View",
  "props": {
    "padding": 16,
    "backgroundColor": "#FFFFFF"
  },
  "children": [...]
}
```

### Text
Text display with styling.

**TSX**:
```tsx
<Text 
  text="Hello World" 
  style={{ fontSize: 24, fontWeight: "bold" }}
/>
```

**Schema**:
```json
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
```

### Button
Interactive button with tap handler.

**TSX**:
```tsx
<Button 
  title="Click Me" 
  onTap={() => console.log('clicked')}
/>
```

**Schema**:
```json
{
  "type": "Button",
  "props": {
    "title": "Click Me",
    "onTap": "emit:buttonClicked:{}"
  },
  "children": []
}
```

### List
Scrollable list container.

**TSX**:
```tsx
<List scrollDirection="vertical">
  {items.map(item => <Text key={item.id} text={item.name} />)}
</List>
```

**Schema**:
```json
{
  "type": "List",
  "props": {
    "scrollDirection": "vertical"
  },
  "children": [...]
}
```

### Image
Image display with network loading.

**TSX**:
```tsx
<Image 
  src="https://example.com/image.png" 
  width={200} 
  height={200}
  fit="cover"
/>
```

**Schema**:
```json
{
  "type": "Image",
  "props": {
    "src": "https://example.com/image.png",
    "width": 200,
    "height": 200,
    "fit": "cover"
  },
  "children": []
}
```

### Input
Text input field.

**TSX**:
```tsx
<Input 
  placeholder="Enter text..." 
  onChange={(value) => handleChange(value)}
/>
```

**Schema**:
```json
{
  "type": "Input",
  "props": {
    "placeholder": "Enter text...",
    "onChange": "emit:inputChanged:{}"
  },
  "children": []
}
```

## Supported Props

The TSX parser supports various prop types:

### String Literals
```tsx
<Text text="Hello" />
```

### Numeric Literals
```tsx
<View padding={16} />
```

### Boolean Literals
```tsx
<Button disabled={true} />
```

### Object Expressions
```tsx
<Text style={{ fontSize: 24, fontWeight: "bold" }} />
```

### Array Expressions
```tsx
<List items={[1, 2, 3]} />
```

### Template Literals
```tsx
<Text text={`Hello, ${name}!`} />
```
Converted to: `"Hello, {{name}}!"`

### Event Handlers
```tsx
<Button onTap={() => handleClick()} />
```
Converted to: `"emit:buttonClicked:{}"`

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

## Watch Mode

Watch mode monitors the input file for changes and automatically regenerates the schema.

**Features**:
- Detects file changes within 1 second
- Logs regeneration events with timestamps
- Continues watching until process is terminated (Ctrl+C)
- Uses `chokidar` for reliable file watching across platforms

**Example Output**:
```
[2025-11-09T09:25:06.970Z] Converting input.tsx to output.json...
✓ Schema generated successfully: output.json

👀 Watching input.tsx for changes... (Press Ctrl+C to stop)

[2025-11-09T09:25:08.908Z] Converting input.tsx to output.json...
✓ Schema generated successfully: output.json
```

## State Management Adapters

The Codegen-Tool supports four state management patterns:

### Bloc

**Best For**: Medium to large projects requiring structure and testability

**Generated Files**:
- `feature_event.dart` - Event classes
- `feature_state.dart` - State classes
- `feature_bloc.dart` - Business logic
- `feature_page.dart` - UI with BlocProvider and BlocBuilder

**Example**:
```dart
class UserProfileBloc extends Bloc<UserProfileEvent, UserProfileState> {
  UserProfileBloc() : super(UserProfileInitial()) {
    on<LoadUserProfile>(_onLoadUserProfile);
  }
  
  Future<void> _onLoadUserProfile(
    LoadUserProfile event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(UserProfileLoading());
    // Business logic here
    emit(UserProfileLoaded(user));
  }
}
```

### Riverpod

**Best For**: Modern, scalable applications with modular architecture

**Generated Files**:
- `feature_provider.dart` - StateNotifier and providers
- `feature_page.dart` - UI with ConsumerWidget

**Example**:
```dart
final userProfileProvider = StateNotifierProvider<UserProfileNotifier, UserProfileState>(
  (ref) => UserProfileNotifier(),
);

class UserProfileNotifier extends StateNotifier<UserProfileState> {
  UserProfileNotifier() : super(UserProfileInitial());
  
  Future<void> loadUserProfile() async {
    state = UserProfileLoading();
    // Business logic here
    state = UserProfileLoaded(user);
  }
}
```

### Provider

**Best For**: Small projects with simple state management needs

**Generated Files**:
- `feature_notifier.dart` - ChangeNotifier class
- `feature_page.dart` - UI with ChangeNotifierProvider and Consumer

**Example**:
```dart
class UserProfileNotifier extends ChangeNotifier {
  UserProfileState _state = UserProfileInitial();
  
  UserProfileState get state => _state;
  
  Future<void> loadUserProfile() async {
    _state = UserProfileLoading();
    notifyListeners();
    // Business logic here
    _state = UserProfileLoaded(user);
    notifyListeners();
  }
}
```

### GetX

**Best For**: Rapid development with minimal boilerplate

**Generated Files**:
- `feature_controller.dart` - Controller class
- `feature_binding.dart` - Dependency injection
- `feature_page.dart` - UI with GetX widgets

**Example**:
```dart
class UserProfileController extends GetxController {
  final state = UserProfileInitial().obs;
  
  Future<void> loadUserProfile() async {
    state.value = UserProfileLoading();
    // Business logic here
    state.value = UserProfileLoaded(user);
  }
}
```

## UI Mapping Configuration

The `ui-mapping.json` file defines how schema types map to Dart widgets:

```json
{
  "View": {
    "dart": "Container",
    "props": {
      "padding": "EdgeInsets.all",
      "margin": "EdgeInsets.all",
      "backgroundColor": "Color"
    }
  },
  "Text": {
    "dart": "Text",
    "props": {
      "text": "data",
      "style": "TextStyle"
    }
  },
  "Button": {
    "dart": "ElevatedButton",
    "props": {
      "title": "child",
      "onTap": "onPressed"
    }
  }
}
```

### Custom Mappings

You can extend the mappings in `kiro.config.json`:

```json
{
  "adapter": "bloc",
  "mappings": {
    "customComponents": {
      "Card": {
        "dart": "Card",
        "props": {
          "elevation": "elevation",
          "borderRadius": "shape"
        }
      }
    }
  }
}
```

## Error Handling

The CLI provides clear error messages for common issues:

### Missing Input File
```
✗ Error: Input file not found: nonexistent.tsx
Exit Code: 3
```

### Parse Error
```
✗ Parse Error: Unexpected token, expected "}" (4:12)
  at line 4, column 12
Exit Code: 2
```

### No JSX Found
```
✗ Generation Error: No JSX element found in the file. Make sure your component returns JSX.
Exit Code: 4
```

### Permission Error
```
✗ Error: Output directory is not writable: /readonly-dir
Exit Code: 3
```

### Invalid Adapter
```
✗ Error: Invalid adapter 'invalid'. Choose from: bloc, riverpod, provider, getx
Exit Code: 1
```

## How It Works

### TSX to Schema Conversion

1. **Parse TSX**: Uses `@babel/parser` with JSX and TypeScript plugins
2. **Find Root Element**: Locates the top-level JSX element in the default export
3. **Convert to Schema**: Walks the JSX tree recursively
4. **Extract Props**: Converts JSX attributes to JSON props
5. **Process Children**: Recursively processes child elements
6. **Write Output**: Writes the normalized schema to file

### Schema to Dart Generation

1. **Load Schema**: Reads the JSON schema file
2. **Load Mappings**: Reads ui-mapping.json for transformations
3. **Load Templates**: Loads Handlebars templates for the chosen adapter
4. **Generate Code**: Applies templates with schema data
5. **Transform Props**: Maps prop names according to ui-mapping.json
6. **Write Files**: Writes generated Dart files to output directory

## Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Troubleshooting

### TSX Parsing Issues

**Problem**: Parse error in TSX file

**Solutions**:
- Check for syntax errors in the TSX file
- Ensure proper JSX closing tags
- Verify TypeScript types are valid
- Check for unsupported JSX features

### Schema Generation Issues

**Problem**: No JSX found in file

**Solutions**:
- Ensure the file has a default export
- Check that the component returns JSX
- Verify the JSX is at the top level of the export

### Dart Generation Issues

**Problem**: Generated code doesn't compile

**Solutions**:
- Check ui-mapping.json for correct mappings
- Verify the schema structure is valid
- Ensure the adapter templates are correct
- Check for missing imports in generated files

### Watch Mode Issues

**Problem**: Changes not detected

**Solutions**:
- Verify the file path is correct
- Check file system permissions
- Try restarting watch mode
- Check for file system watcher limits (Linux)

## Performance

- **Fast Parsing**: Babel parser is highly optimized
- **Incremental Updates**: Watch mode only processes changed files
- **Template Caching**: Handlebars templates are cached
- **Efficient File I/O**: Batch writes for multiple files

## Architecture

The Codegen-Tool consists of three main modules:

### TSX Parser (`tsx-parser.js`)
- Parses TSX files using Babel
- Extracts JSX elements and props
- Converts to normalized schema format

### Dart Generator (`dart-generator.js`)
- Loads schema and mapping files
- Applies Handlebars templates
- Generates Dart code with proper structure

### Create App (`create-app.js`)
- Scaffolds new project structure
- Copies template files
- Customizes configuration files

## Contributing

Contributions are welcome! Please ensure:
- Code follows JavaScript style guidelines
- Tests are included for new features
- Documentation is updated
- Examples are provided

## License

MIT License - see [LICENSE](../../LICENSE) for details
