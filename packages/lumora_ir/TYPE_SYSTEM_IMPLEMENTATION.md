# Type System Conversion Implementation

## Overview

This document describes the implementation of the type system conversion feature for the Lumora Bidirectional Framework Phase 1. The implementation includes bidirectional type mapping between TypeScript and Dart, as well as interface/class conversion capabilities.

## Components Implemented

### 1. Type-Mapper (`type-mapper.ts`)

A comprehensive type mapping system that handles bidirectional conversion between TypeScript and Dart types.

**Features:**
- Primitive type mapping (string ↔ String, number ↔ double/int, boolean ↔ bool, etc.)
- Nullable type handling (TypeScript `?` and `| null` ↔ Dart `?`)
- Array type conversion (TypeScript `[]` ↔ Dart `List<>`)
- Generic type conversion with preserved type parameters
- Nested generic support (e.g., `Array<Array<string>>` ↔ `List<List<String>>`)
- Union type handling (TypeScript unions to Dart nullable or dynamic)
- Type inference from values
- Utility methods for making types nullable/non-nullable

**Key Methods:**
- `typeScriptToDart(tsType: string): string` - Convert TypeScript type to Dart
- `dartToTypeScript(dartType: string): string` - Convert Dart type to TypeScript
- `isNullable(type: string): boolean` - Check if type is nullable
- `makeNullable(type: string, language): string` - Make type nullable
- `makeNonNullable(type: string): string` - Remove nullable modifier
- `inferType(value: any, language): string` - Infer type from value

**Examples:**
```typescript
typeMapper.typeScriptToDart('string') // 'String'
typeMapper.typeScriptToDart('number[]') // 'List<double>'
typeMapper.typeScriptToDart('Promise<User>') // 'Future<User>'
typeMapper.dartToTypeScript('String?') // 'string | null'
typeMapper.dartToTypeScript('List<int>') // 'number[]'
```

### 2. Interface-Converter (`interface-converter.ts`)

A system for converting TypeScript interfaces to Dart classes and vice versa, including code generation.

**Features:**
- TypeScript interface to Dart class conversion
- Dart class to TypeScript interface conversion
- Property conversion with optional/nullable handling
- Method conversion with parameter mapping
- Constructor generation for Dart classes
- Documentation preservation (JSDoc ↔ dartdoc)
- Generic type parameter support
- Code generation for both TypeScript and Dart

**Key Methods:**
- `typeScriptInterfaceToDartClass(tsInterface): DartClass` - Convert TS interface to Dart class
- `dartClassToTypeScriptInterface(dartClass): TypeScriptInterface` - Convert Dart class to TS interface
- `generateTypeScriptInterface(tsInterface): string` - Generate TS interface code
- `generateDartClass(dartClass): string` - Generate Dart class code

**Examples:**

TypeScript Interface:
```typescript
interface User {
  readonly id: string;
  name: string;
  email?: string;
}
```

Converts to Dart Class:
```dart
class User {
  final String id;
  String name;
  String? email;

  User({
    required this.id,
    required this.name,
    this.email,
  });
}
```

## Requirements Satisfied

### Requirement 5.1 (Type Mapping)
✅ Maps TypeScript primitive types to Dart types
✅ Maps Dart primitive types to TypeScript types
✅ Handles nullable types in both directions
✅ Preserves generic type parameters

### Requirement 5.2 (Interface/Class Conversion)
✅ Converts TypeScript interfaces to Dart classes
✅ Converts Dart classes to TypeScript interfaces
✅ Generates proper constructors
✅ Preserves type documentation

## Testing

Comprehensive test suites have been implemented:

### Type-Mapper Tests (22 tests)
- Primitive type conversion (both directions)
- Nullable type handling
- Array and generic type conversion
- Nested generic support
- Type inference
- Singleton pattern

### Interface-Converter Tests (18 tests)
- Simple interface/class conversion
- Optional/nullable property handling
- Readonly/final property handling
- Method conversion
- Documentation preservation
- Code generation
- Generic type parameters
- Singleton pattern

**Test Results:** All 40 tests passing ✅

## Usage Examples

### Basic Type Conversion

```typescript
import { getTypeMapper } from '@lumora/ir';

const typeMapper = getTypeMapper();

// TypeScript to Dart
const dartType = typeMapper.typeScriptToDart('string[]');
// Result: 'List<String>'

// Dart to TypeScript
const tsType = typeMapper.dartToTypeScript('Future<int>');
// Result: 'Promise<number>'
```

### Interface Conversion

```typescript
import { getInterfaceConverter } from '@lumora/ir';

const converter = getInterfaceConverter();

// Define TypeScript interface
const tsInterface = {
  name: 'User',
  properties: [
    { name: 'id', type: 'string', readonly: true },
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string', optional: true }
  ]
};

// Convert to Dart class
const dartClass = converter.typeScriptInterfaceToDartClass(tsInterface);

// Generate Dart code
const dartCode = converter.generateDartClass(dartClass);
console.log(dartCode);
```

## Integration Points

The type system conversion is integrated into the Lumora IR package and can be used by:

1. **React-to-Flutter Transpiler** - Convert TypeScript types in React components to Dart types
2. **Flutter-to-React Transpiler** - Convert Dart types in Flutter widgets to TypeScript types
3. **Code Generators** - Generate properly typed code in target framework
4. **IR Validation** - Validate type consistency across conversions

## Future Enhancements

Potential improvements for future phases:
- Support for TypeScript utility types (Partial, Pick, Omit, etc.)
- Dart extension methods conversion
- TypeScript decorators to Dart annotations
- More sophisticated union type handling
- Enum conversion support
- Type alias conversion

## Files Created

1. `packages/lumora_ir/src/types/type-mapper.ts` - Type mapping implementation
2. `packages/lumora_ir/src/types/interface-converter.ts` - Interface/class conversion
3. `packages/lumora_ir/src/__tests__/type-mapper.test.ts` - Type mapper tests
4. `packages/lumora_ir/src/__tests__/interface-converter.test.ts` - Interface converter tests
5. `packages/lumora_ir/src/index.ts` - Updated exports

## Conclusion

The type system conversion implementation provides a robust foundation for bidirectional type mapping between TypeScript and Dart. It handles primitive types, complex generics, nullable types, and full interface/class conversion with code generation. All requirements have been met and comprehensive tests ensure reliability.
