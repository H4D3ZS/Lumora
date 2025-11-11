# Animation Converters Guide

## Overview

The animation converters parse React and Flutter animations and convert them to a framework-agnostic Lumora Animation Schema. This enables bidirectional animation conversion and ensures animations work seamlessly across both frameworks.

## Quick Start

```typescript
import { 
  ReactAnimationParser, 
  FlutterAnimationParser 
} from 'lumora-ir/parsers';

// Parse React animations
const reactParser = new ReactAnimationParser();
const reactAnimations = reactParser.parseAnimations(reactCode, 'App.tsx');

// Parse Flutter animations
const flutterParser = new FlutterAnimationParser();
const flutterAnimations = flutterParser.parseAnimations(dartCode, 'main.dart');
```

## React Animation Support

### 1. CSS Transitions

```tsx
// Inline style with transition
<div style={{ 
  transition: 'opacity 300ms ease-in-out',
  opacity: isVisible ? 1 : 0 
}}>
  Content
</div>
```

**Parsed Properties:**
- Property name (e.g., 'opacity')
- Duration (300ms)
- Easing (ease-in-out)
- Delay (optional)

### 2. React Animated API

#### Timing Animation
```typescript
import { Animated } from 'react-native';

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 500,
  easing: Easing.ease,
  delay: 100,
  useNativeDriver: true,
}).start(() => {
  console.log('Animation complete');
});
```

**Parsed Properties:**
- Animation type: 'timing'
- Duration: 500ms
- Easing: 'ease'
- Delay: 100ms
- Callbacks: onComplete

#### Spring Animation
```typescript
Animated.spring(scaleAnim, {
  toValue: 1,
  stiffness: 200,
  damping: 15,
  mass: 1,
  velocity: 0,
  useNativeDriver: true,
}).start();
```

**Parsed Properties:**
- Animation type: 'spring'
- Spring config: stiffness, damping, mass, velocity
- Target value

#### Decay Animation
```typescript
Animated.decay(scrollAnim, {
  velocity: 500,
  deceleration: 0.998,
  useNativeDriver: true,
}).start();
```

**Parsed Properties:**
- Animation type: 'decay'
- Velocity: 500
- Deceleration: 0.998

### 3. Framer Motion

#### Basic Animation
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
  Content
</motion.div>
```

**Parsed Properties:**
- Initial state: opacity: 0, scale: 0.8
- Target state: opacity: 1, scale: 1
- Duration: 500ms
- Easing: 'ease-out'

#### Spring Animation
```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{ 
    type: 'spring',
    stiffness: 300,
    damping: 20,
    mass: 1
  }}
>
  Content
</motion.div>
```

**Parsed Properties:**
- Animation type: 'spring'
- Spring config: stiffness, damping, mass
- Target position: x: 100

#### Repeating Animation
```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ 
    duration: 2,
    repeat: Infinity,
    ease: 'linear'
  }}
>
  Content
</motion.div>
```

**Parsed Properties:**
- Duration: 2000ms
- Iterations: -1 (infinite)
- Easing: 'linear'

## Flutter Animation Support

### 1. AnimationController

```dart
class _MyWidgetState extends State<MyWidget> 
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      reverseDuration: const Duration(milliseconds: 300),
      lowerBound: 0.0,
      upperBound: 1.0,
      vsync: this,
    );
  }
}
```

**Parsed Properties:**
- Duration: 500ms
- Reverse duration: 300ms
- Bounds: 0.0 to 1.0
- Vsync reference

### 2. Tween Animations

#### Basic Tween
```dart
late Animation<double> _animation = Tween<double>(
  begin: 0.0,
  end: 1.0,
).animate(_controller);
```

**Parsed Properties:**
- Property: 'value'
- From: 0.0
- To: 1.0
- Controller: _controller

#### ColorTween
```dart
late Animation<Color?> _colorAnimation = ColorTween(
  begin: Colors.red,
  end: Colors.blue,
).animate(_controller);
```

**Parsed Properties:**
- Property: 'color'
- From: 'red'
- To: 'blue'

#### Tween with Curve
```dart
late Animation<double> _animation = Tween<double>(
  begin: 0.0,
  end: 1.0,
).animate(CurvedAnimation(
  parent: _controller,
  curve: Curves.easeInOut,
));
```

**Parsed Properties:**
- Easing: 'ease-in-out'
- Curve: Curves.easeInOut

### 3. Implicit Animations

#### AnimatedContainer
```dart
AnimatedContainer(
  width: _isExpanded ? 200.0 : 100.0,
  height: _isExpanded ? 200.0 : 100.0,
  color: _isExpanded ? Colors.blue : Colors.red,
  duration: const Duration(milliseconds: 300),
  curve: Curves.easeInOut,
  onEnd: () {
    print('Animation complete');
  },
)
```

**Parsed Properties:**
- Properties: width, height, color
- Duration: 300ms
- Curve: 'ease-in-out'
- Callback: onEnd

#### AnimatedOpacity
```dart
AnimatedOpacity(
  opacity: _isVisible ? 1.0 : 0.0,
  duration: const Duration(milliseconds: 500),
  curve: Curves.easeIn,
)
```

**Parsed Properties:**
- Property: opacity
- Duration: 500ms
- Curve: 'ease-in'

#### AnimatedPositioned
```dart
AnimatedPositioned(
  left: _isLeft ? 0.0 : 100.0,
  top: _isTop ? 0.0 : 50.0,
  duration: const Duration(milliseconds: 400),
  curve: Curves.bounceOut,
)
```

**Parsed Properties:**
- Properties: left, top
- Duration: 400ms
- Curve: 'bounce'

### 4. Animation Builders

#### AnimatedBuilder
```dart
AnimatedBuilder(
  animation: _controller,
  builder: (context, child) {
    return Transform.rotate(
      angle: _controller.value * 2 * pi,
      child: child,
    );
  },
  child: Icon(Icons.refresh),
)
```

**Parsed Properties:**
- Animation: _controller
- Type: 'AnimatedBuilder'

#### TweenAnimationBuilder
```dart
TweenAnimationBuilder<double>(
  tween: Tween<double>(begin: 0, end: 1),
  duration: const Duration(milliseconds: 500),
  curve: Curves.easeOut,
  builder: (context, value, child) {
    return Opacity(
      opacity: value,
      child: child,
    );
  },
)
```

**Parsed Properties:**
- Duration: 500ms
- Curve: 'ease-out'
- Type: 'TweenAnimationBuilder'

## Curve/Easing Mapping

### Flutter Curves → Lumora Easing

| Flutter Curve | Lumora Easing |
|--------------|---------------|
| `Curves.linear` | `linear` |
| `Curves.ease` | `ease` |
| `Curves.easeIn` | `ease-in` |
| `Curves.easeOut` | `ease-out` |
| `Curves.easeInOut` | `ease-in-out` |
| `Curves.bounceIn/Out/InOut` | `bounce` |
| `Curves.elasticIn/Out/InOut` | `elastic` |
| `Curves.fastOutSlowIn` | `ease-in-out` |
| `Curves.decelerate` | `ease-out` |

### React Easing → Lumora Easing

| React Easing | Lumora Easing |
|-------------|---------------|
| `'linear'` | `linear` |
| `'ease'` | `ease` |
| `'ease-in'` | `ease-in` |
| `'ease-out'` | `ease-out` |
| `'ease-in-out'` | `ease-in-out` |
| `Easing.bounce` | `bounce` |
| `Easing.elastic` | `elastic` |

## Animation Schema Output

All animations are converted to this unified schema:

```typescript
interface AnimationSchema {
  id: string;                    // Unique identifier
  type: 'timing' | 'spring' | 'decay';
  duration: number;              // Milliseconds
  delay?: number;                // Milliseconds
  easing: EasingType;
  properties: AnimatedProperty[];
  iterations?: number;           // -1 for infinite
  direction?: AnimationDirection;
  fillMode?: AnimationFillMode;
  springConfig?: SpringConfig;
  decayConfig?: DecayConfig;
  callbacks?: AnimationCallbacks;
  metadata?: {
    sourceFramework: 'react' | 'flutter';
    sourceAPI: string;
    targetId?: string;
    groupId?: string;
    interruptible?: boolean;
  };
}
```

## Advanced Usage

### Custom Error Handling

```typescript
import { ErrorHandler } from 'lumora-ir/errors';

const errorHandler = new ErrorHandler();
const parser = new ReactAnimationParser({ errorHandler });

try {
  const animations = parser.parseAnimations(source, 'App.tsx');
} catch (error) {
  console.error('Animation parsing failed:', error);
}
```

### Singleton Pattern

```typescript
import { 
  getReactAnimationParser,
  getFlutterAnimationParser 
} from 'lumora-ir/parsers';

// Get singleton instances
const reactParser = getReactAnimationParser();
const flutterParser = getFlutterAnimationParser();

// Reset if needed
import { 
  resetReactAnimationParser,
  resetFlutterAnimationParser 
} from 'lumora-ir/parsers';

resetReactAnimationParser();
resetFlutterAnimationParser();
```

### Filtering Animations

```typescript
const animations = parser.parseAnimations(source, 'App.tsx');

// Filter by type
const springAnimations = animations.filter(a => a.type === 'spring');

// Filter by duration
const shortAnimations = animations.filter(a => a.duration < 500);

// Filter by source API
const framerMotionAnimations = animations.filter(
  a => a.metadata?.sourceAPI === 'Framer Motion'
);
```

## Best Practices

1. **Use Consistent Naming**: Name animation variables consistently for better parsing
2. **Explicit Configuration**: Provide explicit animation configuration rather than defaults
3. **Comment Complex Animations**: Add comments for complex animation logic
4. **Test Parsing**: Verify animations parse correctly before production use
5. **Handle Errors**: Always wrap parsing in try-catch blocks
6. **Validate Output**: Validate the animation schema before using it

## Limitations

### Current Limitations

1. **CSS Transitions**: Limited parsing of inline CSS transitions (runtime context needed)
2. **Dynamic Values**: Cannot parse animations with runtime-computed values
3. **Custom Curves**: Custom cubic-bezier curves need explicit definition
4. **Gesture Animations**: Gesture-driven animations not yet fully supported
5. **Animation Groups**: Coordinated animations need manual grouping

### Workarounds

1. Use explicit animation configuration
2. Define animations as constants when possible
3. Use standard curves/easing functions
4. Document complex animation logic
5. Test thoroughly in both frameworks

## Examples

See `packages/lumora_ir/examples/animation-example.ts` for comprehensive examples of:
- All animation types
- Animation groups
- Page transitions
- Gesture animations
- Animation presets

## Testing

Run tests with:
```bash
npm test -- animation-converters.test.ts
```

## Support

For issues or questions:
1. Check the examples in `examples/animation-example.ts`
2. Review test cases in `__tests__/animation-converters.test.ts`
3. Consult the animation schema types in `types/animation-types.ts`
