/**
 * Lumora Animation Schema Type Definitions
 * Framework-agnostic intermediate representation for animations
 * 
 * This schema supports conversion between:
 * - React: CSS transitions, React Animated API, Framer Motion
 * - Flutter: AnimationController, Tween, ImplicitAnimations
 */

/**
 * Animation type definitions
 * - spring: Physics-based spring animation
 * - timing: Duration-based animation with easing
 * - decay: Deceleration animation (e.g., scroll momentum)
 */
export type AnimationType = 'spring' | 'timing' | 'decay';

/**
 * Easing function types
 * Maps to common easing functions in both React and Flutter
 */
export type EasingType = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'cubic-bezier'
  | 'spring'
  | 'bounce'
  | 'elastic';

/**
 * Animation state
 */
export type AnimationState = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';

/**
 * Animation direction
 */
export type AnimationDirection = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';

/**
 * Fill mode - determines how animation values are applied before/after execution
 */
export type AnimationFillMode = 'none' | 'forwards' | 'backwards' | 'both';

/**
 * Main animation schema interface
 * Represents a complete animation definition
 */
export interface AnimationSchema {
  /** Unique identifier for the animation */
  id: string;
  
  /** Animation type */
  type: AnimationType;
  
  /** Duration in milliseconds (for timing animations) */
  duration: number;
  
  /** Delay before animation starts in milliseconds */
  delay?: number;
  
  /** Easing function */
  easing: EasingType;
  
  /** Custom cubic bezier values [x1, y1, x2, y2] when easing is 'cubic-bezier' */
  cubicBezier?: [number, number, number, number];
  
  /** Properties to animate */
  properties: AnimatedProperty[];
  
  /** Number of times to repeat (0 = no repeat, -1 = infinite) */
  iterations?: number;
  
  /** Animation direction */
  direction?: AnimationDirection;
  
  /** Fill mode */
  fillMode?: AnimationFillMode;
  
  /** Spring configuration (when type is 'spring') */
  springConfig?: SpringConfig;
  
  /** Decay configuration (when type is 'decay') */
  decayConfig?: DecayConfig;
  
  /** Callback handlers */
  callbacks?: AnimationCallbacks;
  
  /** Metadata */
  metadata?: AnimationMetadata;
}

/**
 * Animated property definition
 * Represents a single property being animated
 */
export interface AnimatedProperty {
  /** Property name (e.g., 'opacity', 'translateX', 'scale') */
  name: string;
  
  /** Starting value */
  from: number | string;
  
  /** Ending value */
  to: number | string;
  
  /** Unit (e.g., 'px', '%', 'deg', 'rad') */
  unit?: string;
  
  /** Interpolation type */
  interpolation?: InterpolationType;
  
  /** Keyframes for complex animations */
  keyframes?: Keyframe[];
}

/**
 * Interpolation type for animated values
 */
export type InterpolationType = 'linear' | 'discrete' | 'bezier' | 'spring';

/**
 * Keyframe definition for complex animations
 */
export interface Keyframe {
  /** Offset between 0 and 1 (0% to 100%) */
  offset: number;
  
  /** Value at this keyframe */
  value: number | string;
  
  /** Easing to next keyframe */
  easing?: EasingType;
}

/**
 * Spring animation configuration
 * Based on physics simulation parameters
 */
export interface SpringConfig {
  /** Mass of the object (default: 1) */
  mass?: number;
  
  /** Stiffness of the spring (default: 100) */
  stiffness?: number;
  
  /** Damping coefficient (default: 10) */
  damping?: number;
  
  /** Initial velocity (default: 0) */
  velocity?: number;
  
  /** Threshold for considering animation complete (default: 0.01) */
  restThreshold?: number;
  
  /** Velocity threshold for rest (default: 0.01) */
  restVelocityThreshold?: number;
}

/**
 * Decay animation configuration
 * For momentum-based animations (e.g., scroll deceleration)
 */
export interface DecayConfig {
  /** Initial velocity */
  velocity: number;
  
  /** Deceleration rate (0-1, default: 0.998) */
  deceleration?: number;
  
  /** Clamping values */
  clamp?: {
    min?: number;
    max?: number;
  };
}

/**
 * Animation callback handlers
 */
export interface AnimationCallbacks {
  /** Called when animation starts */
  onStart?: string;
  
  /** Called on each frame with progress (0-1) */
  onUpdate?: string;
  
  /** Called when animation completes normally */
  onComplete?: string;
  
  /** Called when animation is cancelled */
  onCancel?: string;
  
  /** Called when animation repeats */
  onRepeat?: string;
}

/**
 * Animation metadata
 */
export interface AnimationMetadata {
  /** Source framework where animation was defined */
  sourceFramework?: 'react' | 'flutter';
  
  /** Original animation API used */
  sourceAPI?: string;
  
  /** Target widget/element ID */
  targetId?: string;
  
  /** Animation group ID (for coordinated animations) */
  groupId?: string;
  
  /** Priority for conflict resolution */
  priority?: number;
  
  /** Whether animation can be interrupted */
  interruptible?: boolean;
}

/**
 * Animation group for coordinating multiple animations
 */
export interface AnimationGroup {
  /** Group identifier */
  id: string;
  
  /** Animations in this group */
  animations: AnimationSchema[];
  
  /** How animations should be coordinated */
  coordination: AnimationCoordination;
  
  /** Stagger delay between animations (ms) */
  stagger?: number;
}

/**
 * Animation coordination type
 */
export type AnimationCoordination = 
  | 'parallel'    // All animations run simultaneously
  | 'sequence'    // Animations run one after another
  | 'stagger';    // Animations start with delay between each

/**
 * Animation controller state
 * Runtime state for managing animation playback
 */
export interface AnimationControllerState {
  /** Animation ID */
  animationId: string;
  
  /** Current state */
  state: AnimationState;
  
  /** Current progress (0-1) */
  progress: number;
  
  /** Current iteration */
  currentIteration: number;
  
  /** Start time (timestamp) */
  startTime?: number;
  
  /** Elapsed time (ms) */
  elapsedTime: number;
  
  /** Current values for each animated property */
  currentValues: Record<string, number | string>;
}

/**
 * Animation preset definitions
 * Common animation patterns that can be reused
 */
export interface AnimationPreset {
  /** Preset name */
  name: string;
  
  /** Preset description */
  description?: string;
  
  /** Animation configuration */
  animation: Omit<AnimationSchema, 'id'>;
}

/**
 * Common animation presets
 */
export const ANIMATION_PRESETS: Record<string, AnimationPreset> = {
  fadeIn: {
    name: 'Fade In',
    description: 'Fade element in from transparent to opaque',
    animation: {
      type: 'timing',
      duration: 300,
      easing: 'ease-in',
      properties: [
        { name: 'opacity', from: 0, to: 1 }
      ]
    }
  },
  fadeOut: {
    name: 'Fade Out',
    description: 'Fade element out from opaque to transparent',
    animation: {
      type: 'timing',
      duration: 300,
      easing: 'ease-out',
      properties: [
        { name: 'opacity', from: 1, to: 0 }
      ]
    }
  },
  slideInLeft: {
    name: 'Slide In Left',
    description: 'Slide element in from the left',
    animation: {
      type: 'timing',
      duration: 400,
      easing: 'ease-out',
      properties: [
        { name: 'translateX', from: -100, to: 0, unit: '%' },
        { name: 'opacity', from: 0, to: 1 }
      ]
    }
  },
  slideInRight: {
    name: 'Slide In Right',
    description: 'Slide element in from the right',
    animation: {
      type: 'timing',
      duration: 400,
      easing: 'ease-out',
      properties: [
        { name: 'translateX', from: 100, to: 0, unit: '%' },
        { name: 'opacity', from: 0, to: 1 }
      ]
    }
  },
  scaleIn: {
    name: 'Scale In',
    description: 'Scale element from small to normal size',
    animation: {
      type: 'spring',
      duration: 500,
      easing: 'spring',
      springConfig: {
        stiffness: 200,
        damping: 15
      },
      properties: [
        { name: 'scale', from: 0, to: 1 }
      ]
    }
  },
  bounce: {
    name: 'Bounce',
    description: 'Bounce animation',
    animation: {
      type: 'timing',
      duration: 600,
      easing: 'bounce',
      properties: [
        { name: 'translateY', from: 0, to: 0, keyframes: [
          { offset: 0, value: 0 },
          { offset: 0.25, value: -30, easing: 'ease-out' },
          { offset: 0.5, value: 0, easing: 'ease-in' },
          { offset: 0.75, value: -15, easing: 'ease-out' },
          { offset: 1, value: 0, easing: 'ease-in' }
        ]}
      ]
    }
  }
};

/**
 * Animation transition definition
 * For page/screen transitions
 */
export interface AnimationTransition {
  /** Transition type */
  type: 'push' | 'pop' | 'replace' | 'modal';
  
  /** Enter animation */
  enter: AnimationSchema;
  
  /** Exit animation */
  exit: AnimationSchema;
  
  /** Duration in milliseconds */
  duration: number;
  
  /** Whether to animate in parallel or sequence */
  mode?: 'parallel' | 'sequence';
}

/**
 * Gesture-driven animation configuration
 * For animations controlled by user gestures
 */
export interface GestureAnimation {
  /** Animation ID */
  id: string;
  
  /** Gesture type */
  gestureType: 'pan' | 'pinch' | 'rotate' | 'swipe';
  
  /** Properties controlled by gesture */
  properties: AnimatedProperty[];
  
  /** Gesture bounds */
  bounds?: {
    min?: number;
    max?: number;
  };
  
  /** Snap points */
  snapPoints?: number[];
  
  /** Animation to run when gesture ends */
  releaseAnimation?: AnimationSchema;
}
