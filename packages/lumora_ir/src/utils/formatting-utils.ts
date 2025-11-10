/**
 * Formatting Utilities
 * Helper functions for applying code formatting preferences
 */

import { ModeConfig, FormattingPreferences } from '../config/mode-config';

/**
 * Format TypeScript/JavaScript code according to config preferences
 */
export function formatTypeScriptCode(code: string, config: ModeConfig): string {
  const prefs = config.getFormattingPreferences();
  let formatted = code;

  // Apply indentation
  formatted = applyIndentation(formatted, prefs);

  // Apply semicolons
  if (prefs.semicolons !== undefined) {
    formatted = applySemicolons(formatted, prefs.semicolons);
  }

  // Apply quotes
  if (prefs.singleQuote !== undefined) {
    formatted = applyQuotes(formatted, prefs.singleQuote);
  }

  // Apply line width (basic wrapping)
  if (prefs.lineWidth) {
    formatted = applyLineWidth(formatted, prefs.lineWidth);
  }

  return formatted;
}

/**
 * Format Dart code according to config preferences
 */
export function formatDartCode(code: string, config: ModeConfig): string {
  const prefs = config.getFormattingPreferences();
  let formatted = code;

  // Apply indentation
  formatted = applyIndentation(formatted, prefs);

  // Dart always uses semicolons, so we don't need to handle that

  // Apply line width
  if (prefs.lineWidth) {
    formatted = applyLineWidth(formatted, prefs.lineWidth);
  }

  return formatted;
}

/**
 * Apply indentation preferences
 */
function applyIndentation(code: string, prefs: FormattingPreferences): string {
  const indentSize = prefs.indentSize || 2;
  const useTabs = prefs.useTabs || false;
  const indentChar = useTabs ? '\t' : ' '.repeat(indentSize);

  // Split into lines
  const lines = code.split('\n');
  let indentLevel = 0;
  const formattedLines: string[] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (trimmed === '') {
      formattedLines.push('');
      continue;
    }

    // Decrease indent for closing braces/brackets
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Apply current indent level
    const indentedLine = indentChar.repeat(indentLevel) + trimmed;
    formattedLines.push(indentedLine);

    // Increase indent for opening braces/brackets
    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
      indentLevel++;
    }

    // Handle closing on same line
    if (
      (trimmed.includes('{') && trimmed.includes('}')) ||
      (trimmed.includes('[') && trimmed.includes(']'))
    ) {
      // Don't change indent level for single-line blocks
    }
  }

  return formattedLines.join('\n');
}

/**
 * Apply semicolon preferences
 */
function applySemicolons(code: string, useSemicolons: boolean): string {
  if (useSemicolons) {
    // Add semicolons where missing (basic implementation)
    return code.replace(/([^;\s\{\}])\s*\n/g, '$1;\n');
  } else {
    // Remove semicolons (basic implementation)
    return code.replace(/;(\s*\n)/g, '$1');
  }
}

/**
 * Apply quote preferences
 */
function applyQuotes(code: string, useSingleQuote: boolean): string {
  if (useSingleQuote) {
    // Convert double quotes to single quotes (avoiding escaped quotes)
    return code.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, "'$1'");
  } else {
    // Convert single quotes to double quotes (avoiding escaped quotes)
    return code.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');
  }
}

/**
 * Apply line width preferences (basic wrapping)
 */
function applyLineWidth(code: string, maxWidth: number): string {
  const lines = code.split('\n');
  const wrappedLines: string[] = [];

  for (const line of lines) {
    if (line.length <= maxWidth) {
      wrappedLines.push(line);
      continue;
    }

    // Simple wrapping at commas or operators
    const wrapped = wrapLongLine(line, maxWidth);
    wrappedLines.push(...wrapped);
  }

  return wrappedLines.join('\n');
}

/**
 * Wrap a long line at appropriate break points
 */
function wrapLongLine(line: string, maxWidth: number): string[] {
  if (line.length <= maxWidth) {
    return [line];
  }

  const result: string[] = [];
  const indent = line.match(/^\s*/)?.[0] || '';
  const content = line.trim();

  // Try to break at commas, operators, or spaces
  const breakPoints = [', ', ' && ', ' || ', ' + ', ' - ', ' = ', ' '];
  let remaining = content;
  let currentLine = indent;

  while (remaining.length > 0) {
    const availableWidth = maxWidth - currentLine.length;

    if (remaining.length <= availableWidth) {
      currentLine += remaining;
      result.push(currentLine);
      break;
    }

    // Find best break point
    let breakIndex = -1;
    for (const breakPoint of breakPoints) {
      const index = remaining.lastIndexOf(breakPoint, availableWidth);
      if (index > breakIndex) {
        breakIndex = index + breakPoint.length;
      }
    }

    if (breakIndex <= 0) {
      // No good break point found, just break at max width
      breakIndex = availableWidth;
    }

    currentLine += remaining.substring(0, breakIndex);
    result.push(currentLine);
    remaining = remaining.substring(breakIndex).trim();
    currentLine = indent + '  '; // Add extra indent for continuation
  }

  return result;
}

/**
 * Get indentation string based on preferences
 */
export function getIndentString(config: ModeConfig, level: number = 1): string {
  const prefs = config.getFormattingPreferences();
  const indentSize = prefs.indentSize || 2;
  const useTabs = prefs.useTabs || false;
  const indentChar = useTabs ? '\t' : ' '.repeat(indentSize);
  return indentChar.repeat(level);
}

/**
 * Format a code block with proper indentation
 */
export function formatCodeBlock(
  code: string,
  config: ModeConfig,
  baseIndentLevel: number = 0
): string {
  const prefs = config.getFormattingPreferences();
  const indentSize = prefs.indentSize || 2;
  const useTabs = prefs.useTabs || false;
  const baseIndent = useTabs ? '\t'.repeat(baseIndentLevel) : ' '.repeat(indentSize * baseIndentLevel);

  const lines = code.split('\n');
  return lines.map((line) => (line.trim() ? baseIndent + line : '')).join('\n');
}

/**
 * Apply trailing comma preferences
 */
export function applyTrailingComma(
  code: string,
  config: ModeConfig,
  context: 'array' | 'object' | 'function'
): string {
  const prefs = config.getFormattingPreferences();
  const trailingComma = prefs.trailingComma || 'es5';

  if (trailingComma === 'none') {
    // Remove trailing commas
    return code.replace(/,(\s*[\}\]\)])/g, '$1');
  } else if (trailingComma === 'all') {
    // Add trailing commas everywhere
    return code.replace(/([^\,\s])(\s*[\}\]\)])/g, '$1,$2');
  } else {
    // ES5: trailing commas in arrays and objects, but not in function parameters
    if (context === 'function') {
      return code.replace(/,(\s*\))/g, '$1');
    } else {
      return code.replace(/([^\,\s])(\s*[\}\]])/g, '$1,$2');
    }
  }
}

/**
 * Format import statements according to preferences
 */
export function formatImports(imports: string[], config: ModeConfig): string {
  const prefs = config.getFormattingPreferences();
  const quote = prefs.singleQuote ? "'" : '"';
  const semi = prefs.semicolons ? ';' : '';

  return imports
    .sort() // Sort imports alphabetically
    .map((imp) => {
      // Replace quotes
      const withQuotes = imp.replace(/['"]/g, quote);
      // Add/remove semicolons
      const withSemi = withQuotes.endsWith(';') ? withQuotes.slice(0, -1) : withQuotes;
      return withSemi + semi;
    })
    .join('\n');
}

