/**
 * Dart/Flutter Parser
 * Parses Dart widgets and converts them to Lumora IR
 */
import { LumoraIR } from '../types/ir-types';
import { ErrorHandler } from '../errors/error-handler';
/**
 * Configuration for Dart parser
 */
export interface DartParserConfig {
    errorHandler?: ErrorHandler;
    strictMode?: boolean;
}
/**
 * Widget information extracted from Dart code
 */
export interface WidgetInfo {
    name: string;
    type: 'StatelessWidget' | 'StatefulWidget';
    properties: PropertyInfo[];
    buildMethod: string;
    stateClass?: StateClassInfo;
    lineNumber: number;
}
/**
 * Property information
 */
export interface PropertyInfo {
    name: string;
    type: string;
    isRequired: boolean;
    isFinal: boolean;
    defaultValue?: string;
}
/**
 * State class information for StatefulWidget
 */
export interface StateClassInfo {
    name: string;
    stateVariables: StateVariableInfo[];
    methods: MethodInfo[];
}
/**
 * State variable information
 */
export interface StateVariableInfo {
    name: string;
    type: string;
    initialValue?: string;
    isFinal: boolean;
    isLate: boolean;
}
/**
 * Method information
 */
export interface MethodInfo {
    name: string;
    returnType: string;
    parameters: ParameterInfo[];
    body: string;
}
/**
 * Parameter information
 */
export interface ParameterInfo {
    name: string;
    type: string;
    isRequired: boolean;
    isNamed: boolean;
    defaultValue?: string;
}
/**
 * Dart AST Parser
 * Converts Dart/Flutter code to Lumora IR
 */
export declare class DartParser {
    private sourceFile;
    private sourceCode;
    private errorHandler;
    private config;
    constructor(config?: DartParserConfig);
    /**
     * Parse Dart/Flutter source code to Lumora IR
     */
    parse(source: string, filename: string): LumoraIR;
    /**
     * Extract all widget definitions from source code
     */
    private extractWidgets;
    /**
     * Find StatelessWidget classes in source code
     */
    private findStatelessWidgets;
    /**
     * Find StatefulWidget classes in source code
     */
    private findStatefulWidgets;
    /**
     * Find State class for StatefulWidget
     */
    private findStateClass;
    /**
     * Extract properties from class body
     */
    private extractProperties;
    /**
     * Update properties with required information from constructor
     */
    private updateRequiredProperties;
    /**
     * Extract build method from class body
     */
    private extractBuildMethod;
    /**
     * Extract method body by matching braces
     */
    private extractMethodBody;
    /**
     * Extract return statement from build method
     */
    private extractReturnStatement;
    /**
     * Extract state variables from State class body
     */
    private extractStateVariables;
    /**
     * Extract methods from class body
     */
    private extractMethods;
    /**
     * Parse method parameters
     */
    private parseParameters;
    /**
     * Check if position is inside a method
     */
    private isInsideMethod;
    /**
     * Get line number for a position in source code
     */
    private getLineNumber;
    /**
     * Convert widget to Lumora IR node
     */
    private convertWidget;
    /**
     * Convert properties to props object
     */
    private convertProperties;
    /**
     * Convert state class to state definition
     */
    private convertState;
    /**
     * Parse widget tree from build method return statement
     */
    private parseWidgetTree;
    /**
     * Extract widget properties from widget constructor
     */
    private extractWidgetProps;
    /**
     * Extract content within parentheses
     */
    private extractParenthesesContent;
    /**
     * Parse named parameters from parameter string
     */
    private parseNamedParameters;
    /**
     * Extract child widgets
     */
    private extractWidgetChildren;
    /**
     * Split string by delimiter at depth 0
     */
    private splitAtDepth;
    /**
     * Parse Dart value to JavaScript value
     */
    private parseValue;
    /**
     * Map Dart types to TypeScript types
     */
    private mapDartTypeToTS;
}
