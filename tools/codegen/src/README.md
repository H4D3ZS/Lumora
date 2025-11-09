# TSX Parser

The TSX Parser converts React/TypeScript JSX files into JSON UI schemas that can be interpreted by the Flutter-Dev-Client.

## Features

- Parses TSX files using Babel parser with JSX and TypeScript support
- Extracts JSX elements from default exports, function components, and arrow functions
- Converts JSX elements to normalized JSON schema format
- Supports all core primitives: View, Text, Button, List, Image, Input
- Handles props extraction including:
  - String literals
  - Numeric literals
  - Boolean literals
  - Object expressions
  - Array expressions
  - Template literals (converted to `{{variable}}` placeholders)
- Recursively processes nested children
- Writes schema to output file with proper formatting

## Usage

```javascript
const TSXParser = require('./tsx-parser');

const parser = new TSXParser();

// Convert a TSX file to JSON schema
parser.convertFileToSchema('input.tsx', 'output.json');
```

## Schema Format

The generated schema follows this structure:

```json
{
  "schemaVersion": "1.0",
  "root": {
    "type": "View",
    "props": {
      "padding": 16,
      "backgroundColor": "#FFFFFF"
    },
    "children": [
      {
        "type": "Text",
        "props": {
          "text": "Hello World"
        },
        "children": []
      }
    ]
  }
}
```

## Supported JSX Patterns

### Function Component
```tsx
export default function MyComponent() {
  return <View><Text text="Hello" /></View>;
}
```

### Arrow Function Component
```tsx
const MyComponent = () => (
  <View><Text text="Hello" /></View>
);

export default MyComponent;
```

### Direct JSX Export
```tsx
export default <View><Text text="Hello" /></View>;
```

## Template Literals

Template literals are converted to placeholder format:

```tsx
<Text text={`Hello, ${userName}!`} />
```

Becomes:

```json
{
  "type": "Text",
  "props": {
    "text": "Hello, {{userName}}!"
  }
}
```

## Event Handlers

Event handlers are converted to the emit pattern:

```tsx
<Button onTap={() => console.log('clicked')} />
```

Becomes:

```json
{
  "type": "Button",
  "props": {
    "onTap": "emit:action:{}"
  }
}
```

## API Reference

### `parseFile(filePath)`
Parses a TSX file and returns the Babel AST.

### `parseCode(code)`
Parses TSX code string and returns the Babel AST.

### `findRootJSXElement(ast)`
Finds the root JSX element in the AST. Looks for default export first, then falls back to the first JSXElement.

### `convertToSchema(jsxElement)`
Converts a JSX element to a schema node with type, props, and children.

### `convertFileToSchema(inputPath, outputPath)`
Converts a TSX file to JSON schema and writes to output file. Returns the generated schema object.

### `writeSchemaToFile(schema, outputPath)`
Writes a schema object to a JSON file with 2-space indentation.
