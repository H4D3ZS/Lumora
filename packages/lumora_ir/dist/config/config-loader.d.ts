/**
 * Configuration Loader
 * Integrates ModeConfig with WidgetMappingRegistry and other components
 */
import { ModeConfig } from './mode-config';
import { WidgetMappingRegistry } from '../registry/widget-mapping-registry';
/**
 * Load and apply configuration to all components
 */
export declare function loadAndApplyConfig(projectRoot?: string): {
    modeConfig: ModeConfig;
    registry: WidgetMappingRegistry;
};
/**
 * Initialize configuration with custom mappings
 */
export declare function initConfigWithMappings(projectRoot: string, mode: 'react' | 'flutter' | 'universal', customMappingsPath?: string): {
    modeConfig: ModeConfig;
    registry: WidgetMappingRegistry;
};
/**
 * Reload configuration and custom mappings
 */
export declare function reloadConfig(modeConfig: ModeConfig, registry: WidgetMappingRegistry): void;
