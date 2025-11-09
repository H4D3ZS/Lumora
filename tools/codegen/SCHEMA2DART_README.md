# Schema2Dart Generator

The `schema2dart` command converts JSON UI schemas to production-ready Dart code with Clean Architecture structure and state management patterns.

## Features

- ✅ Converts JSON schemas to native Flutter widgets
- ✅ Supports 4 state management adapters: Bloc, Riverpod, Provider, GetX
- ✅ Generates Clean Architecture file structure
- ✅ Creates domain, data, and presentation layers
- ✅ Includes state management boilerplate
- ✅ Maps UI primitives to Flutter widgets using ui-mapping.json

## Usage

```bash
kiro schema2dart <schema.json> <output-dir> [options]
```

### Arguments

- `<schema.json>` - Path to input JSON schema file
- `<output-dir>` - Output directory for generated Dart files

### Options

- `-a, --adapter <adapter>` - State management adapter (default: "bloc")
  - `bloc` - Flutter Bloc pattern with events, states, and blocs
  - `riverpod` - Riverpod with StateNotifier
  - `provider` - Provider with ChangeNotifier
  - `getx` - GetX with controllers and bindings
- `-f, --feature <name>` - Feature name for generated files (default: "feature")

## Examples

### Generate with Bloc adapter

```bash
kiro schema2dart my-schema.json ./output -a bloc -f UserProfile
```

Generates:
```
output/
  lib/
    features/
      userprofile/
        domain/
          entities/
          usecases/
        data/
          models/
          repositories/
        presentation/
          bloc/
            userprofile_event.dart
            userprofile_state.dart
            userprofile_bloc.dart
          pages/
            userprofile_page.dart
          widgets/
```

### Generate with Riverpod adapter

```bash
kiro schema2dart my-schema.json ./output -a riverpod -f Dashboard
```

Generates:
```
output/
  lib/
    features/
      dashboard/
        domain/
          entities/
          usecases/
        data/
          models/
          repositories/
        presentation/
          providers/
            dashboard_provider.dart
          pages/
            dashboard_page.dart
          widgets/
```

### Generate with Provider adapter

```bash
kiro schema2dart my-schema.json ./output -a provider -f Settings
```

Generates:
```
output/
  lib/
    features/
      settings/
        domain/
          entities/
          usecases/
        data/
          models/
          repositories/
        presentation/
          notifiers/
            settings_notifier.dart
          pages/
            settings_page.dart
          widgets/
```

### Generate with GetX adapter

```bash
kiro schema2dart my-schema.json ./output -a getx -f Home
```

Generates:
```
output/
  lib/
    features/
      home/
        domain/
          entities/
          usecases/
        data/
          models/
          repositories/
        presentation/
          controllers/
            home_controller.dart
          bindings/
            home_binding.dart
          pages/
            home_page.dart
          widgets/
```

## Widget Mapping

The generator uses `ui-mapping.json` to map schema types to Flutter widgets:

| Schema Type | Flutter Widget | Props Transformation |
|-------------|----------------|---------------------|
| View | Container | padding → EdgeInsets.all, backgroundColor → Color |
| Text | Text | text → data, style → TextStyle |
| Button | ElevatedButton | title → child, onTap → onPressed |
| List | ListView | children → children |
| Image | Image.network | src → url |
| Input | TextField | placeholder → decoration.hintText |

## Clean Architecture Structure

All generated code follows Clean Architecture principles:

- **Domain Layer**: Business logic, entities, and use cases
- **Data Layer**: Data models and repository implementations
- **Presentation Layer**: UI pages, widgets, and state management

## State Management Patterns

### Bloc Pattern

- **Events**: User actions and system events
- **States**: UI states (Initial, Loading, Loaded, Error)
- **Bloc**: Business logic that transforms events into states
- **Page**: BlocProvider and BlocBuilder for UI

### Riverpod Pattern

- **Provider**: StateNotifier for state management
- **State**: Immutable state class with copyWith
- **Page**: ConsumerWidget with ref.watch

### Provider Pattern

- **Notifier**: ChangeNotifier for state management
- **Page**: ChangeNotifierProvider and Consumer

### GetX Pattern

- **Controller**: GetX controller with reactive state
- **Binding**: Dependency injection bindings
- **Page**: GetView with Obx for reactive UI

## Error Handling

The generator includes comprehensive error handling:

- **Invalid adapter**: Shows list of valid adapters
- **Missing schema file**: Clear error message with file path
- **Unwritable output directory**: Permission error with suggestion
- **Invalid schema format**: JSON parsing error details

## Exit Codes

- `0` - Success
- `1` - Invalid arguments or configuration
- `2` - Parse error
- `3` - File system error
- `4` - Generation error

## Next Steps

After generating code:

1. Add the generated feature to your Flutter app
2. Install required dependencies in `pubspec.yaml`:
   - Bloc: `flutter_bloc`, `equatable`
   - Riverpod: `flutter_riverpod`
   - Provider: `provider`
   - GetX: `get`
3. Implement business logic in the generated files
4. Add entities and use cases in the domain layer
5. Implement data models and repositories in the data layer

## Tips

- Use descriptive feature names (e.g., "UserProfile", "ProductList")
- Feature names are automatically converted to lowercase for file names
- The widget code is embedded in the page's `_buildContent` method
- Customize the generated code to add your business logic
- The domain and data layers are scaffolded but need implementation

## See Also

- [tsx2schema command](./CLI_GUIDE.md#tsx2schema) - Convert TSX to JSON schema
- [ui-mapping.json](./ui-mapping.json) - Widget mapping configuration
- [Templates](./templates/) - Handlebars templates for each adapter
