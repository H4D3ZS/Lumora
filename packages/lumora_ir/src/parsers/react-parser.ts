/**
 * React/TSX Parser
 * Parses React components and converts them to Lumora IR
 */

import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { LumoraIR, LumoraNode, StateDefinition, StateVariable, EventDefinition, Parameter, LifecycleDefinition } from '../types/ir-types';
import { createIR, createNode } from '../utils/ir-utils';
import { ErrorHandler, getErrorHandler, ErrorSeverity, ErrorCategory } from '../errors/error-handler';

/**
 * Configuration for React parser
 */
export interface ReactParserConfig {
  sourceType?: 'module' | 'script';
  plugins?: parser.ParserPlugin[];
  errorHandler?: ErrorHandler;
}

/**
 * Component information extracted from AST
 */
export interface ComponentInfo {
  name: string;
  type: 'function' | 'class';
  node: t.Node;
  props: t.Identifier | t.ObjectPattern | null;
  body: t.BlockStatement | t.Expression;
  loc: t.SourceLocation | null;
}

/**
 * Hook information extracted from component
 */
export interface HookInfo {
  type: string;
  stateName?: string;
  setterName?: string;
  initialValue?: any;
  args: t.Expression[];
  loc: t.SourceLocation | null;
  effectFunction?: t.Function | t.ArrowFunctionExpression;
  dependencies?: string[];
  contextName?: string;
  refName?: string;
  memoFunction?: t.Function | t.ArrowFunctionExpression;
  callbackFunction?: t.Function | t.ArrowFunctionExpression;
}

/**
 * TypeScript type information
 */
export interface TypeInfo {
  name: string;
  kind: 'interface' | 'type' | 'enum';
  definition: string;
  properties?: Record<string, string>;
  members?: string[];
}

/**
 * React AST Parser
 * Converts React/TSX code to Lumora IR
 */
export class ReactParser {
  private ast: t.File | null = null;
  private sourceFile: string = '';
  private sourceCode: string = '';
  private errorHandler: ErrorHandler;
  private config: ReactParserConfig;
  private typeDefinitions: Map<string, TypeInfo> = new Map();

  constructor(config: ReactParserConfig = {}) {
    this.config = {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
      ...config,
    };
    this.errorHandler = config.errorHandler || getErrorHandler();
  }

  /**
   * Parse React/TSX source code to Lumora IR
   */
  parse(source: string, filename: string): LumoraIR {
    this.sourceFile = filename;
    this.sourceCode = source;

    try {
      this.ast = this.parseAST(source);
      
      // Extract TypeScript type definitions first
      this.extractTypeDefinitions(this.ast);
      
      const components = this.extractComponents(this.ast);
      const nodes = components.map(c => this.convertComponent(c));

      // Include type definitions in metadata if any were found
      const metadata = {
        sourceFramework: 'react' as const,
        sourceFile: filename,
        generatedAt: Date.now(),
      };

      if (this.typeDefinitions.size > 0) {
        (metadata as any).typeDefinitions = Array.from(this.typeDefinitions.values());
      }

      return createIR(metadata, nodes);
    } catch (error) {
      this.errorHandler.handleParseError({
        filePath: filename,
        errorMessage: `Failed to parse React file: ${error instanceof Error ? error.message : String(error)}`,
        sourceCode: source,
        framework: 'react',
      });
      throw error;
    }
  }

  /**
   * Parse source code to AST using Babel parser
   */
  private parseAST(source: string): t.File {
    try {
      return parser.parse(source, {
        sourceType: this.config.sourceType,
        plugins: this.config.plugins,
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.errorHandler.handleParseError({
          filePath: this.sourceFile,
          errorMessage: `Syntax error: ${error.message}`,
          sourceCode: source,
          framework: 'react',
        });
      }
      throw error;
    }
  }

  /**
   * Extract TypeScript type definitions from AST
   */
  private extractTypeDefinitions(ast: t.File): void {
    traverse(ast, {
      // Extract interface declarations
      TSInterfaceDeclaration: (path: NodePath<t.TSInterfaceDeclaration>) => {
        const name = path.node.id.name;
        const properties: Record<string, string> = {};
        
        path.node.body.body.forEach(member => {
          if (t.isTSPropertySignature(member) && t.isIdentifier(member.key)) {
            const propName = member.key.name;
            const propType = member.typeAnnotation 
              ? this.serializeTSType(member.typeAnnotation.typeAnnotation)
              : 'any';
            properties[propName] = propType;
          }
        });

        this.typeDefinitions.set(name, {
          name,
          kind: 'interface',
          definition: this.serializeInterfaceDeclaration(path.node),
          properties,
        });
      },

      // Extract type alias declarations
      TSTypeAliasDeclaration: (path: NodePath<t.TSTypeAliasDeclaration>) => {
        const name = path.node.id.name;
        const definition = this.serializeTypeAliasDeclaration(path.node);
        
        const typeInfo: TypeInfo = {
          name,
          kind: 'type',
          definition,
        };

        // If it's an object type, extract properties
        if (t.isTSTypeLiteral(path.node.typeAnnotation)) {
          const properties: Record<string, string> = {};
          path.node.typeAnnotation.members.forEach(member => {
            if (t.isTSPropertySignature(member) && t.isIdentifier(member.key)) {
              const propName = member.key.name;
              const propType = member.typeAnnotation
                ? this.serializeTSType(member.typeAnnotation.typeAnnotation)
                : 'any';
              properties[propName] = propType;
            }
          });
          typeInfo.properties = properties;
        }

        this.typeDefinitions.set(name, typeInfo);
      },

      // Extract enum declarations
      TSEnumDeclaration: (path: NodePath<t.TSEnumDeclaration>) => {
        const name = path.node.id.name;
        const members = path.node.members.map(member => {
          if (t.isIdentifier(member.id)) {
            return member.id.name;
          }
          if (t.isStringLiteral(member.id)) {
            return member.id.value;
          }
          return 'member';
        });

        this.typeDefinitions.set(name, {
          name,
          kind: 'enum',
          definition: this.serializeEnumDeclaration(path.node),
          members,
        });
      },
    });
  }

  /**
   * Serialize interface declaration to string
   */
  private serializeInterfaceDeclaration(node: t.TSInterfaceDeclaration): string {
    const name = node.id.name;
    const typeParams = node.typeParameters 
      ? this.serializeTSTypeParameterDeclaration(node.typeParameters)
      : '';
    const extendsClause = node.extends && node.extends.length > 0
      ? ` extends ${node.extends.map(e => this.serializeTSExpressionWithTypeArguments(e)).join(', ')}`
      : '';
    
    const members = node.body.body.map(member => {
      if (t.isTSPropertySignature(member)) {
        return this.serializeTSPropertySignature(member);
      }
      if (t.isTSMethodSignature(member)) {
        return this.serializeTSMethodSignature(member);
      }
      return '';
    }).filter(Boolean).join('\n  ');

    return `interface ${name}${typeParams}${extendsClause} {\n  ${members}\n}`;
  }

  /**
   * Serialize type alias declaration to string
   */
  private serializeTypeAliasDeclaration(node: t.TSTypeAliasDeclaration): string {
    const name = node.id.name;
    const typeParams = node.typeParameters
      ? this.serializeTSTypeParameterDeclaration(node.typeParameters)
      : '';
    const typeAnnotation = this.serializeTSType(node.typeAnnotation);
    
    return `type ${name}${typeParams} = ${typeAnnotation}`;
  }

  /**
   * Serialize enum declaration to string
   */
  private serializeEnumDeclaration(node: t.TSEnumDeclaration): string {
    const name = node.id.name;
    const members = node.members.map(member => {
      const id = t.isIdentifier(member.id) ? member.id.name : 
                 t.isStringLiteral(member.id) ? `'${member.id.value}'` : 'member';
      const initializer = member.initializer 
        ? ` = ${this.serializeExpression(member.initializer)}`
        : '';
      return `  ${id}${initializer}`;
    }).join(',\n');

    return `enum ${name} {\n${members}\n}`;
  }

  /**
   * Serialize TypeScript type parameter declaration
   */
  private serializeTSTypeParameterDeclaration(node: t.TSTypeParameterDeclaration): string {
    const params = node.params.map(param => {
      let result = param.name;
      if (param.constraint) {
        result += ` extends ${this.serializeTSType(param.constraint)}`;
      }
      if (param.default) {
        result += ` = ${this.serializeTSType(param.default)}`;
      }
      return result;
    }).join(', ');
    return `<${params}>`;
  }

  /**
   * Serialize TypeScript expression with type arguments
   */
  private serializeTSExpressionWithTypeArguments(node: t.TSExpressionWithTypeArguments): string {
    const expression = t.isIdentifier(node.expression) ? node.expression.name : 'Type';
    const typeParams = node.typeParameters
      ? this.serializeTSTypeParameterInstantiation(node.typeParameters)
      : '';
    return `${expression}${typeParams}`;
  }

  /**
   * Serialize TypeScript type parameter instantiation
   */
  private serializeTSTypeParameterInstantiation(node: t.TSTypeParameterInstantiation): string {
    const params = node.params.map(param => this.serializeTSType(param)).join(', ');
    return `<${params}>`;
  }

  /**
   * Serialize TypeScript property signature
   */
  private serializeTSPropertySignature(node: t.TSPropertySignature): string {
    const key = t.isIdentifier(node.key) ? node.key.name : 'property';
    const optional = node.optional ? '?' : '';
    const readonly = node.readonly ? 'readonly ' : '';
    const typeAnnotation = node.typeAnnotation
      ? `: ${this.serializeTSType(node.typeAnnotation.typeAnnotation)}`
      : '';
    return `${readonly}${key}${optional}${typeAnnotation};`;
  }

  /**
   * Serialize TypeScript method signature
   */
  private serializeTSMethodSignature(node: t.TSMethodSignature): string {
    const key = t.isIdentifier(node.key) ? node.key.name : 'method';
    const optional = node.optional ? '?' : '';
    const typeParams = node.typeParameters
      ? this.serializeTSTypeParameterDeclaration(node.typeParameters)
      : '';
    const params = node.parameters.map(param => {
      if (t.isIdentifier(param)) {
        return param.name;
      }
      return 'param';
    }).join(', ');
    const returnType = node.typeAnnotation
      ? `: ${this.serializeTSType(node.typeAnnotation.typeAnnotation)}`
      : '';
    return `${key}${optional}${typeParams}(${params})${returnType};`;
  }

  /**
   * Extract all React components from AST
   */
  extractComponents(ast: t.File): ComponentInfo[] {
    const components: ComponentInfo[] = [];

    traverse(ast, {
      // Function components (arrow functions and function declarations)
      FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => {
        if (this.isFunctionComponent(path)) {
          components.push({
            name: path.node.id?.name || 'Anonymous',
            type: 'function',
            node: path.node,
            props: path.node.params[0] as t.Identifier | t.ObjectPattern | null,
            body: path.node.body,
            loc: path.node.loc || null,
          });
        }
      },

      // Arrow function components assigned to variables
      VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => {
        if (
          t.isIdentifier(path.node.id) &&
          t.isArrowFunctionExpression(path.node.init) &&
          this.isArrowFunctionComponent(path.get('init') as NodePath<t.ArrowFunctionExpression>)
        ) {
          const arrowFunc = path.node.init;
          components.push({
            name: path.node.id.name,
            type: 'function',
            node: arrowFunc,
            props: arrowFunc.params[0] as t.Identifier | t.ObjectPattern | null,
            body: t.isBlockStatement(arrowFunc.body) ? arrowFunc.body : arrowFunc.body,
            loc: arrowFunc.loc || null,
          });
        }
      },

      // Class components
      ClassDeclaration: (path: NodePath<t.ClassDeclaration>) => {
        if (this.isClassComponent(path)) {
          const renderMethod = this.findRenderMethod(path);
          if (renderMethod) {
            components.push({
              name: path.node.id?.name || 'Anonymous',
              type: 'class',
              node: path.node,
              props: null,
              body: renderMethod.body,
              loc: path.node.loc || null,
            });
          }
        }
      },
    });

    return components;
  }

  /**
   * Check if a function declaration is a React component
   */
  private isFunctionComponent(path: NodePath<t.FunctionDeclaration>): boolean {
    const name = path.node.id?.name;
    if (!name) return false;

    // Component names should start with uppercase
    if (!/^[A-Z]/.test(name)) return false;

    // Check if it returns JSX
    return this.returnsJSX(path);
  }

  /**
   * Check if an arrow function is a React component
   */
  private isArrowFunctionComponent(path: NodePath<t.ArrowFunctionExpression>): boolean {
    return this.returnsJSX(path);
  }

  /**
   * Check if a class is a React component
   */
  private isClassComponent(path: NodePath<t.ClassDeclaration>): boolean {
    const superClass = path.node.superClass;
    if (!superClass) return false;

    // Check if extends React.Component or Component
    if (t.isMemberExpression(superClass)) {
      return (
        t.isIdentifier(superClass.object, { name: 'React' }) &&
        t.isIdentifier(superClass.property, { name: 'Component' })
      );
    }

    if (t.isIdentifier(superClass)) {
      return superClass.name === 'Component' || superClass.name === 'PureComponent';
    }

    return false;
  }

  /**
   * Check if a function/arrow function returns JSX
   */
  private returnsJSX(path: NodePath<t.Function>): boolean {
    let hasJSX = false;

    path.traverse({
      ReturnStatement(returnPath) {
        if (returnPath.node.argument && t.isJSXElement(returnPath.node.argument)) {
          hasJSX = true;
          returnPath.stop();
        }
      },
      JSXElement(jsxPath) {
        // For arrow functions with implicit return
        if (t.isArrowFunctionExpression(path.node) && !t.isBlockStatement(path.node.body)) {
          hasJSX = true;
          jsxPath.stop();
        }
      },
    });

    return hasJSX;
  }

  /**
   * Find render method in class component
   */
  private findRenderMethod(path: NodePath<t.ClassDeclaration>): t.ClassMethod | null {
    for (const item of path.node.body.body) {
      if (
        t.isClassMethod(item) &&
        t.isIdentifier(item.key, { name: 'render' }) &&
        item.kind === 'method'
      ) {
        return item;
      }
    }
    return null;
  }

  /**
   * Convert component to Lumora node
   */
  private convertComponent(component: ComponentInfo): LumoraNode {
    const node = createNode(
      component.name,
      {},
      [],
      component.loc?.start.line || 0
    );

    // Extract props
    if (component.props) {
      node.props = this.extractProps(component.props);
    }

    // Extract generic type parameters if present
    const genericParams = this.extractGenericParameters(component.node);
    if (genericParams.length > 0) {
      (node.metadata as any).genericParameters = genericParams;
    }

    // Extract decorators if present (for class components)
    if (component.type === 'class' && t.isClassDeclaration(component.node)) {
      const decorators = this.extractDecorators(component.node);
      if (decorators.length > 0) {
        (node.metadata as any).decorators = decorators;
      }
    }

    // Extract state (hooks for function components)
    if (component.type === 'function') {
      const state = this.extractState(component);
      if (state) {
        node.state = state;
      }
      
      // Extract lifecycle events from hooks
      const lifecycle = this.extractLifecycle(component);
      if (lifecycle && lifecycle.length > 0) {
        node.lifecycle = lifecycle;
      }
    }

    // Extract events
    node.events = this.extractEvents(component);

    // Convert JSX to children
    node.children = this.convertJSX(component.body);

    return node;
  }

  /**
   * Extract generic type parameters from component
   */
  private extractGenericParameters(node: t.Node): string[] {
    const params: string[] = [];

    if (t.isFunctionDeclaration(node) && node.typeParameters && t.isTSTypeParameterDeclaration(node.typeParameters)) {
      node.typeParameters.params.forEach((param: t.TSTypeParameter) => {
        params.push(param.name);
      });
    } else if (t.isArrowFunctionExpression(node) && node.typeParameters && t.isTSTypeParameterDeclaration(node.typeParameters)) {
      node.typeParameters.params.forEach((param: t.TSTypeParameter) => {
        params.push(param.name);
      });
    } else if (t.isClassDeclaration(node) && node.typeParameters && t.isTSTypeParameterDeclaration(node.typeParameters)) {
      node.typeParameters.params.forEach((param: t.TSTypeParameter) => {
        params.push(param.name);
      });
    }

    return params;
  }

  /**
   * Extract decorators from class component
   */
  private extractDecorators(node: t.ClassDeclaration): string[] {
    const decorators: string[] = [];

    if (node.decorators) {
      node.decorators.forEach(decorator => {
        const expression = decorator.expression;
        if (t.isIdentifier(expression)) {
          decorators.push(`@${expression.name}`);
        } else if (t.isCallExpression(expression)) {
          const callee = expression.callee;
          if (t.isIdentifier(callee)) {
            const args = expression.arguments.map(arg => {
              if (t.isExpression(arg)) {
                return this.serializeExpression(arg);
              }
              return '';
            }).join(', ');
            decorators.push(`@${callee.name}(${args})`);
          }
        }
      });
    }

    return decorators;
  }

  /**
   * Extract props from component parameters
   */
  private extractProps(propsParam: t.Identifier | t.ObjectPattern): Record<string, any> {
    const props: Record<string, any> = {};

    if (t.isObjectPattern(propsParam)) {
      // Destructured props: { prop1, prop2 }
      propsParam.properties.forEach(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const propName = prop.key.name;
          let propType = 'any';
          
          // Extract type from TypeScript type annotation
          if (t.isIdentifier(prop.value) && prop.value.typeAnnotation && t.isTSTypeAnnotation(prop.value.typeAnnotation)) {
            propType = this.serializeTSType(prop.value.typeAnnotation.typeAnnotation);
          }
          
          props[propName] = { type: propType };
        }
      });
    } else if (t.isIdentifier(propsParam)) {
      // Props object: props
      // Check if there's a TypeScript type annotation
      if (propsParam.typeAnnotation && t.isTSTypeAnnotation(propsParam.typeAnnotation)) {
        const tsType = propsParam.typeAnnotation.typeAnnotation;
        
        // If it's a type reference, look up the type definition
        if (t.isTSTypeReference(tsType) && t.isIdentifier(tsType.typeName)) {
          const typeName = tsType.typeName.name;
          const typeInfo = this.typeDefinitions.get(typeName);
          
          if (typeInfo && typeInfo.properties) {
            // Use the properties from the type definition
            Object.entries(typeInfo.properties).forEach(([propName, propType]) => {
              props[propName] = { type: propType };
            });
          } else {
            // Store the type reference
            props[propsParam.name] = { type: typeName };
          }
        } else if (t.isTSTypeLiteral(tsType)) {
          // Inline type literal
          tsType.members.forEach(member => {
            if (t.isTSPropertySignature(member) && t.isIdentifier(member.key)) {
              const propName = member.key.name;
              const propType = member.typeAnnotation
                ? this.serializeTSType(member.typeAnnotation.typeAnnotation)
                : 'any';
              props[propName] = { type: propType };
            }
          });
        } else {
          // Other type annotation
          props[propsParam.name] = { type: this.serializeTSType(tsType) };
        }
      } else {
        props[propsParam.name] = { type: 'any' };
      }
    }

    return props;
  }

  /**
   * Extract state from component (hooks)
   */
  private extractState(component: ComponentInfo): StateDefinition | undefined {
    const hooks = this.findHooks(component);
    if (hooks.length === 0) return undefined;

    const variables: StateVariable[] = [];

    hooks.forEach(hook => {
      switch (hook.type) {
        case 'useState':
          // Extract useState state variable
          variables.push({
            name: hook.stateName || 'state',
            type: this.inferType(hook.initialValue),
            initialValue: hook.initialValue,
            mutable: true,
          });
          break;
        
        case 'useContext':
          // Extract context value as state variable
          if (hook.stateName) {
            variables.push({
              name: hook.stateName,
              type: 'any', // Type would need to be inferred from context definition
              initialValue: null,
              mutable: false,
            });
          }
          break;
        
        case 'useRef':
          // Extract ref as state variable
          if (hook.refName) {
            variables.push({
              name: hook.refName,
              type: 'ref',
              initialValue: hook.initialValue,
              mutable: true,
            });
          }
          break;
        
        case 'useMemo':
          // Extract memoized value as state variable
          if (hook.stateName) {
            variables.push({
              name: hook.stateName,
              type: 'any', // Type would need to be inferred from memo function
              initialValue: null,
              mutable: false,
            });
          }
          break;
        
        case 'useCallback':
          // Extract memoized callback as state variable
          if (hook.stateName) {
            variables.push({
              name: hook.stateName,
              type: 'function',
              initialValue: null,
              mutable: false,
            });
          }
          break;
        
        default:
          // Handle custom hooks
          if (hook.stateName && hook.type.startsWith('use')) {
            variables.push({
              name: hook.stateName,
              type: 'any',
              initialValue: null,
              mutable: true,
            });
          }
          break;
      }
    });

    if (variables.length === 0) return undefined;

    return {
      type: 'local',
      variables,
    };
  }

  /**
   * Extract lifecycle events from hooks
   */
  private extractLifecycle(component: ComponentInfo): LifecycleDefinition[] {
    const hooks = this.findHooks(component);
    const lifecycle: LifecycleDefinition[] = [];

    hooks.forEach(hook => {
      if (hook.type === 'useEffect') {
        // Convert useEffect to lifecycle event
        const lifecycleType = this.determineLifecycleType(hook.dependencies);
        const handler = this.extractEffectHandler(hook.effectFunction);
        
        lifecycle.push({
          type: lifecycleType,
          handler,
          dependencies: hook.dependencies,
        });
      }
    });

    return lifecycle;
  }

  /**
   * Determine lifecycle type based on dependencies
   */
  private determineLifecycleType(dependencies?: string[]): 'mount' | 'unmount' | 'update' | 'effect' {
    if (!dependencies) {
      // No dependency array means run on every render
      return 'update';
    }
    
    if (dependencies.length === 0) {
      // Empty dependency array means run only on mount
      return 'mount';
    }
    
    // Has dependencies means run when dependencies change
    return 'effect';
  }

  /**
   * Extract handler code from effect function
   */
  private extractEffectHandler(effectFunction?: t.Function | t.ArrowFunctionExpression): string {
    if (!effectFunction) {
      return '/* effect handler */';
    }

    // For now, return a placeholder
    // In a full implementation, we would serialize the function body
    return '/* effect handler */';
  }

  /**
   * Find all hooks in component
   */
  private findHooks(component: ComponentInfo): HookInfo[] {
    const hooks: HookInfo[] = [];
    const bodyNode = component.node;

    traverse(
      t.file(t.program([t.isStatement(bodyNode) ? bodyNode : t.expressionStatement(bodyNode as t.Expression)])),
      {
        CallExpression: (path: NodePath<t.CallExpression>) => {
          const callee = path.node.callee;
          if (t.isIdentifier(callee) && callee.name.startsWith('use')) {
            const hookInfo: HookInfo = {
              type: callee.name,
              args: path.node.arguments as t.Expression[],
              loc: path.node.loc || null,
            };

            // Extract hook-specific information based on type
            switch (callee.name) {
              case 'useState':
                this.extractUseStateInfo(path, hookInfo);
                if (hookInfo.args.length > 0) {
                  hookInfo.initialValue = this.extractValue(hookInfo.args[0]);
                }
                break;
              
              case 'useEffect':
                this.extractUseEffectInfo(path, hookInfo);
                break;
              
              case 'useContext':
                this.extractUseContextInfo(path, hookInfo);
                break;
              
              case 'useRef':
                this.extractUseRefInfo(path, hookInfo);
                break;
              
              case 'useMemo':
                this.extractUseMemoInfo(path, hookInfo);
                break;
              
              case 'useCallback':
                this.extractUseCallbackInfo(path, hookInfo);
                break;
              
              default:
                // Handle custom hooks
                this.extractCustomHookInfo(path, hookInfo);
                break;
            }

            hooks.push(hookInfo);
          }
        },
      },
      undefined,
      {}
    );

    return hooks;
  }

  /**
   * Extract useState-specific information
   */
  private extractUseStateInfo(path: NodePath<t.CallExpression>, hookInfo: HookInfo): void {
    // Look for the variable declarator pattern: const [state, setState] = useState(...)
    let parent = path.parent;
    
    // Handle case where parent is VariableDeclarator
    if (t.isVariableDeclarator(parent)) {
      const id = parent.id;
      if (t.isArrayPattern(id) && id.elements.length >= 2) {
        const stateElement = id.elements[0];
        const setterElement = id.elements[1];
        
        if (t.isIdentifier(stateElement)) {
          hookInfo.stateName = stateElement.name;
        }
        if (t.isIdentifier(setterElement)) {
          hookInfo.setterName = setterElement.name;
        }
      }
    }
  }

  /**
   * Extract useEffect-specific information
   */
  private extractUseEffectInfo(path: NodePath<t.CallExpression>, hookInfo: HookInfo): void {
    // useEffect(effectFunction, [dependencies])
    const args = hookInfo.args;
    
    // Extract effect function (first argument)
    if (args.length > 0) {
      const effectArg = args[0];
      if (t.isArrowFunctionExpression(effectArg) || t.isFunctionExpression(effectArg)) {
        hookInfo.effectFunction = effectArg;
      }
    }
    
    // Extract dependencies (second argument)
    if (args.length > 1) {
      const depsArg = args[1];
      if (t.isArrayExpression(depsArg)) {
        hookInfo.dependencies = depsArg.elements
          .filter((el): el is t.Identifier => t.isIdentifier(el))
          .map(el => el.name);
      }
    }
  }

  /**
   * Extract useContext-specific information
   */
  private extractUseContextInfo(path: NodePath<t.CallExpression>, hookInfo: HookInfo): void {
    // const value = useContext(MyContext)
    const args = hookInfo.args;
    
    // Extract context name from argument
    if (args.length > 0) {
      const contextArg = args[0];
      if (t.isIdentifier(contextArg)) {
        hookInfo.contextName = contextArg.name;
      }
    }
    
    // Extract variable name from parent
    const parent = path.parent;
    if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
      hookInfo.stateName = parent.id.name;
    }
  }

  /**
   * Extract useRef-specific information
   */
  private extractUseRefInfo(path: NodePath<t.CallExpression>, hookInfo: HookInfo): void {
    // const ref = useRef(initialValue)
    const args = hookInfo.args;
    
    // Extract initial value
    if (args.length > 0) {
      hookInfo.initialValue = this.extractValue(args[0]);
    }
    
    // Extract ref variable name from parent
    const parent = path.parent;
    if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
      hookInfo.refName = parent.id.name;
    }
  }

  /**
   * Extract useMemo-specific information
   */
  private extractUseMemoInfo(path: NodePath<t.CallExpression>, hookInfo: HookInfo): void {
    // const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b])
    const args = hookInfo.args;
    
    // Extract memo function (first argument)
    if (args.length > 0) {
      const memoArg = args[0];
      if (t.isArrowFunctionExpression(memoArg) || t.isFunctionExpression(memoArg)) {
        hookInfo.memoFunction = memoArg;
      }
    }
    
    // Extract dependencies (second argument)
    if (args.length > 1) {
      const depsArg = args[1];
      if (t.isArrayExpression(depsArg)) {
        hookInfo.dependencies = depsArg.elements
          .filter((el): el is t.Identifier => t.isIdentifier(el))
          .map(el => el.name);
      }
    }
    
    // Extract variable name from parent
    const parent = path.parent;
    if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
      hookInfo.stateName = parent.id.name;
    }
  }

  /**
   * Extract useCallback-specific information
   */
  private extractUseCallbackInfo(path: NodePath<t.CallExpression>, hookInfo: HookInfo): void {
    // const memoizedCallback = useCallback(() => { doSomething(a, b); }, [a, b])
    const args = hookInfo.args;
    
    // Extract callback function (first argument)
    if (args.length > 0) {
      const callbackArg = args[0];
      if (t.isArrowFunctionExpression(callbackArg) || t.isFunctionExpression(callbackArg)) {
        hookInfo.callbackFunction = callbackArg;
      }
    }
    
    // Extract dependencies (second argument)
    if (args.length > 1) {
      const depsArg = args[1];
      if (t.isArrayExpression(depsArg)) {
        hookInfo.dependencies = depsArg.elements
          .filter((el): el is t.Identifier => t.isIdentifier(el))
          .map(el => el.name);
      }
    }
    
    // Extract variable name from parent
    const parent = path.parent;
    if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
      hookInfo.stateName = parent.id.name;
    }
  }

  /**
   * Extract custom hook information
   */
  private extractCustomHookInfo(path: NodePath<t.CallExpression>, hookInfo: HookInfo): void {
    // Custom hooks can return anything, so we extract the variable name
    const parent = path.parent;
    if (t.isVariableDeclarator(parent)) {
      if (t.isIdentifier(parent.id)) {
        hookInfo.stateName = parent.id.name;
      } else if (t.isArrayPattern(parent.id)) {
        // Handle destructured return values
        const elements = parent.id.elements;
        if (elements.length > 0 && t.isIdentifier(elements[0])) {
          hookInfo.stateName = elements[0].name;
        }
      } else if (t.isObjectPattern(parent.id)) {
        // Handle object destructuring
        const properties = parent.id.properties;
        if (properties.length > 0 && t.isObjectProperty(properties[0]) && t.isIdentifier(properties[0].key)) {
          hookInfo.stateName = properties[0].key.name;
        }
      }
    }
  }

  /**
   * Extract events from component
   */
  private extractEvents(component: ComponentInfo): EventDefinition[] {
    const events: EventDefinition[] = [];
    const bodyNode = component.node;

    // Extract event handlers from JSX attributes
    traverse(
      t.file(t.program([t.isStatement(bodyNode) ? bodyNode : t.expressionStatement(bodyNode as t.Expression)])),
      {
        JSXAttribute: (path: NodePath<t.JSXAttribute>) => {
          const name = path.node.name;
          if (t.isJSXIdentifier(name) && name.name.startsWith('on')) {
            const value = path.node.value;
            if (value && t.isJSXExpressionContainer(value)) {
              const handler = this.extractHandlerCode(value.expression);
              const parameters = this.extractHandlerParams(value.expression);

              events.push({
                name: name.name,
                handler,
                parameters,
              });
            }
          }
        },
      },
      undefined,
      {}
    );

    // Extract class component methods
    if (component.type === 'class' && t.isClassDeclaration(component.node)) {
      const classMethods = this.extractClassMethods(component.node);
      events.push(...classMethods);
    }

    // Extract function component helper functions
    if (component.type === 'function') {
      const helperFunctions = this.extractHelperFunctions(component);
      events.push(...helperFunctions);
    }

    return events;
  }

  /**
   * Extract methods from class component
   */
  private extractClassMethods(classNode: t.ClassDeclaration): EventDefinition[] {
    const methods: EventDefinition[] = [];

    classNode.body.body.forEach(member => {
      if (t.isClassMethod(member) && member.kind === 'method') {
        // Skip lifecycle methods and render
        const methodName = t.isIdentifier(member.key) ? member.key.name : '';
        if (this.isLifecycleMethod(methodName) || methodName === 'render') {
          return;
        }

        // Extract method signature
        const parameters = member.params.map(param => {
          if (t.isIdentifier(param)) {
            return {
              name: param.name,
              type: this.inferParamType(param),
              optional: false,
            };
          }
          if (t.isObjectPattern(param)) {
            return {
              name: 'props',
              type: 'object',
              optional: false,
            };
          }
          if (t.isArrayPattern(param)) {
            return {
              name: 'items',
              type: 'array',
              optional: false,
            };
          }
          return {
            name: 'param',
            type: 'any',
            optional: false,
          };
        });

        // Serialize method body
        const handler = this.serializeClassMethod(member);

        methods.push({
          name: methodName,
          handler,
          parameters,
        });
      }

      // Also extract arrow function properties (class fields)
      if (t.isClassProperty(member)) {
        const propertyName = t.isIdentifier(member.key) ? member.key.name : '';
        if (propertyName.startsWith('handle') || propertyName.startsWith('on')) {
          const value = member.value;
          if (value && (t.isArrowFunctionExpression(value) || t.isFunctionExpression(value))) {
            const parameters = this.extractHandlerParams(value);
            const handler = this.serializeFunction(value);

            methods.push({
              name: propertyName,
              handler,
              parameters,
            });
          }
        }
      }
    });

    return methods;
  }

  /**
   * Check if method name is a React lifecycle method
   */
  private isLifecycleMethod(name: string): boolean {
    const lifecycleMethods = [
      'constructor',
      'componentDidMount',
      'componentDidUpdate',
      'componentWillUnmount',
      'shouldComponentUpdate',
      'getSnapshotBeforeUpdate',
      'componentDidCatch',
      'getDerivedStateFromProps',
      'getDerivedStateFromError',
    ];
    return lifecycleMethods.includes(name);
  }

  /**
   * Serialize class method to string
   */
  private serializeClassMethod(method: t.ClassMethod): string {
    const params = method.params.map(param => {
      if (t.isIdentifier(param)) {
        return param.name;
      }
      if (t.isObjectPattern(param)) {
        return this.serializeObjectPattern(param);
      }
      if (t.isArrayPattern(param)) {
        return this.serializeArrayPattern(param);
      }
      return 'param';
    }).join(', ');

    const body = this.serializeFunctionBody(method.body);

    if (method.async) {
      return `async (${params}) => ${body}`;
    }
    return `(${params}) => ${body}`;
  }

  /**
   * Extract helper functions from function component
   */
  private extractHelperFunctions(component: ComponentInfo): EventDefinition[] {
    const helpers: EventDefinition[] = [];
    const bodyNode = component.node;

    // Find function declarations and variable declarations with function values
    traverse(
      t.file(t.program([t.isStatement(bodyNode) ? bodyNode : t.expressionStatement(bodyNode as t.Expression)])),
      {
        // Function declarations inside component
        FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => {
          const name = path.node.id?.name;
          if (name && (name.startsWith('handle') || name.startsWith('on'))) {
            const parameters = path.node.params.map(param => {
              if (t.isIdentifier(param)) {
                return {
                  name: param.name,
                  type: this.inferParamType(param),
                  optional: false,
                };
              }
              return {
                name: 'param',
                type: 'any',
                optional: false,
              };
            });

            const handler = this.serializeHelperFunction(path.node);

            helpers.push({
              name,
              handler,
              parameters,
            });
          }
        },

        // Variable declarations with function values
        VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => {
          if (t.isIdentifier(path.node.id)) {
            const name = path.node.id.name;
            if (name.startsWith('handle') || name.startsWith('on')) {
              const init = path.node.init;
              if (init && (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init))) {
                const parameters = this.extractHandlerParams(init);
                const handler = this.serializeFunction(init);

                helpers.push({
                  name,
                  handler,
                  parameters,
                });
              }
            }
          }
        },
      },
      undefined,
      {}
    );

    return helpers;
  }

  /**
   * Serialize helper function declaration to string
   */
  private serializeHelperFunction(func: t.FunctionDeclaration): string {
    const name = func.id?.name || 'anonymous';
    const params = func.params.map(param => {
      if (t.isIdentifier(param)) {
        return param.name;
      }
      if (t.isObjectPattern(param)) {
        return this.serializeObjectPattern(param);
      }
      if (t.isArrayPattern(param)) {
        return this.serializeArrayPattern(param);
      }
      return 'param';
    }).join(', ');

    const body = this.serializeFunctionBody(func.body);

    if (func.async) {
      return `async function ${name}(${params}) ${body}`;
    }
    return `function ${name}(${params}) ${body}`;
  }

  /**
   * Convert JSX to Lumora nodes
   */
  private convertJSX(body: t.BlockStatement | t.Expression): LumoraNode[] {
    const nodes: LumoraNode[] = [];

    // Find JSX elements in the body
    const findJSX = (node: t.Node): t.JSXElement[] => {
      const elements: t.JSXElement[] = [];

      if (t.isJSXElement(node)) {
        elements.push(node);
      } else if (t.isBlockStatement(node)) {
        node.body.forEach(statement => {
          if (t.isReturnStatement(statement) && statement.argument) {
            elements.push(...findJSX(statement.argument));
          }
        });
      } else if (t.isReturnStatement(node) && node.argument) {
        elements.push(...findJSX(node.argument));
      }

      return elements;
    };

    const jsxElements = findJSX(body);
    jsxElements.forEach(jsx => {
      const converted = this.convertJSXElement(jsx);
      if (converted) {
        nodes.push(converted);
      }
    });

    return nodes;
  }

  /**
   * Convert a single JSX element to Lumora node
   */
  private convertJSXElement(jsx: t.JSXElement): LumoraNode | null {
    const opening = jsx.openingElement;
    const tagName = this.getJSXTagName(opening.name);

    if (!tagName) return null;

    const props = this.extractJSXProps(opening.attributes);
    const children = this.convertJSXChildren(jsx.children);

    return createNode(
      tagName,
      props,
      children,
      jsx.loc?.start.line || 0
    );
  }

  /**
   * Get tag name from JSX element name
   */
  private getJSXTagName(name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName): string | null {
    if (t.isJSXIdentifier(name)) {
      return name.name;
    }
    if (t.isJSXMemberExpression(name)) {
      // Handle React.Fragment, etc.
      return this.getJSXTagName(name.property);
    }
    return null;
  }

  /**
   * Extract props from JSX attributes
   */
  private extractJSXProps(attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute>): Record<string, any> {
    const props: Record<string, any> = {};

    attributes.forEach(attr => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
        const name = attr.name.name;
        const value = this.extractJSXValue(attr.value);
        props[name] = value;
      }
      // TODO: Handle spread attributes
    });

    return props;
  }

  /**
   * Extract value from JSX attribute value
   */
  private extractJSXValue(value: t.JSXAttribute['value']): any {
    if (!value) return true; // Boolean attribute

    if (t.isStringLiteral(value)) {
      return value.value;
    }

    if (t.isJSXExpressionContainer(value)) {
      return this.extractValue(value.expression);
    }

    return null;
  }

  /**
   * Convert JSX children to Lumora nodes
   */
  private convertJSXChildren(children: Array<t.JSXText | t.JSXExpressionContainer | t.JSXSpreadChild | t.JSXElement | t.JSXFragment>): LumoraNode[] {
    const nodes: LumoraNode[] = [];

    children.forEach(child => {
      if (t.isJSXElement(child)) {
        const node = this.convertJSXElement(child);
        if (node) nodes.push(node);
      } else if (t.isJSXText(child)) {
        const text = child.value.trim();
        if (text) {
          nodes.push(createNode('Text', { text }, [], child.loc?.start.line || 0));
        }
      } else if (t.isJSXExpressionContainer(child)) {
        // Handle expressions in JSX
        const value = this.extractValue(child.expression);
        if (value !== null && value !== undefined) {
          nodes.push(createNode('Text', { text: String(value) }, [], child.loc?.start.line || 0));
        }
      }
      // TODO: Handle JSXFragment
    });

    return nodes;
  }

  /**
   * Extract handler code from expression
   */
  private extractHandlerCode(expression: t.Expression | t.JSXEmptyExpression): string {
    if (t.isJSXEmptyExpression(expression)) return '';

    // Handle arrow functions: () => { ... } or () => expression
    if (t.isArrowFunctionExpression(expression)) {
      return this.serializeFunction(expression);
    }

    // Handle function expressions: function() { ... }
    if (t.isFunctionExpression(expression)) {
      return this.serializeFunction(expression);
    }

    // Handle function references: handleClick
    if (t.isIdentifier(expression)) {
      return expression.name;
    }

    // Handle member expressions: this.handleClick or obj.method
    if (t.isMemberExpression(expression)) {
      return this.serializeMemberExpression(expression);
    }

    // Handle call expressions: handleClick() or createHandler()
    if (t.isCallExpression(expression)) {
      return this.serializeCallExpression(expression);
    }

    // For other expressions, return a placeholder
    return '/* complex handler expression */';
  }

  /**
   * Extract handler parameters from expression
   */
  private extractHandlerParams(expression: t.Expression | t.JSXEmptyExpression): Parameter[] {
    if (t.isJSXEmptyExpression(expression)) return [];

    // Extract parameters from arrow functions and function expressions
    if (t.isArrowFunctionExpression(expression) || t.isFunctionExpression(expression)) {
      return expression.params.map(param => {
        if (t.isIdentifier(param)) {
          return {
            name: param.name,
            type: this.inferParamType(param),
            optional: false,
          };
        }
        if (t.isObjectPattern(param)) {
          // Handle destructured parameters: ({ prop1, prop2 }) => { ... }
          return {
            name: 'props',
            type: 'object',
            optional: false,
          };
        }
        if (t.isArrayPattern(param)) {
          // Handle array destructured parameters: ([item1, item2]) => { ... }
          return {
            name: 'items',
            type: 'array',
            optional: false,
          };
        }
        if (t.isRestElement(param)) {
          // Handle rest parameters: (...args) => { ... }
          const argument = param.argument;
          if (t.isIdentifier(argument)) {
            return {
              name: argument.name,
              type: 'array',
              optional: false,
            };
          }
        }
        return {
          name: 'param',
          type: 'any',
          optional: false,
        };
      });
    }

    // For function references, we can't determine parameters without additional analysis
    return [];
  }

  /**
   * Serialize a function (arrow or regular) to string
   */
  private serializeFunction(func: t.ArrowFunctionExpression | t.FunctionExpression): string {
    const params = func.params.map(param => {
      if (t.isIdentifier(param)) {
        return param.name;
      }
      if (t.isObjectPattern(param)) {
        return this.serializeObjectPattern(param);
      }
      if (t.isArrayPattern(param)) {
        return this.serializeArrayPattern(param);
      }
      if (t.isRestElement(param)) {
        const argument = param.argument;
        if (t.isIdentifier(argument)) {
          return `...${argument.name}`;
        }
      }
      return 'param';
    }).join(', ');

    const body = this.serializeFunctionBody(func.body);

    // Arrow function
    if (t.isArrowFunctionExpression(func)) {
      if (func.async) {
        return `async (${params}) => ${body}`;
      }
      return `(${params}) => ${body}`;
    }

    // Regular function
    if (func.async) {
      return `async function(${params}) ${body}`;
    }
    return `function(${params}) ${body}`;
  }

  /**
   * Serialize function body to string
   */
  private serializeFunctionBody(body: t.BlockStatement | t.Expression): string {
    if (t.isBlockStatement(body)) {
      // For block statements, extract the code
      const statements = body.body.map(stmt => this.serializeStatement(stmt)).join('\n  ');
      return `{\n  ${statements}\n}`;
    }

    // For expression bodies (implicit return in arrow functions)
    return this.serializeExpression(body);
  }

  /**
   * Serialize a statement to string
   */
  private serializeStatement(stmt: t.Statement): string {
    if (t.isReturnStatement(stmt)) {
      if (stmt.argument) {
        return `return ${this.serializeExpression(stmt.argument)};`;
      }
      return 'return;';
    }

    if (t.isExpressionStatement(stmt)) {
      return `${this.serializeExpression(stmt.expression)};`;
    }

    if (t.isVariableDeclaration(stmt)) {
      const declarations = stmt.declarations.map(decl => {
        if (t.isIdentifier(decl.id)) {
          const init = decl.init ? ` = ${this.serializeExpression(decl.init)}` : '';
          return `${decl.id.name}${init}`;
        }
        return 'variable';
      }).join(', ');
      return `${stmt.kind} ${declarations};`;
    }

    if (t.isIfStatement(stmt)) {
      const test = this.serializeExpression(stmt.test);
      const consequent = this.serializeStatement(stmt.consequent);
      const alternate = stmt.alternate ? ` else ${this.serializeStatement(stmt.alternate)}` : '';
      return `if (${test}) ${consequent}${alternate}`;
    }

    // For other statement types, return a placeholder
    return '/* statement */';
  }

  /**
   * Serialize an expression to string
   */
  private serializeExpression(expr: t.Expression): string {
    if (t.isIdentifier(expr)) {
      return expr.name;
    }

    if (t.isStringLiteral(expr)) {
      return `'${expr.value}'`;
    }

    if (t.isNumericLiteral(expr)) {
      return String(expr.value);
    }

    if (t.isBooleanLiteral(expr)) {
      return String(expr.value);
    }

    if (t.isNullLiteral(expr)) {
      return 'null';
    }

    if (t.isMemberExpression(expr)) {
      return this.serializeMemberExpression(expr);
    }

    if (t.isCallExpression(expr)) {
      return this.serializeCallExpression(expr);
    }

    if (t.isBinaryExpression(expr)) {
      const left = t.isExpression(expr.left) ? this.serializeExpression(expr.left) : 'left';
      const right = this.serializeExpression(expr.right);
      return `${left} ${expr.operator} ${right}`;
    }

    if (t.isUnaryExpression(expr)) {
      const argument = this.serializeExpression(expr.argument);
      return `${expr.operator}${argument}`;
    }

    if (t.isLogicalExpression(expr)) {
      const left = this.serializeExpression(expr.left);
      const right = this.serializeExpression(expr.right);
      return `${left} ${expr.operator} ${right}`;
    }

    if (t.isConditionalExpression(expr)) {
      const test = this.serializeExpression(expr.test);
      const consequent = this.serializeExpression(expr.consequent);
      const alternate = this.serializeExpression(expr.alternate);
      return `${test} ? ${consequent} : ${alternate}`;
    }

    if (t.isArrayExpression(expr)) {
      const elements = expr.elements.map(el => {
        if (el === null) return '';
        if (t.isSpreadElement(el)) {
          return `...${this.serializeExpression(el.argument)}`;
        }
        return this.serializeExpression(el);
      }).join(', ');
      return `[${elements}]`;
    }

    if (t.isObjectExpression(expr)) {
      const properties = expr.properties.map(prop => {
        if (t.isObjectProperty(prop)) {
          const key = t.isIdentifier(prop.key) ? prop.key.name : String(prop.key);
          const value = this.serializeExpression(prop.value as t.Expression);
          return `${key}: ${value}`;
        }
        if (t.isSpreadElement(prop)) {
          return `...${this.serializeExpression(prop.argument)}`;
        }
        return '';
      }).join(', ');
      return `{ ${properties} }`;
    }

    if (t.isArrowFunctionExpression(expr) || t.isFunctionExpression(expr)) {
      return this.serializeFunction(expr);
    }

    if (t.isUpdateExpression(expr)) {
      const argument = this.serializeExpression(expr.argument);
      return expr.prefix ? `${expr.operator}${argument}` : `${argument}${expr.operator}`;
    }

    if (t.isAssignmentExpression(expr)) {
      const left = this.serializeExpression(expr.left as t.Expression);
      const right = this.serializeExpression(expr.right);
      return `${left} ${expr.operator} ${right}`;
    }

    if (t.isAwaitExpression(expr)) {
      const argument = this.serializeExpression(expr.argument);
      return `await ${argument}`;
    }

    // TypeScript-specific expressions
    if (t.isTSAsExpression(expr)) {
      // Type assertion: value as Type
      const expression = this.serializeExpression(expr.expression);
      const typeAnnotation = this.serializeTSType(expr.typeAnnotation);
      return `${expression} as ${typeAnnotation}`;
    }

    if (t.isTSTypeAssertion(expr)) {
      // Type assertion: <Type>value
      const typeAnnotation = this.serializeTSType(expr.typeAnnotation);
      const expression = this.serializeExpression(expr.expression);
      return `<${typeAnnotation}>${expression}`;
    }

    if (t.isTSNonNullExpression(expr)) {
      // Non-null assertion: value!
      const expression = this.serializeExpression(expr.expression);
      return `${expression}!`;
    }

    if (t.isTemplateLiteral(expr)) {
      // Template literals
      const quasis = expr.quasis.map(q => q.value.cooked || q.value.raw);
      const expressions = expr.expressions.map(e => this.serializeExpression(e as t.Expression));
      
      let result = '`';
      for (let i = 0; i < quasis.length; i++) {
        result += quasis[i];
        if (i < expressions.length) {
          result += '${' + expressions[i] + '}';
        }
      }
      result += '`';
      return result;
    }

    if (t.isNewExpression(expr)) {
      // new Constructor()
      const callee = this.serializeExpression(expr.callee as t.Expression);
      const args = expr.arguments.map(arg => {
        if (t.isSpreadElement(arg)) {
          return `...${this.serializeExpression(arg.argument)}`;
        }
        return this.serializeExpression(arg as t.Expression);
      }).join(', ');
      return `new ${callee}(${args})`;
    }

    if (t.isSequenceExpression(expr)) {
      // Comma operator: (expr1, expr2, expr3)
      const expressions = expr.expressions.map(e => this.serializeExpression(e)).join(', ');
      return `(${expressions})`;
    }

    if (t.isYieldExpression(expr)) {
      // yield expression
      const argument = expr.argument ? this.serializeExpression(expr.argument) : '';
      const delegate = expr.delegate ? '*' : '';
      return `yield${delegate} ${argument}`.trim();
    }

    if (t.isThisExpression(expr)) {
      return 'this';
    }

    if (t.isSuper(expr)) {
      return 'super';
    }

    if (t.isRegExpLiteral(expr)) {
      return `/${expr.pattern}/${expr.flags || ''}`;
    }

    if (t.isBigIntLiteral(expr)) {
      return `${expr.value}n`;
    }

    // For other expression types, return a placeholder
    return '/* expression */';
  }

  /**
   * Serialize member expression to string
   */
  private serializeMemberExpression(expr: t.MemberExpression): string {
    const object = this.serializeExpression(expr.object as t.Expression);
    
    if (expr.computed) {
      // obj[prop]
      if (t.isExpression(expr.property)) {
        const property = this.serializeExpression(expr.property);
        return `${object}[${property}]`;
      }
      return `${object}[property]`;
    } else {
      // obj.prop
      if (t.isIdentifier(expr.property)) {
        return `${object}.${expr.property.name}`;
      }
      if (t.isPrivateName(expr.property)) {
        return `${object}.#${expr.property.id.name}`;
      }
      return `${object}.property`;
    }
  }

  /**
   * Serialize call expression to string
   */
  private serializeCallExpression(expr: t.CallExpression): string {
    const callee = this.serializeExpression(expr.callee as t.Expression);
    const args = expr.arguments.map(arg => {
      if (t.isSpreadElement(arg)) {
        return `...${this.serializeExpression(arg.argument)}`;
      }
      return this.serializeExpression(arg as t.Expression);
    }).join(', ');
    return `${callee}(${args})`;
  }

  /**
   * Serialize object pattern to string
   */
  private serializeObjectPattern(pattern: t.ObjectPattern): string {
    const properties = pattern.properties.map(prop => {
      if (t.isObjectProperty(prop)) {
        const key = t.isIdentifier(prop.key) ? prop.key.name : String(prop.key);
        if (t.isIdentifier(prop.value) && prop.value.name === key) {
          return key;
        }
        const value = t.isIdentifier(prop.value) ? prop.value.name : 'value';
        return `${key}: ${value}`;
      }
      if (t.isRestElement(prop)) {
        const argument = prop.argument;
        if (t.isIdentifier(argument)) {
          return `...${argument.name}`;
        }
      }
      return 'prop';
    }).join(', ');
    return `{ ${properties} }`;
  }

  /**
   * Serialize array pattern to string
   */
  private serializeArrayPattern(pattern: t.ArrayPattern): string {
    const elements = pattern.elements.map(el => {
      if (el === null) return '';
      if (t.isIdentifier(el)) {
        return el.name;
      }
      if (t.isRestElement(el)) {
        const argument = el.argument;
        if (t.isIdentifier(argument)) {
          return `...${argument.name}`;
        }
      }
      return 'element';
    }).join(', ');
    return `[${elements}]`;
  }

  /**
   * Infer parameter type from identifier
   */
  private inferParamType(param: t.Identifier): string {
    // Check if parameter has TypeScript type annotation
    if (param.typeAnnotation && t.isTSTypeAnnotation(param.typeAnnotation)) {
      const tsType = param.typeAnnotation.typeAnnotation;
      return this.serializeTSType(tsType);
    }

    // Common parameter name patterns
    const name = param.name.toLowerCase();
    if (name === 'event' || name === 'e' || name === 'evt') {
      return 'Event';
    }
    if (name.includes('callback') || name.includes('handler')) {
      return 'function';
    }
    if (name.includes('index') || name.includes('idx') || name === 'i') {
      return 'number';
    }
    if (name.includes('item') || name.includes('element')) {
      return 'any';
    }

    return 'any';
  }

  /**
   * Serialize TypeScript type to string
   */
  private serializeTSType(tsType: t.TSType): string {
    // Primitive types
    if (t.isTSStringKeyword(tsType)) return 'string';
    if (t.isTSNumberKeyword(tsType)) return 'number';
    if (t.isTSBooleanKeyword(tsType)) return 'boolean';
    if (t.isTSAnyKeyword(tsType)) return 'any';
    if (t.isTSVoidKeyword(tsType)) return 'void';
    if (t.isTSNullKeyword(tsType)) return 'null';
    if (t.isTSUndefinedKeyword(tsType)) return 'undefined';
    if (t.isTSNeverKeyword(tsType)) return 'never';
    if (t.isTSUnknownKeyword(tsType)) return 'unknown';
    if (t.isTSObjectKeyword(tsType)) return 'object';
    if (t.isTSSymbolKeyword(tsType)) return 'symbol';
    if (t.isTSBigIntKeyword(tsType)) return 'bigint';

    // Array types
    if (t.isTSArrayType(tsType)) {
      const elementType = this.serializeTSType(tsType.elementType);
      return `${elementType}[]`;
    }

    // Tuple types
    if (t.isTSTupleType(tsType)) {
      const elements = tsType.elementTypes.map(el => {
        if (t.isTSNamedTupleMember(el)) {
          const label = t.isIdentifier(el.label) ? el.label.name : 'element';
          const optional = el.optional ? '?' : '';
          const type = this.serializeTSType(el.elementType);
          return `${label}${optional}: ${type}`;
        }
        return this.serializeTSType(el as t.TSType);
      }).join(', ');
      return `[${elements}]`;
    }

    // Type references (e.g., MyType, Array<T>)
    if (t.isTSTypeReference(tsType)) {
      let typeName = 'Type';
      if (t.isIdentifier(tsType.typeName)) {
        typeName = tsType.typeName.name;
      } else if (t.isTSQualifiedName(tsType.typeName)) {
        typeName = this.serializeTSQualifiedName(tsType.typeName);
      }
      
      const typeParams = tsType.typeParameters
        ? this.serializeTSTypeParameterInstantiation(tsType.typeParameters)
        : '';
      return `${typeName}${typeParams}`;
    }

    // Union types (A | B)
    if (t.isTSUnionType(tsType)) {
      const types = tsType.types.map(t => this.serializeTSType(t)).join(' | ');
      return types;
    }

    // Intersection types (A & B)
    if (t.isTSIntersectionType(tsType)) {
      const types = tsType.types.map(t => this.serializeTSType(t)).join(' & ');
      return types;
    }

    // Literal types
    if (t.isTSLiteralType(tsType)) {
      const literal = tsType.literal;
      if (t.isStringLiteral(literal)) return `'${literal.value}'`;
      if (t.isNumericLiteral(literal)) return String(literal.value);
      if (t.isBooleanLiteral(literal)) return String(literal.value);
      if (t.isUnaryExpression(literal) && t.isNumericLiteral(literal.argument)) {
        return `${literal.operator}${literal.argument.value}`;
      }
    }

    // Object/Type literal
    if (t.isTSTypeLiteral(tsType)) {
      const members = tsType.members.map(member => {
        if (t.isTSPropertySignature(member)) {
          return this.serializeTSPropertySignature(member);
        }
        if (t.isTSMethodSignature(member)) {
          return this.serializeTSMethodSignature(member);
        }
        if (t.isTSIndexSignature(member)) {
          return this.serializeTSIndexSignature(member);
        }
        return '';
      }).filter(Boolean).join(' ');
      return `{ ${members} }`;
    }

    // Function types
    if (t.isTSFunctionType(tsType)) {
      const typeParams = tsType.typeParameters
        ? this.serializeTSTypeParameterDeclaration(tsType.typeParameters)
        : '';
      const params = tsType.parameters.map(param => {
        if (t.isIdentifier(param)) {
          const typeAnnotation = param.typeAnnotation && t.isTSTypeAnnotation(param.typeAnnotation)
            ? `: ${this.serializeTSType(param.typeAnnotation.typeAnnotation)}`
            : '';
          return `${param.name}${typeAnnotation}`;
        }
        return 'param';
      }).join(', ');
      const returnType = tsType.typeAnnotation
        ? this.serializeTSType(tsType.typeAnnotation.typeAnnotation)
        : 'void';
      return `${typeParams}(${params}) => ${returnType}`;
    }

    // Constructor types
    if (t.isTSConstructorType(tsType)) {
      const typeParams = tsType.typeParameters
        ? this.serializeTSTypeParameterDeclaration(tsType.typeParameters)
        : '';
      const params = tsType.parameters.map(param => {
        if (t.isIdentifier(param)) {
          return param.name;
        }
        return 'param';
      }).join(', ');
      const returnType = tsType.typeAnnotation
        ? this.serializeTSType(tsType.typeAnnotation.typeAnnotation)
        : 'any';
      return `new ${typeParams}(${params}) => ${returnType}`;
    }

    // Conditional types (T extends U ? X : Y)
    if (t.isTSConditionalType(tsType)) {
      const checkType = this.serializeTSType(tsType.checkType);
      const extendsType = this.serializeTSType(tsType.extendsType);
      const trueType = this.serializeTSType(tsType.trueType);
      const falseType = this.serializeTSType(tsType.falseType);
      return `${checkType} extends ${extendsType} ? ${trueType} : ${falseType}`;
    }

    // Indexed access types (T[K])
    if (t.isTSIndexedAccessType(tsType)) {
      const objectType = this.serializeTSType(tsType.objectType);
      const indexType = this.serializeTSType(tsType.indexType);
      return `${objectType}[${indexType}]`;
    }

    // Mapped types ({ [K in keyof T]: U })
    if (t.isTSMappedType(tsType)) {
      const readonly = tsType.readonly ? 'readonly ' : '';
      const optional = tsType.optional ? '?' : '';
      const typeParameter = tsType.typeParameter;
      const constraint = typeParameter.constraint
        ? ` in ${this.serializeTSType(typeParameter.constraint)}`
        : '';
      const typeAnnotation = tsType.typeAnnotation
        ? `: ${this.serializeTSType(tsType.typeAnnotation)}`
        : '';
      return `{ ${readonly}[${typeParameter.name}${constraint}]${optional}${typeAnnotation} }`;
    }

    // Type operators (keyof, typeof, readonly)
    if (t.isTSTypeOperator(tsType)) {
      const operator = tsType.operator;
      const type = this.serializeTSType(tsType.typeAnnotation);
      return `${operator} ${type}`;
    }

    // Infer types (infer T)
    if (t.isTSInferType(tsType)) {
      return `infer ${tsType.typeParameter.name}`;
    }

    // Parenthesized types
    if (t.isTSParenthesizedType(tsType)) {
      return `(${this.serializeTSType(tsType.typeAnnotation)})`;
    }

    // This type
    if (t.isTSThisType(tsType)) {
      return 'this';
    }

    // Import types
    if (t.isTSImportType(tsType)) {
      const argument = t.isStringLiteral(tsType.argument) ? `'${tsType.argument.value}'` : 'module';
      const qualifier = tsType.qualifier && t.isIdentifier(tsType.qualifier)
        ? `.${tsType.qualifier.name}`
        : '';
      const typeParams = tsType.typeParameters
        ? this.serializeTSTypeParameterInstantiation(tsType.typeParameters)
        : '';
      return `import(${argument})${qualifier}${typeParams}`;
    }

    // Rest types
    if (t.isTSRestType(tsType)) {
      return `...${this.serializeTSType(tsType.typeAnnotation)}`;
    }

    // Optional types
    if (t.isTSOptionalType(tsType)) {
      return `${this.serializeTSType(tsType.typeAnnotation)}?`;
    }

    return 'any';
  }

  /**
   * Serialize TypeScript qualified name
   */
  private serializeTSQualifiedName(node: t.TSQualifiedName): string {
    const left = t.isIdentifier(node.left) ? node.left.name : this.serializeTSQualifiedName(node.left);
    const right = node.right.name;
    return `${left}.${right}`;
  }

  /**
   * Serialize TypeScript index signature
   */
  private serializeTSIndexSignature(node: t.TSIndexSignature): string {
    const readonly = node.readonly ? 'readonly ' : '';
    const params = node.parameters.map(param => {
      if (t.isIdentifier(param)) {
        const typeAnnotation = param.typeAnnotation && t.isTSTypeAnnotation(param.typeAnnotation)
          ? `: ${this.serializeTSType(param.typeAnnotation.typeAnnotation)}`
          : '';
        return `${param.name}${typeAnnotation}`;
      }
      return 'key';
    }).join(', ');
    const typeAnnotation = node.typeAnnotation
      ? `: ${this.serializeTSType(node.typeAnnotation.typeAnnotation)}`
      : '';
    return `${readonly}[${params}]${typeAnnotation};`;
  }

  /**
   * Extract value from expression
   */
  private extractValue(expression: t.Expression | t.JSXEmptyExpression | t.SpreadElement | t.ArgumentPlaceholder): any {
    if (t.isJSXEmptyExpression(expression)) return null;
    if (t.isSpreadElement(expression)) return null;
    if (t.isArgumentPlaceholder(expression)) return null;

    if (t.isStringLiteral(expression)) return expression.value;
    if (t.isNumericLiteral(expression)) return expression.value;
    if (t.isBooleanLiteral(expression)) return expression.value;
    if (t.isNullLiteral(expression)) return null;

    if (t.isArrayExpression(expression)) {
      return expression.elements.map(el => this.extractValue(el as t.Expression));
    }

    if (t.isObjectExpression(expression)) {
      const obj: Record<string, any> = {};
      expression.properties.forEach(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          obj[prop.key.name] = this.extractValue(prop.value as t.Expression);
        }
      });
      return obj;
    }

    // For complex expressions, return a reference
    return null;
  }

  /**
   * Infer type from value
   */
  private inferType(value: any): string {
    if (value === null || value === undefined) return 'any';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
      // Try to infer array element type
      if (value.length > 0) {
        const elementType = this.inferType(value[0]);
        return `${elementType}[]`;
      }
      return 'array';
    }
    if (typeof value === 'object') return 'object';
    return 'any';
  }
}

/**
 * Get singleton React parser instance
 */
let parserInstance: ReactParser | null = null;

export function getReactParser(config?: ReactParserConfig): ReactParser {
  if (!parserInstance) {
    parserInstance = new ReactParser(config);
  }
  return parserInstance;
}

/**
 * Reset parser instance (useful for testing)
 */
export function resetReactParser(): void {
  parserInstance = null;
}
