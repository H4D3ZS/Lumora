/**
 * Event Handler Extraction Example
 * Demonstrates the extraction of various event handler patterns
 */

import { ReactParser } from '../src/parsers/react-parser';

// Example 1: Inline arrow function handlers
const inlineHandlerExample = `
function MyComponent() {
  return (
    <div>
      <button onClick={() => console.log('clicked')}>Click Me</button>
      <input onChange={(e) => console.log(e.target.value)} />
    </div>
  );
}
`;

// Example 2: Helper function handlers
const helperFunctionExample = `
function MyComponent() {
  const handleClick = (e) => {
    e.preventDefault();
    console.log('Button clicked');
  };
  
  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    console.log('Form submitted', formData);
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <button onClick={handleClick}>Submit</button>
    </form>
  );
}
`;

// Example 3: Class component methods
const classMethodExample = `
import React from 'react';

class MyComponent extends React.Component {
  handleClick(e) {
    e.preventDefault();
    this.setState({ clicked: true });
  }
  
  handleChange = (e) => {
    this.setState({ value: e.target.value });
  }
  
  render() {
    return (
      <div>
        <button onClick={this.handleClick}>Click</button>
        <input onChange={this.handleChange} />
      </div>
    );
  }
}
`;

// Example 4: Complex async handlers
const asyncHandlerExample = `
function MyComponent() {
  const handleFetch = async (id) => {
    try {
      const response = await fetch(\`/api/data/\${id}\`);
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Fetch failed:', error);
    }
  };
  
  return <button onClick={() => handleFetch(123)}>Fetch Data</button>;
}
`;

// Example 5: Destructured parameters
const destructuredParamsExample = `
function MyComponent() {
  const handleChange = ({ target: { name, value } }) => {
    console.log(\`\${name} changed to \${value}\`);
  };
  
  return (
    <input 
      name="username" 
      onChange={handleChange} 
    />
  );
}
`;

// Example 6: Function references and member expressions
const functionReferenceExample = `
function MyComponent() {
  const handlers = {
    click: () => console.log('clicked'),
    submit: (e) => {
      e.preventDefault();
      console.log('submitted');
    }
  };
  
  const handleReset = () => console.log('reset');
  
  return (
    <form onSubmit={handlers.submit}>
      <button type="button" onClick={handlers.click}>Click</button>
      <button type="reset" onClick={handleReset}>Reset</button>
    </form>
  );
}
`;

// Run examples
function runExamples() {
  const parser = new ReactParser();
  
  console.log('=== Example 1: Inline Arrow Function Handlers ===');
  const ir1 = parser.parse(inlineHandlerExample, 'inline-handler.tsx');
  console.log('Events found:', ir1.nodes[0].events?.length);
  ir1.nodes[0].events?.forEach(event => {
    console.log(`  - ${event.name}: ${event.handler}`);
    console.log(`    Parameters: ${event.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}`);
  });
  
  console.log('\n=== Example 2: Helper Function Handlers ===');
  const ir2 = parser.parse(helperFunctionExample, 'helper-function.tsx');
  console.log('Events found:', ir2.nodes[0].events?.length);
  ir2.nodes[0].events?.forEach(event => {
    console.log(`  - ${event.name}:`);
    console.log(`    Handler: ${event.handler.substring(0, 50)}...`);
    console.log(`    Parameters: ${event.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}`);
  });
  
  console.log('\n=== Example 3: Class Component Methods ===');
  const ir3 = parser.parse(classMethodExample, 'class-method.tsx');
  console.log('Events found:', ir3.nodes[0].events?.length);
  ir3.nodes[0].events?.forEach(event => {
    console.log(`  - ${event.name}:`);
    console.log(`    Handler: ${event.handler.substring(0, 50)}...`);
    console.log(`    Parameters: ${event.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}`);
  });
  
  console.log('\n=== Example 4: Async Handlers ===');
  const ir4 = parser.parse(asyncHandlerExample, 'async-handler.tsx');
  console.log('Events found:', ir4.nodes[0].events?.length);
  ir4.nodes[0].events?.forEach(event => {
    console.log(`  - ${event.name}:`);
    console.log(`    Handler: ${event.handler.substring(0, 60)}...`);
    console.log(`    Is async: ${event.handler.includes('async')}`);
  });
  
  console.log('\n=== Example 5: Destructured Parameters ===');
  const ir5 = parser.parse(destructuredParamsExample, 'destructured-params.tsx');
  console.log('Events found:', ir5.nodes[0].events?.length);
  ir5.nodes[0].events?.forEach(event => {
    console.log(`  - ${event.name}:`);
    console.log(`    Parameters: ${event.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}`);
  });
  
  console.log('\n=== Example 6: Function References ===');
  const ir6 = parser.parse(functionReferenceExample, 'function-reference.tsx');
  console.log('Events found:', ir6.nodes[0].events?.length);
  ir6.nodes[0].events?.forEach(event => {
    console.log(`  - ${event.name}: ${event.handler}`);
  });
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}

export {
  inlineHandlerExample,
  helperFunctionExample,
  classMethodExample,
  asyncHandlerExample,
  destructuredParamsExample,
  functionReferenceExample,
  runExamples,
};
