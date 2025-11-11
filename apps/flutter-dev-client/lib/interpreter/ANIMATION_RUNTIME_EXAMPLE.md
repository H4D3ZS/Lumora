# Animation Runtime Example

This document demonstrates how to use the animation runtime support in the Lumora Flutter dev client.

## Basic Fade In Animation

```json
{
  "schemaVersion": "1.0",
  "root": {
    "type": "View",
    "props": {
      "padding": "16"
    },
    "animation": {
      "id": "fade-in",
      "type": "timing",
      "duration": 300,
      "easing": "ease-in",
      "properties": [
        {
          "name": "opacity",
          "from": 0.0,
          "to": 1.0
        }
      ]
    },
    "children": [
      {
        "type": "Text",
        "props": {
          "text": "Hello, Animated World!"
        }
      }
    ]
  }
}
```

## Spring Scale Animation

```json
{
  "schemaVersion": "1.0",
  "root": {
    "type": "View",
    "props": {
      "padding": "16"
    },
    "animation": {
      "id": "spring-scale",
      "type": "spring",
      "springConfig": {
        "mass": 1.0,
        "stiffness": 200.0,
        "damping": 15.0
      },
      "properties": [
        {
          "name": "scale",
          "from": 0.0,
          "to": 1.0
        }
      ]
    },
    "children": [
      {
        "type": "Button",
        "props": {
          "title": "Click Me!"
        }
      }
    ]
  }
}
```

## Slide and Fade Animation

```json
{
  "schemaVersion": "1.0",
  "root": {
    "type": "View",
    "props": {
      "padding": "16"
    },
    "animation": {
      "id": "slide-fade",
      "type": "timing",
      "duration": 400,
      "delay": 100,
      "easing": "ease-out",
      "properties": [
        {
          "name": "translateX",
          "from": -100.0,
          "to": 0.0
        },
        {
          "name": "opacity",
          "from": 0.0,
          "to": 1.0
        }
      ]
    },
    "children": [
      {
        "type": "Text",
        "props": {
          "text": "Sliding in from the left!"
        }
      }
    ]
  }
}
```

## Infinite Rotation Animation

```json
{
  "schemaVersion": "1.0",
  "root": {
    "type": "View",
    "props": {
      "padding": "16"
    },
    "animation": {
      "id": "spin",
      "type": "timing",
      "duration": 2000,
      "easing": "linear",
      "iterations": -1,
      "properties": [
        {
          "name": "rotation",
          "from": 0.0,
          "to": 6.28318
        }
      ]
    },
    "children": [
      {
        "type": "Image",
        "props": {
          "src": "https://example.com/logo.png"
        }
      }
    ]
  }
}
```

## Complex Multi-Property Animation

```json
{
  "schemaVersion": "1.0",
  "root": {
    "type": "View",
    "props": {
      "padding": "16"
    },
    "animation": {
      "id": "complex-animation",
      "type": "timing",
      "duration": 600,
      "easing": "ease-in-out",
      "properties": [
        {
          "name": "opacity",
          "from": 0.0,
          "to": 1.0
        },
        {
          "name": "scale",
          "from": 0.5,
          "to": 1.0
        },
        {
          "name": "translateY",
          "from": 50.0,
          "to": 0.0
        }
      ]
    },
    "children": [
      {
        "type": "View",
        "props": {
          "backgroundColor": "#4CAF50",
          "padding": "24"
        },
        "children": [
          {
            "type": "Text",
            "props": {
              "text": "Complex Animation",
              "style": {
                "color": "#FFFFFF",
                "fontSize": 24
              }
            }
          }
        ]
      }
    ]
  }
}
```

## Supported Animation Properties

The animation runtime currently supports the following animated properties:

- **opacity**: Fades widgets in/out (0.0 to 1.0)
- **scale**: Scales widgets uniformly
- **rotation**: Rotates widgets (in radians, 2π = 360°)
- **translateX**: Translates widgets horizontally
- **translateY**: Translates widgets vertically

## Supported Easing Curves

The animation runtime supports 30+ easing curves:

### Basic Curves
- `linear`
- `ease`
- `ease-in`
- `ease-out`
- `ease-in-out`

### Sine Curves
- `ease-in-sine`
- `ease-out-sine`
- `ease-in-out-sine`

### Quad Curves
- `ease-in-quad`
- `ease-out-quad`
- `ease-in-out-quad`

### Cubic Curves
- `ease-in-cubic`
- `ease-out-cubic`
- `ease-in-out-cubic`

### Quart Curves
- `ease-in-quart`
- `ease-out-quart`
- `ease-in-out-quart`

### Quint Curves
- `ease-in-quint`
- `ease-out-quint`
- `ease-in-out-quint`

### Expo Curves
- `ease-in-expo`
- `ease-out-expo`
- `ease-in-out-expo`

### Circ Curves
- `ease-in-circ`
- `ease-out-circ`
- `ease-in-out-circ`

### Back Curves
- `ease-in-back`
- `ease-out-back`
- `ease-in-out-back`

### Elastic Curves
- `elastic`
- `elastic-in`
- `elastic-out`
- `elastic-in-out`

### Bounce Curves
- `bounce`
- `bounce-in`
- `bounce-out`
- `bounce-in-out`

### Special Curves
- `fast-out-slow-in`
- `slow-middle`
- `decelerate`

## Animation Types

### Timing Animation
Duration-based animation with easing curve:
```json
{
  "type": "timing",
  "duration": 300,
  "easing": "ease-in-out"
}
```

### Spring Animation
Physics-based animation with spring parameters:
```json
{
  "type": "spring",
  "springConfig": {
    "mass": 1.0,
    "stiffness": 100.0,
    "damping": 10.0
  }
}
```

### Decay Animation
Momentum-based animation (future support):
```json
{
  "type": "decay",
  "decayConfig": {
    "velocity": 1000.0,
    "deceleration": 0.998
  }
}
```

## Animation Iterations

Control how many times an animation repeats:

- **No repeat** (default): Animation runs once
  ```json
  {
    "iterations": 1
  }
  ```

- **Finite repeat**: Animation repeats N times
  ```json
  {
    "iterations": 3
  }
  ```

- **Infinite repeat**: Animation loops forever
  ```json
  {
    "iterations": -1
  }
  ```

## Delayed Start

Add a delay before animation starts:
```json
{
  "delay": 500,
  "duration": 300
}
```

## Performance Considerations

- Animations run at 60 FPS using Flutter's native AnimationController
- Multiple properties can be animated simultaneously without performance impact
- Spring animations automatically calculate optimal duration based on physics
- Proper resource cleanup prevents memory leaks

## Best Practices

1. **Use appropriate durations**: 200-400ms for most UI animations
2. **Choose the right easing**: `ease-out` for entrances, `ease-in` for exits
3. **Limit simultaneous animations**: Too many can overwhelm users
4. **Test on real devices**: Emulators may not reflect actual performance
5. **Use spring animations for natural feel**: Great for interactive elements
6. **Avoid infinite animations**: Use sparingly to prevent distraction

## Troubleshooting

### Animation not playing
- Check that the animation schema is properly formatted
- Verify the animation ID is unique
- Ensure the animated properties are supported

### Animation is choppy
- Reduce the number of simultaneous animations
- Simplify the animation (fewer properties)
- Check device performance

### Animation doesn't stop
- For infinite animations, ensure proper cleanup
- Check that the widget is properly disposed

## Future Enhancements

Planned features for future releases:

- Keyframe animations
- Animation groups (parallel, sequence, stagger)
- Gesture-driven animations
- Path animations
- Color animations
- Size animations
- Animation callbacks
- Animation presets
