/**
 * Flutter/Dart Code Generator
 * Generates Flutter widgets from Lumora IR
 * Enables React → Flutter conversion
 */
import { LumoraIR } from '../types/ir-types';
import { ErrorHandler } from '../errors/error-handler';
export interface FlutterGeneratorConfig {
    errorHandler?: ErrorHandler;
    widgetType?: 'stateless' | 'stateful';
    stateManagement?: 'setState' | 'bloc' | 'riverpod' | 'provider';
    indent?: string;
    addComments?: boolean;
    useConst?: boolean;
}
/**
 * Flutter Code Generator
 * Converts Lumora IR to Flutter/Dart code
 */
export declare class FlutterGenerator {
    private errorHandler;
    private config;
    private registry;
    private imports;
    constructor(config?: FlutterGeneratorConfig);
    /**
     * Generate Flutter widget from Lumora IR
     */
    generate(ir: LumoraIR): string;
    /**
     * Generate a single Flutter widget
     */
    private generateWidget;
    /**
     * Generate StatelessWidget
     */
    private generateStatelessWidget;
    /**
     * Generate StatefulWidget
     */
    private generateStatefulWidget;
    /**
     * Generate widget properties
     */
    private generateProperties;
    /**
     * Generate constructor
     */
    private generateConstructor;
    /**
     * Generate state variables
     */
    private generateStateVariables;
    /**
     * Generate lifecycle methods
     */
    private generateLifecycleMethods;
    /**
     * Generate event handlers
     */
    private generateEventHandlers;
    /**
     * Check if handler modifies state
     */
    private handlerModifiesState;
    /**
     * Generate widget tree
     */
    private generateWidgetTree;
    /**
     * Generate widget props
     */
    private generateWidgetProps;
    /**
     * Infer Dart type from value
     */
    private inferDartType;
    /**
     * Map TypeScript type to Dart type
     */
    private mapTypeScriptTypeToDart;
    /**
     * Serialize value to Dart code string
     */
    private serializeValue;
}
/**
 * Helper function to create Flutter generator
 */
export declare function createFlutterGenerator(config?: FlutterGeneratorConfig): FlutterGenerator;
/**
 * Helper function to generate Flutter code from IR
 */
export declare function generateFlutterCode(ir: LumoraIR, config?: FlutterGeneratorConfig): string;
