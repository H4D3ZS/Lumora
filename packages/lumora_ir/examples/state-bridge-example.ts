/**
 * State Bridge Integration Example
 * Demonstrates how to use the State Bridge with React and Flutter parsers
 */

import { ReactParser, StateBridge, StateDefinition } from '../src';

// Example 1: Convert React component with useState to Flutter
const reactCode = `
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Hello');

  return (
    <div>
      <h1>{message}</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
`;

console.log('=== Example 1: React useState to Flutter StatefulWidget ===\n');

// Parse React code
const reactParser = new ReactParser();
const ir = reactParser.parse(reactCode, 'Counter.tsx');

// Extract state from first component
const component = ir.nodes[0];
if (component.state) {
  // Convert to Flutter
  const bridge = new StateBridge({ targetAdapter: 'bloc' });
  const flutterCode = bridge.convertReactToFlutter(component.state, component.type);
  
  console.log('React State:');
  console.log(JSON.stringify(component.state, null, 2));
  console.log('\nGenerated Flutter Code:');
  console.log(flutterCode);
}

// Example 2: Convert React useReducer to Flutter Bloc
const reactReducerCode = `
import React, { useReducer } from 'react';

type Action = 
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset', payload: number };

function counterReducer(state: { count: number }, action: Action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: action.payload };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset', payload: 0 })}>Reset</button>
    </div>
  );
}
`;

console.log('\n\n=== Example 2: React useReducer to Flutter Bloc ===\n');

// For this example, we'll manually create the hook info
// In a real scenario, the parser would extract this
const hookInfo = {
  type: 'useReducer' as const,
  stateName: 'state',
  reducerName: 'counterReducer',
  initialValue: { count: 0 },
  actions: [
    { type: 'increment' },
    { type: 'decrement' },
    { type: 'reset', payload: 0 },
  ],
};

const bridge = new StateBridge({ targetAdapter: 'bloc' });
const blocCode = bridge.convertUseReducerToBloc(hookInfo, 'Counter');

console.log('React useReducer:');
console.log(JSON.stringify(hookInfo, null, 2));
console.log('\nGenerated Flutter Bloc:');
console.log(blocCode);

// Example 3: State Preservation During Hot Reload
console.log('\n\n=== Example 3: State Preservation During Hot Reload ===\n');

const oldState = {
  count: 42,
  message: 'User edited this',
  theme: 'dark',
};

const newState = {
  count: 0,
  message: 'Default message',
  isActive: true, // New field added
};

console.log('Old State (from running app):');
console.log(JSON.stringify(oldState, null, 2));

console.log('\nNew State (from code update):');
console.log(JSON.stringify(newState, null, 2));

const preserved = bridge.preserveState(oldState, newState);

console.log('\nPreserved State (after hot reload):');
console.log(JSON.stringify(preserved, null, 2));
console.log('\nNote: count and message preserved, theme removed, isActive added');

// Example 4: State Migration with Type Changes
console.log('\n\n=== Example 4: State Migration with Type Changes ===\n');

const oldStateWithTypes = {
  count: '42',
  isActive: 'true',
  theme: 'dark',
};

const oldDefinition: StateDefinition = {
  type: 'local',
  variables: [
    { name: 'count', type: 'string', initialValue: '0', mutable: true },
    { name: 'isActive', type: 'string', initialValue: 'false', mutable: true },
    { name: 'theme', type: 'string', initialValue: 'light', mutable: true },
  ],
};

const newDefinition: StateDefinition = {
  type: 'local',
  variables: [
    { name: 'count', type: 'number', initialValue: 0, mutable: true },
    { name: 'isActive', type: 'boolean', initialValue: false, mutable: true },
    { name: 'mode', type: 'string', initialValue: 'normal', mutable: true }, // theme renamed to mode
  ],
};

console.log('Old State (string types):');
console.log(JSON.stringify(oldStateWithTypes, null, 2));

console.log('\nOld Definition:');
console.log(JSON.stringify(oldDefinition, null, 2));

console.log('\nNew Definition (with type changes):');
console.log(JSON.stringify(newDefinition, null, 2));

const migrated = bridge.migrateState(oldStateWithTypes, oldDefinition, newDefinition);

console.log('\nMigrated State:');
console.log(JSON.stringify(migrated, null, 2));
console.log('\nNote: count converted to number, isActive to boolean, mode uses default');

// Example 5: Multiple State Adapters
console.log('\n\n=== Example 5: Multiple State Adapters ===\n');

const globalState: StateDefinition = {
  type: 'global',
  variables: [
    { name: 'user', type: 'string', initialValue: null, mutable: true },
    { name: 'isLoggedIn', type: 'boolean', initialValue: false, mutable: true },
  ],
};

console.log('State Definition:');
console.log(JSON.stringify(globalState, null, 2));

// Generate with different adapters
const adapters: Array<'bloc' | 'riverpod' | 'provider' | 'getx'> = ['bloc', 'riverpod', 'provider', 'getx'];

adapters.forEach(adapter => {
  console.log(`\n--- ${adapter.toUpperCase()} Adapter ---`);
  const adapterBridge = new StateBridge({ targetAdapter: adapter });
  const code = adapterBridge.convertReactToFlutter(globalState, 'Auth');
  console.log(code.substring(0, 300) + '...\n[truncated]');
});

// Example 6: State Snapshots for Debugging
console.log('\n\n=== Example 6: State Snapshots for Debugging ===\n');

const snapshot1 = bridge.createStateSnapshot(
  { count: 5, message: 'Hello' },
  {
    type: 'local',
    variables: [
      { name: 'count', type: 'number', initialValue: 0, mutable: true },
      { name: 'message', type: 'string', initialValue: '', mutable: true },
    ],
  }
);

console.log('Snapshot 1:');
console.log(`Timestamp: ${new Date(snapshot1.timestamp).toISOString()}`);
console.log(`State: ${JSON.stringify(snapshot1.state)}`);

// Simulate state change
setTimeout(() => {
  const snapshot2 = bridge.createStateSnapshot(
    { count: 10, message: 'Hello', isActive: true },
    {
      type: 'local',
      variables: [
        { name: 'count', type: 'number', initialValue: 0, mutable: true },
        { name: 'message', type: 'string', initialValue: '', mutable: true },
        { name: 'isActive', type: 'boolean', initialValue: false, mutable: true },
      ],
    }
  );

  console.log('\nSnapshot 2:');
  console.log(`Timestamp: ${new Date(snapshot2.timestamp).toISOString()}`);
  console.log(`State: ${JSON.stringify(snapshot2.state)}`);

  const comparison = bridge.compareStateSnapshots(snapshot1, snapshot2);

  console.log('\nComparison:');
  console.log(`Has Changes: ${comparison.hasChanges}`);
  console.log(`Number of Changes: ${comparison.changes.length}`);
  console.log('\nChanges:');
  comparison.changes.forEach(change => {
    console.log(`  - ${change.type}: ${change.variable}`);
    if (change.oldValue !== undefined) console.log(`    Old: ${JSON.stringify(change.oldValue)}`);
    if (change.newValue !== undefined) console.log(`    New: ${JSON.stringify(change.newValue)}`);
  });
}, 100);

console.log('\n\n=== Examples Complete ===\n');
console.log('The State Bridge provides powerful conversion and preservation capabilities');
console.log('for seamless state management across React and Flutter frameworks.');
