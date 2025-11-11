import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumora_runtime/src/interpreter/schema_interpreter.dart';
import 'package:lumora_runtime/src/state/state_manager.dart';
import 'package:lumora_runtime/src/registry/widget_registry.dart';

void main() {
  group('State Integration with Interpreter', () {
    late LumoraInterpreter interpreter;
    late StateManager stateManager;

    setUp(() {
      stateManager = StateManager();
      final registry = WidgetRegistry(registerCore: true);
      
      interpreter = LumoraInterpreter(
        registry: registry,
        stateManager: stateManager,
      );
    });

    tearDown(() {
      stateManager.dispose();
    });

    testWidgets('should initialize state from schema', (tester) async {
      final schema = {
        'state': {
          'variables': [
            {
              'name': 'count',
              'type': 'int',
              'initialValue': 0,
              'mutable': true,
            },
            {
              'name': 'message',
              'type': 'String',
              'initialValue': 'Hello',
              'mutable': true,
            },
          ],
          'type': 'local',
        },
        'nodes': [
          {
            'id': 'text1',
            'type': 'Text',
            'props': {
              'text': r'$message',
            },
            'children': [],
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: interpreter.buildFromSchema(schema),
          ),
        ),
      );

      expect(stateManager.getValue('count'), 0);
      expect(stateManager.getValue('message'), 'Hello');
      expect(find.text('Hello'), findsOneWidget);
    });

    testWidgets('should resolve state references in props', (tester) async {
      stateManager.setValue('title', 'Test Title');
      stateManager.setValue('count', 42);

      final schema = {
        'nodes': [
          {
            'id': 'text1',
            'type': 'Text',
            'props': {
              'text': r'$title',
            },
            'children': [],
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: interpreter.buildFromSchema(schema),
          ),
        ),
      );

      expect(find.text('Test Title'), findsOneWidget);
    });

    testWidgets('should update widgets when state changes', (tester) async {
      stateManager.setValue('counter', 0);

      final schema = {
        'nodes': [
          {
            'id': 'text1',
            'type': 'Text',
            'props': {
              'text': r'$counter',
            },
            'children': [],
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: interpreter.buildFromSchema(schema),
          ),
        ),
      );

      expect(find.text('0'), findsOneWidget);

      // Update state
      stateManager.setValue('counter', 5);
      await tester.pump();

      expect(find.text('5'), findsOneWidget);
      expect(find.text('0'), findsNothing);
    });

    testWidgets('should preserve state during hot reload', (tester) async {
      final schema1 = {
        'state': {
          'variables': [
            {
              'name': 'count',
              'type': 'int',
              'initialValue': 0,
              'mutable': true,
            },
          ],
          'type': 'local',
        },
        'nodes': [
          {
            'id': 'text1',
            'type': 'Text',
            'props': {
              'text': r'$count',
            },
            'children': [],
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: interpreter.buildFromSchema(schema1),
          ),
        ),
      );

      // User changes state
      stateManager.setValue('count', 42);
      await tester.pump();
      expect(find.text('42'), findsOneWidget);

      // Hot reload with new schema (preserveState: true)
      final schema2 = {
        'state': {
          'variables': [
            {
              'name': 'count',
              'type': 'int',
              'initialValue': 0,
              'mutable': true,
            },
            {
              'name': 'newVar',
              'type': 'String',
              'initialValue': 'new',
              'mutable': true,
            },
          ],
          'type': 'local',
        },
        'nodes': [
          {
            'id': 'text1',
            'type': 'Text',
            'props': {
              'text': r'$count',
            },
            'children': [],
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: interpreter.buildFromSchema(schema2, preserveState: true),
          ),
        ),
      );

      // State should be preserved
      expect(stateManager.getValue('count'), 42);
      expect(stateManager.getValue('newVar'), 'new');
      expect(find.text('42'), findsOneWidget);
    });

    testWidgets('should handle global state', (tester) async {
      final schema = {
        'state': {
          'global': {
            'theme': 'dark',
            'language': 'en',
          },
        },
        'nodes': [
          {
            'id': 'text1',
            'type': 'Text',
            'props': {
              'text': r'$theme',
            },
            'children': [],
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: interpreter.buildFromSchema(schema),
          ),
        ),
      );

      expect(stateManager.getValue('theme'), 'dark');
      expect(stateManager.getValue('language'), 'en');
      expect(find.text('dark'), findsOneWidget);
    });

    testWidgets('should handle nested state references', (tester) async {
      stateManager.setValue('user', {
        'name': 'John',
        'age': 30,
      });

      final schema = {
        'nodes': [
          {
            'id': 'container',
            'type': 'View',
            'props': {
              'padding': 10,
            },
            'children': [
              {
                'id': 'text1',
                'type': 'Text',
                'props': {
                  'text': r'$user',
                },
                'children': [],
              },
            ],
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: interpreter.buildFromSchema(schema),
          ),
        ),
      );

      // Should render the map as string
      expect(find.textContaining('John'), findsOneWidget);
    });

    testWidgets('should handle multiple state references in same widget', (tester) async {
      stateManager.setValue('firstName', 'John');
      stateManager.setValue('lastName', 'Doe');

      final schema = {
        'nodes': [
          {
            'id': 'view',
            'type': 'View',
            'props': {
              'width': r'$firstName',
              'height': r'$lastName',
            },
            'children': [],
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: interpreter.buildFromSchema(schema),
          ),
        ),
      );

      // Widget should be built without errors
      expect(find.byType(Container), findsOneWidget);
    });
  });
}
