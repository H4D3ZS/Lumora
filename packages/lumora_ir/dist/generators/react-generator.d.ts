/**
 * React/TSX Code Generator
 * Generates React components from Lumora IR
 * Enables Flutter → React conversion
 */
import { LumoraIR } from '../types/ir-types';
import { ErrorHandler } from '../errors/error-handler';
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
export declare class ReactGenerator {
    private errorHandler;
    private config;
    private registry;
    private imports;
    private namedImports;
    constructor(config?: ReactGeneratorConfig);
    /**
     * Generate React component from Lumora IR
     */
    generate(ir: LumoraIR): string;
    /**
     * Generate a single React component
     */
    private generateComponent;
    /**
     * Generate function component
     */
    private generateFunctionComponent;
    /**
     * Generate class component
     */
    private generateClassComponent;
    /**
     * Generate props interface
     */
    private generatePropsInterface;
    /**
     * Generate state interface
     */
    private generateStateInterface;
    /**
     * Generate state hooks (useState, etc.)
     */
    private generateStateHooks;
    /**
     * Generate event handlers as functions
     */
    private generateEventHandlers;
    /**
     * Generate lifecycle hooks (useEffect, etc.)
     */
    private generateLifecycleHooks;
    /**
     * Generate constructor for class component
     */
    private generateConstructor;
    /**
     * Generate class methods for event handlers
     */
    private generateClassMethods;
    /**
     * Generate JSX from node tree
     */
    private generateJSX;
    /**
     * Generate JSX props string
     */
    private generateJSXProps;
    /**
     * Infer TypeScript type from value
     */
    private inferTypeScriptType;
    /**
     * Serialize value to code string
     */
    private serializeValue;
    /**
     * Capitalize first letter
     */
    private capitalize;
}
/**
 * Helper function to create React generator
 */
export declare function createReactGenerator(config?: ReactGeneratorConfig): ReactGenerator;
/**
 * Helper function to generate React code from IR
 */
export declare function generateReactCode(ir: LumoraIR, config?: ReactGeneratorConfig): string;
