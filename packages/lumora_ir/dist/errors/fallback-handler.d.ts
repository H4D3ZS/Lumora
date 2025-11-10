/**
 * Fallback Handler - Handles unmapped widgets with fallback strategies
 *
 * Provides fallback widgets when no mapping is found, with detailed logging
 * and suggestions for adding custom mappings.
 */
/**
 * Fallback strategy
 */
export declare enum FallbackStrategy {
    GENERIC = "generic",// Use generic container/div
    SIMILAR = "similar",// Use similar widget based on name
    PRESERVE = "preserve",// Keep original widget name with comment
    CUSTOM = "custom"
}
/**
 * Fallback result
 */
export interface FallbackResult {
    widgetName: string;
    strategy: FallbackStrategy;
    warning: string;
    suggestion: string;
    originalWidget: string;
}
/**
 * Unmapped widget record
 */
export interface UnmappedWidgetRecord {
    originalWidget: string;
    sourceFramework: 'react' | 'flutter';
    targetFramework: 'react' | 'flutter';
    fallbackUsed: string;
    occurrences: number;
    firstSeen: number;
    lastSeen: number;
}
/**
 * Fallback Handler class
 */
export declare class FallbackHandler {
    private static instance;
    private registry;
    private unmappedWidgets;
    private strategy;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): FallbackHandler;
    /**
     * Set fallback strategy
     */
    setStrategy(strategy: FallbackStrategy): void;
    /**
     * Get fallback strategy
     */
    getStrategy(): FallbackStrategy;
    /**
     * Get fallback widget for unmapped widget
     */
    getFallbackWidget(originalWidget: string, sourceFramework: 'react' | 'flutter', targetFramework: 'react' | 'flutter'): FallbackResult;
    /**
     * Record unmapped widget
     */
    private recordUnmappedWidget;
    /**
     * Get generic fallback widget
     */
    private getGenericFallback;
    /**
     * Find similar widget based on name
     */
    private findSimilarWidget;
    /**
     * Get custom fallback from configuration
     */
    private getCustomFallback;
    /**
     * Generate warning message
     */
    private generateWarning;
    /**
     * Generate suggestion message
     */
    private generateSuggestion;
    /**
     * Get all unmapped widgets
     */
    getUnmappedWidgets(): UnmappedWidgetRecord[];
    /**
     * Get unmapped widgets summary
     */
    getUnmappedWidgetsSummary(): string;
    /**
     * Clear unmapped widgets log
     */
    clearUnmappedWidgets(): void;
    /**
     * Export unmapped widgets to YAML template
     */
    exportUnmappedWidgetsTemplate(): string;
}
/**
 * Get singleton instance of FallbackHandler
 */
export declare function getFallbackHandler(): FallbackHandler;
