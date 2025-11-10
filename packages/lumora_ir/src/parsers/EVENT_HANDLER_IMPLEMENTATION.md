# Event Handler Extraction Implementation

## Overview

This document describes the implementation of event handler extraction in the React parser, which enables the Lumora IR system to capture and serialize event handlers from React components.

## Features Implemented

### 1. Inline Handler Extraction (Task 12.1)

The parser now extracts inline event handlers from JSX attributes:

- **Arrow functions**: `onClick={() => console.log('clicked')}`
- **Function expressions**: `onClick={function() { console.log('clicked'); }}`
- **Function references**: `onClick={handleClick}`
- **Member expressions**: `onClick={handlers.click}`
- **Call expressions**: `onClick={createHandler()}`

#### Implementation Details

The `extractHandlerCode` method now:
- Serializes arrow functions and function expressions to string format
- Preserves async/await syntax
- Handles function references by name
- Serializes member expressions (e.g., `obj.method`)
- Serializes call expressions (e.g., `createHandler()`)

The `extractHandlerParams` method now:
- Extracts parameters from arrow functions and function expressions
- Handles destructured parameters (object and array patterns)
- Handles rest parameters (`...args`)
- Infers parameter types from names and TypeScript annotations

### 2. Component Method Extraction (Task 12.2)

The parser now extracts methods from both class and function components:

#### Class Component Methods

- **Regular methods**: `handleClick(e) { ... }`
- **Arrow function properties**: `handleClick = (e) => { ... }`
- Filters out lifecycle methods (componentDidMount, etc.)
- Filters out the render method

#### Function Component Helper Functions

- **Function declarations**: `function handleClick() { ... }`
- **Arrow function variables**: `const handleClick = () => { ... }`
- Only extracts functions with names starting with "handle" or "on"

## Code Serialization

The implementation includes comprehensive code serialization capabilities:

### Function Serialization

```typescript
// Input
const handler = async (e) => {
  e.preventDefault();
  await fetchData();
};

// Output
"async (e) => {\n  e.preventDefault();\n  await fetchData();\n}"
```

### Expression Serialization

Supports serialization of:
- Identifiers, literals (string, number, boolean, null)
- Member expressions (obj.prop, obj[prop])
- Call expressions (func(arg1, arg2))
- Binary expressions (a + b, a === b)
- Unary expressions (!value, -number)
- Logical expressions (a && b, a || b)
- Conditional expressions (test ? a : b)
- Array expressions ([1, 2, 3])
- Object expressions ({ key: value })
- Update expressions (i++, --j)
- Assignment expressions (x = 5, y += 2)
- Await expressions (await promise)

### Statement Serialization

Supports serialization of:
- Return statements
- Expression statements
- Variable declarations
- If statements

### Pattern Serialization

Supports serialization of:
- Object patterns: `{ prop1, prop2 }`
- Array patterns: `[item1, item2]`
- Rest elements: `...rest`

## Type Inference

The parser infers parameter types from:

1. **TypeScript annotations**: `(e: MouseEvent) => { ... }`
2. **Parameter names**: 
   - `e`, `event`, `evt` → `Event`
   - `callback`, `handler` → `function`
   - `index`, `idx`, `i` → `number`
3. **Default**: `any`

## Testing

The implementation includes comprehensive tests covering:

- Inline arrow function handlers
- Function reference handlers
- Member expression handlers
- Helper function extraction
- Class component method extraction
- Complex async handlers
- Destructured parameters
- Multiple event types

All 42 tests pass successfully.

## Usage Example

```typescript
import { ReactParser } from './parsers/react-parser';

const parser = new ReactParser();

const source = `
function MyComponent() {
  const handleClick = async (e) => {
    e.preventDefault();
    await fetchData();
  };
  
  return <button onClick={handleClick}>Click</button>;
}
`;

const ir = parser.parse(source, 'component.tsx');

// Access extracted events
ir.nodes[0].events?.forEach(event => {
  console.log(`Event: ${event.name}`);
  console.log(`Handler: ${event.handler}`);
  console.log(`Parameters: ${event.parameters.map(p => p.name).join(', ')}`);
});
```

## Integration with Lumora IR

The extracted event handlers are stored in the `EventDefinition` interface:

```typescript
interface EventDefinition {
  name: string;        // Event name (e.g., "onClick", "handleSubmit")
  handler: string;     // Serialized handler code
  parameters: Parameter[];  // Handler parameters with types
}
```

This allows the Lumora IR system to:
1. Convert React event handlers to Flutter event handlers
2. Preserve event logic during bidirectional sync
3. Generate production code with proper event handling
4. Support hot reload with event handler updates

## Limitations

1. **Complex expressions**: Some complex expressions are serialized as placeholders
2. **This context**: Class method serialization may not preserve `this` context perfectly
3. **Closure variables**: External variable references are serialized by name only
4. **JSX in handlers**: JSX elements within handlers are not fully serialized

## Future Enhancements

1. Improve serialization of complex expressions
2. Add support for JSX in event handlers
3. Enhance type inference for better TypeScript support
4. Add source map generation for debugging
5. Support for custom event types

## Requirements Satisfied

This implementation satisfies **Requirement 4.3** from the design document:

> "WHEN parsing event handlers, THE Parser SHALL extract handler code and parameters"

The implementation successfully:
- Finds onClick, onChange, and other event handlers
- Extracts arrow functions and function expressions
- Extracts function references
- Extracts handler parameters with type information
- Finds class component methods
- Finds function component helpers
- Extracts method signatures
- Converts to event definitions in the IR
