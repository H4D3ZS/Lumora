/**
 * React Code Optimizer
 * Provides optimization utilities for generated React code:
 * - Remove debug code and console.log statements
 * - Remove unused imports
 * - Optimize re-renders with React.memo
 * - Identify optimization opportunities
 */

class ReactOptimizer {
  constructor() {
    this.debugPatterns = [
      /console\.log\([^)]*\);?\s*/g,
      /console\.debug\([^)]*\);?\s*/g,
      /console\.info\([^)]*\);?\s*/g,
      /\/\/ DEBUG:.*\n/g,
      /\/\* DEBUG:.*?\*\/\s*/gs
    ];
  }

  /**
   * Remove debug code from generated code
   * @param {string} code - Code to optimize
   * @returns {string} Code without debug statements
   */
  removeDebugCode(code) {
    let optimized = code;

    // Remove console.log and other debug statements
    for (const pattern of this.debugPatterns) {
      optimized = optimized.replace(pattern, '');
    }

    // Remove empty lines left by debug removal
    optimized = optimized.replace(/\n\s*\n\s*\n/g, '\n\n');

    return optimized;
  }

  /**
   * Analyze and remove unused imports
   * @param {string} code - Code to analyze
   * @returns {string} Code with unused imports removed
   */
  removeUnusedImports(code) {
    const lines = code.split('\n');
    const importLines = [];
    const codeLines = [];
    
    // Separate imports from code
    let inImportSection = true;
    for (const line of lines) {
      if (line.trim().startsWith('import ')) {
        importLines.push(line);
      } else if (line.trim() !== '') {
        inImportSection = false;
        codeLines.push(line);
      } else {
        if (inImportSection) {
          importLines.push(line);
        } else {
          codeLines.push(line);
        }
      }
    }

    const codeBody = codeLines.join('\n');
    const usedImports = [];

    // Check each import to see if it's used
    for (const importLine of importLines) {
      if (importLine.trim() === '') {
        usedImports.push(importLine);
        continue;
      }

      // Extract imported names
      const importMatch = importLine.match(/import\s+(?:{([^}]+)}|(\w+))\s+from/);
      if (!importMatch) {
        usedImports.push(importLine);
        continue;
      }

      const namedImports = importMatch[1];
      const defaultImport = importMatch[2];

      let isUsed = false;

      if (defaultImport) {
        // Check if default import is used
        const pattern = new RegExp(`\\b${defaultImport}\\b`);
        if (pattern.test(codeBody)) {
          isUsed = true;
        }
      }

      if (namedImports) {
        // Check if any named import is used
        const names = namedImports.split(',').map(n => n.trim());
        for (const name of names) {
          const pattern = new RegExp(`\\b${name}\\b`);
          if (pattern.test(codeBody)) {
            isUsed = true;
            break;
          }
        }
      }

      if (isUsed) {
        usedImports.push(importLine);
      }
    }

    return usedImports.join('\n') + '\n' + codeLines.join('\n');
  }

  /**
   * Determine if a component should be wrapped with React.memo
   * @param {object} componentInfo - Component information
   * @returns {boolean} Should memoize
   */
  shouldMemoizeComponent(componentInfo) {
    const {
      hasState,
      hasEffects,
      hasCallbacks,
      propsCount,
      childrenCount,
      isLeafComponent
    } = componentInfo;

    // Don't memoize if component has internal state that changes frequently
    if (hasState && hasEffects) {
      return false;
    }

    // Memoize leaf components (no children) that receive props
    if (isLeafComponent && propsCount > 0) {
      return true;
    }

    // Memoize components with many children (expensive render)
    if (childrenCount > 10) {
      return true;
    }

    // Memoize pure components (no state, no effects)
    if (!hasState && !hasEffects && propsCount > 0) {
      return true;
    }

    return false;
  }

  /**
   * Wrap component with React.memo
   * @param {string} componentCode - Component code
   * @param {string} componentName - Component name
   * @returns {string} Memoized component code
   */
  wrapWithMemo(componentCode, componentName) {
    // Find the component declaration
    const componentPattern = new RegExp(`const ${componentName}:.*?};`, 's');
    const match = componentCode.match(componentPattern);
    
    if (!match) {
      return componentCode;
    }

    const originalDeclaration = match[0];
    
    // Rename internal component
    const internalName = `${componentName}Internal`;
    const internalDeclaration = originalDeclaration.replace(
      `const ${componentName}:`,
      `const ${internalName}:`
    );

    // Create memoized wrapper
    const memoWrapper = `
// Memoized to prevent unnecessary re-renders when props haven't changed
const ${componentName} = React.memo(${internalName});
${componentName}.displayName = '${componentName}';
`;

    // Replace in code
    return componentCode.replace(originalDeclaration, internalDeclaration + memoWrapper);
  }

  /**
   * Optimize event handlers with useCallback
   * @param {string} code - Code to optimize
   * @returns {string} Optimized code
   */
  optimizeEventHandlers(code) {
    // Find event handler functions that aren't wrapped in useCallback
    const handlerPattern = /const\s+(\w+)\s*=\s*\(\)\s*=>\s*{/g;
    let optimized = code;
    
    const matches = [...code.matchAll(handlerPattern)];
    
    for (const match of matches) {
      const handlerName = match[1];
      
      // Check if it's an event handler (starts with 'handle' or 'on')
      if (handlerName.startsWith('handle') || handlerName.startsWith('on')) {
        // Check if already wrapped in useCallback
        const beforeMatch = code.substring(Math.max(0, match.index - 50), match.index);
        if (!beforeMatch.includes('useCallback')) {
          // Find the complete function
          const startIndex = match.index;
          const functionCode = this.extractFunction(code, startIndex);
          
          if (functionCode) {
            // Wrap with useCallback
            const wrappedCode = `const ${handlerName} = useCallback(() => {${functionCode.body}}, [${functionCode.deps}])`;
            optimized = optimized.replace(functionCode.full, wrappedCode);
          }
        }
      }
    }
    
    return optimized;
  }

  /**
   * Extract complete function from code
   * @param {string} code - Code containing function
   * @param {number} startIndex - Start index of function
   * @returns {object|null} Function info
   */
  extractFunction(code, startIndex) {
    let braceCount = 0;
    let inFunction = false;
    let functionBody = '';
    let i = startIndex;

    // Find opening brace
    while (i < code.length) {
      if (code[i] === '{') {
        inFunction = true;
        braceCount = 1;
        i++;
        break;
      }
      i++;
    }

    if (!inFunction) return null;

    // Extract function body
    const bodyStart = i;
    while (i < code.length && braceCount > 0) {
      if (code[i] === '{') braceCount++;
      if (code[i] === '}') braceCount--;
      if (braceCount > 0) {
        functionBody += code[i];
      }
      i++;
    }

    const fullFunction = code.substring(startIndex, i);

    // Extract dependencies (simplified - look for state variable references)
    const deps = this.extractDependencies(functionBody);

    return {
      full: fullFunction,
      body: functionBody,
      deps: deps.join(', ')
    };
  }

  /**
   * Extract dependencies from function body
   * @param {string} body - Function body
   * @returns {string[]} Dependencies
   */
  extractDependencies(body) {
    const deps = new Set();
    
    // Look for common state variable patterns
    const statePattern = /\b([a-z][a-zA-Z0-9]*)\b/g;
    const matches = [...body.matchAll(statePattern)];
    
    for (const match of matches) {
      const varName = match[1];
      // Filter out keywords and common function names
      if (!this.isKeyword(varName) && !this.isBuiltIn(varName)) {
        deps.add(varName);
      }
    }
    
    return Array.from(deps);
  }

  /**
   * Check if word is a JavaScript keyword
   * @param {string} word - Word to check
   * @returns {boolean} Is keyword
   */
  isKeyword(word) {
    const keywords = [
      'const', 'let', 'var', 'function', 'return', 'if', 'else',
      'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
      'try', 'catch', 'finally', 'throw', 'new', 'this', 'typeof',
      'void', 'delete', 'in', 'instanceof', 'true', 'false', 'null',
      'undefined', 'async', 'await', 'class', 'extends', 'super'
    ];
    return keywords.includes(word);
  }

  /**
   * Check if word is a built-in function
   * @param {string} word - Word to check
   * @returns {boolean} Is built-in
   */
  isBuiltIn(word) {
    const builtIns = [
      'console', 'log', 'error', 'warn', 'map', 'filter', 'reduce',
      'forEach', 'find', 'some', 'every', 'includes', 'push', 'pop',
      'shift', 'unshift', 'slice', 'splice', 'concat', 'join', 'split'
    ];
    return builtIns.includes(word);
  }

  /**
   * Analyze component for optimization opportunities
   * @param {string} code - Component code
   * @returns {object} Optimization report
   */
  analyzeOptimizations(code) {
    const report = {
      canMemoize: false,
      canUseCallback: false,
      canUseMemo: false,
      hasDebugCode: false,
      hasUnusedImports: false,
      suggestions: []
    };

    // Check for debug code
    for (const pattern of this.debugPatterns) {
      if (pattern.test(code)) {
        report.hasDebugCode = true;
        report.suggestions.push('Remove debug console.log statements');
        break;
      }
    }

    // Check for memoization opportunities
    if (code.includes('React.FC') && !code.includes('React.memo')) {
      report.canMemoize = true;
      report.suggestions.push('Consider wrapping component with React.memo');
    }

    // Check for useCallback opportunities
    const handlerPattern = /const\s+(handle\w+|on\w+)\s*=\s*\(\)/g;
    if (handlerPattern.test(code) && !code.includes('useCallback')) {
      report.canUseCallback = true;
      report.suggestions.push('Wrap event handlers with useCallback');
    }

    // Check for useMemo opportunities
    const computationPattern = /const\s+\w+\s*=\s*\w+\.map\(|\.filter\(|\.reduce\(/g;
    if (computationPattern.test(code) && !code.includes('useMemo')) {
      report.canUseMemo = true;
      report.suggestions.push('Wrap expensive computations with useMemo');
    }

    return report;
  }

  /**
   * Apply all optimizations to code
   * @param {string} code - Code to optimize
   * @param {object} options - Optimization options
   * @returns {string} Optimized code
   */
  optimize(code, options = {}) {
    let optimized = code;

    const {
      removeDebug = true,
      removeUnused = true,
      memoizeComponents = true,
      optimizeHandlers = true
    } = options;

    if (removeDebug) {
      optimized = this.removeDebugCode(optimized);
    }

    if (removeUnused) {
      optimized = this.removeUnusedImports(optimized);
    }

    if (optimizeHandlers) {
      optimized = this.optimizeEventHandlers(optimized);
    }

    return optimized;
  }
}

module.exports = ReactOptimizer;
