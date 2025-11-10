/**
 * Error Handler - Comprehensive error handling and recovery system
 * 
 * Provides structured error handling with detailed messages, suggestions,
 * and recovery strategies for parse errors, conversion failures, and more.
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Error categories
 */
export enum ErrorCategory {
  PARSE = 'parse',
  CONVERSION = 'conversion',
  VALIDATION = 'validation',
  FILE_SYSTEM = 'file_system',
  NETWORK = 'network',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown',
}

/**
 * Source location information
 */
export interface SourceLocation {
  filePath: string;
  line?: number;
  column?: number;
  length?: number;
  snippet?: string;
}

/**
 * Error suggestion
 */
export interface ErrorSuggestion {
  message: string;
  action?: string;
  code?: string;
}

/**
 * Structured error information
 */
export interface LumoraError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  description?: string;
  location?: SourceLocation;
  suggestions: ErrorSuggestion[];
  originalError?: Error;
  timestamp: number;
  recoverable: boolean;
}

/**
 * Parse error details
 */
export interface ParseErrorDetails {
  filePath: string;
  line?: number;
  column?: number;
  errorMessage: string;
  sourceCode?: string;
  framework?: 'react' | 'flutter';
}

/**
 * Error Handler class
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: LumoraError[] = [];
  private maxLogSize = 100;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle parse error with detailed information
   */
  public handleParseError(details: ParseErrorDetails): LumoraError {
    const error: LumoraError = {
      category: ErrorCategory.PARSE,
      severity: ErrorSeverity.ERROR,
      message: `Parse error in ${details.filePath}`,
      description: details.errorMessage,
      location: {
        filePath: details.filePath,
        line: details.line,
        column: details.column,
        snippet: this.extractCodeSnippet(details.sourceCode, details.line),
      },
      suggestions: this.generateParseSuggestions(details),
      timestamp: Date.now(),
      recoverable: false,
    };

    this.logError(error);
    return error;
  }

  /**
   * Extract code snippet around error location
   */
  private extractCodeSnippet(sourceCode: string | undefined, line: number | undefined): string | undefined {
    if (!sourceCode || !line) {
      return undefined;
    }

    const lines = sourceCode.split('\n');
    const startLine = Math.max(0, line - 3);
    const endLine = Math.min(lines.length, line + 2);
    
    const snippet = lines
      .slice(startLine, endLine)
      .map((l, i) => {
        const lineNum = startLine + i + 1;
        const marker = lineNum === line ? '→' : ' ';
        return `${marker} ${lineNum.toString().padStart(4)} | ${l}`;
      })
      .join('\n');

    return snippet;
  }

  /**
   * Generate suggestions for parse errors
   */
  private generateParseSuggestions(details: ParseErrorDetails): ErrorSuggestion[] {
    const suggestions: ErrorSuggestion[] = [];
    const errorMsg = details.errorMessage.toLowerCase();
    const framework = details.framework || 'react';

    // Common syntax errors
    if (errorMsg.includes('unexpected token') || errorMsg.includes('syntax error')) {
      suggestions.push({
        message: `Check for missing or extra brackets, parentheses, or semicolons`,
        action: 'Review the syntax around the error location',
      });

      if (framework === 'react') {
        suggestions.push({
          message: 'Ensure JSX is properly closed and nested',
          action: 'Verify all JSX tags have matching closing tags',
        });
      } else {
        suggestions.push({
          message: 'Ensure all Dart statements end with semicolons',
          action: 'Check for missing semicolons or commas',
        });
      }
    }

    // Import errors
    if (errorMsg.includes('import') || errorMsg.includes('module')) {
      suggestions.push({
        message: 'Verify all imports are correct and modules exist',
        action: 'Check import paths and installed dependencies',
      });
    }

    // Type errors
    if (errorMsg.includes('type')) {
      suggestions.push({
        message: 'Check type annotations and ensure they are valid',
        action: framework === 'react' 
          ? 'Verify TypeScript types are correctly defined'
          : 'Verify Dart types are correctly defined',
      });
    }

    // Generic suggestion
    suggestions.push({
      message: 'Try simplifying the code to isolate the issue',
      action: 'Comment out sections to identify the problematic code',
    });

    return suggestions;
  }

  /**
   * Format error for display
   */
  public formatError(error: LumoraError): string {
    let output = '';

    // Header
    const icon = this.getSeverityIcon(error.severity);
    output += `\n${icon} ${error.severity.toUpperCase()}: ${error.message}\n`;

    // Description
    if (error.description) {
      output += `\n${error.description}\n`;
    }

    // Location
    if (error.location) {
      output += `\n📍 Location:\n`;
      output += `   File: ${error.location.filePath}\n`;
      
      if (error.location.line) {
        output += `   Line: ${error.location.line}`;
        if (error.location.column) {
          output += `, Column: ${error.location.column}`;
        }
        output += '\n';
      }

      // Code snippet
      if (error.location.snippet) {
        output += `\n📝 Code:\n${error.location.snippet}\n`;
      }
    }

    // Suggestions
    if (error.suggestions.length > 0) {
      output += `\n💡 Suggestions:\n`;
      error.suggestions.forEach((suggestion, index) => {
        output += `   ${index + 1}. ${suggestion.message}\n`;
        if (suggestion.action) {
          output += `      → ${suggestion.action}\n`;
        }
        if (suggestion.code) {
          output += `      \`${suggestion.code}\`\n`;
        }
      });
    }

    // Timestamp
    const date = new Date(error.timestamp);
    output += `\n⏰ Time: ${date.toISOString()}\n`;

    return output;
  }

  /**
   * Get severity icon
   */
  private getSeverityIcon(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.INFO:
        return 'ℹ️';
      case ErrorSeverity.WARNING:
        return '⚠️';
      case ErrorSeverity.ERROR:
        return '❌';
      case ErrorSeverity.CRITICAL:
        return '🔥';
      default:
        return '•';
    }
  }

  /**
   * Log error to internal log
   */
  private logError(error: LumoraError): void {
    this.errorLog.push(error);

    // Maintain max log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  /**
   * Get error log
   */
  public getErrorLog(): LumoraError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get errors by category
   */
  public getErrorsByCategory(category: ErrorCategory): LumoraError[] {
    return this.errorLog.filter(e => e.category === category);
  }

  /**
   * Get errors by severity
   */
  public getErrorsBySeverity(severity: ErrorSeverity): LumoraError[] {
    return this.errorLog.filter(e => e.severity === severity);
  }
}

/**
 * Get singleton instance of ErrorHandler
 */
export function getErrorHandler(): ErrorHandler {
  return ErrorHandler.getInstance();
}
