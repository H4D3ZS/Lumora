/**
 * Provider State Adapter
 * Converts state definitions to/from Flutter Provider pattern
 */
import { StateDefinition } from '../../types/ir-types';
import { BaseStateAdapter, AdapterConfig, GeneratedCode } from './base-adapter';
/**
 * Provider Adapter
 * Generates ChangeNotifier classes for Flutter Provider
 */
export declare class ProviderAdapter extends BaseStateAdapter {
    readonly name = "provider";
    /**
     * Convert state definition to Provider pattern code
     */
    convertToFlutter(state: StateDefinition, componentName: string, config?: AdapterConfig): GeneratedCode;
    /**
     * Generate ChangeNotifier provider class
     */
    private generateProviderClass;
    /**
     * Generate setter method
     */
    private generateSetter;
    /**
     * Generate imports
     */
    private generateImports;
    /**
     * Convert Provider code back to state definition
     */
    convertFromFlutter(dartCode: string, componentName: string): StateDefinition;
    /**
     * Map Flutter type to TypeScript type
     */
    private mapFlutterTypeToTS;
    /**
     * Parse initial value from Dart code
     */
    private parseInitialValue;
    /**
     * Generate usage example
     */
    generateUsageExample(componentName: string): string;
}
