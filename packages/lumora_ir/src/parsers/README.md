# Parsers Module

This module contains AST parsers for converting source code from various frameworks to Lumora IR.

## React Parser

The React parser converts React/TSX components to Lumora IR using Babel's parser and traversal utilities.

### Features

- **Component Extraction**: Identifies function components, arrow function components, and class components
- **JSX Parsing**: Converts JSX elements to Lumora nodes with proper prop extraction
- **Hook Support**: Extracts useState and other React hooks to state definitions
- **Event Handling**: Identifies event handlers (onClick, onChange, etc.) and extracts parameters
- **TypeScript Support**: Handles TypeScript syntax through Babel's TypeScript plugin
- **Error Handling**: Provides detailed error messages with source locations

### Usage

```typescript
import { ReactParser } from './parsers';

const parser = new ReactParser({
  sourceType: 'module',
  plugins: ['jsx', 'typescript'],
});

const source = `
function MyComponent({ title }) {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
`;

const ir = parser.parse(source, 'MyComponent.tsx');
console.log(ir);
```

### Configuration

- `sourceType`: 'module' or 'script' (default: 'module')
- `plugins`: Array of Babel parser plugins (default: ['jsx', 'typescript'])
- `errorHandler`: Custom error handler instance

### Component Detection

The parser identifies React components by:

1. **Function Components**: Functions starting with uppercase that return JSX
2. **Arrow Function Components**: Arrow functions assigned to uppercase variables that return JSX
3. **Class Components**: Classes extending React.Component or Component

### State Extraction

Currently supports:
- `useState` hook extraction with state variable names and initial values
- Type inference from initial values

Future support planned for:
- `useEffect` hook conversion to lifecycle events
- `useContext` hook extraction
- `useRef`, `useMemo`, `useCallback` hooks
- Custom hooks

### Event Extraction

Extracts event handlers from JSX attributes:
- Event names (onClick, onChange, onSubmit, etc.)
- Handler parameters
- Handler code (placeholder for now)

### JSX Conversion

Converts JSX elements to Lumora nodes:
- Element type (tag name)
- Props (attributes)
- Children (nested elements and text)
- Source location (line numbers)

### Error Handling

The parser uses the Lumora error handling system to:
- Report syntax errors with source locations
- Handle parsing failures gracefully
- Provide suggestions for common issues
- Log errors for debugging

## Future Parsers

- **Flutter/Dart Parser**: Convert Flutter widgets to Lumora IR
- **Vue Parser**: Convert Vue components to Lumora IR
- **Svelte Parser**: Convert Svelte components to Lumora IR
