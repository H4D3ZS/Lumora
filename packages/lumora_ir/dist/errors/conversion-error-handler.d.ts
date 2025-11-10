/**
 * Conversion Error Handler - Handles conversion failures with detailed explanations
 *
 * Provides specific error handling for conversion failures between React and Flutter,
 * including explanations of why conversion failed and alternative approaches.
 */
import { LumoraError } from './error-handler';
/**
 * Conversion failure reason
 */
export declare enum ConversionFailureReason {
    UNSUPPORTED_FEATURE = "unsupported_feature",
    UNMAPPED_WIDGET = "unmapped_widget",
    INCOMPATIBLE_PATTERN = "incompatible_pattern",
    MISSING_DEPENDENCY = "missing_dependency",
    INVALID_IR = "invalid_ir",
    GENERATION_ERROR = "generation_error"
}
/**
 * Conversion error details
 */
export interface ConversionErrorDetails {
    reason: ConversionFailureReason;
    sourceFramework: 'react' | 'flutter';
    targetFramework: 'react' | 'flutter';
    filePath: string;
    featureName?: string;
    widgetType?: string;
    patternName?: string;
    errorMessage: string;
    location?: {
        line?: number;
        column?: number;
    };
}
/**
 * Alternative approach suggestion
 */
export interface AlternativeApproach {
    title: string;
    description: string;
    example?: string;
    difficulty: 'easy' | 'medium' | 'hard';
}
/**
 * Conversion Error Handler class
 */
export declare class ConversionErrorHandler {
    private static instance;
    private errorHandler;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): ConversionErrorHandler;
    /**
     * Handle conversion failure
     */
    handleConversionFailure(details: ConversionErrorDetails): LumoraError;
    /**
     * Get failure description based on reason
     */
    private getFailureDescription;
    /**
     * Generate suggestions for conversion failures
     */
    private generateConversionSuggestions;
    /**
     * Get widget mapping example
     */
    private getWidgetMappingExample;
    /**
     * Get similar widget suggestion
     */
    private getSimilarWidgetSuggestion;
    /**
     * Get alternative approaches for incompatible patterns
     */
    private getAlternativeApproaches;
    /**
     * Check if error is recoverable
     */
    private isRecoverable;
    /**
     * Format conversion error for display
     */
    formatConversionError(error: LumoraError): string;
}
/**
 * Get singleton instance of ConversionErrorHandler
 */
export declare function getConversionErrorHandler(): ConversionErrorHandler;
