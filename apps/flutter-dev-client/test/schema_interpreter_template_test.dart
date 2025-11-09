import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dev_client/interpreter/schema_interpreter.dart';

void main() {
  group('SchemaInterpreter Template Integration', () {
    late SchemaInterpreter interpreter;

    setUp(() {
      interpreter = SchemaInterpreter();
    });

    testWidgets('resolves template placeholders in Text widget',
        (WidgetTester tester) async {
      interpreter.setContextVariable('name', 'John');

      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': 'Hello {{name}}!',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.text('Hello John!'), findsOneWidget);
    });

    testWidgets('resolves multiple placeholders', (WidgetTester tester) async {
      interpreter.setContextVariables({
        'firstName': 'John',
        'lastName': 'Doe',
      });

      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': 'Hello {{firstName}} {{lastName}}!',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.text('Hello John Doe!'), findsOneWidget);
    });

    testWidgets('resolves placeholders in nested structures',
        (WidgetTester tester) async {
      interpreter.setContextVariables({
        'title': 'Welcome',
        'message': 'Hello World',
      });

      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'Text',
              'props': {
                'text': '{{title}}',
              },
              'children': [],
            },
            {
              'type': 'Text',
              'props': {
                'text': '{{message}}',
              },
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

      expect(find.text('Welcome'), findsOneWidget);
      expect(find.text('Hello World'), findsOneWidget);
    });

    testWidgets('handles missing variables with empty string',
        (WidgetTester tester) async {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': 'Hello {{name}}!',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.text('Hello !'), findsOneWidget);
    });

    testWidgets('resolves numeric values to strings',
        (WidgetTester tester) async {
      interpreter.setContextVariables({
        'count': 42,
        'price': 19.99,
      });

      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': 'Count: {{count}}, Price: \${{price}}',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.text('Count: 42, Price: \$19.99'), findsOneWidget);
    });

    testWidgets('resolves boolean values to strings',
        (WidgetTester tester) async {
      interpreter.setContextVariable('active', true);

      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': 'Status: {{active}}',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.text('Status: true'), findsOneWidget);
    });

    testWidgets('resolves placeholders in Button title',
        (WidgetTester tester) async {
      interpreter.setContextVariable('action', 'Submit');

      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Button',
          'props': {
            'title': '{{action}} Form',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.text('Submit Form'), findsOneWidget);
    });

    testWidgets('resolves placeholders in Input placeholder',
        (WidgetTester tester) async {
      interpreter.setContextVariable('fieldName', 'Email');

      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Input',
          'props': {
            'placeholder': 'Enter your {{fieldName}}',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.byType(TextField), findsOneWidget);
      
      final textField = tester.widget<TextField>(find.byType(TextField));
      expect(
        textField.decoration?.hintText,
        equals('Enter your Email'),
      );
    });

    testWidgets('context variables persist across schema updates',
        (WidgetTester tester) async {
      interpreter.setContextVariable('name', 'John');

      final schema1 = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': 'Hello {{name}}!',
          },
          'children': [],
        },
      };

      final widget1 = interpreter.interpretSchema(schema1);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget1)));
      expect(find.text('Hello John!'), findsOneWidget);

      // Update context variable
      interpreter.setContextVariable('name', 'Alice');

      final schema2 = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': 'Welcome {{name}}!',
          },
          'children': [],
        },
      };

      final widget2 = interpreter.interpretSchema(schema2);
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget2)));
      expect(find.text('Welcome Alice!'), findsOneWidget);
    });

    testWidgets('clearContext removes all variables',
        (WidgetTester tester) async {
      interpreter.setContextVariables({
        'name': 'John',
        'age': 30,
      });

      interpreter.clearContext();

      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': 'Name: {{name}}, Age: {{age}}',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

      expect(find.text('Name: , Age: '), findsOneWidget);
    });

    testWidgets('resolves placeholders in complex nested schema',
        (WidgetTester tester) async {
      interpreter.setContextVariables({
        'userName': 'Alice',
        'messageCount': 5,
        'theme': 'dark',
      });

      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'Text',
              'props': {
                'text': 'Welcome {{userName}}',
              },
              'children': [],
            },
            {
              'type': 'View',
              'props': {},
              'children': [
                {
                  'type': 'Text',
                  'props': {
                    'text': 'You have {{messageCount}} new messages',
                  },
                  'children': [],
                },
                {
                  'type': 'Text',
                  'props': {
                    'text': 'Theme: {{theme}}',
                  },
                  'children': [],
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

      expect(find.text('Welcome Alice'), findsOneWidget);
      expect(find.text('You have 5 new messages'), findsOneWidget);
      expect(find.text('Theme: dark'), findsOneWidget);
    });

    test('getContextVariable retrieves set variables', () {
      interpreter.setContextVariable('name', 'John');
      interpreter.setContextVariable('age', 30);

      expect(interpreter.getContextVariable('name'), equals('John'));
      expect(interpreter.getContextVariable('age'), equals(30));
      expect(interpreter.getContextVariable('nonexistent'), isNull);
    });

    test('renderContext is accessible', () {
      interpreter.setContextVariable('test', 'value');
      
      final context = interpreter.renderContext;
      expect(context.get('test'), equals('value'));
    });
  });
}
