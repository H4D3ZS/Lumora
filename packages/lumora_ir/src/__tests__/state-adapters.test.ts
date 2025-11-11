/**
 * State Adapters Tests
 * Tests for Bloc, Riverpod, and Provider adapters
 */

import { StateDefinition } from '../types/ir-types';
import {
  BlocAdapter,
  RiverpodAdapter,
  ProviderAdapter,
  getAdapter,
  getAllAdapters,
  isValidAdapterType,
} from '../bridge/adapters';

describe('State Adapters', () => {
  const sampleState: StateDefinition = {
    type: 'global',
    variables: [
      { name: 'count', type: 'number', initialValue: 0, mutable: true },
      { name: 'message', type: 'string', initialValue: 'Hello', mutable: true },
      { name: 'isActive', type: 'boolean', initialValue: false, mutable: true },
    ],
  };

  describe('BlocAdapter', () => {
    let adapter: BlocAdapter;

    beforeEach(() => {
      adapter = new BlocAdapter();
    });

    it('should have correct name', () => {
      expect(adapter.name).toBe('bloc');
    });

    it('should generate Bloc state class', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.stateClass).toContain('class CounterState extends Equatable');
      expect(result.stateClass).toContain('final double count;');
      expect(result.stateClass).toContain('final String message;');
      expect(result.stateClass).toContain('final bool isActive;');
      expect(result.stateClass).toContain('copyWith');
      expect(result.stateClass).toContain('List<Object?> get props');
    });

    it('should generate Bloc event classes', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.eventClasses).toContain('abstract class CounterEvent extends Equatable');
      expect(result.eventClasses).toContain('class UpdateCountEvent extends CounterEvent');
      expect(result.eventClasses).toContain('class UpdateMessageEvent extends CounterEvent');
      expect(result.eventClasses).toContain('class UpdateIsActiveEvent extends CounterEvent');
    });

    it('should generate Bloc class with event handlers', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.providerCode).toContain('class CounterBloc extends Bloc<CounterEvent, CounterState>');
      expect(result.providerCode).toContain('on<UpdateCountEvent>(_onUpdateCount)');
      expect(result.providerCode).toContain('on<UpdateMessageEvent>(_onUpdateMessage)');
      expect(result.providerCode).toContain('on<UpdateIsActiveEvent>(_onUpdateIsActive)');
      expect(result.providerCode).toContain('void _onUpdateCount');
      expect(result.providerCode).toContain('Emitter<CounterState> emit');
    });

    it('should include correct imports', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.imports).toContain("import 'package:flutter_bloc/flutter_bloc.dart';");
      expect(result.imports).toContain("import 'package:equatable/equatable.dart';");
    });

    it('should generate usage example', () => {
      const usage = adapter.generateUsageExample('Counter');

      expect(usage).toContain('BlocProvider');
      expect(usage).toContain('BlocBuilder');
      expect(usage).toContain('BlocListener');
      expect(usage).toContain('CounterBloc');
    });

    it('should convert Bloc code back to state definition', () => {
      const dartCode = `
class CounterState extends Equatable {
  final int count;
  final String message;
}`;

      const state = adapter.convertFromFlutter(dartCode, 'Counter');

      expect(state.type).toBe('global');
      expect(state.variables).toHaveLength(2);
      expect(state.variables[0].name).toBe('count');
      expect(state.variables[0].type).toBe('number');
      expect(state.variables[1].name).toBe('message');
      expect(state.variables[1].type).toBe('string');
    });
  });

  describe('RiverpodAdapter', () => {
    let adapter: RiverpodAdapter;

    beforeEach(() => {
      adapter = new RiverpodAdapter();
    });

    it('should have correct name', () => {
      expect(adapter.name).toBe('riverpod');
    });

    it('should generate Riverpod state class', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.stateClass).toContain('class CounterState');
      expect(result.stateClass).toContain('final double count;');
      expect(result.stateClass).toContain('final String message;');
      expect(result.stateClass).toContain('final bool isActive;');
      expect(result.stateClass).toContain('copyWith');
    });

    it('should generate StateNotifier class', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.providerCode).toContain('class CounterNotifier extends StateNotifier<CounterState>');
      expect(result.providerCode).toContain('void updateCount(double value)');
      expect(result.providerCode).toContain('void updateMessage(String value)');
      expect(result.providerCode).toContain('void updateIsActive(bool value)');
      expect(result.providerCode).toContain('state = state.copyWith');
    });

    it('should generate provider definition', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.providerCode).toContain('final counterProvider = StateNotifierProvider<CounterNotifier, CounterState>');
    });

    it('should include correct imports', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.imports).toContain("import 'package:flutter_riverpod/flutter_riverpod.dart';");
    });

    it('should generate usage example', () => {
      const usage = adapter.generateUsageExample('Counter');

      expect(usage).toContain('ProviderScope');
      expect(usage).toContain('ConsumerWidget');
      expect(usage).toContain('ref.watch');
      expect(usage).toContain('ref.read');
      expect(usage).toContain('ref.listen');
    });

    it('should convert Riverpod code back to state definition', () => {
      const dartCode = `
class CounterState {
  final int count;
  final String message;
}`;

      const state = adapter.convertFromFlutter(dartCode, 'Counter');

      expect(state.type).toBe('global');
      expect(state.variables).toHaveLength(2);
      expect(state.variables[0].name).toBe('count');
      expect(state.variables[0].type).toBe('number');
    });
  });

  describe('ProviderAdapter', () => {
    let adapter: ProviderAdapter;

    beforeEach(() => {
      adapter = new ProviderAdapter();
    });

    it('should have correct name', () => {
      expect(adapter.name).toBe('provider');
    });

    it('should generate ChangeNotifier class', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.stateClass).toContain('class CounterProvider extends ChangeNotifier');
      expect(result.stateClass).toContain('double _count = 0;');
      expect(result.stateClass).toContain("String _message = 'Hello';");
      expect(result.stateClass).toContain('bool _isActive = false;');
    });

    it('should generate getters', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.stateClass).toContain('double get count => _count;');
      expect(result.stateClass).toContain('String get message => _message;');
      expect(result.stateClass).toContain('bool get isActive => _isActive;');
    });

    it('should generate setters with notifyListeners', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.stateClass).toContain('void setCount(double value)');
      expect(result.stateClass).toContain('void setMessage(String value)');
      expect(result.stateClass).toContain('void setIsActive(bool value)');
      expect(result.stateClass).toContain('notifyListeners()');
    });

    it('should include correct imports', () => {
      const result = adapter.convertToFlutter(sampleState, 'Counter');

      expect(result.imports).toContain("import 'package:flutter/foundation.dart';");
      expect(result.imports).toContain("import 'package:provider/provider.dart';");
    });

    it('should generate usage example', () => {
      const usage = adapter.generateUsageExample('Counter');

      expect(usage).toContain('ChangeNotifierProvider');
      expect(usage).toContain('Consumer');
      expect(usage).toContain('Provider.of');
      expect(usage).toContain('context.read');
      expect(usage).toContain('context.watch');
      expect(usage).toContain('MultiProvider');
    });

    it('should convert Provider code back to state definition', () => {
      const dartCode = `
class CounterProvider extends ChangeNotifier {
  int _count = 0;
  String _message = 'Hello';
}`;

      const state = adapter.convertFromFlutter(dartCode, 'Counter');

      expect(state.type).toBe('global');
      expect(state.variables).toHaveLength(2);
      expect(state.variables[0].name).toBe('count');
      expect(state.variables[0].type).toBe('number');
      expect(state.variables[0].initialValue).toBe(0);
    });
  });

  describe('Adapter Registry', () => {
    it('should get adapter by type', () => {
      const blocAdapter = getAdapter('bloc');
      const riverpodAdapter = getAdapter('riverpod');
      const providerAdapter = getAdapter('provider');

      expect(blocAdapter).toBeInstanceOf(BlocAdapter);
      expect(riverpodAdapter).toBeInstanceOf(RiverpodAdapter);
      expect(providerAdapter).toBeInstanceOf(ProviderAdapter);
    });

    it('should throw error for unknown adapter type', () => {
      expect(() => getAdapter('unknown' as any)).toThrow('Unknown adapter type');
    });

    it('should get all adapters', () => {
      const adapters = getAllAdapters();

      expect(adapters).toHaveLength(3);
      expect(adapters[0]).toBeInstanceOf(BlocAdapter);
      expect(adapters[1]).toBeInstanceOf(RiverpodAdapter);
      expect(adapters[2]).toBeInstanceOf(ProviderAdapter);
    });

    it('should validate adapter types', () => {
      expect(isValidAdapterType('bloc')).toBe(true);
      expect(isValidAdapterType('riverpod')).toBe(true);
      expect(isValidAdapterType('provider')).toBe(true);
      expect(isValidAdapterType('unknown')).toBe(false);
      expect(isValidAdapterType('getx')).toBe(false);
    });
  });

  describe('Type Mapping', () => {
    it('should map TypeScript types to Flutter types', () => {
      const adapter = new BlocAdapter();
      const result = adapter.convertToFlutter(
        {
          type: 'global',
          variables: [
            { name: 'str', type: 'string', initialValue: '', mutable: true },
            { name: 'num', type: 'number', initialValue: 0, mutable: true },
            { name: 'bool', type: 'boolean', initialValue: false, mutable: true },
            { name: 'arr', type: 'string[]', initialValue: [], mutable: true },
            { name: 'obj', type: 'object', initialValue: {}, mutable: true },
          ],
        },
        'Test'
      );

      expect(result.stateClass).toContain('final String str;');
      expect(result.stateClass).toContain('final double num;');
      expect(result.stateClass).toContain('final bool bool;');
      expect(result.stateClass).toContain('final List<String> arr;');
      expect(result.stateClass).toContain('final Map<String, dynamic> obj;');
    });

    it('should format initial values correctly', () => {
      const adapter = new BlocAdapter();
      const result = adapter.convertToFlutter(
        {
          type: 'global',
          variables: [
            { name: 'str', type: 'string', initialValue: 'test', mutable: true },
            { name: 'num', type: 'number', initialValue: 42, mutable: true },
            { name: 'bool', type: 'boolean', initialValue: true, mutable: true },
            { name: 'arr', type: 'string[]', initialValue: ['a', 'b'], mutable: true },
          ],
        },
        'Test'
      );

      expect(result.providerCode).toContain("str: 'test'");
      expect(result.providerCode).toContain('num: 42');
      expect(result.providerCode).toContain('bool: true');
      expect(result.providerCode).toContain("arr: ['a', 'b']");
    });
  });

  describe('Configuration Options', () => {
    it('should respect includeImports config', () => {
      const adapter = new BlocAdapter();
      
      const withUsage = adapter.convertToFlutter(sampleState, 'Counter', { includeImports: true });
      expect(withUsage.usage).toBeDefined();
      
      const withoutUsage = adapter.convertToFlutter(sampleState, 'Counter', { includeImports: false });
      expect(withoutUsage.usage).toBeUndefined();
    });
  });
});
