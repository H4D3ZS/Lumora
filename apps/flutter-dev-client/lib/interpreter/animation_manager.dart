import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:developer' as developer;
import 'dart:math' as math;

/// Animation manager for handling Lumora animation schemas
/// Provides runtime animation support with 60 FPS performance
class AnimationManager {
  final Map<String, AnimationController> _controllers = {};
  final Map<String, Animation<double>> _animations = {};
  final Map<String, AnimationState> _states = {};
  final Map<String, Timer> _timers = {};
  
  /// Disposes all animation controllers
  void dispose() {
    print('DEBUG: Disposing AnimationManager with ${_controllers.length} controllers');
    for (final timer in _timers.values) {
      timer.cancel();
    }
    _timers.clear();
    
    for (final key in _controllers.keys) {
      print('DEBUG: Disposing controller $key');
      try {
        final controller = _controllers[key];
        if (controller != null) {
          if (controller.isAnimating) {
            controller.stop();
          }
          controller.dispose();
        }
      } catch (e) {
        print('DEBUG: Error disposing controller $key: $e');
      }
    }
    _controllers.clear();
    _animations.clear();
    _states.clear();
  }

  /// Removes and disposes a controller by ID
  void removeController(String id) {
    _timers[id]?.cancel();
    _timers.remove(id);
    
    try {
      _controllers[id]?.dispose();
    } catch (e) {
      // Ignore if already disposed
    }
    _controllers.remove(id);
    _states.remove(id);
    // Also remove associated animations
    _animations.removeWhere((key, _) => key.startsWith('$id-'));
  }
  
  /// Creates an animation controller from a schema
  AnimationController createController({
    required String id,
    required TickerProvider vsync,
    required int duration,
    int? delay,
    bool autoStart = false,
  }) {
    // Dispose existing controller if any
    _controllers[id]?.dispose();
    
    final controller = AnimationController(
      duration: Duration(milliseconds: duration),
      vsync: vsync,
    );
    
    _controllers[id] = controller;
    _states[id] = AnimationState.idle;
    
    // Add status listener to track state
    controller.addStatusListener((status) {
      switch (status) {
        case AnimationStatus.forward:
        case AnimationStatus.reverse:
          _states[id] = AnimationState.running;
          break;
        case AnimationStatus.completed:
          _states[id] = AnimationState.completed;
          break;
        case AnimationStatus.dismissed:
          _states[id] = AnimationState.idle;
          break;
      }
    });
    
    // Auto-start if requested
    if (autoStart) {
      if (delay != null && delay > 0) {
        final timer = Timer(Duration(milliseconds: delay), () {
          _timers.remove(id);
          if (_controllers.containsKey(id)) {
            controller.forward();
          }
        });
        _timers[id] = timer;
      } else {
        controller.forward();
      }
    }
    
    developer.log('Created animation controller: $id', name: 'AnimationManager');
    print('DEBUG: Created controller $id');
    return controller;
  }
  
  /// Creates a tween animation
  Animation<double> createTween({
    required String id,
    required AnimationController controller,
    required double begin,
    required double end,
    Curve curve = Curves.linear,
  }) {
    final tween = Tween<double>(begin: begin, end: end);
    final animation = tween.animate(
      CurvedAnimation(parent: controller, curve: curve),
    );
    
    _animations[id] = animation;
    return animation;
  }
  
  /// Creates a spring animation
  AnimationController createSpringAnimation({
    required String id,
    required TickerProvider vsync,
    required double begin,
    required double end,
    double mass = 1.0,
    double stiffness = 100.0,
    double damping = 10.0,
    bool autoStart = false,
  }) {
    // Dispose existing controller if any
    _controllers[id]?.dispose();
    
    // Calculate duration based on spring physics
    // Using simplified formula: duration ≈ 2π * sqrt(mass / stiffness) * damping factor
    final naturalFrequency = stiffness / mass;
    final dampingRatio = damping / (2 * math.sqrt((mass * stiffness).abs()));
    final duration = ((2 * math.pi / math.sqrt(naturalFrequency)) * 1000 * (1 + dampingRatio)).toInt();
    
    final controller = AnimationController(
      duration: Duration(milliseconds: duration.clamp(100, 5000)),
      vsync: vsync,
    );
    
    _controllers[id] = controller;
    _states[id] = AnimationState.idle;
    
    // Create spring simulation curve
    final springCurve = _SpringCurve(
      mass: mass,
      stiffness: stiffness,
      damping: damping,
    );
    
    final tween = Tween<double>(begin: begin, end: end);
    final animation = tween.animate(
      CurvedAnimation(parent: controller, curve: springCurve),
    );
    
    _animations[id] = animation;
    
    // Add status listener
    controller.addStatusListener((status) {
      switch (status) {
        case AnimationStatus.forward:
        case AnimationStatus.reverse:
          _states[id] = AnimationState.running;
          break;
        case AnimationStatus.completed:
          _states[id] = AnimationState.completed;
          break;
        case AnimationStatus.dismissed:
          _states[id] = AnimationState.idle;
          break;
      }
    });
    
    // Auto-start if requested
    if (autoStart) {
      controller.forward();
    }
    
    developer.log('Created spring animation: $id', name: 'AnimationManager');
    return controller;
  }
  
  /// Gets an animation controller by ID
  AnimationController? getController(String id) {
    return _controllers[id];
  }
  
  /// Gets an animation by ID
  Animation<double>? getAnimation(String id) {
    return _animations[id];
  }
  
  /// Gets animation state by ID
  AnimationState getState(String id) {
    return _states[id] ?? AnimationState.idle;
  }
  
  /// Starts an animation
  void start(String id, {bool reverse = false}) {
    final controller = _controllers[id];
    if (controller == null) {
      developer.log('Animation controller not found: $id', name: 'AnimationManager');
      return;
    }
    
    if (reverse) {
      controller.reverse();
    } else {
      controller.forward();
    }
  }
  
  /// Stops an animation
  void stop(String id) {
    final controller = _controllers[id];
    if (controller == null) return;
    
    controller.stop();
    _states[id] = AnimationState.paused;
  }
  
  /// Resets an animation
  void reset(String id) {
    final controller = _controllers[id];
    if (controller == null) return;
    
    controller.reset();
    _states[id] = AnimationState.idle;
  }
  
  /// Repeats an animation
  void repeat(String id, {bool reverse = false}) {
    final controller = _controllers[id];
    if (controller == null) return;
    
    controller.repeat(reverse: reverse);
  }
  
  /// Parses easing curve from string
  Curve parseCurve(String easingType) {
    switch (easingType.toLowerCase()) {
      case 'linear':
        return Curves.linear;
      case 'ease':
        return Curves.ease;
      case 'ease-in':
        return Curves.easeIn;
      case 'ease-out':
        return Curves.easeOut;
      case 'ease-in-out':
        return Curves.easeInOut;
      case 'ease-in-sine':
        return Curves.easeInSine;
      case 'ease-out-sine':
        return Curves.easeOutSine;
      case 'ease-in-out-sine':
        return Curves.easeInOutSine;
      case 'ease-in-quad':
        return Curves.easeInQuad;
      case 'ease-out-quad':
        return Curves.easeOutQuad;
      case 'ease-in-out-quad':
        return Curves.easeInOutQuad;
      case 'ease-in-cubic':
        return Curves.easeInCubic;
      case 'ease-out-cubic':
        return Curves.easeOutCubic;
      case 'ease-in-out-cubic':
        return Curves.easeInOutCubic;
      case 'ease-in-quart':
        return Curves.easeInQuart;
      case 'ease-out-quart':
        return Curves.easeOutQuart;
      case 'ease-in-out-quart':
        return Curves.easeInOutQuart;
      case 'ease-in-quint':
        return Curves.easeInQuint;
      case 'ease-out-quint':
        return Curves.easeOutQuint;
      case 'ease-in-out-quint':
        return Curves.easeInOutQuint;
      case 'ease-in-expo':
        return Curves.easeInExpo;
      case 'ease-out-expo':
        return Curves.easeOutExpo;
      case 'ease-in-out-expo':
        return Curves.easeInOutExpo;
      case 'ease-in-circ':
        return Curves.easeInCirc;
      case 'ease-out-circ':
        return Curves.easeOutCirc;
      case 'ease-in-out-circ':
        return Curves.easeInOutCirc;
      case 'ease-in-back':
        return Curves.easeInBack;
      case 'ease-out-back':
        return Curves.easeOutBack;
      case 'ease-in-out-back':
        return Curves.easeInOutBack;
      case 'elastic':
      case 'elastic-in':
        return Curves.elasticIn;
      case 'elastic-out':
        return Curves.elasticOut;
      case 'elastic-in-out':
        return Curves.elasticInOut;
      case 'bounce':
      case 'bounce-out':
        return Curves.bounceOut;
      case 'bounce-in':
        return Curves.bounceIn;
      case 'bounce-in-out':
        return Curves.bounceInOut;
      case 'fast-out-slow-in':
        return Curves.fastOutSlowIn;
      case 'slow-middle':
        return Curves.slowMiddle;
      case 'decelerate':
        return Curves.decelerate;
      default:
        developer.log('Unknown easing type: $easingType, using linear', name: 'AnimationManager');
        return Curves.linear;
    }
  }
}

/// Animation state enum
enum AnimationState {
  idle,
  running,
  paused,
  completed,
  cancelled,
}

/// Custom spring curve implementation
class _SpringCurve extends Curve {
  final double mass;
  final double stiffness;
  final double damping;
  
  _SpringCurve({
    this.mass = 1.0,
    this.stiffness = 100.0,
    this.damping = 10.0,
  });
  
  @override
  double transformInternal(double t) {
    // Spring physics simulation
    // Using damped harmonic oscillator formula
    final omega = math.sqrt(stiffness / mass);
    final zeta = damping / (2 * math.sqrt(mass * stiffness));
    
    if (zeta < 1.0) {
      // Underdamped
      final omegaD = omega * math.sqrt(1 - zeta * zeta);
      final a = math.exp(-zeta * omega * t);
      final b = math.cos(omegaD * t) + (zeta * omega / omegaD) * math.sin(omegaD * t);
      return 1.0 - a * b;
    } else if (zeta == 1.0) {
      // Critically damped
      final a = math.exp(-omega * t);
      return 1.0 - a * (1 + omega * t);
    } else {
      // Overdamped
      final r1 = -omega * (zeta + math.sqrt(zeta * zeta - 1));
      final r2 = -omega * (zeta - math.sqrt(zeta * zeta - 1));
      final c1 = 1 / (r1 - r2);
      final c2 = -c1;
      return 1.0 - (c1 * math.exp(r1 * t) + c2 * math.exp(r2 * t));
    }
  }
}

/// Animated widget builder that applies animation values
class AnimatedWidgetBuilder extends StatefulWidget {
  final Map<String, dynamic> animationSchema;
  final AnimationManager animationManager;
  final Widget Function(BuildContext context, Map<String, double> values) builder;
  
  const AnimatedWidgetBuilder({
    super.key,
    required this.animationSchema,
    required this.animationManager,
    required this.builder,
  });
  
  @override
  State<AnimatedWidgetBuilder> createState() => _AnimatedWidgetBuilderState();
}

class _AnimatedWidgetBuilderState extends State<AnimatedWidgetBuilder>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late String _animationId;
  final Map<String, Animation<double>> _propertyAnimations = {};
  final Map<String, double> _currentValues = {};
  
  @override
  void initState() {
    super.initState();
    _setupAnimation();
  }
  
  void _setupAnimation() {
    final schema = widget.animationSchema;
    _animationId = schema['id'] as String? ?? 'animation-${hashCode}';
    final id = _animationId;
    final type = schema['type'] as String? ?? 'timing';
    final duration = schema['duration'] as int? ?? 300;
    final delay = schema['delay'] as int?;
    final easing = schema['easing'] as String? ?? 'ease';
    final properties = schema['properties'] as List<dynamic>? ?? [];
    
    if (type == 'spring') {
      // Spring animation
      final springConfig = schema['springConfig'] as Map<String, dynamic>? ?? {};
      final mass = (springConfig['mass'] as num?)?.toDouble() ?? 1.0;
      final stiffness = (springConfig['stiffness'] as num?)?.toDouble() ?? 100.0;
      final damping = (springConfig['damping'] as num?)?.toDouble() ?? 10.0;
      
      // For spring, we'll use the first property's values
      if (properties.isNotEmpty) {
        final prop = properties.first as Map<String, dynamic>;
        final begin = (prop['from'] as num?)?.toDouble() ?? 0.0;
        final end = (prop['to'] as num?)?.toDouble() ?? 1.0;
        
        _controller = widget.animationManager.createSpringAnimation(
          id: id,
          vsync: this,
          begin: begin,
          end: end,
          mass: mass,
          stiffness: stiffness,
          damping: damping,
          autoStart: true,
        );
      } else {
        _controller = widget.animationManager.createController(
          id: id,
          vsync: this,
          duration: duration,
          delay: delay,
          autoStart: true,
        );
      }
    } else {
      // Timing animation
      _controller = widget.animationManager.createController(
        id: id,
        vsync: this,
        duration: duration,
        delay: delay,
        autoStart: true,
      );
    }
    
    // Create animations for each property
    final curve = widget.animationManager.parseCurve(easing);
    for (final prop in properties) {
      if (prop is! Map<String, dynamic>) continue;
      
      final name = prop['name'] as String?;
      if (name == null) continue;
      
      final from = (prop['from'] as num?)?.toDouble() ?? 0.0;
      final to = (prop['to'] as num?)?.toDouble() ?? 1.0;
      
      final animation = widget.animationManager.createTween(
        id: '$id-$name',
        controller: _controller,
        begin: from,
        end: to,
        curve: curve,
      );
      
      _propertyAnimations[name] = animation;
      _currentValues[name] = from;
      
      // Listen to animation updates
      animation.addListener(() {
        if (mounted) {
          setState(() {
            _currentValues[name] = animation.value;
          });
        }
      });
    }
    
    // Handle iterations
    final iterations = schema['iterations'] as int?;
    if (iterations != null) {
      if (iterations == -1) {
        // Infinite loop
        _controller.repeat();
      } else if (iterations > 1) {
        // Repeat N times
        _controller.repeat(max: iterations.toDouble());
      }
    }
  }
  
  @override
  void dispose() {
    // Let AnimationManager handle disposal
    widget.animationManager.removeController(_animationId);
    
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return widget.builder(context, _currentValues);
  }
}
