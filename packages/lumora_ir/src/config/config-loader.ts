/**
 * Configuration Loader
 * Integrates ModeConfig with WidgetMappingRegistry and other components
 */

import * as path from 'path';
import * as fs from 'fs';
import { ModeConfig } from './mode-config';
import { WidgetMappingRegistry, getRegistry } from '../registry/widget-mapping-registry';

/**
 * Load and apply configuration to all components
 */
export function loadAndApplyConfig(projectRoot?: string): {
  modeConfig: ModeConfig;
  registry: WidgetMappingRegistry;
} {
  // Load mode configuration
  const modeConfig = new ModeConfig(projectRoot);

  // Get widget mapping registry
  const registry = getRegistry();

  // Load custom widget mappings if specified
  const customMappingsPath = modeConfig.getCustomMappings();
  if (customMappingsPath) {
    const absolutePath = path.isAbsolute(customMappingsPath)
      ? customMappingsPath
      : path.join(projectRoot || process.cwd(), customMappingsPath);

    if (fs.existsSync(absolutePath)) {
      console.log(`Loading custom widget mappings from: ${absolutePath}`);
      registry.loadCustomMappings(absolutePath);
    } else {
      console.warn(
        `Custom widget mappings file not found: ${absolutePath}\n` +
        `Skipping custom mappings. Using default mappings only.`
      );
    }
  }

  return { modeConfig, registry };
}

/**
 * Initialize configuration with custom mappings
 */
export function initConfigWithMappings(
  projectRoot: string,
  mode: 'react' | 'flutter' | 'universal',
  customMappingsPath?: string
): {
  modeConfig: ModeConfig;
  registry: WidgetMappingRegistry;
} {
  // Initialize mode config
  const modeConfig = ModeConfig.init(projectRoot, mode as any, {
    customMappings: customMappingsPath,
  });

  // Get widget mapping registry
  const registry = getRegistry();

  // Load custom mappings if provided
  if (customMappingsPath) {
    const absolutePath = path.isAbsolute(customMappingsPath)
      ? customMappingsPath
      : path.join(projectRoot, customMappingsPath);

    if (fs.existsSync(absolutePath)) {
      registry.loadCustomMappings(absolutePath);
    }
  }

  return { modeConfig, registry };
}

/**
 * Reload configuration and custom mappings
 */
export function reloadConfig(modeConfig: ModeConfig, registry: WidgetMappingRegistry): void {
  // Reload mode config
  modeConfig.reload();

  // Reload custom mappings if specified
  const customMappingsPath = modeConfig.getCustomMappings();
  if (customMappingsPath) {
    const projectRoot = path.dirname(modeConfig.getConfigPath());
    const absolutePath = path.isAbsolute(customMappingsPath)
      ? customMappingsPath
      : path.join(projectRoot, customMappingsPath);

    if (fs.existsSync(absolutePath)) {
      registry.loadCustomMappings(absolutePath);
    }
  }
}

