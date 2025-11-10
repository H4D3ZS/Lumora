/**
 * React Parser Example
 * Demonstrates how to use the React parser to convert React components to Lumora IR
 */

import { ReactParser } from '../src/parsers/react-parser';
import * as fs from 'fs';
import * as path from 'path';

// Example React component
const exampleComponent = `
import React, { useState } from 'react';

interface TodoProps {
  initialTodos?: string[];
}

function TodoApp({ initialTodos = [] }: TodoProps) {
  const [todos, setTodos] = useState(initialTodos);
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput('');
    }
  };

  const handleDelete = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <div className="todo-app">
      <h1>Todo List</h1>
      <div className="input-section">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a todo"
        />
        <button onClick={handleAdd}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map((todo, index) => (
          <li key={index}>
            <span>{todo}</span>
            <button onClick={() => handleDelete(index)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoApp;
`;

// Parse the component
const parser = new ReactParser();
const ir = parser.parse(exampleComponent, 'TodoApp.tsx');

// Display the results
console.log('=== Lumora IR Output ===\n');
console.log('Version:', ir.version);
console.log('Source Framework:', ir.metadata.sourceFramework);
console.log('Source File:', ir.metadata.sourceFile);
console.log('\n=== Components Found ===\n');

ir.nodes.forEach((node, index) => {
  console.log(`Component ${index + 1}: ${node.type}`);
  console.log(`  Line: ${node.metadata.lineNumber}`);
  
  if (node.props && Object.keys(node.props).length > 0) {
    console.log(`  Props:`, Object.keys(node.props));
  }
  
  if (node.state) {
    console.log(`  State Type: ${node.state.type}`);
    console.log(`  State Variables:`);
    node.state.variables.forEach(v => {
      console.log(`    - ${v.name}: ${v.type} = ${JSON.stringify(v.initialValue)}`);
    });
  }
  
  if (node.events && node.events.length > 0) {
    console.log(`  Events:`);
    node.events.forEach(e => {
      console.log(`    - ${e.name} (${e.parameters.length} params)`);
    });
  }
  
  if (node.children.length > 0) {
    console.log(`  Children: ${node.children.length} nodes`);
    console.log(`  Root Element: ${node.children[0]?.type}`);
  }
  
  console.log('');
});

// Save to file
const outputPath = path.join(__dirname, 'react-parser-output.json');
fs.writeFileSync(outputPath, JSON.stringify(ir, null, 2));
console.log(`Full IR saved to: ${outputPath}`);

// Display a sample of the IR structure
console.log('\n=== Sample IR Structure ===\n');
console.log(JSON.stringify(ir, null, 2).substring(0, 1000) + '...\n');
