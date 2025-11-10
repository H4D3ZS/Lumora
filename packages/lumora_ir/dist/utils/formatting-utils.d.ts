/**
 * Formatting Utilities
 * Helper functions for applying code formatting preferences
 */
import { ModeConfig } from '../config/mode-config';
/**
 * Format TypeScript/JavaScript code according to config preferences
 */
export declare function formatTypeScriptCode(code: string, config: ModeConfig): string;
/**
 * Format Dart code according to config preferences
 */
export declare function formatDartCode(code: string, config: ModeConfig): string;
/**
 * Get indentation string based on preferences
 */
export declare function getIndentString(config: ModeConfig, level?: number): string;
/**
 * Format a code block with proper indentation
 */
export declare function formatCodeBlock(code: string, config: ModeConfig, baseIndentLevel?: number): string;
/**
 * Apply trailing comma preferences
 */
export declare function applyTrailingComma(code: string, config: ModeConfig, context: 'array' | 'object' | 'function'): string;
/**
 * Format import statements according to preferences
 */
export declare function formatImports(imports: string[], config: ModeConfig): string;
