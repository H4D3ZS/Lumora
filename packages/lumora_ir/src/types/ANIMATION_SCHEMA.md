# Lumora Animation Schema Documentation

## Overview

The Lumora Animation Schema provides a framework-agnostic intermediate representation for animations that can be converted between React (CSS transitions, Animated API, Framer Motion) and Flutter (AnimationController, Tween, ImplicitAnimations).

## Core Concepts

### Animation Types

The schema supports three fundamental animation types:

1. **Timing Animations** (`timing`): Duration-based animations with easing curves
   - Best for: Simple transitions, fade effects, slides
   - Example: Fade in/out, slide transitions, color changes

2. **Spring Animations** (`spring`): Physics-based animations with natural motion
   - Best for: Interactive elements, bouncy effects, natural movements
   - Example: Button press feedback, modal presentations, drag-and-drop

3. **Decay Animations** (`decay`): Momentum-based deceleration
   - Best for: Scroll momentum, swipe gestures, fling animations
   - Example: List scrolling, page swiping, drawer closing

## Schema Structure

### AnimationSchema Interface

```typescript
interface AnimationSchema {
  id: string;                          // Unique identifier
  type: 'spring' | 'timing' | 'decay'; // Animation type
  duration: number;                     // Duration in milliseconds
  delay?: number;                       // Start delay in milliseconds
  easing: EasingType;                   // Easing function
  properties: AnimatedProperty[];       // Properties to animate
  iterations?: number;                  // Repeat count (0=once, -1=infinite)
  direction?: AnimationDirection;       // Animation direction
  fillMode?: AnimationFillMode;         // Fill mode
  springConfig?: SpringConfig;          // Spring parameters
  decayConfig?: DecayConfig;            // Decay parameters
  callbacks?: AnimationCallbacks;       // Event handlers
  metadata?: AnimationMetadata;         // Additional metadata
}
```

### AnimatedProperty Interface

```typescript
interface AnimatedProperty {
  name: string;                    // Property name (e.g., 'opacity', 'translateX')
  from: number | string;           // Starting value
  to: number | string;             // Ending value
  unit?: string;                   // Unit (e.g., 'px', '%', 'deg')
  interpolation?: InterpolationType; // Interpolation method
  keyframes?: Keyframe[];          // Complex keyframe animations
}
```

## Supported Properties

### Transform Properties
- `translateX`, `translateY`, `translateZ` - Translation
- `scaleX`, `scaleY`, `scale` - Scaling
- `rotateX`, `rotateY`, `rotateZ`, `rotate` - Rotation
- `skewX`, `skewY` - Skewing

### Visual Properties
- `opacity` - Transparency (0-1)
- `backgroundColor` - Background color
- `color` - Text/foreground color
- `borderRadius` - Corner radius
- `borderWidth` - Border thickness
- `borderColor` - Border color

### Layout Properties
- `width`, `height` - Dimensions
- `top`, `left`, `right`, `bottom` - Positioning
- `margin`, `padding` - Spacing

## Easing Functions

### Standard Easing
- `linear` - Constant speed
- `ease` - Slow start and end, fast middle
- `ease-in` - Slow start
- `ease-out` - Slow end
- `ease-in-out` - Slow start and end

### Advanced Easing
- `cubic-bezier` - Custom cubic bezier curve
- `spring` - Physics-based spring
- `bounce` - Bouncing effect
- `elastic` - Elastic/rubber band effect

## Examples

### Example 1: Simple Fade In

```typescript
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
```

**React Equivalent:**
```tsx
// CSS Transition
.fade-in {
  opacity: 0;
  transition: opacity 300ms ease-in;
}
.fade-in.active {
  opacity: 1;
}

// React Animated API
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  easing: Easing.in(Easing.ease),
  useNativeDriver: true
}).start();
```

**Flutter Equivalent:**
```dart
// AnimationController
final controller = AnimationController(
  duration: Duration(milliseconds: 300),
  vsync: this,
);
final animation = CurvedAnimation(
  parent: controller,
  curve: Curves.easeIn,
);
controller.forward();

// Or using AnimatedOpacity
AnimatedOpacity(
  opacity: isVisible ? 1.0 : 0.0,
  duration: Duration(milliseconds: 300),
  curve: Curves.easeIn,
  child: child,
)
```

### Example 2: Spring Animation

```typescript
const springAnimation: AnimationSchema = {
  id: 'spring-scale',
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
```

**React Equivalent:**
```tsx
// Framer Motion
<motion.div
  initial={{ scale: 0.8 }}
  animate={{ scale: 1.0 }}
  transition={{
    type: 'spring',
    stiffness: 200,
    damping: 15
  }}
/>

// React Spring
const props = useSpring({
  from: { scale: 0.8 },
  to: { scale: 1.0 },
  config: { mass: 1, tension: 200, friction: 15 }
});
```

**Flutter Equivalent:**
```dart
// Spring Simulation
final simulation = SpringSimulation(
  SpringDescription(
    mass: 1,
    stiffness: 200,
    damping: 15,
  ),
  0.8, // start
  1.0, // end
  0,   // velocity
);
controller.animateWith(simulation);
```

### Example 3: Complex Keyframe Animation

```typescript
const bounceAnimation: AnimationSchema = {
  id: 'bounce-effect',
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
```

**React Equivalent:**
```tsx
// CSS Keyframes
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-30px); }
  50% { transform: translateY(0); }
  75% { transform: translateY(-15px); }
}

// Framer Motion
<motion.div
  animate={{
    y: [0, -30, 0, -15, 0]
  }}
  transition={{
    duration: 0.6,
    times: [0, 0.25, 0.5, 0.75, 1]
  }}
/>
```

**Flutter Equivalent:**
```dart
// TweenSequence
final animation = TweenSequence<double>([
  TweenSequenceItem(
    tween: Tween(begin: 0, end: -30).chain(CurveTween(curve: Curves.easeOut)),
    weight: 25,
  ),
  TweenSequenceItem(
    tween: Tween(begin: -30, end: 0).chain(CurveTween(curve: Curves.easeIn)),
    weight: 25,
  ),
  TweenSequenceItem(
    tween: Tween(begin: 0, end: -15).chain(CurveTween(curve: Curves.easeOut)),
    weight: 25,
  ),
  TweenSequenceItem(
    tween: Tween(begin: -15, end: 0).chain(CurveTween(curve: Curves.easeIn)),
    weight: 25,
  ),
]).animate(controller);
```

### Example 4: Coordinated Animations

```typescript
const slideAndFadeGroup: AnimationGroup = {
  id: 'slide-fade-group',
  coordination: 'parallel',
  animations: [
    {
      id: 'slide',
      type: 'timing',
      duration: 400,
      easing: 'ease-out',
      properties: [
        { name: 'translateX', from: -100, to: 0, unit: '%' }
      ]
    },
    {
      id: 'fade',
      type: 'timing',
      duration: 400,
      easing: 'ease-in',
      properties: [
        { name: 'opacity', from: 0, to: 1 }
      ]
    }
  ]
};
```

### Example 5: Page Transition

```typescript
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
```

## Animation Presets

The schema includes common animation presets that can be used directly:

- `fadeIn` - Fade in from transparent
- `fadeOut` - Fade out to transparent
- `slideInLeft` - Slide in from left
- `slideInRight` - Slide in from right
- `scaleIn` - Scale up from small
- `bounce` - Bounce effect

Usage:
```typescript
import { ANIMATION_PRESETS } from '@lumora/ir';

const animation: AnimationSchema = {
  id: 'my-fade-in',
  ...ANIMATION_PRESETS.fadeIn.animation
};
```

## Integration with Lumora IR

### Adding Animations to Nodes

```typescript
const node: LumoraNode = {
  id: 'button-1',
  type: 'Button',
  props: { title: 'Click Me' },
  children: [],
  animations: ['fade-in-1', 'scale-hover'], // Reference animation IDs
  metadata: { lineNumber: 10 }
};
```

### Adding Animations to IR

```typescript
const ir: LumoraIR = {
  version: '1.0',
  metadata: {
    sourceFramework: 'react',
    sourceFile: 'App.tsx',
    generatedAt: Date.now()
  },
  nodes: [/* ... */],
  animations: [
    fadeInAnimation,
    springAnimation,
    bounceAnimation
  ],
  animationGroups: [
    slideAndFadeGroup
  ],
  transitions: {
    'home-to-detail': pageTransition
  }
};
```

## Performance Considerations

### 60 FPS Target

All animations should maintain 60 FPS (16.67ms per frame). To achieve this:

1. **Use GPU-accelerated properties**: `transform`, `opacity`
2. **Avoid layout-triggering properties**: `width`, `height`, `top`, `left`
3. **Batch animations**: Use animation groups for coordinated effects
4. **Optimize keyframes**: Minimize the number of keyframes

### Native Driver Support

When converting to React Native or Flutter:
- Mark animations that can use native driver
- Avoid animating properties that require JS thread
- Use `useNativeDriver: true` in React Native
- Use `vsync` properly in Flutter

## Callbacks and Events

```typescript
const animationWithCallbacks: AnimationSchema = {
  id: 'tracked-animation',
  type: 'timing',
  duration: 500,
  easing: 'ease-in-out',
  properties: [{ name: 'opacity', from: 0, to: 1 }],
  callbacks: {
    onStart: 'handleAnimationStart',
    onUpdate: 'handleAnimationUpdate',
    onComplete: 'handleAnimationComplete',
    onCancel: 'handleAnimationCancel'
  }
};
```

## Gesture-Driven Animations

```typescript
const swipeAnimation: GestureAnimation = {
  id: 'swipe-dismiss',
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
```

## Best Practices

1. **Use meaningful IDs**: Animation IDs should be descriptive
2. **Prefer spring for interactive elements**: Spring animations feel more natural
3. **Use timing for simple transitions**: Timing animations are more predictable
4. **Keep durations reasonable**: 200-500ms for most UI animations
5. **Test on actual devices**: Emulators may not reflect real performance
6. **Use presets when possible**: Reduces code and ensures consistency
7. **Document complex animations**: Add metadata for maintainability
8. **Consider accessibility**: Respect user's motion preferences

## Framework Conversion Notes

### React to Flutter

- CSS transitions → `AnimatedContainer` or `AnimationController`
- React Animated API → `AnimationController` with `Tween`
- Framer Motion → `AnimationController` with custom curves
- Spring animations → `SpringSimulation`

### Flutter to React

- `AnimationController` → React Animated API or Framer Motion
- `AnimatedContainer` → CSS transitions or Animated API
- `TweenSequence` → Keyframe animations
- `SpringSimulation` → React Spring or Framer Motion spring

## Limitations

1. **No 3D transforms**: Currently limited to 2D transforms
2. **Limited property support**: Not all CSS/Flutter properties are supported
3. **No path animations**: SVG path animations not yet supported
4. **No shader effects**: Custom shaders/filters not supported

## Future Enhancements

- 3D transform support
- SVG path animations
- Shader/filter effects
- Physics-based collision detection
- Animation timeline editor
- Performance profiling tools

## References

- [React Animated API](https://reactnative.dev/docs/animated)
- [Framer Motion](https://www.framer.com/motion/)
- [Flutter Animations](https://flutter.dev/docs/development/ui/animations)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
