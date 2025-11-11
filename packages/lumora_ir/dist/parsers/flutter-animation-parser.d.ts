/**
 * Flutter Animation Parser
 * Parses Flutter animations (AnimationController, Tween, ImplicitAnimations) to Lumora Animation Schema
 */
import { AnimationSchema } from '../types/animation-types';
import { ErrorHandler } from '../errors/error-handler';
/**
 * Configuration for Flutter animation parser
 */
export interface FlutterAnimationParserConfig {
    errorHandler?: ErrorHandler;
}
/**
 * Flutter Animation Parser
 * Converts Flutter animation code to Lumora Animation Schema
 */
export declare class FlutterAnimationParser {
    private errorHandler;
    private animationCounter;
    constructor(config?: FlutterAnimationParserConfig);
    /**
     * Parse Flutter code for animations
     */
    parseAnimations(source: string, filename: string): AnimationSchema[];
    /**
     * Parse AnimationController declarations
     */
    private parseAnimationControllers;
    /**
     * Extract duration from parameters
     */
    private extractDuration;
    /**
     * Extract reverse duration from parameters
     */
    private extractReverseDuration;
    /**
     * Extract vsync from parameters
     */
    private extractVsync;
    /**
     * Extract bound value from parameters
     */
    private extractBound;
    /**
     * Parse Tween animations
     */
    private parseTweenAnimations;
    /**
     * Parse implicit animations (AnimatedContainer, AnimatedOpacity, etc.)
     */
    private parseImplicitAnimations;
    /**
     * Extract animated properties from implicit animation widget
     */
    private extractAnimatedProperties;
    /**
     * Extract curve from parameters
     */
    private extractCurve;
    /**
     * Extract curve with fallback
     */
    private extractCurveWithFallback;
    /**
     * Extract onEnd callback from parameters
     */
    private extractOnEnd;
    /**
     * Parse animation builders
     */
    private parseAnimationBuilders;
    /**
     * Convert Tween to animation schema
     */
    private convertTweenToSchema;
    /**
     * Extract property name from Tween type
     */
    private extractPropertyNameFromTweenType;
    /**
     * Convert implicit animation to schema
     */
    private convertImplicitAnimationToSchema;
    /**
     * Convert animation builder to schema
     */
    private convertAnimationBuilderToSchema;
    /**
     * Map Flutter Curves to Lumora easing
     */
    private mapFlutterCurve;
    /**
     * Parse value from string
     */
    private parseValue;
    /**
     * Get line number from index
     */
    private getLineNumber;
    /**
     * Generate unique animation ID
     */
    private generateAnimationId;
}
/**
 * Get Flutter animation parser instance
 */
export declare function getFlutterAnimationParser(config?: FlutterAnimationParserConfig): FlutterAnimationParser;
/**
 * Reset Flutter animation parser instance
 */
export declare function resetFlutterAnimationParser(): void;
