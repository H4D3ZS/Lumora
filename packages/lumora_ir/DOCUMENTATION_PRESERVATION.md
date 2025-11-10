# Documentation Preservation System

## Overview

The Documentation Preservation System enables seamless conversion of documentation between JSDoc (JavaScript/TypeScript) and dartdoc (Dart/Flutter) formats. This ensures that code documentation is maintained during bidirectional conversion between React and Flutter.

## Features

### 1. JSDoc to dartdoc Conversion

Converts JavaScript/TypeScript JSDoc comments to Dart dartdoc format:

```typescript
import { jsdocToDartdoc } from '@lumora/ir';

const jsdoc = `/**
 * Calculate the sum of two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum
 */`;

const dartdoc = jsdocToDartdoc(jsdoc);
// Output:
// /// Calculate the sum of two numbers
// ///
// /// [a] First number (num)
// /// [b] Second number (num)
// ///
// /// Returns num: The sum
```

### 2. dartdoc to JSDoc Conversion

Converts Dart dartdoc comments to JavaScript/TypeScript JSDoc format:

```typescript
import { dartdocToJSDoc } from '@lumora/ir';

const dartdoc = `/// Calculate the sum of two numbers
/// [a] First number (num)
/// [b] Second number (num)
/// Returns num: The sum`;

const jsdoc = dartdocToJSDoc(dartdoc);
// Output:
// /**
//  * Calculate the sum of two numbers
//  *
//  * @param {number} a - First number
//  * @param {number} b - Second number
//  *
//  * @returns {number} The sum
//  */
```

### 3. Type Conversion

Automatically converts types between TypeScript and Dart:

**TypeScript → Dart:**
- `string` → `String`
- `number` → `num`
- `boolean` → `bool`
- `Array<T>` → `List<T>`
- `Promise<T>` → `Future<T>`
- `object` → `Map<String, dynamic>`

**Dart → TypeScript:**
- `String` → `string`
- `int`, `double`, `num` → `number`
- `bool` → `boolean`
- `List<T>` → `Array<T>`
- `Future<T>` → `Promise<T>`
- `Map<K, V>` → `Record<K, V>`

### 4. Code Example Conversion

Automatically converts code examples in documentation:

```typescript
// React example in JSDoc
const jsdoc = `/**
 * @example
 * const result = sum(1, 2);
 * console.log(result);
 */`;

const dartdoc = jsdocToDartdoc(jsdoc);
// Converts to:
// /// Example:
// /// ```dart
// /// final result = sum(1, 2);
// /// print(result);
// /// ```
```

### 5. Inline Comment Extraction

Extract inline comments from source code:

```typescript
import { extractInlineComments } from '@lumora/ir';

const code = `const x = 1; // This is a comment
const y = 2; /* Another comment */`;

const comments = extractInlineComments(code);
// Returns:
// [
//   { line: 1, text: 'This is a comment', type: 'single' },
//   { line: 2, text: 'Another comment', type: 'block' }
// ]
```

## API Reference

### `parseJSDoc(jsdoc: string): DocComment`

Parses a JSDoc comment into a structured format.

**Parameters:**
- `jsdoc` - JSDoc comment string (with or without comment markers)

**Returns:** `DocComment` object with:
- `description` - Main description text
- `params` - Array of parameter documentation
- `returns` - Return value documentation
- `examples` - Array of code examples
- `tags` - Array of other tags (@deprecated, @see, etc.)

### `parseDartdoc(dartdoc: string): DocComment`

Parses a dartdoc comment into a structured format.

**Parameters:**
- `dartdoc` - dartdoc comment string (with or without /// markers)

**Returns:** `DocComment` object (same structure as parseJSDoc)

### `jsdocToDartdoc(jsdoc: string, sourceFramework?: 'react' | 'flutter'): string`

Converts JSDoc to dartdoc format.

**Parameters:**
- `jsdoc` - JSDoc comment string
- `sourceFramework` - Source framework for code example conversion (default: 'react')

**Returns:** dartdoc formatted comment string

### `dartdocToJSDoc(dartdoc: string, sourceFramework?: 'react' | 'flutter'): string`

Converts dartdoc to JSDoc format.

**Parameters:**
- `dartdoc` - dartdoc comment string
- `sourceFramework` - Source framework for code example conversion (default: 'flutter')

**Returns:** JSDoc formatted comment string

### `extractInlineComments(sourceCode: string): Array<{line: number, text: string, type: 'single' | 'block'}>`

Extracts inline comments from source code.

**Parameters:**
- `sourceCode` - Source code string

**Returns:** Array of inline comments with line numbers and types

## Supported Tags

### JSDoc Tags

- `@param {type} name - description` - Parameter documentation
- `@returns {type} description` - Return value documentation
- `@example` - Code examples
- `@deprecated message` - Deprecation notice
- `@see reference` - See also references

### dartdoc Tags

- `[paramName] description (type)` - Parameter documentation
- `Returns type: description` - Return value documentation
- `Example:` with code blocks - Code examples
- `@Deprecated('message')` - Deprecation annotation
- `See also: reference` - See also references

## Integration with Converters

The documentation preservation system is integrated into the IR conversion pipeline:

1. **React to Flutter:**
   - JSDoc comments are extracted during TSX parsing
   - Stored in IR metadata
   - Converted to dartdoc during Flutter code generation

2. **Flutter to React:**
   - dartdoc comments are extracted during Dart parsing
   - Stored in IR metadata
   - Converted to JSDoc during React code generation

## Best Practices

1. **Always include type information** in documentation for accurate conversion
2. **Use standard tags** (@param, @returns, etc.) for better conversion accuracy
3. **Keep code examples simple** - complex examples may not convert perfectly
4. **Review converted documentation** to ensure accuracy
5. **Use inline comments sparingly** - they may not always be preserved in the exact same location

## Limitations

1. **Code example conversion is basic** - complex syntax may require manual adjustment
2. **Custom JSDoc tags** may not have dartdoc equivalents
3. **Formatting differences** - dartdoc and JSDoc have different conventions
4. **Type inference** - some complex types may be converted to `dynamic` or `any`

## Future Enhancements

- Support for more JSDoc tags (@throws, @async, etc.)
- Better code example conversion with full AST parsing
- Support for markdown formatting in descriptions
- Custom tag mapping configuration
- Integration with documentation generators (JSDoc, dartdoc)
