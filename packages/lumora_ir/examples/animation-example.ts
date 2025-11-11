/**
 * Animation Schema Examples
 * Demonstrates how to use the Lumora Animation Schema
 */

import {
  AnimationSchema,
  AnimatedProperty,
  AnimationGroup,
  AnimationTransition,
  GestureAnimation,
  ANIMATION_PRESETS,
  LumoraIR,
  LumoraNode,
  createIR,
  createNode
} from '../src';

// Example 1: Simple Fade In Animation
const fadeInAnimation: AnimationSchema = {
  id: 'fade-in-1',
  type: 'timing',
  duration: 300,
  easing: 'ease-in',
  properties: [
    {
      name: 'opacity',
      from: 0,
      to: 1
    }
  ]
};

// Example 2: Spring-based Scale Animation
const springScaleAnimation: AnimationSchema = {
  id: 'spring-scale-1',
  type: 'spring',
  duration: 500,
  easing: 'spring',
  springConfig: {
    mass: 1,
    stiffness: 200,
    damping: 15,
    velocity: 0
  },
  properties: [
    {
      name: 'scale',
      from: 0.8,
      to: 1.0
    }
  ]
};

// Example 3: Complex Keyframe Animation (Bounce)
const bounceAnimation: AnimationSchema = {
  id: 'bounce-1',
  type: 'timing',
  duration: 600,
  easing: 'linear',
  properties: [
    {
      name: 'translateY',
      from: 0,
      to: 0,
      unit: 'px',
      keyframes: [
        { offset: 0, value: 0 },
        { offset: 0.25, value: -30, easing: 'ease-out' },
        { offset: 0.5, value: 0, easing: 'ease-in' },
        { offset: 0.75, value: -15, easing: 'ease-out' },
        { offset: 1, value: 0, easing: 'ease-in' }
      ]
    }
  ]
};

// Example 4: Multi-property Animation
const slideAndFadeAnimation: AnimationSchema = {
  id: 'slide-fade-1',
  type: 'timing',
  duration: 400,
  easing: 'ease-out',
  properties: [
    {
      name: 'translateX',
      from: -100,
      to: 0,
      unit: '%'
    },
    {
      name: 'opacity',
      from: 0,
      to: 1
    }
  ]
};

// Example 5: Animation with Callbacks
const trackedAnimation: AnimationSchema = {
  id: 'tracked-1',
  type: 'timing',
  duration: 500,
  easing: 'ease-in-out',
  properties: [
    { name: 'opacity', from: 0, to: 1 }
  ],
  callbacks: {
    onStart: 'handleAnimationStart',
    onUpdate: 'handleAnimationUpdate',
    onComplete: 'handleAnimationComplete',
    onCancel: 'handleAnimationCancel'
  },
  metadata: {
    sourceFramework: 'react',
    sourceAPI: 'Animated.timing',
    interruptible: true
  }
};

// Example 6: Repeating Animation
const pulseAnimation: AnimationSchema = {
  id: 'pulse-1',
  type: 'timing',
  duration: 1000,
  easing: 'ease-in-out',
  iterations: -1, // Infinite
  direction: 'alternate',
  properties: [
    {
      name: 'scale',
      from: 1.0,
      to: 1.1
    },
    {
      name: 'opacity',
      from: 1.0,
      to: 0.7
    }
  ]
};

// Example 7: Animation Group (Parallel)
const parallelAnimationGroup: AnimationGroup = {
  id: 'parallel-group-1',
  coordination: 'parallel',
  animations: [
    {
      id: 'slide-in',
      type: 'timing',
      duration: 400,
      easing: 'ease-out',
      properties: [
        { name: 'translateX', from: -100, to: 0, unit: '%' }
      ]
    },
    {
      id: 'fade-in',
      type: 'timing',
      duration: 400,
      easing: 'ease-in',
      properties: [
        { name: 'opacity', from: 0, to: 1 }
      ]
    }
  ]
};

// Example 8: Animation Group (Sequence)
const sequenceAnimationGroup: AnimationGroup = {
  id: 'sequence-group-1',
  coordination: 'sequence',
  animations: [
    {
      id: 'scale-up',
      type: 'spring',
      duration: 300,
      easing: 'spring',
      springConfig: { stiffness: 300, damping: 20 },
      properties: [
        { name: 'scale', from: 0, to: 1 }
      ]
    },
    {
      id: 'fade-in',
      type: 'timing',
      duration: 200,
      easing: 'ease-in',
      properties: [
        { name: 'opacity', from: 0, to: 1 }
      ]
    }
  ]
};

// Example 9: Staggered Animation Group
const staggeredAnimationGroup: AnimationGroup = {
  id: 'stagger-group-1',
  coordination: 'stagger',
  stagger: 100, // 100ms delay between each
  animations: [
    {
      id: 'item-1-fade',
      type: 'timing',
      duration: 300,
      easing: 'ease-out',
      properties: [
        { name: 'opacity', from: 0, to: 1 },
        { name: 'translateY', from: 20, to: 0, unit: 'px' }
      ]
    },
    {
      id: 'item-2-fade',
      type: 'timing',
      duration: 300,
      easing: 'ease-out',
      properties: [
        { name: 'opacity', from: 0, to: 1 },
        { name: 'translateY', from: 20, to: 0, unit: 'px' }
      ]
    },
    {
      id: 'item-3-fade',
      type: 'timing',
      duration: 300,
      easing: 'ease-out',
      properties: [
        { name: 'opacity', from: 0, to: 1 },
        { name: 'translateY', from: 20, to: 0, unit: 'px' }
      ]
    }
  ]
};

// Example 10: Page Transition
const pageTransition: AnimationTransition = {
  type: 'push',
  duration: 300,
  mode: 'parallel',
  enter: {
    id: 'page-enter',
    type: 'timing',
    duration: 300,
    easing: 'ease-out',
    properties: [
      { name: 'translateX', from: 100, to: 0, unit: '%' },
      { name: 'opacity', from: 0, to: 1 }
    ]
  },
  exit: {
    id: 'page-exit',
    type: 'timing',
    duration: 300,
    easing: 'ease-in',
    properties: [
      { name: 'translateX', from: 0, to: -30, unit: '%' },
      { name: 'opacity', from: 1, to: 0.5 }
    ]
  }
};

// Example 11: Gesture-Driven Animation
const swipeToDismiss: GestureAnimation = {
  id: 'swipe-dismiss-1',
  gestureType: 'pan',
  properties: [
    { name: 'translateX', from: 0, to: 300, unit: 'px' },
    { name: 'opacity', from: 1, to: 0 }
  ],
  bounds: { min: 0, max: 300 },
  snapPoints: [0, 300],
  releaseAnimation: {
    id: 'swipe-release',
    type: 'spring',
    duration: 300,
    easing: 'spring',
    springConfig: { stiffness: 300, damping: 30 },
    properties: [
      { name: 'translateX', from: 150, to: 300, unit: 'px' }
    ]
  }
};

// Example 12: Using Animation Presets
const presetFadeIn: AnimationSchema = {
  id: 'preset-fade-in',
  ...ANIMATION_PRESETS.fadeIn.animation
};

const presetSlideIn: AnimationSchema = {
  id: 'preset-slide-in',
  ...ANIMATION_PRESETS.slideInLeft.animation
};

// Example 13: Decay Animation (Scroll Momentum)
const scrollDecayAnimation: AnimationSchema = {
  id: 'scroll-decay-1',
  type: 'decay',
  duration: 1000,
  easing: 'linear',
  decayConfig: {
    velocity: 500, // Initial velocity in px/s
    deceleration: 0.998,
    clamp: {
      min: 0,
      max: 1000
    }
  },
  properties: [
    {
      name: 'scrollY',
      from: 0,
      to: 500,
      unit: 'px'
    }
  ]
};

// Example 14: Complete Lumora IR with Animations
const buttonNode: LumoraNode = createNode(
  'Button',
  {
    title: 'Animated Button',
    onPress: 'handlePress'
  },
  [],
  1
);

// Attach animations to the button
buttonNode.animations = ['fade-in-1', 'spring-scale-1'];

const ir: LumoraIR = createIR(
  {
    sourceFramework: 'react',
    sourceFile: 'AnimatedButton.tsx',
    generatedAt: Date.now()
  },
  [buttonNode]
);

// Add animations to the IR
ir.animations = [
  fadeInAnimation,
  springScaleAnimation,
  bounceAnimation,
  slideAndFadeAnimation,
  trackedAnimation,
  pulseAnimation
];

// Add animation groups
ir.animationGroups = [
  parallelAnimationGroup,
  sequenceAnimationGroup,
  staggeredAnimationGroup
];

// Add page transitions
ir.transitions = {
  'home-to-detail': pageTransition
};

// Export examples
export {
  fadeInAnimation,
  springScaleAnimation,
  bounceAnimation,
  slideAndFadeAnimation,
  trackedAnimation,
  pulseAnimation,
  parallelAnimationGroup,
  sequenceAnimationGroup,
  staggeredAnimationGroup,
  pageTransition,
  swipeToDismiss,
  presetFadeIn,
  presetSlideIn,
  scrollDecayAnimation,
  ir
};

// Example usage in code generation
console.log('Animation Schema Examples');
console.log('========================\n');

console.log('1. Simple Fade In:');
console.log(JSON.stringify(fadeInAnimation, null, 2));

console.log('\n2. Spring Scale:');
console.log(JSON.stringify(springScaleAnimation, null, 2));

console.log('\n3. Complete IR with Animations:');
console.log(JSON.stringify(ir, null, 2));
