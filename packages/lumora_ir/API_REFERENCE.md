# Lumora IR API Reference

## Table of Contents

1. [Core API](#core-api)
2. [Validation API](#validation-api)
3. [Storage API](#storage-api)
4. [Migration API](#migration-api)
5. [Utility API](#utility-api)
6. [Type Definitions](#type-definitions)
7. [Error Handling](#error-handling)

## Core API

### createIR

Creates a new Lumora IR structure.

**Signature**:
```typescript
function createIR(
  metadata: IRMetadata,
  nodes?: LumoraNode[],
  theme?: ThemeDefinition,
  navigation?: NavigationDefinition
): LumoraIR
```

**Parameters**:
- `metadata` (IRMetadata): Source information and metadata
- `nodes` (LumoraNode[], optional): Root nodes of the UI tree
- `theme` (ThemeDefinition, optional): Theme configuration
- `navigation` (NavigationDefinition, optional): Navigation configuration

**Returns**: LumoraIR - Complete IR structure

**Example**:
```typescript
import { createIR } from '@lumora/ir';

const ir = createIR(
  {
    sourceFramework: 'react',
    sourceFile: 'src/App.tsx',
    generatedAt: Date.now(),
    author: 'developer@example.com',
  },
  [
    {
      id: 'node_1',
      type: 'Container',
      props: { width: 100, height: 200 },
      children: [],
      metadata: { lineNumber: 10 },
    },
  ]
);
```

**Throws**: ValidationError if metadata is invalid

---

### createNode

Creates a new Lumora node.

**Signature**:
```typescript
function createNode(
  type: string,
  props?: Record<string, any>,
  children?: LumoraNode[],
  lineNumber?: number
): LumoraNode
```

**Parameters**:
- `type` (string): Widget/component type (e.g., 'Container', 'Text')
- `props` (Record<string, any>, optional): Node properties
- `children` (LumoraNode[], optional): Child nodes
- `lineNumber` (number, optional): Source line number

**Returns**: LumoraNode - Complete node structure with generated ID

**Example**:
```typescript
import { createNode } from '@lumora/ir';

const button = createNode(
  'Button',
  {
    text: 'Click me',
    onPress: 'handleClick',
  },
  [],
  42
);
```

---

### generateNodeId

Generates a unique node identifier.

**Signature**:
```typescript
function generateNodeId(): string
```

**Returns**: string - UUID v4 identifier

**Example**:
```typescript
import { generateNodeId } from '@lumora/ir';

const id = generateNodeId();
// => "550e8400-e29b-41d4-a716-446655440000"
```

---

### cloneIR

Creates a deep copy of an IR structure.

**Signature**:
```typescript
function cloneIR(ir: LumoraIR): LumoraIR
```

**Parameters**:
- `ir` (LumoraIR): IR to clone

**Returns**: LumoraIR - Deep copy of the IR

**Example**:
```typescript
import { cloneIR } from '@lumora/ir';

const original = createIR(/* ... */);
const copy = cloneIR(original);

// Modifications to copy don't affect original
copy.nodes[0].props.width = 200;
```

---

### cloneNode

Creates a deep copy of a node.

**Signature**:
```typescript
function cloneNode(node: LumoraNode): LumoraNode
```

**Parameters**:
- `node` (LumoraNode): Node to clone

**Returns**: LumoraNode - Deep copy of the node

**Example**:
```typescript
import { cloneNode } from '@lumora/ir';

const original = createNode('Text', { content: 'Hello' });
const copy = cloneNode(original);
```

## Validation API

### getValidator

Returns the singleton validator instance.

**Signature**:
```typescript
function getValidator(): IRValidator
```

**Returns**: IRValidator - Validator instance

**Example**:
```typescript
import { getValidator } from '@lumora/ir';

const validator = getValidator();
```

---

### IRValidator.validate

Validates an IR structure against the schema.

**Signature**:
```typescript
validate(ir: any): ValidationResult
```

**Parameters**:
- `ir` (any): IR structure to validate

**Returns**: ValidationResult - Validation result with errors if any

**Example**:
```typescript
const validator = getValidator();
const result = validator.validate(ir);

if (!result.valid) {
  console.error('Validation errors:');
  result.errors.forEach(error => {
    console.error(`  ${error.path}: ${error.message}`);
  });
}
```

---

### IRValidator.validateOrThrow

Validates an IR structure and throws on error.

**Signature**:
```typescript
validateOrThrow(ir: any): void
```

**Parameters**:
- `ir` (any): IR structure to validate

**Throws**: ValidationError if validation fails

**Example**:
```typescript
try {
  validator.validateOrThrow(ir);
  console.log('IR is valid');
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

---

### IRValidator.validateNode

Validates a single node.

**Signature**:
```typescript
validateNode(node: any): ValidationResult
```

**Parameters**:
- `node` (any): Node to validate

**Returns**: ValidationResult - Validation result

**Example**:
```typescript
const result = validator.validateNode(node);
if (!result.valid) {
  console.error('Invalid node:', result.errors);
}
```

---

### IRValidator.isValidVersion

Checks if a version string is valid.

**Signature**:
```typescript
isValidVersion(version: string): boolean
```

**Parameters**:
- `version` (string): Version string to check

**Returns**: boolean - True if valid semantic version

**Example**:
```typescript
validator.isValidVersion('1.0.0'); // => true
validator.isValidVersion('1.0');   // => false
validator.isValidVersion('v1.0.0'); // => false
```

## Storage API

### IRStorage Constructor

Creates a new storage instance.

**Signature**:
```typescript
constructor(basePath: string)
```

**Parameters**:
- `basePath` (string): Base directory for IR storage

**Example**:
```typescript
import { IRStorage } from '@lumora/ir';

const storage = new IRStorage('.lumora/ir');
```

---

### IRStorage.store

Stores an IR with versioning.

**Signature**:
```typescript
store(id: string, ir: LumoraIR): IRStorageEntry
```

**Parameters**:
- `id` (string): Unique identifier for the IR
- `ir` (LumoraIR): IR to store

**Returns**: IRStorageEntry - Storage entry with version information

**Example**:
```typescript
const entry = storage.store('my-component', ir);
console.log(`Stored version ${entry.version}`);
console.log(`Timestamp: ${new Date(entry.timestamp)}`);
```

**Throws**: 
- ValidationError if IR is invalid
- StorageError if write fails

---

### IRStorage.retrieve

Retrieves an IR by ID and optional version.

**Signature**:
```typescript
retrieve(id: string, version?: number): IRStorageEntry | null
```

**Parameters**:
- `id` (string): IR identifier
- `version` (number, optional): Specific version to retrieve (defaults to latest)

**Returns**: IRStorageEntry | null - Storage entry or null if not found

**Example**:
```typescript
// Get latest version
const latest = storage.retrieve('my-component');

// Get specific version
const v1 = storage.retrieve('my-component', 1);

if (latest) {
  console.log(`Version ${latest.version}`);
  console.log(`IR:`, latest.ir);
}
```

---

### IRStorage.getCurrentVersion

Gets the current version number for an IR.

**Signature**:
```typescript
getCurrentVersion(id: string): number
```

**Parameters**:
- `id` (string): IR identifier

**Returns**: number - Current version number (0 if not found)

**Example**:
```typescript
const version = storage.getCurrentVersion('my-component');
console.log(`Current version: ${version}`);
```

---

### IRStorage.getHistory

Gets the version history for an IR.

**Signature**:
```typescript
getHistory(id: string): IRStorageEntry[]
```

**Parameters**:
- `id` (string): IR identifier

**Returns**: IRStorageEntry[] - Array of all versions, newest first

**Example**:
```typescript
const history = storage.getHistory('my-component');
history.forEach(entry => {
  console.log(`v${entry.version}: ${new Date(entry.timestamp)}`);
});
```

---

### IRStorage.delete

Deletes an IR and all its versions.

**Signature**:
```typescript
delete(id: string): boolean
```

**Parameters**:
- `id` (string): IR identifier

**Returns**: boolean - True if deleted, false if not found

**Example**:
```typescript
if (storage.delete('my-component')) {
  console.log('Deleted successfully');
} else {
  console.log('Component not found');
}
```

---

### IRStorage.list

Lists all stored IR identifiers.

**Signature**:
```typescript
list(): string[]
```

**Returns**: string[] - Array of IR identifiers

**Example**:
```typescript
const ids = storage.list();
console.log('Stored components:', ids);
```

---

### IRStorage.hasChanged

Checks if an IR has changed compared to stored version.

**Signature**:
```typescript
hasChanged(id: string, ir: LumoraIR): boolean
```

**Parameters**:
- `id` (string): IR identifier
- `ir` (LumoraIR): IR to compare

**Returns**: boolean - True if different from stored version

**Example**:
```typescript
if (storage.hasChanged('my-component', updatedIR)) {
  storage.store('my-component', updatedIR);
  console.log('Stored new version');
} else {
  console.log('No changes detected');
}
```

## Migration API

### getMigrator

Returns the singleton migrator instance.

**Signature**:
```typescript
function getMigrator(): IRMigrator
```

**Returns**: IRMigrator - Migrator instance

**Example**:
```typescript
import { getMigrator } from '@lumora/ir';

const migrator = getMigrator();
```

---

### IRMigrator.migrate

Migrates an IR to a target version.

**Signature**:
```typescript
migrate(ir: any, targetVersion: string): LumoraIR
```

**Parameters**:
- `ir` (any): IR to migrate
- `targetVersion` (string): Target schema version

**Returns**: LumoraIR - Migrated IR

**Example**:
```typescript
const migrator = getMigrator();
const migratedIR = migrator.migrate(oldIR, '2.0.0');
```

**Throws**: MigrationError if migration fails

---

### IRMigrator.needsMigration

Checks if an IR needs migration.

**Signature**:
```typescript
needsMigration(ir: any, targetVersion: string): boolean
```

**Parameters**:
- `ir` (any): IR to check
- `targetVersion` (string): Target schema version

**Returns**: boolean - True if migration needed

**Example**:
```typescript
if (migrator.needsMigration(ir, '2.0.0')) {
  const migrated = migrator.migrate(ir, '2.0.0');
  storage.store('my-component', migrated);
}
```

---

### IRMigrator.getCurrentVersion

Gets the current IR schema version.

**Signature**:
```typescript
getCurrentVersion(): string
```

**Returns**: string - Current schema version

**Example**:
```typescript
const version = migrator.getCurrentVersion();
console.log(`Current IR version: ${version}`);
```

---

### IRMigrator.registerMigration

Registers a custom migration.

**Signature**:
```typescript
registerMigration(migration: IRMigration): void
```

**Parameters**:
- `migration` (IRMigration): Migration definition

**Example**:
```typescript
migrator.registerMigration({
  fromVersion: '1.0.0',
  toVersion: '1.1.0',
  migrate: (ir) => {
    // Add new field
    ir.metadata.customField = 'default';
    return ir;
  },
});
```

## Utility API

### findNodeById

Finds a node by its ID.

**Signature**:
```typescript
function findNodeById(
  nodes: LumoraNode[],
  id: string
): LumoraNode | null
```

**Parameters**:
- `nodes` (LumoraNode[]): Nodes to search
- `id` (string): Node ID to find

**Returns**: LumoraNode | null - Found node or null

**Example**:
```typescript
import { findNodeById } from '@lumora/ir';

const node = findNodeById(ir.nodes, 'node_123');
if (node) {
  console.log(`Found: ${node.type}`);
}
```

---

### findNodesByType

Finds all nodes of a specific type.

**Signature**:
```typescript
function findNodesByType(
  nodes: LumoraNode[],
  type: string
): LumoraNode[]
```

**Parameters**:
- `nodes` (LumoraNode[]): Nodes to search
- `type` (string): Node type to find

**Returns**: LumoraNode[] - Array of matching nodes

**Example**:
```typescript
import { findNodesByType } from '@lumora/ir';

const textNodes = findNodesByType(ir.nodes, 'Text');
console.log(`Found ${textNodes.length} text nodes`);
```

---

### countNodes

Counts total nodes in a tree.

**Signature**:
```typescript
function countNodes(nodes: LumoraNode[]): number
```

**Parameters**:
- `nodes` (LumoraNode[]): Nodes to count

**Returns**: number - Total node count including children

**Example**:
```typescript
import { countNodes } from '@lumora/ir';

const total = countNodes(ir.nodes);
console.log(`Total nodes: ${total}`);
```

---

### getMaxDepth

Gets the maximum depth of a node tree.

**Signature**:
```typescript
function getMaxDepth(nodes: LumoraNode[]): number
```

**Parameters**:
- `nodes` (LumoraNode[]): Nodes to analyze

**Returns**: number - Maximum depth (0 for empty array)

**Example**:
```typescript
import { getMaxDepth } from '@lumora/ir';

const depth = getMaxDepth(ir.nodes);
console.log(`Tree depth: ${depth}`);
```

---

### traverseNodes

Traverses nodes with a visitor function.

**Signature**:
```typescript
function traverseNodes(
  nodes: LumoraNode[],
  visitor: (node: LumoraNode, depth: number) => void
): void
```

**Parameters**:
- `nodes` (LumoraNode[]): Nodes to traverse
- `visitor` (Function): Visitor function called for each node

**Example**:
```typescript
import { traverseNodes } from '@lumora/ir';

traverseNodes(ir.nodes, (node, depth) => {
  const indent = '  '.repeat(depth);
  console.log(`${indent}${node.type}`);
});
```

---

### flattenNodes

Flattens a node tree into a single array.

**Signature**:
```typescript
function flattenNodes(nodes: LumoraNode[]): LumoraNode[]
```

**Parameters**:
- `nodes` (LumoraNode[]): Nodes to flatten

**Returns**: LumoraNode[] - Flat array of all nodes

**Example**:
```typescript
import { flattenNodes } from '@lumora/ir';

const allNodes = flattenNodes(ir.nodes);
console.log(`Total nodes: ${allNodes.length}`);
```

## Type Definitions

### LumoraIR

```typescript
interface LumoraIR {
  version: string;
  metadata: IRMetadata;
  nodes: LumoraNode[];
  theme?: ThemeDefinition;
  navigation?: NavigationDefinition;
}
```

### IRMetadata

```typescript
interface IRMetadata {
  sourceFramework: 'react' | 'flutter';
  sourceFile: string;
  generatedAt: number;
  author?: string;
  description?: string;
}
```

### LumoraNode

```typescript
interface LumoraNode {
  id: string;
  type: string;
  props: Record<string, any>;
  children: LumoraNode[];
  state?: StateDefinition;
  events?: EventDefinition[];
  metadata: NodeMetadata;
}
```

### NodeMetadata

```typescript
interface NodeMetadata {
  lineNumber: number;
  documentation?: string;
  tags?: string[];
}
```

### StateDefinition

```typescript
interface StateDefinition {
  type: 'local' | 'global' | 'async';
  variables: StateVariable[];
}
```

### StateVariable

```typescript
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
  name: string;
  handler: string;
  parameters: Parameter[];
  async: boolean;
}
```

### Parameter

```typescript
interface Parameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: any;
}
```

### ThemeDefinition

```typescript
interface ThemeDefinition {
  colors: Record<string, string>;
  typography: TypographyDefinition;
  spacing: SpacingDefinition;
}
```

### TypographyDefinition

```typescript
interface TypographyDefinition {
  fontFamily: string;
  fontSize: Record<string, number>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, number>;
}
```

### SpacingDefinition

```typescript
interface SpacingDefinition {
  unit: number;
  scale: number[];
}
```

### NavigationDefinition

```typescript
interface NavigationDefinition {
  routes: RouteDefinition[];
  initialRoute: string;
}
```

### RouteDefinition

```typescript
interface RouteDefinition {
  name: string;
  path: string;
  component: string;
  params?: Parameter[];
}
```

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
```

### ValidationError

```typescript
interface ValidationError {
  path: string;
  message: string;
  value?: any;
}
```

### IRStorageEntry

```typescript
interface IRStorageEntry {
  id: string;
  version: number;
  ir: LumoraIR;
  timestamp: number;
  checksum: string;
}
```

### IRMigration

```typescript
interface IRMigration {
  fromVersion: string;
  toVersion: string;
  migrate: (ir: any) => LumoraIR;
}
```

## Error Handling

### ValidationError

Thrown when IR validation fails.

**Properties**:
- `message` (string): Error description
- `errors` (ValidationError[]): Detailed validation errors

**Example**:
```typescript
try {
  validator.validateOrThrow(ir);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:');
    error.errors.forEach(e => {
      console.error(`  ${e.path}: ${e.message}`);
    });
  }
}
```

---

### StorageError

Thrown when storage operations fail.

**Properties**:
- `message` (string): Error description
- `path` (string): File path that caused the error

**Example**:
```typescript
try {
  storage.store('my-component', ir);
} catch (error) {
  if (error instanceof StorageError) {
    console.error(`Storage failed: ${error.message}`);
    console.error(`Path: ${error.path}`);
  }
}
```

---

### MigrationError

Thrown when migration fails.

**Properties**:
- `message` (string): Error description
- `fromVersion` (string): Source version
- `toVersion` (string): Target version

**Example**:
```typescript
try {
  migrator.migrate(ir, '2.0.0');
} catch (error) {
  if (error instanceof MigrationError) {
    console.error(`Migration failed: ${error.message}`);
    console.error(`From: ${error.fromVersion}`);
    console.error(`To: ${error.toVersion}`);
  }
}
```

## Best Practices

### Always Validate

```typescript
// ✅ Good
const validator = getValidator();
validator.validateOrThrow(ir);
storage.store('component', ir);

// ❌ Bad
storage.store('component', ir); // May store invalid IR
```

### Check for Changes

```typescript
// ✅ Good
if (storage.hasChanged('component', ir)) {
  storage.store('component', ir);
}

// ❌ Bad
storage.store('component', ir); // Creates unnecessary versions
```

### Handle Errors

```typescript
// ✅ Good
try {
  const entry = storage.retrieve('component');
  if (!entry) {
    console.warn('Component not found');
    return;
  }
  processIR(entry.ir);
} catch (error) {
  console.error('Failed to retrieve:', error);
}

// ❌ Bad
const entry = storage.retrieve('component');
processIR(entry.ir); // May throw if null
```

### Use Type Guards

```typescript
// ✅ Good
function isLumoraIR(value: any): value is LumoraIR {
  return (
    value &&
    typeof value.version === 'string' &&
    value.metadata &&
    Array.isArray(value.nodes)
  );
}

if (isLumoraIR(data)) {
  processIR(data);
}

// ❌ Bad
processIR(data); // No type checking
```

### Clone Before Modifying

```typescript
// ✅ Good
const copy = cloneIR(original);
copy.nodes[0].props.width = 200;

// ❌ Bad
original.nodes[0].props.width = 200; // Mutates original
```

## Performance Tips

### Cache Validator

```typescript
// ✅ Good
const validator = getValidator();
for (const ir of irs) {
  validator.validate(ir);
}

// ❌ Bad
for (const ir of irs) {
  getValidator().validate(ir); // Creates new instance each time
}
```

### Batch Operations

```typescript
// ✅ Good
const changes = detectChanges(components);
changes.forEach(({ id, ir }) => {
  storage.store(id, ir);
});

// ❌ Bad
components.forEach(({ id, ir }) => {
  if (storage.hasChanged(id, ir)) {
    storage.store(id, ir);
  }
}); // Multiple file system checks
```

### Use Specific Queries

```typescript
// ✅ Good
const button = findNodeById(ir.nodes, 'button_1');

// ❌ Bad
const allNodes = flattenNodes(ir.nodes);
const button = allNodes.find(n => n.id === 'button_1');
```

---

**API Version**: 1.0.0  
**Last Updated**: 2025-11-10  
**Compatibility**: Lumora IR v1.x
