# Lumora IR Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Architecture](#component-architecture)
4. [IR Schema](#ir-schema)
5. [Data Flow](#data-flow)
6. [Design Decisions](#design-decisions)
7. [Extension Points](#extension-points)

## Overview

The Lumora Intermediate Representation (IR) system is the core of the Lumora Bidirectional Framework. It provides a framework-agnostic representation of UI components that enables seamless conversion between React/TypeScript and Flutter/Dart.

### Key Principles

1. **Framework Agnostic**: IR represents UI concepts independent of any specific framework
2. **Lossless Conversion**: Preserve all semantic information during conversion
3. **Versioned Schema**: Support evolution of IR format over time
4. **Validation First**: Ensure IR integrity through comprehensive validation
5. **Developer Friendly**: Human-readable JSON format with clear structure

### Design Goals

- Enable bidirectional conversion between React and Flutter
- Support incremental synchronization with minimal data transfer
- Preserve documentation, comments, and metadata
- Handle complex state management patterns
- Support custom widget mappings and extensions

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Lumora Platform                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐              ┌──────────────┐                │
│  │   React/TSX  │              │ Flutter/Dart │                │
│  │    Source    │              │    Source    │                │
│  └──────┬───────┘              └──────┬───────┘                │
│         │                              │                         │
│         ▼                              ▼                         │
│  ┌──────────────┐              ┌──────────────┐                │
│  │    React     │              │   Flutter    │                │
│  │   Parser     │              │   Parser     │                │
│  │   (Babel)    │              │  (Analyzer)  │                │
│  └──────┬───────┘              └──────┬───────┘                │
│         │                              │                         │
│         └──────────┬───────────────────┘                        │
│                    ▼                                             │
│         ┌─────────────────────┐                                 │
│         │    Lumora IR        │◄────── Validation               │
│         │  (Intermediate      │◄────── Storage                  │
│         │  Representation)    │◄────── Migration                │
│         └─────────┬───────────┘                                 │
│                   │                                              │
│         ┌─────────┴─────────┐                                   │
│         ▼                   ▼                                    │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │   React      │    │   Flutter    │                          │
│  │  Generator   │    │  Generator   │                          │
│  └──────┬───────┘    └──────┬───────┘                          │
│         │                    │                                   │
│         ▼                    ▼                                   │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │  React/TSX   │    │ Flutter/Dart │                          │
│  │   Output     │    │   Output     │                          │
│  └──────────────┘    └──────────────┘                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (CLI, Web Dashboard, VS Code Extension)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    Conversion Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Parsers    │  │  Generators  │  │    Sync      │     │
│  │              │  │              │  │   Engine     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                      IR Core Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Validation  │  │   Storage    │  │  Migration   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Utilities  │  │   Registry   │  │ Type Mapper  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. IR Core Components

#### Validator

**Purpose**: Ensure IR integrity through JSON Schema validation

**Responsibilities**:
- Validate IR structure against JSON Schema
- Validate individual nodes
- Check version compatibility
- Provide detailed error messages

**Implementation**:
```typescript
class IRValidator {
  private schema: JSONSchema;
  private ajv: Ajv;
  
  validate(ir: any): ValidationResult {
    // Validate against schema
    // Check version format
    // Validate node structure
    // Return detailed results
  }
  
  validateOrThrow(ir: any): void {
    const result = this.validate(ir);
    if (!result.valid) {
      throw new ValidationError(result.errors);
    }
  }
}
```

**Key Features**:
- JSON Schema 7 validation
- Custom validators for complex rules
- Detailed error paths and messages
- Version format validation

#### Storage

**Purpose**: Persist IR with versioning and history

**Responsibilities**:
- Store IR to filesystem
- Maintain version history
- Detect changes
- Provide retrieval by version

**Implementation**:
```typescript
class IRStorage {
  private basePath: string;
  
  store(id: string, ir: LumoraIR): IRStorageEntry {
    // Generate version number
    // Create storage entry
    // Write to filesystem
    // Update index
  }
  
  retrieve(id: string, version?: number): IRStorageEntry | null {
    // Load from filesystem
    // Return specific version or latest
  }
  
  hasChanged(id: string, ir: LumoraIR): boolean {
    // Compare with stored version
    // Deep equality check
  }
}
```

**Storage Structure**:
```
.lumora/ir/
├── component-name/
│   ├── v1.json
│   ├── v2.json
│   └── v3.json
└── index.json
```

#### Migrator

**Purpose**: Handle IR schema evolution

**Responsibilities**:
- Detect version mismatches
- Apply migration transformations
- Support custom migrations
- Maintain backward compatibility

**Implementation**:
```typescript
class IRMigrator {
  private migrations: Map<string, IRMigration>;
  
  migrate(ir: any, targetVersion: string): LumoraIR {
    // Detect current version
    // Find migration path
    // Apply transformations
    // Validate result
  }
  
  registerMigration(migration: IRMigration): void {
    // Add custom migration
  }
}
```

**Migration Chain**:
```
v1.0.0 → v1.1.0 → v1.2.0 → v2.0.0
  ↓        ↓        ↓        ↓
 M1  →   M2   →   M3   →   M4
```

### 2. Conversion Components

#### React Parser

**Purpose**: Convert React/TSX to Lumora IR

**Technology**: @babel/parser, @babel/traverse

**Process**:
```
React Source → Babel AST → IR Nodes → Lumora IR
```

**Key Transformations**:
- JSX elements → LumoraNode
- Props → node.props
- useState → StateDefinition
- Event handlers → EventDefinition
- JSDoc → metadata.documentation

#### Flutter Parser

**Purpose**: Convert Flutter/Dart to Lumora IR

**Technology**: Dart analyzer package

**Process**:
```
Dart Source → Analyzer AST → IR Nodes → Lumora IR
```

**Key Transformations**:
- Widget constructors → LumoraNode
- Constructor params → node.props
- StatefulWidget → StateDefinition
- Callbacks → EventDefinition
- dartdoc → metadata.documentation

#### React Generator

**Purpose**: Convert Lumora IR to React/TSX

**Technology**: Template-based generation, Prettier

**Process**:
```
Lumora IR → Component Template → TypeScript Code → Formatted Output
```

**Generated Structure**:
```typescript
// Imports
import React, { useState } from 'react';

// Type definitions
interface Props {
  // ...
}

// Component
export const Component: React.FC<Props> = (props) => {
  // State
  const [state, setState] = useState(initialValue);
  
  // Event handlers
  const handleEvent = () => {
    // ...
  };
  
  // Render
  return (
    // JSX
  );
};
```

#### Flutter Generator

**Purpose**: Convert Lumora IR to Flutter/Dart

**Technology**: Template-based generation, dart_style

**Process**:
```
Lumora IR → Widget Template → Dart Code → Formatted Output
```

**Generated Structure**:
```dart
// Imports
import 'package:flutter/material.dart';

// Widget
class MyWidget extends StatefulWidget {
  // Constructor
  const MyWidget({Key? key}) : super(key: key);
  
  @override
  State<MyWidget> createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  // State variables
  
  // Lifecycle methods
  
  // Event handlers
  
  // Build method
  @override
  Widget build(BuildContext context) {
    return // Widget tree
  }
}
```

### 3. Synchronization Components

#### File Watcher

**Purpose**: Detect file changes in real-time

**Technology**: chokidar (Node.js), Dart file watcher

**Events**:
- File added
- File modified
- File deleted
- File renamed

**Debouncing**: 300ms to batch rapid changes

#### Change Queue

**Purpose**: Manage conversion tasks

**Features**:
- Priority queue (user edits > auto-sync)
- Batching of related changes
- Conflict detection
- Progress tracking

#### Sync Engine

**Purpose**: Orchestrate bidirectional synchronization

**Workflow**:
```
1. Detect change
2. Parse source file
3. Convert to IR
4. Check for conflicts
5. Generate target file
6. Write to filesystem
7. Update IR store
8. Notify completion
```

**Modes**:
- **React-first**: React → IR → Flutter (one-way)
- **Flutter-first**: Flutter → IR → React (one-way)
- **Universal**: Bidirectional with conflict resolution

#### Conflict Resolver

**Purpose**: Handle simultaneous edits

**Detection**:
- Compare file timestamps
- Compare IR versions
- Detect overlapping changes

**Resolution Strategies**:
1. **Use React version**: Discard Flutter changes
2. **Use Flutter version**: Discard React changes
3. **Manual merge**: Present diff view to developer

**UI Components**:
- CLI interactive prompt
- Web dashboard diff viewer
- VS Code extension integration

### 4. Support Components

#### Widget Mapping Registry

**Purpose**: Map widgets between frameworks

**Configuration**: widget-mappings.yaml

**Structure**:
```yaml
mappings:
  - react: View
    flutter: Container
    props:
      style: decoration
      
  - react: Text
    flutter: Text
    props:
      children: data
      style: style
```

**Features**:
- Default mappings for common widgets
- Custom mappings per project
- Fallback for unmapped widgets
- Prop name translation

#### Type Mapper

**Purpose**: Convert types between TypeScript and Dart

**Mappings**:
```
TypeScript    ↔    Dart
─────────────────────────
string        ↔    String
number        ↔    double/int
boolean       ↔    bool
any           ↔    dynamic
T[]           ↔    List<T>
T | null      ↔    T?
interface     ↔    class
```

**Features**:
- Primitive type conversion
- Generic type preservation
- Nullable type handling
- Interface/class conversion

## IR Schema

### Core Structure

```typescript
interface LumoraIR {
  version: string;           // Semantic version (e.g., "1.0.0")
  metadata: IRMetadata;      // Source information
  nodes: LumoraNode[];       // UI tree
  theme?: ThemeDefinition;   // Design tokens
  navigation?: NavigationDefinition; // Routing
}
```

### Metadata

```typescript
interface IRMetadata {
  sourceFramework: 'react' | 'flutter';
  sourceFile: string;        // Original file path
  generatedAt: number;       // Unix timestamp
  author?: string;           // Developer identifier
  description?: string;      // Component description
}
```

### Node Structure

```typescript
interface LumoraNode {
  id: string;                // Unique identifier (UUID)
  type: string;              // Widget/component type
  props: Record<string, any>; // Properties
  children: LumoraNode[];    // Child nodes
  state?: StateDefinition;   // State management
  events?: EventDefinition[]; // Event handlers
  metadata: NodeMetadata;    // Source metadata
}
```

### State Definition

```typescript
interface StateDefinition {
  type: 'local' | 'global' | 'async';
  variables: StateVariable[];
}

interface StateVariable {
  name: string;              // Variable name
  type: string;              // Type annotation
  initialValue: any;         // Initial value
  mutable: boolean;          // Can be modified
}
```

### Event Definition

```typescript
interface EventDefinition {
  name: string;              // Event name (e.g., "onPress")
  handler: string;           // Handler function code
  parameters: Parameter[];   // Handler parameters
  async: boolean;            // Is async function
}

interface Parameter {
  name: string;
  type: string;
  optional: boolean;
}
```

### Theme Definition

```typescript
interface ThemeDefinition {
  colors: Record<string, string>;
  typography: TypographyDefinition;
  spacing: SpacingDefinition;
}
```

### Navigation Definition

```typescript
interface NavigationDefinition {
  routes: RouteDefinition[];
  initialRoute: string;
}

interface RouteDefinition {
  name: string;
  path: string;
  component: string;
  params?: Parameter[];
}
```

## Data Flow

### React to Flutter Flow

```
1. Developer edits React component
   ↓
2. File watcher detects change
   ↓
3. React Parser parses TSX
   ↓
4. Babel AST traversal
   ↓
5. IR nodes created
   ↓
6. IR validated
   ↓
7. IR stored with version
   ↓
8. Flutter Generator reads IR
   ↓
9. Dart code generated
   ↓
10. Code formatted with dart_style
   ↓
11. File written to Flutter directory
   ↓
12. Sync status updated
```

### Flutter to React Flow

```
1. Developer edits Flutter widget
   ↓
2. File watcher detects change
   ↓
3. Flutter Parser parses Dart
   ↓
4. Analyzer AST traversal
   ↓
5. IR nodes created
   ↓
6. IR validated
   ↓
7. IR stored with version
   ↓
8. React Generator reads IR
   ↓
9. TypeScript code generated
   ↓
10. Code formatted with Prettier
   ↓
11. File written to React directory
   ↓
12. Sync status updated
```

### Conflict Resolution Flow

```
1. Both React and Flutter files modified
   ↓
2. Sync engine detects conflict
   ↓
3. Conflict record created
   ↓
4. Developer notified (CLI/Dashboard/VSCode)
   ↓
5. Developer chooses resolution:
   - Use React version
   - Use Flutter version
   - Manual merge
   ↓
6. Selected version becomes source
   ↓
7. IR updated
   ↓
8. Both files regenerated
   ↓
9. Conflict cleared
```

## Design Decisions

### Why JSON for IR?

**Pros**:
- Human-readable and debuggable
- Wide tooling support
- Easy to validate with JSON Schema
- Language-agnostic
- Supports nested structures naturally

**Cons**:
- Larger file size than binary formats
- No native support for functions/code

**Decision**: JSON is ideal for our use case because debuggability and tooling support outweigh file size concerns.

### Why Separate Parsers and Generators?

**Rationale**: Separation of concerns allows:
- Independent evolution of parsers and generators
- Testing each component in isolation
- Adding new frameworks without modifying existing code
- Reusing IR for multiple target frameworks

### Why File-Based Storage?

**Alternatives Considered**:
- Database (PostgreSQL, MongoDB)
- In-memory only
- Git-based versioning

**Decision**: File-based storage because:
- Simple deployment (no database required)
- Version control friendly
- Easy backup and migration
- Transparent to developers

### Why Versioned IR?

**Rationale**: Schema evolution is inevitable. Versioning allows:
- Backward compatibility
- Gradual migration
- Rollback capability
- Clear upgrade paths

### Why Template-Based Generation?

**Alternatives Considered**:
- AST manipulation
- String concatenation
- Code builders

**Decision**: Templates provide:
- Readable code generation logic
- Easy customization
- Clear separation of logic and output
- Better maintainability

## Extension Points

### Custom Widget Mappings

Add project-specific mappings in `lumora.yaml`:

```yaml
widgetMappings:
  - react: CustomButton
    flutter: MyButton
    props:
      label: text
      onClick: onPressed
```

### Custom Migrations

Register migrations for custom IR extensions:

```typescript
migrator.registerMigration({
  fromVersion: '1.0.0',
  toVersion: '1.1.0',
  migrate: (ir) => {
    // Transform IR
    return transformedIR;
  },
});
```

### Custom Validators

Add validation rules for domain-specific constraints:

```typescript
validator.addRule({
  name: 'no-inline-styles',
  validate: (node) => {
    if (node.props.style && typeof node.props.style === 'object') {
      return { valid: false, message: 'Use theme tokens instead' };
    }
    return { valid: true };
  },
});
```

### Custom Renderers

Extend the renderer registry for custom widgets:

```typescript
registry.register('CustomWidget', {
  react: (node) => generateReactCode(node),
  flutter: (node) => generateFlutterCode(node),
});
```

### Plugin System

Future support for plugins:

```typescript
interface LumoraPlugin {
  name: string;
  version: string;
  parsers?: ParserExtension[];
  generators?: GeneratorExtension[];
  validators?: ValidatorExtension[];
  migrations?: MigrationExtension[];
}
```

## Performance Considerations

### Parsing Performance

- **Caching**: Cache parsed ASTs to avoid re-parsing
- **Incremental parsing**: Only parse changed sections
- **Parallel processing**: Use worker threads for large files

### Storage Performance

- **Lazy loading**: Load IR on demand
- **Compression**: Compress historical versions
- **Indexing**: Maintain index for fast lookups

### Sync Performance

- **Debouncing**: Batch rapid changes (300ms window)
- **Delta updates**: Send only changed nodes
- **Priority queue**: Process user edits first

### Memory Management

- **Streaming**: Stream large files instead of loading entirely
- **Garbage collection**: Clear unused IR from memory
- **Limits**: Cap history depth (default: 50 versions)

## Security Considerations

### Input Validation

- Validate all IR against schema
- Sanitize file paths
- Limit file sizes
- Prevent path traversal

### Code Generation

- Escape user input in generated code
- Validate widget types against whitelist
- Prevent code injection
- Sandbox execution of custom validators

### Storage Security

- Restrict file permissions
- Validate storage paths
- Prevent symlink attacks
- Audit file operations

## Testing Strategy

### Unit Tests

- IR validation logic
- Storage operations
- Migration transformations
- Utility functions

### Integration Tests

- End-to-end conversion flows
- Sync engine behavior
- Conflict resolution
- File watching

### Performance Tests

- Large file conversion
- Concurrent operations
- Memory usage
- Storage scalability

### Compatibility Tests

- Cross-platform file operations
- Framework version compatibility
- Schema version migration
- Backward compatibility

## Future Enhancements

### Planned Features

1. **Animation Support**: Add animation definitions to IR
2. **Asset Management**: Track and sync assets
3. **Dependency Graph**: Analyze component dependencies
4. **Code Splitting**: Support lazy loading
5. **Optimization**: Automatic code optimization
6. **Analytics**: Track conversion metrics
7. **Cloud Sync**: Remote IR storage
8. **Collaboration**: Multi-developer conflict resolution

### Research Areas

1. **AI-Assisted Conversion**: Use ML for better mappings
2. **Visual Editor**: Drag-and-drop IR editor
3. **Performance Profiling**: Built-in profiler
4. **Automated Testing**: Generate tests from IR
5. **Documentation Generation**: Auto-generate docs

## References

- [JSON Schema Specification](https://json-schema.org/)
- [Babel Parser Documentation](https://babeljs.io/docs/en/babel-parser)
- [Dart Analyzer Package](https://pub.dev/packages/analyzer)
- [Semantic Versioning](https://semver.org/)
- [Lumora IR Schema](./src/schema/ir-schema.json)

## Glossary

- **AST**: Abstract Syntax Tree - tree representation of source code
- **IR**: Intermediate Representation - framework-agnostic UI representation
- **Transpiler**: Tool that converts code from one language to another
- **Bidirectional Sync**: Two-way synchronization between frameworks
- **Widget Mapping**: Translation table between framework widgets
- **State Management**: Handling of application state and updates
- **Event Handler**: Function that responds to user interactions
- **Conflict Resolution**: Process of resolving simultaneous edits

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-10  
**Maintainer**: Lumora Team
