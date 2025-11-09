const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * TSXParser - Parses TSX files and converts them to JSON UI schemas
 */
class TSXParser {
  constructor() {
    this.parserOptions = {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    };
  }

  /**
   * Parse a TSX file and return the AST
   * @param {string} filePath - Path to the TSX file
   * @returns {object} Babel AST
   */
  parseFile(filePath) {
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const ast = parser.parse(code, this.parserOptions);
      return ast;
    } catch (error) {
      throw new Error(`Failed to parse file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Parse TSX code string and return the AST
   * @param {string} code - TSX code as string
   * @returns {object} Babel AST
   */
  parseCode(code) {
    try {
      const ast = parser.parse(code, this.parserOptions);
      return ast;
    } catch (error) {
      throw new Error(`Failed to parse code: ${error.message}`);
    }
  }

  /**
   * Find the root JSX element in the AST
   * Looks for default export first, then falls back to first JSXElement
   * @param {object} ast - Babel AST
   * @returns {object|null} JSX element node
   */
  findRootJSXElement(ast) {
    let rootElement = null;
    let firstJSXElement = null;
    const self = this;

    traverse(ast, {
      // Handle default export declaration
      ExportDefaultDeclaration(path) {
        const declaration = path.node.declaration;
        
        // Handle function component: export default function Component() { return <View>...</View> }
        if (declaration.type === 'FunctionDeclaration' || declaration.type === 'ArrowFunctionExpression') {
          const jsxElement = self._findJSXInFunction(declaration);
          if (jsxElement) {
            rootElement = jsxElement;
          }
        }
        // Handle direct JSX export: export default <View>...</View>
        else if (declaration.type === 'JSXElement' || declaration.type === 'JSXFragment') {
          rootElement = declaration;
        }
        // Handle identifier: export default MyComponent
        else if (declaration.type === 'Identifier') {
          // Will be handled by finding the component definition
        }
      },

      // Handle function declarations and arrow functions
      FunctionDeclaration(path) {
        if (!rootElement) {
          const jsxElement = self._findJSXInFunction(path.node);
          if (jsxElement && !firstJSXElement) {
            firstJSXElement = jsxElement;
          }
        }
      },

      // Handle variable declarations with arrow functions
      VariableDeclarator(path) {
        if (!rootElement && path.node.init) {
          if (path.node.init.type === 'ArrowFunctionExpression' || path.node.init.type === 'FunctionExpression') {
            const jsxElement = self._findJSXInFunction(path.node.init);
            if (jsxElement && !firstJSXElement) {
              firstJSXElement = jsxElement;
            }
          }
        }
      },

      // Collect first JSX element as fallback
      JSXElement(path) {
        if (!rootElement && !firstJSXElement) {
          firstJSXElement = path.node;
        }
      }
    });

    return rootElement || firstJSXElement;
  }

  /**
   * Find JSX element within a function (component)
   * @param {object} functionNode - Function AST node
   * @returns {object|null} JSX element node
   */
  _findJSXInFunction(functionNode) {
    let jsxElement = null;

    // Check if body is a JSX element (arrow function shorthand)
    if (functionNode.body && (functionNode.body.type === 'JSXElement' || functionNode.body.type === 'JSXFragment')) {
      return functionNode.body;
    }

    // Traverse function body to find return statement with JSX
    if (functionNode.body && functionNode.body.type === 'BlockStatement') {
      const body = functionNode.body.body;
      for (const statement of body) {
        if (statement.type === 'ReturnStatement' && statement.argument) {
          if (statement.argument.type === 'JSXElement' || statement.argument.type === 'JSXFragment') {
            jsxElement = statement.argument;
            break;
          }
        }
      }
    }

    return jsxElement;
  }

  /**
   * Convert JSX element to schema node
   * @param {object} jsxElement - JSX element AST node
   * @returns {object} Schema node with type, props, and children
   */
  convertToSchema(jsxElement) {
    if (!jsxElement) {
      throw new Error('No JSX element provided for conversion');
    }

    // Handle JSXFragment
    if (jsxElement.type === 'JSXFragment') {
      return {
        type: 'View',
        props: {},
        children: this._processChildren(jsxElement.children)
      };
    }

    // Handle JSXElement
    if (jsxElement.type !== 'JSXElement') {
      throw new Error(`Expected JSXElement, got ${jsxElement.type}`);
    }

    const elementType = this._extractElementType(jsxElement.openingElement);
    const props = this._extractProps(jsxElement.openingElement.attributes);
    const children = this._processChildren(jsxElement.children);

    return {
      type: elementType,
      props: props,
      children: children
    };
  }

  /**
   * Extract element type from JSX opening element
   * @param {object} openingElement - JSX opening element node
   * @returns {string} Element type name
   */
  _extractElementType(openingElement) {
    const name = openingElement.name;
    
    if (name.type === 'JSXIdentifier') {
      return name.name;
    } else if (name.type === 'JSXMemberExpression') {
      // Handle cases like <View.Container>
      return this._getMemberExpressionName(name);
    } else if (name.type === 'JSXNamespacedName') {
      // Handle cases like <svg:path>
      return `${name.namespace.name}:${name.name.name}`;
    }
    
    return 'View';
  }

  /**
   * Get full name from JSX member expression
   * @param {object} memberExpression - JSX member expression node
   * @returns {string} Full member expression name
   */
  _getMemberExpressionName(memberExpression) {
    const parts = [];
    let current = memberExpression;
    
    while (current) {
      if (current.type === 'JSXMemberExpression') {
        parts.unshift(current.property.name);
        current = current.object;
      } else if (current.type === 'JSXIdentifier') {
        parts.unshift(current.name);
        break;
      } else {
        break;
      }
    }
    
    return parts.join('.');
  }

  /**
   * Process JSX children and convert to schema nodes
   * @param {array} children - Array of JSX children nodes
   * @returns {array} Array of schema nodes
   */
  _processChildren(children) {
    const schemaChildren = [];

    for (const child of children) {
      if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
        schemaChildren.push(this.convertToSchema(child));
      } else if (child.type === 'JSXText') {
        const text = child.value.trim();
        if (text) {
          // Convert text nodes to Text schema nodes
          schemaChildren.push({
            type: 'Text',
            props: { text: text },
            children: []
          });
        }
      } else if (child.type === 'JSXExpressionContainer') {
        // Handle expressions in children
        const expressionValue = this._extractExpressionValue(child.expression);
        if (expressionValue !== null && expressionValue !== undefined) {
          if (typeof expressionValue === 'string') {
            schemaChildren.push({
              type: 'Text',
              props: { text: expressionValue },
              children: []
            });
          }
        }
      }
    }

    return schemaChildren;
  }

  /**
   * Extract props from JSX attributes
   * @param {array} attributes - Array of JSX attribute nodes
   * @returns {object} Props object
   */
  _extractProps(attributes) {
    const props = {};

    for (const attr of attributes) {
      if (attr.type === 'JSXAttribute') {
        const propName = this._getAttributeName(attr.name);
        const propValue = this._getAttributeValue(attr.value);
        props[propName] = propValue;
      } else if (attr.type === 'JSXSpreadAttribute') {
        // Handle spread attributes {...props}
        // For now, we'll skip these as they require runtime evaluation
        continue;
      }
    }

    return props;
  }

  /**
   * Get attribute name from JSX attribute name node
   * @param {object} nameNode - JSX attribute name node
   * @returns {string} Attribute name
   */
  _getAttributeName(nameNode) {
    if (nameNode.type === 'JSXIdentifier') {
      return nameNode.name;
    } else if (nameNode.type === 'JSXNamespacedName') {
      return `${nameNode.namespace.name}:${nameNode.name.name}`;
    }
    return 'unknown';
  }

  /**
   * Get attribute value from JSX attribute value node
   * @param {object} valueNode - JSX attribute value node
   * @returns {any} Attribute value
   */
  _getAttributeValue(valueNode) {
    if (!valueNode) {
      // Boolean attribute without value (e.g., <Button disabled />)
      return true;
    }

    if (valueNode.type === 'StringLiteral') {
      return valueNode.value;
    }

    if (valueNode.type === 'JSXExpressionContainer') {
      return this._extractExpressionValue(valueNode.expression);
    }

    if (valueNode.type === 'JSXElement' || valueNode.type === 'JSXFragment') {
      // Nested JSX as prop value
      return this.convertToSchema(valueNode);
    }

    return null;
  }

  /**
   * Extract value from expression node
   * @param {object} expression - Expression AST node
   * @returns {any} Extracted value
   */
  _extractExpressionValue(expression) {
    if (!expression) return null;

    switch (expression.type) {
      case 'StringLiteral':
        return expression.value;
      case 'NumericLiteral':
        return expression.value;
      case 'BooleanLiteral':
        return expression.value;
      case 'NullLiteral':
        return null;
      case 'TemplateLiteral':
        // For template literals, try to extract static parts
        if (expression.expressions.length === 0 && expression.quasis.length === 1) {
          return expression.quasis[0].value.cooked;
        }
        // For dynamic templates, return placeholder format
        return this._extractTemplateLiteral(expression);
      case 'ObjectExpression':
        return this._extractObjectExpression(expression);
      case 'ArrayExpression':
        return this._extractArrayExpression(expression);
      case 'Identifier':
        // Return placeholder for identifiers
        return `{{${expression.name}}}`;
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        // For event handlers, extract the pattern
        return this._extractFunctionExpression(expression);
      default:
        // For complex expressions, return null
        return null;
    }
  }

  /**
   * Extract object expression to plain object
   * @param {object} objectExpression - Object expression node
   * @returns {object} Plain object
   */
  _extractObjectExpression(objectExpression) {
    const obj = {};

    for (const prop of objectExpression.properties) {
      if (prop.type === 'ObjectProperty') {
        const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
        const value = this._extractExpressionValue(prop.value);
        obj[key] = value;
      } else if (prop.type === 'SpreadElement') {
        // Skip spread elements for now
        continue;
      }
    }

    return obj;
  }

  /**
   * Extract array expression to plain array
   * @param {object} arrayExpression - Array expression node
   * @returns {array} Plain array
   */
  _extractArrayExpression(arrayExpression) {
    const arr = [];

    for (const element of arrayExpression.elements) {
      if (element) {
        const value = this._extractExpressionValue(element);
        arr.push(value);
      }
    }

    return arr;
  }

  /**
   * Extract function expression for event handlers
   * @param {object} functionExpression - Function expression node
   * @returns {string} Event handler pattern
   */
  _extractFunctionExpression(functionExpression) {
    // Try to extract simple event handler patterns
    // For now, return a placeholder
    return 'emit:action:{}';
  }

  /**
   * Extract template literal with placeholders
   * @param {object} templateLiteral - Template literal node
   * @returns {string} Template string with placeholders
   */
  _extractTemplateLiteral(templateLiteral) {
    let result = '';
    for (let i = 0; i < templateLiteral.quasis.length; i++) {
      result += templateLiteral.quasis[i].value.cooked;
      if (i < templateLiteral.expressions.length) {
        const expr = templateLiteral.expressions[i];
        if (expr.type === 'Identifier') {
          result += `{{${expr.name}}}`;
        } else {
          result += '{{expr}}';
        }
      }
    }
    return result;
  }

  /**
   * Convert TSX file to JSON schema and write to output file
   * @param {string} inputPath - Path to input TSX file
   * @param {string} outputPath - Path to output JSON file
   * @returns {object} Generated schema object
   */
  convertFileToSchema(inputPath, outputPath) {
    try {
      // Parse the TSX file
      const ast = this.parseFile(inputPath);
      
      // Find the root JSX element
      const rootElement = this.findRootJSXElement(ast);
      
      if (!rootElement) {
        throw new Error('No JSX element found in the file. Make sure your component returns JSX.');
      }

      // Convert to schema
      const schemaRoot = this.convertToSchema(rootElement);

      // Create the schema object with version
      const schema = {
        schemaVersion: '1.0',
        root: schemaRoot
      };

      // Write to output file
      this.writeSchemaToFile(schema, outputPath);

      // Log success
      console.log(`✓ Schema generated successfully: ${outputPath}`);

      return schema;
    } catch (error) {
      console.error(`✗ Error converting TSX to schema: ${error.message}`);
      throw error;
    }
  }

  /**
   * Write schema object to JSON file
   * @param {object} schema - Schema object
   * @param {string} outputPath - Path to output JSON file
   */
  writeSchemaToFile(schema, outputPath) {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Stringify with 2-space indentation
      const jsonString = JSON.stringify(schema, null, 2);

      // Write to file
      fs.writeFileSync(outputPath, jsonString, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write schema to file ${outputPath}: ${error.message}`);
    }
  }
}

module.exports = TSXParser;
