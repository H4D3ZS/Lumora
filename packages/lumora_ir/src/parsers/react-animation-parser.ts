/**
 * React Animation Parser
 * Parses React animations (CSS transitions, Animated API, Framer Motion) to Lumora Animation Schema
 */

import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import {
  AnimationSchema,
  AnimatedProperty,
  AnimationType,
  EasingType,
  SpringConfig,
  AnimationCallbacks,
  Keyframe,
} from '../types/animation-types';
import { ErrorHandler, getErrorHandler } from '../errors/error-handler';

/**
 * Configuration for React animation parser
 */
export interface ReactAnimationParserConfig {
  errorHandler?: ErrorHandler;
}

/**
 * CSS transition information
 */
interface CSSTransitionInfo {
  property: string;
  duration: number;
  easing: string;
  delay?: number;
}

/**
 * React Animated API call information
 */
interface AnimatedAPICall {
  type: 'timing' | 'spring' | 'decay';
  value: string;
  config: any;
  callbacks?: any;
}

/**
 * Framer Motion animation information
 */
interface FramerMotionAnimation {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
  whileHover?: Record<string, any>;
  whileTap?: Record<string, any>;
}

/**
 * React Animation Parser
 * Converts React animation code to Lumora Animation Schema
 */
export class ReactAnimationParser {
  private errorHandler: ErrorHandler;
  private animationCounter: number = 0;

  constructor(config: ReactAnimationParserConfig = {}) {
    this.errorHandler = config.errorHandler || getErrorHandler();
  }

  /**
   * Parse React component for animations
   */
  parseAnimations(source: string, filename: string): AnimationSchema[] {
    const animations: AnimationSchema[] = [];

    try {
      const ast = this.parseAST(source);

      // Parse CSS transitions
      const cssAnimations = this.parseCSSTransitions(ast);
      animations.push(...cssAnimations);

      // Parse React Animated API
      const animatedAPIAnimations = this.parseAnimatedAPI(ast);
      animations.push(...animatedAPIAnimations);

      // Parse Framer Motion
      const framerMotionAnimations = this.parseFramerMotion(ast);
      animations.push(...framerMotionAnimations);

    } catch (error) {
      this.errorHandler.handleParseError({
        filePath: filename,
        errorMessage: `Failed to parse animations: ${error instanceof Error ? error.message : String(error)}`,
        sourceCode: source,
        framework: 'react',
      });
    }

    return animations;
  }

  /**
   * Parse source code to AST
   */
  private parseAST(source: string): t.File {
    return parser.parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
    });
  }

  /**
   * Parse CSS transitions from style objects
   */
  private parseCSSTransitions(ast: t.File): AnimationSchema[] {
    const animations: AnimationSchema[] = [];

    traverse(ast, {
      ObjectProperty: (path: NodePath<t.ObjectProperty>) => {
        // Look for style objects with transition property
        if (t.isIdentifier(path.node.key, { name: 'style' }) && t.isObjectExpression(path.node.value)) {
          const styleObj = path.node.value;
          const transitionProp = styleObj.properties.find(
            prop => t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: 'transition' })
          );

          if (transitionProp && t.isObjectProperty(transitionProp) && t.isExpression(transitionProp.value)) {
            const transitions = this.parseCSSTransitionValue(transitionProp.value);
            transitions.forEach(transition => {
              const animation = this.convertCSSTransitionToSchema(transition);
              animations.push(animation);
            });
          }
        }
      },
    });

    return animations;
  }

  /**
   * Parse CSS transition value
   */
  private parseCSSTransitionValue(value: t.Expression): CSSTransitionInfo[] {
    const transitions: CSSTransitionInfo[] = [];

    if (t.isStringLiteral(value)) {
      // Parse transition string: "opacity 300ms ease-in-out"
      const parts = value.value.split(/\s+/);
      if (parts.length >= 2) {
        transitions.push({
          property: parts[0],
          duration: this.parseDuration(parts[1]),
          easing: parts[2] || 'ease',
          delay: parts[3] ? this.parseDuration(parts[3]) : undefined,
        });
      }
    } else if (t.isTemplateLiteral(value)) {
      // Handle template literals
      const str = value.quasis[0]?.value.raw || '';
      const parts = str.split(/\s+/);
      if (parts.length >= 2) {
        transitions.push({
          property: parts[0],
          duration: this.parseDuration(parts[1]),
          easing: parts[2] || 'ease',
        });
      }
    }

    return transitions;
  }

  /**
   * Parse duration string to milliseconds
   */
  private parseDuration(duration: string): number {
    if (duration.endsWith('ms')) {
      return parseInt(duration);
    } else if (duration.endsWith('s')) {
      return parseFloat(duration) * 1000;
    }
    return parseInt(duration) || 0;
  }

  /**
   * Convert CSS transition to animation schema
   */
  private convertCSSTransitionToSchema(transition: CSSTransitionInfo): AnimationSchema {
    return {
      id: this.generateAnimationId(),
      type: 'timing',
      duration: transition.duration,
      delay: transition.delay,
      easing: this.mapCSSEasing(transition.easing),
      properties: [
        {
          name: transition.property,
          from: 0, // Would need context to determine actual values
          to: 1,
        },
      ],
      metadata: {
        sourceFramework: 'react',
        sourceAPI: 'CSS Transition',
      },
    };
  }

  /**
   * Map CSS easing to Lumora easing type
   */
  private mapCSSEasing(cssEasing: string): EasingType {
    const easingMap: Record<string, EasingType> = {
      'linear': 'linear',
      'ease': 'ease',
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
    };

    return easingMap[cssEasing] || 'ease';
  }

  /**
   * Parse React Animated API calls
   */
  private parseAnimatedAPI(ast: t.File): AnimationSchema[] {
    const animations: AnimationSchema[] = [];

    traverse(ast, {
      CallExpression: (path: NodePath<t.CallExpression>) => {
        const callee = path.node.callee;

        // Check for Animated.timing, Animated.spring, Animated.decay
        if (t.isMemberExpression(callee) && t.isIdentifier(callee.object, { name: 'Animated' })) {
          const method = callee.property;
          
          if (t.isIdentifier(method)) {
            const animatedCall = this.parseAnimatedAPICall(path, method.name);
            if (animatedCall) {
              const animation = this.convertAnimatedAPIToSchema(animatedCall);
              animations.push(animation);
            }
          }
        }
      },
    });

    return animations;
  }

  /**
   * Parse Animated API call
   */
  private parseAnimatedAPICall(path: NodePath<t.CallExpression>, methodName: string): AnimatedAPICall | null {
    const args = path.node.arguments;
    
    if (args.length < 2) return null;

    // First argument is the animated value
    const valueArg = args[0];
    let valueName = 'animatedValue';
    if (t.isIdentifier(valueArg)) {
      valueName = valueArg.name;
    } else if (t.isMemberExpression(valueArg) && t.isIdentifier(valueArg.property)) {
      valueName = valueArg.property.name;
    }

    // Second argument is the config object
    const configArg = args[1];
    const config = this.extractObjectProperties(configArg);

    // Check for .start() callback
    let callbacks: any = {};
    const parent = path.parent;
    if (t.isMemberExpression(parent) && t.isIdentifier(parent.property, { name: 'start' })) {
      const grandParent = path.parentPath?.parent;
      if (t.isCallExpression(grandParent) && grandParent.arguments.length > 0) {
        const callbackArg = grandParent.arguments[0];
        if (t.isArrowFunctionExpression(callbackArg) || t.isFunctionExpression(callbackArg)) {
          callbacks.onComplete = 'animationComplete';
        }
      }
    }

    return {
      type: methodName as 'timing' | 'spring' | 'decay',
      value: valueName,
      config,
      callbacks: Object.keys(callbacks).length > 0 ? callbacks : undefined,
    };
  }

  /**
   * Extract properties from object expression
   */
  private extractObjectProperties(node: t.Node): Record<string, any> {
    const props: Record<string, any> = {};

    if (t.isObjectExpression(node)) {
      node.properties.forEach(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const key = prop.key.name;
          const value = this.extractValue(prop.value);
          props[key] = value;
        }
      });
    }

    return props;
  }

  /**
   * Extract value from expression
   */
  private extractValue(node: t.Node): any {
    if (t.isNumericLiteral(node)) {
      return node.value;
    } else if (t.isStringLiteral(node)) {
      return node.value;
    } else if (t.isBooleanLiteral(node)) {
      return node.value;
    } else if (t.isObjectExpression(node)) {
      return this.extractObjectProperties(node);
    } else if (t.isIdentifier(node)) {
      return node.name;
    }
    return null;
  }

  /**
   * Convert Animated API call to animation schema
   */
  private convertAnimatedAPIToSchema(animatedCall: AnimatedAPICall): AnimationSchema {
    const schema: AnimationSchema = {
      id: this.generateAnimationId(),
      type: this.mapAnimatedAPIType(animatedCall.type),
      duration: animatedCall.config.duration || 300,
      easing: this.mapAnimatedEasing(animatedCall.config.easing),
      properties: [
        {
          name: animatedCall.value,
          from: animatedCall.config.toValue !== undefined ? 0 : animatedCall.config.fromValue || 0,
          to: animatedCall.config.toValue || 1,
        },
      ],
      metadata: {
        sourceFramework: 'react',
        sourceAPI: `Animated.${animatedCall.type}`,
      },
    };

    // Add delay if present
    if (animatedCall.config.delay) {
      schema.delay = animatedCall.config.delay;
    }

    // Add spring config if spring animation
    if (animatedCall.type === 'spring') {
      schema.springConfig = {
        stiffness: animatedCall.config.stiffness || 100,
        damping: animatedCall.config.damping || 10,
        mass: animatedCall.config.mass || 1,
        velocity: animatedCall.config.velocity || 0,
      };
    }

    // Add decay config if decay animation
    if (animatedCall.type === 'decay') {
      schema.decayConfig = {
        velocity: animatedCall.config.velocity || 0,
        deceleration: animatedCall.config.deceleration || 0.998,
      };
    }

    // Add callbacks if present
    if (animatedCall.callbacks) {
      schema.callbacks = animatedCall.callbacks;
    }

    return schema;
  }

  /**
   * Map Animated API type to animation type
   */
  private mapAnimatedAPIType(type: string): AnimationType {
    const typeMap: Record<string, AnimationType> = {
      'timing': 'timing',
      'spring': 'spring',
      'decay': 'decay',
    };
    return typeMap[type] || 'timing';
  }

  /**
   * Map Animated easing to Lumora easing
   */
  private mapAnimatedEasing(easing: any): EasingType {
    if (!easing) return 'ease';
    
    if (typeof easing === 'string') {
      return easing as EasingType;
    }

    // Handle Easing functions
    if (typeof easing === 'object' && easing.name) {
      const easingMap: Record<string, EasingType> = {
        'linear': 'linear',
        'ease': 'ease',
        'quad': 'ease-in-out',
        'cubic': 'ease-in-out',
        'elastic': 'elastic',
        'bounce': 'bounce',
      };
      return easingMap[easing.name] || 'ease';
    }

    return 'ease';
  }

  /**
   * Parse Framer Motion animations
   */
  private parseFramerMotion(ast: t.File): AnimationSchema[] {
    const animations: AnimationSchema[] = [];

    traverse(ast, {
      JSXOpeningElement: (path: NodePath<t.JSXOpeningElement>) => {
        const name = path.node.name;
        
        // Check if it's a motion component (motion.div, motion.button, etc.)
        if (t.isJSXMemberExpression(name) && t.isJSXIdentifier(name.object, { name: 'motion' })) {
          const motionAnimation = this.parseFramerMotionProps(path.node.attributes);
          if (motionAnimation) {
            const animation = this.convertFramerMotionToSchema(motionAnimation);
            animations.push(animation);
          }
        }
      },
    });

    return animations;
  }

  /**
   * Parse Framer Motion props
   */
  private parseFramerMotionProps(attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute>): FramerMotionAnimation | null {
    const animation: FramerMotionAnimation = {};

    attributes.forEach(attr => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
        const propName = attr.name.name;
        
        if (['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap'].includes(propName)) {
          if (attr.value && t.isJSXExpressionContainer(attr.value)) {
            const value = this.extractValue(attr.value.expression);
            animation[propName as keyof FramerMotionAnimation] = value;
          }
        }
      }
    });

    return Object.keys(animation).length > 0 ? animation : null;
  }

  /**
   * Convert Framer Motion to animation schema
   */
  private convertFramerMotionToSchema(motion: FramerMotionAnimation): AnimationSchema {
    const properties: AnimatedProperty[] = [];

    // Extract properties from initial and animate
    if (motion.initial && motion.animate) {
      Object.keys(motion.animate).forEach(key => {
        const from = motion.initial?.[key];
        const to = motion.animate?.[key];
        
        if (from !== undefined && to !== undefined) {
          properties.push({
            name: key,
            from,
            to,
          });
        }
      });
    }

    // Extract transition config
    const transition = motion.transition || {};
    const duration = (transition.duration || 0.3) * 1000; // Convert to ms
    const delay = transition.delay ? transition.delay * 1000 : undefined;
    const easing = this.mapFramerMotionEasing(transition.ease);

    const schema: AnimationSchema = {
      id: this.generateAnimationId(),
      type: transition.type === 'spring' ? 'spring' : 'timing',
      duration,
      delay,
      easing,
      properties,
      metadata: {
        sourceFramework: 'react',
        sourceAPI: 'Framer Motion',
      },
    };

    // Add spring config if spring animation
    if (transition.type === 'spring') {
      schema.springConfig = {
        stiffness: transition.stiffness || 100,
        damping: transition.damping || 10,
        mass: transition.mass || 1,
      };
    }

    // Add iterations if repeat is specified
    if (transition.repeat !== undefined) {
      schema.iterations = transition.repeat === Infinity ? -1 : transition.repeat;
    }

    return schema;
  }

  /**
   * Map Framer Motion easing to Lumora easing
   */
  private mapFramerMotionEasing(ease: any): EasingType {
    if (!ease) return 'ease';
    
    if (typeof ease === 'string') {
      const easingMap: Record<string, EasingType> = {
        'linear': 'linear',
        'easeIn': 'ease-in',
        'easeOut': 'ease-out',
        'easeInOut': 'ease-in-out',
        'circIn': 'ease-in',
        'circOut': 'ease-out',
        'circInOut': 'ease-in-out',
        'backIn': 'ease-in',
        'backOut': 'ease-out',
        'backInOut': 'ease-in-out',
      };
      return easingMap[ease] || 'ease';
    }

    if (Array.isArray(ease) && ease.length === 4) {
      // Cubic bezier
      return 'cubic-bezier';
    }

    return 'ease';
  }

  /**
   * Generate unique animation ID
   */
  private generateAnimationId(): string {
    return `react-animation-${++this.animationCounter}`;
  }
}

/**
 * Singleton instance
 */
let reactAnimationParserInstance: ReactAnimationParser | null = null;

/**
 * Get React animation parser instance
 */
export function getReactAnimationParser(config?: ReactAnimationParserConfig): ReactAnimationParser {
  if (!reactAnimationParserInstance) {
    reactAnimationParserInstance = new ReactAnimationParser(config);
  }
  return reactAnimationParserInstance;
}

/**
 * Reset React animation parser instance
 */
export function resetReactAnimationParser(): void {
  reactAnimationParserInstance = null;
}
