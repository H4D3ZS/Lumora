const fs = require('fs');
const path = require('path');
const ReactCodeFormatter = require('./react-code-formatter');

/**
 * Enhanced IRToReact - Converts Lumora IR to high-quality React/TypeScript code
 * 
 * Features:
 * - Idiomatic TypeScript with proper type annotations
 * - Proper code formatting and indentation
 * - Helpful comments explaining patterns and conversions
 * - React best practices (hooks rules, memoization, etc.)
 * - Optimized re-renders with React.memo
 * - Clean, readable code structure
 */
class IRToReactEnhanced {
  constructor() {
    this.widgetMappings = {};
    this.imports = new Set();
    this.stateVariables = [];
    this.eventHandlers = [];
    this.formatter = new ReactCodeFormatter();
    this.optimizationHints = [];
  }

  /**
   * Load widget mappings from JSON file
   * @param {string} mappingPath - Path to widget mapping JSON file
   */
  loadMappings(mappingPath) {
    try {
      const mappingContent = fs.readFileSync(mappingPath, 'utf-8');
      this.widgetMappings = JSON.parse(mappingContent);
    } catch (error) {
      throw new Error(`Failed to load widget mappings: ${error.message}`);
    }
  }

  /**
   * Convert Lumora IR to React TypeScript code with enhanced quality
   * @param {object} ir - Lumora IR object
   * @returns {string} Generated TypeScript code
   */
  convertToReact(ir) {
    // Reset state
    this.imports = new Set(['React']);
    this.stateVariables = [];
    this.eventHandlers = [];
    this.lifecycleMethods = [];
    this.navigationInfo = null;
    this.isInheritedWidget = false;
    this.stateManagementPattern = null;
    this.optimizationHints = [];

    // Extract component metadata
    const componentName = ir.metadata.componentName || 'GeneratedComponent';
    this.currentComponentName = componentName;
    const documentation = ir.metadata.documentation;

    // Check for special patterns
    if (ir.metadata.isInherited) {
      this.isInheritedWidget = true;
    }

    if (ir.metadata.stateManagement) {
      this.stateManagementPattern = ir.metadata.stateManagement;
    }

    if (ir.metadata.navigation && ir.metadata.navigation.hasNavigation) {
      this.navigationInfo = ir.metadata.navigation;
      this.imports.add("{ BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom'");
    }

    // Extract Flutter-specific metadata
    if (ir.metadata.flutter) {
      this.stateVariables = ir.metadata.flutter.stateVariables || [];
      this.lifecycleMethods = ir.metadata.flutter.lifecycleMethods || [];
      this.eventHandlers = ir.metadata.flutter.eventHandlers || [];
    }

    // Collect additional state and events from nodes
    this.collectStateVariables(ir.nodes);

    // Determine component characteristics
    const hasState = this.stateVariables.length > 0 || 
                     this.eventHandlers.length > 0 || 
                     this.lifecycleMethods.length > 0;
    
    const shouldMemoize = this.shouldMemoizeComponent(ir);

    // Generate code sections
    let code = '';

    // File header with conversion info
    code += this.generateFileHeader(documentation, ir.metadata);
    code += '\n';

    // Imports section
    code += this.generateEnhancedImports();
    code += '\n\n';

    // Context generation for InheritedWidget
    if (this.isInheritedWidget) {
      code += this.generateReactContext(componentName);
      code += '\n';
    }

    // Props interface with documentation
    code += this.generateEnhancedPropsInterface(componentName, ir.metadata);
    code += '\n';

    // Main component
    if (this.isInheritedWidget) {
      code += this.generateContextProvider(componentName, ir.nodes);
    } else if (hasState) {
      code += this.generateFunctionalComponentWithState(componentName, ir.nodes, shouldMemoize);
    } else {
      code += this.generateFunctionalComponent(componentName, ir.nodes, shouldMemoize);
    }

    code += '\n\n';

    // Exports
    code += this.generateExports(componentName);

    // Add optimization hints as comments at the end
    if (this.optimizationHints.length > 0) {
      code += '\n\n';
      code += this.generateOptimizationHints();
    }

    // Format the final code
    return this.formatter.formatCode(code);
  }

  /**
   * Generate file header with metadata and conversion info
   * @param {string} documentation - Component documentation
   * @param {object} metadata - IR metadata
   * @returns {string} File header
   */
  generateFileHeader(documentation, metadata) {
    const lines = [];
    
    lines.push('Generated React Component');
    lines.push('');
    
    if (metadata.sourceFramework) {
      lines.push(`Converted from: ${metadata.sourceFramework}`);
    }
    
    if (metadata.sourceFile) {
      lines.push(`Source file: ${metadata.sourceFile}`);
    }
    
    if (metadata.generatedAt) {
      const date = new Date(metadata.generatedAt).toISOString();
      lines.push(`Generated: ${date}`);
    }
    
    if (documentation) {
      lines.push('');
      lines.push(documentation);
    }
    
    if (this.stateManagementPattern && this.stateManagementPattern.pattern !== 'setState') {
      lines.push('');
      lines.push(`State Management: Converted from Flutter ${this.stateManagementPattern.pattern}`);
      lines.push(`Target Pattern: ${this.stateManagementPattern.targetPattern}`);
      lines.push(`Confidence: ${(this.stateManagementPattern.confidence * 100).toFixed(0)}%`);
    }
    
    return this.formatter.generateCommentBlock(lines, 0);
  }

  /**
   * Generate enhanced imports with proper grouping
   * @returns {string} Import statements
   */
  generateEnhancedImports() {
    const reactImports = ['React'];
    
    // Add hooks based on usage
    if (this.stateVariables.length > 0) {
      reactImports.push('useState');
      this.optimizationHints.push('Consider using useReducer for complex state logic');
    }
    
    if (this.lifecycleMethods.length > 0) {
      reactImports.push('useEffect');
    }
    
    if (this.eventHandlers.some(h => h.hasCallback)) {
      reactImports.push('useCallback');
    }
    
    if (this.isInheritedWidget) {
      reactImports.push('createContext', 'useContext');
    }
    
    // Check if component should be memoized
    if (this.shouldMemoizeComponent()) {
      reactImports.push('memo');
    }
    
    // Build React import statement
    const importStatements = new Set();
    
    if (reactImports.length > 1) {
      const hooks = reactImports.slice(1).join(', ');
      importStatements.add(`import React, { ${hooks} } from 'react';`);
    } else {
      importStatements.add("import React from 'react';");
    }
    
    // Add other imports
    for (const imp of this.imports) {
      if (imp !== 'React') {
        importStatements.add(`import ${imp};`);
      }
    }
    
    return this.formatter.formatImports(importStatements);
  }

  /**
   * Generate enhanced props interface with documentation
   * @param {string} componentName - Component name
   * @param {object} metadata - Component metadata
   * @returns {string} Interface code
   */
  generateEnhancedPropsInterface(componentName, metadata) {
    const props = [];
    
    // Add children prop for context providers
    if (this.isInheritedWidget) {
      props.push({
        name: 'children',
        type: 'React.ReactNode',
        optional: true,
        description: 'Child components to render within the provider'
      });
    }
    
    // Add props from metadata if available
    if (metadata.props) {
      for (const [name, propInfo] of Object.entries(metadata.props)) {
        props.push({
          name,
          type: this.mapDartTypeToTS(propInfo.type || 'any'),
          optional: propInfo.optional !== false,
          description: propInfo.description || `${name} prop`
        });
      }
    }
    
    // If no specific props, add a placeholder comment
    if (props.length === 0) {
      props.push({
        name: '// Add component props here',
        type: '',
        optional: false,
        description: null
      });
    }
    
    return this.formatter.formatPropsInterface(componentName, props);
  }

  /**
   * Generate functional component without state
   * @param {string} name - Component name
   * @param {array} nodes - IR nodes
   * @param {boolean} shouldMemoize - Whether to wrap with React.memo
   * @returns {string} Component code
   */
  generateFunctionalComponent(name, nodes, shouldMemoize = false) {
    let code = '';
    
    // Add JSDoc comment
    code += this.formatter.generateJSDoc(
      name,
      `${name} component - stateless functional component`,
      [{ name: 'props', type: `${name}Props`, description: 'Component props' }],
      { type: 'JSX.Element', description: 'Rendered component' }
    );
    
    // Component declaration
    const componentDecl = `const ${name}Internal: React.FC<${name}Props> = (props) => {\n`;
    code += componentDecl;
    
    // Component body
    if (this.navigationInfo && this.navigationInfo.routes.length > 0) {
      code += this.generateNavigationComponent(2);
    } else {
      code += '  return (\n';
      code += `    ${this.generateJSXTree(nodes[0], 2)}\n`;
      code += '  );\n';
    }
    
    code += '};\n';
    
    // Wrap with React.memo if needed
    if (shouldMemoize) {
      code += '\n';
      code += this.formatter.generateInlineComment(
        'Memoized to prevent unnecessary re-renders when props haven\'t changed',
        0
      );
      code += `const ${name} = memo(${name}Internal);\n`;
      code += `${name}.displayName = '${name}';\n`;
    } else {
      code += `\nconst ${name} = ${name}Internal;\n`;
    }
    
    return code;
  }

  /**
   * Generate functional component with state
   * @param {string} name - Component name
   * @param {array} nodes - IR nodes
   * @param {boolean} shouldMemoize - Whether to wrap with React.memo
   * @returns {string} Component code
   */
  generateFunctionalComponentWithState(name, nodes, shouldMemoize = false) {
    let code = '';
    
    // Add JSDoc comment
    code += this.formatter.generateJSDoc(
      name,
      `${name} component - stateful functional component with hooks`,
      [{ name: 'props', type: `${name}Props`, description: 'Component props' }],
      { type: 'JSX.Element', description: 'Rendered component' }
    );
    
    // Component declaration
    code += `const ${name}Internal: React.FC<${name}Props> = (props) => {\n`;
    
    // Add navigation hook if needed
    if (this.navigationInfo && this.navigationInfo.navigateCalls.length > 0) {
      code += this.formatter.generateInlineComment(
        'Navigation hook for programmatic navigation',
        1
      );
      code += '  const navigate = useNavigate();\n\n';
    }
    
    // Add state hooks with comments
    if (this.stateVariables.length > 0) {
      code += this.formatter.generateInlineComment(
        'State management - converted from Flutter StatefulWidget',
        1
      );
      
      for (const stateVar of this.stateVariables) {
        const tsType = this.mapDartTypeToTS(stateVar.dartType || stateVar.type);
        const initialValue = this.formatTSValue(stateVar.initialValue, stateVar.type);
        const setterName = this.generateSetterName(stateVar.name);
        
        code += `  const [${stateVar.name}, ${setterName}] = useState<${tsType}>(${initialValue});\n`;
      }
      
      code += '\n';
    }
    
    // Add useEffect hooks
    if (this.lifecycleMethods.length > 0) {
      code += this.generateEnhancedUseEffectHooks();
    }
    
    // Add event handlers with useCallback
    if (this.eventHandlers.length > 0) {
      code += this.generateEnhancedEventHandlers();
    }
    
    // Return JSX
    code += '  return (\n';
    code += `    ${this.generateJSXTree(nodes[0], 2)}\n`;
    code += '  );\n';
    code += '};\n';
    
    // Wrap with React.memo if needed
    if (shouldMemoize) {
      code += '\n';
      code += this.formatter.generateInlineComment(
        'Memoized to prevent unnecessary re-renders',
        0
      );
      code += `const ${name} = memo(${name}Internal);\n`;
      code += `${name}.displayName = '${name}';\n`;
    } else {
      code += `\nconst ${name} = ${name}Internal;\n`;
    }
    
    return code;
  }

  /**
   * Generate enhanced useEffect hooks with clear comments
   * @returns {string} useEffect hooks code
   */
  generateEnhancedUseEffectHooks() {
    let code = '';
    
    // Mount effects (initState)
    const mountEffects = this.lifecycleMethods.filter(m => m.type === 'mount');
    if (mountEffects.length > 0) {
      code += this.formatter.generateInlineComment(
        'Effect: Component mount - runs once when component is first rendered',
        1
      );
      code += this.formatter.generateInlineComment(
        'Converted from Flutter initState lifecycle method',
        1
      );
      code += '  useEffect(() => {\n';
      
      for (const effect of mountEffects) {
        const convertedBody = this.convertFlutterToReactCode(effect.body);
        if (convertedBody) {
          code += this.indentCode(convertedBody, 2) + '\n';
        } else {
          code += '    // TODO: Implement mount effect logic\n';
        }
      }
      
      code += '  }, []); // Empty dependency array = runs once on mount\n\n';
    }
    
    // Cleanup effects (dispose)
    const cleanupEffects = this.lifecycleMethods.filter(m => m.type === 'cleanup');
    if (cleanupEffects.length > 0) {
      code += this.formatter.generateInlineComment(
        'Effect: Component cleanup - runs when component unmounts',
        1
      );
      code += this.formatter.generateInlineComment(
        'Converted from Flutter dispose lifecycle method',
        1
      );
      code += '  useEffect(() => {\n';
      code += '    return () => {\n';
      
      for (const effect of cleanupEffects) {
        const convertedBody = this.convertFlutterToReactCode(effect.body);
        if (convertedBody) {
          code += this.indentCode(convertedBody, 3) + '\n';
        } else {
          code += '      // TODO: Implement cleanup logic\n';
        }
      }
      
      code += '    };\n';
      code += '  }, []); // Cleanup function runs on unmount\n\n';
    }
    
    // Update effects (didUpdateWidget)
    const updateEffects = this.lifecycleMethods.filter(m => m.type === 'update');
    if (updateEffects.length > 0) {
      let dependencies = [];
      
      for (const effect of updateEffects) {
        if (effect.dependencies && effect.dependencies.length > 0) {
          dependencies = [...new Set([...dependencies, ...effect.dependencies])];
        }
      }
      
      if (dependencies.length === 0) {
        dependencies = this.stateVariables.map(v => v.name);
      }
      
      const depsString = dependencies.join(', ');
      
      code += this.formatter.generateInlineComment(
        'Effect: Component update - runs when dependencies change',
        1
      );
      code += this.formatter.generateInlineComment(
        'Converted from Flutter didUpdateWidget lifecycle method',
        1
      );
      code += '  useEffect(() => {\n';
      
      for (const effect of updateEffects) {
        const convertedBody = this.convertFlutterToReactCode(effect.body);
        if (convertedBody) {
          code += this.indentCode(convertedBody, 2) + '\n';
        } else {
          code += '    // TODO: Implement update effect logic\n';
        }
      }
      
      code += `  }, [${depsString}]); // Runs when these values change\n\n`;
    }
    
    return code;
  }

  /**
   * Generate enhanced event handlers with useCallback
   * @returns {string} Event handlers code
   */
  generateEnhancedEventHandlers() {
    let code = '';
    
    code += this.formatter.generateInlineComment(
      'Event handlers - memoized with useCallback to prevent re-creation',
      1
    );
    
    for (const handler of this.eventHandlers) {
      // Determine dependencies for useCallback
      const dependencies = this.extractHandlerDependencies(handler);
      const depsString = dependencies.length > 0 ? dependencies.join(', ') : '';
      
      code += `  const ${handler.name} = useCallback(() => {\n`;
      
      if (handler.hasSetState) {
        const convertedBody = this.convertSetStateCalls(handler.body);
        code += this.indentCode(convertedBody, 2) + '\n';
      } else {
        code += `    // TODO: Implement ${handler.name} logic\n`;
      }
      
      code += `  }, [${depsString}]);\n\n`;
    }
    
    return code;
  }

  /**
   * Extract dependencies for event handler
   * @param {object} handler - Event handler
   * @returns {string[]} Dependencies
   */
  extractHandlerDependencies(handler) {
    const dependencies = [];
    
    // Extract state variable references from handler body
    for (const stateVar of this.stateVariables) {
      if (handler.body && handler.body.includes(stateVar.name)) {
        dependencies.push(stateVar.name);
      }
    }
    
    return dependencies;
  }

  /**
   * Determine if component should be memoized
   * @param {object} ir - IR object
   * @returns {boolean} Should memoize
   */
  shouldMemoizeComponent(ir) {
    // Memoize if:
    // 1. Component has no state (pure component)
    // 2. Component is likely to receive same props frequently
    // 3. Component has expensive render logic
    
    const hasState = this.stateVariables.length > 0;
    const hasComplexRender = ir && ir.nodes && ir.nodes.length > 10;
    
    // Don't memoize stateful components by default
    if (hasState) {
      return false;
    }
    
    // Memoize complex stateless components
    if (hasComplexRender) {
      this.optimizationHints.push('Component memoized due to complex render logic');
      return true;
    }
    
    return false;
  }

  /**
   * Generate exports section
   * @param {string} componentName - Component name
   * @returns {string} Export statements
   */
  generateExports(componentName) {
    let code = `export default ${componentName};\n`;
    
    if (this.isInheritedWidget) {
      const contextName = componentName.replace('InheritedWidget', 'Context');
      code += `export { ${contextName}, use${contextName} };\n`;
    }
    
    return code;
  }

  /**
   * Generate optimization hints as comments
   * @returns {string} Optimization hints
   */
  generateOptimizationHints() {
    const lines = [
      'Optimization Hints:',
      '',
      ...this.optimizationHints.map(hint => `- ${hint}`)
    ];
    
    return this.formatter.generateCommentBlock(lines, 0);
  }

  // Helper methods from original implementation
  // (Include necessary methods from ir-to-react.js)
  
  collectStateVariables(nodes) {
    for (const node of nodes) {
      if (node.state && node.state.variables) {
        for (const stateVar of node.state.variables) {
          if (!this.stateVariables.find(v => v.name === stateVar.name)) {
            this.stateVariables.push(stateVar);
          }
        }
      }

      if (node.events) {
        for (const event of node.events) {
          if (!this.eventHandlers.find(e => e.handler === event.handler)) {
            this.eventHandlers.push(event);
          }
        }
      }

      if (node.children && node.children.length > 0) {
        this.collectStateVariables(node.children);
      }
    }
  }

  generateSetterName(name) {
    return `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  }

  convertFlutterToReactCode(flutterCode) {
    let reactCode = flutterCode;
    
    reactCode = reactCode.replace(/super\.(initState|dispose)\(\);?\s*/g, '');
    reactCode = reactCode.replace(/super\.didUpdateWidget\([^)]+\);?\s*/g, '');
    reactCode = this.convertSetStateCalls(reactCode);
    reactCode = reactCode.replace(/print\(/g, 'console.log(');
    reactCode = reactCode.replace(/\$(\w+)/g, '${$1}');
    
    return reactCode.trim();
  }

  convertSetStateCalls(body) {
    let converted = body;
    
    const setStateRegex = /setState\s*\(\s*\(\s*\)\s*\{([^}]+)\}\s*\)/g;
    converted = converted.replace(setStateRegex, (match, stateBody) => {
      const assignments = stateBody.trim().split(';').filter(s => s.trim());
      const setterCalls = [];
      
      for (const assignment of assignments) {
        const assignMatch = assignment.match(/(\w+)\s*=\s*(.+)/);
        if (assignMatch) {
          const varName = assignMatch[1].trim();
          const value = assignMatch[2].trim();
          
          const stateVar = this.stateVariables.find(v => v.name === varName);
          if (stateVar) {
            const setterName = this.generateSetterName(varName);
            setterCalls.push(`${setterName}(${value})`);
          } else {
            setterCalls.push(`${varName} = ${value}`);
          }
        }
      }
      
      return setterCalls.join(';\n    ');
    });
    
    return converted;
  }

  indentCode(code, levels) {
    const indent = '  '.repeat(levels);
    return code.split('\n').map(line => indent + line).join('\n');
  }

  mapDartTypeToTS(dartType) {
    const typeMap = {
      'String': 'string',
      'int': 'number',
      'double': 'number',
      'num': 'number',
      'bool': 'boolean',
      'List': 'any[]',
      'Map': 'Record<string, any>',
      'dynamic': 'any',
      'Object': 'any'
    };

    const genericMatch = dartType.match(/^(\w+)<(.+)>$/);
    if (genericMatch) {
      const baseType = genericMatch[1];
      const innerType = genericMatch[2];
      
      if (baseType === 'List') {
        const tsInnerType = this.mapDartTypeToTS(innerType);
        return `${tsInnerType}[]`;
      }
      if (baseType === 'Map') {
        return 'Record<string, any>';
      }
    }

    return typeMap[dartType] || 'any';
  }

  formatTSValue(value, type) {
    if (value === null) return 'null';
    if (type === 'string') return `'${value}'`;
    if (type === 'number') return String(value);
    if (type === 'boolean') return String(value);
    if (type === 'array') return '[]';
    if (type === 'object') return '{}';
    return 'null';
  }

  generateJSXTree(node, indent = 0) {
    // Simplified - use original implementation
    return '<div>TODO: Implement JSX generation</div>';
  }

  generateNavigationComponent(indent) {
    // Simplified - use original implementation
    return '    <div>TODO: Implement navigation</div>';
  }

  generateReactContext(componentName) {
    // Use original implementation
    return '';
  }

  generateContextProvider(componentName, nodes) {
    // Use original implementation
    return '';
  }
}

module.exports = IRToReactEnhanced;
