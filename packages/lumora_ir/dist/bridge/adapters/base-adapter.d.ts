/**
 * Base State Adapter Interface
 * Defines the contract for state management adapters
 */
import { StateDefinition, StateVariable } from '../../types/ir-types';
/**
 * Adapter configuration
 */
export interface AdapterConfig {
    preserveComments?: boolean;
    generateTests?: boolean;
    includeImports?: boolean;
}
/**
 * Generated code result
 */
export interface GeneratedCode {
    stateClass: string;
    eventClasses?: string;
    providerCode?: string;
    imports: string[];
    usage?: string;
}
/**
 * Base adapter interface
 */
export interface StateAdapter {
    /**
     * Adapter name
     */
    readonly name: string;
    /**
     * Convert state definition to adapter-specific code
     */
    convertToFlutter(state: StateDefinition, componentName: string, config?: AdapterConfig): GeneratedCode;
    /**
     * Convert adapter-specific code back to state definition
     */
    convertFromFlutter(dartCode: string, componentName: string): StateDefinition;
    /**
     * Generate usage example
     */
    generateUsageExample(componentName: string): string;
}
/**
 * Abstract base adapter with common utilities
 */
export declare abstract class BaseStateAdapter implements StateAdapter {
    abstract readonly name: string;
    abstract convertToFlutter(state: StateDefinition, componentName: string, config?: AdapterConfig): GeneratedCode;
    abstract convertFromFlutter(dartCode: string, componentName: string): StateDefinition;
    abstract generateUsageExample(componentName: string): string;
    /**
     * Map TypeScript type to Flutter/Dart type
     */
    protected mapTypeToFlutter(tsType: string): string;
    /**
     * Format initial value for Flutter with type awareness
     */
    protected formatInitialValue(value: any, type: string): string;
    /**
     * Capitalize first letter
     */
    protected capitalize(str: string): string;
    /**
     * Uncapitalize first letter
     */
    protected uncapitalize(str: string): string;
    /**
     * Generate state variable declarations
     */
    protected generateStateVariables(variables: StateVariable[], isFinal?: boolean): string;
    /**
     * Generate constructor parameters
     */
    protected generateConstructorParams(variables: StateVariable[]): string;
    /**
     * Generate copyWith method parameters
     */
    protected generateCopyWithParams(variables: StateVariable[]): string;
    /**
     * Generate copyWith method body
     */
    protected generateCopyWithBody(variables: StateVariable[], className: string): string;
    /**
     * Generate initial state
     */
    protected generateInitialState(variables: StateVariable[], className: string): string;
}
