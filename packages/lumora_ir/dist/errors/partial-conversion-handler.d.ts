/**
 * Partial Conversion Handler - Handles partial conversions with TODO markers
 *
 * Enables completing convertible parts of code while marking problematic
 * sections with TODO comments for manual implementation.
 */
/**
 * Conversion issue severity
 */
export declare enum ConversionIssueSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error"
}
/**
 * Conversion issue
 */
export interface ConversionIssue {
    severity: ConversionIssueSeverity;
    message: string;
    location?: {
        line?: number;
        column?: number;
        nodeId?: string;
    };
    suggestion?: string;
    code?: string;
}
/**
 * Partial conversion result
 */
export interface PartialConversionResult {
    success: boolean;
    code: string;
    issues: ConversionIssue[];
    completionPercentage: number;
    convertedNodes: number;
    totalNodes: number;
    hasManualWork: boolean;
}
/**
 * TODO marker configuration
 */
export interface TodoMarkerConfig {
    prefix: string;
    includeLineNumber: boolean;
    includeTimestamp: boolean;
    includeIssueId: boolean;
}
/**
 * Partial Conversion Handler class
 */
export declare class PartialConversionHandler {
    private static instance;
    private issues;
    private convertedNodes;
    private totalNodes;
    private todoConfig;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): PartialConversionHandler;
    /**
     * Configure TODO marker format
     */
    configureTodoMarker(config: Partial<TodoMarkerConfig>): void;
    /**
     * Start new conversion session
     */
    startConversion(totalNodes: number): void;
    /**
     * Record successful node conversion
     */
    recordSuccess(): void;
    /**
     * Record conversion issue
     */
    recordIssue(issue: ConversionIssue): void;
    /**
     * Generate TODO comment for unconverted code
     */
    generateTodoComment(framework: 'react' | 'flutter', issue: ConversionIssue, originalCode?: string): string;
    /**
     * Generate fallback code with TODO marker
     */
    generateFallbackCode(framework: 'react' | 'flutter', issue: ConversionIssue, originalCode?: string): string;
    /**
     * Wrap problematic code section with TODO markers
     */
    wrapWithTodoMarkers(framework: 'react' | 'flutter', code: string, issue: ConversionIssue): string;
    /**
     * Get conversion result
     */
    getResult(generatedCode: string): PartialConversionResult;
    /**
     * Format conversion summary
     */
    formatSummary(result: PartialConversionResult): string;
    /**
     * Get issue icon
     */
    private getIssueIcon;
    /**
     * Generate issue report file content
     */
    generateIssueReport(result: PartialConversionResult, sourceFile: string): string;
    /**
     * Clear conversion state
     */
    clear(): void;
}
/**
 * Get singleton instance of PartialConversionHandler
 */
export declare function getPartialConversionHandler(): PartialConversionHandler;
