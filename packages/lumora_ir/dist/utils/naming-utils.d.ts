/**
 * Naming Utilities
 * Helper functions for applying naming conventions
 */
import { ModeConfig } from '../config/mode-config';
/**
 * Apply file naming convention from config
 */
export declare function applyFileNaming(name: string, config: ModeConfig): string;
/**
 * Apply identifier naming convention from config
 */
export declare function applyIdentifierNaming(name: string, config: ModeConfig): string;
/**
 * Apply component naming convention from config
 */
export declare function applyComponentNaming(name: string, config: ModeConfig): string;
/**
 * Generate file name with proper extension and naming convention
 */
export declare function generateFileName(baseName: string, extension: string, config: ModeConfig): string;
/**
 * Generate class/component name with proper naming convention
 */
export declare function generateClassName(baseName: string, config: ModeConfig): string;
/**
 * Generate variable/function name with proper naming convention
 */
export declare function generateIdentifierName(baseName: string, config: ModeConfig): string;
/**
 * Convert between different naming conventions
 */
export declare function convertNamingConvention(name: string, from: 'snake_case' | 'kebab-case' | 'PascalCase' | 'camelCase', to: 'snake_case' | 'kebab-case' | 'PascalCase' | 'camelCase'): string;
