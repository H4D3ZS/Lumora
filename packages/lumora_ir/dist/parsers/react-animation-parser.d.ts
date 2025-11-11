/**
 * React Animation Parser
 * Parses React animations (CSS transitions, Animated API, Framer Motion) to Lumora Animation Schema
 */
import { AnimationSchema } from '../types/animation-types';
import { ErrorHandler } from '../errors/error-handler';
/**
 * Configuration for React animation parser
 */
export interface ReactAnimationParserConfig {
    errorHandler?: ErrorHandler;
}
/**
 * React Animation Parser
 * Converts React animation code to Lumora Animation Schema
 */
export declare class ReactAnimationParser {
    private errorHandler;
    private animationCounter;
    constructor(config?: ReactAnimationParserConfig);
    /**
     * Parse React component for animations
     */
    parseAnimations(source: string, filename: string): AnimationSchema[];
    /**
     * Parse source code to AST
     */
    private parseAST;
    /**
     * Parse CSS transitions from style objects
     */
    private parseCSSTransitions;
    /**
     * Parse CSS transition value
     */
    private parseCSSTransitionValue;
    /**
     * Parse duration string to milliseconds
     */
    private parseDuration;
    /**
     * Convert CSS transition to animation schema
     */
    private convertCSSTransitionToSchema;
    /**
     * Map CSS easing to Lumora easing type
     */
    private mapCSSEasing;
    /**
     * Parse React Animated API calls
     */
    private parseAnimatedAPI;
    /**
     * Parse Animated API call
     */
    private parseAnimatedAPICall;
    /**
     * Extract properties from object expression
     */
    private extractObjectProperties;
    /**
     * Extract value from expression
     */
    private extractValue;
    /**
     * Convert Animated API call to animation schema
     */
    private convertAnimatedAPIToSchema;
    /**
     * Map Animated API type to animation type
     */
    private mapAnimatedAPIType;
    /**
     * Map Animated easing to Lumora easing
     */
    private mapAnimatedEasing;
    /**
     * Parse Framer Motion animations
     */
    private parseFramerMotion;
    /**
     * Parse Framer Motion props
     */
    private parseFramerMotionProps;
    /**
     * Convert Framer Motion to animation schema
     */
    private convertFramerMotionToSchema;
    /**
     * Map Framer Motion easing to Lumora easing
     */
    private mapFramerMotionEasing;
    /**
     * Generate unique animation ID
     */
    private generateAnimationId;
}
/**
 * Get React animation parser instance
 */
export declare function getReactAnimationParser(config?: ReactAnimationParserConfig): ReactAnimationParser;
/**
 * Reset React animation parser instance
 */
export declare function resetReactAnimationParser(): void;
