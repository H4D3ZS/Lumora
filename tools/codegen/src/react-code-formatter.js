/**
 * React Code Formatter
 * Provides utilities for formatting React/TypeScript code with proper indentation,
 * comments, and adherence to React best practices.
 */

class ReactCodeFormatter {
  constructor() {
    this.indentSize = 2;
  }

  /**
   * Format TypeScript code with proper indentation and spacing
   * @param {string} code - Raw TypeScript code
   * @returns {string} Formatted code
   */
  formatCode(code) {
    let formatted = code;

    // Normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n');

    // Remove excessive blank lines (more than 2 consecutive)
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    // Ensure proper spacing around operators
    formatted = this.formatOperators(formatted);

    // Format object literals
    formatted = this.formatObjectLiterals(formatted);

    // Ensure consistent quote style (single quotes for strings)
    formatted = this.normalizeQuotes(formatted);

    return formatted.trim() + '\n';
  }

  /**
   * Format operators with proper spacing
   * @param {string} code - Code to format
   * @returns {string} Formatted code
   */
  formatOperators(code) {
    // Add space around = operator (but not in ===, !==, >=, <=, =>)
    let formatted = code.replace(/([^=!<>])=([^=])/g, '$1 = $2');
    
    // Add space around comparison operators
    formatted = formatted.replace(/([^=!<>])(===|!==|>=|<=)([^=])/g, '$1 $2 $3');
    
    return formatted;
  }

  /**
   * Format object literals with proper spacing
   * @param {string} code - Code to format
   * @returns {string} Formatted code
   */
  formatObjectLiterals(code) {
    // Add space after colons in object literals
    return code.replace(/(\w+):([^\s])/g, '$1: $2');
  }

  /**
   * Normalize quotes to use single quotes for strings
   * (except in JSX attributes where double quotes are preferred)
   * @param {string} code - Code to format
   * @returns {string} Formatted code
   */
  normalizeQuotes(code) {
    // This is a simplified implementation
    // In production, use a proper AST-based formatter like Prettier
    return code;
  }

  /**
   * Add JSDoc comment to a function or component
   * @param {string} name - Function/component name
   * @param {string} description - Description
   * @param {Array<{name: string, type: string, description: string}>} params - Parameters
   * @param {string} returns - Return type description
   * @returns {string} JSDoc comment
   */
  generateJSDoc(name, description, params = [], returns = null) {
    let doc = '/**\n';
    doc += ` * ${description}\n`;
    
    if (params.length > 0) {
      doc += ' *\n';
      for (const param of params) {
        doc += ` * @param {${param.type}} ${param.name} - ${param.description}\n`;
      }
    }
    
    if (returns) {
      doc += ` * @returns {${returns.type}} ${returns.description}\n`;
    }
    
    doc += ' */\n';
    return doc;
  }

  /**
   * Generate inline comment for code explanation
   * @param {string} comment - Comment text
   * @param {number} indent - Indentation level
   * @returns {string} Formatted comment
   */
  generateInlineComment(comment, indent = 0) {
    const indentStr = ' '.repeat(indent * this.indentSize);
    return `${indentStr}// ${comment}\n`;
  }

  /**
   * Generate multi-line comment block
   * @param {string[]} lines - Comment lines
   * @param {number} indent - Indentation level
   * @returns {string} Formatted comment block
   */
  generateCommentBlock(lines, indent = 0) {
    const indentStr = ' '.repeat(indent * this.indentSize);
    let comment = `${indentStr}/*\n`;
    
    for (const line of lines) {
      comment += `${indentStr} * ${line}\n`;
    }
    
    comment += `${indentStr} */\n`;
    return comment;
  }

  /**
   * Format import statements with proper grouping and sorting
   * @param {Set<string>} imports - Set of import statements
   * @returns {string} Formatted imports
   */
  formatImports(imports) {
    const importArray = Array.from(imports);
    
    // Group imports by type
    const reactImports = [];
    const libraryImports = [];
    const relativeImports = [];
    
    for (const imp of importArray) {
      if (imp.includes('react')) {
        reactImports.push(imp);
      } else if (imp.startsWith('./') || imp.startsWith('../')) {
        relativeImports.push(imp);
      } else {
        libraryImports.push(imp);
      }
    }
    
    // Sort each group
    reactImports.sort();
    libraryImports.sort();
    relativeImports.sort();
    
    // Combine with blank lines between groups
    const groups = [reactImports, libraryImports, relativeImports].filter(g => g.length > 0);
    return groups.map(group => group.join('\n')).join('\n\n');
  }

  /**
   * Format props interface with proper TypeScript types
   * @param {string} componentName - Component name
   * @param {Array<{name: string, type: string, optional: boolean, description: string}>} props - Props
   * @returns {string} Formatted interface
   */
  formatPropsInterface(componentName, props) {
    let code = `interface ${componentName}Props {\n`;
    
    for (const prop of props) {
      if (prop.description) {
        code += `  /** ${prop.description} */\n`;
      }
      
      const optional = prop.optional ? '?' : '';
      code += `  ${prop.name}${optional}: ${prop.type};\n`;
    }
    
    code += '}\n';
    return code;
  }

  /**
   * Format JSX with proper indentation and line breaks
   * @param {string} jsx - JSX code
   * @param {number} baseIndent - Base indentation level
   * @returns {string} Formatted JSX
   */
  formatJSX(jsx, baseIndent = 0) {
    // This is a simplified implementation
    // In production, use a proper JSX formatter
    return jsx;
  }

  /**
   * Add helpful comment explaining React pattern
   * @param {string} pattern - Pattern name (e.g., 'useState', 'useEffect')
   * @param {string} context - Additional context
   * @returns {string} Helpful comment
   */
  generatePatternComment(pattern, context = '') {
    const comments = {
      'useState': 'State hook - manages component state',
      'useEffect': 'Effect hook - handles side effects and lifecycle',
      'useCallback': 'Callback hook - memoizes function to prevent re-creation',
      'useMemo': 'Memo hook - memoizes computed value',
      'useRef': 'Ref hook - creates mutable reference that persists across renders',
      'useContext': 'Context hook - accesses context value',
      'useReducer': 'Reducer hook - manages complex state logic',
      'React.memo': 'Memoization - prevents unnecessary re-renders'
    };
    
    const baseComment = comments[pattern] || `${pattern} pattern`;
    return context ? `${baseComment} - ${context}` : baseComment;
  }
}

module.exports = ReactCodeFormatter;
