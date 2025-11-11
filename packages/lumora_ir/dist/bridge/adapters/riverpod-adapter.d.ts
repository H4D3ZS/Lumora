/**
 * Riverpod State Adapter
 * Converts state definitions to/from Flutter Riverpod pattern
 */
import { StateDefinition } from '../../types/ir-types';
import { BaseStateAdapter, AdapterConfig, GeneratedCode } from './base-adapter';
/**
 * Riverpod Adapter
 * Generates StateNotifier and Provider code for Flutter Riverpod
 */
export declare class RiverpodAdapter extends BaseStateAdapter {
    readonly name = "riverpod";
    /**
     * Convert state definition to Riverpod pattern code
     */
    convertToFlutter(state: StateDefinition, componentName: string, config?: AdapterConfig): GeneratedCode;
    /**
     * Generate state class
     */
    private generateStateClass;
    /**
     * Generate StateNotifier class
     */
    private generateNotifierClass;
    /**
     * Generate update method for StateNotifier
     */
    private generateUpdateMethod;
    /**
     * Generate provider definition
     */
    private generateProvider;
    /**
     * Generate imports
     */
    private generateImports;
    /**
     * Convert Riverpod code back to state definition
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
