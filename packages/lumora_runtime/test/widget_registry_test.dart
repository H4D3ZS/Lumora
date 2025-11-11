import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumora_runtime/lumora_runtime.dart';

void main() {
  group('WidgetRegistry', () {
    late WidgetRegistry registry;

    setUp(() {
      registry = WidgetRegistry();
    });

    test('should register core widgets automatically', () {
      expect(registry.hasBuilder('View'), true);
      expect(registry.hasBuilder('Text'), true);
      expect(registry.hasBuilder('Button'), true);
      expect(registry.hasBuilder('Image'), true);
      expect(registry.hasBuilder('ScrollView'), true);
      expect(registry.hasBuilder('ListView'), true);
      expect(registry.hasBuilder('TextInput'), true);
      expect(registry.hasBuilder('Switch'), true);
      expect(registry.hasBuilder('Checkbox'), true);
      expect(registry.hasBuilder('Radio'), true);
      expect(registry.hasBuilder('Row'), true);
      expect(registry.hasBuilder('Column'), true);
    });

    test('should register custom widget', () {
      registry.register('CustomWidget', ({required props, required children, key}) {
        return Container(key: key);
      });

      expect(registry.hasBuilder('CustomWidget'), true);
    });

    test('should build widget with registered builder', () {
      final widget = registry.buildWidget(
        type: 'Text',
        props: {'text': 'Hello World'},
        children: [],
      );

      expect(widget, isA<Text>());
    });

    test('should use fallback for unknown widget type', () {
      final widget = registry.buildWidget(
        type: 'UnknownWidget',
        props: {},
        children: [],
      );

      expect(widget, isA<Container>());
    });

    test('should unregister widget', () {
      registry.register('TempWidget', ({required props, required children, key}) {
        return Container(key: key);
      });

      expect(registry.hasBuilder('TempWidget'), true);
      
      registry.unregister('TempWidget');
      
      expect(registry.hasBuilder('TempWidget'), false);
    });

    test('should clear all builders', () {
      final initialCount = registry.builderCount;
      expect(initialCount, greaterThan(0));

      registry.clear();

      expect(registry.builderCount, 0);
    });

    test('should get all registered types', () {
      final types = registry.registeredTypes;
      
      expect(types, contains('View'));
      expect(types, contains('Text'));
      expect(types, contains('Button'));
    });
  });

  group('Core Widgets', () {
    late WidgetRegistry registry;

    setUp(() {
      registry = WidgetRegistry();
    });

    testWidgets('View widget should render', (tester) async {
      final widget = registry.buildWidget(
        type: 'View',
        props: {
          'width': 100.0,
          'height': 100.0,
          'padding': 10.0,
        },
        children: [],
      );

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));
      expect(find.byType(Container), findsOneWidget);
    });

    testWidgets('Text widget should render', (tester) async {
      final widget = registry.buildWidget(
        type: 'Text',
        props: {'text': 'Hello'},
        children: [],
      );

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));
      expect(find.text('Hello'), findsOneWidget);
    });

    testWidgets('Button widget should render', (tester) async {
      var pressed = false;
      final widget = registry.buildWidget(
        type: 'Button',
        props: {
          'title': 'Click Me',
          'onPress': () => pressed = true,
        },
        children: [],
      );

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));
      expect(find.text('Click Me'), findsOneWidget);
      
      await tester.tap(find.byType(ElevatedButton));
      expect(pressed, true);
    });

    testWidgets('Row widget should render children horizontally', (tester) async {
      final widget = registry.buildWidget(
        type: 'Row',
        props: {},
        children: [
          const Text('Child 1'),
          const Text('Child 2'),
        ],
      );

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));
      expect(find.byType(Row), findsOneWidget);
      expect(find.text('Child 1'), findsOneWidget);
      expect(find.text('Child 2'), findsOneWidget);
    });

    testWidgets('Column widget should render children vertically', (tester) async {
      final widget = registry.buildWidget(
        type: 'Column',
        props: {},
        children: [
          const Text('Child 1'),
          const Text('Child 2'),
        ],
      );

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));
      expect(find.byType(Column), findsOneWidget);
      expect(find.text('Child 1'), findsOneWidget);
      expect(find.text('Child 2'), findsOneWidget);
    });
  });

  group('PropParser', () {
    test('should parse padding from number', () {
      final padding = PropParser.parsePadding(10);
      expect(padding, equals(const EdgeInsets.all(10)));
    });

    test('should parse padding from map', () {
      final padding = PropParser.parsePadding({
        'top': 10,
        'right': 20,
        'bottom': 30,
        'left': 40,
      });
      
      expect(padding, equals(const EdgeInsets.only(
        top: 10,
        right: 20,
        bottom: 30,
        left: 40,
      )));
    });

    test('should parse hex color', () {
      final color = PropParser.parseColor('#FF0000');
      expect(color, equals(const Color(0xFFFF0000)));
    });

    test('should parse named color', () {
      final color = PropParser.parseColor('red');
      expect(color, equals(const Color(0xFFFF0000)));
    });

    test('should parse text style', () {
      final style = PropParser.parseTextStyle({
        'fontSize': 16,
        'fontWeight': 'bold',
        'color': '#000000',
      });

      expect(style?.fontSize, equals(16));
      expect(style?.fontWeight, equals(FontWeight.bold));
      expect(style?.color, equals(const Color(0xFF000000)));
    });

    test('should parse text align', () {
      expect(PropParser.parseTextAlign('left'), equals(TextAlign.left));
      expect(PropParser.parseTextAlign('center'), equals(TextAlign.center));
      expect(PropParser.parseTextAlign('right'), equals(TextAlign.right));
    });

    test('should parse alignment', () {
      expect(PropParser.parseAlignment('center'), equals(Alignment.center));
      expect(PropParser.parseAlignment('topLeft'), equals(Alignment.topLeft));
      expect(PropParser.parseAlignment('bottomRight'), equals(Alignment.bottomRight));
    });
  });
}
