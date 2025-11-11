/**
 * React/TSX Parser
 * Parses React components and converts them to Lumora IR
 */
import * as parser from '@babel/parser';
import * as t from '@babel/types';
import { LumoraIR } from '../types/ir-types';
import { ErrorHandler } from '../errors/error-handler';
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
 * OPTIMIZED: Includes caching and performance improvements
 */
export declare class ReactParser {
    private ast;
    private sourceFile;
    private sourceCode;
    private errorHandler;
    private config;
    private typeDefinitions;
    private static astCache;
    private static readonly AST_CACHE_TTL;
    private static readonly AST_CACHE_MAX_SIZE;
    private componentCache;
    private jsxCache;
    private enableCaching;
    constructor(config?: ReactParserConfig);
    /**
     * Enable or disable caching
     */
    setCachingEnabled(enabled: boolean): void;
    /**
     * Clear all caches
     */
    clearCaches(): void;
    /**
     * Clear static AST cache
     */
    static clearASTCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        astCacheSize: number;
        componentCacheSize: number;
        jsxCacheSize: number;
    };
    /**
     * Parse React/TSX source code to Lumora IR
     */
    parse(source: string, filename: string): LumoraIR;
    /**
     * Parse source code to AST using Babel parser
     * OPTIMIZED: Uses caching to avoid re-parsing the same code
     */
    private parseAST;
    /**
     * Generate cache key from source code
     * OPTIMIZATION: Simple hash function for cache keys
     */
    private generateCacheKey;
    /**
     * Extract TypeScript type definitions from AST
     */
    private extractTypeDefinitions;
    /**
     * Serialize interface declaration to string
     */
    private serializeInterfaceDeclaration;
    /**
     * Serialize type alias declaration to string
     */
    private serializeTypeAliasDeclaration;
    /**
     * Serialize enum declaration to string
     */
    private serializeEnumDeclaration;
    /**
     * Serialize TypeScript type parameter declaration
     */
    private serializeTSTypeParameterDeclaration;
    /**
     * Serialize TypeScript expression with type arguments
     */
    private serializeTSExpressionWithTypeArguments;
    /**
     * Serialize TypeScript type parameter instantiation
     */
    private serializeTSTypeParameterInstantiation;
    /**
     * Serialize TypeScript property signature
     */
    private serializeTSPropertySignature;
    /**
     * Serialize TypeScript method signature
     */
    private serializeTSMethodSignature;
    /**
     * Extract all React components from AST
     * OPTIMIZED: Uses caching to avoid re-extracting components
     */
    extractComponents(ast: t.File): ComponentInfo[];
    /**
     * Check if a function declaration is a React component
     */
    private isFunctionComponent;
    /**
     * Check if an arrow function is a React component
     */
    private isArrowFunctionComponent;
    /**
     * Check if a class is a React component
     */
    private isClassComponent;
    /**
     * Check if a function/arrow function returns JSX
     */
    private returnsJSX;
    /**
     * Find render method in class component
     */
    private findRenderMethod;
    /**
     * Convert component to Lumora node
     */
    private convertComponent;
    /**
     * Extract generic type parameters from component
     */
    private extractGenericParameters;
    /**
     * Extract decorators from class component
     */
    private extractDecorators;
    /**
     * Extract props from component parameters
     */
    private extractProps;
    /**
     * Extract state from component (hooks)
     */
    private extractState;
    /**
     * Extract lifecycle events from hooks
     */
    private extractLifecycle;
    /**
     * Determine lifecycle type based on dependencies
     */
    private determineLifecycleType;
    /**
     * Extract handler code from effect function
     */
    private extractEffectHandler;
    /**
     * Find all hooks in component
     */
    private findHooks;
    /**
     * Extract useState-specific information
     */
    private extractUseStateInfo;
    /**
     * Extract useEffect-specific information
     */
    private extractUseEffectInfo;
    /**
     * Extract useContext-specific information
     */
    private extractUseContextInfo;
    /**
     * Extract useRef-specific information
     */
    private extractUseRefInfo;
    /**
     * Extract useMemo-specific information
     */
    private extractUseMemoInfo;
    /**
     * Extract useCallback-specific information
     */
    private extractUseCallbackInfo;
    /**
     * Extract custom hook information
     */
    private extractCustomHookInfo;
    /**
     * Extract events from component
     */
    private extractEvents;
    /**
     * Extract methods from class component
     */
    private extractClassMethods;
    /**
     * Check if method name is a React lifecycle method
     */
    private isLifecycleMethod;
    /**
     * Serialize class method to string
     */
    private serializeClassMethod;
    /**
     * Extract helper functions from function component
     */
    private extractHelperFunctions;
    /**
     * Serialize helper function declaration to string
     */
    private serializeHelperFunction;
    /**
     * Convert JSX to Lumora nodes
     */
    private convertJSX;
    /**
     * Convert a single JSX element to Lumora node
     */
    private convertJSXElement;
    /**
     * Get tag name from JSX element name
     */
    private getJSXTagName;
    /**
     * Extract props from JSX attributes
     */
    private extractJSXProps;
    /**
     * Extract value from JSX attribute value
     */
    private extractJSXValue;
    /**
     * Convert JSX children to Lumora nodes
     */
    private convertJSXChildren;
    /**
     * Extract handler code from expression
     */
    private extractHandlerCode;
    /**
     * Extract handler parameters from expression
     */
    private extractHandlerParams;
    /**
     * Serialize a function (arrow or regular) to string
     */
    private serializeFunction;
    /**
     * Serialize function body to string
     */
    private serializeFunctionBody;
    /**
     * Serialize a statement to string
     */
    private serializeStatement;
    /**
     * Serialize an expression to string
     */
    private serializeExpression;
    /**
     * Serialize member expression to string
     */
    private serializeMemberExpression;
    /**
     * Serialize call expression to string
     */
    private serializeCallExpression;
    /**
     * Serialize object pattern to string
     */
    private serializeObjectPattern;
    /**
     * Serialize array pattern to string
     */
    private serializeArrayPattern;
    /**
     * Infer parameter type from identifier
     */
    private inferParamType;
    /**
     * Serialize TypeScript type to string
     */
    private serializeTSType;
    /**
     * Serialize TypeScript qualified name
     */
    private serializeTSQualifiedName;
    /**
     * Serialize TypeScript index signature
     */
    private serializeTSIndexSignature;
    /**
     * Extract value from expression
     */
    private extractValue;
    /**
     * Infer type from value
     */
    private inferType;
}
export declare function getReactParser(config?: ReactParserConfig): ReactParser;
/**
 * Reset parser instance (useful for testing)
 */
export declare function resetReactParser(): void;
