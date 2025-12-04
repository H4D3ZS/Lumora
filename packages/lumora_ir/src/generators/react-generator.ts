/**
 * React/TSX Code Generator
 * Generates React components from Lumora IR
 * Enables Flutter → React conversion
 */

import {
  LumoraIR,
  LumoraNode,
  StateDefinition,
  EventDefinition,
  LifecycleDefinition,
} from '../types/ir-types';
import { ErrorHandler, getErrorHandler } from '../errors/error-handler';
import { WidgetMappingRegistry, getRegistry } from '../registry/widget-mapping-registry';

export interface ReactGeneratorConfig {
  errorHandler?: ErrorHandler;
  useTypeScript?: boolean;
  useFunctionComponents?: boolean;
  stateManagement?: 'useState' | 'context' | 'redux' | 'mobx';
  styleFormat?: 'inline' | 'styled-components' | 'css-modules';
  indent?: string;
  addComments?: boolean;
}

/**
 * React Code Generator
 * Converts Lumora IR to React/TypeScript code
 */
export class ReactGenerator {
  private errorHandler: ErrorHandler;
  private config: ReactGeneratorConfig;
  private registry: WidgetMappingRegistry;
  private imports: Set<string> = new Set();
  private namedImports: Map<string, Set<string>> = new Map();

  constructor(config: ReactGeneratorConfig = {}) {
    this.config = {
      useTypeScript: true,
      useFunctionComponents: true,
      stateManagement: 'useState',
      styleFormat: 'inline',
      indent: '  ',
      addComments: true,
      ...config,
    };
    this.errorHandler = config.errorHandler || getErrorHandler();
    this.registry = getRegistry();
  }

  /**
   * Generate React component from Lumora IR
   */
  generate(ir: LumoraIR): string {
    this.imports.clear();
    this.namedImports.clear();

    // Add React import
    this.imports.add("import React from 'react';");

    // Generate components
    const components = ir.nodes.map(node => this.generateComponent(node));

    // Build final code
    let importsCode = Array.from(this.imports).join('\n');

    // Add named imports
    if (this.namedImports.size > 0) {
      const namedImportsCode = Array.from(this.namedImports.entries()).map(([source, names]) => {
        return `import { ${Array.from(names).join(', ')} } from '${source}';`;
      }).join('\n');
      importsCode += '\n' + namedImportsCode;
    }

    const componentsCode = components.join('\n\n');

    return `${importsCode}\n\n${componentsCode}`;
  }

  /**
   * Generate a single React component
   */
  private generateComponent(node: LumoraNode): string {
    const componentName = node.type;

    if (this.config.useFunctionComponents) {
      return this.generateFunctionComponent(node);
    } else {
      return this.generateClassComponent(node);
    }
  }

  /**
   * Generate function component
   */
  private generateFunctionComponent(node: LumoraNode): string {
    const { type: name, props, state, events, children } = node;

    let code = '';

    // Add comment
    if (this.config.addComments && node.metadata?.documentation) {
      code += `// ${node.metadata.documentation}\n`;
    }

    // Props interface
    if (this.config.useTypeScript && props && Object.keys(props).length > 0) {
      code += this.generatePropsInterface(name, props);
      code += '\n\n';
    }

    // Function signature
    // Function signature
    const propsParam = this.config.useTypeScript ? `props: ${name}Props` : 'props';
    const typeAnnotation = this.config.useTypeScript ? `: React.FC<${name}Props>` : '';
    code += `export const ${name}${typeAnnotation} = (${propsParam}) => {\n`;

    // State hooks
    if (state) {
      code += this.generateStateHooks(state);
    }

    // Event handlers
    if (events && events.length > 0) {
      code += this.generateEventHandlers(events);
    }

    // Lifecycle hooks
    if (node.lifecycle && node.lifecycle.length > 0) {
      code += this.generateLifecycleHooks(node.lifecycle);
    }

    // JSX return
    code += `${this.config.indent}return (\n`;
    code += this.generateJSX(node, 2);
    code += `\n${this.config.indent});\n`;
    code += '};\n';

    return code;
  }

  /**
   * Generate class component
   */
  private generateClassComponent(node: LumoraNode): string {
    const { type: name, props, state, events } = node;

    let code = '';

    // Add comment
    if (this.config.addComments && node.metadata?.documentation) {
      code += `// ${node.metadata.documentation}\n`;
    }

    // Props interface
    if (this.config.useTypeScript && props && Object.keys(props).length > 0) {
      code += this.generatePropsInterface(name, props);
      code += '\n\n';
    }

    // State interface
    if (this.config.useTypeScript && state) {
      code += this.generateStateInterface(name, state);
      code += '\n\n';
    }

    // Class declaration
    // Class declaration
    const propsType = this.config.useTypeScript ? `<${name}Props${state ? `, ${name}State` : ''}>` : '';
    code += `export class ${name} extends React.Component${propsType} {\n`;

    // Constructor with state
    if (state) {
      code += this.generateConstructor(state);
    }

    // Event handlers
    if (events && events.length > 0) {
      code += this.generateClassMethods(events);
    }

    // Render method
    code += `${this.config.indent}render() {\n`;
    code += `${this.config.indent}${this.config.indent}return (\n`;
    code += this.generateJSX(node, 3);
    code += `\n${this.config.indent}${this.config.indent});\n`;
    code += `${this.config.indent}}\n`;
    code += '}\n';

    return code;
  }

  /**
   * Generate props interface
   */
  private generatePropsInterface(componentName: string, props: Record<string, any>): string {
    let code = `interface ${componentName}Props {\n`;

    for (const [key, value] of Object.entries(props)) {
      const type = this.inferTypeScriptType(value);
      const optional = value.optional !== false ? '?' : '';
      code += `${this.config.indent}${key}${optional}: ${type};\n`;
    }

    code += '}';
    return code;
  }

  /**
   * Generate state interface
   */
  private generateStateInterface(componentName: string, state: StateDefinition): string {
    let code = `interface ${componentName}State {\n`;

    for (const variable of state.variables) {
      const type = variable.type || 'any';
      code += `${this.config.indent}${variable.name}: ${type};\n`;
    }

    code += '}';
    return code;
  }

  /**
   * Generate state hooks (useState, etc.)
   */
  private generateStateHooks(state: StateDefinition): string {
    let code = '';

    for (const variable of state.variables) {
      const initialValue = this.serializeValue(variable.initialValue);
      const setterName = `set${this.capitalize(variable.name)}`;

      code += `${this.config.indent}const [${variable.name}, ${setterName}] = React.useState`;

      if (this.config.useTypeScript && variable.type) {
        code += `<${variable.type}>`;
      }

      code += `(${initialValue});\n`;
    }

    if (code) {
      code += '\n';
    }

    return code;
  }

  /**
   * Generate event handlers as functions
   */
  private generateEventHandlers(events: EventDefinition[]): string {
    let code = '';

    for (const event of events) {
      const params = event.parameters?.map(p => {
        if (this.config.useTypeScript) {
          return `${p.name}: ${p.type}`;
        }
        return p.name;
      }).join(', ') || '';

      code += `${this.config.indent}const ${event.name} = (${params}) => {\n`;
      code += `${this.config.indent}${this.config.indent}${event.handler || '// TODO: Implement handler'}\n`;
      code += `${this.config.indent}};\n\n`;
    }

    return code;
  }

  /**
   * Generate lifecycle hooks (useEffect, etc.)
   */
  private generateLifecycleHooks(lifecycle: LifecycleDefinition[]): string {
    let code = '';

    for (const hook of lifecycle) {
      const deps = hook.dependencies ? `[${hook.dependencies.join(', ')}]` : '[]';

      code += `${this.config.indent}React.useEffect(() => {\n`;
      code += `${this.config.indent}${this.config.indent}${hook.handler || '// TODO: Implement effect'}\n`;

      // Add cleanup for unmount
      if (hook.type === 'unmount') {
        code += `${this.config.indent}${this.config.indent}return () => {\n`;
        code += `${this.config.indent}${this.config.indent}${this.config.indent}// Cleanup\n`;
        code += `${this.config.indent}${this.config.indent}};\n`;
      }

      code += `${this.config.indent}}, ${deps});\n\n`;
    }

    return code;
  }

  /**
   * Generate constructor for class component
   */
  private generateConstructor(state: StateDefinition): string {
    let code = `${this.config.indent}constructor(props${this.config.useTypeScript ? `: ${this.config.indent}Props` : ''}) {\n`;
    code += `${this.config.indent}${this.config.indent}super(props);\n`;
    code += `${this.config.indent}${this.config.indent}this.state = {\n`;

    for (const variable of state.variables) {
      const value = this.serializeValue(variable.initialValue);
      code += `${this.config.indent}${this.config.indent}${this.config.indent}${variable.name}: ${value},\n`;
    }

    code += `${this.config.indent}${this.config.indent}};\n`;
    code += `${this.config.indent}}\n\n`;

    return code;
  }

  /**
   * Generate class methods for event handlers
   */
  private generateClassMethods(events: EventDefinition[]): string {
    let code = '';

    for (const event of events) {
      const params = event.parameters?.map(p => {
        if (this.config.useTypeScript) {
          return `${p.name}: ${p.type}`;
        }
        return p.name;
      }).join(', ') || '';

      code += `${this.config.indent}${event.name} = (${params}) => {\n`;
      code += `${this.config.indent}${this.config.indent}${event.handler || '// TODO: Implement handler'}\n`;
      code += `${this.config.indent}};\n\n`;
    }

    return code;
  }

  /**
   * Generate JSX from node tree
   */
  private generateJSX(node: LumoraNode, indentLevel: number): string {
    const indent = this.config.indent!.repeat(indentLevel);
    const mapping = this.registry.getMapping(node.type);

    // Get React component name
    const reactComponent = mapping?.react.component || node.type;

    // Collect imports
    if (mapping?.react?.import) {
      const source = mapping.react.import;
      if (!this.namedImports.has(source)) {
        this.namedImports.set(source, new Set());
      }
      this.namedImports.get(source)!.add(reactComponent);
    }

    // Generate props
    const propsStr = this.generateJSXProps(node.props, mapping);

    // Check if self-closing
    if (!node.children || node.children.length === 0) {
      return `${indent}<${reactComponent}${propsStr} />`;
    }

    // Generate children
    let code = `${indent}<${reactComponent}${propsStr}>\n`;

    for (const child of node.children) {
      code += this.generateJSX(child, indentLevel + 1) + '\n';
    }

    code += `${indent}</${reactComponent}>`;

    return code;
  }

  /**
   * Generate JSX props string
   */
  private generateJSXProps(props: Record<string, any>, mapping?: any): string {
    if (!props || Object.keys(props).length === 0) {
      return '';
    }

    let propsStr = '';

    for (const [key, value] of Object.entries(props)) {
      // Map prop name if needed
      const reactProp = mapping?.props?.[key]?.react || key;

      // Handle different value types
      if (typeof value === 'string') {
        propsStr += ` ${reactProp}="${value}"`;
      } else if (typeof value === 'boolean') {
        if (value) {
          propsStr += ` ${reactProp}`;
        }
      } else {
        propsStr += ` ${reactProp}={${this.serializeValue(value)}}`;
      }
    }

    return propsStr;
  }

  /**
   * Infer TypeScript type from value
   */
  private inferTypeScriptType(value: any): string {
    if (value === null || value === undefined) {
      return 'any';
    }

    if (typeof value === 'object' && value.type) {
      return value.type;
    }

    const type = typeof value;

    switch (type) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'function':
        return '() => void';
      case 'object':
        if (Array.isArray(value)) {
          return 'any[]';
        }
        return 'object';
      default:
        return 'any';
    }
  }

  /**
   * Serialize value to code string
   */
  private serializeValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    if (typeof value === 'string') {
      // Strip 'const ' prefix from Flutter/Dart values
      const cleanValue = value.replace(/^const\s+/, '');
      return `'${cleanValue.replace(/'/g, "\\'")}'`;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map(v => this.serializeValue(v)).join(', ')}]`;
    }

    if (typeof value === 'object') {
      // Handle expression objects
      if (value && value.type === 'expression' && typeof value.content === 'string') {
        return value.content.replace(/^const\s+/, '');
      }

      const entries = Object.entries(value).map(
        ([k, v]) => `${k}: ${this.serializeValue(v)}`
      );
      return `{ ${entries.join(', ')} }`;
    }

    return 'undefined';
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Helper function to create React generator
 */
export function createReactGenerator(config?: ReactGeneratorConfig): ReactGenerator {
  return new ReactGenerator(config);
}

/**
 * Helper function to generate React code from IR
 */
export function generateReactCode(ir: LumoraIR, config?: ReactGeneratorConfig): string {
  const generator = new ReactGenerator(config);
  return generator.generate(ir);
}
