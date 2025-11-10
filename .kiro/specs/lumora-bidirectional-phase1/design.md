# Lumora Bidirectional Framework - Phase 1 Design

## Overview

The Lumora Bidirectional Framework enables seamless conversion between React/TypeScript and Flutter/Dart through a universal intermediate representation (Lumora IR). This design document outlines the architecture, components, and implementation strategy for Phase 1, which focuses on building the core bidirectional conversion system.

## Architecture

### High-Level System Architecture

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
│         │    Lumora IR        │                                 │
│         │  (Intermediate      │                                 │
│         │  Representation)    │                                 │
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

### Component Architecture


```
┌─────────────────────────────────────────────────────────────────┐
│                  Bidirectional Sync Engine                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ File Watcher │         │ File Watcher │                     │
│  │  (React)     │         │  (Flutter)   │                     │
│  └──────┬───────┘         └──────┬───────┘                     │
│         │                         │                              │
│         └────────┬────────────────┘                             │
│                  ▼                                               │
│         ┌─────────────────┐                                     │
│         │  Change Queue   │                                     │
│         └────────┬────────┘                                     │
│                  ▼                                               │
│         ┌─────────────────┐                                     │
│         │ Conflict Checker│                                     │
│         └────────┬────────┘                                     │
│                  │                                               │
│         ┌────────┴────────┐                                     │
│         ▼                 ▼                                      │
│  ┌──────────┐      ┌──────────────┐                           │
│  │ Convert  │      │   Conflict   │                           │
│  │  & Sync  │      │  Resolution  │                           │
│  └──────────┘      └──────────────┘                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Lumora IR (Intermediate Representation)

**Purpose**: Framework-agnostic representation of UI components

**Data Structure**:
```typescript
interface LumoraIR {
  version: string;
  metadata: {
    sourceFramework: 'react' | 'flutter';
    sourceFile: string;
    generatedAt: number;
    author?: string;
  };
  nodes: LumoraNode[];
  theme?: ThemeDefinition;
  navigation?: NavigationDefinition;
}

interface LumoraNode {
  id: string;
  type: string;  // e.g., "Container", "Text", "Button"
  props: Record<string, any>;
  children: LumoraNode[];
  state?: StateDefinition;
  events?: EventDefinition[];
  metadata: {
    lineNumber: number;
    documentation?: string;
  };
}

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

interface EventDefinition {
  name: string;
  handler: string;
  parameters: Parameter[];
}
```

**Storage**: JSON files in `.lumora/ir/` directory with versioning

### 2. React Parser

**Technology**: @babel/parser, @babel/traverse

**Responsibilities**:
- Parse React/TSX files into AST
- Extract component structure
- Identify props, state, and events
- Convert to Lumora IR

**Implementation**:
```typescript
class ReactParser {
  parse(filePath: string): LumoraIR {
    const code = fs.readFileSync(filePath, 'utf8');
    const ast = babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    
    return this.astToIR(ast);
  }
  
  private astToIR(ast: any): LumoraIR {
    // Walk AST and build IR
  }
}
```

### 3. Flutter Parser

**Technology**: Dart analyzer package

**Responsibilities**:
- Parse Flutter/Dart files into AST
- Extract widget structure
- Identify props, state, and events
- Convert to Lumora IR

**Implementation**:
```dart
class FlutterParser {
  LumoraIR parse(String filePath) {
    final source = File(filePath).readAsStringSync();
    final parseResult = parseString(content: source);
    
    return astToIR(parseResult.unit);
  }
  
  LumoraIR astToIR(CompilationUnit unit) {
    // Walk AST and build IR
  }
}
```

### 4. React Generator

**Responsibilities**:
- Convert Lumora IR to React/TypeScript code
- Generate proper imports
- Format code with Prettier
- Preserve documentation

**Implementation**:
```typescript
class ReactGenerator {
  generate(ir: LumoraIR): string {
    const imports = this.generateImports(ir);
    const component = this.generateComponent(ir);
    const exports = this.generateExports(ir);
    
    const code = `${imports}\n\n${component}\n\n${exports}`;
    return prettier.format(code, { parser: 'typescript' });
  }
  
  private generateComponent(ir: LumoraIR): string {
    // Generate React component code
  }
}
```

### 5. Flutter Generator

**Responsibilities**:
- Convert Lumora IR to Flutter/Dart code
- Generate proper imports
- Format code with dart_style
- Preserve documentation

**Implementation**:
```dart
class FlutterGenerator {
  String generate(LumoraIR ir) {
    final imports = generateImports(ir);
    final widget = generateWidget(ir);
    
    final code = '$imports\n\n$widget';
    return DartFormatter().format(code);
  }
  
  String generateWidget(LumoraIR ir) {
    // Generate Flutter widget code
  }
}
```

