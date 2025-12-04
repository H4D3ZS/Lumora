import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'dart:io' show Platform;
import 'dart:developer' as developer;
import 'dart:convert';
import 'package:lumora_ui_tokens/kiro_ui_tokens.dart';
import 'template_engine.dart';
import 'renderer_registry.dart';
import 'json_patch_utils.dart';
import 'navigation_manager.dart';
import 'animation_manager.dart';
import 'platform_manager.dart';
import 'native_module_registry.dart';
import '../widgets/error_widgets.dart';

/// Core schema interpreter that converts JSON UI schemas to Flutter widgets
/// 
/// Note: For very large schemas (>100KB), consider using IsolateParser
/// to parse JSON strings in a separate isolate before passing to interpretSchema.
class SchemaInterpreter {
  static const String supportedVersion = '1.0';
  
  /// Whitelist of allowed widget types for security
  /// Only these types can be rendered by default (unless custom renderers are registered)
  static const Set<String> allowedWidgetTypes = {
    'View',
    'Text',
    'Button',
    'List',
    'Image',
    'Input',
  };
  
  // Performance monitoring
  int? _parseStartTime;
  int? _parseEndTime;
  int? _widgetBuildStartTime;
  int? _widgetBuildEndTime;
  bool _showPerformanceMetrics = false;
  
  // Performance metrics storage
  final List<PerformanceMetric> _performanceHistory = [];

  // Current schema state for delta updates
  Map<String, dynamic>? _currentSchema;

  // Event bridge for handling UI events (optional)
  final dynamic eventBridge;

  // Render context for template resolution
  RenderContext _renderContext = RenderContext();

  // Renderer registry for custom widget types
  final RendererRegistry? registry;

  // Navigation manager for handling navigation
  final NavigationManager? navigationManager;

  // Animation manager for handling animations
  AnimationManager? _animationManager;

  // Platform manager for handling platform-specific code
  final PlatformManager _platformManager = PlatformManager();

  // ============================================================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================================================

  // Cache for widget builders to avoid repeated lookups
  final Map<String, Widget Function(Map<String, dynamic>, List<Widget>)> _widgetBuilderCache = {};

  // Cache for resolved props to avoid repeated resolution
  final Map<String, dynamic> _propsCache = {};

  // Cache for parsed colors
  final Map<String, Color> _colorCache = {};

  // Cache for parsed text styles
  final Map<String, TextStyle> _textStyleCache = {};

  // Object pool for frequently allocated objects
  final List<Map<String, dynamic>> _mapPool = [];
  final List<List<Widget>> _listPool = [];

  // Enable/disable caching (useful for debugging)
  bool _enableCaching = true;

  /// Creates a SchemaInterpreter
  /// 
  /// Parameters:
  /// - eventBridge: Optional EventBridge instance for handling UI events
  /// - registry: Optional RendererRegistry for custom widget renderers
  /// - navigationManager: Optional NavigationManager for handling navigation
  SchemaInterpreter({
    this.eventBridge,
    this.registry,
    this.navigationManager,
  }) {
    _animationManager = AnimationManager();
  }

  /// Disposes resources
  void dispose() {
    _animationManager?.dispose();
    clearCaches();
  }

  /// Clears all caches to free memory
  void clearCaches() {
    _widgetBuilderCache.clear();
    _propsCache.clear();
    _colorCache.clear();
    _textStyleCache.clear();
    _mapPool.clear();
    _listPool.clear();
  }

  /// Enables or disables caching (useful for debugging)
  void setCachingEnabled(bool enabled) {
    _enableCaching = enabled;
    if (!enabled) {
      clearCaches();
    }
  }

  /// Enable or disable performance metrics display in debug mode
  void setShowPerformanceMetrics(bool show) {
    _showPerformanceMetrics = show;
  }

  /// Get performance history
  List<PerformanceMetric> get performanceHistory => List.unmodifiable(_performanceHistory);

  /// Get the current schema (for testing and debugging)
  Map<String, dynamic>? get currentSchema => _currentSchema;

  /// Get the current render context (for testing and debugging)
  RenderContext get renderContext => _renderContext;

  /// Sets a variable in the render context
  void setContextVariable(String name, dynamic value) {
    _renderContext.set(name, value);
  }

  /// Sets multiple variables in the render context
  void setContextVariables(Map<String, dynamic> variables) {
    _renderContext.setAll(variables);
  }

  /// Gets a variable from the render context
  dynamic getContextVariable(String name) {
    return _renderContext.get(name);
  }

  /// Clears all variables in the render context
  void clearContext() {
    _renderContext.clear();
  }

  /// Validates and interprets a JSON schema string or Map
  /// Returns a Flutter Widget
  /// 
  /// If jsonString is provided, it will be parsed first
  /// The schema must contain:
  /// - schemaVersion: Version string (currently supports "1.0")
  /// - root: Root schema node with type, props, and children
  Widget interpretSchemaFromJson(String jsonString) {
    try {
      final schema = jsonDecode(jsonString) as Map<String, dynamic>;
      return interpretSchema(schema);
    } catch (e, stackTrace) {
      developer.log(
        'Invalid JSON: $e',
        name: 'SchemaInterpreter',
        error: e,
        stackTrace: stackTrace,
      );
      return ErrorOverlay(
        title: 'Invalid JSON',
        message: 'Failed to parse schema JSON',
        stackTrace: 'Error: $e\n\nStack trace:\n$stackTrace',
        onRetry: null,
        onDismiss: null,
      );
    }
  }

  /// Interprets a JSON schema and returns a Flutter Widget
  /// 
  /// The schema must contain:
  /// - schemaVersion: Version string (currently supports "1.0")
  /// - root: Root schema node with type, props, and children
  Widget interpretSchema(Map<String, dynamic> schema) {
    // Record start time for performance monitoring
    _parseStartTime = DateTime.now().millisecondsSinceEpoch;
    try {
      // Validate schema structure
      final validationError = _validateSchema(schema);
      if (validationError != null) {
        return validationError;
      }

      // Validate schema version
      final schemaVersion = schema['schemaVersion'] as String?;
      if (schemaVersion == null) {
        developer.log(
          'Missing schemaVersion field',
          name: 'SchemaInterpreter',
        );
        return ErrorOverlay(
          title: 'Schema Error',
          message: 'Missing schemaVersion field in schema',
          onRetry: null,
          onDismiss: null,
        );
      }

      if (schemaVersion != supportedVersion) {
        developer.log(
          'Unsupported schema version: $schemaVersion (supported: $supportedVersion)',
          name: 'SchemaInterpreter',
          level: 900, // Warning level
        );
        // Show warning but attempt to render anyway
        return Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              color: Colors.orange.shade100,
              child: Row(
                children: [
                  const Icon(Icons.warning, color: Colors.orange),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Warning: Unsupported schema version $schemaVersion (expected $supportedVersion). Rendering may be incorrect.',
                      style: const TextStyle(color: Colors.orange),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(child: _buildNode(schema['root'] as Map<String, dynamic>)),
          ],
        );
      }

      // Extract root node
      final root = schema['root'];
      if (root == null) {
        developer.log(
          'Missing root node in schema',
          name: 'SchemaInterpreter',
        );
        return ErrorOverlay(
          title: 'Schema Error',
          message: 'Missing root node in schema',
          onRetry: null,
          onDismiss: null,
        );
      }

      if (root is! Map<String, dynamic>) {
        developer.log(
          'Root node is not a valid object',
          name: 'SchemaInterpreter',
        );
        return ErrorOverlay(
          title: 'Schema Error',
          message: 'Root node is not a valid object',
          onRetry: null,
          onDismiss: null,
        );
      }

      // Check for navigation schema and set it up
      if (schema.containsKey('navigation') && navigationManager != null) {
        final navigationSchema = schema['navigation'] as Map<String, dynamic>?;
        if (navigationSchema != null) {
          navigationManager!.setNavigationSchema(navigationSchema);
          developer.log('Navigation schema configured', name: 'SchemaInterpreter');
        }
      }

      // Check for animations schema
      if (schema.containsKey('animations')) {
        final animations = schema['animations'] as List<dynamic>?;
        if (animations != null && animations.isNotEmpty) {
          developer.log('Found ${animations.length} animations in schema', name: 'SchemaInterpreter');
        }
      }

      // Process platform-specific code
      if (schema.containsKey('platform')) {
        final platformSchema = _platformManager.processPlatformSchema(schema);
        if (platformSchema != null) {
          developer.log(
            'Platform-specific code detected for: ${platformSchema['currentPlatform']}',
            name: 'SchemaInterpreter',
          );
          
          // Execute platform code blocks if any
          final platformCode = platformSchema['platformCode'] as List?;
          if (platformCode != null) {
            for (final codeBlock in platformCode) {
              if (codeBlock is Map<String, dynamic>) {
                _platformManager.executePlatformCode(codeBlock);
              }
            }
          }
        }
      }

      // Build widget tree from root node
      developer.log('Building widget tree from schema', name: 'SchemaInterpreter');
      _widgetBuildStartTime = DateTime.now().millisecondsSinceEpoch;
      final widget = _buildNode(root);
      _widgetBuildEndTime = DateTime.now().millisecondsSinceEpoch;
      
      // Store current schema for delta updates
      _currentSchema = Map<String, dynamic>.from(schema);
      
      // Record end time and calculate performance metrics
      _parseEndTime = DateTime.now().millisecondsSinceEpoch;
      _logPerformanceMetrics();
      
      return widget;
    } catch (e, stackTrace) {
      developer.log(
        'Error interpreting schema: $e',
        name: 'SchemaInterpreter',
        error: e,
        stackTrace: stackTrace,
      );
      return ErrorOverlay(
        title: 'Schema Interpretation Error',
        message: e.toString(),
        stackTrace: stackTrace.toString(),
        onRetry: null,
        onDismiss: null,
      );
    }
  }

  /// Validates schema structure before interpretation
  /// Returns an error widget if validation fails, null otherwise
  Widget? _validateSchema(Map<String, dynamic> schema) {
    // Check if schema is empty
    if (schema.isEmpty) {
      developer.log(
        'Empty schema provided',
        name: 'SchemaInterpreter',
      );
      return ErrorOverlay(
        title: 'Invalid Schema',
        message: 'Schema is empty',
        onRetry: null,
        onDismiss: null,
      );
    }

    // Validate required fields exist
    if (!schema.containsKey('schemaVersion')) {
      developer.log(
        'Schema missing schemaVersion field',
        name: 'SchemaInterpreter',
      );
      return ErrorOverlay(
        title: 'Invalid Schema',
        message: 'Schema is missing required field: schemaVersion',
        onRetry: null,
        onDismiss: null,
      );
    }

    if (!schema.containsKey('root')) {
      developer.log(
        'Schema missing root field',
        name: 'SchemaInterpreter',
      );
      return ErrorOverlay(
        title: 'Invalid Schema',
        message: 'Schema is missing required field: root',
        onRetry: null,
        onDismiss: null,
      );
    }

    return null;
  }

  /// Logs performance metrics for schema parsing and rendering
  void _logPerformanceMetrics() {
    if (_parseStartTime != null && _parseEndTime != null) {
      final totalDuration = _parseEndTime! - _parseStartTime!;
      final totalDurationSeconds = totalDuration / 1000.0;
      
      // Calculate widget build time
      int? widgetBuildDuration;
      if (_widgetBuildStartTime != null && _widgetBuildEndTime != null) {
        widgetBuildDuration = _widgetBuildEndTime! - _widgetBuildStartTime!;
      }
      
      // Calculate parsing time (total - widget build)
      final parsingDuration = widgetBuildDuration != null 
          ? totalDuration - widgetBuildDuration 
          : totalDuration;
      
      developer.log(
        'Schema parsing and rendering completed in ${totalDurationSeconds.toStringAsFixed(3)}s',
        name: 'SchemaInterpreter.Performance',
      );
      
      // Log warning if time exceeds 2 seconds
      if (totalDurationSeconds > 2.0) {
        developer.log(
          'WARNING: Schema parsing took longer than 2 seconds (${totalDurationSeconds.toStringAsFixed(3)}s)',
          name: 'SchemaInterpreter.Performance',
          level: 900, // Warning level
        );
      }
      
      // Store performance metric
      final metric = PerformanceMetric(
        timestamp: _parseStartTime!,
        totalDurationMs: totalDuration,
        parsingDurationMs: parsingDuration,
        widgetBuildDurationMs: widgetBuildDuration,
      );
      _performanceHistory.add(metric);
      
      // Keep only last 50 metrics
      if (_performanceHistory.length > 50) {
        _performanceHistory.removeAt(0);
      }
      
      // Display metrics in debug mode if enabled
      if (_showPerformanceMetrics) {
        developer.log(
          'Performance Metrics:\n'
          '  - Total time: ${totalDurationSeconds.toStringAsFixed(3)}s\n'
          '  - Parsing time: ${(parsingDuration / 1000.0).toStringAsFixed(3)}s\n'
          '  - Widget build time: ${widgetBuildDuration != null ? (widgetBuildDuration / 1000.0).toStringAsFixed(3) : 'N/A'}s\n'
          '  - Start: $_parseStartTime\n'
          '  - End: $_parseEndTime',
          name: 'SchemaInterpreter.Performance',
        );
      }
    }
  }

  /// Recursively builds a widget from a schema node
  /// OPTIMIZED: Uses caching and reduces allocations
  Widget _buildNode(Map<String, dynamic> node, {RenderContext? context}) {
    try {
      // Use provided context or default to root context
      final currentContext = context ?? _renderContext;

      // Extract node properties
      final type = node['type'] as String?;
      if (type == null) {
        developer.log(
          'Missing type field in node',
          name: 'SchemaInterpreter',
        );
        return SchemaErrorWidget(
          nodeType: 'unknown',
          errorMessage: 'Missing type field in node',
        );
      }

      // OPTIMIZATION: Avoid unnecessary map allocation if props is already a map
      final propsRaw = node['props'];
      final props = propsRaw is Map<String, dynamic>
          ? propsRaw
          : (propsRaw is Map ? Map<String, dynamic>.from(propsRaw) : <String, dynamic>{});
      
      // Validate required props for specific types
      _validateRequiredProps(type, props);
      
      // OPTIMIZATION: Cache prop resolution results
      final propsCacheKey = _enableCaching ? _generatePropsCacheKey(type, props) : null;
      Map<String, dynamic> resolvedProps;
      
      if (propsCacheKey != null && _propsCache.containsKey(propsCacheKey)) {
        resolvedProps = _propsCache[propsCacheKey]!;
      } else {
        // Resolve platform-specific props
        final platformResolvedProps = _resolvePlatformProps(props);
        
        // Resolve template placeholders in props
        resolvedProps = TemplateEngine.resolveMap(platformResolvedProps, currentContext);
        
        // Cache the result
        if (propsCacheKey != null && _enableCaching) {
          _propsCache[propsCacheKey] = resolvedProps;
        }
      }
      
      final childrenData = node['children'] as List<dynamic>?;

      // OPTIMIZATION: Avoid allocation if no children
      final children = childrenData == null || childrenData.isEmpty
          ? const <Widget>[]
          : childrenData
              .whereType<Map<String, dynamic>>()
              .map((childNode) => _buildNode(childNode, context: currentContext))
              .toList();

      // Render widget based on type
      Widget widget = _renderWidget(type, resolvedProps, children);

      // Check if node has animation
      if (node.containsKey('animation')) {
        final animationSchema = node['animation'] as Map<String, dynamic>?;
        if (animationSchema != null && _animationManager != null) {
          widget = _wrapWithAnimation(widget, animationSchema);
        }
      }

      return widget;
    } catch (e, stackTrace) {
      developer.log(
        'Error building node: $e',
        name: 'SchemaInterpreter',
        error: e,
        stackTrace: stackTrace,
      );
      return SchemaErrorWidget(
        nodeType: node['type']?.toString() ?? 'unknown',
        errorMessage: 'Node build error: $e',
      );
    }
  }

  /// Generates a cache key for props resolution
  /// OPTIMIZATION: Uses jsonEncode for reliable content-based caching
  String _generatePropsCacheKey(String type, Map<String, dynamic> props) {
    if (props.isEmpty) {
      return '$type:empty';
    }
    // jsonEncode is relatively fast for small prop maps and ensures
    // that identical content produces the same key
    return '$type:${jsonEncode(props)}';
  }

  /// Wraps a widget with animation based on animation schema
  Widget _wrapWithAnimation(Widget child, Map<String, dynamic> animationSchema) {
    if (_animationManager == null) {
      developer.log('Animation manager not available', name: 'SchemaInterpreter');
      return child;
    }

    return AnimatedWidgetBuilder(
      animationSchema: animationSchema,
      animationManager: _animationManager!,
      builder: (context, values) {
        // Apply animation values to the widget
        return _applyAnimationValues(child, values);
      },
    );
  }

  /// Applies animation values to a widget
  Widget _applyAnimationValues(Widget child, Map<String, double> values) {
    Widget result = child;

    // Apply opacity animation
    if (values.containsKey('opacity')) {
      result = Opacity(
        opacity: values['opacity']!.clamp(0.0, 1.0),
        child: result,
      );
    }

    // Apply scale animation
    if (values.containsKey('scale')) {
      result = Transform.scale(
        scale: values['scale']!,
        child: result,
      );
    }

    // Apply rotation animation (in radians)
    if (values.containsKey('rotation')) {
      result = Transform.rotate(
        angle: values['rotation']!,
        child: result,
      );
    }

    // Apply translation animations
    final translateX = values['translateX'] ?? 0.0;
    final translateY = values['translateY'] ?? 0.0;
    if (translateX != 0.0 || translateY != 0.0) {
      result = Transform.translate(
        offset: Offset(translateX, translateY),
        child: result,
      );
    }

    return result;
  }

  /// Validates required props for specific widget types
  /// Logs warnings if required props are missing
  void _validateRequiredProps(String type, Map<String, dynamic> props) {
    switch (type) {
      case 'Text':
        if (!props.containsKey('text')) {
          developer.log(
            'Warning: Text widget missing required prop "text"',
            name: 'SchemaInterpreter',
            level: 900, // Warning level
          );
        }
        break;
      case 'Button':
        if (!props.containsKey('title')) {
          developer.log(
            'Warning: Button widget missing recommended prop "title"',
            name: 'SchemaInterpreter',
            level: 900,
          );
        }
        break;
      case 'Image':
        if (!props.containsKey('src')) {
          developer.log(
            'Warning: Image widget missing required prop "src"',
            name: 'SchemaInterpreter',
            level: 900,
          );
        }
        break;
    }
  }

  /// Renders a widget based on type, props, and children
  /// OPTIMIZED: Uses cached widget builders
  Widget _renderWidget(
    String type,
    Map<String, dynamic> props,
    List<Widget> children,
  ) {
    // Sanitize props to prevent injection attacks
    final sanitizedProps = _sanitizeProps(props);
    
    // OPTIMIZATION: Check cache for widget builder function
    if (_enableCaching && _widgetBuilderCache.containsKey(type)) {
      final builder = _widgetBuilderCache[type]!;
      return builder(sanitizedProps, children);
    }
    
    // Check registry for custom renderers first
    if (registry != null && registry!.hasRenderer(type)) {
      developer.log(
        'Using custom renderer for type: $type',
        name: 'SchemaInterpreter',
      );
      
      final customWidget = registry!.render(type, sanitizedProps, children);
      if (customWidget != null) {
        // Cache the custom renderer
        if (_enableCaching) {
          _widgetBuilderCache[type] = (props, children) => 
              registry!.render(type, props, children) ?? 
              SchemaErrorWidget(nodeType: type, errorMessage: 'Custom renderer failed');
        }
        return customWidget;
      }
      
      // If custom renderer returned null or threw an error, fall through to default handling
      developer.log(
        'Custom renderer for $type returned null, falling back to default handling',
        name: 'SchemaInterpreter',
        level: 900, // Warning level
      );
    }
    
    // Security: Check if type is in whitelist
    if (!allowedWidgetTypes.contains(type) && (registry == null || !registry!.hasRenderer(type))) {
      developer.log(
        'Widget type not in whitelist: $type',
        name: 'SchemaInterpreter',
        level: 900, // Warning level
      );
      return SchemaErrorWidget(
        nodeType: type,
        errorMessage: 'This widget type is not allowed for security reasons',
        isWarning: true,
      );
    }
    
    // OPTIMIZATION: Create and cache widget builder functions
    Widget Function(Map<String, dynamic>, List<Widget>) builder;
    
    // Use default renderers for core primitives
    switch (type) {
      case 'View':
        builder = (props, children) => _renderView(props, children);
        break;
      case 'Text':
        builder = (props, children) => _renderText(props);
        break;
      case 'Button':
        builder = (props, children) => _renderButton(props);
        break;
      case 'List':
        builder = (props, children) => _renderList(props, children);
        break;
      case 'Image':
        builder = (props, children) => _renderImage(props);
        break;
      case 'Input':
        builder = (props, children) => _renderInput(props);
        break;
      default:
        // Check for Native Modules
        if (type.startsWith('Native') || NativeModuleRegistry().hasWidget(type)) {
          if (NativeModuleRegistry().hasWidget(type)) {
             builder = (props, children) => NativeModuleRegistry().createWidget(type, props) ?? const SizedBox();
          } else {
             builder = (props, children) => MissingNativeModuleWidget(moduleName: type);
          }
          break;
        }

        developer.log(
          'Unknown widget type: $type',
          name: 'SchemaInterpreter',
          level: 900, // Warning level
        );
        return SchemaErrorWidget(
          nodeType: type,
          errorMessage: 'This widget type is not supported',
          isWarning: true,
        );
    }
    
    // Cache the builder
    if (_enableCaching) {
      _widgetBuilderCache[type] = builder;
    }
    
    return builder(sanitizedProps, children);
  }

  /// Sanitizes props to prevent injection attacks
  /// 
  /// Security measures:
  /// - Removes any props that could execute code
  /// - Validates string values don't contain dangerous patterns
  /// - Ensures URLs are safe (for Image src)
  Map<String, dynamic> _sanitizeProps(Map<String, dynamic> props) {
    final sanitized = <String, dynamic>{};
    
    for (final entry in props.entries) {
      final key = entry.key;
      final value = entry.value;
      
      // Skip any props that could be dangerous
      if (key.toLowerCase().contains('script') || 
          key.toLowerCase().contains('eval') ||
          key.toLowerCase().contains('function')) {
        developer.log(
          'Blocked potentially dangerous prop: $key',
          name: 'SchemaInterpreter.Security',
          level: 900,
        );
        continue;
      }
      
      // Sanitize string values
      if (value is String) {
        sanitized[key] = _sanitizeString(value);
      } else if (value is Map) {
        // Recursively sanitize nested maps
        sanitized[key] = _sanitizeProps(Map<String, dynamic>.from(value));
      } else if (value is List) {
        // Sanitize list items
        sanitized[key] = value.map((item) {
          if (item is String) {
            return _sanitizeString(item);
          } else if (item is Map) {
            return _sanitizeProps(Map<String, dynamic>.from(item));
          }
          return item;
        }).toList();
      } else {
        // Keep other types as-is (numbers, booleans, null)
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /// Sanitizes a string value to prevent injection attacks
  /// 
  /// Note: This is a basic sanitization. For production use, consider
  /// more comprehensive sanitization based on your security requirements.
  String _sanitizeString(String value) {
    // Remove any potential script tags or dangerous patterns
    String sanitized = value;
    
    // Remove script tags (case-insensitive)
    sanitized = sanitized.replaceAll(RegExp(r'<script[^>]*>.*?</script>', caseSensitive: false), '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replaceAll(RegExp(r'javascript:', caseSensitive: false), '');
    
    // Remove data: protocol with javascript
    sanitized = sanitized.replaceAll(RegExp(r'data:text/html[^,]*,.*?<script', caseSensitive: false), '');
    
    // For template placeholders, we allow them as they're resolved safely
    // The TemplateEngine already handles safe variable lookup
    
    return sanitized;
  }

  /// Renders a View as a Container widget
  Widget _renderView(Map<String, dynamic> props, List<Widget> children) {
    // Extract padding using design tokens
    EdgeInsets? padding;
    if (props.containsKey('padding')) {
      padding = LumoraSpacing.parse(props['padding']);
    }

    // Extract margin using design tokens
    EdgeInsets? margin;
    if (props.containsKey('margin')) {
      margin = LumoraSpacing.parse(props['margin']);
    }

    // Extract backgroundColor using design tokens
    Color? backgroundColor;
    if (props.containsKey('backgroundColor')) {
      final colorValue = props['backgroundColor'];
      if (colorValue is String) {
        backgroundColor = _parseColor(colorValue);
      }
    }

    // Build child widget
    Widget? child;
    if (children.length == 1) {
      child = children.first;
    } else if (children.length > 1) {
      child = Column(
        mainAxisSize: MainAxisSize.min,
        children: children,
      );
    }

    return Container(
      padding: padding,
      margin: margin,
      color: backgroundColor,
      child: child,
    );
  }

  /// Renders a Text widget
  Widget _renderText(Map<String, dynamic> props) {
    // Extract text content
    final text = props['text'] as String? ?? '';

    // Extract style properties
    TextStyle? textStyle;
    if (props.containsKey('style')) {
      final styleProps = props['style'];
      if (styleProps is Map<String, dynamic>) {
        textStyle = _buildTextStyle(styleProps);
      }
    }

    return Text(
      text,
      style: textStyle,
    );
  }

  /// Renders a Button with platform-appropriate styling
  /// Uses Material Design on Android and Cupertino on iOS
  Widget _renderButton(Map<String, dynamic> props) {
    // Extract title
    final title = props['title'] as String? ?? 'Button';

    // Extract onTap handler
    VoidCallback? onPressed;
    if (props.containsKey('onTap')) {
      final onTapValue = props['onTap'];
      if (onTapValue is String) {
        // Check if it's a navigation action
        if (_isNavigationAction(onTapValue)) {
          onPressed = () => _handleNavigationAction(onTapValue);
        } else if (eventBridge != null && eventBridge.createHandler != null) {
          // Use EventBridge to create handler if available
          try {
            onPressed = eventBridge.createHandler(onTapValue);
          } catch (e) {
            developer.log(
              'Failed to create event handler: $e',
              name: 'SchemaInterpreter',
            );
            // Fall back to logging
            onPressed = () {
              developer.log(
                'Button tapped: $onTapValue',
                name: 'SchemaInterpreter',
              );
            };
          }
        } else {
          // No event bridge available, just log
          onPressed = () {
            developer.log(
              'Button tapped: $onTapValue (no event bridge)',
              name: 'SchemaInterpreter',
            );
          };
        }
      } else if (onTapValue is Map<String, dynamic>) {
        // Handle navigation action object
        if (onTapValue.containsKey('action') && onTapValue['action'] == 'navigate') {
          final routeName = onTapValue['route'] as String?;
          final params = onTapValue['params'] as Map<String, dynamic>?;
          if (routeName != null) {
            onPressed = () => _navigateTo(routeName, params: params);
          }
        }
      }
    }

    // Use platform-adaptive button styling
    if (_isIOS()) {
      // iOS: Use Cupertino button
      return CupertinoButton.filled(
        onPressed: onPressed,
        child: Text(title),
      );
    } else {
      // Android and others: Use Material Design button
      return ElevatedButton(
        onPressed: onPressed,
        child: Text(title),
      );
    }
  }

  /// Checks if the current platform is iOS
  bool _isIOS() {
    try {
      return Platform.isIOS;
    } catch (e) {
      // Platform check might fail in some environments (e.g., web)
      return false;
    }
  }

  /// Checks if the current platform is Android
  bool _isAndroid() {
    try {
      return Platform.isAndroid;
    } catch (e) {
      return false;
    }
  }

  /// Renders a List as a ListView widget
  /// Uses ListView.builder for lazy rendering when children count exceeds 20
  Widget _renderList(Map<String, dynamic> props, List<Widget> children) {
    // Use lazy rendering for large lists (more than 20 items)
    if (children.length > 20) {
      developer.log(
        'Using lazy rendering for list with ${children.length} items',
        name: 'SchemaInterpreter',
      );
      
      return ListView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: children.length,
        itemBuilder: (context, index) {
          return children[index];
        },
      );
    }
    
    // Use regular ListView for small lists
    return ListView(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: children,
    );
  }

  /// Renders an Image widget with network caching
  Widget _renderImage(Map<String, dynamic> props) {
    // Check if src is a platform-specific asset configuration
    final srcValue = props['src'];
    String? src;
    
    if (srcValue is Map<String, dynamic> && _isPlatformSpecificValue(srcValue)) {
      // Resolve platform-specific asset
      src = _getPlatformAsset(srcValue);
      if (src == null) {
        _logPlatformWarning('No platform-specific image found, using fallback');
        src = srcValue['fallback'] as String?;
      }
    } else if (srcValue is String) {
      src = srcValue;
    }
    
    if (src == null || src.isEmpty) {
      return SchemaErrorWidget(
        nodeType: 'Image',
        errorMessage: 'Missing required prop: src',
      );
    }

    final width = props['width'] as num?;
    final height = props['height'] as num?;

    // Determine if it's a network or asset image
    final isNetworkImage = src.startsWith('http://') || src.startsWith('https://');
    
    if (isNetworkImage) {
      return Image.network(
        src,
        width: width?.toDouble(),
        height: height?.toDouble(),
        errorBuilder: (context, error, stackTrace) {
          return SchemaErrorWidget(
            nodeType: 'Image',
            errorMessage: 'Failed to load image from: $src',
          );
        },
      );
    } else {
      // Asset image
      return Image.asset(
        src,
        width: width?.toDouble(),
        height: height?.toDouble(),
        errorBuilder: (context, error, stackTrace) {
          return SchemaErrorWidget(
            nodeType: 'Image',
            errorMessage: 'Failed to load asset image: $src',
          );
        },
      );
    }
  }

  /// Renders an Input as a TextField widget
  Widget _renderInput(Map<String, dynamic> props) {
    final placeholder = props['placeholder'] as String?;
    final value = props['value'] as String?;

    final controller = TextEditingController(text: value);

    return TextField(
      controller: controller,
      decoration: InputDecoration(
        hintText: placeholder,
        border: const OutlineInputBorder(),
      ),
      onChanged: (text) {
        developer.log(
          'Input changed: $text',
          name: 'SchemaInterpreter',
        );
      },
    );
  }

  /// Builds a TextStyle from style properties
  /// Supports design token typography names and individual style properties
  /// OPTIMIZED: Uses text style cache to avoid repeated parsing
  TextStyle _buildTextStyle(Map<String, dynamic> styleProps) {
    // Generate cache key
    final cacheKey = _enableCaching ? styleProps.hashCode.toString() : null;
    
    // Check cache first
    if (cacheKey != null && _textStyleCache.containsKey(cacheKey)) {
      return _textStyleCache[cacheKey]!;
    }
    
    TextStyle style;
    
    // Check if a typography token name is provided
    if (styleProps.containsKey('typography')) {
      final typographyName = styleProps['typography'] as String?;
      if (typographyName != null) {
        final baseStyle = LumoraTypography.parse(typographyName);
        if (baseStyle != null) {
          // Apply any additional overrides on top of the base style
          style = _applyStyleOverrides(baseStyle, styleProps);
          
          // Cache and return
          if (cacheKey != null) {
            _textStyleCache[cacheKey] = style;
          }
          return style;
        }
      }
    }

    // Build style from individual properties
    double? fontSize;
    if (styleProps.containsKey('fontSize')) {
      final value = styleProps['fontSize'];
      if (value is num) {
        fontSize = value.toDouble();
      }
    }

    FontWeight? fontWeight;
    if (styleProps.containsKey('fontWeight')) {
      final value = styleProps['fontWeight'] as String?;
      if (value == 'bold') {
        fontWeight = FontWeight.bold;
      } else if (value == 'normal') {
        fontWeight = FontWeight.normal;
      }
    }

    Color? color;
    if (styleProps.containsKey('color')) {
      final value = styleProps['color'] as String?;
      if (value != null) {
        color = _parseColor(value);
      }
    }

    style = TextStyle(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
    );
    
    // Cache the result
    if (cacheKey != null) {
      _textStyleCache[cacheKey] = style;
    }
    
    return style;
  }

  /// Applies style property overrides to a base TextStyle
  TextStyle _applyStyleOverrides(TextStyle baseStyle, Map<String, dynamic> styleProps) {
    double? fontSize;
    if (styleProps.containsKey('fontSize')) {
      final value = styleProps['fontSize'];
      if (value is num) {
        fontSize = value.toDouble();
      }
    }

    FontWeight? fontWeight;
    if (styleProps.containsKey('fontWeight')) {
      final value = styleProps['fontWeight'] as String?;
      if (value == 'bold') {
        fontWeight = FontWeight.bold;
      } else if (value == 'normal') {
        fontWeight = FontWeight.normal;
      }
    }

    Color? color;
    if (styleProps.containsKey('color')) {
      final value = styleProps['color'] as String?;
      if (value != null) {
        color = _parseColor(value);
      }
    }

    return baseStyle.copyWith(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
    );
  }

  /// Parses a color string using design tokens
  /// Supports hex colors, named colors, and design token names
  /// OPTIMIZED: Uses color cache to avoid repeated parsing
  Color _parseColor(String colorString) {
    // Check cache first
    if (_enableCaching && _colorCache.containsKey(colorString)) {
      return _colorCache[colorString]!;
    }
    
    try {
      // Use design token parser which handles both hex and named colors
      final color = LumoraColors.parse(colorString);
      
      // Cache the result
      if (_enableCaching) {
        _colorCache[colorString] = color;
      }
      
      return color;
    } catch (e) {
      developer.log(
        'Failed to parse color: $colorString',
        name: 'SchemaInterpreter',
      );
      return LumoraColors.black;
    }
  }

  /// Resolves platform-specific props
  /// 
  /// Handles props that have platform-specific values, such as:
  /// {
  ///   "icon": {
  ///     "ios": "assets/icons/ios/icon.png",
  ///     "android": "assets/icons/android/icon.png",
  ///     "fallback": "assets/icons/default.png"
  ///   }
  /// }
  Map<String, dynamic> _resolvePlatformProps(Map<String, dynamic> props) {
    final resolved = <String, dynamic>{};
    
    for (final entry in props.entries) {
      final key = entry.key;
      final value = entry.value;
      
      // Check if value is a platform-specific map
      if (value is Map<String, dynamic> && _isPlatformSpecificValue(value)) {
        // Resolve platform-specific value
        final platformValue = _platformManager.getPlatformValue(
          value.map((k, v) => MapEntry(k, v)),
          fallback: value['fallback'],
        );
        
        if (platformValue != null) {
          resolved[key] = platformValue;
          developer.log(
            'Resolved platform-specific prop: $key = $platformValue',
            name: 'SchemaInterpreter',
          );
        } else if (value.containsKey('fallback')) {
          resolved[key] = value['fallback'];
          developer.log(
            'Using fallback for platform-specific prop: $key',
            name: 'SchemaInterpreter',
            level: 900,
          );
        } else {
          developer.log(
            'No platform match and no fallback for prop: $key',
            name: 'SchemaInterpreter',
            level: 900,
          );
        }
      } else if (value is Map<String, dynamic>) {
        // Recursively resolve nested maps
        resolved[key] = _resolvePlatformProps(value);
      } else if (value is List) {
        // Recursively resolve list items
        resolved[key] = value.map((item) {
          if (item is Map<String, dynamic>) {
            return _resolvePlatformProps(item);
          }
          return item;
        }).toList();
      } else {
        // Keep non-platform-specific values as-is
        resolved[key] = value;
      }
    }
    
    return resolved;
  }

  /// Checks if a map represents a platform-specific value
  /// 
  /// A map is considered platform-specific if it contains keys that match
  /// supported platform types (ios, android, web, etc.)
  bool _isPlatformSpecificValue(Map<String, dynamic> map) {
    // Check if map contains any platform keys
    final platformKeys = map.keys.where((key) => 
      PlatformManager.supportedPlatforms.contains(key.toLowerCase())
    );
    
    // Must have at least one platform key and optionally a fallback
    return platformKeys.isNotEmpty;
  }

  /// Executes platform-specific code block from node
  /// 
  /// Handles nodes that have platform-specific implementations
  dynamic _executePlatformCode(Map<String, dynamic> platformCode) {
    try {
      return _platformManager.executePlatformCode(platformCode);
    } catch (e, stackTrace) {
      developer.log(
        'Error executing platform code: $e',
        name: 'SchemaInterpreter',
        error: e,
        stackTrace: stackTrace,
      );
      return null;
    }
  }

  /// Gets platform-specific asset path
  String? _getPlatformAsset(Map<String, dynamic> assetConfig) {
    return _platformManager.getPlatformAsset(assetConfig);
  }

  /// Logs platform warning
  void _logPlatformWarning(String message) {
    developer.log(
      'Platform warning: $message',
      name: 'SchemaInterpreter.Platform',
      level: 900,
    );
  }



  /// Applies a delta update to the current schema
  /// 
  /// Supports both JSON Patch (RFC 6902) and JSON Merge Patch (RFC 7396) formats.
  /// Returns the updated widget tree, or null if no current schema exists.
  /// 
  /// JSON Patch format: Array of operations with op, path, and value fields
  /// JSON Merge Patch format: Object with partial schema updates
  Widget? applyDelta(Map<String, dynamic> delta) {
    if (_currentSchema == null) {
      developer.log(
        'Cannot apply delta: no current schema',
        name: 'SchemaInterpreter',
      );
      return null;
    }

    try {
      developer.log('Applying delta update', name: 'SchemaInterpreter');
      
      // Detect delta format
      if (delta.containsKey('operations') && delta['operations'] is List) {
        // JSON Patch format
        _applyJsonPatch(delta['operations'] as List<dynamic>);
      } else {
        // JSON Merge Patch format
        _applyJsonMergePatch(delta);
      }

      // Rebuild widget tree from updated schema
      return interpretSchema(_currentSchema!);
    } catch (e, stackTrace) {
      developer.log(
        'Error applying delta: $e',
        name: 'SchemaInterpreter',
        error: e,
        stackTrace: stackTrace,
      );
      return ErrorOverlay(
        title: 'Delta Application Error',
        message: e.toString(),
        stackTrace: stackTrace.toString(),
        onRetry: null,
        onDismiss: null,
      );
    }
  }

  /// Applies JSON Patch operations (RFC 6902)
  void _applyJsonPatch(List<dynamic> operations) {
    // Validate operations
    if (!JsonPatchUtils.isValidPatch(operations)) {
      developer.log(
        'Invalid JSON Patch: validation failed',
        name: 'SchemaInterpreter',
        level: 900,
      );
      return;
    }

    // Optimize operations before applying
    final validOps = operations.whereType<Map<String, dynamic>>().toList();
    final optimizedOps = JsonPatchUtils.optimizeOperations(validOps);

    developer.log(
      'Applying ${optimizedOps.length} optimized patch operations (from ${operations.length} original)',
      name: 'SchemaInterpreter',
    );

    for (final operation in optimizedOps) {
      final op = operation['op'] as String;
      final path = operation['path'] as String;

      developer.log(
        'Applying patch operation: $op at $path',
        name: 'SchemaInterpreter',
      );

      switch (op) {
        case 'add':
          _patchAdd(path, operation['value']);
          break;
        case 'remove':
          _patchRemove(path);
          break;
        case 'replace':
          _patchReplace(path, operation['value']);
          break;
        case 'move':
          _patchMove(path, operation['from'] as String?);
          break;
        case 'copy':
          _patchCopy(path, operation['from'] as String?);
          break;
        case 'test':
          _patchTest(path, operation['value']);
          break;
        default:
          developer.log(
            'Unknown patch operation: $op',
            name: 'SchemaInterpreter',
          );
      }
    }
  }

  /// Applies JSON Merge Patch (RFC 7396)
  void _applyJsonMergePatch(Map<String, dynamic> patch) {
    _currentSchema = _mergePatch(_currentSchema!, patch);
  }

  /// Recursively merges patch into target
  Map<String, dynamic> _mergePatch(
    Map<String, dynamic> target,
    Map<String, dynamic> patch,
  ) {
    final result = Map<String, dynamic>.from(target);

    for (final key in patch.keys) {
      final patchValue = patch[key];

      if (patchValue == null) {
        // null means remove the key
        result.remove(key);
      } else if (patchValue is Map<String, dynamic> &&
          result[key] is Map<String, dynamic>) {
        // Recursively merge nested objects
        result[key] = _mergePatch(
          result[key] as Map<String, dynamic>,
          patchValue,
        );
      } else {
        // Replace value
        result[key] = patchValue;
      }
    }

    return result;
  }

  /// Resolves a JSON Pointer path to a value in the schema
  dynamic _resolvePath(String path) {
    if (path == '') {
      return _currentSchema;
    }

    final parts = path.split('/').skip(1); // Skip empty first element
    dynamic current = _currentSchema;

    for (final part in parts) {
      final unescaped = _unescapeJsonPointer(part);

      if (current is Map<String, dynamic>) {
        current = current[unescaped];
      } else if (current is List) {
        final index = int.tryParse(unescaped);
        if (index != null && index >= 0 && index < current.length) {
          current = current[index];
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    return current;
  }

  /// Sets a value at the specified JSON Pointer path
  void _setPath(String path, dynamic value) {
    if (path == '') {
      if (value is Map<String, dynamic>) {
        _currentSchema = value;
      }
      return;
    }

    final parts = path.split('/').skip(1).toList();
    final lastPart = _unescapeJsonPointer(parts.removeLast());
    
    dynamic current = _currentSchema;
    
    for (final part in parts) {
      final unescaped = _unescapeJsonPointer(part);
      
      if (current is Map<String, dynamic>) {
        if (!current.containsKey(unescaped)) {
          current[unescaped] = <String, dynamic>{};
        }
        current = current[unescaped];
      } else if (current is List) {
        final index = int.tryParse(unescaped);
        if (index != null && index >= 0 && index < current.length) {
          current = current[index];
        }
      }
    }

    if (current is Map<String, dynamic>) {
      current[lastPart] = value;
    } else if (current is List) {
      final index = int.tryParse(lastPart);
      if (index != null) {
        if (index == current.length) {
          current.add(value);
        } else if (index >= 0 && index < current.length) {
          current[index] = value;
        }
      }
    }
  }

  /// Removes a value at the specified JSON Pointer path
  void _removePath(String path) {
    if (path == '') {
      return;
    }

    final parts = path.split('/').skip(1).toList();
    final lastPart = _unescapeJsonPointer(parts.removeLast());
    
    dynamic current = _currentSchema;
    
    for (final part in parts) {
      final unescaped = _unescapeJsonPointer(part);
      
      if (current is Map<String, dynamic>) {
        current = current[unescaped];
      } else if (current is List) {
        final index = int.tryParse(unescaped);
        if (index != null && index >= 0 && index < current.length) {
          current = current[index];
        }
      }
      
      if (current == null) {
        return;
      }
    }

    if (current is Map<String, dynamic>) {
      current.remove(lastPart);
    } else if (current is List) {
      final index = int.tryParse(lastPart);
      if (index != null && index >= 0 && index < current.length) {
        current.removeAt(index);
      }
    }
  }

  /// Unescapes JSON Pointer tokens
  String _unescapeJsonPointer(String token) {
    return token.replaceAll('~1', '/').replaceAll('~0', '~');
  }

  /// JSON Patch: add operation
  void _patchAdd(String path, dynamic value) {
    _setPath(path, value);
  }

  /// JSON Patch: remove operation
  void _patchRemove(String path) {
    _removePath(path);
  }

  /// JSON Patch: replace operation
  void _patchReplace(String path, dynamic value) {
    _removePath(path);
    _setPath(path, value);
  }

  /// JSON Patch: move operation
  void _patchMove(String path, String? from) {
    if (from == null) {
      developer.log(
        'Move operation missing from path',
        name: 'SchemaInterpreter',
      );
      return;
    }

    final value = _resolvePath(from);
    _removePath(from);
    _setPath(path, value);
  }

  /// JSON Patch: copy operation
  void _patchCopy(String path, String? from) {
    if (from == null) {
      developer.log(
        'Copy operation missing from path',
        name: 'SchemaInterpreter',
      );
      return;
    }

    final value = _resolvePath(from);
    _setPath(path, value);
  }

  /// JSON Patch: test operation
  void _patchTest(String path, dynamic value) {
    final current = _resolvePath(path);
    if (current != value) {
      throw Exception('Test operation failed at $path');
    }
  }

  // ============================================================================
  // Navigation Support
  // ============================================================================

  /// Checks if a string is a navigation action
  bool _isNavigationAction(String action) {
    return action.startsWith('navigate:') ||
           action.startsWith('goBack') ||
           action.startsWith('replace:') ||
           action.startsWith('popToRoot');
  }

  /// Handles navigation actions
  void _handleNavigationAction(String action) {
    if (navigationManager == null) {
      developer.log(
        'Navigation action ignored: no navigation manager',
        name: 'SchemaInterpreter',
        level: 900,
      );
      return;
    }

    if (action.startsWith('navigate:')) {
      // Format: navigate:routeName or navigate:routeName?param1=value1&param2=value2
      final parts = action.substring(9).split('?');
      final routeName = parts[0];
      Map<String, dynamic>? params;
      
      if (parts.length > 1) {
        params = _parseQueryParams(parts[1]);
      }
      
      _navigateTo(routeName, params: params);
    } else if (action == 'goBack') {
      navigationManager!.pop();
    } else if (action.startsWith('replace:')) {
      // Format: replace:routeName or replace:routeName?param1=value1&param2=value2
      final parts = action.substring(8).split('?');
      final routeName = parts[0];
      Map<String, dynamic>? params;
      
      if (parts.length > 1) {
        params = _parseQueryParams(parts[1]);
      }
      
      navigationManager!.replace(routeName, params: params);
    } else if (action == 'popToRoot') {
      navigationManager!.popToRoot();
    }
  }

  /// Navigates to a route
  void _navigateTo(String routeName, {Map<String, dynamic>? params}) {
    if (navigationManager == null) {
      developer.log(
        'Cannot navigate: no navigation manager',
        name: 'SchemaInterpreter',
        level: 900,
      );
      return;
    }

    navigationManager!.push(routeName, params: params);
  }

  /// Parses query parameters from a query string
  Map<String, dynamic> _parseQueryParams(String queryString) {
    final params = <String, dynamic>{};
    
    for (final pair in queryString.split('&')) {
      final parts = pair.split('=');
      if (parts.length == 2) {
        final key = Uri.decodeComponent(parts[0]);
        final value = Uri.decodeComponent(parts[1]);
        
        // Try to parse as number or boolean
        if (value == 'true') {
          params[key] = true;
        } else if (value == 'false') {
          params[key] = false;
        } else {
          final numValue = num.tryParse(value);
          params[key] = numValue ?? value;
        }
      }
    }
    
    return params;
  }

  /// Gets the current route name from navigation manager
  String? getCurrentRoute() {
    return navigationManager?.currentRoute;
  }

  /// Gets the current route parameters from navigation manager
  Map<String, dynamic> getCurrentRouteParams() {
    return navigationManager?.currentParams ?? {};
  }

  /// Checks if can navigate back
  bool canNavigateBack() {
    return navigationManager?.canPop ?? false;
  }

  // ============================================================================
  // Platform Support
  // ============================================================================

  /// Gets current platform type
  String getCurrentPlatform() {
    return PlatformManager.getCurrentPlatform();
  }

  /// Checks if current platform matches specified platform
  bool isPlatform(String platform) {
    return PlatformManager.isPlatform(platform);
  }

  /// Gets platform capabilities
  Map<String, dynamic> getPlatformCapabilities() {
    return _platformManager.getPlatformCapabilities();
  }

  /// Validates platform code block
  bool validatePlatformCode(Map<String, dynamic> platformCode) {
    return _platformManager.validatePlatformCode(platformCode);
  }
}

/// Performance metric data class
class PerformanceMetric {
  final int timestamp;
  final int totalDurationMs;
  final int parsingDurationMs;
  final int? widgetBuildDurationMs;

  PerformanceMetric({
    required this.timestamp,
    required this.totalDurationMs,
    required this.parsingDurationMs,
    this.widgetBuildDurationMs,
  });

  double get totalDurationSeconds => totalDurationMs / 1000.0;
  double get parsingDurationSeconds => parsingDurationMs / 1000.0;
  double? get widgetBuildDurationSeconds => 
      widgetBuildDurationMs != null ? widgetBuildDurationMs! / 1000.0 : null;

  @override
  String toString() {
    return 'PerformanceMetric(total: ${totalDurationSeconds.toStringAsFixed(3)}s, '
        'parsing: ${parsingDurationSeconds.toStringAsFixed(3)}s, '
        'widgetBuild: ${widgetBuildDurationSeconds?.toStringAsFixed(3) ?? 'N/A'}s)';
  }
}
