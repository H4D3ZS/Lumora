/**
 * Naming Utilities
 * Helper functions for applying naming conventions
 */

import { ModeConfig } from '../config/mode-config';

/**
 * Apply file naming convention from config
 */
export function applyFileNaming(name: string, config: ModeConfig): string {
  return config.applyFileNamingConvention(name);
}

/**
 * Apply identifier naming convention from config
 */
export function applyIdentifierNaming(name: string, config: ModeConfig): string {
  return config.applyIdentifierNamingConvention(name);
}

/**
 * Apply component naming convention from config
 */
export function applyComponentNaming(name: string, config: ModeConfig): string {
  return config.applyComponentNamingConvention(name);
}

/**
 * Generate file name with proper extension and naming convention
 */
export function generateFileName(
  baseName: string,
  extension: string,
  config: ModeConfig
): string {
  const convertedName = config.applyFileNamingConvention(baseName);
  return `${convertedName}.${extension}`;
}

/**
 * Generate class/component name with proper naming convention
 */
export function generateClassName(baseName: string, config: ModeConfig): string {
  return config.applyComponentNamingConvention(baseName);
}

/**
 * Generate variable/function name with proper naming convention
 */
export function generateIdentifierName(baseName: string, config: ModeConfig): string {
  return config.applyIdentifierNamingConvention(baseName);
}

/**
 * Convert between different naming conventions
 */
export function convertNamingConvention(
  name: string,
  from: 'snake_case' | 'kebab-case' | 'PascalCase' | 'camelCase',
  to: 'snake_case' | 'kebab-case' | 'PascalCase' | 'camelCase'
): string {
  if (from === to) return name;

  // Parse the name into words based on the source convention
  let words: string[] = [];

  switch (from) {
    case 'snake_case':
      words = name.split('_');
      break;
    case 'kebab-case':
      words = name.split('-');
      break;
    case 'PascalCase':
    case 'camelCase':
      // Split on capital letters
      words = name.split(/(?=[A-Z])/).filter((w) => w.length > 0);
      break;
  }

  // Convert to target convention
  switch (to) {
    case 'snake_case':
      return words.map((w) => w.toLowerCase()).join('_');
    case 'kebab-case':
      return words.map((w) => w.toLowerCase()).join('-');
    case 'PascalCase':
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    case 'camelCase':
      return words
        .map((w, i) =>
          i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('');
  }
}

