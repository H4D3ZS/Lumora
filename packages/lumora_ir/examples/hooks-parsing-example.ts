/**
 * React Hooks Parsing Example
 * Demonstrates the comprehensive hooks parsing capabilities
 */

import { ReactParser } from '../src/parsers/react-parser';

// Example React component with various hooks
const reactSource = `
import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from 'react';

const ThemeContext = React.createContext('light');

function ComplexComponent({ initialCount = 0 }) {
  // useState hooks
  const [count, setCount] = useState(initialCount);
  const [name, setName] = useState('John Doe');
  const [items, setItems] = useState([1, 2, 3]);
  const [user, setUser] = useState({ name: 'Jane', age: 30 });
  
  // useContext hook
  const theme = useContext(ThemeContext);
  
  // useRef hooks
  const inputRef = useRef(null);
  const renderCount = useRef(0);
  
  // useMemo hook
  const doubledCount = useMemo(() => count * 2, [count]);
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item, 0);
  }, [items]);
  
  // useCallback hooks
  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  const handleNameChange = useCallback((e) => {
    setName(e.target.value);
  }, []);
  
  // useEffect hooks
  useEffect(() => {
    // Mount effect
    console.log('Component mounted');
    renderCount.current += 1;
    
    return () => {
      console.log('Component unmounted');
    };
  }, []);
  
  useEffect(() => {
    // Effect with dependencies
    document.title = \`Count: \${count}\`;
  }, [count]);
  
  useEffect(() => {
    // Effect that runs on every render
    console.log('Component rendered');
  });
  
  // Custom hook
  const { data, loading, error } = useCustomData(count);
  
  return (
    <div className={theme}>
      <h1>{name}</h1>
      <p>Count: {count}</p>
      <p>Doubled: {doubledCount}</p>
      <p>Sum: {expensiveValue}</p>
      <input 
        ref={inputRef}
        value={name}
        onChange={handleNameChange}
      />
      <button onClick={increment}>Increment</button>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {data && <p>Data: {data}</p>}
    </div>
  );
}
`;

// Parse the component
const parser = new ReactParser();
const ir = parser.parse(reactSource, 'ComplexComponent.tsx');

// Display the results
console.log('=== React Hooks Parsing Example ===\n');

const component = ir.nodes[0];

console.log('Component Name:', component.type);
console.log('\n--- State Variables (from hooks) ---');
if (component.state) {
  component.state.variables.forEach((variable, index) => {
    console.log(`${index + 1}. ${variable.name}`);
    console.log(`   Type: ${variable.type}`);
    console.log(`   Initial Value: ${JSON.stringify(variable.initialValue)}`);
    console.log(`   Mutable: ${variable.mutable}`);
  });
}

console.log('\n--- Lifecycle Events (from useEffect) ---');
if (component.lifecycle) {
  component.lifecycle.forEach((lifecycle, index) => {
    console.log(`${index + 1}. Type: ${lifecycle.type}`);
    console.log(`   Dependencies: ${lifecycle.dependencies ? JSON.stringify(lifecycle.dependencies) : 'none'}`);
  });
}

console.log('\n--- Event Handlers ---');
if (component.events) {
  component.events.forEach((event, index) => {
    console.log(`${index + 1}. ${event.name}`);
    console.log(`   Parameters: ${event.parameters.map(p => p.name).join(', ') || 'none'}`);
  });
}

console.log('\n--- Summary ---');
console.log(`Total State Variables: ${component.state?.variables.length || 0}`);
console.log(`Total Lifecycle Events: ${component.lifecycle?.length || 0}`);
console.log(`Total Event Handlers: ${component.events?.length || 0}`);
console.log(`Total Children: ${component.children.length}`);

// Breakdown by hook type
console.log('\n--- Hook Type Breakdown ---');
const hookTypes = {
  useState: 0,
  useContext: 0,
  useRef: 0,
  useMemo: 0,
  useCallback: 0,
  custom: 0,
};

if (component.state) {
  component.state.variables.forEach(variable => {
    if (variable.type === 'ref') {
      hookTypes.useRef++;
    } else if (variable.type === 'function') {
      hookTypes.useCallback++;
    } else if (!variable.mutable && variable.type !== 'ref') {
      if (variable.initialValue === null) {
        hookTypes.useContext++;
      } else {
        hookTypes.useMemo++;
      }
    } else if (variable.mutable) {
      if (variable.name === 'data' || variable.name === 'loading' || variable.name === 'error') {
        hookTypes.custom++;
      } else {
        hookTypes.useState++;
      }
    }
  });
}

console.log(`useState: ${hookTypes.useState}`);
console.log(`useEffect: ${component.lifecycle?.length || 0}`);
console.log(`useContext: ${hookTypes.useContext}`);
console.log(`useRef: ${hookTypes.useRef}`);
console.log(`useMemo: ${hookTypes.useMemo}`);
console.log(`useCallback: ${hookTypes.useCallback}`);
console.log(`Custom Hooks: ${hookTypes.custom}`);

console.log('\n=== Parsing Complete ===');

// Export for use in other examples
export { reactSource, ir };
