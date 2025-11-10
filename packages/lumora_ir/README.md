# @lumora/ir

Lumora Intermediate Representation (IR) system - A framework-agnostic representation for UI components that enables seamless conversion between React and Flutter.

## Overview

The Lumora IR system provides:

- **Framework-agnostic representation**: Capture UI structure, props, state, and behavior independent of any specific framework
- **JSON Schema validation**: Ensure IR integrity with comprehensive validation
- **Versioning and storage**: Store IR with full version history and change tracking
- **Migration system**: Automatically migrate IR between schema versions
- **Utility functions**: Rich set of tools for working with IR structures

## Installation

```bash
npm install @lumora/ir
```

## Quick Start

### Creating IR

```typescript
import { createIR, createNode } from '@lumora/ir';

// Create a simple IR structure
const ir = createIR(
  {
    sourceFramework: 'react',
    sourceFile: 'App.tsx',
    generatedAt: Date.now(),
  },
  [
    createNode('Container', { width: 100, height: 200 }, [
      createNode('Text', { content: 'Hello World' }),
      createNode('Button', { onPress: 'handlePress' }),
    ]),
  ]
);
```

### Validating IR

```typescript
import { getValidator } from '@lumora/ir';

const validator = getValidator();

// Validate IR
const result = validator.validate(ir);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Or validate and throw on error
validator.validateOrThrow(ir);
```

### Storing IR

```typescript
import { IRStorage } from '@lumora/ir';

const storage = new IRStorage('.lumora/ir');

// Store IR with versioning
const entry = storage.store('my-component', ir);
console.log(`Stored version ${entry.version}`);

// Retrieve latest version
const retrieved = storage.retrieve('my-component');

// Retrieve specific version
const v1 = storage.retrieve('my-component', 1);

// Get version history
const history = storage.getHistory('my-component');

// Check if IR has changed
if (storage.hasChanged('my-component', updatedIR)) {
  storage.store('my-component', updatedIR);
}
```

### Migrating IR

```typescript
import { getMigrator } from '@lumora/ir';

const migrator = getMigrator();

// Check if migration is needed
if (migrator.needsMigration(oldIR, '1.0.0')) {
  // Migrate to latest version
  const migratedIR = migrator.migrate(oldIR, '1.0.0');
}

// Register custom migration
migrator.registerMigration({
  fromVersion: '1.0.0',
  toVersion: '1.1.0',
  migrate: (ir) => {
    // Transform IR structure
    return transformedIR;
  },
});
```

### Working with Nodes

```typescript
import {
  findNodeById,
  findNodesByType,
  countNodes,
  getMaxDepth,
  traverseNodes,
} from '@lumora/ir';

// Find node by ID
const node = findNodeById(ir.nodes, 'node_123');

// Find all nodes of a type
const textNodes = findNodesByType(ir.nodes, 'Text');

// Count total nodes
const total = countNodes(ir.nodes);

// Get tree depth
const depth = getMaxDepth(ir.nodes);

// Traverse tree with visitor
traverseNodes(ir.nodes, (node, depth) => {
  console.log(`${' '.repeat(depth * 2)}${node.type}`);
});
```

## IR Structure

### LumoraIR

```typescript
interface LumoraIR {
  version: string; // Semantic version (e.g., "1.0.0")
  metadata: IRMetadata;
  nodes: LumoraNode[];
  theme?: ThemeDefinition;
  navigation?: NavigationDefinition;
}
```

### LumoraNode

```typescript
interface LumoraNode {
  id: string; // Unique identifier
  type: string; // Widget/component type
  props: Record<string, any>; // Properties
  children: LumoraNode[]; // Child nodes
  state?: StateDefinition; // State management
  events?: EventDefinition[]; // Event handlers
  metadata: NodeMetadata; // Source metadata
}
```

### StateDefinition

```typescript
interface StateDefinition {
  type: 'local' | 'global' | 'async';
  variables: StateVariable[];
}

interface StateVariable {
  name: string;
  type: string;
  initialValue: any;
  mutable: boolean;
}
```

### EventDefinition

```typescript
interface EventDefinition {
  name: string; // Event name (e.g., "onPress")
  handler: string; // Handler function code
  parameters: Parameter[];
}
```

## API Reference

### Validator

- `validate(ir: any): ValidationResult` - Validate IR against schema
- `validateOrThrow(ir: any): void` - Validate and throw on error
- `isValidVersion(version: string): boolean` - Check version format
- `validateNode(node: any): ValidationResult` - Validate single node

### Storage

- `store(id: string, ir: LumoraIR): IRStorageEntry` - Store IR with versioning
- `retrieve(id: string, version?: number): IRStorageEntry | null` - Retrieve IR
- `getCurrentVersion(id: string): number` - Get current version number
- `getHistory(id: string): IRStorageEntry[]` - Get version history
- `delete(id: string): boolean` - Delete IR and history
- `list(): string[]` - List all stored IRs
- `hasChanged(id: string, ir: LumoraIR): boolean` - Check if IR changed

### Migrator

- `migrate(ir: any, targetVersion: string): LumoraIR` - Migrate IR to version
- `needsMigration(ir: any, targetVersion: string): boolean` - Check if migration needed
- `getCurrentVersion(): string` - Get current IR version
- `registerMigration(migration: IRMigration): void` - Register custom migration

### Utilities

- `createIR(metadata: IRMetadata, nodes?: LumoraNode[]): LumoraIR` - Create IR
- `createNode(type: string, props?, children?, lineNumber?): LumoraNode` - Create node
- `generateNodeId(): string` - Generate unique node ID
- `cloneIR(ir: LumoraIR): LumoraIR` - Deep clone IR
- `cloneNode(node: LumoraNode): LumoraNode` - Deep clone node
- `findNodeById(nodes: LumoraNode[], id: string): LumoraNode | null` - Find node
- `findNodesByType(nodes: LumoraNode[], type: string): LumoraNode[]` - Find nodes by type
- `countNodes(nodes: LumoraNode[]): number` - Count total nodes
- `getMaxDepth(nodes: LumoraNode[]): number` - Get tree depth
- `traverseNodes(nodes: LumoraNode[], visitor: Function): void` - Traverse tree

## Testing

```bash
npm test
```

## License

MIT
