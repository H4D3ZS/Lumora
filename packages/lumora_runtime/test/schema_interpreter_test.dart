import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumora_runtime/lumora_runtime.dart';

void main() {
  group('LumoraInterpreter', () {
    late LumoraInterpreter interpreter;

    setUp(() {
      interpreter = LumoraInterpreter();
    });

    group('buildFromSchema', () {
      test('builds widget from single node schema', () {
        final schema = {
          'id': 'node1',
          'type': 'View',
          'props': {},
          'children': [],
        };

        final widget = interpreter.buildFromSchema(schema);
        expect(widget, isA<Widget>());
      });

      test('builds widget from full schema with nodes array', () {
        final schema = {
          'version': '1.0',
          'nodes': [
            {
              'id': 'node1',
              'type': 'View',
              'props': {},
              'children': [],
            }
          ],
        };

        final widget = interpreter.buildFromSchema(schema);
        expect(widget, isA<Widget>());
      });

      test('wraps multiple root nodes in Column', () {
        final schema = {
          'nodes': [
            {
              'id': 'node1',
              'type': 'Text',
              'props': {'text': 'First'},
              'children': [],
            },
            {
              'id': 'node2',
              'type': 'Text',
              'props': {'text': 'Second'},
              'children': [],
            },
          ],
        };

        final widget = interpreter.buildFromSchema(schema);
        // Widget is wrapped in ListenableBuilder for state reactivity
        expect(widget, isA<ListenableBuilder>());
      });

      test('returns empty widget for empty nodes array', () {
        final schema = {
          'nodes': [],
        };

        final widget = interpreter.buildFromSchema(schema);
        expect(widget, isA<SizedBox>());
      });

      test('returns error widget for invalid schema', () {
        final schema = {
          'invalid': 'data',
        };

        final widget = interpreter.buildFromSchema(schema);
        expect(widget, isA<Container>());
      });
    });

    group('buildWidget', () {
      test('builds widget with resolved type', () {
        final node = LumoraNode(
          id: 'node1',
          type: 'View',
          props: const {},
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });

      test('resolves React type aliases', () {
        final node = LumoraNode(
          id: 'node1',
          type: 'div',
          props: const {},
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });

      test('builds fallback widget for unknown type', () {
        final node = LumoraNode(
          id: 'node1',
          type: 'UnknownWidget',
          props: const {},
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Container>());
      });

      test('recursively builds child widgets', () {
        final node = LumoraNode(
          id: 'parent',
          type: 'View',
          props: const {},
          children: const [
            LumoraNode(
              id: 'child1',
              type: 'Text',
              props: {'text': 'Child 1'},
              children: [],
            ),
            LumoraNode(
              id: 'child2',
              type: 'Text',
              props: {'text': 'Child 2'},
              children: [],
            ),
          ],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });

      test('generates stable keys for widgets', () {
        final node = LumoraNode(
          id: 'node1',
          type: 'View',
          props: const {},
          children: const [],
        );

        final widget1 = interpreter.buildWidget(node);
        final widget2 = interpreter.buildWidget(node);

        // Keys should be the same for the same node ID
        expect(widget1.key, equals(widget2.key));
      });
    });

    group('prop resolution', () {
      test('resolves state references', () {
        interpreter.stateManager.setValue('username', 'John');

        final node = LumoraNode(
          id: 'node1',
          type: 'Text',
          props: const {
            'text': r'$username',
          },
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });

      test('resolves event handlers', () {
        final node = LumoraNode(
          id: 'node1',
          type: 'Button',
          props: const {
            'onPress': {
              '__event': 'handleClick',
              'parameters': {'action': 'submit'},
            },
          },
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });

      test('resolves nested props recursively', () {
        interpreter.stateManager.setValue('color', 'red');

        final node = LumoraNode(
          id: 'node1',
          type: 'View',
          props: const {
            'style': {
              'backgroundColor': r'$color',
              'padding': 10,
            },
          },
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });

      test('converts string numbers to actual numbers', () {
        final node = LumoraNode(
          id: 'node1',
          type: 'View',
          props: const {
            'width': '100',
            'height': '50.5',
          },
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });

      test('converts string booleans to actual booleans', () {
        final node = LumoraNode(
          id: 'node1',
          type: 'TextInput',
          props: const {
            'enabled': 'true',
            'readOnly': 'false',
          },
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });

      test('resolves arrays recursively', () {
        interpreter.stateManager.setValue('item1', 'First');
        interpreter.stateManager.setValue('item2', 'Second');

        final node = LumoraNode(
          id: 'node1',
          type: 'View',
          props: const {
            'items': [r'$item1', r'$item2', 'Third'],
          },
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });
    });

    group('error handling', () {
      test('returns error widget when builder throws exception', () {
        // Register a builder that throws
        interpreter.registry.register('ErrorWidget', ({required props, required children, key}) {
          throw Exception('Test error');
        });

        final node = LumoraNode(
          id: 'node1',
          type: 'ErrorWidget',
          props: const {},
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Container>());
      });

      test('fallback widget still renders children', () {
        final node = LumoraNode(
          id: 'parent',
          type: 'UnknownWidget',
          props: const {},
          children: const [
            LumoraNode(
              id: 'child',
              type: 'Text',
              props: {'text': 'Child'},
              children: [],
            ),
          ],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Container>());
      });
    });

    group('type resolution', () {
      test('resolves div to View', () {
        final node = LumoraNode(
          id: 'node1',
          type: 'div',
          props: const {},
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });

      test('resolves button to Button', () {
        final node = LumoraNode(
          id: 'node1',
          type: 'button',
          props: const {},
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });

      test('resolves img to Image', () {
        final node = LumoraNode(
          id: 'node1',
          type: 'img',
          props: const {'source': 'https://example.com/image.png'},
          children: const [],
        );

        final widget = interpreter.buildWidget(node);
        expect(widget, isA<Widget>());
      });
    });
  });

  group('KeyGenerator', () {
    late KeyGenerator keyGenerator;

    setUp(() {
      keyGenerator = KeyGenerator();
    });

    test('generates stable keys for same node ID', () {
      final key1 = keyGenerator.generateKey('node1');
      final key2 = keyGenerator.generateKey('node1');

      expect(key1, equals(key2));
    });

    test('generates different keys for different node IDs', () {
      final key1 = keyGenerator.generateKey('node1');
      final key2 = keyGenerator.generateKey('node2');

      expect(key1, isNot(equals(key2)));
    });

    test('preserves keys during cache clear', () {
      final key1 = keyGenerator.generateKey('node1');
      keyGenerator.preserveKey('node1');
      
      keyGenerator.clearCache(preserveMarked: true);
      
      final key2 = keyGenerator.generateKey('node1');
      expect(key1, equals(key2));
    });

    test('removes non-preserved keys during cache clear', () {
      keyGenerator.generateKey('node1');
      keyGenerator.generateKey('node2');
      keyGenerator.preserveKey('node1');
      
      keyGenerator.clearCache(preserveMarked: true);
      
      expect(keyGenerator.hasKey('node1'), isTrue);
      expect(keyGenerator.hasKey('node2'), isFalse);
    });

    test('handles key conflicts', () {
      // First generate a key normally
      final key1 = keyGenerator.generateKey('node1');
      
      // Register a conflict (simulating a duplicate node ID)
      keyGenerator.registerConflict('node1');
      
      // Clear cache to force regeneration
      keyGenerator.removeKey('node1');
      
      // Generate again - should get a different key due to conflict
      final key2 = keyGenerator.generateKey('node1');

      expect(key1, isNot(equals(key2)));
    });

    test('prepares for update by preserving all keys', () {
      keyGenerator.generateKey('node1');
      keyGenerator.generateKey('node2');
      
      keyGenerator.prepareForUpdate();
      
      expect(keyGenerator.preservedCount, equals(2));
    });

    test('cleans up unused keys after update', () {
      keyGenerator.generateKey('node1');
      keyGenerator.generateKey('node2');
      keyGenerator.generateKey('node3');
      
      keyGenerator.prepareForUpdate();
      keyGenerator.cleanupAfterUpdate({'node1', 'node2'});
      
      expect(keyGenerator.hasKey('node1'), isTrue);
      expect(keyGenerator.hasKey('node2'), isTrue);
      expect(keyGenerator.hasKey('node3'), isFalse);
    });

    test('tracks cache size correctly', () {
      expect(keyGenerator.cacheSize, equals(0));
      
      keyGenerator.generateKey('node1');
      expect(keyGenerator.cacheSize, equals(1));
      
      keyGenerator.generateKey('node2');
      expect(keyGenerator.cacheSize, equals(2));
      
      keyGenerator.clearCache();
      expect(keyGenerator.cacheSize, equals(0));
    });

    test('removes specific keys', () {
      keyGenerator.generateKey('node1');
      keyGenerator.generateKey('node2');
      
      final removed = keyGenerator.removeKey('node1');
      
      expect(removed, isTrue);
      expect(keyGenerator.hasKey('node1'), isFalse);
      expect(keyGenerator.hasKey('node2'), isTrue);
    });
  });
}
