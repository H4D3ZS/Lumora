import 'package:flutter_test/flutter_test.dart';
import 'package:lumora_runtime/src/events/event_bridge.dart';

void main() {
  group('EventBridge', () {
    late EventBridge eventBridge;

    setUp(() {
      eventBridge = EventBridge();
    });

    tearDown(() {
      eventBridge.clear();
    });

    group('Handler Registration', () {
      test('should register and trigger synchronous event handler', () {
        var triggered = false;
        Map<String, dynamic>? receivedData;

        eventBridge.registerHandler('testEvent', (data) {
          triggered = true;
          receivedData = data;
        });

        eventBridge.triggerEvent('testEvent', {'key': 'value'});

        expect(triggered, isTrue);
        expect(receivedData, equals({'key': 'value'}));
      });

      test('should register and trigger asynchronous event handler', () async {
        var triggered = false;
        Map<String, dynamic>? receivedData;

        eventBridge.registerAsyncHandler('asyncEvent', (data) async {
          await Future.delayed(const Duration(milliseconds: 10));
          triggered = true;
          receivedData = data;
        });

        await eventBridge.triggerEventAsync('asyncEvent', {'async': 'data'});

        expect(triggered, isTrue);
        expect(receivedData, equals({'async': 'data'}));
      });

      test('should unregister event handler', () {
        var triggered = false;

        eventBridge.registerHandler('testEvent', (data) {
          triggered = true;
        });

        eventBridge.unregisterHandler('testEvent');
        eventBridge.triggerEvent('testEvent');

        expect(triggered, isFalse);
      });

      test('should replace sync handler with async handler', () {
        var syncTriggered = false;
        var asyncTriggered = false;

        eventBridge.registerHandler('testEvent', (data) {
          syncTriggered = true;
        });

        eventBridge.registerAsyncHandler('testEvent', (data) async {
          asyncTriggered = true;
        });

        eventBridge.triggerEvent('testEvent');

        expect(syncTriggered, isFalse);
        expect(asyncTriggered, isTrue);
      });

      test('should check if handler is registered', () {
        expect(eventBridge.hasHandler('testEvent'), isFalse);

        eventBridge.registerHandler('testEvent', (data) {});

        expect(eventBridge.hasHandler('testEvent'), isTrue);
      });
    });

    group('Handler Wrappers', () {
      test('should create VoidCallback handler', () {
        var triggered = false;
        Map<String, dynamic>? receivedData;

        eventBridge.registerHandler('buttonClick', (data) {
          triggered = true;
          receivedData = data;
        });

        final handler = eventBridge.createHandler(
          'buttonClick',
          parameters: {'source': 'button'},
        );

        handler();

        expect(triggered, isTrue);
        expect(receivedData, equals({'source': 'button'}));
      });

      test('should create handler with data parameter', () {
        var triggered = false;
        dynamic receivedValue;

        eventBridge.registerHandler('inputChange', (data) {
          triggered = true;
          receivedValue = data?['data'];
        });

        final handler = eventBridge.createHandlerWithData('inputChange');

        handler('test input');

        expect(triggered, isTrue);
        expect(receivedValue, equals('test input'));
      });

      test('should create async VoidCallback handler', () async {
        var triggered = false;

        eventBridge.registerAsyncHandler('asyncClick', (data) async {
          await Future.delayed(const Duration(milliseconds: 10));
          triggered = true;
        });

        final handler = eventBridge.createAsyncHandler('asyncClick');

        handler();
        await Future.delayed(const Duration(milliseconds: 20));

        expect(triggered, isTrue);
      });

      test('should create async handler with data parameter', () async {
        var triggered = false;
        dynamic receivedValue;

        eventBridge.registerAsyncHandler('asyncInput', (data) async {
          await Future.delayed(const Duration(milliseconds: 10));
          triggered = true;
          receivedValue = data?['data'];
        });

        final handler = eventBridge.createAsyncHandlerWithData('asyncInput');

        handler('async value');
        await Future.delayed(const Duration(milliseconds: 20));

        expect(triggered, isTrue);
        expect(receivedValue, equals('async value'));
      });
    });

    group('Error Handling', () {
      test('should handle errors in synchronous handlers', () {
        var errorHandled = false;
        String? errorEventId;

        final bridge = EventBridge(
          errorHandler: (eventId, error, stackTrace) {
            errorHandled = true;
            errorEventId = eventId;
          },
        );

        bridge.registerHandler('errorEvent', (data) {
          throw Exception('Test error');
        });

        bridge.triggerEvent('errorEvent');

        expect(errorHandled, isTrue);
        expect(errorEventId, equals('errorEvent'));
      });

      test('should handle errors in asynchronous handlers', () async {
        var errorHandled = false;
        String? errorEventId;

        final bridge = EventBridge(
          errorHandler: (eventId, error, stackTrace) {
            errorHandled = true;
            errorEventId = eventId;
          },
        );

        bridge.registerAsyncHandler('asyncError', (data) async {
          throw Exception('Async test error');
        });

        await bridge.triggerEventAsync('asyncError');

        expect(errorHandled, isTrue);
        expect(errorEventId, equals('asyncError'));
      });

      test('should handle errors in handler wrappers', () {
        var errorHandled = false;

        final bridge = EventBridge(
          errorHandler: (eventId, error, stackTrace) {
            errorHandled = true;
          },
        );

        bridge.registerHandler('wrapperError', (data) {
          throw Exception('Wrapper error');
        });

        final handler = bridge.createHandler('wrapperError');

        // Should not throw
        expect(() => handler(), returnsNormally);
        expect(errorHandled, isTrue);
      });

      test('should continue execution after handler error', () {
        var listenerCalled = false;
        var errorHandled = false;

        final bridge = EventBridge(
          errorHandler: (eventId, error, stackTrace) {
            errorHandled = true;
          },
        );

        bridge.registerHandler('errorEvent', (data) {
          throw Exception('Handler error');
        });

        bridge.addListener((eventId, data) {
          listenerCalled = true;
        });

        bridge.triggerEvent('errorEvent');

        expect(errorHandled, isTrue);
        expect(listenerCalled, isTrue);
      });
    });

    group('Event Listeners', () {
      test('should notify listeners when event is triggered', () {
        var listenerCalled = false;
        String? receivedEventId;
        Map<String, dynamic>? receivedData;

        eventBridge.addListener((eventId, data) {
          listenerCalled = true;
          receivedEventId = eventId;
          receivedData = data;
        });

        eventBridge.triggerEvent('testEvent', {'listener': 'data'});

        expect(listenerCalled, isTrue);
        expect(receivedEventId, equals('testEvent'));
        expect(receivedData, equals({'listener': 'data'}));
      });

      test('should notify multiple listeners', () {
        var listener1Called = false;
        var listener2Called = false;

        eventBridge.addListener((eventId, data) {
          listener1Called = true;
        });

        eventBridge.addListener((eventId, data) {
          listener2Called = true;
        });

        eventBridge.triggerEvent('testEvent');

        expect(listener1Called, isTrue);
        expect(listener2Called, isTrue);
      });

      test('should remove listener', () {
        var listenerCalled = false;

        void listener(String eventId, Map<String, dynamic>? data) {
          listenerCalled = true;
        }

        eventBridge.addListener(listener);
        eventBridge.removeListener(listener);
        eventBridge.triggerEvent('testEvent');

        expect(listenerCalled, isFalse);
      });

      test('should notify listeners even when no handler is registered', () {
        var listenerCalled = false;

        eventBridge.addListener((eventId, data) {
          listenerCalled = true;
        });

        eventBridge.triggerEvent('unregisteredEvent');

        expect(listenerCalled, isTrue);
      });

      test('should handle errors in listeners gracefully', () {
        var listener2Called = false;

        eventBridge.addListener((eventId, data) {
          throw Exception('Listener error');
        });

        eventBridge.addListener((eventId, data) {
          listener2Called = true;
        });

        // Should not throw
        expect(() => eventBridge.triggerEvent('testEvent'), returnsNormally);
        expect(listener2Called, isTrue);
      });
    });

    group('Async Event Handling', () {
      test('should fall back to sync handler if no async handler exists', () async {
        var syncCalled = false;

        eventBridge.registerHandler('testEvent', (data) {
          syncCalled = true;
        });

        await eventBridge.triggerEventAsync('testEvent');

        expect(syncCalled, isTrue);
      });

      test('should trigger async handler from sync trigger', () {
        var asyncCalled = false;

        eventBridge.registerAsyncHandler('testEvent', (data) async {
          await Future.delayed(const Duration(milliseconds: 10));
          asyncCalled = true;
        });

        eventBridge.triggerEvent('testEvent');

        // Give async handler time to execute
        Future.delayed(const Duration(milliseconds: 20), () {
          expect(asyncCalled, isTrue);
        });
      });
    });

    group('State Management', () {
      test('should clear all handlers and listeners', () {
        eventBridge.registerHandler('event1', (data) {});
        eventBridge.registerAsyncHandler('event2', (data) async {});
        eventBridge.addListener((eventId, data) {});

        expect(eventBridge.handlerCount, equals(2));
        expect(eventBridge.listenerCount, equals(1));

        eventBridge.clear();

        expect(eventBridge.handlerCount, equals(0));
        expect(eventBridge.listenerCount, equals(0));
      });

      test('should get all registered event IDs', () {
        eventBridge.registerHandler('event1', (data) {});
        eventBridge.registerAsyncHandler('event2', (data) async {});
        eventBridge.registerHandler('event3', (data) {});

        final events = eventBridge.registeredEvents;

        expect(events.length, equals(3));
        expect(events, containsAll(['event1', 'event2', 'event3']));
      });

      test('should count handlers correctly', () {
        expect(eventBridge.handlerCount, equals(0));

        eventBridge.registerHandler('event1', (data) {});
        expect(eventBridge.handlerCount, equals(1));

        eventBridge.registerAsyncHandler('event2', (data) async {});
        expect(eventBridge.handlerCount, equals(2));

        eventBridge.unregisterHandler('event1');
        expect(eventBridge.handlerCount, equals(1));
      });

      test('should count listeners correctly', () {
        expect(eventBridge.listenerCount, equals(0));

        eventBridge.addListener((eventId, data) {});
        expect(eventBridge.listenerCount, equals(1));

        eventBridge.addListener((eventId, data) {});
        expect(eventBridge.listenerCount, equals(2));
      });
    });
  });
}
