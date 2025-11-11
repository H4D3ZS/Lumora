/**
 * State Bridge Tests
 */

import { StateBridge, ReactHookInfo, FlutterStateInfo } from '../bridge/state-bridge';
import { StateDefinition, StateVariable } from '../types/ir-types';

describe('StateBridge', () => {
  let bridge: StateBridge;

  beforeEach(() => {
    bridge = new StateBridge();
  });

  describe('React to Flutter Conversion', () => {
    it('should convert local state to StatefulWidget', () => {
      const state: StateDefinition = {
        type: 'local',
        variables: [
          { name: 'count', type: 'number', initialValue: 0, mutable: true },
          { name: 'message', type: 'string', initialValue: 'Hello', mutable: true },
        ],
      };

      const result = bridge.convertReactToFlutter(state, 'Counter');

      expect(result).toContain('class _CounterState extends State<Counter>');
      expect(result).toContain('double count = 0;');
      expect(result).toContain("String message = 'Hello';");
      expect(result).toContain('void setCount(double value)');
      expect(result).toContain('void setMessage(String value)');
    });

    it('should convert global state to Bloc', () => {
      const state: StateDefinition = {
        type: 'global',
        variables: [
          { name: 'user', type: 'string', initialValue: null, mutable: true },
          { name: 'isLoggedIn', type: 'boolean', initialValue: false, mutable: true },
        ],
      };

      const result = bridge.convertReactToFlutter(state, 'Auth');

      expect(result).toContain('class AuthBloc extends Bloc<AuthEvent, AuthState>');
      expect(result).toContain('class AuthState extends Equatable');
      expect(result).toContain('UpdateUserEvent');
      expect(result).toContain('UpdateIsLoggedInEvent');
    });

    it('should convert useState to StatefulWidget state', () => {
      const hookInfo: ReactHookInfo = {
        type: 'useState',
        stateName: 'count',
        setterName: 'setCount',
        initialValue: 0,
      };

      const result = bridge.convertUseStateToFlutter(hookInfo, 'Counter');

      expect(result).toContain('double count = 0;');
      expect(result).toContain('void setCount(double value)');
      expect(result).toContain('setState(() {');
    });

    it('should convert useContext to InheritedWidget', () => {
      const hookInfo: ReactHookInfo = {
        type: 'useContext',
        stateName: 'theme',
        contextName: 'Theme',
      };

      const result = bridge.convertUseContextToInheritedWidget(hookInfo, 'App');

      expect(result).toContain('class ThemeWidget extends InheritedWidget');
      expect(result).toContain('static ThemeWidget? of(BuildContext context)');
      expect(result).toContain('bool updateShouldNotify');
    });

    it('should convert useReducer to Bloc', () => {
      const hookInfo: ReactHookInfo = {
        type: 'useReducer',
        stateName: 'state',
        reducerName: 'counterReducer',
        initialValue: { count: 0 },
        actions: [
          { type: 'increment', payload: undefined },
          { type: 'decrement', payload: undefined },
          { type: 'reset', payload: 0 },
        ],
      };

      const result = bridge.convertUseReducerToBloc(hookInfo, 'Counter');

      expect(result).toContain('class CounterBloc extends Bloc<CounterEvent, CounterState>');
      expect(result).toContain('IncrementEvent');
      expect(result).toContain('DecrementEvent');
      expect(result).toContain('ResetEvent');
    });
  });

  describe('Flutter to React Conversion', () => {
    it('should convert StatefulWidget to React useState', () => {
      const flutterState: FlutterStateInfo = {
        type: 'StatefulWidget',
        className: 'Counter',
        stateVariables: [
          { name: 'count', type: 'int', initialValue: '0', isFinal: false, isLate: false },
          { name: 'message', type: 'String', initialValue: "'Hello'", isFinal: false, isLate: false },
        ],
      };

      const result = bridge.convertFlutterToReact(flutterState, 'Counter');

      expect(result).toContain('function Counter()');
      expect(result).toContain('const [count, setCount] = useState<number>(0);');
      expect(result).toContain("const [message, setMessage] = useState<string>('Hello');");
    });

    it('should convert InheritedWidget to React Context', () => {
      const flutterState: FlutterStateInfo = {
        type: 'InheritedWidget',
        className: 'ThemeWidget',
        stateVariables: [
          { name: 'theme', type: 'String', initialValue: "'light'", isFinal: true, isLate: false },
        ],
      };

      const result = bridge.convertFlutterToReact(flutterState, 'Theme');

      expect(result).toContain('const ThemeContext = createContext');
      expect(result).toContain('export function ThemeProvider');
      expect(result).toContain('export function useTheme()');
    });

    it('should convert Bloc to useReducer', () => {
      const flutterState: FlutterStateInfo = {
        type: 'Bloc',
        className: 'CounterBloc',
        stateVariables: [
          { name: 'count', type: 'int', initialValue: '0', isFinal: true, isLate: false },
        ],
      };

      const result = bridge.convertFlutterToReact(flutterState, 'Counter');

      expect(result).toContain('interface CounterState');
      expect(result).toContain('type CounterAction');
      expect(result).toContain('function counterReducer');
      expect(result).toContain('export function useCounter()');
      expect(result).toContain('useReducer');
    });
  });

  describe('State Preservation', () => {
    it('should serialize state', () => {
      const state = { count: 5, message: 'test' };
      const serialized = bridge.serializeState(state);

      expect(serialized).toContain('"count": 5');
      expect(serialized).toContain('"message": "test"');
    });

    it('should deserialize state', () => {
      const serialized = '{"count": 5, "message": "test"}';
      const state = bridge.deserializeState(serialized);

      expect(state.count).toBe(5);
      expect(state.message).toBe('test');
    });

    it('should preserve state during hot reload', () => {
      const oldState = { count: 10, message: 'old' };
      const newState = { count: 0, message: 'new', extra: 'field' };

      const preserved = bridge.preserveState(oldState, newState);

      expect(preserved.count).toBe(10); // Preserved from old
      expect(preserved.message).toBe('old'); // Preserved from old
      expect(preserved.extra).toBe('field'); // New field kept
    });

    it('should migrate state with type changes', () => {
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

      expect(migrated.count).toBe(10); // Converted to number
      expect(migrated.isActive).toBe(true); // Converted to boolean
    });

    it('should create state snapshot', () => {
      const state = { count: 5 };
      const definition: StateDefinition = {
        type: 'local',
        variables: [{ name: 'count', type: 'number', initialValue: 0, mutable: true }],
      };

      const snapshot = bridge.createStateSnapshot(state, definition);

      expect(snapshot.state).toEqual(state);
      expect(snapshot.definition).toEqual(definition);
      expect(snapshot.timestamp).toBeGreaterThan(0);
    });

    it('should compare state snapshots', () => {
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

      expect(comparison.hasChanges).toBe(true);
      expect(comparison.changes).toHaveLength(2);
      expect(comparison.changes.some(c => c.type === 'modified' && c.variable === 'count')).toBe(true);
      expect(comparison.changes.some(c => c.type === 'added' && c.variable === 'message')).toBe(true);
    });
  });

  describe('Type Mapping', () => {
    it('should map TypeScript types to Flutter types', () => {
      const bridge = new StateBridge();
      
      // Access private method through any cast for testing
      const mapType = (bridge as any).mapTypeToFlutter.bind(bridge);

      expect(mapType('string')).toBe('String');
      expect(mapType('number')).toBe('double');
      expect(mapType('boolean')).toBe('bool');
      expect(mapType('string[]')).toBe('List<String>');
      expect(mapType('Array<number>')).toBe('List<double>');
    });

    it('should map Flutter types to TypeScript types', () => {
      const bridge = new StateBridge();
      
      // Access private method through any cast for testing
      const mapType = (bridge as any).mapFlutterTypeToTS.bind(bridge);

      expect(mapType('String')).toBe('string');
      expect(mapType('int')).toBe('number');
      expect(mapType('double')).toBe('number');
      expect(mapType('bool')).toBe('boolean');
      expect(mapType('List<String>')).toBe('string[]');
      expect(mapType('String?')).toBe('string | null');
    });
  });

  describe('State Adapter Generation', () => {
    it('should generate Riverpod state', () => {
      const bridge = new StateBridge({ targetAdapter: 'riverpod' });
      const state: StateDefinition = {
        type: 'global',
        variables: [
          { name: 'count', type: 'number', initialValue: 0, mutable: true },
        ],
      };

      const result = bridge.convertReactToFlutter(state, 'Counter');

      expect(result).toContain('class CounterState');
      expect(result).toContain('class CounterNotifier extends StateNotifier<CounterState>');
      expect(result).toContain('final counterProvider = StateNotifierProvider');
    });

    it('should generate Provider state', () => {
      const bridge = new StateBridge({ targetAdapter: 'provider' });
      const state: StateDefinition = {
        type: 'global',
        variables: [
          { name: 'count', type: 'number', initialValue: 0, mutable: true },
        ],
      };

      const result = bridge.convertReactToFlutter(state, 'Counter');

      expect(result).toContain('class CounterProvider extends ChangeNotifier');
      expect(result).toContain('double get count');
      expect(result).toContain('void setCount(double value)');
      expect(result).toContain('notifyListeners()');
    });

    it('should generate GetX state', () => {
      const bridge = new StateBridge({ targetAdapter: 'getx' });
      const state: StateDefinition = {
        type: 'global',
        variables: [
          { name: 'count', type: 'number', initialValue: 0, mutable: true },
        ],
      };

      const result = bridge.convertReactToFlutter(state, 'Counter');

      expect(result).toContain('class CounterController extends GetxController');
      expect(result).toContain('final count = 0.obs;');
      expect(result).toContain('void updateCount(double value)');
    });
  });
});
