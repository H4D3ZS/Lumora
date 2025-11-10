/**
 * Dart Parser Tests
 */

import { DartParser } from '../parsers/dart-parser';
import { LumoraIR } from '../types/ir-types';

describe('DartParser', () => {
  let parser: DartParser;

  beforeEach(() => {
    parser = new DartParser();
  });

  describe('StatelessWidget parsing', () => {
    it('should parse a simple StatelessWidget', () => {
      const source = `
import 'package:flutter/material.dart';

class MyWidget extends StatelessWidget {
  final String title;
  final int count;

  const MyWidget({
    required this.title,
    this.count = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Text(title);
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');

      expect(ir.metadata.sourceFramework).toBe('flutter');
      expect(ir.nodes).toHaveLength(1);
      
      const node = ir.nodes[0];
      expect(node.type).toBe('MyWidget');
      expect(node.children).toHaveLength(1);
      expect(node.children[0].type).toBe('Text');
    });

    it('should extract widget properties', () => {
      const source = `
class MyWidget extends StatelessWidget {
  final String title;
  final int count;
  final bool isActive;

  const MyWidget({
    required this.title,
    this.count = 10,
    this.isActive = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const node = ir.nodes[0];

      // Properties with default values should be in props
      expect(node.props.count).toBe(10);
      expect(node.props.isActive).toBe(true);
    });
  });

  describe('StatefulWidget parsing', () => {
    it('should parse a StatefulWidget with state', () => {
      const source = `
class Counter extends StatefulWidget {
  @override
  _CounterState createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int count = 0;
  String message = 'Hello';

  @override
  Widget build(BuildContext context) {
    return Text(message);
  }
}
`;

      const ir = parser.parse(source, 'counter.dart');

      expect(ir.nodes).toHaveLength(1);
      
      const node = ir.nodes[0];
      expect(node.type).toBe('Counter');
      expect(node.state).toBeDefined();
      expect(node.state?.type).toBe('local');
      expect(node.state?.variables).toHaveLength(2);
      
      const countVar = node.state?.variables.find(v => v.name === 'count');
      expect(countVar).toBeDefined();
      expect(countVar?.type).toBe('number');
      expect(countVar?.initialValue).toBe(0);
      expect(countVar?.mutable).toBe(true);
    });

    it('should handle late and final state variables', () => {
      const source = `
class MyWidget extends StatefulWidget {
  @override
  _MyWidgetState createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  late String lateValue;
  final int finalValue = 42;
  late final String lateFinalValue;

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const node = ir.nodes[0];

      expect(node.state?.variables).toHaveLength(3);
      
      const lateVar = node.state?.variables.find(v => v.name === 'lateValue');
      expect(lateVar?.mutable).toBe(true);
      
      const finalVar = node.state?.variables.find(v => v.name === 'finalValue');
      expect(finalVar?.mutable).toBe(false);
      expect(finalVar?.initialValue).toBe(42);
    });
  });

  describe('Widget tree parsing', () => {
    it('should parse nested widgets', () => {
      const source = `
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      child: Text('Hello'),
    );
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const node = ir.nodes[0];

      expect(node.children).toHaveLength(1);
      expect(node.children[0].type).toBe('Container');
      expect(node.children[0].children).toHaveLength(1);
      expect(node.children[0].children[0].type).toBe('Text');
    });

    it('should parse widget with multiple children', () => {
      const source = `
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('First'),
        Text('Second'),
        Text('Third'),
      ],
    );
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const node = ir.nodes[0];

      expect(node.children).toHaveLength(1);
      expect(node.children[0].type).toBe('Column');
      expect(node.children[0].children).toHaveLength(3);
      expect(node.children[0].children[0].type).toBe('Text');
      expect(node.children[0].children[1].type).toBe('Text');
      expect(node.children[0].children[2].type).toBe('Text');
    });

    it('should extract widget properties', () => {
      const source = `
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      height: 200,
      padding: EdgeInsets.all(16),
      child: Text('Hello'),
    );
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const container = ir.nodes[0].children[0];

      expect(container.props.width).toBe(100);
      expect(container.props.height).toBe(200);
    });
  });

  describe('Type mapping', () => {
    it('should map Dart types to TypeScript types', () => {
      const source = `
class MyWidget extends StatefulWidget {
  @override
  _MyWidgetState createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  int intValue = 0;
  double doubleValue = 0.0;
  String stringValue = '';
  bool boolValue = false;
  List<String> listValue = [];

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const state = ir.nodes[0].state;

      expect(state?.variables.find(v => v.name === 'intValue')?.type).toBe('number');
      expect(state?.variables.find(v => v.name === 'doubleValue')?.type).toBe('number');
      expect(state?.variables.find(v => v.name === 'stringValue')?.type).toBe('string');
      expect(state?.variables.find(v => v.name === 'boolValue')?.type).toBe('boolean');
      expect(state?.variables.find(v => v.name === 'listValue')?.type).toBe('string[]');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed code gracefully', () => {
      const source = `
class MyWidget extends StatelessWidget {
  // Missing build method
}
`;

      expect(() => {
        parser.parse(source, 'my_widget.dart');
      }).not.toThrow();
    });

    it('should handle empty source', () => {
      const source = '';

      const ir = parser.parse(source, 'empty.dart');

      expect(ir.nodes).toHaveLength(0);
    });
  });

  describe('Multiple widgets', () => {
    it('should parse multiple widgets in one file', () => {
      const source = `
class FirstWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Text('First');
  }
}

class SecondWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Text('Second');
  }
}
`;

      const ir = parser.parse(source, 'widgets.dart');

      expect(ir.nodes).toHaveLength(2);
      expect(ir.nodes[0].type).toBe('FirstWidget');
      expect(ir.nodes[1].type).toBe('SecondWidget');
    });
  });

  describe('setState parsing', () => {
    it('should detect setState calls with block syntax', () => {
      const source = `
class Counter extends StatefulWidget {
  @override
  _CounterState createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int count = 0;

  void increment() {
    setState(() {
      count = count + 1;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Text('$count');
  }
}
`;

      const ir = parser.parse(source, 'counter.dart');
      const node = ir.nodes[0];

      expect(node.state).toBeDefined();
      expect(node.state?.variables).toHaveLength(1);
      expect(node.state?.variables[0].name).toBe('count');
    });

    it('should detect setState calls with arrow syntax', () => {
      const source = `
class Toggle extends StatefulWidget {
  @override
  _ToggleState createState() => _ToggleState();
}

class _ToggleState extends State<Toggle> {
  bool isActive = false;

  void toggle() {
    setState(() => isActive = !isActive);
  }

  @override
  Widget build(BuildContext context) {
    return Text('$isActive');
  }
}
`;

      const ir = parser.parse(source, 'toggle.dart');
      const node = ir.nodes[0];

      expect(node.state).toBeDefined();
      expect(node.state?.variables).toHaveLength(1);
      expect(node.state?.variables[0].name).toBe('isActive');
    });

    it('should handle multiple setState calls', () => {
      const source = `
class Form extends StatefulWidget {
  @override
  _FormState createState() => _FormState();
}

class _FormState extends State<Form> {
  String name = '';
  String email = '';

  void updateName(String value) {
    setState(() {
      name = value;
    });
  }

  void updateEmail(String value) {
    setState(() {
      email = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
`;

      const ir = parser.parse(source, 'form.dart');
      const node = ir.nodes[0];

      expect(node.state).toBeDefined();
      expect(node.state?.variables).toHaveLength(2);
      
      const nameVar = node.state?.variables.find(v => v.name === 'name');
      const emailVar = node.state?.variables.find(v => v.name === 'email');
      
      expect(nameVar).toBeDefined();
      expect(emailVar).toBeDefined();
    });
  });

  describe('Bloc parsing', () => {
    it('should extract Bloc classes', () => {
      const source = `
abstract class CounterEvent {}

class IncrementEvent extends CounterEvent {}

class DecrementEvent extends CounterEvent {}

abstract class CounterState {
  final int count;
  CounterState(this.count);
}

class CounterInitial extends CounterState {
  CounterInitial() : super(0);
}

class CounterUpdated extends CounterState {
  CounterUpdated(int count) : super(count);
}

class CounterBloc extends Bloc<CounterEvent, CounterState> {
  CounterBloc() : super(CounterInitial()) {
    on<IncrementEvent>((event, emit) {
      emit(CounterUpdated(state.count + 1));
    });
    
    on<DecrementEvent>((event, emit) {
      emit(CounterUpdated(state.count - 1));
    });
  }
}
`;

      const blocs = parser.extractBlocs(source);

      expect(blocs).toHaveLength(1);
      expect(blocs[0].name).toBe('CounterBloc');
      expect(blocs[0].events).toHaveLength(2);
      expect(blocs[0].states).toHaveLength(2);
    });

    it('should extract Bloc events', () => {
      const source = `
abstract class TodoEvent {}

class AddTodoEvent extends TodoEvent {
  final String title;
  AddTodoEvent(this.title);
}

class RemoveTodoEvent extends TodoEvent {
  final int id;
  RemoveTodoEvent(this.id);
}

abstract class TodoState {}

class TodoBloc extends Bloc<TodoEvent, TodoState> {
  TodoBloc() : super(TodoInitial());
}
`;

      const blocs = parser.extractBlocs(source);

      expect(blocs).toHaveLength(1);
      expect(blocs[0].events).toHaveLength(2);
      
      const addEvent = blocs[0].events.find(e => e.name === 'AddTodoEvent');
      const removeEvent = blocs[0].events.find(e => e.name === 'RemoveTodoEvent');
      
      expect(addEvent).toBeDefined();
      expect(removeEvent).toBeDefined();
    });

    it('should extract Bloc states', () => {
      const source = `
abstract class AuthEvent {}

abstract class AuthState {}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthAuthenticated extends AuthState {
  final String userId;
  final String username;
  
  AuthAuthenticated({
    required this.userId,
    required this.username,
  });
}

class AuthError extends AuthState {
  final String message;
  AuthError(this.message);
}

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc() : super(AuthInitial());
}
`;

      const blocs = parser.extractBlocs(source);

      expect(blocs).toHaveLength(1);
      expect(blocs[0].states.length).toBeGreaterThanOrEqual(3);
      
      const initialState = blocs[0].states.find(s => s.name === 'AuthInitial');
      const authenticatedState = blocs[0].states.find(s => s.name === 'AuthAuthenticated');
      
      expect(initialState).toBeDefined();
      expect(initialState?.isInitial).toBe(true);
      expect(authenticatedState).toBeDefined();
    });

    it('should convert Bloc to state definition', () => {
      const source = `
abstract class CounterEvent {}

abstract class CounterState {
  final int count;
  CounterState(this.count);
}

class CounterInitial extends CounterState {
  CounterInitial() : super(0);
}

class CounterBloc extends Bloc<CounterEvent, CounterState> {
  CounterBloc() : super(CounterInitial());
}
`;

      const blocs = parser.extractBlocs(source);
      expect(blocs).toHaveLength(1);
      
      const stateDef = parser.convertBlocToState(blocs[0]);
      
      expect(stateDef.type).toBe('global');
      expect(stateDef.variables.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Named parameters parsing', () => {
    it('should parse required named parameters', () => {
      const source = `
class MyWidget extends StatelessWidget {
  final String title;
  final int count;

  const MyWidget({
    required this.title,
    required this.count,
  });

  @override
  Widget build(BuildContext context) {
    return Text(title);
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const node = ir.nodes[0];

      // The parser should identify required properties
      expect(node.type).toBe('MyWidget');
    });

    it('should parse optional named parameters with defaults', () => {
      const source = `
class MyWidget extends StatelessWidget {
  final String title;
  final int count;
  final bool isActive;

  const MyWidget({
    required this.title,
    this.count = 10,
    this.isActive = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const node = ir.nodes[0];

      expect(node.props.count).toBe(10);
      expect(node.props.isActive).toBe(true);
    });

    it('should handle mixed positional and named parameters', () => {
      const source = `
class MyWidget extends StatelessWidget {
  final String title;
  final int value;

  const MyWidget(this.title, {this.value = 0});

  @override
  Widget build(BuildContext context) {
    return Text(title);
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const node = ir.nodes[0];

      expect(node.props.value).toBe(0);
    });
  });

  describe('Null safety parsing', () => {
    it('should handle nullable types', () => {
      const source = `
class MyWidget extends StatefulWidget {
  @override
  _MyWidgetState createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  String? nullableString;
  int? nullableInt;
  bool nonNullableBool = false;

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const node = ir.nodes[0];

      expect(node.state?.variables).toHaveLength(3);
      
      const nullableStringVar = node.state?.variables.find(v => v.name === 'nullableString');
      expect(nullableStringVar?.type).toBe('string | null');
      
      const nullableIntVar = node.state?.variables.find(v => v.name === 'nullableInt');
      expect(nullableIntVar?.type).toBe('number | null');
      
      const nonNullableVar = node.state?.variables.find(v => v.name === 'nonNullableBool');
      expect(nonNullableVar?.type).toBe('boolean');
    });

    it('should handle late variables', () => {
      const source = `
class MyWidget extends StatefulWidget {
  @override
  _MyWidgetState createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  late String lateString;
  late final int lateFinalInt;

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const node = ir.nodes[0];

      expect(node.state?.variables).toHaveLength(2);
      
      const lateVar = node.state?.variables.find(v => v.name === 'lateString');
      expect(lateVar).toBeDefined();
      expect(lateVar?.mutable).toBe(true);
      
      const lateFinalVar = node.state?.variables.find(v => v.name === 'lateFinalInt');
      expect(lateFinalVar).toBeDefined();
      expect(lateFinalVar?.mutable).toBe(false);
    });

    it('should handle nullable generic types', () => {
      const source = `
class MyWidget extends StatefulWidget {
  @override
  _MyWidgetState createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  List<String>? nullableList;
  Map<String, int>? nullableMap;

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
`;

      const ir = parser.parse(source, 'my_widget.dart');
      const node = ir.nodes[0];

      expect(node.state?.variables).toHaveLength(2);
      
      const listVar = node.state?.variables.find(v => v.name === 'nullableList');
      expect(listVar?.type).toBe('string[] | null');
      
      const mapVar = node.state?.variables.find(v => v.name === 'nullableMap');
      expect(mapVar?.type).toBe('Record<string, number> | null');
    });
  });

  describe('Custom widget parsing', () => {
    it('should identify custom widgets', () => {
      const source = `
class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const CustomButton({
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      child: Text(label),
    );
  }
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CustomButton(
      label: 'Click me',
      onPressed: () {},
    );
  }
}
`;

      const ir = parser.parse(source, 'my_app.dart');

      expect(ir.nodes).toHaveLength(2);
      
      const registry = parser.getCustomWidgetRegistry();
      expect(registry.has('CustomButton')).toBe(true);
      expect(registry.has('MyApp')).toBe(true);
      
      const customButton = registry.get('CustomButton');
      expect(customButton).toBeDefined();
      expect(customButton?.name).toBe('CustomButton');
      expect(customButton?.type).toBe('StatelessWidget');
      expect(customButton?.properties).toHaveLength(2);
    });

    it('should not register core Flutter widgets as custom', () => {
      const source = `
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      child: Text('Hello'),
    );
  }
}
`;

      const ir = parser.parse(source, 'my_app.dart');

      const registry = parser.getCustomWidgetRegistry();
      expect(registry.has('Container')).toBe(false);
      expect(registry.has('Text')).toBe(false);
      expect(registry.has('MyApp')).toBe(true);
    });

    it('should extract custom widget builder', () => {
      const source = `
class CustomCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final int elevation;

  const CustomCard({
    required this.title,
    required this.subtitle,
    this.elevation = 2,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: elevation,
      child: Column(
        children: [
          Text(title),
          Text(subtitle),
        ],
      ),
    );
  }
}
`;

      parser.parse(source, 'custom_card.dart');

      const builder = parser.extractCustomWidgetBuilder('CustomCard');
      expect(builder).toBeDefined();
      expect(builder).toContain('CustomCardProps');
      expect(builder).toContain('title');
      expect(builder).toContain('subtitle');
      expect(builder).toContain('elevation');
    });

    it('should include custom widgets in IR metadata', () => {
      const source = `
class CustomWidget extends StatelessWidget {
  final String text;

  const CustomWidget({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(text);
  }
}
`;

      const ir = parser.parse(source, 'custom_widget.dart');

      expect(ir.metadata.customWidgets).toBeDefined();
      expect(ir.metadata.customWidgets).toHaveLength(1);
      expect(ir.metadata.customWidgets![0].name).toBe('CustomWidget');
      expect(ir.metadata.customWidgets![0].properties).toHaveLength(1);
    });
  });

  describe('Riverpod parsing', () => {
    it('should extract Provider definitions', () => {
      const source = `
final counterProvider = Provider<int>((ref) => 0);
final nameProvider = Provider<String>((ref) => 'John');
`;

      const providers = parser.extractRiverpodProviders(source);

      expect(providers).toHaveLength(2);
      expect(providers[0].name).toBe('counterProvider');
      expect(providers[0].type).toBe('Provider');
      expect(providers[0].valueType).toBe('int');
      expect(providers[1].name).toBe('nameProvider');
      expect(providers[1].type).toBe('Provider');
      expect(providers[1].valueType).toBe('String');
    });

    it('should extract StateProvider definitions', () => {
      const source = `
final counterProvider = StateProvider<int>((ref) => 0);
final isActiveProvider = StateProvider<bool>((ref) => false);
`;

      const providers = parser.extractRiverpodProviders(source);

      expect(providers).toHaveLength(2);
      expect(providers[0].name).toBe('counterProvider');
      expect(providers[0].type).toBe('StateProvider');
      expect(providers[0].valueType).toBe('int');
      expect(providers[0].initialValue).toBe('0');
    });

    it('should extract StateNotifierProvider definitions', () => {
      const source = `
final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) => CounterNotifier());
`;

      const providers = parser.extractRiverpodProviders(source);

      expect(providers).toHaveLength(1);
      expect(providers[0].name).toBe('counterProvider');
      expect(providers[0].type).toBe('StateNotifierProvider');
      expect(providers[0].notifierClass).toBe('CounterNotifier');
      expect(providers[0].valueType).toBe('int');
    });

    it('should extract FutureProvider definitions', () => {
      const source = `
final userProvider = FutureProvider<User>((ref) async => fetchUser());
`;

      const providers = parser.extractRiverpodProviders(source);

      expect(providers).toHaveLength(1);
      expect(providers[0].name).toBe('userProvider');
      expect(providers[0].type).toBe('FutureProvider');
      expect(providers[0].valueType).toBe('User');
    });

    it('should extract StreamProvider definitions', () => {
      const source = `
final messagesProvider = StreamProvider<Message>((ref) => messageStream());
`;

      const providers = parser.extractRiverpodProviders(source);

      expect(providers).toHaveLength(1);
      expect(providers[0].name).toBe('messagesProvider');
      expect(providers[0].type).toBe('StreamProvider');
      expect(providers[0].valueType).toBe('Message');
    });

    it('should extract StateNotifier classes', () => {
      const source = `
class CounterNotifier extends StateNotifier<int> {
  CounterNotifier() : super(0);

  void increment() {
    state = state + 1;
  }

  void decrement() {
    state = state - 1;
  }
}
`;

      const notifiers = parser.extractStateNotifiers(source);

      expect(notifiers).toHaveLength(1);
      expect(notifiers[0].name).toBe('CounterNotifier');
      expect(notifiers[0].stateType).toBe('int');
      expect(notifiers[0].initialState).toBe('0');
      expect(notifiers[0].methods.length).toBeGreaterThanOrEqual(2);
    });

    it('should convert Riverpod provider to state definition', () => {
      const source = `
final counterProvider = StateProvider<int>((ref) => 0);
`;

      const providers = parser.extractRiverpodProviders(source);
      expect(providers).toHaveLength(1);
      
      const stateDef = parser.convertRiverpodToState(providers[0]);
      
      expect(stateDef.type).toBe('global');
      expect(stateDef.variables).toHaveLength(1);
      expect(stateDef.variables[0].name).toBe('counterProvider');
      expect(stateDef.variables[0].type).toBe('number');
      expect(stateDef.variables[0].mutable).toBe(true);
    });

    it('should convert StateNotifierProvider with notifier to state definition', () => {
      const source = `
class TodosNotifier extends StateNotifier<int> {
  TodosNotifier() : super(0);
}

final todosProvider = StateNotifierProvider<TodosNotifier, int>((ref) => TodosNotifier());
`;

      const providers = parser.extractRiverpodProviders(source);
      const notifiers = parser.extractStateNotifiers(source);
      
      expect(providers).toHaveLength(1);
      expect(notifiers).toHaveLength(1);
      
      const stateDef = parser.convertRiverpodToState(providers[0], notifiers[0]);
      
      expect(stateDef.type).toBe('global');
      expect(stateDef.variables).toHaveLength(1);
      expect(stateDef.variables[0].name).toBe('todosProvider');
    });
  });
});
