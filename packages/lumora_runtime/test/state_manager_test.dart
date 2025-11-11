import 'package:flutter_test/flutter_test.dart';
import 'package:lumora_runtime/src/state/state_manager.dart';

void main() {
  group('StateManager', () {
    late StateManager stateManager;

    setUp(() {
      stateManager = StateManager();
    });

    tearDown(() {
      stateManager.dispose();
    });

    test('should get and set local state values', () {
      stateManager.setValue('count', 0);
      expect(stateManager.getValue('count'), 0);

      stateManager.setValue('count', 5);
      expect(stateManager.getValue('count'), 5);
    });

    test('should get and set global state values', () {
      stateManager.setGlobalValue('theme', 'dark');
      expect(stateManager.getValue('theme'), 'dark');

      stateManager.setGlobalValue('theme', 'light');
      expect(stateManager.getValue('theme'), 'light');
    });

    test('should prioritize local state over global state', () {
      stateManager.setGlobalValue('name', 'global');
      stateManager.setValue('name', 'local');

      expect(stateManager.getValue('name'), 'local');
    });

    test('should initialize state from map', () {
      stateManager.initializeState({
        'count': 10,
        'text': 'hello',
      });

      expect(stateManager.getValue('count'), 10);
      expect(stateManager.getValue('text'), 'hello');
    });

    test('should notify listeners on state change', () {
      var notified = false;
      stateManager.addListener(() {
        notified = true;
      });

      stateManager.setValue('test', 'value');
      expect(notified, true);
    });

    test('should not notify listeners if value does not change', () {
      stateManager.setValue('test', 'value');
      
      var notifyCount = 0;
      stateManager.addListener(() {
        notifyCount++;
      });

      stateManager.setValue('test', 'value');
      expect(notifyCount, 0);
    });

    test('should add and notify specific state listeners', () {
      var oldValue;
      var newValue;
      var listenerCalled = false;

      stateManager.addStateListener('count', (name, old, newVal) {
        listenerCalled = true;
        oldValue = old;
        newValue = newVal;
      });

      stateManager.setValue('count', 5);

      expect(listenerCalled, true);
      expect(oldValue, null);
      expect(newValue, 5);
    });

    test('should remove specific state listeners', () {
      var callCount = 0;
      void listener(String name, dynamic old, dynamic newVal) {
        callCount++;
      }

      stateManager.addStateListener('count', listener);
      stateManager.setValue('count', 1);
      expect(callCount, 1);

      stateManager.removeStateListener('count', listener);
      stateManager.setValue('count', 2);
      expect(callCount, 1); // Should not increase
    });

    test('should preserve and restore state', () {
      stateManager.setValue('count', 42);
      stateManager.setGlobalValue('theme', 'dark');

      stateManager.preserveState();

      // Clear state
      stateManager.clearAll();
      expect(stateManager.getValue('count'), null);
      expect(stateManager.getValue('theme'), null);

      // Restore preserved values
      stateManager.restoreState();

      expect(stateManager.getValue('count'), 42);
      expect(stateManager.getValue('theme'), 'dark');
    });

    test('should merge preserved state with new state', () {
      stateManager.setValue('count', 42);
      stateManager.setValue('name', 'John');

      stateManager.preserveState();

      // New state with additional variable
      stateManager.clearLocalState();
      stateManager.mergePreservedState({
        'count': 0,
        'name': 'Default',
        'age': 25, // New variable
      });

      expect(stateManager.getValue('count'), 42); // Preserved
      expect(stateManager.getValue('name'), 'John'); // Preserved
      expect(stateManager.getValue('age'), 25); // New
    });

    test('should check if value exists', () {
      expect(stateManager.hasValue('test'), false);

      stateManager.setValue('test', 'value');
      expect(stateManager.hasValue('test'), true);

      stateManager.setGlobalValue('global', 'value');
      expect(stateManager.hasValue('global'), true);
    });

    test('should clear local state only', () {
      stateManager.setValue('local', 'value');
      stateManager.setGlobalValue('global', 'value');

      stateManager.clearLocalState();

      expect(stateManager.getValue('local'), null);
      expect(stateManager.getValue('global'), 'value');
    });

    test('should clear global state only', () {
      stateManager.setValue('local', 'value');
      stateManager.setGlobalValue('global', 'value');

      stateManager.clearGlobalState();

      expect(stateManager.getValue('local'), 'value');
      expect(stateManager.getValue('global'), null);
    });

    test('should clear all state', () {
      stateManager.setValue('local', 'value');
      stateManager.setGlobalValue('global', 'value');

      stateManager.clearAll();

      expect(stateManager.getValue('local'), null);
      expect(stateManager.getValue('global'), null);
    });

    test('should return unmodifiable state maps', () {
      stateManager.setValue('test', 'value');

      final localState = stateManager.localState;
      expect(() => localState['test'] = 'modified', throwsUnsupportedError);
    });

    test('should track listener count', () {
      expect(stateManager.listenerCount, 0);

      stateManager.addStateListener('count', (name, old, newVal) {});
      expect(stateManager.listenerCount, 1);

      stateManager.addStateListener('name', (name, old, newVal) {});
      expect(stateManager.listenerCount, 2);
    });
  });
}
