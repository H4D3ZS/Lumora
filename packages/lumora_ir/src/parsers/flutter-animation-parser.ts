/**
 * Flutter Animation Parser
 * Parses Flutter animations (AnimationController, Tween, ImplicitAnimations) to Lumora Animation Schema
 */

import {
  AnimationSchema,
  AnimatedProperty,
  AnimationType,
  EasingType,
  SpringConfig,
  AnimationCallbacks,
} from '../types/animation-types';
import { ErrorHandler, getErrorHandler } from '../errors/error-handler';

/**
 * Configuration for Flutter animation parser
 */
export interface FlutterAnimationParserConfig {
  errorHandler?: ErrorHandler;
}

/**
 * AnimationController information
 */
interface AnimationControllerInfo {
  name: string;
  duration: number;
  reverseDuration?: number;
  lowerBound?: number;
  upperBound?: number;
  vsync: string;
  lineNumber: number;
}

/**
 * Tween animation information
 */
interface TweenInfo {
  type: string; // Tween, ColorTween, SizeTween, etc.
  begin: any;
  end: any;
  controller: string;
  curve?: string;
}

/**
 * Implicit animation information
 */
interface ImplicitAnimationInfo {
  widgetType: string; // AnimatedContainer, AnimatedOpacity, etc.
  properties: Record<string, { from: any; to: any }>;
  duration: number;
  curve?: string;
  onEnd?: string;
}

/**
 * Animation builder information
 */
interface AnimationBuilderInfo {
  type: 'AnimatedBuilder' | 'TweenAnimationBuilder';
  tween?: TweenInfo;
  animation?: string;
  duration?: number;
  curve?: string;
}

/**
 * Flutter Animation Parser
 * Converts Flutter animation code to Lumora Animation Schema
 */
export class FlutterAnimationParser {
  private errorHandler: ErrorHandler;
  private animationCounter: number = 0;

  constructor(config: FlutterAnimationParserConfig = {}) {
    this.errorHandler = config.errorHandler || getErrorHandler();
  }

  /**
   * Parse Flutter code for animations
   */
  parseAnimations(source: string, filename: string): AnimationSchema[] {
    const animations: AnimationSchema[] = [];

    try {
      // Parse AnimationController
      const controllers = this.parseAnimationControllers(source);
      
      // Parse Tween animations
      const tweens = this.parseTweenAnimations(source);
      tweens.forEach(tween => {
        const controller = controllers.find(c => c.name === tween.controller);
        if (controller) {
          const animation = this.convertTweenToSchema(tween, controller);
          animations.push(animation);
        }
      });

      // Parse implicit animations
      const implicitAnimations = this.parseImplicitAnimations(source);
      implicitAnimations.forEach(implicit => {
        const animation = this.convertImplicitAnimationToSchema(implicit);
        animations.push(animation);
      });

      // Parse animation builders
      const builders = this.parseAnimationBuilders(source);
      builders.forEach(builder => {
        const animation = this.convertAnimationBuilderToSchema(builder);
        animations.push(animation);
      });

    } catch (error) {
      this.errorHandler.handleParseError({
        filePath: filename,
        errorMessage: `Failed to parse Flutter animations: ${error instanceof Error ? error.message : String(error)}`,
        sourceCode: source,
        framework: 'flutter',
      });
    }

    return animations;
  }

  /**
   * Parse AnimationController declarations
   */
  private parseAnimationControllers(source: string): AnimationControllerInfo[] {
    const controllers: AnimationControllerInfo[] = [];

    // Pattern: AnimationController(duration: Duration(...), vsync: this)
    const controllerPattern = /(?:late\s+)?AnimationController\s+(\w+)\s*=\s*AnimationController\s*\(([^;]+)\);/g;
    
    let match;
    while ((match = controllerPattern.exec(source)) !== null) {
      const name = match[1];
      const params = match[2];
      const lineNumber = this.getLineNumber(source, match.index);

      const controller: AnimationControllerInfo = {
        name,
        duration: this.extractDuration(params),
        vsync: this.extractVsync(params),
        lineNumber,
      };

      // Extract optional parameters
      const reverseDuration = this.extractReverseDuration(params);
      if (reverseDuration) {
        controller.reverseDuration = reverseDuration;
      }

      const lowerBound = this.extractBound(params, 'lowerBound');
      if (lowerBound !== null) {
        controller.lowerBound = lowerBound;
      }

      const upperBound = this.extractBound(params, 'upperBound');
      if (upperBound !== null) {
        controller.upperBound = upperBound;
      }

      controllers.push(controller);
    }

    return controllers;
  }

  /**
   * Extract duration from parameters
   */
  private extractDuration(params: string): number {
    const durationPattern = /duration:\s*(?:const\s+)?Duration\s*\(\s*(?:milliseconds:\s*(\d+)|seconds:\s*(\d+))/;
    const match = durationPattern.exec(params);
    
    if (match) {
      if (match[1]) {
        return parseInt(match[1]);
      } else if (match[2]) {
        return parseInt(match[2]) * 1000;
      }
    }

    return 300; // Default duration
  }

  /**
   * Extract reverse duration from parameters
   */
  private extractReverseDuration(params: string): number | null {
    const pattern = /reverseDuration:\s*(?:const\s+)?Duration\s*\(\s*(?:milliseconds:\s*(\d+)|seconds:\s*(\d+))/;
    const match = pattern.exec(params);
    
    if (match) {
      if (match[1]) {
        return parseInt(match[1]);
      } else if (match[2]) {
        return parseInt(match[2]) * 1000;
      }
    }

    return null;
  }

  /**
   * Extract vsync from parameters
   */
  private extractVsync(params: string): string {
    const vsyncPattern = /vsync:\s*(\w+)/;
    const match = vsyncPattern.exec(params);
    return match ? match[1] : 'this';
  }

  /**
   * Extract bound value from parameters
   */
  private extractBound(params: string, boundName: string): number | null {
    const pattern = new RegExp(`${boundName}:\\s*([\\d.]+)`);
    const match = pattern.exec(params);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * Parse Tween animations
   */
  private parseTweenAnimations(source: string): TweenInfo[] {
    const tweens: TweenInfo[] = [];

    // Pattern: Tween<Type>(begin: value, end: value).animate(controller)
    // More flexible pattern to handle various formats
    const tweenPattern = /(\w+Tween(?:<[^>]+>)?)\s*\(\s*begin:\s*([^,]+),\s*end:\s*([^)]+)\)\s*\.animate\s*\(\s*([^)]+)\)/g;
    
    let match;
    while ((match = tweenPattern.exec(source)) !== null) {
      const type = match[1];
      const begin = match[2].trim();
      const end = match[3].trim();
      const animateArg = match[4].trim();
      
      // Extract controller and curve from animate argument
      let controller = 'unknown';
      let curve: string | undefined;
      
      // Check if it's a CurvedAnimation
      const curvedMatch = /CurvedAnimation\s*\([^)]*controller:\s*(\w+)[^)]*curve:\s*Curves\.(\w+)/s.exec(animateArg);
      if (curvedMatch) {
        controller = curvedMatch[1];
        curve = curvedMatch[2];
      } else {
        // Direct controller reference
        controller = animateArg.replace(/[^a-zA-Z0-9_]/g, '');
      }

      tweens.push({
        type,
        begin: this.parseValue(begin),
        end: this.parseValue(end),
        controller,
        curve,
      });
    }

    return tweens;
  }

  /**
   * Parse implicit animations (AnimatedContainer, AnimatedOpacity, etc.)
   */
  private parseImplicitAnimations(source: string): ImplicitAnimationInfo[] {
    const animations: ImplicitAnimationInfo[] = [];

    // List of implicit animation widgets
    const implicitWidgets = [
      'AnimatedContainer',
      'AnimatedOpacity',
      'AnimatedPositioned',
      'AnimatedPadding',
      'AnimatedAlign',
      'AnimatedDefaultTextStyle',
      'AnimatedPhysicalModel',
      'AnimatedSize',
      'AnimatedCrossFade',
    ];

    implicitWidgets.forEach(widgetType => {
      const pattern = new RegExp(`${widgetType}\\s*\\(([^;]+?)\\)`, 'gs');
      
      let match;
      while ((match = pattern.exec(source)) !== null) {
        const params = match[1];
        
        const animation: ImplicitAnimationInfo = {
          widgetType,
          properties: this.extractAnimatedProperties(widgetType, params),
          duration: this.extractDuration(params),
          curve: this.extractCurve(params),
          onEnd: this.extractOnEnd(params),
        };

        animations.push(animation);
      }
    });

    return animations;
  }

  /**
   * Extract animated properties from implicit animation widget
   */
  private extractAnimatedProperties(widgetType: string, params: string): Record<string, { from: any; to: any }> {
    const properties: Record<string, { from: any; to: any }> = {};

    // Map widget types to their animated properties
    const propertyMap: Record<string, string[]> = {
      'AnimatedContainer': ['width', 'height', 'color', 'padding', 'margin', 'decoration'],
      'AnimatedOpacity': ['opacity'],
      'AnimatedPositioned': ['left', 'top', 'right', 'bottom', 'width', 'height'],
      'AnimatedPadding': ['padding'],
      'AnimatedAlign': ['alignment'],
      'AnimatedDefaultTextStyle': ['style'],
      'AnimatedPhysicalModel': ['elevation', 'shadowColor', 'color'],
      'AnimatedSize': ['width', 'height'],
    };

    const animatedProps = propertyMap[widgetType] || [];

    animatedProps.forEach(prop => {
      const pattern = new RegExp(`${prop}:\\s*([^,\\n]+)`);
      const match = pattern.exec(params);
      
      if (match) {
        const value = match[1].trim();
        properties[prop] = {
          from: null, // Would need previous state to determine
          to: this.parseValue(value),
        };
      }
    });

    return properties;
  }

  /**
   * Extract curve from parameters
   */
  private extractCurve(params: string): string | undefined {
    const curvePattern = /curve:\s*Curves\.(\w+)/;
    const match = curvePattern.exec(params);
    return match ? match[1] : undefined;
  }
  
  /**
   * Extract curve with fallback
   */
  private extractCurveWithFallback(params: string): string {
    return this.extractCurve(params) || 'linear';
  }

  /**
   * Extract onEnd callback from parameters
   */
  private extractOnEnd(params: string): string | undefined {
    const onEndPattern = /onEnd:\s*(\w+)/;
    const match = onEndPattern.exec(params);
    return match ? match[1] : undefined;
  }

  /**
   * Parse animation builders
   */
  private parseAnimationBuilders(source: string): AnimationBuilderInfo[] {
    const builders: AnimationBuilderInfo[] = [];

    // Parse AnimatedBuilder
    const animatedBuilderPattern = /AnimatedBuilder\s*\(\s*animation:\s*(\w+)/g;
    let match;
    while ((match = animatedBuilderPattern.exec(source)) !== null) {
      builders.push({
        type: 'AnimatedBuilder',
        animation: match[1],
      });
    }

    // Parse TweenAnimationBuilder
    const tweenBuilderPattern = /TweenAnimationBuilder<([^>]+)>\s*\(([^;]+)\)/gs;
    while ((match = tweenBuilderPattern.exec(source)) !== null) {
      const type = match[1];
      const params = match[2];
      
      builders.push({
        type: 'TweenAnimationBuilder',
        duration: this.extractDuration(params),
        curve: this.extractCurve(params),
      });
    }

    return builders;
  }

  /**
   * Convert Tween to animation schema
   */
  private convertTweenToSchema(tween: TweenInfo, controller: AnimationControllerInfo): AnimationSchema {
    const propertyName = this.extractPropertyNameFromTweenType(tween.type);

    return {
      id: this.generateAnimationId(),
      type: 'timing',
      duration: controller.duration,
      easing: this.mapFlutterCurve(tween.curve),
      properties: [
        {
          name: propertyName,
          from: tween.begin,
          to: tween.end,
        },
      ],
      metadata: {
        sourceFramework: 'flutter',
        sourceAPI: 'Tween',
      },
    };
  }

  /**
   * Extract property name from Tween type
   */
  private extractPropertyNameFromTweenType(tweenType: string): string {
    const typeMap: Record<string, string> = {
      'Tween': 'value',
      'ColorTween': 'color',
      'SizeTween': 'size',
      'AlignmentTween': 'alignment',
      'BorderRadiusTween': 'borderRadius',
      'DecorationTween': 'decoration',
      'EdgeInsetsTween': 'padding',
      'Matrix4Tween': 'transform',
      'RelativeRectTween': 'rect',
      'TextStyleTween': 'textStyle',
    };

    // Extract base type name (e.g., "ColorTween<Color>" -> "ColorTween")
    const baseName = tweenType.split('<')[0];
    return typeMap[baseName] || 'value';
  }

  /**
   * Convert implicit animation to schema
   */
  private convertImplicitAnimationToSchema(implicit: ImplicitAnimationInfo): AnimationSchema {
    const properties: AnimatedProperty[] = [];

    Object.entries(implicit.properties).forEach(([name, { from, to }]) => {
      properties.push({
        name,
        from: from || 0,
        to: to || 1,
      });
    });

    const schema: AnimationSchema = {
      id: this.generateAnimationId(),
      type: 'timing',
      duration: implicit.duration,
      easing: this.mapFlutterCurve(implicit.curve),
      properties,
      metadata: {
        sourceFramework: 'flutter',
        sourceAPI: implicit.widgetType,
      },
    };

    if (implicit.onEnd) {
      schema.callbacks = {
        onComplete: implicit.onEnd,
      };
    }

    return schema;
  }

  /**
   * Convert animation builder to schema
   */
  private convertAnimationBuilderToSchema(builder: AnimationBuilderInfo): AnimationSchema {
    return {
      id: this.generateAnimationId(),
      type: 'timing',
      duration: builder.duration || 300,
      easing: this.mapFlutterCurve(builder.curve),
      properties: [
        {
          name: 'value',
          from: 0,
          to: 1,
        },
      ],
      metadata: {
        sourceFramework: 'flutter',
        sourceAPI: builder.type,
      },
    };
  }

  /**
   * Map Flutter Curves to Lumora easing
   */
  private mapFlutterCurve(curve?: string): EasingType {
    if (!curve) return 'ease';

    const curveMap: Record<string, EasingType> = {
      'linear': 'linear',
      'ease': 'ease',
      'easeIn': 'ease-in',
      'easeOut': 'ease-out',
      'easeInOut': 'ease-in-out',
      'easeInSine': 'ease-in',
      'easeOutSine': 'ease-out',
      'easeInOutSine': 'ease-in-out',
      'easeInQuad': 'ease-in',
      'easeOutQuad': 'ease-out',
      'easeInOutQuad': 'ease-in-out',
      'easeInCubic': 'ease-in',
      'easeOutCubic': 'ease-out',
      'easeInOutCubic': 'ease-in-out',
      'easeInQuart': 'ease-in',
      'easeOutQuart': 'ease-out',
      'easeInOutQuart': 'ease-in-out',
      'easeInQuint': 'ease-in',
      'easeOutQuint': 'ease-out',
      'easeInOutQuint': 'ease-in-out',
      'easeInExpo': 'ease-in',
      'easeOutExpo': 'ease-out',
      'easeInOutExpo': 'ease-in-out',
      'easeInCirc': 'ease-in',
      'easeOutCirc': 'ease-out',
      'easeInOutCirc': 'ease-in-out',
      'easeInBack': 'ease-in',
      'easeOutBack': 'ease-out',
      'easeInOutBack': 'ease-in-out',
      'elasticIn': 'elastic',
      'elasticOut': 'elastic',
      'elasticInOut': 'elastic',
      'bounceIn': 'bounce',
      'bounceOut': 'bounce',
      'bounceInOut': 'bounce',
      'fastOutSlowIn': 'ease-in-out',
      'slowMiddle': 'ease-in-out',
      'decelerate': 'ease-out',
    };

    return curveMap[curve] || 'ease';
  }

  /**
   * Parse value from string
   */
  private parseValue(value: string): any {
    // Remove const keyword
    value = value.replace(/const\s+/, '').trim();

    // Parse numbers
    if (/^-?\d+\.?\d*$/.test(value)) {
      return parseFloat(value);
    }

    // Parse Colors
    if (value.startsWith('Color')) {
      const colorMatch = /Color\(0x([0-9A-Fa-f]+)\)/.exec(value);
      if (colorMatch) {
        return `#${colorMatch[1].substring(2)}`; // Remove alpha channel
      }
      
      const namedColorMatch = /Colors\.(\w+)/.exec(value);
      if (namedColorMatch) {
        return namedColorMatch[1];
      }
    }

    // Parse EdgeInsets
    if (value.startsWith('EdgeInsets')) {
      const allMatch = /EdgeInsets\.all\(([^)]+)\)/.exec(value);
      if (allMatch) {
        return parseFloat(allMatch[1]);
      }
      
      const symmetricMatch = /EdgeInsets\.symmetric\((?:horizontal:\s*([^,)]+))?(?:,?\s*vertical:\s*([^)]+))?\)/.exec(value);
      if (symmetricMatch) {
        return {
          horizontal: symmetricMatch[1] ? parseFloat(symmetricMatch[1]) : 0,
          vertical: symmetricMatch[2] ? parseFloat(symmetricMatch[2]) : 0,
        };
      }
    }

    // Parse Alignment
    if (value.startsWith('Alignment')) {
      const alignmentMatch = /Alignment\.(\w+)/.exec(value);
      if (alignmentMatch) {
        return alignmentMatch[1];
      }
    }

    // Return as string if can't parse
    return value;
  }

  /**
   * Get line number from index
   */
  private getLineNumber(source: string, index: number): number {
    return source.substring(0, index).split('\n').length;
  }

  /**
   * Generate unique animation ID
   */
  private generateAnimationId(): string {
    return `flutter-animation-${++this.animationCounter}`;
  }
}

/**
 * Singleton instance
 */
let flutterAnimationParserInstance: FlutterAnimationParser | null = null;

/**
 * Get Flutter animation parser instance
 */
export function getFlutterAnimationParser(config?: FlutterAnimationParserConfig): FlutterAnimationParser {
  if (!flutterAnimationParserInstance) {
    flutterAnimationParserInstance = new FlutterAnimationParser(config);
  }
  return flutterAnimationParserInstance;
}

/**
 * Reset Flutter animation parser instance
 */
export function resetFlutterAnimationParser(): void {
  flutterAnimationParserInstance = null;
}
