/**
 * Platform-Specific Code Parser
 * Detects and extracts platform-specific code from React and Flutter
 */
import * as t from '@babel/types';
import { PlatformExtractionResult } from '../types/platform-types';
import { ErrorHandler } from '../errors/error-handler';
/**
 * Platform parser for React/TypeScript code
 */
export declare class ReactPlatformParser {
    private errorHandler;
    private platformCodeBlocks;
    private warnings;
    private blockIdCounter;
    constructor(errorHandler?: ErrorHandler);
    /**
     * Extract platform-specific code from React AST
     */
    extractPlatformCode(ast: t.File, sourceCode: string): PlatformExtractionResult;
    /**
     * Detect if an expression is a platform check
     */
    private detectPlatformCheck;
    /**
     * Check if expression is Platform.OS access
     */
    private isPlatformOSAccess;
    /**
     * Create platform check object
     */
    private createPlatformCheck;
    /**
     * Extract platform-specific code block from if statement
     */
    private extractPlatformBlock;
    /**
     * Extract platform-specific code from ternary expression
     */
    private extractTernaryPlatformBlock;
    /**
     * Extract code block from statement
     */
    private extractCodeBlock;
    /**
     * Extract code from expression
     */
    private extractExpressionCode;
    /**
     * Get platform types from platform check
     */
    private getPlatformsFromCheck;
}
/**
 * Platform parser for Flutter/Dart code
 */
export declare class DartPlatformParser {
    private errorHandler;
    private platformCodeBlocks;
    private warnings;
    private blockIdCounter;
    constructor(errorHandler?: ErrorHandler);
    /**
     * Extract platform-specific code from Dart source
     */
    extractPlatformCode(dartSource: string): PlatformExtractionResult;
    /**
     * Find platform checks in Dart source code
     */
    private findPlatformChecks;
    /**
     * Extract platform-specific code block from Dart
     */
    private extractDartPlatformBlock;
    /**
     * Find if statement containing the platform check
     */
    private findIfStatement;
    /**
     * Extract code block between positions
     */
    private extractBlock;
    /**
     * Convert platform check type to platform type
     */
    private getPlatformType;
}
