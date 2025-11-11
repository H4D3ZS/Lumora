# State Management Adapters

This module provides adapters for converting state definitions to different Flutter state management patterns.

## Supported Adapters

- **Bloc**: Business Logic Component pattern with events and states
- **Riverpod**: Modern provider-based state management
- **Provider**: Classic ChangeNotifier pattern

## Usage

### Basic Usage

```typescript
import { getAdapter, StateDefinition } from '@lumora/ir';

// Define your state
const state: StateDefinition = {
  type: 'global',
  variables: [
    { name: 'count', type: 'number', initialValue: 0, mutable: true },
    { name: 'message', type: 'string', initialValue: 'Hello', mutable: true },
  ],
};

// Get an adapter
const adapter = getAdapter('bloc'); // or 'riverpod' or 'provider'

// Generate Flutter code
const result = adapter.convertToFlutter(state, 'Counter');

console.log(result.stateClass);
console.log(result.eventClasses); // Only for Bloc
console.log(result.providerCode);
console.log(result.imports);
console.log(result.usage);
```

### Using Specific Adapters

#### Bloc Adapter

```typescript
import { BlocAdapter } from '@lumora/ir';

const adapter = new BlocAdapter();
const result = adapter.convertToFlutter(state, 'Counter');

// Generated code includes:
// - State class with Equatable
// - Event classes for each mutable variable
// - Bloc class with event handlers
```

**Generated Bloc Code:**

```dart
// State Class
class CounterState extends Equatable {
  final double count;
  final String message;

  const CounterState({
    required this.count,
    required this.message,
  });

  CounterState copyWith({
    double? count,
    String? message,
  }) {
    return CounterState(
      count: count ?? this.count,
      message: message ?? this.message,
    );
  }

  @override
  List<Object?> get props => [count, message];
}

// Event Classes
abstract class CounterEvent extends Equatable {
  const CounterEvent();
  @override
  List<Object?> get props => [];
}

class UpdateCountEvent extends CounterEvent {
  final double count;
  const UpdateCountEvent(this.count);
  @override
  List<Object?> get props => [count];
}

// Bloc Class
class CounterBloc extends Bloc<CounterEvent, CounterState> {
  CounterBloc() : super(CounterState(
    count: 0,
    message: 'Hello',
  )) {
    on<UpdateCountEvent>(_onUpdateCount);
    on<UpdateMessageEvent>(_onUpdateMessage);
  }

  void _onUpdateCount(
    UpdateCountEvent event,
    Emitter<CounterState> emit,
  ) {
    emit(state.copyWith(count: event.count));
  }
}
```

#### Riverpod Adapter

```typescript
import { RiverpodAdapter } from '@lumora/ir';

const adapter = new RiverpodAdapter();
const result = adapter.convertToFlutter(state, 'Counter');

// Generated code includes:
// - State class with copyWith
// - StateNotifier class with update methods
// - Provider definition
```

**Generated Riverpod Code:**

```dart
// State Class
class CounterState {
  final double count;
  final String message;

  const CounterState({
    required this.count,
    required this.message,
  });

  CounterState copyWith({
    double? count,
    String? message,
  }) {
    return CounterState(
      count: count ?? this.count,
      message: message ?? this.message,
    );
  }
}

// StateNotifier
class CounterNotifier extends StateNotifier<CounterState> {
  CounterNotifier() : super(CounterState(
    count: 0,
    message: 'Hello',
  ));

  void updateCount(double value) {
    state = state.copyWith(count: value);
  }

  void updateMessage(String value) {
    state = state.copyWith(message: value);
  }
}

// Provider
final counterProvider = StateNotifierProvider<CounterNotifier, CounterState>((ref) {
  return CounterNotifier();
});
```

#### Provider Adapter

```typescript
import { ProviderAdapter } from '@lumora/ir';

const adapter = new ProviderAdapter();
const result = adapter.convertToFlutter(state, 'Counter');

// Generated code includes:
// - ChangeNotifier class with private variables
// - Public getters
// - Setter methods with notifyListeners
```

**Generated Provider Code:**

```dart
class CounterProvider extends ChangeNotifier {
  double _count = 0;
  String _message = 'Hello';

  double get count => _count;
  String get message => _message;

  void setCount(double value) {
    _count = value;
    notifyListeners();
  }

  void setMessage(String value) {
    _message = value;
    notifyListeners();
  }
}
```

### Configuration Options

```typescript
const result = adapter.convertToFlutter(state, 'Counter', {
  preserveComments: true,    // Include documentation comments
  generateTests: false,       // Generate test files (future)
  includeImports: true,       // Include usage examples
});
```

### Adapter Registry

```typescript
import { getAllAdapters, isValidAdapterType } from '@lumora/ir';

// Get all available adapters
const adapters = getAllAdapters();
adapters.forEach(adapter => {
  console.log(adapter.name);
});

// Validate adapter type
if (isValidAdapterType('bloc')) {
  const adapter = getAdapter('bloc');
}
```

### Converting Back to State Definition

```typescript
const dartCode = `
class CounterState extends Equatable {
  final int count;
  final String message;
}`;

const state = adapter.convertFromFlutter(dartCode, 'Counter');
console.log(state.variables);
```

## Type Mapping

The adapters automatically map TypeScript types to Flutter/Dart types:

| TypeScript | Flutter/Dart |
|------------|--------------|
| `string` | `String` |
| `number` | `double` |
| `boolean` | `bool` |
| `string[]` | `List<String>` |
| `Array<number>` | `List<double>` |
| `object` | `Map<String, dynamic>` |
| `any` | `dynamic` |

## Initial Value Formatting

Initial values are automatically formatted for Dart:

```typescript
{ name: 'str', type: 'string', initialValue: 'test' }
// → str: 'test'

{ name: 'num', type: 'number', initialValue: 42 }
// → num: 42

{ name: 'bool', type: 'boolean', initialValue: true }
// → bool: true

{ name: 'arr', type: 'string[]', initialValue: ['a', 'b'] }
// → arr: ['a', 'b']

{ name: 'obj', type: 'object', initialValue: { key: 'value' } }
// → obj: {'key': 'value'}
```

## Integration with StateBridge

The adapters work seamlessly with the existing StateBridge:

```typescript
import { StateBridge } from '@lumora/ir';

const bridge = new StateBridge({ targetAdapter: 'bloc' });
const flutterCode = bridge.convertReactToFlutter(state, 'Counter');
```

## Best Practices

1. **Choose the right adapter**: 
   - Use **Bloc** for complex business logic with clear event flows
   - Use **Riverpod** for modern, testable, and composable state
   - Use **Provider** for simple state management needs

2. **Immutable state**: All adapters generate immutable state classes with `copyWith` methods

3. **Type safety**: Leverage TypeScript types for better code generation

4. **Testing**: Generated code is designed to be easily testable

## Examples

See the `examples/` directory for complete working examples:

- `examples/bloc-counter/` - Counter app with Bloc
- `examples/riverpod-todo/` - Todo app with Riverpod
- `examples/provider-theme/` - Theme switcher with Provider

## Dependencies

Make sure to add the required dependencies to your Flutter project:

### For Bloc:
```yaml
dependencies:
  flutter_bloc: ^8.1.0
  equatable: ^2.0.5
```

### For Riverpod:
```yaml
dependencies:
  flutter_riverpod: ^2.3.0
```

### For Provider:
```yaml
dependencies:
  provider: ^6.0.5
```

## API Reference

### StateAdapter Interface

```typescript
interface StateAdapter {
  readonly name: string;
  
  convertToFlutter(
    state: StateDefinition,
    componentName: string,
    config?: AdapterConfig
  ): GeneratedCode;
  
  convertFromFlutter(
    dartCode: string,
    componentName: string
  ): StateDefinition;
  
  generateUsageExample(componentName: string): string;
}
```

### GeneratedCode Interface

```typescript
interface GeneratedCode {
  stateClass: string;        // State class code
  eventClasses?: string;     // Event classes (Bloc only)
  providerCode?: string;     // Provider/Bloc/Notifier code
  imports: string[];         // Required imports
  usage?: string;            // Usage example
}
```

### AdapterConfig Interface

```typescript
interface AdapterConfig {
  preserveComments?: boolean;
  generateTests?: boolean;
  includeImports?: boolean;
}
```

## Contributing

To add a new adapter:

1. Create a new file in `src/bridge/adapters/`
2. Extend `BaseStateAdapter`
3. Implement required methods
4. Add tests in `src/__tests__/`
5. Export from `index.ts`
6. Update documentation

## License

MIT
