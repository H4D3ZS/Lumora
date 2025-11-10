/**
 * Lumora IR Type Definitions
 * Framework-agnostic intermediate representation for UI components
 */

export interface LumoraIR {
  version: string;
  metadata: IRMetadata;
  nodes: LumoraNode[];
  theme?: ThemeDefinition;
  navigation?: NavigationDefinition;
}

export interface IRMetadata {
  sourceFramework: 'react' | 'flutter';
  sourceFile: string;
  generatedAt: number;
  author?: string;
  irVersion?: string;
}

export interface LumoraNode {
  id: string;
  type: string;
  props: Record<string, any>;
  children: LumoraNode[];
  state?: StateDefinition;
  events?: EventDefinition[];
  metadata: NodeMetadata;
}

export interface NodeMetadata {
  lineNumber: number;
  documentation?: string;
}

export interface StateDefinition {
  type: 'local' | 'global' | 'async';
  variables: StateVariable[];
}

export interface StateVariable {
  name: string;
  type: string;
  initialValue: any;
  mutable: boolean;
}

export interface EventDefinition {
  name: string;
  handler: string;
  parameters: Parameter[];
}

export interface Parameter {
  name: string;
  type: string;
  optional?: boolean;
}

export interface ThemeDefinition {
  colors?: Record<string, any>;
  typography?: Record<string, any>;
  spacing?: Record<string, any>;
}

export interface NavigationDefinition {
  routes?: Route[];
}

export interface Route {
  path: string;
  component: string;
  params?: Record<string, any>;
}

/**
 * IR Storage Entry with versioning
 */
export interface IRStorageEntry {
  id: string;
  ir: LumoraIR;
  version: number;
  timestamp: number;
  checksum: string;
}

/**
 * IR Migration definition
 */
export interface IRMigration {
  fromVersion: string;
  toVersion: string;
  migrate: (ir: any) => LumoraIR;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  keyword?: string;
}
