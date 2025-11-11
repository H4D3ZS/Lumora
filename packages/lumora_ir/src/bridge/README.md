# State Bridge Module

The State Bridge module provides bidirectional conversion between React and Flutter state management patterns.

## Features

- **React to Flutter Conversion**
  - Convert `useState` to StatefulWidget state
  - Convert `useContext` to InheritedWidget
  - Convert `useReducer` to Bloc
  - Support for multiple Flutter state adapters (Bloc, Riverpod, Provider, GetX)

- **Flutter to React Conversion**
  - Convert StatefulWidget to React `useState` hooks
  - Convert InheritedWidget to React Context
  - Convert Bloc to `useReducer`
  - Convert Riverpod providers to React hooks
  - Convert Provider to React hooks

- **State Preservation**
  - Serialize/deserialize state for hot reload
  - Preserve state values during schema updates
  - Migrate state when types change
  - Create state snapshots for debugging
  - Compare state snapshots to detect changes

## Usage

### Basic Setup

```typescript
import { StateBridge } from '@lumora/ir';

// Create a bridge instance
const bridge = new StateBridge({
  targetAdapter: 'bloc', // or 'riverpod', 'provider', 'getx'
  preserveComments: true,
});
```

### React to Flutter Conversion

#### Convert Local State (useState)

```typescript
import { StateDefinition } from '@lumora/ir';

const state: StateDefinition = {
  type: 'local',
  variables: [
    { name: 'count', type: 'number', initialValue: 0, mutable: true },
    { name: 'message', type: 'string', initialValue: 'Hello', mutable: true },
  ],
};

const flutterCode = bridge.convertReactToFlutter(state, 'Counter');
```

Output:
```dart
class _CounterState extends State<Counter> {
  double count = 0;
  String message = 'Hello';

  void setCount(double value) {
    setState(() {
      count = value;
    });
  }

  void setMessage(String value) {
    setState(() {
      message = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Widget tree will be inserted here
    return Container();
  }
}
```

#### Convert Global State (useReducer to Bloc)

```typescript
const state: StateDefinition = {
  type: 'global',
  variables: [
    { name: 'user', type: 'string', initialValue: null, mutable: true },
    { name: 'isLoggedIn', type: 'boolean', initialValue: false, mutable: true },
  ],
};

const blocCode = bridge.convertReactToFlutter(state, 'Auth');
```

Output:
```dart
// Base event class
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class UpdateUserEvent extends AuthEvent {
  final String user;

  const UpdateUserEvent(this.user);

  @override
  List<Object?> get props => [user];
}

class UpdateIsLoggedInEvent extends AuthEvent {
  final bool isLoggedIn;

  const UpdateIsLoggedInEvent(this.isLoggedIn);

  @override
  List<Object?> get props => [isLoggedIn];
}

class AuthState extends Equatable {
  final String user;
  final bool isLoggedIn;

  const AuthState({
    required this.user,
    required this.isLoggedIn,
  });

  AuthState copyWith({
    String? user,
    bool? isLoggedIn,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
    );
  }

  @override
  List<Object?> get props => [user, isLoggedIn];
}

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc() : super(AuthState(
      user: null,
      isLoggedIn: false,
    )) {
    on<UpdateUserEvent>(_onUpdateUser);
    on<UpdateIsLoggedInEvent>(_onUpdateIsLoggedIn);
  }

  void _onUpdateUser(
    UpdateUserEvent event,
    Emitter<AuthState> emit,
  ) {
    emit(state.copyWith(user: event.user));
  }

  void _onUpdateIsLoggedIn(
    UpdateIsLoggedInEvent event,
    Emitter<AuthState> emit,
  ) {
    emit(state.copyWith(isLoggedIn: event.isLoggedIn));
  }
}
```

### Flutter to React Conversion

#### Convert StatefulWidget to React

```typescript
import { FlutterStateInfo } from '@lumora/ir';

const flutterState: FlutterStateInfo = {
  type: 'StatefulWidget',
  className: 'Counter',
  stateVariables: [
    { name: 'count', type: 'int', initialValue: '0', isFinal: false, isLate: false },
    { name: 'message', type: 'String', initialValue: "'Hello'", isFinal: false, isLate: false },
  ],
};

const reactCode = bridge.convertFlutterToReact(flutterState, 'Counter');
```

Output:
```typescript
function Counter() {
  const [count, setCount] = useState<number>(0);
  const [message, setMessage] = useState<string>('Hello');

  return (
    // JSX will be inserted here
    <div></div>
  );
}
```

#### Convert Bloc to useReducer

```typescript
const flutterState: FlutterStateInfo = {
  type: 'Bloc',
  className: 'CounterBloc',
  stateVariables: [
    { name: 'count', type: 'int', initialValue: '0', isFinal: true, isLate: false },
  ],
};

const reactCode = bridge.convertFlutterToReact(flutterState, 'Counter');
```

Output:
```typescript
interface CounterState {
  count: number;
}

type CounterAction =
  | { type: 'UPDATE_COUNT'; payload: number };

const initialCounterState: CounterState = {
  count: 0,
};

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'UPDATE_COUNT':
      return { ...state, count: action.payload };
    default:
      return state;
  }
}

export function useCounter() {
  const [state, dispatch] = useReducer(counterReducer, initialCounterState);

  return {
    state,
    updateCount: (value: number) => 
      dispatch({ type: 'UPDATE_COUNT', payload: value }),
  };
}
```

### State Preservation

#### Preserve State During Hot Reload

```typescript
const oldState = { count: 10, message: 'old' };
const newState = { count: 0, message: 'new', extra: 'field' };

const preserved = bridge.preserveState(oldState, newState);
// Result: { count: 10, message: 'old', extra: 'field' }
```

#### Migrate State with Type Changes

```typescript
const oldState = { count: '10', isActive: 'true' };
const oldDefinition: StateDefinition = {
  type: 'local',
  variables: [
    { name: 'count', type: 'string', initialValue: '0', mutable: true },
    { name: 'isActive', type: 'string', initialValue: 'false', mutable: true },
  ],
};
const newDefinition: StateDefinition = {
  type: 'local',
  variables: [
    { name: 'count', type: 'number', initialValue: 0, mutable: true },
    { name: 'isActive', type: 'boolean', initialValue: false, mutable: true },
  ],
};

const migrated = bridge.migrateState(oldState, oldDefinition, newDefinition);
// Result: { count: 10, isActive: true }
```

#### Create and Compare State Snapshots

```typescript
const snapshot1 = bridge.createStateSnapshot(
  { count: 5 },
  {
    type: 'local',
    variables: [{ name: 'count', type: 'number', initialValue: 0, mutable: true }],
  }
);

const snapshot2 = bridge.createStateSnapshot(
  { count: 10, message: 'new' },
  {
    type: 'local',
    variables: [
      { name: 'count', type: 'number', initialValue: 0, mutable: true },
      { name: 'message', type: 'string', initialValue: '', mutable: true },
    ],
  }
);

const comparison = bridge.compareStateSnapshots(snapshot1, snapshot2);
// comparison.hasChanges === true
// comparison.changes contains:
// - { type: 'modified', variable: 'count', oldValue: 5, newValue: 10 }
// - { type: 'added', variable: 'message', newValue: 'new' }
```

## State Adapters

The bridge supports multiple Flutter state management patterns:

### Bloc (Default)

```typescript
const bridge = new StateBridge({ targetAdapter: 'bloc' });
```

Generates:
- Event classes for each mutable state variable
- State class with `copyWith` method
- Bloc class with event handlers

### Riverpod

```typescript
const bridge = new StateBridge({ targetAdapter: 'riverpod' });
```

Generates:
- State class with `copyWith` method
- StateNotifier class with update methods
- StateNotifierProvider definition

### Provider

```typescript
const bridge = new StateBridge({ targetAdapter: 'provider' });
```

Generates:
- ChangeNotifier class with getters and setters
- Calls `notifyListeners()` on state changes

### GetX

```typescript
const bridge = new StateBridge({ targetAdapter: 'getx' });
```

Generates:
- GetxController class
- Observable state variables (`.obs`)
- Update methods

## Type Mapping

The bridge automatically maps types between TypeScript and Dart:

### TypeScript to Dart

| TypeScript | Dart |
|------------|------|
| `string` | `String` |
| `number` | `double` |
| `boolean` | `bool` |
| `any` | `dynamic` |
| `string[]` | `List<String>` |
| `Array<number>` | `List<double>` |
| `object` | `Map<String, dynamic>` |

### Dart to TypeScript

| Dart | TypeScript |
|------|------------|
| `String` | `string` |
| `int` | `number` |
| `double` | `number` |
| `bool` | `boolean` |
| `dynamic` | `any` |
| `List<String>` | `string[]` |
| `String?` | `string \| null` |
| `Map<String, int>` | `Record<string, number>` |

## API Reference

### StateBridge

#### Constructor

```typescript
constructor(config?: StateBridgeConfig)
```

#### Methods

- `convertReactToFlutter(state: StateDefinition, componentName: string): string`
- `convertFlutterToReact(flutterState: FlutterStateInfo, componentName: string): string`
- `convertUseStateToFlutter(hookInfo: ReactHookInfo, componentName: string): string`
- `convertUseContextToInheritedWidget(hookInfo: ReactHookInfo, componentName: string): string`
- `convertUseReducerToBloc(hookInfo: ReactHookInfo, componentName: string): string`
- `serializeState(state: Record<string, any>): string`
- `deserializeState(serialized: string): Record<string, any>`
- `preserveState(oldState: Record<string, any>, newState: Record<string, any>): Record<string, any>`
- `migrateState(oldState: Record<string, any>, oldDefinition: StateDefinition, newDefinition: StateDefinition): Record<string, any>`
- `createStateSnapshot(state: Record<string, any>, definition: StateDefinition): StateSnapshot`
- `compareStateSnapshots(snapshot1: StateSnapshot, snapshot2: StateSnapshot): StateComparison`
- `generateFlutterStatePreservation(componentName: string, stateVars: StateVariable[]): string`
- `generateReactStatePreservation(componentName: string, stateVars: StateVariable[]): string`

## Integration with Lumora IR

The State Bridge integrates seamlessly with the Lumora IR system:

```typescript
import { ReactParser, StateBridge } from '@lumora/ir';

// Parse React component
const parser = new ReactParser();
const ir = parser.parse(reactCode, 'Counter.tsx');

// Extract state from IR
const component = ir.nodes[0];
if (component.state) {
  // Convert to Flutter
  const bridge = new StateBridge({ targetAdapter: 'bloc' });
  const flutterCode = bridge.convertReactToFlutter(component.state, component.type);
  
  console.log(flutterCode);
}
```

## Best Practices

1. **Choose the Right Adapter**: Select the state adapter that matches your team's preferences and project requirements.

2. **Preserve State During Development**: Use state preservation features to maintain state values during hot reload.

3. **Handle Type Changes Carefully**: When migrating state with type changes, test thoroughly to ensure data integrity.

4. **Use Snapshots for Debugging**: Create state snapshots before and after changes to track state evolution.

5. **Document State Structure**: Keep your state definitions well-documented for easier maintenance.

## Limitations

- Complex state transformations may require manual adjustments
- Custom hooks beyond the standard set require additional handling
- Async state (Futures/Promises) needs special consideration
- Some Flutter-specific patterns (like AnimationController) don't have direct React equivalents

## Future Enhancements

- Support for more complex state patterns (Redux, MobX, etc.)
- Automatic detection of state management patterns
- Visual state flow diagrams
- State migration scripts generation
- Performance optimization for large state objects
