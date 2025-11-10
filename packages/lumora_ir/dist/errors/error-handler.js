"use strict";
/**
 * Error Handler - Comprehensive error handling and recovery system
 *
 * Provides structured error handling with detailed messages, suggestions,
 * and recovery strategies for parse errors, conversion failures, and more.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.ErrorCategory = exports.ErrorSeverity = void 0;
exports.getErrorHandler = getErrorHandler;
/**
 * Error severity levels
 */
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["INFO"] = "info";
    ErrorSeverity["WARNING"] = "warning";
    ErrorSeverity["ERROR"] = "error";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * Error categories
 */
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["PARSE"] = "parse";
    ErrorCategory["CONVERSION"] = "conversion";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["FILE_SYSTEM"] = "file_system";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["CONFIGURATION"] = "configuration";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
/**
 * Error Handler class
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }
    /**
     * Handle parse error with detailed information
     */
    handleParseError(details) {
        const error = {
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
    extractCodeSnippet(sourceCode, line) {
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
    generateParseSuggestions(details) {
        const suggestions = [];
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
            }
            else {
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
    formatError(error) {
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
    getSeverityIcon(severity) {
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
    logError(error) {
        this.errorLog.push(error);
        // Maintain max log size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
    }
    /**
     * Get error log
     */
    getErrorLog() {
        return [...this.errorLog];
    }
    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }
    /**
     * Get errors by category
     */
    getErrorsByCategory(category) {
        return this.errorLog.filter(e => e.category === category);
    }
    /**
     * Get errors by severity
     */
    getErrorsBySeverity(severity) {
        return this.errorLog.filter(e => e.severity === severity);
    }
}
exports.ErrorHandler = ErrorHandler;
/**
 * Get singleton instance of ErrorHandler
 */
function getErrorHandler() {
    return ErrorHandler.getInstance();
}
