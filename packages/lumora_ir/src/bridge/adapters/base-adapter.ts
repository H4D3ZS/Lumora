/**
 * Base State Adapter Interface
 * Defines the contract for state management adapters
 */

import { StateDefinition, StateVariable } from '../../types/ir-types';

/**
 * Adapter configuration
 */
export interface AdapterConfig {
  preserveComments?: boolean;
  generateTests?: boolean;
  includeImports?: boolean;
}

/**
 * Generated code result
 */
export interface GeneratedCode {
  stateClass: string;
  eventClasses?: string;
  providerCode?: string;
  imports: string[];
  usage?: string;
}

/**
 * Base adapter interface
 */
export interface StateAdapter {
  /**
   * Adapter name
   */
  readonly name: string;

  /**
   * Convert state definition to adapter-specific code
   */
  convertToFlutter(
    state: StateDefinition,
    componentName: string,
    config?: AdapterConfig
  ): GeneratedCode;

  /**
   * Convert adapter-specific code back to state definition
   */
  convertFromFlutter(
    dartCode: string,
    componentName: string
  ): StateDefinition;

  /**
   * Generate usage example
   */
  generateUsageExample(componentName: string): string;
}

/**
 * Abstract base adapter with common utilities
 */
export abstract class BaseStateAdapter implements StateAdapter {
  abstract readonly name: string;

  abstract convertToFlutter(
    state: StateDefinition,
    componentName: string,
    config?: AdapterConfig
  ): GeneratedCode;

  abstract convertFromFlutter(
    dartCode: string,
    componentName: string
  ): StateDefinition;

  abstract generateUsageExample(componentName: string): string;

  /**
   * Map TypeScript type to Flutter/Dart type
   */
  protected mapTypeToFlutter(tsType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'String',
      'number': 'double',
      'boolean': 'bool',
      'any': 'dynamic',
      'void': 'void',
      'null': 'Null',
      'undefined': 'Null',
      'object': 'Map<String, dynamic>',
      'array': 'List<dynamic>',
      'function': 'Function',
      'ref': 'dynamic',
    };

    // Handle array types: string[] -> List<String>
    if (tsType.endsWith('[]')) {
      const elementType = tsType.slice(0, -2);
      return `List<${this.mapTypeToFlutter(elementType)}>`;
    }

    // Handle generic types: Array<string> -> List<String>
    const genericMatch = tsType.match(/^(\w+)<(.+)>$/);
    if (genericMatch) {
      const [, container, inner] = genericMatch;
      if (container === 'Array') {
        return `List<${this.mapTypeToFlutter(inner)}>`;
      }
      return `${container}<${this.mapTypeToFlutter(inner)}>`;
    }

    return typeMap[tsType] || tsType;
  }

  /**
   * Format initial value for Flutter with type awareness
   */
  protected formatInitialValue(value: any, type: string): string {
    if (value === undefined || value === null) {
      // Return default values based on type
      if (type === 'string') return "''";
      if (type === 'number') return '0';
      if (type === 'boolean') return 'false';
      if (type.includes('List') || type.includes('array')) return '[]';
      if (type.includes('Map') || type.includes('object')) return '{}';
      return 'null';
    }

    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "\\'")}'`;
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (Array.isArray(value)) {
      const elements = value.map(v => this.formatInitialValue(v, typeof v)).join(', ');
      return `[${elements}]`;
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value)
        .map(([k, v]) => `'${k}': ${this.formatInitialValue(v, typeof v)}`)
        .join(', ');
      return `{${entries}}`;
    }

    return String(value);
  }

  /**
   * Capitalize first letter
   */
  protected capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Uncapitalize first letter
   */
  protected uncapitalize(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Generate state variable declarations
   */
  protected generateStateVariables(variables: StateVariable[], isFinal: boolean = true): string {
    return variables
      .map(v => {
        const type = this.mapTypeToFlutter(v.type);
        const finalKeyword = isFinal ? 'final ' : '';
        return `  ${finalKeyword}${type} ${v.name};`;
      })
      .join('\n');
  }

  /**
   * Generate constructor parameters
   */
  protected generateConstructorParams(variables: StateVariable[]): string {
    return variables
      .map(v => `required this.${v.name}`)
      .join(', ');
  }

  /**
   * Generate copyWith method parameters
   */
  protected generateCopyWithParams(variables: StateVariable[]): string {
    return variables
      .map(v => `    ${this.mapTypeToFlutter(v.type)}? ${v.name},`)
      .join('\n');
  }

  /**
   * Generate copyWith method body
   */
  protected generateCopyWithBody(variables: StateVariable[], className: string): string {
    return `    return ${className}(
${variables.map(v => `      ${v.name}: ${v.name} ?? this.${v.name},`).join('\n')}
    );`;
  }

  /**
   * Generate initial state
   */
  protected generateInitialState(variables: StateVariable[], className: string): string {
    return `${className}(
${variables.map(v => `      ${v.name}: ${this.formatInitialValue(v.initialValue, v.type)},`).join('\n')}
    )`;
  }
}
