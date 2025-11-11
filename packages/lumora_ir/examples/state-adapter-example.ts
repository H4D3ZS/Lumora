/**
 * State Adapter Example
 * Demonstrates how to use different state management adapters
 */

import {
  StateDefinition,
  getAdapter,
  BlocAdapter,
  RiverpodAdapter,
  ProviderAdapter,
  getAllAdapters,
} from '../src';

// Define a sample state
const counterState: StateDefinition = {
  type: 'global',
  variables: [
    { name: 'count', type: 'number', initialValue: 0, mutable: true },
    { name: 'message', type: 'string', initialValue: 'Hello World', mutable: true },
    { name: 'isActive', type: 'boolean', initialValue: false, mutable: true },
  ],
};

console.log('=== State Adapter Examples ===\n');

// Example 1: Using Bloc Adapter
console.log('1. BLOC ADAPTER');
console.log('---------------');
const blocAdapter = new BlocAdapter();
const blocResult = blocAdapter.convertToFlutter(counterState, 'Counter');

console.log('State Class:');
console.log(blocResult.stateClass);
console.log('\nEvent Classes:');
console.log(blocResult.eventClasses);
console.log('\nBloc Class:');
console.log(blocResult.providerCode);
console.log('\nImports:');
blocResult.imports.forEach(imp => console.log(imp));

// Example 2: Using Riverpod Adapter
console.log('\n\n2. RIVERPOD ADAPTER');
console.log('-------------------');
const riverpodAdapter = new RiverpodAdapter();
const riverpodResult = riverpodAdapter.convertToFlutter(counterState, 'Counter');

console.log('State Class:');
console.log(riverpodResult.stateClass);
console.log('\nStateNotifier & Provider:');
console.log(riverpodResult.providerCode);
console.log('\nImports:');
riverpodResult.imports.forEach(imp => console.log(imp));

// Example 3: Using Provider Adapter
console.log('\n\n3. PROVIDER ADAPTER');
console.log('-------------------');
const providerAdapter = new ProviderAdapter();
const providerResult = providerAdapter.convertToFlutter(counterState, 'Counter');

console.log('ChangeNotifier Class:');
console.log(providerResult.stateClass);
console.log('\nImports:');
providerResult.imports.forEach(imp => console.log(imp));

// Example 4: Using Adapter Registry
console.log('\n\n4. ADAPTER REGISTRY');
console.log('-------------------');
const adapter = getAdapter('bloc');
console.log(`Selected adapter: ${adapter.name}`);

const allAdapters = getAllAdapters();
console.log(`\nAvailable adapters: ${allAdapters.map(a => a.name).join(', ')}`);

// Example 5: Generate Usage Examples
console.log('\n\n5. USAGE EXAMPLES');
console.log('-----------------');
console.log('\nBloc Usage:');
console.log(blocAdapter.generateUsageExample('Counter'));

console.log('\n\nRiverpod Usage:');
console.log(riverpodAdapter.generateUsageExample('Counter'));

console.log('\n\nProvider Usage:');
console.log(providerAdapter.generateUsageExample('Counter'));

// Example 6: Converting Back to State Definition
console.log('\n\n6. REVERSE CONVERSION');
console.log('---------------------');
const dartCode = `
class CounterState extends Equatable {
  final int count;
  final String message;
}`;

const reversedState = blocAdapter.convertFromFlutter(dartCode, 'Counter');
console.log('Extracted state definition:');
console.log(JSON.stringify(reversedState, null, 2));

// Example 7: Complex State with Arrays and Objects
console.log('\n\n7. COMPLEX STATE');
console.log('----------------');
const complexState: StateDefinition = {
  type: 'global',
  variables: [
    { name: 'users', type: 'string[]', initialValue: [], mutable: true },
    { name: 'settings', type: 'object', initialValue: { theme: 'dark' }, mutable: true },
    { name: 'count', type: 'number', initialValue: 42, mutable: true },
  ],
};

const complexResult = blocAdapter.convertToFlutter(complexState, 'App');
console.log('Complex State Class:');
console.log(complexResult.stateClass);

// Example 8: Configuration Options
console.log('\n\n8. CONFIGURATION OPTIONS');
console.log('------------------------');
const withoutUsage = blocAdapter.convertToFlutter(counterState, 'Counter', {
  includeImports: false,
});
console.log(`Usage example included: ${withoutUsage.usage !== undefined}`);

const withUsage = blocAdapter.convertToFlutter(counterState, 'Counter', {
  includeImports: true,
});
console.log(`Usage example included: ${withUsage.usage !== undefined}`);

console.log('\n=== Examples Complete ===');
