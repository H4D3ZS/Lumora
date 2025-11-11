# Animation Schema Quick Reference

## Basic Usage

```typescript
import { AnimationSchema, ANIMATION_PRESETS } from '@lumora/ir';

// Use a preset
const animation: AnimationSchema = {
  id: 'fade-in',
  ...ANIMATION_PRESETS.fadeIn.animation
};

// Or create custom
const custom: AnimationSchema = {
  id: 'my-animation',
  type: 'timing',
  duration: 300,
  easing: 'ease-out',
  properties: [
    { name: 'opacity', from: 0, to: 1 }
  ]
};
```

## Animation Types

| Type | Use Case | Example |
|------|----------|---------|
| `timing` | Simple transitions | Fade, slide, color change |
| `spring` | Interactive elements | Button press, modal open |
| `decay` | Momentum | Scroll, swipe, fling |

## Common Properties

| Property | Description | Units |
|----------|-------------|-------|
| `opacity` | Transparency | 0-1 |
| `translateX/Y` | Position | px, % |
| `scale` | Size | 0-1+ |
| `rotate` | Rotation | deg, rad |
| `backgroundColor` | Color | hex, rgb |

## Easing Functions

- `linear` - Constant speed
- `ease` - Slow start/end
- `ease-in` - Slow start
- `ease-out` - Slow end
- `ease-in-out` - Slow both
- `spring` - Physics-based
- `bounce` - Bouncing
- `elastic` - Rubber band

## Built-in Presets

```typescript
ANIMATION_PRESETS.fadeIn      // Fade in (300ms)
ANIMATION_PRESETS.fadeOut     // Fade out (300ms)
ANIMATION_PRESETS.slideInLeft // Slide from left (400ms)
ANIMATION_PRESETS.slideInRight// Slide from right (400ms)
ANIMATION_PRESETS.scaleIn     // Scale up (500ms spring)
ANIMATION_PRESETS.bounce      // Bounce effect (600ms)
```

## Animation Groups

```typescript
// Parallel (simultaneous)
const group: AnimationGroup = {
  id: 'group-1',
  coordination: 'parallel',
  animations: [slideAnim, fadeAnim]
};

// Sequence (one after another)
const sequence: AnimationGroup = {
  id: 'sequence-1',
  coordination: 'sequence',
  animations: [scaleAnim, fadeAnim]
};

// Stagger (delayed start)
const stagger: AnimationGroup = {
  id: 'stagger-1',
  coordination: 'stagger',
  stagger: 100, // 100ms between each
  animations: [item1, item2, item3]
};
```

## Spring Configuration

```typescript
springConfig: {
  mass: 1,        // Weight (default: 1)
  stiffness: 200, // Spring strength (default: 100)
  damping: 15,    // Resistance (default: 10)
  velocity: 0     // Initial speed (default: 0)
}
```

## Keyframes

```typescript
properties: [{
  name: 'translateY',
  from: 0,
  to: 0,
  keyframes: [
    { offset: 0, value: 0 },
    { offset: 0.5, value: -30, easing: 'ease-out' },
    { offset: 1, value: 0, easing: 'ease-in' }
  ]
}]
```

## Callbacks

```typescript
callbacks: {
  onStart: 'handleStart',
  onUpdate: 'handleUpdate',
  onComplete: 'handleComplete',
  onCancel: 'handleCancel'
}
```

## Attach to Nodes

```typescript
const node: LumoraNode = {
  id: 'button-1',
  type: 'Button',
  props: {},
  children: [],
  animations: ['fade-in', 'scale-hover'], // Animation IDs
  metadata: { lineNumber: 1 }
};
```

## Add to IR

```typescript
const ir: LumoraIR = {
  version: '1.0',
  metadata: { /* ... */ },
  nodes: [node],
  animations: [fadeIn, scaleHover],
  animationGroups: [group],
  transitions: { 'home-detail': transition }
};
```

## Performance Tips

✅ **DO:**
- Use `transform` and `opacity` (GPU-accelerated)
- Keep durations 200-500ms
- Use spring for interactive elements
- Batch related animations

❌ **DON'T:**
- Animate `width`, `height`, `top`, `left` (causes layout)
- Use very long durations (>1s)
- Create too many simultaneous animations
- Animate on every frame

## React Conversion

```typescript
// CSS Transition
.element {
  transition: opacity 300ms ease-in;
}

// Lumora Schema
{
  type: 'timing',
  duration: 300,
  easing: 'ease-in',
  properties: [{ name: 'opacity', from: 0, to: 1 }]
}
```

## Flutter Conversion

```dart
// AnimationController
final controller = AnimationController(
  duration: Duration(milliseconds: 300),
  vsync: this,
);

// Lumora Schema
{
  type: 'timing',
  duration: 300,
  easing: 'linear',
  properties: [{ name: 'opacity', from: 0, to: 1 }]
}
```

## Common Patterns

### Fade In/Out
```typescript
{ type: 'timing', duration: 300, easing: 'ease-in',
  properties: [{ name: 'opacity', from: 0, to: 1 }] }
```

### Slide In
```typescript
{ type: 'timing', duration: 400, easing: 'ease-out',
  properties: [
    { name: 'translateX', from: -100, to: 0, unit: '%' },
    { name: 'opacity', from: 0, to: 1 }
  ] }
```

### Scale Bounce
```typescript
{ type: 'spring', duration: 500, easing: 'spring',
  springConfig: { stiffness: 300, damping: 20 },
  properties: [{ name: 'scale', from: 0, to: 1 }] }
```

### Pulse (Infinite)
```typescript
{ type: 'timing', duration: 1000, easing: 'ease-in-out',
  iterations: -1, direction: 'alternate',
  properties: [{ name: 'scale', from: 1, to: 1.1 }] }
```

## Troubleshooting

**Animation not smooth?**
- Check duration (too short/long?)
- Use GPU properties (transform, opacity)
- Reduce number of simultaneous animations

**Animation not working?**
- Verify animation ID matches node reference
- Check property names are correct
- Ensure from/to values are valid

**Performance issues?**
- Profile with 60 FPS target
- Avoid layout-triggering properties
- Use native driver when possible
- Batch animations into groups
