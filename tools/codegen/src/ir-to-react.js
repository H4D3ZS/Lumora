const fs = require('fs');
const path = require('path');

/**
 * IRToReact - Converts Lumora IR to React/TypeScript code
 */
class IRToReact {
  constructor() {
    this.widgetMappings = {};
    this.imports = new Set();
    this.stateVariables = [];
    this.eventHandlers = [];
    this.indentLevel = 0;
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
   * Convert Lumora IR to React TypeScript code
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
    this.indentLevel = 0;
    this.isInheritedWidget = false;
    this.contextData = null;
    this.stateManagementPattern = null;

    // Extract component metadata
    const componentName = ir.metadata.componentName || 'GeneratedComponent';
    this.currentComponentName = componentName;
    const documentation = ir.metadata.documentation;

    // Check if this is an InheritedWidget
    if (ir.metadata.isInherited) {
      this.isInheritedWidget = true;
    }

    // Extract state management pattern
    if (ir.metadata.stateManagement) {
      this.stateManagementPattern = ir.metadata.stateManagement;
    }

    // Extract navigation information
    if (ir.metadata.navigation && ir.metadata.navigation.hasNavigation) {
      this.navigationInfo = ir.metadata.navigation;
      // Add React Router imports
      this.imports.add("{ BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom'");
    }

    // Extract Flutter-specific metadata if present
    if (ir.metadata.flutter) {
      this.stateVariables = ir.metadata.flutter.stateVariables || [];
      this.lifecycleMethods = ir.metadata.flutter.lifecycleMethods || [];
      this.eventHandlers = ir.metadata.flutter.eventHandlers || [];
    }

    // Collect additional state variables and events from nodes
    this.collectStateVariables(ir.nodes);

    // Determine if we need state
    const hasState = this.stateVariables.length > 0 || 
                     this.eventHandlers.length > 0 || 
                     this.lifecycleMethods.length > 0;

    // Generate the component code
    let code = '';

    // Add file header comment
    if (documentation) {
      code += this.formatJSDocComment(documentation);
    }

    // Add state management pattern comment
    if (this.stateManagementPattern && this.stateManagementPattern.pattern !== 'setState') {
      code += `/**\n`;
      code += ` * Converted from Flutter ${this.stateManagementPattern.pattern} pattern\n`;
      code += ` * Target React pattern: ${this.stateManagementPattern.targetPattern}\n`;
      code += ` * Confidence: ${(this.stateManagementPattern.confidence * 100).toFixed(0)}%\n`;
      code += ` */\n`;
    }

    // Add imports
    code += this.generateImports();
    code += '\n\n';

    // If InheritedWidget, generate Context
    if (this.isInheritedWidget) {
      code += this.generateReactContext(componentName);
      code += '\n';
    }

    // Generate TypeScript interfaces for props
    code += this.generatePropsInterface(componentName);
    code += '\n';

    // Generate component based on state management pattern
    if (this.stateManagementPattern && this.stateManagementPattern.targetPattern !== 'useState') {
      code += this.generateComplexStateManagementComponent(componentName, ir.nodes);
    } else if (this.isInheritedWidget) {
      code += this.generateContextProvider(componentName, ir.nodes);
    } else if (hasState) {
      code += this.generateFunctionalComponentWithState(componentName, ir.nodes);
    } else {
      code += this.generateFunctionalComponent(componentName, ir.nodes);
    }

    code += '\n\n';

    // Add export
    code += `export default ${componentName};\n`;

    // If InheritedWidget, also export the context and hook
    if (this.isInheritedWidget) {
      const contextName = componentName.replace('InheritedWidget', 'Context');
      code += `export { ${contextName}, use${contextName} };\n`;
    }

    // Format the code (basic formatting)
    return this.formatTypeScriptCode(code);
  }

  /**
   * Generate component with complex state management pattern
   * @param {string} name - Component name
   * @param {array} nodes - IR nodes
   * @returns {string} Component code
   */
  generateComplexStateManagementComponent(name, nodes) {
    const pattern = this.stateManagementPattern.targetPattern;
    
    let code = `// TODO: Implement ${pattern} pattern\n`;
    code += `// This component uses ${pattern} for state management\n`;
    code += `// Please refer to ${pattern} documentation for proper implementation\n\n`;
    
    // For now, fall back to functional component with useState
    code += `// Temporary useState implementation\n`;
    code += `// Replace with proper ${pattern} implementation\n`;
    code += this.generateFunctionalComponentWithState(name, nodes);
    
    return code;
  }

  /**
   * Collect all state variables from IR nodes
   * @param {array} nodes - Array of IR nodes
   */
  collectStateVariables(nodes) {
    for (const node of nodes) {
      if (node.state && node.state.variables) {
        for (const stateVar of node.state.variables) {
          // Avoid duplicates
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

      // Recursively collect from children
      if (node.children && node.children.length > 0) {
        this.collectStateVariables(node.children);
      }
    }
  }

  /**
   * Format JSDoc comment
   * @param {string} doc - Documentation string
   * @returns {string} Formatted JSDoc comment
   */
  formatJSDocComment(doc) {
    const lines = doc.split('\n').map(line => line.trim());
    let comment = '/**\n';
    for (const line of lines) {
      comment += ` * ${line}\n`;
    }
    comment += ' */\n';
    return comment;
  }

  /**
   * Generate imports section
   * @returns {string} Import statements
   */
  generateImports() {
    const importStatements = [];
    
    // React import
    const reactImports = ['React'];
    
    if (this.stateVariables.length > 0 || this.lifecycleMethods.length > 0) {
      reactImports.push('useState', 'useEffect');
    }
    
    if (this.isInheritedWidget) {
      reactImports.push('createContext', 'useContext');
    }
    
    if (reactImports.length > 1) {
      const hooks = reactImports.slice(1).join(', ');
      importStatements.push(`import React, { ${hooks} } from 'react';`);
    } else {
      importStatements.push("import React from 'react';");
    }

    // Add other imports from the imports set
    for (const imp of this.imports) {
      if (imp !== 'React') {
        importStatements.push(`import ${imp};`);
      }
    }

    return importStatements.join('\n');
  }

  /**
   * Generate React Context from InheritedWidget
   * @param {string} componentName - Component name
   * @returns {string} Context code
   */
  generateReactContext(componentName) {
    const contextName = componentName.replace('InheritedWidget', 'Context');
    
    let code = `// Context created from Flutter InheritedWidget\n`;
    code += `interface ${contextName}Value {\n`;
    code += `  data: Record<string, any>;\n`;
    
    // Add state variables to context interface
    for (const stateVar of this.stateVariables) {
      const tsType = this.mapDartTypeToTS(stateVar.dartType || stateVar.type);
      code += `  ${stateVar.name}?: ${tsType};\n`;
    }
    
    code += `}\n\n`;
    code += `const ${contextName} = createContext<${contextName}Value | undefined>(undefined);\n\n`;
    
    // Generate custom hook for using the context
    code += `const use${contextName} = () => {\n`;
    code += `  const context = useContext(${contextName});\n`;
    code += `  if (context === undefined) {\n`;
    code += `    throw new Error('use${contextName} must be used within a ${componentName}');\n`;
    code += `  }\n`;
    code += `  return context;\n`;
    code += `};\n\n`;
    
    return code;
  }

  /**
   * Generate Context Provider component from InheritedWidget
   * @param {string} name - Component name
   * @param {array} nodes - IR nodes
   * @returns {string} Component code
   */
  generateContextProvider(name, nodes) {
    const contextName = name.replace('InheritedWidget', 'Context');
    
    let code = `const ${name}: React.FC<${name}Props> = ({ children }) => {\n`;

    // Add state hooks for context data
    for (const stateVar of this.stateVariables) {
      const tsType = this.mapDartTypeToTS(stateVar.dartType || stateVar.type);
      const initialValue = this.formatTSValue(stateVar.initialValue, stateVar.type);
      const setterName = this.generateSetterName(stateVar.name);
      code += `  const [${stateVar.name}, ${setterName}] = useState<${tsType}>(${initialValue});\n`;
    }

    if (this.stateVariables.length > 0) {
      code += '\n';
    }

    // Create context value object
    code += `  const contextValue = {\n`;
    code += `    data: {},\n`;
    
    for (const stateVar of this.stateVariables) {
      code += `    ${stateVar.name},\n`;
    }
    
    code += `  };\n\n`;

    code += `  return (\n`;
    code += `    <${contextName}.Provider value={contextValue}>\n`;
    code += `      {children}\n`;
    code += `    </${contextName}.Provider>\n`;
    code += `  );\n`;
    code += `};\n`;

    return code;
  }

  /**
   * Generate TypeScript interface for props
   * @param {string} componentName - Component name
   * @returns {string} Interface code
   */
  generatePropsInterface(componentName) {
    let code = `interface ${componentName}Props {\n`;
    
    // Add children prop for context providers
    if (this.isInheritedWidget) {
      code += `  children?: React.ReactNode;\n`;
    }
    
    code += `  // Add additional props here\n`;
    code += `}\n`;
    return code;
  }

  /**
   * Generate functional component without state
   * @param {string} name - Component name
   * @param {array} nodes - IR nodes
   * @returns {string} Component code
   */
  generateFunctionalComponent(name, nodes) {
    let code = `const ${name}: React.FC<${name}Props> = (props) => {\n`;
    
    // If this component has navigation, wrap in BrowserRouter with Routes
    if (this.navigationInfo && this.navigationInfo.routes.length > 0) {
      // Add deep linking comment if enabled
      if (this.navigationInfo.deepLinking && this.navigationInfo.deepLinking.enabled) {
        code += `  // Deep linking enabled - URL patterns:\n`;
        for (const pattern of this.navigationInfo.deepLinking.urlPatterns) {
          code += `  //   ${pattern.urlPattern} -> ${pattern.component}\n`;
        }
        code += `\n`;
      }
      
      code += `  return (\n`;
      code += `    <BrowserRouter>\n`;
      code += `      <Routes>\n`;
      
      for (const route of this.navigationInfo.routes) {
        const routePath = route.path || '/';
        const componentName = route.component || 'div';
        
        // Check if route has nested routes
        if (route.children && route.children.length > 0) {
          code += `        <Route path="${routePath}/*" element={<${componentName} />}>\n`;
          code += `          {/* Nested routes - use <Outlet /> in ${componentName} */}\n`;
          
          for (const child of route.children) {
            if (child.type === 'nested-route') {
              code += `          {/* TODO: Add nested Route elements */}\n`;
            }
          }
          
          code += `        </Route>\n`;
        } else {
          code += `        <Route path="${routePath}" element={<${componentName} />} />\n`;
        }
        
        // Add comment for route parameters
        if (route.params.length > 0) {
          code += `        {/* Route parameters: ${route.params.join(', ')} - use useParams() hook */}\n`;
        }
      }
      
      code += `      </Routes>\n`;
      code += `    </BrowserRouter>\n`;
      code += `  );\n`;
    } else {
      code += `  return (\n`;
      code += `    ${this.generateJSXTree(nodes[0], 2)}\n`;
      code += `  );\n`;
    }
    
    code += `};\n`;
    return code;
  }

  /**
   * Generate functional component with state
   * @param {string} name - Component name
   * @param {array} nodes - IR nodes
   * @returns {string} Component code
   */
  generateFunctionalComponentWithState(name, nodes) {
    let code = `const ${name}: React.FC<${name}Props> = (props) => {\n`;

    // Add useNavigate hook if navigation is used
    if (this.navigationInfo && this.navigationInfo.navigateCalls.length > 0) {
      code += `  const navigate = useNavigate();\n\n`;
    }

    // Add state hooks - ensure we have proper type inference
    for (const stateVar of this.stateVariables) {
      const tsType = this.mapDartTypeToTS(stateVar.dartType || stateVar.type);
      const initialValue = this.formatTSValue(stateVar.initialValue, stateVar.type);
      const setterName = this.generateSetterName(stateVar.name);
      
      // Add comment if this came from Flutter StatefulWidget
      if (stateVar.fromFlutter) {
        code += `  // Converted from Flutter StatefulWidget state variable\n`;
      }
      
      code += `  const [${stateVar.name}, ${setterName}] = useState<${tsType}>(${initialValue});\n`;
    }

    if (this.stateVariables.length > 0) {
      code += '\n';
    }

    // Add useEffect hooks from lifecycle methods
    if (this.lifecycleMethods.length > 0) {
      code += this.generateUseEffectHooks();
    }

    // Add event handler functions
    for (const handler of this.eventHandlers) {
      code += this.generateEventHandlerFunction(handler);
    }

    code += `  return (\n`;
    code += `    ${this.generateJSXTree(nodes[0], 2)}\n`;
    code += `  );\n`;
    code += `};\n`;

    return code;
  }

  /**
   * Generate setter name from state variable name
   * @param {string} name - State variable name
   * @returns {string} Setter name
   */
  generateSetterName(name) {
    return `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  }

  /**
   * Generate useEffect hooks from lifecycle methods
   * @returns {string} useEffect hooks code
   */
  generateUseEffectHooks() {
    let code = '';

    // Find mount effects (initState)
    const mountEffects = this.lifecycleMethods.filter(m => m.type === 'mount');
    if (mountEffects.length > 0) {
      code += `  // Converted from Flutter initState\n`;
      code += `  useEffect(() => {\n`;
      for (const effect of mountEffects) {
        // Convert initState body to React code
        const convertedBody = this.convertFlutterToReactCode(effect.body);
        if (convertedBody) {
          code += `${this.indentCode(convertedBody, 2)}\n`;
        } else {
          code += `    // TODO: Implement mount effect from initState\n`;
        }
      }
      code += `  }, []); // Empty deps array = runs once on mount\n\n`;
    }

    // Find cleanup effects (dispose)
    const cleanupEffects = this.lifecycleMethods.filter(m => m.type === 'cleanup');
    if (cleanupEffects.length > 0) {
      code += `  // Converted from Flutter dispose\n`;
      code += `  useEffect(() => {\n`;
      code += `    return () => {\n`;
      for (const effect of cleanupEffects) {
        // Convert dispose body to React cleanup code
        const convertedBody = this.convertFlutterToReactCode(effect.body);
        if (convertedBody) {
          code += `${this.indentCode(convertedBody, 3)}\n`;
        } else {
          code += `      // TODO: Implement cleanup from dispose\n`;
        }
      }
      code += `    };\n`;
      code += `  }, []); // Cleanup function runs on unmount\n\n`;
    }

    // Find update effects (didUpdateWidget)
    const updateEffects = this.lifecycleMethods.filter(m => m.type === 'update');
    if (updateEffects.length > 0) {
      // Extract dependencies from state variables or effect metadata
      let dependencies = [];
      
      for (const effect of updateEffects) {
        if (effect.dependencies && effect.dependencies.length > 0) {
          dependencies = [...new Set([...dependencies, ...effect.dependencies])];
        }
      }
      
      // If no specific dependencies, use all state variables
      if (dependencies.length === 0) {
        dependencies = this.stateVariables.map(v => v.name);
      }
      
      const depsString = dependencies.join(', ');
      
      code += `  // Converted from Flutter didUpdateWidget\n`;
      code += `  useEffect(() => {\n`;
      for (const effect of updateEffects) {
        // Convert didUpdateWidget body to React code
        const convertedBody = this.convertFlutterToReactCode(effect.body);
        if (convertedBody) {
          code += `${this.indentCode(convertedBody, 2)}\n`;
        } else {
          code += `    // TODO: Implement update effect from didUpdateWidget\n`;
        }
      }
      code += `  }, [${depsString}]); // Runs when dependencies change\n\n`;
    }

    return code;
  }

  /**
   * Convert Flutter code to React code
   * @param {string} flutterCode - Flutter/Dart code
   * @returns {string} React/TypeScript code
   */
  convertFlutterToReactCode(flutterCode) {
    let reactCode = flutterCode;
    
    // Remove super.initState() and super.dispose() calls
    reactCode = reactCode.replace(/super\.(initState|dispose)\(\);?\s*/g, '');
    reactCode = reactCode.replace(/super\.didUpdateWidget\([^)]+\);?\s*/g, '');
    
    // Convert setState calls
    reactCode = this.convertSetStateCalls(reactCode);
    
    // Convert print to console.log
    reactCode = reactCode.replace(/print\(/g, 'console.log(');
    
    // Convert string interpolation
    reactCode = reactCode.replace(/\$(\w+)/g, '${$1}');
    
    return reactCode.trim();
  }

  /**
   * Generate event handler function
   * @param {object} handler - Event handler definition
   * @returns {string} Function code
   */
  generateEventHandlerFunction(handler) {
    let code = `  const ${handler.name} = () => {\n`;
    
    if (handler.hasSetState) {
      // Convert setState calls to React state setters
      const convertedBody = this.convertSetStateCalls(handler.body);
      code += `${this.indentCode(convertedBody, 2)}\n`;
    } else {
      code += `    // TODO: Implement ${handler.name}\n`;
    }
    
    code += `  };\n\n`;
    return code;
  }

  /**
   * Convert Flutter setState calls to React state setters
   * @param {string} body - Method body with setState calls
   * @returns {string} Converted body with React state setters
   */
  convertSetStateCalls(body) {
    // Replace setState(() { variable = value; }) with setVariable(value)
    let converted = body;
    
    // Pattern: setState(() { variable = value; })
    const setStateRegex = /setState\s*\(\s*\(\s*\)\s*\{([^}]+)\}\s*\)/g;
    
    converted = converted.replace(setStateRegex, (match, stateBody) => {
      // Extract variable assignments
      const assignments = stateBody.trim().split(';').filter(s => s.trim());
      const setterCalls = [];
      
      for (const assignment of assignments) {
        const assignMatch = assignment.match(/(\w+)\s*=\s*(.+)/);
        if (assignMatch) {
          const varName = assignMatch[1].trim();
          const value = assignMatch[2].trim();
          
          // Find the state variable to get the correct setter name
          const stateVar = this.stateVariables.find(v => v.name === varName);
          if (stateVar) {
            const setterName = this.generateSetterName(varName);
            setterCalls.push(`${setterName}(${value})`);
          } else {
            // If not a state variable, keep as regular assignment
            setterCalls.push(`${varName} = ${value}`);
          }
        }
      }
      
      return setterCalls.join(';\n    ');
    });
    
    // Also handle inline setState calls: setState(() => variable = value)
    const inlineSetStateRegex = /setState\s*\(\s*\(\s*\)\s*=>\s*(\w+)\s*=\s*([^;)]+)\s*\)/g;
    converted = converted.replace(inlineSetStateRegex, (match, varName, value) => {
      const stateVar = this.stateVariables.find(v => v.name === varName);
      if (stateVar) {
        const setterName = this.generateSetterName(varName);
        return `${setterName}(${value.trim()})`;
      }
      return match;
    });
    
    return converted;
  }

  /**
   * Indent code by specified levels
   * @param {string} code - Code to indent
   * @param {number} levels - Number of indentation levels
   * @returns {string} Indented code
   */
  indentCode(code, levels) {
    const indent = '  '.repeat(levels);
    return code.split('\n').map(line => indent + line).join('\n');
  }

  /**
   * Generate JSX tree from IR node
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} JSX code
   */
  generateJSXTree(node, indent = 0) {
    const indentStr = '  '.repeat(indent);
    
    // Get React component mapping
    const mapping = this.widgetMappings[node.type];
    
    if (!mapping) {
      // Fallback for unmapped widgets
      console.warn(`Warning: No mapping found for widget type: ${node.type}`);
      return `${indentStr}<div>{/* TODO: Map ${node.type} */}</div>`;
    }

    const reactComponent = mapping.react;

    // Handle different component types
    if (reactComponent === 'View' || reactComponent === 'div') {
      return this.generateView(node, indent);
    } else if (reactComponent === 'Text' || reactComponent === 'span') {
      return this.generateText(node, indent);
    } else if (reactComponent === 'TouchableOpacity' || reactComponent === 'button') {
      return this.generateButton(node, indent);
    } else if (reactComponent === 'FlatList' || reactComponent === 'ul') {
      return this.generateList(node, indent);
    } else if (reactComponent === 'TextInput' || reactComponent === 'input') {
      return this.generateInput(node, indent);
    } else if (reactComponent === 'Image' || reactComponent === 'img') {
      return this.generateImage(node, indent);
    } else {
      // Generic component generation
      return this.generateGenericComponent(node, indent);
    }
  }

  /**
   * Generate View/div component
   * Converts Flutter Container/Row/Column to React div with flexbox
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} JSX code
   */
  generateView(node, indent) {
    const indentStr = '  '.repeat(indent);
    
    // Check if this is a Row or Column that should be converted to flexbox
    if (node.type === 'Row' || node.type === 'Column') {
      return this.generateFlexboxLayout(node, indent);
    }
    
    const style = this.generateStyleObject(node.props);
    
    let jsx = `${indentStr}<div`;
    
    if (style) {
      jsx += ` style={${style}}`;
    }
    
    // Check for click/tap events and convert to onClick
    if (node.events) {
      const clickEvent = node.events.find(e => 
        e.name === 'onTap' || 
        e.name === 'onPressed' || 
        e.name === 'onClick' ||
        e.name === 'onPress'
      );
      if (clickEvent) {
        const handler = this.convertFlutterEventToReact(clickEvent);
        jsx += ` onClick={${handler}}`;
      }
    }
    
    jsx += `>`;

    if (node.children.length > 0) {
      jsx += '\n';
      for (const child of node.children) {
        jsx += `${this.generateJSXTree(child, indent + 1)}\n`;
      }
      jsx += `${indentStr}</div>`;
    } else {
      jsx += `</div>`;
    }

    return jsx;
  }

  /**
   * Generate flexbox layout from Flutter Row/Column
   * Converts Flutter Row/Column to React div with flexbox styling
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} JSX code
   */
  generateFlexboxLayout(node, indent) {
    const indentStr = '  '.repeat(indent);
    const isColumn = node.type === 'Column';
    
    // Build flexbox style
    const styleProps = [];
    styleProps.push(`display: 'flex'`);
    styleProps.push(`flexDirection: '${isColumn ? 'column' : 'row'}'`);
    
    // Convert mainAxisAlignment to justifyContent
    if (node.props.mainAxisAlignment) {
      const justifyContent = this.convertMainAxisAlignmentToCSS(node.props.mainAxisAlignment);
      styleProps.push(`justifyContent: '${justifyContent}'`);
    }
    
    // Convert crossAxisAlignment to alignItems
    if (node.props.crossAxisAlignment) {
      const alignItems = this.convertCrossAxisAlignmentToCSS(node.props.crossAxisAlignment);
      styleProps.push(`alignItems: '${alignItems}'`);
    }
    
    // Add any additional styles from props
    const additionalStyle = this.generateStyleObject(node.props);
    
    let jsx = `${indentStr}<div style={{ ${styleProps.join(', ')}`;
    
    if (additionalStyle) {
      // Merge additional styles
      const additionalProps = additionalStyle.slice(2, -2); // Remove {{ and }}
      if (additionalProps.trim()) {
        jsx += `, ${additionalProps}`;
      }
    }
    
    jsx += ` }}>`;

    if (node.children.length > 0) {
      jsx += '\n';
      for (const child of node.children) {
        // Check if child is wrapped in Expanded
        if (child.type === 'Expanded') {
          const flex = child.props.flex || 1;
          jsx += `${indentStr}  <div style={{ flex: ${flex} }}>\n`;
          if (child.children.length > 0) {
            jsx += `${this.generateJSXTree(child.children[0], indent + 2)}\n`;
          }
          jsx += `${indentStr}  </div>\n`;
        } else {
          jsx += `${this.generateJSXTree(child, indent + 1)}\n`;
        }
      }
      jsx += `${indentStr}</div>`;
    } else {
      jsx += `</div>`;
    }

    return jsx;
  }

  /**
   * Convert MainAxisAlignment to CSS justify-content
   * @param {string} mainAxisAlignment - Flutter MainAxisAlignment
   * @returns {string} CSS justify-content value
   */
  convertMainAxisAlignmentToCSS(mainAxisAlignment) {
    const alignmentMap = {
      'MainAxisAlignment.start': 'flex-start',
      'MainAxisAlignment.end': 'flex-end',
      'MainAxisAlignment.center': 'center',
      'MainAxisAlignment.spaceBetween': 'space-between',
      'MainAxisAlignment.spaceAround': 'space-around',
      'MainAxisAlignment.spaceEvenly': 'space-evenly'
    };
    return alignmentMap[mainAxisAlignment] || 'flex-start';
  }

  /**
   * Convert CrossAxisAlignment to CSS align-items
   * @param {string} crossAxisAlignment - Flutter CrossAxisAlignment
   * @returns {string} CSS align-items value
   */
  convertCrossAxisAlignmentToCSS(crossAxisAlignment) {
    const alignmentMap = {
      'CrossAxisAlignment.start': 'flex-start',
      'CrossAxisAlignment.end': 'flex-end',
      'CrossAxisAlignment.center': 'center',
      'CrossAxisAlignment.stretch': 'stretch',
      'CrossAxisAlignment.baseline': 'baseline'
    };
    return alignmentMap[crossAxisAlignment] || 'flex-start';
  }

  /**
   * Generate Text/span component
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} JSX code
   */
  generateText(node, indent) {
    const indentStr = '  '.repeat(indent);
    let text = node.props.text || '';
    
    // Replace template placeholders
    text = this.replaceTemplatePlaceholders(text);
    
    const style = this.generateTextStyle(node.props.style);
    
    let jsx = `${indentStr}<span`;
    
    if (style) {
      jsx += ` style={${style}}`;
    }
    
    jsx += `>${text}</span>`;
    
    return jsx;
  }

  /**
   * Generate Button component
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} JSX code
   */
  generateButton(node, indent) {
    const indentStr = '  '.repeat(indent);
    const title = node.props.title || node.props.text || 'Button';
    
    // Find event handler and convert Flutter event names to React
    let onClickHandler = '';
    if (node.events) {
      const clickEvent = node.events.find(e => 
        e.name === 'onPressed' || 
        e.name === 'onTap' || 
        e.name === 'onClick' ||
        e.name === 'onPress'
      );
      if (clickEvent) {
        const convertedHandler = this.convertFlutterEventToReact(clickEvent);
        onClickHandler = ` onClick={${convertedHandler}}`;
      }
    }
    
    let jsx = `${indentStr}<button${onClickHandler}>${title}</button>`;
    return jsx;
  }

  /**
   * Convert Flutter event handler to React event handler
   * Maps Flutter event names (onTap, onPressed) to React names (onClick, onPress)
   * Converts callback parameters, async handlers, and ensures state variables are accessible
   * @param {object} event - Event definition from IR
   * @returns {string} React event handler code
   */
  convertFlutterEventToReact(event) {
    let handler = event.handler;
    
    // Extract handler name if it's a simple identifier
    if (/^[a-zA-Z_]\w*$/.test(handler)) {
      return handler;
    }
    
    // Handle inline Dart functions with async
    if (handler.includes('async')) {
      // Match: () async { body }
      const asyncBlockMatch = handler.match(/\(\)\s*async\s*\{([^}]*)\}/s);
      if (asyncBlockMatch) {
        const body = asyncBlockMatch[1].trim();
        const convertedBody = this.convertFlutterCodeToReact(body);
        const bodyWithStateAccess = this.ensureStateAccessInReact(convertedBody);
        return `async () => {\n      ${bodyWithStateAccess}\n    }`;
      }
      
      // Match: () async => expression
      const asyncArrowMatch = handler.match(/\(\)\s*async\s*=>\s*(.+)/s);
      if (asyncArrowMatch) {
        const expression = asyncArrowMatch[1].trim();
        const convertedExpr = this.convertFlutterCodeToReact(expression);
        return `async () => ${this.ensureStateAccessInReact(convertedExpr)}`;
      }
    }
    
    // Handle inline Dart functions
    if (handler.includes('=>') || handler.includes('{')) {
      // Convert regular Dart arrow functions to React arrow functions
      // Dart: () { statements }
      // React: () => { statements }
      const blockMatch = handler.match(/\(\)\s*\{([^}]*)\}/s);
      if (blockMatch) {
        const body = blockMatch[1].trim();
        const convertedBody = this.convertFlutterCodeToReact(body);
        const bodyWithStateAccess = this.ensureStateAccessInReact(convertedBody);
        return `() => {\n      ${bodyWithStateAccess}\n    }`;
      }
      
      // Simple arrow function: () => expression
      const simpleArrowMatch = handler.match(/\(\)\s*=>\s*(.+)/s);
      if (simpleArrowMatch) {
        const expression = simpleArrowMatch[1].trim();
        const convertedExpr = this.convertFlutterCodeToReact(expression);
        return `() => ${this.ensureStateAccessInReact(convertedExpr)}`;
      }
    }
    
    // Handle Dart function expressions
    if (handler.includes('()')) {
      return '() => { /* TODO: Convert Dart function */ }';
    }
    
    // Default: return as-is
    return handler;
  }

  /**
   * Ensure state variables are accessible in React code
   * In React functional components, state variables are accessed directly
   * State setters are already converted by convertSetStateCalls
   * @param {string} code - React code
   * @returns {string} Code with proper state access
   */
  ensureStateAccessInReact(code) {
    let result = code;
    
    // In React functional components with hooks, state variables are accessed directly
    // No need for 'this.' prefix
    // State setters are already converted from setState to setVariable calls
    
    // Ensure state variable references are correct
    for (const stateVar of this.stateVariables) {
      // State variables should be accessed directly by name
      // They're already in scope in the functional component
      // No transformation needed
    }
    
    return result;
  }

  /**
   * Convert Flutter/Dart code snippets to React/TypeScript code
   * Handles setState, print, async/await, Future/Promise, navigation calls, etc.
   * @param {string} flutterCode - Flutter code snippet
   * @returns {string} React code
   */
  convertFlutterCodeToReact(flutterCode) {
    let reactCode = flutterCode;
    
    // Convert print to console.log
    reactCode = reactCode.replace(/print\(/g, 'console.log(');
    
    // Convert Flutter setState to React state setters
    reactCode = this.convertSetStateCalls(reactCode);
    
    // Convert Flutter Navigator calls to React Router
    reactCode = this.convertFlutterNavigationToReact(reactCode);
    
    // Convert Future to Promise
    reactCode = reactCode.replace(/Future\./g, 'Promise.');
    reactCode = reactCode.replace(/Future</g, 'Promise<');
    reactCode = reactCode.replace(/Future\(\(\)\s*=>/g, 'new Promise((resolve, reject) =>');
    reactCode = reactCode.replace(/Future\.value\(/g, 'Promise.resolve(');
    reactCode = reactCode.replace(/Future\.error\(/g, 'Promise.reject(');
    reactCode = reactCode.replace(/Future\.wait\(/g, 'Promise.all(');
    reactCode = reactCode.replace(/Future\.delayed\(/g, '/* TODO: Use setTimeout */ Future.delayed(');
    
    // Convert .then and .catchError callbacks
    reactCode = reactCode.replace(/\.then\(\s*\(value\)\s*=>/g, '.then((value) =>');
    reactCode = reactCode.replace(/\.catchError\(\s*\(error\)\s*=>/g, '.catch((error) =>');
    reactCode = reactCode.replace(/\.whenComplete\(/g, '.finally(');
    
    // Convert Dart string interpolation to template literals
    // $variable -> ${variable}
    reactCode = reactCode.replace(/\$(\w+)/g, '${$1}');
    // ${expression} is already correct for template literals
    
    // Convert http.get/post to fetch (add comment for manual review)
    if (reactCode.includes('http.get') || reactCode.includes('http.post')) {
      reactCode = reactCode.replace(/http\.get\(/g, '/* TODO: Use fetch */ http.get(');
      reactCode = reactCode.replace(/http\.post\(/g, '/* TODO: Use fetch */ http.post(');
    }
    
    // Convert async/await syntax (already compatible)
    // await is the same in both languages, no changes needed
    
    // Convert try-catch-finally (same syntax)
    // No changes needed as syntax is identical
    
    return reactCode;
  }

  /**
   * Convert Flutter Navigator calls to React Router navigation
   * Handles Navigator.pushNamed, Navigator.pushReplacementNamed, Navigator.pop
   * Preserves route parameters passed via arguments
   * @param {string} code - Code with Flutter Navigator calls
   * @returns {string} Code with React Router navigation
   */
  convertFlutterNavigationToReact(code) {
    let result = code;
    
    // Add useNavigate hook if navigation is used
    if (result.includes('Navigator.')) {
      // Note: The navigate hook should be declared at component level
      // For inline conversions, we'll use a comment
      result = '/* const navigate = useNavigate(); */ ' + result;
    }
    
    // Convert Navigator.pushNamed with arguments (parameters)
    // Navigator.pushNamed(context, '/path', arguments: data) -> navigate('/path', { state: data })
    result = result.replace(/Navigator\.pushNamed\([^,]+,\s*['"]([^'"]+)['"],\s*arguments:\s*([^)]+)\)/g, "navigate('$1', { state: $2 })");
    
    // Convert Navigator.pushNamed(context, '/path') to navigate('/path')
    result = result.replace(/Navigator\.pushNamed\([^,]+,\s*['"]([^'"]+)['"]\s*\)/g, "navigate('$1')");
    
    // Convert Navigator.pushReplacementNamed with arguments
    result = result.replace(/Navigator\.pushReplacementNamed\([^,]+,\s*['"]([^'"]+)['"],\s*arguments:\s*([^)]+)\)/g, "navigate('$1', { replace: true, state: $2 })");
    
    // Convert Navigator.pushReplacementNamed(context, '/path') to navigate('/path', { replace: true })
    result = result.replace(/Navigator\.pushReplacementNamed\([^,]+,\s*['"]([^'"]+)['"]\s*\)/g, "navigate('$1', { replace: true })");
    
    // Convert Navigator.pop(context) to navigate(-1)
    result = result.replace(/Navigator\.pop\([^)]*\)/g, 'navigate(-1)');
    
    // Add comment about accessing route parameters
    if (result.includes('ModalRoute.of(context)?.settings.arguments')) {
      result = result.replace(/ModalRoute\.of\(context\)\?\.settings\.arguments/g, 
        '/* Use useLocation().state to access route parameters */ location.state');
      // Add useLocation import hint
      result = '/* import { useLocation } from "react-router-dom"; */ ' + result;
    }
    
    return result;
  }

  /**
   * Generate List component
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} JSX code
   */
  generateList(node, indent) {
    const indentStr = '  '.repeat(indent);
    
    let jsx = `${indentStr}<ul>`;
    
    if (node.children.length > 0) {
      jsx += '\n';
      for (const child of node.children) {
        jsx += `${indentStr}  <li>\n`;
        jsx += `${this.generateJSXTree(child, indent + 2)}\n`;
        jsx += `${indentStr}  </li>\n`;
      }
      jsx += `${indentStr}</ul>`;
    } else {
      jsx += `</ul>`;
    }
    
    return jsx;
  }

  /**
   * Generate Input component
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} JSX code
   */
  generateInput(node, indent) {
    const indentStr = '  '.repeat(indent);
    const placeholder = node.props.placeholder || node.props.hintText || '';
    
    let jsx = `${indentStr}<input type="text" placeholder="${placeholder}" />`;
    return jsx;
  }

  /**
   * Generate Image component
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} JSX code
   */
  generateImage(node, indent) {
    const indentStr = '  '.repeat(indent);
    const src = node.props.src || '';
    const alt = node.props.alt || '';
    
    let jsx = `${indentStr}<img src="${src}" alt="${alt}"`;
    
    if (node.props.width) {
      jsx += ` width={${node.props.width}}`;
    }
    if (node.props.height) {
      jsx += ` height={${node.props.height}}`;
    }
    
    jsx += ` />`;
    return jsx;
  }

  /**
   * Generate generic component
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} JSX code
   */
  generateGenericComponent(node, indent) {
    const indentStr = '  '.repeat(indent);
    const mapping = this.widgetMappings[node.type];
    const reactComponent = mapping.react;
    
    let jsx = `${indentStr}<${reactComponent}>`;
    
    if (node.children.length > 0) {
      jsx += '\n';
      for (const child of node.children) {
        jsx += `${this.generateJSXTree(child, indent + 1)}\n`;
      }
      jsx += `${indentStr}</${reactComponent}>`;
    } else {
      jsx += `</${reactComponent}>`;
    }
    
    return jsx;
  }

  /**
   * Generate style object from props
   * Converts Flutter BoxDecoration to React style object
   * @param {object} props - Node props
   * @returns {string} Style object code
   */
  generateStyleObject(props) {
    const styleProps = [];
    const style = props.style || {};
    
    // Background color
    const bgColor = props.backgroundColor || style.backgroundColor;
    if (bgColor) {
      styleProps.push(`backgroundColor: '${this.convertColor(bgColor)}'`);
    }
    
    // Padding - convert EdgeInsets to CSS padding
    const padding = this.convertEdgeInsetsToCSS(props.padding || style.padding);
    if (padding) {
      styleProps.push(`padding: '${padding}'`);
    }
    
    // Margin - convert EdgeInsets to CSS margin
    const margin = this.convertEdgeInsetsToCSS(props.margin || style.margin);
    if (margin) {
      styleProps.push(`margin: '${margin}'`);
    }
    
    // Width and height
    const width = props.width || style.width;
    const height = props.height || style.height;
    
    if (width) {
      styleProps.push(`width: ${this.convertDimensionToCSS(width)}`);
    }
    
    if (height) {
      styleProps.push(`height: ${this.convertDimensionToCSS(height)}`);
    }
    
    // Border radius - convert from BoxDecoration
    if (style.borderRadius) {
      const borderRadius = this.convertBorderRadiusToCSS(style.borderRadius);
      styleProps.push(`borderRadius: '${borderRadius}'`);
    }
    
    // Border - convert from BoxDecoration
    if (style.border) {
      const border = this.convertBorderToCSS(style.border);
      styleProps.push(`border: '${border}'`);
    }
    
    // Box shadow - convert from BoxDecoration
    if (style.boxShadow) {
      const boxShadow = this.convertBoxShadowToCSS(style.boxShadow);
      styleProps.push(`boxShadow: '${boxShadow}'`);
    }
    
    // Display flex for Row/Column
    if (props.isFlexbox) {
      styleProps.push(`display: 'flex'`);
      
      if (props.flexDirection) {
        styleProps.push(`flexDirection: '${props.flexDirection}'`);
      }
      
      if (props.justifyContent) {
        styleProps.push(`justifyContent: '${props.justifyContent}'`);
      }
      
      if (props.alignItems) {
        styleProps.push(`alignItems: '${props.alignItems}'`);
      }
    }
    
    if (styleProps.length === 0) {
      return null;
    }
    
    return `{{ ${styleProps.join(', ')} }}`;
  }

  /**
   * Convert EdgeInsets to CSS padding/margin
   * @param {string|object} edgeInsets - EdgeInsets value
   * @returns {string|null} CSS padding/margin value
   */
  convertEdgeInsetsToCSS(edgeInsets) {
    if (!edgeInsets) return null;

    // Handle string EdgeInsets like "EdgeInsets.all(10)"
    if (typeof edgeInsets === 'string') {
      // EdgeInsets.all(value)
      const allMatch = edgeInsets.match(/EdgeInsets\.all\((\d+(?:\.\d+)?)\)/);
      if (allMatch) {
        return `${allMatch[1]}px`;
      }

      // EdgeInsets.symmetric(vertical: v, horizontal: h)
      const symMatch = edgeInsets.match(/EdgeInsets\.symmetric\(vertical:\s*(\d+(?:\.\d+)?),\s*horizontal:\s*(\d+(?:\.\d+)?)\)/);
      if (symMatch) {
        return `${symMatch[1]}px ${symMatch[2]}px`;
      }

      // EdgeInsets.only(top: t, right: r, bottom: b, left: l)
      const onlyMatch = edgeInsets.match(/EdgeInsets\.only\(top:\s*(\d+(?:\.\d+)?),\s*right:\s*(\d+(?:\.\d+)?),\s*bottom:\s*(\d+(?:\.\d+)?),\s*left:\s*(\d+(?:\.\d+)?)\)/);
      if (onlyMatch) {
        return `${onlyMatch[1]}px ${onlyMatch[2]}px ${onlyMatch[3]}px ${onlyMatch[4]}px`;
      }
    }

    // Handle object EdgeInsets
    if (typeof edgeInsets === 'object') {
      const top = edgeInsets.top || 0;
      const right = edgeInsets.right || 0;
      const bottom = edgeInsets.bottom || 0;
      const left = edgeInsets.left || 0;

      // Check if all sides are equal
      if (top === right && right === bottom && bottom === left) {
        return `${top}px`;
      }

      // Check if vertical and horizontal are equal
      if (top === bottom && left === right) {
        return `${top}px ${left}px`;
      }

      // All different
      return `${top}px ${right}px ${bottom}px ${left}px`;
    }

    return null;
  }

  /**
   * Convert dimension to CSS value
   * @param {string|number} dimension - Dimension value
   * @returns {string} CSS dimension
   */
  convertDimensionToCSS(dimension) {
    if (typeof dimension === 'number') {
      return `${dimension}px`;
    }

    // Already has unit
    if (typeof dimension === 'string' && (dimension.includes('px') || dimension.includes('%'))) {
      return `'${dimension}'`;
    }

    // Parse numeric value
    const numValue = parseFloat(dimension);
    if (!isNaN(numValue)) {
      return `${numValue}px`;
    }

    return `'${dimension}'`;
  }

  /**
   * Convert BorderRadius to CSS border-radius
   * @param {string} borderRadius - Flutter BorderRadius
   * @returns {string} CSS border-radius
   */
  convertBorderRadiusToCSS(borderRadius) {
    // BorderRadius.circular(value)
    const circularMatch = borderRadius.match(/BorderRadius\.circular\((\d+(?:\.\d+)?)\)/);
    if (circularMatch) {
      return `${circularMatch[1]}px`;
    }

    return '0px';
  }

  /**
   * Convert Border to CSS border
   * @param {string} border - Flutter Border
   * @returns {string} CSS border
   */
  convertBorderToCSS(border) {
    // Border.all(width: w, color: c)
    const match = border.match(/Border\.all\(width:\s*(\d+(?:\.\d+)?),\s*color:\s*(.+)\)/);
    if (match) {
      const width = match[1];
      const color = this.convertColor(match[2]);
      return `${width}px solid ${color}`;
    }

    return '1px solid black';
  }

  /**
   * Convert BoxShadow to CSS box-shadow
   * @param {string} boxShadow - Flutter BoxShadow
   * @returns {string} CSS box-shadow
   */
  convertBoxShadowToCSS(boxShadow) {
    // Simple implementation - return a basic shadow
    return '0px 2px 4px rgba(0, 0, 0, 0.1)';
  }

  /**
   * Generate text style object
   * Converts Flutter TextStyle to React style object
   * @param {object} style - Style props
   * @returns {string} Style object code
   */
  generateTextStyle(style) {
    if (!style) {
      return null;
    }
    
    const styleProps = [];
    
    // Font size
    if (style.fontSize) {
      const fontSize = this.convertDimensionToCSS(style.fontSize);
      styleProps.push(`fontSize: ${fontSize}`);
    }
    
    // Font weight
    if (style.fontWeight) {
      const fontWeight = this.convertFontWeight(style.fontWeight);
      styleProps.push(`fontWeight: '${fontWeight}'`);
    }
    
    // Font family
    if (style.fontFamily) {
      styleProps.push(`fontFamily: '${style.fontFamily}'`);
    }
    
    // Font style (italic)
    if (style.fontStyle === 'FontStyle.italic' || style.fontStyle === 'italic') {
      styleProps.push(`fontStyle: 'italic'`);
    }
    
    // Color
    if (style.color) {
      const color = this.convertColor(style.color);
      styleProps.push(`color: '${color}'`);
    }
    
    // Letter spacing
    if (style.letterSpacing) {
      const letterSpacing = this.convertDimensionToCSS(style.letterSpacing);
      styleProps.push(`letterSpacing: ${letterSpacing}`);
    }
    
    // Line height (Flutter uses 'height' property)
    if (style.height || style.lineHeight) {
      const lineHeight = style.height || style.lineHeight;
      styleProps.push(`lineHeight: ${lineHeight}`);
    }
    
    // Text decoration
    if (style.decoration) {
      const textDecoration = this.convertTextDecorationToCSS(style.decoration);
      styleProps.push(`textDecoration: '${textDecoration}'`);
    }
    
    // Text alignment
    if (style.textAlign) {
      const textAlign = this.convertTextAlignToCSS(style.textAlign);
      styleProps.push(`textAlign: '${textAlign}'`);
    }
    
    if (styleProps.length === 0) {
      return null;
    }
    
    return `{{ ${styleProps.join(', ')} }}`;
  }

  /**
   * Convert Flutter TextDecoration to CSS text-decoration
   * @param {string} decoration - Flutter TextDecoration
   * @returns {string} CSS text-decoration
   */
  convertTextDecorationToCSS(decoration) {
    if (decoration.includes('underline')) {
      return 'underline';
    }
    if (decoration.includes('lineThrough')) {
      return 'line-through';
    }
    if (decoration.includes('overline')) {
      return 'overline';
    }
    return 'none';
  }

  /**
   * Convert Flutter TextAlign to CSS text-align
   * @param {string} textAlign - Flutter TextAlign
   * @returns {string} CSS text-align
   */
  convertTextAlignToCSS(textAlign) {
    const alignMap = {
      'TextAlign.left': 'left',
      'TextAlign.right': 'right',
      'TextAlign.center': 'center',
      'TextAlign.justify': 'justify',
      'TextAlign.start': 'start',
      'TextAlign.end': 'end'
    };
    return alignMap[textAlign] || 'left';
  }

  /**
   * Replace template placeholders with JSX expressions
   * @param {string} text - Text with placeholders
   * @returns {string} JSX expression
   */
  replaceTemplatePlaceholders(text) {
    // Replace {{variable}} with {variable}
    if (text.includes('{{') && text.includes('}}')) {
      return text.replace(/\{\{([^}]+)\}\}/g, '{$1}');
    }
    return text;
  }

  /**
   * Convert color to CSS color
   * Handles Flutter Color objects, hex colors, and named colors
   * @param {string} color - Color value
   * @returns {string} CSS color
   */
  convertColor(color) {
    if (!color) return 'transparent';

    // Already in hex format
    if (color.startsWith('#')) {
      return color;
    }

    // Handle Flutter Color objects: Color(0xFFRRGGBB) or Color(0xAARRGGBB)
    const colorMatch = color.match(/Color\(0x([0-9A-Fa-f]{8})\)/);
    if (colorMatch) {
      const hex = colorMatch[1];
      const a = parseInt(hex.substring(0, 2), 16);
      const r = parseInt(hex.substring(2, 4), 16);
      const g = parseInt(hex.substring(4, 6), 16);
      const b = parseInt(hex.substring(6, 8), 16);
      
      // If alpha is 255 (fully opaque), return hex color
      if (a === 255) {
        return `#${hex.substring(2)}`;
      }
      
      // Otherwise return rgba
      const alpha = (a / 255).toFixed(2);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Handle Flutter named colors: Colors.red, Colors.blue, etc.
    if (color.startsWith('Colors.')) {
      const colorName = color.replace('Colors.', '');
      
      // Map Flutter color names to CSS colors
      const colorMap = {
        'transparent': 'transparent',
        'black': '#000000',
        'white': '#FFFFFF',
        'red': '#F44336',
        'green': '#4CAF50',
        'blue': '#2196F3',
        'yellow': '#FFEB3B',
        'orange': '#FF9800',
        'purple': '#9C27B0',
        'pink': '#E91E63',
        'grey': '#9E9E9E',
        'gray': '#9E9E9E',
        'brown': '#795548',
        'cyan': '#00BCD4',
        'indigo': '#3F51B5',
        'lime': '#CDDC39',
        'teal': '#009688',
        'amber': '#FFC107',
        'black26': 'rgba(0, 0, 0, 0.26)',
        'black38': 'rgba(0, 0, 0, 0.38)',
        'black45': 'rgba(0, 0, 0, 0.45)',
        'black54': 'rgba(0, 0, 0, 0.54)',
        'black87': 'rgba(0, 0, 0, 0.87)',
        'white10': 'rgba(255, 255, 255, 0.1)',
        'white30': 'rgba(255, 255, 255, 0.3)',
        'white70': 'rgba(255, 255, 255, 0.7)'
      };
      
      return colorMap[colorName] || colorName;
    }

    // Named color or unknown format
    return color;
  }

  /**
   * Convert font weight to CSS font weight
   * @param {string} weight - Font weight
   * @returns {string} CSS font weight
   */
  convertFontWeight(weight) {
    const weightMap = {
      'FontWeight.normal': 'normal',
      'FontWeight.bold': 'bold',
      'FontWeight.w100': '100',
      'FontWeight.w200': '200',
      'FontWeight.w300': '300',
      'FontWeight.w400': '400',
      'FontWeight.w500': '500',
      'FontWeight.w600': '600',
      'FontWeight.w700': '700',
      'FontWeight.w800': '800',
      'FontWeight.w900': '900',
    };
    return weightMap[weight] || 'normal';
  }

  /**
   * Map Dart type to TypeScript type
   * @param {string} dartType - Dart type
   * @returns {string} TypeScript type
   */
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

    // Handle generic types
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

  /**
   * Format TypeScript value
   * @param {any} value - Value to format
   * @param {string} type - Value type
   * @returns {string} Formatted TypeScript value
   */
  formatTSValue(value, type) {
    if (value === null) return 'null';
    if (type === 'string') return `'${value}'`;
    if (type === 'number') return String(value);
    if (type === 'boolean') return String(value);
    if (type === 'array') return '[]';
    if (type === 'object') return '{}';
    return 'null';
  }

  /**
   * Basic TypeScript code formatting
   * @param {string} code - Code to format
   * @returns {string} Formatted code
   */
  formatTypeScriptCode(code) {
    // This is a basic formatter - in production, use Prettier
    return code;
  }

  /**
   * Convert IR file to React TypeScript file
   * @param {string} irPath - Path to IR JSON file
   * @param {string} outputPath - Path to output TypeScript file
   * @param {string} mappingPath - Path to widget mapping JSON file
   * @returns {string} Generated TypeScript code
   */
  convertFileToReact(irPath, outputPath, mappingPath) {
    try {
      // Load IR
      const irContent = fs.readFileSync(irPath, 'utf-8');
      const ir = JSON.parse(irContent);

      // Load mappings
      this.loadMappings(mappingPath);

      // Convert to React
      const tsCode = this.convertToReact(ir);

      // Write to output file
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, tsCode, 'utf-8');

      console.log(`✓ React code generated successfully: ${outputPath}`);

      return tsCode;
    } catch (error) {
      console.error(`✗ Error converting IR to React: ${error.message}`);
      throw error;
    }
  }
}

module.exports = IRToReact;
