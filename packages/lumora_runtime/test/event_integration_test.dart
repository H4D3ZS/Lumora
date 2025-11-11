import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lumora_runtime/src/interpreter/schema_interpreter.dart';
import 'package:lumora_runtime/src/events/event_bridge.dart';
import 'package:lumora_runtime/src/state/state_manager.dart';

void main() {
  group('Event Integration', () {
    late LumoraInterpreter interpreter;
    late EventBridge eventBridge;
    late StateManager stateManager;

    setUp(() {
      eventBridge = EventBridge();
      stateManager = StateManager();
      interpreter = LumoraInterpreter(
        eventBridge: eventBridge,
        stateManager: stateManager,
      );
    });

    tearDown(() {
      eventBridge.clear();
      stateManager.clearAll();
    });

    group('Event Definition Initialization', () {
      test('should initialize events from schema', () {
        final schema = {
          'version': '1.0',
          'events': [
            {
              'name': 'handleClick',
              'handler': "setState('counter', \$counter + 1)",
              'parameters': {},
            },
          ],
          'nodes': [
            {
              'id': 'root',
              'type': 'View',
              'props': {},
              'children': [],
            },
          ],
        };

        interpreter.buildFromSchema(schema);

        expect(eventBridge.hasHandler('handleClick'), isTrue);
      });

      test('should initialize events from map format', () {
        final schema = {
          'version': '1.0',
          'events': {
            'onClick': {
              'handler': "setState('clicked', true)",
            },
            'onSubmit': {
              'handler': "setState('submitted', true)",
            },
          },
          'nodes': [
            {
              'id': 'root',
              'type': 'View',
              'props': {},
              'children': [],
            },
          ],
        };

        interpreter.buildFromSchema(schema);

        expect(eventBridge.hasHandler('onClick'), isTrue);
        expect(eventBridge.hasHandler('onSubmit'), isTrue);
      });
    });

    group('Event Handler Execution', () {
      test('should execute setState handler', () {
        stateManager.setValue('counter', 0);

        final schema = {
          'version': '1.0',
          'events': [
            {
              'name': 'increment',
              'handler': "setState('counter', \$counter + 1)",
            },
          ],
          'nodes': [
            {
              'id': 'root',
              'type': 'View',
              'props': {},
              'children': [],
            },
          ],
        };

        interpreter.buildFromSchema(schema);
        eventBridge.triggerEvent('increment');

        expect(stateManager.getValue('counter'), equals(1));
      });

      test('should execute direct assignment handler', () {
        stateManager.setValue('text', 'initial');

        final schema = {
          'version': '1.0',
          'events': [
            {
              'name': 'updateText',
              'handler': "\$text = 'updated'",
            },
          ],
          'nodes': [
            {
              'id': 'root',
              'type': 'View',
              'props': {},
              'children': [],
            },
          ],
        };

        interpreter.buildFromSchema(schema);
        eventBridge.triggerEvent('updateText');

        expect(stateManager.getValue('text'), equals('updated'));
      });

      test('should execute multiple statements', () {
        stateManager.setValue('a', 0);
        stateManager.setValue('b', 0);

        final schema = {
          'version': '1.0',
          'events': [
            {
              'name': 'updateBoth',
              'handler': "\$a = 1; \$b = 2",
            },
          ],
          'nodes': [
            {
              'id': 'root',
              'type': 'View',
              'props': {},
              'children': [],
            },
          ],
        };

        interpreter.buildFromSchema(schema);
        eventBridge.triggerEvent('updateBoth');

        expect(stateManager.getValue('a'), equals(1));
        expect(stateManager.getValue('b'), equals(2));
      });

      test('should handle event with parameters', () {
        stateManager.setValue('value', '');

        final schema = {
          'version': '1.0',
          'events': [
            {
              'name': 'setValue',
              'handler': "\$value = data",
              'parameters': {},
            },
          ],
          'nodes': [
            {
              'id': 'root',
              'type': 'View',
              'props': {},
              'children': [],
            },
          ],
        };

        interpreter.buildFromSchema(schema);
        eventBridge.triggerEvent('setValue', {'data': 'test value'});

        expect(stateManager.getValue('value'), equals('test value'));
      });
    });

    group('Event Binding in Props', () {
      testWidgets('should bind event handler to widget', (tester) async {
        var eventTriggered = false;

        eventBridge.registerHandler('testClick', (data) {
          eventTriggered = true;
        });

        final schema = {
          'version': '1.0',
          'nodes': [
            {
              'id': 'button',
              'type': 'Button',
              'props': {
                'title': 'Click Me',
                'onPress': {
                  '__event': 'testClick',
                },
              },
              'children': [],
            },
          ],
        };

        final widget = interpreter.buildFromSchema(schema);

        await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

        // Find and tap the button
        await tester.tap(find.byType(ElevatedButton));
        await tester.pump();

        expect(eventTriggered, isTrue);
      });

      testWidgets('should bind event handler with data', (tester) async {
        dynamic receivedData;

        eventBridge.registerHandler('inputChange', (data) {
          receivedData = data?['data'];
        });

        final schema = {
          'version': '1.0',
          'nodes': [
            {
              'id': 'input',
              'type': 'TextInput',
              'props': {
                'placeholder': 'Enter text',
                'onChange': {
                  '__event': 'inputChange',
                  'withData': true,
                },
              },
              'children': [],
            },
          ],
        };

        final widget = interpreter.buildFromSchema(schema);

        await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

        // Find and enter text
        await tester.enterText(find.byType(TextField), 'test input');
        await tester.pump();

        expect(receivedData, equals('test input'));
      });

      testWidgets('should bind async event handler', (tester) async {
        var asyncEventTriggered = false;

        eventBridge.registerAsyncHandler('asyncClick', (data) async {
          await Future.delayed(const Duration(milliseconds: 10));
          asyncEventTriggered = true;
        });

        final schema = {
          'version': '1.0',
          'nodes': [
            {
              'id': 'button',
              'type': 'Button',
              'props': {
                'title': 'Async Click',
                'onPress': {
                  '__event': 'asyncClick',
                  'async': true,
                },
              },
              'children': [],
            },
          ],
        };

        final widget = interpreter.buildFromSchema(schema);

        await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));

        await tester.tap(find.byType(ElevatedButton));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 20));

        expect(asyncEventTriggered, isTrue);
      });
    });

    group('Dev Server Communication', () {
      test('should send events to dev server when connected', () {
        var eventSent = false;
        String? sentEventId;
        Map<String, dynamic>? sentData;

        interpreter.connectToDevServer((eventId, data) {
          eventSent = true;
          sentEventId = eventId;
          sentData = data;
        });

        eventBridge.triggerEvent('testEvent', {'key': 'value'});

        expect(eventSent, isTrue);
        expect(sentEventId, equals('testEvent'));
        expect(sentData, equals({'key': 'value'}));
      });

      test('should handle event response from dev server', () {
        stateManager.setValue('serverValue', 'initial');

        interpreter.handleEventResponse({
          'stateUpdates': {
            'serverValue': 'updated from server',
          },
        });

        expect(stateManager.getValue('serverValue'), equals('updated from server'));
      });

      test('should handle clear state action from server', () {
        stateManager.setValue('value1', 'test1');
        stateManager.setValue('value2', 'test2');

        interpreter.handleEventResponse({
          'action': 'clearState',
        });

        expect(stateManager.getValue('value1'), isNull);
        expect(stateManager.getValue('value2'), isNull);
      });

      test('should handle update state action from server', () {
        stateManager.setValue('counter', 0);

        interpreter.handleEventResponse({
          'action': 'updateState',
          'payload': {
            'counter': 42,
          },
        });

        expect(stateManager.getValue('counter'), equals(42));
      });

      test('should disconnect from dev server', () {
        var eventSent = false;

        interpreter.connectToDevServer((eventId, data) {
          eventSent = true;
        });

        interpreter.disconnectFromDevServer();
        eventBridge.triggerEvent('testEvent');

        expect(eventSent, isFalse);
      });
    });

    group('Error Handling', () {
      test('should handle errors in event handlers gracefully', () {
        final schema = {
          'version': '1.0',
          'events': [
            {
              'name': 'errorEvent',
              'handler': "invalid syntax here",
            },
          ],
          'nodes': [
            {
              'id': 'root',
              'type': 'View',
              'props': {},
              'children': [],
            },
          ],
        };

        // Should not throw
        expect(() => interpreter.buildFromSchema(schema), returnsNormally);
      });

      test('should handle errors when sending to dev server', () {
        interpreter.connectToDevServer((eventId, data) {
          throw Exception('Server connection error');
        });

        // Should not throw
        expect(() => eventBridge.triggerEvent('testEvent'), returnsNormally);
      });
    });
  });
}
