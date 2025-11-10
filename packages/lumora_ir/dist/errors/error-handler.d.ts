/**
 * Error Handler - Comprehensive error handling and recovery system
 *
 * Provides structured error handling with detailed messages, suggestions,
 * and recovery strategies for parse errors, conversion failures, and more.
 */
/**
 * Error severity levels
 */
export declare enum ErrorSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
/**
 * Error categories
 */
export declare enum ErrorCategory {
    PARSE = "parse",
    CONVERSION = "conversion",
    VALIDATION = "validation",
    FILE_SYSTEM = "file_system",
    NETWORK = "network",
    CONFIGURATION = "configuration",
    UNKNOWN = "unknown"
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
export declare class ErrorHandler {
    private static instance;
    private errorLog;
    private maxLogSize;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): ErrorHandler;
    /**
     * Handle parse error with detailed information
     */
    handleParseError(details: ParseErrorDetails): LumoraError;
    /**
     * Extract code snippet around error location
     */
    private extractCodeSnippet;
    /**
     * Generate suggestions for parse errors
     */
    private generateParseSuggestions;
    /**
     * Format error for display
     */
    formatError(error: LumoraError): string;
    /**
     * Get severity icon
     */
    private getSeverityIcon;
    /**
     * Log error to internal log
     */
    private logError;
    /**
     * Get error log
     */
    getErrorLog(): LumoraError[];
    /**
     * Clear error log
     */
    clearErrorLog(): void;
    /**
     * Get errors by category
     */
    getErrorsByCategory(category: ErrorCategory): LumoraError[];
    /**
     * Get errors by severity
     */
    getErrorsBySeverity(severity: ErrorSeverity): LumoraError[];
}
/**
 * Get singleton instance of ErrorHandler
 */
export declare function getErrorHandler(): ErrorHandler;
