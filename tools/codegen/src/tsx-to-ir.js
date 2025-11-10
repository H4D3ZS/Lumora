const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { createIR, createNode } = require('../../../packages/lumora_ir/dist/index');
const StateManagementDetector = require('./state-management-detector');

/**
 * TSXToIR - Parses TSX files and converts them to Lumora IR
 * Refactored version that outputs framework-agnostic IR instead of direct schema
 */
class TSXToIR {
  constructor() {
    this.parserOptions = {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    };
    this.currentFilePath = '';
    this.stateVariables = [];
    this.eventHandlers = [];
    this.componentMetadata = {};
    this.stateManagementDetector = new StateManagementDetector();
  }

  /**
   * Parse a TSX file and return Lumora IR
   * @param {string} filePath - Path to the TSX file
   * @returns {object} Lumora IR
   */
  parseFile(filePath) {
    try {
      this.currentFilePath = filePath;
      this.stateVariables = [];
      this.eventHandlers = [];
      this.componentMetadata = {};

      const code = fs.readFileSync(filePath, 'utf-8');
      const ast = parser.parse(code, this.parserOptions);
      
      return this.astToIR(ast);
    } catch (error) {
      throw new Error(`Failed to parse file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Parse TSX code string and return Lumora IR
   * @param {string} code - TSX code as string
   * @param {string} sourceFile - Source file name (optional)
   * @returns {object} Lumora IR
   */
  parseCode(code, sourceFile = 'inline.tsx') {
    try {
      this.currentFilePath = sourceFile;
      this.stateVariables = [];
      this.eventHandlers = [];
      this.componentMetadata = {};

      const ast = parser.parse(code, this.parserOptions);
      return this.astToIR(ast, code);
    } catch (error) {
      throw new Error(`Failed to parse code: ${error.message}`);
    }
  }

  /**
   * Convert AST to Lumora IR
   * @param {object} ast - Babel AST
   * @param {string} sourceCode - Optional source code for pattern detection
   * @returns {object} Lumora IR
   */
  astToIR(ast, sourceCode = null) {
    // First pass: Extract component metadata, state, and events
    this.extractComponentMetadata(ast);

    // Second pass: Find and convert root JSX element
    const rootElement = this.findRootJSXElement(ast);
    
    if (!rootElement) {
      throw new Error('No JSX element found in the file. Make sure your component returns JSX.');
    }

    // Convert JSX to IR nodes
    const nodes = [this.jsxToNode(rootElement)];

    // Detect state management pattern
    let statePattern = { pattern: 'useState', confidence: 1.0, features: [], targetPattern: 'setState' };
    
    if (sourceCode) {
      statePattern = this.stateManagementDetector.detectReactPattern(sourceCode, this.componentMetadata);
    } else if (fs.existsSync(this.currentFilePath)) {
      const fileCode = fs.readFileSync(this.currentFilePath, 'utf-8');
      statePattern = this.stateManagementDetector.detectReactPattern(fileCode, this.componentMetadata);
    }

    // Detect navigation/routing
    const navigationInfo = this.detectNavigation(ast, sourceCode || (fs.existsSync(this.currentFilePath) ? fs.readFileSync(this.currentFilePath, 'utf-8') : ''));

    // Create IR with metadata
    const ir = {
      version: '1.0.0',
      metadata: {
        sourceFramework: 'react',
        sourceFile: this.currentFilePath,
        generatedAt: Date.now(),
        irVersion: '1.0.0',
        componentName: this.componentMetadata.name,
        documentation: this.componentMetadata.documentation,
        hooks: {
          state: this.stateVariables,
          effects: this.componentMetadata.effects || [],
          contexts: this.componentMetadata.contexts || [],
          callbacks: this.componentMetadata.callbacks || [],
          memos: this.componentMetadata.memos || []
        },
        contextDefinitions: this.componentMetadata.contextDefinitions || [],
        stateManagement: {
          pattern: statePattern.pattern,
          confidence: statePattern.confidence,
          features: statePattern.features,
          targetPattern: this.stateManagementDetector.mapReactToFlutter(statePattern.pattern)
        },
        navigation: navigationInfo
      },
      nodes
    };

    return ir;
  }

  /**
   * Detect navigation/routing patterns in React code
   * @param {object} ast - Babel AST
   * @param {string} sourceCode - Source code
   * @returns {object} Navigation information
   */
  detectNavigation(ast, sourceCode) {
    const navigationInfo = {
      hasNavigation: false,
      library: null, // 'react-router', 'react-navigation', etc.
      routes: [],
      navigateCalls: [],
      linkComponents: [],
      deepLinking: {
        enabled: false,
        urlPatterns: []
      }
    };

    // Check for React Router imports
    if (sourceCode.includes('react-router') || sourceCode.includes('react-router-dom')) {
      navigationInfo.hasNavigation = true;
      navigationInfo.library = 'react-router';
    }

    // Check for React Navigation imports
    if (sourceCode.includes('@react-navigation') || sourceCode.includes('react-navigation')) {
      navigationInfo.hasNavigation = true;
      navigationInfo.library = 'react-navigation';
    }

    // Check for deep linking configuration
    if (sourceCode.includes('createBrowserRouter') || sourceCode.includes('createMemoryRouter')) {
      navigationInfo.deepLinking.enabled = true;
    }

    if (!navigationInfo.hasNavigation) {
      return navigationInfo;
    }

    const self = this;

    // Extract route definitions and navigation calls
    traverse(ast, {
      // Detect Route components
      JSXElement(path) {
        const elementName = self.extractElementType(path.node.openingElement);
        
        if (elementName === 'Route') {
          const route = {
            path: null,
            component: null,
            exact: false,
            params: [],
            children: []
          };

          // Extract route props
          for (const attr of path.node.openingElement.attributes) {
            if (attr.type === 'JSXAttribute') {
              const propName = self.getAttributeName(attr.name);
              const propValue = self.getAttributeValue(attr.value);

              if (propName === 'path') {
                route.path = propValue;
                // Extract route parameters from path
                // React Router v6 uses :param syntax
                const colonParamMatches = propValue.matchAll(/:(\w+)/g);
                for (const match of colonParamMatches) {
                  route.params.push(match[1]);
                }
                // React Router v6 also supports /path/:id format
                const slashParamMatches = propValue.matchAll(/\/:\w+/g);
                for (const match of slashParamMatches) {
                  const paramName = match[0].substring(2); // Remove /:
                  if (!route.params.includes(paramName)) {
                    route.params.push(paramName);
                  }
                }
              } else if (propName === 'component' || propName === 'element') {
                route.component = propValue;
              } else if (propName === 'exact') {
                route.exact = propValue === true;
              }
            }
          }

          // Check for nested routes (child Route elements)
          if (path.node.children && path.node.children.length > 0) {
            for (const child of path.node.children) {
              if (child.type === 'JSXElement') {
                const childElementName = self.extractElementType(child.openingElement);
                if (childElementName === 'Route') {
                  route.children.push({
                    type: 'nested-route',
                    element: child
                  });
                }
              }
            }
          }

          navigationInfo.routes.push(route);
        } else if (elementName === 'Link') {
          // Extract Link components
          const link = {
            to: null,
            params: {}
          };

          for (const attr of path.node.openingElement.attributes) {
            if (attr.type === 'JSXAttribute') {
              const propName = self.getAttributeName(attr.name);
              const propValue = self.getAttributeValue(attr.value);

              if (propName === 'to') {
                link.to = propValue;
              }
            }
          }

          navigationInfo.linkComponents.push(link);
        }
      },

      // Detect useNavigate or useHistory hooks
      CallExpression(path) {
        if (path.node.callee.type === 'Identifier') {
          const calleeName = path.node.callee.name;

          // Detect navigation hook calls
          if (calleeName === 'useNavigate' || calleeName === 'useHistory') {
            // Track that navigation is being used
            navigationInfo.navigateCalls.push({
              type: calleeName,
              line: path.node.loc?.start.line || 0
            });
          }
        }

        // Detect navigate() or history.push() calls
        if (path.node.callee.type === 'MemberExpression') {
          const objectName = path.node.callee.object.name;
          const propertyName = path.node.callee.property.name;

          if ((objectName === 'navigate' || objectName === 'history') && 
              (propertyName === 'push' || propertyName === 'replace' || propertyName === 'goBack')) {
            const navCall = {
              method: propertyName,
              path: null,
              params: {}
            };

            // Extract navigation path from first argument
            if (path.node.arguments.length > 0) {
              navCall.path = self.extractExpressionValue(path.node.arguments[0]);
            }

            navigationInfo.navigateCalls.push(navCall);
          }
        }
      }
    });

    // Extract deep link URL patterns from routes
    if (navigationInfo.routes.length > 0) {
      for (const route of navigationInfo.routes) {
        if (route.path) {
          // Convert React Router path to URL pattern
          // :param -> {param}
          const urlPattern = route.path.replace(/:(\w+)/g, '{$1}');
          navigationInfo.deepLinking.urlPatterns.push({
            path: route.path,
            urlPattern: urlPattern,
            component: route.component
          });
        }
      }
      
      // If URL patterns exist, enable deep linking
      if (navigationInfo.deepLinking.urlPatterns.length > 0) {
        navigationInfo.deepLinking.enabled = true;
      }
    }

    return navigationInfo;
  }

  /**
   * Extract component metadata including state and events
   * @param {object} ast - Babel AST
   */
  extractComponentMetadata(ast) {
    const self = this;

    traverse(ast, {
      // Extract component name and documentation
      ExportDefaultDeclaration(path) {
        const declaration = path.node.declaration;
        
        if (declaration.type === 'FunctionDeclaration' && declaration.id) {
          self.componentMetadata.name = declaration.id.name;
        } else if (declaration.type === 'Identifier') {
          self.componentMetadata.name = declaration.name;
        }

        // Extract JSDoc comments
        if (path.node.leadingComments && path.node.leadingComments.length > 0) {
          const comment = path.node.leadingComments[path.node.leadingComments.length - 1];
          if (comment.type === 'CommentBlock') {
            self.componentMetadata.documentation = comment.value.trim();
          }
        }
      },

      FunctionDeclaration(path) {
        if (path.node.id && !self.componentMetadata.name) {
          self.componentMetadata.name = path.node.id.name;
        }
        
        // Extract state from function body
        self.extractStateFromFunction(path.node);
      },

      VariableDeclarator(path) {
        if (path.node.id && path.node.id.type === 'Identifier' && !self.componentMetadata.name) {
          self.componentMetadata.name = path.node.id.name;
        }

        if (path.node.init && 
            (path.node.init.type === 'ArrowFunctionExpression' || 
             path.node.init.type === 'FunctionExpression')) {
          self.extractStateFromFunction(path.node.init);
        }

        // Detect createContext calls
        if (path.node.init && 
            path.node.init.type === 'CallExpression' &&
            path.node.init.callee.name === 'createContext') {
          const contextName = path.node.id.name;
          if (!self.componentMetadata.contextDefinitions) {
            self.componentMetadata.contextDefinitions = [];
          }
          self.componentMetadata.contextDefinitions.push({
            name: contextName,
            defaultValue: self.extractExpressionValue(path.node.init.arguments[0])
          });
        }
      }
    });
  }

  /**
   * Extract state management patterns from function
   * @param {object} functionNode - Function AST node
   */
  extractStateFromFunction(functionNode) {
    if (!functionNode.body || functionNode.body.type !== 'BlockStatement') {
      return;
    }

    const body = functionNode.body.body;
    
    for (const statement of body) {
      // Extract hooks from variable declarations
      if (statement.type === 'VariableDeclaration') {
        for (const declarator of statement.declarations) {
          if (declarator.init && declarator.init.type === 'CallExpression') {
            const hookName = declarator.init.callee.name;
            
            // Extract useState
            if (hookName === 'useState') {
              const stateVar = this.extractUseState(declarator);
              if (stateVar) {
                this.stateVariables.push(stateVar);
              }
            }
            // Extract useContext
            else if (hookName === 'useContext') {
              const context = this.extractUseContext(declarator);
              if (context) {
                if (!this.componentMetadata.contexts) {
                  this.componentMetadata.contexts = [];
                }
                this.componentMetadata.contexts.push(context);
              }
            }
            // Extract useCallback
            else if (hookName === 'useCallback') {
              const callback = this.extractUseCallback(declarator);
              if (callback) {
                if (!this.componentMetadata.callbacks) {
                  this.componentMetadata.callbacks = [];
                }
                this.componentMetadata.callbacks.push(callback);
              }
            }
            // Extract useMemo
            else if (hookName === 'useMemo') {
              const memo = this.extractUseMemo(declarator);
              if (memo) {
                if (!this.componentMetadata.memos) {
                  this.componentMetadata.memos = [];
                }
                this.componentMetadata.memos.push(memo);
              }
            }
          }
        }
      }
      // Extract useEffect from expression statements (not assigned to variables)
      else if (statement.type === 'ExpressionStatement') {
        if (statement.expression.type === 'CallExpression' &&
            statement.expression.callee.name === 'useEffect') {
          const effect = this.extractUseEffect(statement.expression);
          if (effect) {
            if (!this.componentMetadata.effects) {
              this.componentMetadata.effects = [];
            }
            this.componentMetadata.effects.push(effect);
          }
        }
      }
    }
  }

  /**
   * Extract useState hook information
   * @param {object} declarator - Variable declarator node
   * @returns {object|null} State variable info
   */
  extractUseState(declarator) {
    if (declarator.id.type !== 'ArrayPattern' || declarator.id.elements.length < 2) {
      return null;
    }

    const stateName = declarator.id.elements[0]?.name;
    const setterName = declarator.id.elements[1]?.name;
    const initialValue = this.extractExpressionValue(declarator.init.arguments[0]);

    if (!stateName) return null;

    return {
      name: stateName,
      setter: setterName,
      type: this.inferType(initialValue),
      initialValue,
      mutable: true
    };
  }

  /**
   * Infer type from initial value
   * @param {any} value - Initial value
   * @returns {string} Type name
   */
  inferType(value) {
    if (value === null) return 'any';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  /**
   * Extract useEffect hook information
   * @param {object} callExpression - useEffect call expression node
   * @returns {object|null} Effect info
   */
  extractUseEffect(callExpression) {
    if (!callExpression.arguments || callExpression.arguments.length === 0) {
      return null;
    }

    const effectFunction = callExpression.arguments[0];
    const dependencies = callExpression.arguments[1];

    let dependencyList = [];
    let hasCleanup = false;

    // Extract dependencies
    if (dependencies && dependencies.type === 'ArrayExpression') {
      dependencyList = dependencies.elements
        .filter(el => el && el.type === 'Identifier')
        .map(el => el.name);
    }

    // Check for cleanup function
    if (effectFunction.type === 'ArrowFunctionExpression' || 
        effectFunction.type === 'FunctionExpression') {
      if (effectFunction.body.type === 'BlockStatement') {
        const returnStatement = effectFunction.body.body.find(
          stmt => stmt.type === 'ReturnStatement'
        );
        if (returnStatement && returnStatement.argument) {
          hasCleanup = true;
        }
      }
    }

    return {
      dependencies: dependencyList,
      hasCleanup,
      type: dependencyList.length === 0 ? 'mount' : 'update'
    };
  }

  /**
   * Extract useContext hook information
   * @param {object} declarator - Variable declarator node
   * @returns {object|null} Context info
   */
  extractUseContext(declarator) {
    if (!declarator.id || declarator.id.type !== 'Identifier') {
      return null;
    }

    const contextName = declarator.id.name;
    const contextArg = declarator.init.arguments[0];
    
    let contextType = 'unknown';
    if (contextArg && contextArg.type === 'Identifier') {
      contextType = contextArg.name;
    }

    return {
      name: contextName,
      contextType
    };
  }

  /**
   * Extract useCallback hook information
   * @param {object} declarator - Variable declarator node
   * @returns {object|null} Callback info
   */
  extractUseCallback(declarator) {
    if (!declarator.id || declarator.id.type !== 'Identifier') {
      return null;
    }

    const callbackName = declarator.id.name;
    const dependencies = declarator.init.arguments[1];

    let dependencyList = [];
    if (dependencies && dependencies.type === 'ArrayExpression') {
      dependencyList = dependencies.elements
        .filter(el => el && el.type === 'Identifier')
        .map(el => el.name);
    }

    return {
      name: callbackName,
      dependencies: dependencyList
    };
  }

  /**
   * Extract useMemo hook information
   * @param {object} declarator - Variable declarator node
   * @returns {object|null} Memo info
   */
  extractUseMemo(declarator) {
    if (!declarator.id || declarator.id.type !== 'Identifier') {
      return null;
    }

    const memoName = declarator.id.name;
    const dependencies = declarator.init.arguments[1];

    let dependencyList = [];
    if (dependencies && dependencies.type === 'ArrayExpression') {
      dependencyList = dependencies.elements
        .filter(el => el && el.type === 'Identifier')
        .map(el => el.name);
    }

    return {
      name: memoName,
      dependencies: dependencyList
    };
  }

  /**
   * Find the root JSX element in the AST
   * @param {object} ast - Babel AST
   * @returns {object|null} JSX element node
   */
  findRootJSXElement(ast) {
    let rootElement = null;
    let firstJSXElement = null;
    const self = this;

    traverse(ast, {
      ExportDefaultDeclaration(path) {
        const declaration = path.node.declaration;
        
        if (declaration.type === 'FunctionDeclaration' || declaration.type === 'ArrowFunctionExpression') {
          const jsxElement = self._findJSXInFunction(declaration);
          if (jsxElement) {
            rootElement = jsxElement;
          }
        } else if (declaration.type === 'JSXElement' || declaration.type === 'JSXFragment') {
          rootElement = declaration;
        }
      },

      FunctionDeclaration(path) {
        if (!rootElement) {
          const jsxElement = self._findJSXInFunction(path.node);
          if (jsxElement && !firstJSXElement) {
            firstJSXElement = jsxElement;
          }
        }
      },

      VariableDeclarator(path) {
        if (!rootElement && path.node.init) {
          if (path.node.init.type === 'ArrowFunctionExpression' || 
              path.node.init.type === 'FunctionExpression') {
            const jsxElement = self._findJSXInFunction(path.node.init);
            if (jsxElement && !firstJSXElement) {
              firstJSXElement = jsxElement;
            }
          }
        }
      },

      JSXElement(path) {
        if (!rootElement && !firstJSXElement) {
          firstJSXElement = path.node;
        }
      }
    });

    return rootElement || firstJSXElement;
  }

  /**
   * Find JSX element within a function
   * @param {object} functionNode - Function AST node
   * @returns {object|null} JSX element node
   */
  _findJSXInFunction(functionNode) {
    if (functionNode.body && 
        (functionNode.body.type === 'JSXElement' || functionNode.body.type === 'JSXFragment')) {
      return functionNode.body;
    }

    if (functionNode.body && functionNode.body.type === 'BlockStatement') {
      const body = functionNode.body.body;
      for (const statement of body) {
        if (statement.type === 'ReturnStatement' && statement.argument) {
          if (statement.argument.type === 'JSXElement' || statement.argument.type === 'JSXFragment') {
            return statement.argument;
          }
        }
      }
    }

    return null;
  }

  /**
   * Convert JSX element to Lumora IR node
   * @param {object} jsxElement - JSX element AST node
   * @param {number} depth - Current depth in tree
   * @returns {object} Lumora IR node
   */
  jsxToNode(jsxElement, depth = 0) {
    if (!jsxElement) {
      throw new Error('No JSX element provided for conversion');
    }

    // Handle JSXFragment
    if (jsxElement.type === 'JSXFragment') {
      return {
        id: this.generateNodeId(),
        type: 'Fragment',
        props: {},
        children: this.processChildren(jsxElement.children, depth + 1),
        metadata: {
          lineNumber: jsxElement.loc?.start.line || 0
        }
      };
    }

    // Handle JSXElement
    if (jsxElement.type !== 'JSXElement') {
      throw new Error(`Expected JSXElement, got ${jsxElement.type}`);
    }

    const elementType = this.extractElementType(jsxElement.openingElement);
    const props = this.extractProps(jsxElement.openingElement.attributes);
    const children = this.processChildren(jsxElement.children, depth + 1);
    const events = this.extractEvents(jsxElement.openingElement.attributes);
    const lineNumber = jsxElement.loc?.start.line || 0;

    const node = {
      id: this.generateNodeId(),
      type: elementType,
      props,
      children,
      metadata: {
        lineNumber
      }
    };

    // Detect Context.Provider
    if (elementType.endsWith('.Provider')) {
      const contextName = elementType.replace('.Provider', '');
      node.metadata.isContextProvider = true;
      node.metadata.contextName = contextName;
    }

    // Add events if present
    if (events.length > 0) {
      node.events = events;
    }

    // Add state if this node references state
    const stateRefs = this.findStateReferences(props, children);
    if (stateRefs.length > 0) {
      node.state = {
        type: 'local',
        variables: stateRefs
      };
    }

    return node;
  }

  /**
   * Generate unique node ID
   * @returns {string} Node ID
   */
  generateNodeId() {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract element type from JSX opening element
   * @param {object} openingElement - JSX opening element node
   * @returns {string} Element type name
   */
  extractElementType(openingElement) {
    const name = openingElement.name;
    
    if (name.type === 'JSXIdentifier') {
      return name.name;
    } else if (name.type === 'JSXMemberExpression') {
      return this.getMemberExpressionName(name);
    } else if (name.type === 'JSXNamespacedName') {
      return `${name.namespace.name}:${name.name.name}`;
    }
    
    return 'View';
  }

  /**
   * Get full name from JSX member expression
   * @param {object} memberExpression - JSX member expression node
   * @returns {string} Full member expression name
   */
  getMemberExpressionName(memberExpression) {
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
   * Process JSX children and convert to IR nodes
   * @param {array} children - Array of JSX children nodes
   * @param {number} depth - Current depth in tree
   * @returns {array} Array of IR nodes
   */
  processChildren(children, depth) {
    const irChildren = [];

    for (const child of children) {
      if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
        irChildren.push(this.jsxToNode(child, depth));
      } else if (child.type === 'JSXText') {
        const text = child.value.trim();
        if (text) {
          irChildren.push({
            id: this.generateNodeId(),
            type: 'Text',
            props: { text },
            children: [],
            metadata: {
              lineNumber: child.loc?.start.line || 0
            }
          });
        }
      } else if (child.type === 'JSXExpressionContainer') {
        const expressionValue = this.extractExpressionValue(child.expression);
        if (expressionValue !== null && expressionValue !== undefined) {
          if (typeof expressionValue === 'string') {
            irChildren.push({
              id: this.generateNodeId(),
              type: 'Text',
              props: { text: expressionValue },
              children: [],
              metadata: {
                lineNumber: child.loc?.start.line || 0
              }
            });
          }
        }
      }
    }

    return irChildren;
  }

  /**
   * Extract props from JSX attributes
   * @param {array} attributes - Array of JSX attribute nodes
   * @returns {object} Props object
   */
  extractProps(attributes) {
    const props = {};

    for (const attr of attributes) {
      if (attr.type === 'JSXAttribute') {
        const propName = this.getAttributeName(attr.name);
        
        // Skip event handlers (they're extracted separately)
        if (propName.startsWith('on')) {
          continue;
        }

        const propValue = this.getAttributeValue(attr.value);
        props[propName] = propValue;
      } else if (attr.type === 'JSXSpreadAttribute') {
        // Handle spread attributes
        props['...spread'] = this.extractExpressionValue(attr.argument);
      }
    }

    return props;
  }

  /**
   * Extract event handlers from JSX attributes
   * @param {array} attributes - Array of JSX attribute nodes
   * @returns {array} Array of event definitions
   */
  extractEvents(attributes) {
    const events = [];

    for (const attr of attributes) {
      if (attr.type === 'JSXAttribute') {
        const propName = this.getAttributeName(attr.name);
        
        // Only process event handlers
        if (propName.startsWith('on')) {
          const handler = this.extractEventHandler(attr.value);
          if (handler) {
            events.push({
              name: propName,
              handler: handler.code,
              parameters: handler.parameters
            });
          }
        }
      }
    }

    return events;
  }

  /**
   * Extract event handler information
   * @param {object} valueNode - JSX attribute value node
   * @returns {object|null} Event handler info
   */
  extractEventHandler(valueNode) {
    if (!valueNode || valueNode.type !== 'JSXExpressionContainer') {
      return null;
    }

    const expression = valueNode.expression;

    if (expression.type === 'ArrowFunctionExpression' || 
        expression.type === 'FunctionExpression') {
      return {
        code: this.functionToString(expression),
        parameters: this.extractFunctionParameters(expression)
      };
    } else if (expression.type === 'Identifier') {
      return {
        code: expression.name,
        parameters: []
      };
    } else if (expression.type === 'CallExpression') {
      return {
        code: this.expressionToString(expression),
        parameters: []
      };
    }

    return null;
  }

  /**
   * Extract function parameters
   * @param {object} functionNode - Function node
   * @returns {array} Array of parameters
   */
  extractFunctionParameters(functionNode) {
    return functionNode.params.map(param => ({
      name: param.name || 'param',
      type: 'any',
      optional: false
    }));
  }

  /**
   * Convert function to string representation
   * @param {object} functionNode - Function node
   * @returns {string} Function string
   */
  functionToString(functionNode) {
    const generate = require('@babel/generator').default;
    
    try {
      // Use Babel generator to convert AST back to code
      const result = generate(functionNode, {
        compact: true,
        concise: true
      });
      return result.code;
    } catch (error) {
      // Fallback to simplified representation
      const params = functionNode.params.map(p => p.name || 'param').join(', ');
      const isAsync = functionNode.async ? 'async ' : '';
      return `${isAsync}(${params}) => { /* handler */ }`;
    }
  }

  /**
   * Convert expression to string representation
   * @param {object} expression - Expression node
   * @returns {string} Expression string
   */
  expressionToString(expression) {
    if (expression.type === 'Identifier') {
      return expression.name;
    } else if (expression.type === 'CallExpression') {
      const callee = this.expressionToString(expression.callee);
      return `${callee}()`;
    }
    return 'expression';
  }

  /**
   * Find state references in props and children
   * @param {object} props - Props object
   * @param {array} children - Children array
   * @returns {array} Array of state variables
   */
  findStateReferences(props, children) {
    const refs = [];
    const stateNames = this.stateVariables.map(v => v.name);

    // Check props for state references
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const varName = value.slice(2, -2);
        const stateVar = this.stateVariables.find(v => v.name === varName);
        if (stateVar && !refs.find(r => r.name === varName)) {
          refs.push(stateVar);
        }
      }
    }

    return refs;
  }

  /**
   * Get attribute name from JSX attribute name node
   * @param {object} nameNode - JSX attribute name node
   * @returns {string} Attribute name
   */
  getAttributeName(nameNode) {
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
  getAttributeValue(valueNode) {
    if (!valueNode) {
      return true;
    }

    if (valueNode.type === 'StringLiteral') {
      return valueNode.value;
    }

    if (valueNode.type === 'JSXExpressionContainer') {
      return this.extractExpressionValue(valueNode.expression);
    }

    if (valueNode.type === 'JSXElement' || valueNode.type === 'JSXFragment') {
      return this.jsxToNode(valueNode);
    }

    return null;
  }

  /**
   * Extract value from expression node
   * @param {object} expression - Expression AST node
   * @returns {any} Extracted value
   */
  extractExpressionValue(expression) {
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
        return this.extractTemplateLiteral(expression);
      case 'ObjectExpression':
        return this.extractObjectExpression(expression);
      case 'ArrayExpression':
        return this.extractArrayExpression(expression);
      case 'Identifier':
        return `{{${expression.name}}}`;
      case 'MemberExpression':
        return this.extractMemberExpression(expression);
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return this.functionToString(expression);
      default:
        return null;
    }
  }

  /**
   * Extract member expression
   * @param {object} memberExpression - Member expression node
   * @returns {string} Member expression string
   */
  extractMemberExpression(memberExpression) {
    const parts = [];
    let current = memberExpression;

    while (current) {
      if (current.type === 'MemberExpression') {
        if (current.property.type === 'Identifier') {
          parts.unshift(current.property.name);
        }
        current = current.object;
      } else if (current.type === 'Identifier') {
        parts.unshift(current.name);
        break;
      } else {
        break;
      }
    }

    return `{{${parts.join('.')}}}`;
  }

  /**
   * Extract object expression to plain object
   * @param {object} objectExpression - Object expression node
   * @returns {object} Plain object
   */
  extractObjectExpression(objectExpression) {
    const obj = {};

    for (const prop of objectExpression.properties) {
      if (prop.type === 'ObjectProperty') {
        const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
        const value = this.extractExpressionValue(prop.value);
        obj[key] = value;
      }
    }

    return obj;
  }

  /**
   * Extract array expression to plain array
   * @param {object} arrayExpression - Array expression node
   * @returns {array} Plain array
   */
  extractArrayExpression(arrayExpression) {
    const arr = [];

    for (const element of arrayExpression.elements) {
      if (element) {
        const value = this.extractExpressionValue(element);
        arr.push(value);
      }
    }

    return arr;
  }

  /**
   * Extract template literal with placeholders
   * @param {object} templateLiteral - Template literal node
   * @returns {string} Template string with placeholders
   */
  extractTemplateLiteral(templateLiteral) {
    if (templateLiteral.expressions.length === 0 && templateLiteral.quasis.length === 1) {
      return templateLiteral.quasis[0].value.cooked;
    }

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
   * Write IR to JSON file
   * @param {object} ir - Lumora IR
   * @param {string} outputPath - Path to output JSON file
   */
  writeIRToFile(ir, outputPath) {
    try {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const jsonString = JSON.stringify(ir, null, 2);
      fs.writeFileSync(outputPath, jsonString, 'utf-8');
      
      console.log(`✓ Lumora IR generated successfully: ${outputPath}`);
    } catch (error) {
      throw new Error(`Failed to write IR to file ${outputPath}: ${error.message}`);
    }
  }

  /**
   * Convert TSX file to Lumora IR and write to output file
   * @param {string} inputPath - Path to input TSX file
   * @param {string} outputPath - Path to output JSON file
   * @returns {object} Generated IR object
   */
  convertFileToIR(inputPath, outputPath) {
    try {
      const ir = this.parseFile(inputPath);
      this.writeIRToFile(ir, outputPath);
      return ir;
    } catch (error) {
      console.error(`✗ Error converting TSX to IR: ${error.message}`);
      throw error;
    }
  }
}

module.exports = TSXToIR;
