/**
 * Animation & Gesture Converter
 * Handles conversion between React animations (Framer Motion, React Spring) and Flutter animations
 */
export interface AnimationDefinition {
    type: 'spring' | 'tween' | 'keyframes' | 'gesture';
    duration?: number;
    delay?: number;
    easing?: string;
    repeat?: number | 'infinite';
    properties: AnimatedProperty[];
}
export interface AnimatedProperty {
    name: string;
    from: any;
    to: any;
    keyframes?: any[];
}
export interface GestureDefinition {
    type: 'tap' | 'drag' | 'swipe' | 'pinch' | 'rotate' | 'longPress';
    handler: string;
    constraints?: GestureConstraints;
}
export interface GestureConstraints {
    axis?: 'x' | 'y' | 'both';
    bounds?: {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
    };
    momentum?: boolean;
    dragElastic?: number;
}
export interface AnimationConversionResult {
    imports: string[];
    controllerDeclarations: string[];
    animationDefinitions: string[];
    widgetWrappers: string[];
    disposeCode?: string[];
    dependencies?: string[];
}
/**
 * Animation Converter
 * Converts between React (Framer Motion, React Spring) and Flutter animations
 */
export declare class AnimationConverter {
    /**
     * Convert Framer Motion to Flutter AnimatedContainer/AnimationController
     */
    convertFramerMotionToFlutter(animation: AnimationDefinition): AnimationConversionResult;
    /**
     * Convert React Spring to Flutter ImplicitlyAnimatedWidget
     */
    convertReactSpringToFlutter(animation: AnimationDefinition): AnimationConversionResult;
    /**
     * Convert Flutter animations to Framer Motion
     */
    convertFlutterToFramerMotion(flutterAnimation: string): string;
    /**
     * Convert gesture handlers
     */
    convertGestureToFlutter(gesture: GestureDefinition): AnimationConversionResult;
    private generateDraggableWidget;
    private generateGestureDetector;
    private generateComplexGesture;
    private getAnimationType;
    private convertValue;
    private convertEasing;
    private convertPropertyName;
    /**
     * Generate imports for animation dependencies
     */
    getAnimationDependencies(type: 'framer' | 'spring' | 'flutter'): string[];
}
export declare function getAnimationConverter(): AnimationConverter;
