/**
 * React Hooks Generator
 * Generates proper React hooks following all hooks rules:
 * 1. Only call hooks at the top level
 * 2. Only call hooks from React functions
 * 3. Hooks must be called in the same order every render
 * 4. Custom hooks must start with "use"
 */

class ReactHooksGenerator {
  constructor() {
    this.hookOrder = [];
  }

  /**
   * Generate useState hook with proper TypeScript typing
   * @param {object} stateVar - State variable definition
   * @returns {string} useState hook code
   */
  generateUseState(stateVar) {
    const {
      name,
      type,
      dartType,
      initialValue,
      description
    } = stateVar;

    const tsType = this.mapDartTypeToTS(dartType || type);
    const formattedValue = this.formatInitialValue(initialValue, type);
    const setterName = this.generateSetterName(name);

    let code = '';

    // Add descriptive comment
    if (description) {
      code += `  // ${description}\n`;
    } else {
      code += `  // State: ${name}\n`;
    }

    // Generate useState hook with proper typing
    code += `  const [${name}, ${setterName}] = useState<${tsType}>(${formattedValue});\n`;

    return code;
  }

  /**
   * Generate useEffect hook with proper dependencies
   * @param {object} effect - Effect definition
   * @returns {string} useEffect hook code
   */
  generateUseEffect(effect) {
    const {
      type,
      body,
      dependencies = [],
      description
    } = effect;

    let code = '';

    // Add descriptive comment based on effect type
    if (type === 'mount') {
      code += `  // Effect: Runs once on component mount\n`;
      if (description) {
        code += `  // ${description}\n`;
      }
    } else if (type === 'cleanup') {
      code += `  // Effect: Cleanup on component unmount\n`;
      if (description) {
        code += `  // ${description}\n`;
      }
    } else if (type === 'update') {
      code += `  // Effect: Runs when dependencies change\n`;
      if (description) {
        code += `  // ${description}\n`;
      }
      if (dependencies.length > 0) {
        code += `  // Dependencies: ${dependencies.join(', ')}\n`;
      }
    }

    code += `  useEffect(() => {\n`;

    // Add effect body
    if (body) {
      const lines = body.split('\n');
      for (const line of lines) {
        code += `    ${line}\n`;
      }
    } else {
      code += `    // TODO: Implement effect logic\n`;
    }

    // Add cleanup function if needed
    if (type === 'cleanup') {
      code += `    return () => {\n`;
      code += `      // Cleanup logic\n`;
      code += `    };\n`;
    }

    // Add dependencies array
    const depsArray = dependencies.length > 0 ? dependencies.join(', ') : '';
    code += `  }, [${depsArray}]);`;

    // Add comment explaining dependencies
    if (dependencies.length === 0) {
      code += ` // Empty array = runs once\n`;
    } else {
      code += ` // Runs when these change\n`;
    }

    return code;
  }

  /**
   * Generate useCallback hook for event handlers
   * @param {object} handler - Event handler definition
   * @returns {string} useCallback hook code
   */
  generateUseCallback(handler) {
    const {
      name,
      body,
      parameters = [],
      dependencies = [],
      description
    } = handler;

    let code = '';

    // Add descriptive comment
    if (description) {
      code += `  // ${description}\n`;
    } else {
      code += `  // Event handler: ${name}\n`;
    }

    // Add comment about memoization
    code += `  // Memoized to prevent re-creation on every render\n`;

    // Generate parameter list
    const params = parameters.length > 0 ? parameters.join(', ') : '';

    // Generate useCallback hook
    code += `  const ${name} = useCallback((${params}) => {\n`;

    // Add handler body
    if (body) {
      const lines = body.split('\n');
      for (const line of lines) {
        code += `    ${line}\n`;
      }
    } else {
      code += `    // TODO: Implement handler logic\n`;
    }

    code += `  }, [${dependencies.join(', ')}]);`;

    // Add comment about dependencies
    if (dependencies.length === 0) {
      code += ` // No dependencies = stable reference\n`;
    } else {
      code += ` // Updates when dependencies change\n`;
    }

    return code;
  }

  /**
   * Generate useMemo hook for expensive computations
   * @param {object} computation - Computation definition
   * @returns {string} useMemo hook code
   */
  generateUseMemo(computation) {
    const {
      name,
      expression,
      dependencies = [],
      description
    } = computation;

    let code = '';

    // Add descriptive comment
    if (description) {
      code += `  // ${description}\n`;
    } else {
      code += `  // Memoized computation: ${name}\n`;
    }

    code += `  // Cached to avoid re-computation on every render\n`;

    // Generate useMemo hook
    code += `  const ${name} = useMemo(() => {\n`;
    code += `    return ${expression};\n`;
    code += `  }, [${dependencies.join(', ')}]);`;

    // Add comment about dependencies
    if (dependencies.length === 0) {
      code += ` // Computed once\n`;
    } else {
      code += ` // Re-computed when dependencies change\n`;
    }

    return code;
  }

  /**
   * Generate useRef hook
   * @param {object} ref - Ref definition
   * @returns {string} useRef hook code
   */
  generateUseRef(ref) {
    const {
      name,
      type = 'any',
      initialValue = 'null',
      description
    } = ref;

    let code = '';

    // Add descriptive comment
    if (description) {
      code += `  // ${description}\n`;
    } else {
      code += `  // Ref: ${name}\n`;
    }

    code += `  // Mutable reference that persists across renders\n`;

    // Generate useRef hook
    code += `  const ${name} = useRef<${type}>(${initialValue});\n`;

    return code;
  }

  /**
   * Generate useContext hook
   * @param {object} context - Context definition
   * @returns {string} useContext hook code
   */
  generateUseContext(context) {
    const {
      name,
      contextName,
      description
    } = context;

    let code = '';

    // Add descriptive comment
    if (description) {
      code += `  // ${description}\n`;
    } else {
      code += `  // Context: ${name}\n`;
    }

    code += `  // Access shared context value\n`;

    // Generate useContext hook
    code += `  const ${name} = useContext(${contextName});\n`;

    return code;
  }

  /**
   * Generate custom hook
   * @param {object} hook - Custom hook definition
   * @returns {string} Custom hook code
   */
  generateCustomHook(hook) {
    const {
      name,
      parameters = [],
      returnType = 'any',
      body,
      description
    } = hook;

    let code = '';

    // Add JSDoc comment
    code += `/**\n`;
    code += ` * ${description || `Custom hook: ${name}`}\n`;
    
    if (parameters.length > 0) {
      for (const param of parameters) {
        code += ` * @param {${param.type}} ${param.name} - ${param.description || ''}\n`;
      }
    }
    
    code += ` * @returns {${returnType}} Hook return value\n`;
    code += ` */\n`;

    // Generate hook function
    const params = parameters.map(p => `${p.name}: ${p.type}`).join(', ');
    code += `function ${name}(${params}): ${returnType} {\n`;

    // Add hook body
    if (body) {
      const lines = body.split('\n');
      for (const line of lines) {
        code += `  ${line}\n`;
      }
    } else {
      code += `  // TODO: Implement custom hook logic\n`;
      code += `  return null as any;\n`;
    }

    code += `}\n`;

    return code;
  }

  /**
   * Validate hooks follow React rules
   * @param {string} code - Code to validate
   * @returns {object} Validation result
   */
  validateHooksRules(code) {
    const violations = [];

    // Rule 1: Hooks must be called at top level (not in conditions/loops)
    const conditionalHookPattern = /if\s*\([^)]*\)\s*{[^}]*use\w+\(/g;
    if (conditionalHookPattern.test(code)) {
      violations.push('Hooks called inside conditional statements');
    }

    const loopHookPattern = /(for|while)\s*\([^)]*\)\s*{[^}]*use\w+\(/g;
    if (loopHookPattern.test(code)) {
      violations.push('Hooks called inside loops');
    }

    // Rule 2: Custom hooks must start with "use"
    const customHookPattern = /function\s+(\w+)\s*\([^)]*\)[^{]*{[^}]*use\w+\(/g;
    const matches = [...code.matchAll(customHookPattern)];
    for (const match of matches) {
      const functionName = match[1];
      if (!functionName.startsWith('use')) {
        violations.push(`Function ${functionName} calls hooks but doesn't start with "use"`);
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
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
      'Object': 'any',
      'void': 'void'
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
      if (baseType === 'Future' || baseType === 'Promise') {
        const tsInnerType = this.mapDartTypeToTS(innerType);
        return `Promise<${tsInnerType}>`;
      }
    }

    return typeMap[dartType] || 'any';
  }

  /**
   * Format initial value for TypeScript
   * @param {any} value - Initial value
   * @param {string} type - Value type
   * @returns {string} Formatted value
   */
  formatInitialValue(value, type) {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (type === 'string' || type === 'String') {
      return `'${value}'`;
    }

    if (type === 'number' || type === 'int' || type === 'double') {
      return String(value);
    }

    if (type === 'boolean' || type === 'bool') {
      return String(value);
    }

    if (type === 'array' || type === 'List') {
      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return '[]';
    }

    if (type === 'object' || type === 'Map') {
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return '{}';
    }

    // Default: try to stringify
    try {
      return JSON.stringify(value);
    } catch {
      return 'null';
    }
  }

  /**
   * Extract dependencies from code
   * @param {string} code - Code to analyze
   * @param {string[]} stateVariables - Available state variables
   * @returns {string[]} Dependencies
   */
  extractDependencies(code, stateVariables = []) {
    const dependencies = new Set();

    // Look for state variable references
    for (const varName of stateVariables) {
      const pattern = new RegExp(`\\b${varName}\\b`);
      if (pattern.test(code)) {
        dependencies.add(varName);
      }
    }

    return Array.from(dependencies);
  }
}

module.exports = ReactHooksGenerator;
