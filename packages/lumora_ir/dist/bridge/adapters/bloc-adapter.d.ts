/**
 * Bloc State Adapter
 * Converts state definitions to/from Flutter Bloc pattern
 */
import { StateDefinition } from '../../types/ir-types';
import { BaseStateAdapter, AdapterConfig, GeneratedCode } from './base-adapter';
/**
 * Bloc Adapter
 * Generates Bloc, Event, and State classes for Flutter
 */
export declare class BlocAdapter extends BaseStateAdapter {
    readonly name = "bloc";
    /**
     * Convert state definition to Bloc pattern code
     */
    convertToFlutter(state: StateDefinition, componentName: string, config?: AdapterConfig): GeneratedCode;
    /**
     * Generate state class
     */
    private generateStateClass;
    /**
     * Generate event classes
     */
    private generateEventClasses;
    /**
     * Generate individual event class
     */
    private generateEventClass;
    /**
     * Generate Bloc class
     */
    private generateBlocClass;
    /**
     * Generate event handler method
     */
    private generateEventHandler;
    /**
     * Generate imports
     */
    private generateImports;
    /**
     * Convert Bloc code back to state definition
     */
    convertFromFlutter(dartCode: string, componentName: string): StateDefinition;
    /**
     * Map Flutter type to TypeScript type
     */
    private mapFlutterTypeToTS;
    /**
     * Get default value for type
     */
    private getDefaultValue;
    /**
     * Generate usage example
     */
    generateUsageExample(componentName: string): string;
}
