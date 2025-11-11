import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dev_client/interpreter/schema_interpreter.dart';

void main() {
  group('SchemaInterpreter - Schema Parsing and Validation', () {
    late SchemaInterpreter interpreter;

    setUp(() {
      interpreter = SchemaInterpreter();
    });

    test('validates schema with missing schemaVersion', () {
      final schema = {
        'root': {
          'type': 'Text',
          'props': {'text': 'Hello'},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      expect(widget, isA<Widget>());
    });

    test('validates schema with missing root', () {
      final schema = {
        'schemaVersion': '1.0',
      };

      final widget = interpreter.interpretSchema(schema);
      expect(widget, isA<Widget>());
    });

    test('validates empty schema', () {
      final schema = <String, dynamic>{};

      final widget = interpreter.interpretSchema(schema);
      expect(widget, isA<Widget>());
    });

    test('validates schema with unsupported version', () {
      final schema = {
        'schemaVersion': '2.0',
        'root': {
          'type': 'Text',
          'props': {'text': 'Hello'},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      expect(widget, isA<Widget>());
    });

    test('validates schema with invalid root type', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': 'invalid',
      };

      final widget = interpreter.interpretSchema(schema);
      expect(widget, isA<Widget>());
    });
  });

  group('SchemaInterpreter - Widget Mapping', () {
    late SchemaInterpreter interpreter;

    setUp(() {
      interpreter = SchemaInterpreter();
    });

    testWidgets('renders View widget', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.byType(Container), findsOneWidget);
    });

    testWidgets('renders Text widget', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {'text': 'Hello World'},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.text('Hello World'), findsOneWidget);
      expect(find.byType(Text), findsOneWidget);
    });

    testWidgets('renders Button widget', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Button',
          'props': {'title': 'Click Me'},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.text('Click Me'), findsOneWidget);
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('renders List widget', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'List',
          'props': {},
          'children': [
            {
              'type': 'Text',
              'props': {'text': 'Item 1'},
              'children': [],
            },
            {
              'type': 'Text',
              'props': {'text': 'Item 2'},
              'children': [],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.byType(ListView), findsOneWidget);
      expect(find.text('Item 1'), findsOneWidget);
      expect(find.text('Item 2'), findsOneWidget);
    });

    testWidgets('renders Input widget', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Input',
          'props': {'placeholder': 'Enter text'},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.byType(TextField), findsOneWidget);
      
      final textField = tester.widget<TextField>(find.byType(TextField));
      expect(textField.decoration?.hintText, equals('Enter text'));
    });

    testWidgets('renders Image widget', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Image',
          'props': {
            'src': 'https://example.com/image.png',
            'width': 100,
            'height': 100,
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('renders unknown widget type with error', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'UnknownWidget',
          'props': {},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.byType(SchemaErrorWidget), findsOneWidget);
    });
  });

  group('SchemaInterpreter - Nested Structures', () {
    late SchemaInterpreter interpreter;

    setUp(() {
      interpreter = SchemaInterpreter();
    });

    testWidgets('renders nested View with children', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'Text',
              'props': {'text': 'Title'},
              'children': [],
            },
            {
              'type': 'Text',
              'props': {'text': 'Subtitle'},
              'children': [],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(child: widget),
          ),
        ),
      );

      expect(find.text('Title'), findsOneWidget);
      expect(find.text('Subtitle'), findsOneWidget);
    });

    testWidgets('renders deeply nested structure', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'View',
              'props': {},
              'children': [
                {
                  'type': 'View',
                  'props': {},
                  'children': [
                    {
                      'type': 'Text',
                      'props': {'text': 'Deep Text'},
                      'children': [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(child: widget),
          ),
        ),
      );

      expect(find.text('Deep Text'), findsOneWidget);
    });
  });

  group('SchemaInterpreter - Props Handling', () {
    late SchemaInterpreter interpreter;

    setUp(() {
      interpreter = SchemaInterpreter();
    });

    testWidgets('applies View padding prop', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {'padding': 'md'},
          'children': [
            {
              'type': 'Text',
              'props': {'text': 'Padded'},
              'children': [],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(child: widget),
          ),
        ),
      );

      expect(find.text('Padded'), findsOneWidget);
      expect(find.byType(Container), findsWidgets);
    });

    testWidgets('applies View backgroundColor prop', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {'backgroundColor': '#FF0000'},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      final container = tester.widget<Container>(find.byType(Container));
      expect(container.color, isNotNull);
    });

    testWidgets('applies Text style props', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': 'Styled Text',
            'style': {
              'fontSize': 20,
              'fontWeight': 'bold',
              'color': '#000000',
            },
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      final textWidget = tester.widget<Text>(find.text('Styled Text'));
      expect(textWidget.style?.fontSize, equals(20.0));
      expect(textWidget.style?.fontWeight, equals(FontWeight.bold));
    });

    testWidgets('handles missing required props gracefully', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.byType(Text), findsOneWidget);
    });
  });

  group('SchemaInterpreter - Error Handling', () {
    late SchemaInterpreter interpreter;

    setUp(() {
      interpreter = SchemaInterpreter();
    });

    testWidgets('displays error for Image with missing src', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Image',
          'props': {},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.byType(SchemaErrorWidget), findsOneWidget);
    });

    testWidgets('handles node with missing type', (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'props': {'text': 'No Type'},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.byType(SchemaErrorWidget), findsOneWidget);
    });
  });

  group('SchemaInterpreter - Performance', () {
    late SchemaInterpreter interpreter;

    setUp(() {
      interpreter = SchemaInterpreter();
    });

    testWidgets('uses lazy rendering for large lists', (WidgetTester tester) async {
      final children = List.generate(
        30,
        (index) => {
          'type': 'Text',
          'props': {'text': 'Item $index'},
          'children': [],
        },
      );

      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'List',
          'props': {},
          'children': children,
        },
      };

      final widget = interpreter.interpretSchema(schema);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.byType(ListView), findsOneWidget);
    });

    test('stores current schema for delta updates', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {'text': 'Hello'},
          'children': [],
        },
      };

      interpreter.interpretSchema(schema);

      expect(interpreter.currentSchema, isNotNull);
      expect(interpreter.currentSchema?['schemaVersion'], equals('1.0'));
    });
  });
}
