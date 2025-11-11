/**
 * Dart/Flutter Parser
 * Parses Dart widgets and converts them to Lumora IR
 */
import { LumoraIR, StateDefinition } from '../types/ir-types';
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
    setStateCalls: SetStateCall[];
}
/**
 * setState call information
 */
export interface SetStateCall {
    lineNumber: number;
    updatedVariables: string[];
    code: string;
}
/**
 * Bloc information
 */
export interface BlocInfo {
    name: string;
    events: BlocEventInfo[];
    states: BlocStateInfo[];
    eventHandlers: BlocEventHandlerInfo[];
    lineNumber: number;
}
/**
 * Bloc event information
 */
export interface BlocEventInfo {
    name: string;
    properties: PropertyInfo[];
}
/**
 * Bloc state information
 */
export interface BlocStateInfo {
    name: string;
    properties: PropertyInfo[];
    isInitial?: boolean;
}
/**
 * Bloc event handler information
 */
export interface BlocEventHandlerInfo {
    eventName: string;
    stateName: string;
    handler: string;
}
/**
 * Riverpod provider information
 */
export interface RiverpodProviderInfo {
    name: string;
    type: 'Provider' | 'StateProvider' | 'StateNotifierProvider' | 'FutureProvider' | 'StreamProvider';
    valueType: string;
    initialValue?: string;
    notifierClass?: string;
    lineNumber: number;
}
/**
 * StateNotifier class information
 */
export interface StateNotifierInfo {
    name: string;
    stateType: string;
    initialState: string;
    methods: MethodInfo[];
    lineNumber: number;
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
 * Custom widget definition
 */
export interface CustomWidgetDefinition {
    name: string;
    type: 'StatelessWidget' | 'StatefulWidget';
    properties: PropertyInfo[];
    buildMethod: string;
    isCustom: boolean;
}
/**
 * Widget registry for custom widgets
 */
export declare class CustomWidgetRegistry {
    private widgets;
    register(widget: CustomWidgetDefinition): void;
    get(name: string): CustomWidgetDefinition | undefined;
    has(name: string): boolean;
    getAll(): CustomWidgetDefinition[];
    clear(): void;
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
    private customWidgetRegistry;
    constructor(config?: DartParserConfig);
    /**
     * Get the custom widget registry
     */
    getCustomWidgetRegistry(): CustomWidgetRegistry;
    /**
     * Parse Dart/Flutter source code to Lumora IR
     */
    parse(source: string, filename: string): LumoraIR;
    /**
     * Extract all widget definitions from source code
     */
    private extractWidgets;
    /**
     * Register custom widgets in the registry
     */
    private registerCustomWidgets;
    /**
     * Check if a widget is a custom widget
     */
    isCustomWidget(widgetName: string): boolean;
    /**
     * Extract custom widget builder
     */
    extractCustomWidgetBuilder(widgetName: string): string | null;
    /**
     * Generate TypeScript props interface from widget properties
     */
    private generatePropsInterface;
    /**
     * Extract Bloc definitions from source code
     */
    extractBlocs(source: string): BlocInfo[];
    /**
     * Find Bloc event definitions
     */
    private findBlocEvents;
    /**
     * Find Bloc state definitions
     */
    private findBlocStates;
    /**
     * Extract Bloc event handlers (on<Event> methods)
     */
    private extractBlocEventHandlers;
    /**
     * Extract Riverpod provider definitions from source code
     */
    extractRiverpodProviders(source: string): RiverpodProviderInfo[];
    /**
     * Extract StateNotifier classes
     */
    extractStateNotifiers(source: string): StateNotifierInfo[];
    /**
     * Convert Riverpod provider to state definition
     */
    convertRiverpodToState(provider: RiverpodProviderInfo, notifier?: StateNotifierInfo): StateDefinition;
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
     * Extract setState calls from State class body
     */
    private extractSetStateCalls;
    /**
     * Extract variable names that are being updated in setState
     */
    private extractUpdatedVariables;
    /**
     * Extract methods from class body
     */
    private extractMethods;
    /**
     * Parse method parameters
     */
    private parseParameters;
    /**
     * Parse a single parameter
     */
    private parseParameter;
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
     * Convert parameters to IR props with metadata
     */
    convertParametersToProps(parameters: ParameterInfo[]): {
        props: Record<string, any>;
        metadata: {
            required: string[];
            optional: string[];
            defaults: Record<string, any>;
        };
    };
    /**
     * Convert state class to state definition
     */
    private convertState;
    /**
     * Convert Bloc to state definition
     */
    convertBlocToState(bloc: BlocInfo): StateDefinition;
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
    /**
     * Convert Dart null-aware operators to TypeScript equivalents
     */
    convertNullAwareOperators(dartCode: string): string;
    /**
     * Check if a type is nullable
     */
    isNullableType(dartType: string): boolean;
    /**
     * Get non-nullable version of a type
     */
    getNonNullableType(dartType: string): string;
    /**
     * Parse value with null safety awareness
     */
    private parseValueWithNullSafety;
}
