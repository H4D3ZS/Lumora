import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:lumora_runtime/src/interpreter/lumora_node.dart';
import 'package:lumora_runtime/src/registry/widget_registry.dart';
import 'package:lumora_runtime/src/state/state_manager.dart';
import 'package:lumora_runtime/src/state/state_definition.dart';
import 'package:lumora_runtime/src/events/event_bridge.dart';
import 'package:lumora_runtime/src/events/event_definition.dart';
import 'package:lumora_runtime/src/utils/key_generator.dart';

/// Interprets Lumora IR schemas and builds Flutter widget trees
class LumoraInterpreter {
  LumoraInterpreter({
    WidgetRegistry? registry,
    StateManager? stateManager,
    EventBridge? eventBridge,
    KeyGenerator? keyGenerator,
  })  : _registry = registry ?? WidgetRegistry(),
        _stateManager = stateManager ?? StateManager(),
        _eventBridge = eventBridge ?? EventBridge(),
        _keyGenerator = keyGenerator ?? KeyGenerator();

  final WidgetRegistry _registry;
  final StateManager _stateManager;
  final EventBridge _eventBridge;
  final KeyGenerator _keyGenerator;
  
  bool _stateInitialized = false;
  bool _eventsInitialized = false;

  /// Build a widget tree from a Lumora IR schema
  /// 
  /// This is the main entry point for interpreting a schema.
  /// Handles full schema objects with metadata and root nodes.
  /// Initializes state and events from the schema if present.
  Widget buildFromSchema(Map<String, dynamic> schema, {bool preserveState = false}) {
    try {
      // Initialize state from schema if present
      if (schema.containsKey('state')) {
        _initializeStateFromSchema(schema['state'] as Map<String, dynamic>, preserveState: preserveState);
      }
      
      // Initialize events from schema if present
      if (schema.containsKey('events')) {
        _initializeEventsFromSchema(schema['events']);
      }
      
      // Handle both single node and full schema formats
      if (schema.containsKey('nodes') && schema['nodes'] is List) {
        // Full schema format with multiple root nodes
        final nodes = (schema['nodes'] as List)
            .map((n) => LumoraNode.fromJson(n as Map<String, dynamic>))
            .toList();
        
        if (nodes.isEmpty) {
          return _buildEmptyWidget();
        }
        
        if (nodes.length == 1) {
          return _buildStatefulWidget(nodes[0]);
        }
        
        // Multiple root nodes - wrap in Column
        return _buildStatefulWidget(
          LumoraNode(
            id: 'root',
            type: 'Column',
            props: {},
            children: nodes,
          ),
        );
      }
      
      // Single node format
      final node = LumoraNode.fromJson(schema);
      return _buildStatefulWidget(node);
    } catch (e, stackTrace) {
      return _buildErrorWidget(e, stackTrace);
    }
  }
  
  /// Build a stateful widget that listens to state changes
  ///
  /// Wraps the widget tree in a ListenableBuilder that rebuilds
  /// when state changes occur.
  Widget _buildStatefulWidget(LumoraNode node) {
    return ListenableBuilder(
      listenable: _stateManager,
      builder: (context, child) {
        return buildWidget(node);
      },
    );
  }
  
  /// Initialize state from schema definition
  ///
  /// Handles both local and global state initialization.
  /// If preserveState is true, merges with existing state instead of replacing.
  void _initializeStateFromSchema(Map<String, dynamic> stateSchema, {bool preserveState = false}) {
    try {
      // Preserve current state if requested (for hot reload)
      if (preserveState && _stateInitialized) {
        _stateManager.preserveState();
      }
      
      // Handle global state
      if (stateSchema.containsKey('global')) {
        final globalState = stateSchema['global'] as Map<String, dynamic>;
        final initialValues = _extractInitialValues(globalState);
        
        if (preserveState && _stateInitialized) {
          _stateManager.mergePreservedState(initialValues, global: true);
        } else {
          _stateManager.initializeState(initialValues, global: true);
        }
      }
      
      // Handle local state
      if (stateSchema.containsKey('local')) {
        final localState = stateSchema['local'] as Map<String, dynamic>;
        final initialValues = _extractInitialValues(localState);
        
        if (preserveState && _stateInitialized) {
          _stateManager.mergePreservedState(initialValues, global: false);
        } else {
          _stateManager.initializeState(initialValues, global: false);
        }
      }
      
      // Handle state definition format
      if (stateSchema.containsKey('variables')) {
        final stateDef = StateDefinition.fromJson(stateSchema);
        final initialValues = <String, dynamic>{};
        
        for (final variable in stateDef.variables) {
          initialValues[variable.name] = variable.initialValue;
        }
        
        final isGlobal = stateDef.type == 'global';
        
        if (preserveState && _stateInitialized) {
          _stateManager.mergePreservedState(initialValues, global: isGlobal);
        } else {
          _stateManager.initializeState(initialValues, global: isGlobal);
        }
      }
      
      _stateInitialized = true;
    } catch (e, stackTrace) {
      debugPrint('Error initializing state: $e');
      debugPrint(stackTrace.toString());
    }
  }
  
  /// Extract initial values from state definition
  Map<String, dynamic> _extractInitialValues(Map<String, dynamic> stateMap) {
    final values = <String, dynamic>{};
    
    // Handle variables array format
    if (stateMap.containsKey('variables') && stateMap['variables'] is List) {
      final variables = stateMap['variables'] as List;
      for (final variable in variables) {
        if (variable is Map<String, dynamic>) {
          final name = variable['name'] as String?;
          final initialValue = variable['initialValue'];
          if (name != null) {
            values[name] = initialValue;
          }
        }
      }
    } else {
      // Handle direct key-value format
      values.addAll(stateMap);
    }
    
    return values;
  }
  
  /// Initialize events from schema definition
  ///
  /// Registers event handlers from the schema's event definitions.
  /// Supports both inline handlers and references to handler functions.
  void _initializeEventsFromSchema(dynamic eventsSchema) {
    try {
      if (eventsSchema is List) {
        // Array of event definitions
        for (final eventJson in eventsSchema) {
          if (eventJson is Map<String, dynamic>) {
            _registerEventFromDefinition(eventJson);
          }
        }
      } else if (eventsSchema is Map<String, dynamic>) {
        // Map of event definitions
        eventsSchema.forEach((key, value) {
          if (value is Map<String, dynamic>) {
            _registerEventFromDefinition({
              'name': key,
              ...value,
            });
          }
        });
      }
      
      _eventsInitialized = true;
    } catch (e, stackTrace) {
      debugPrint('Error initializing events: $e');
      debugPrint(stackTrace.toString());
    }
  }
  
  /// Register an event handler from a definition
  ///
  /// Converts event definitions to actual handler functions that
  /// can update state, trigger side effects, or communicate with
  /// the dev server.
  void _registerEventFromDefinition(Map<String, dynamic> eventDef) {
    try {
      final eventDefinition = EventDefinition.fromJson(eventDef);
      final eventId = eventDefinition.name;
      final handler = eventDefinition.handler;
      
      // Check if handler is async (contains 'async' or 'await' keywords)
      final isAsync = handler.contains('async') || handler.contains('await');
      
      if (isAsync) {
        // Register async handler
        _eventBridge.registerAsyncHandler(eventId, (data) async {
          await _executeEventHandler(handler, data, eventDefinition.parameters);
        });
      } else {
        // Register sync handler
        _eventBridge.registerHandler(eventId, (data) {
          _executeEventHandler(handler, data, eventDefinition.parameters);
        });
      }
      
      debugPrint('LumoraInterpreter: Registered event handler "$eventId"');
    } catch (e, stackTrace) {
      debugPrint('Error registering event: $e');
      debugPrint(stackTrace.toString());
    }
  }
  
  /// Execute an event handler
  ///
  /// Interprets the handler code and executes it in the context of
  /// the current state. Supports common patterns like state updates,
  /// navigation, and API calls.
  Future<void> _executeEventHandler(
    String handler,
    Map<String, dynamic>? data,
    Map<String, dynamic>? parameters,
  ) async {
    try {
      // Merge parameters and event data
      final context = <String, dynamic>{
        ...?parameters,
        ...?data,
      };
      
      // Parse and execute handler code
      // This is a simplified implementation that handles common patterns
      
      // Pattern 1: setState calls - e.g., "setState('counter', $counter + 1)"
      final setStatePattern = RegExp(r'''setState\s*\(\s*['"](\w+)['"]\s*,\s*(.+?)\s*\)''');
      final setStateMatch = setStatePattern.firstMatch(handler);
      if (setStateMatch != null) {
        final stateName = setStateMatch.group(1)!;
        final expression = setStateMatch.group(2)!;
        final value = _evaluateExpression(expression, context);
        _stateManager.setValue(stateName, value);
        return;
      }
      
      // Pattern 2: Direct state updates - e.g., "$counter = $counter + 1"
      final assignPattern = RegExp(r'\$(\w+)\s*=\s*(.+)');
      final assignMatch = assignPattern.firstMatch(handler);
      if (assignMatch != null) {
        final stateName = assignMatch.group(1)!;
        final expression = assignMatch.group(2)!;
        final value = _evaluateExpression(expression, context);
        _stateManager.setValue(stateName, value);
        return;
      }
      
      // Pattern 3: Multiple statements separated by semicolons
      if (handler.contains(';')) {
        final statements = handler.split(';').map((s) => s.trim()).where((s) => s.isNotEmpty);
        for (final statement in statements) {
          await _executeEventHandler(statement, data, parameters);
        }
        return;
      }
      
      // If no pattern matches, log a warning
      debugPrint('LumoraInterpreter: Unhandled event handler pattern: $handler');
    } catch (e, stackTrace) {
      debugPrint('Error executing event handler: $e');
      debugPrint(stackTrace.toString());
    }
  }
  
  /// Evaluate an expression in the context of current state
  ///
  /// Supports basic arithmetic, string operations, and state references.
  dynamic _evaluateExpression(String expression, Map<String, dynamic> context) {
    try {
      // Replace state references with actual values
      var evaluated = expression;
      
      // Replace $variableName with actual values
      final stateRefPattern = RegExp(r'\$(\w+)');
      evaluated = evaluated.replaceAllMapped(stateRefPattern, (match) {
        final varName = match.group(1)!;
        final value = _stateManager.getValue(varName);
        
        // Handle different value types
        if (value is String) {
          return "'$value'";
        } else if (value is num || value is bool) {
          return value.toString();
        } else if (value == null) {
          return 'null';
        }
        return value.toString();
      });
      
      // Replace context variables
      context.forEach((key, value) {
        if (evaluated.contains(key)) {
          if (value is String) {
            evaluated = evaluated.replaceAll(key, "'$value'");
          } else {
            evaluated = evaluated.replaceAll(key, value.toString());
          }
        }
      });
      
      // Try to evaluate simple expressions
      // This is a very basic evaluator - a full implementation would use
      // a proper expression parser
      
      // Handle simple arithmetic
      if (RegExp(r'^[\d\s+\-*/().]+$').hasMatch(evaluated)) {
        // This is unsafe in production - just for demo purposes
        // In a real implementation, use a proper expression evaluator
        debugPrint('LumoraInterpreter: Evaluating arithmetic: $evaluated');
        // For now, return the expression as-is
        // A proper implementation would parse and evaluate it safely
      }
      
      // Handle string concatenation
      if (evaluated.contains('+') && evaluated.contains("'")) {
        // Simple string concatenation
        final parts = evaluated.split('+').map((p) => p.trim()).toList();
        final result = parts.map((p) {
          if (p.startsWith("'") && p.endsWith("'")) {
            return p.substring(1, p.length - 1);
          }
          return p;
        }).join();
        return result;
      }
      
      // Handle boolean values
      if (evaluated == 'true') return true;
      if (evaluated == 'false') return false;
      if (evaluated == 'null') return null;
      
      // Handle numeric values
      final numValue = num.tryParse(evaluated);
      if (numValue != null) return numValue;
      
      // Handle string literals
      if (evaluated.startsWith("'") && evaluated.endsWith("'")) {
        return evaluated.substring(1, evaluated.length - 1);
      }
      
      // Return as-is if we can't evaluate
      return evaluated;
    } catch (e) {
      debugPrint('Error evaluating expression "$expression": $e');
      return expression;
    }
  }

  /// Build a widget from a LumoraNode
  /// 
  /// Recursively builds the widget tree, resolving props and handling
  /// node type resolution with fallback support.
  Widget buildWidget(LumoraNode node) {
    try {
      // Resolve the node type (handle aliases, case variations)
      final resolvedType = _resolveNodeType(node.type);
      
      // Get the widget builder for this node type
      final builder = _registry.getBuilder(resolvedType);
      
      if (builder == null) {
        return _buildFallbackWidget(node);
      }

      // Resolve props (state references, event handlers, computed values)
      final resolvedProps = _resolveProps(node.props);

      // Build child widgets recursively
      final childWidgets = node.children.map(buildWidget).toList();

      // Generate stable key for this widget
      final key = _keyGenerator.generateKey(node.id);

      // Build the widget
      return builder(
        props: resolvedProps,
        children: childWidgets,
        key: key,
      );
    } catch (e, stackTrace) {
      return _buildErrorWidget(e, stackTrace, node: node);
    }
  }
  
  /// Resolve node type to handle aliases and variations
  /// 
  /// Maps common React component names to Flutter equivalents
  /// and handles case variations.
  String _resolveNodeType(String type) {
    // Common React to Flutter mappings
    const typeAliases = {
      'div': 'View',
      'span': 'View',
      'p': 'Text',
      'h1': 'Text',
      'h2': 'Text',
      'h3': 'Text',
      'h4': 'Text',
      'h5': 'Text',
      'h6': 'Text',
      'button': 'Button',
      'img': 'Image',
      'input': 'TextInput',
      'textarea': 'TextInput',
    };
    
    final lowerType = type.toLowerCase();
    return typeAliases[lowerType] ?? type;
  }

  /// Resolve props by replacing state references, event handlers, and computed values
  /// 
  /// Handles:
  /// - State references: $variableName
  /// - Event handlers: {__event: 'eventId', parameters: {...}}
  /// - Computed values: {__computed: 'expression'}
  /// - Nested objects and arrays
  /// - Type conversions
  Map<String, dynamic> _resolveProps(Map<String, dynamic> props) {
    final resolved = <String, dynamic>{};

    for (final entry in props.entries) {
      final key = entry.key;
      final value = entry.value;

      resolved[key] = _resolveValue(value);
    }

    return resolved;
  }
  
  /// Resolve a single value (recursive for nested structures)
  dynamic _resolveValue(dynamic value) {
    // Resolve state references ($variableName)
    if (value is String && value.startsWith(r'$')) {
      final stateName = value.substring(1);
      return _stateManager.getValue(stateName);
    }
    
    // Resolve event handlers
    if (value is Map && value.containsKey('__event')) {
      final eventId = value['__event'] as String;
      final parameters = value['parameters'] as Map<String, dynamic>?;
      final isAsync = value['async'] == true;
      final withData = value['withData'] == true;
      
      // Create appropriate handler based on event type
      if (isAsync) {
        // Async event handler
        if (withData) {
          return _eventBridge.createAsyncHandlerWithData(eventId, parameters: parameters);
        }
        return _eventBridge.createAsyncHandler(eventId, parameters: parameters);
      } else {
        // Sync event handler
        if (withData) {
          return _eventBridge.createHandlerWithData(eventId, parameters: parameters);
        }
        return _eventBridge.createHandler(eventId, parameters: parameters);
      }
    }
    
    // Resolve computed values
    if (value is Map && value.containsKey('__computed')) {
      final expression = value['__computed'] as String;
      return _evaluateComputed(expression);
    }
    
    // Resolve nested maps recursively
    if (value is Map<String, dynamic>) {
      return _resolveProps(value);
    }
    
    // Resolve arrays recursively
    if (value is List) {
      return value.map(_resolveValue).toList();
    }
    
    // Handle type conversions
    return _convertType(value);
  }
  
  /// Evaluate computed expressions
  /// 
  /// Currently supports simple state references and basic operations.
  /// For complex expressions, this would need a proper expression evaluator.
  dynamic _evaluateComputed(String expression) {
    // Simple state reference: $variableName
    if (expression.startsWith(r'$')) {
      final stateName = expression.substring(1);
      return _stateManager.getValue(stateName);
    }
    
    // For now, return the expression as-is
    // In a full implementation, this would parse and evaluate the expression
    debugPrint('LumoraInterpreter: Computed expression not fully supported: $expression');
    return expression;
  }
  
  /// Convert values to appropriate types
  /// 
  /// Handles common type conversions needed for Flutter widgets.
  dynamic _convertType(dynamic value) {
    // Convert string numbers to actual numbers
    if (value is String) {
      // Try parsing as int
      final intValue = int.tryParse(value);
      if (intValue != null) return intValue;
      
      // Try parsing as double
      final doubleValue = double.tryParse(value);
      if (doubleValue != null) return doubleValue;
      
      // Try parsing as bool
      if (value.toLowerCase() == 'true') return true;
      if (value.toLowerCase() == 'false') return false;
    }
    
    return value;
  }

  /// Build a fallback widget for unknown types
  /// 
  /// Creates a visible warning widget that still renders children,
  /// allowing partial rendering of the tree even with unknown types.
  Widget _buildFallbackWidget(LumoraNode node) {
    // Log warning for debugging
    debugPrint('LumoraInterpreter: Unknown widget type "${node.type}" at node ${node.id}');
    
    // Build children even if parent type is unknown
    final childWidgets = node.children.map(buildWidget).toList();
    
    return Container(
      padding: const EdgeInsets.all(8.0),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFFF9800), width: 2),
        color: const Color(0xFFFFF3E0),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.warning_amber_rounded,
                color: Color(0xFFE65100),
                size: 16,
              ),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  'Unknown widget: ${node.type}',
                  style: const TextStyle(
                    color: Color(0xFFE65100),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          if (childWidgets.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...childWidgets,
          ],
        ],
      ),
    );
  }
  
  /// Build an empty widget placeholder
  Widget _buildEmptyWidget() {
    return const SizedBox.shrink();
  }

  /// Build an error widget
  Widget _buildErrorWidget(
    dynamic error,
    StackTrace stackTrace, {
    LumoraNode? node,
  }) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFD32F2F), width: 2),
        color: const Color(0xFFFFEBEE),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Error rendering widget${node != null ? ": ${node.type}" : ""}',
            style: const TextStyle(
              color: Color(0xFFD32F2F),
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error.toString(),
            style: const TextStyle(color: Color(0xFFD32F2F)),
          ),
        ],
      ),
    );
  }

  /// Connect event bridge to dev server
  ///
  /// Adds a listener that sends events to the dev server when they occur.
  /// This enables the dev server to track user interactions and respond
  /// with schema updates or other actions.
  void connectToDevServer(void Function(String eventId, Map<String, dynamic>? data) sendToServer) {
    _eventBridge.addListener((eventId, data) {
      try {
        sendToServer(eventId, data);
      } catch (e, stackTrace) {
        debugPrint('Error sending event to dev server: $e');
        debugPrint(stackTrace.toString());
      }
    });
  }
  
  /// Disconnect from dev server
  ///
  /// Removes all event listeners to prevent memory leaks when
  /// disconnecting from the dev server.
  void disconnectFromDevServer() {
    _eventBridge.clear();
  }
  
  /// Handle event response from dev server
  ///
  /// Processes responses from the dev server, such as state updates
  /// or schema changes triggered by user interactions.
  void handleEventResponse(Map<String, dynamic> response) {
    try {
      // Handle state updates from server
      if (response.containsKey('stateUpdates')) {
        final updates = response['stateUpdates'] as Map<String, dynamic>;
        updates.forEach((key, value) {
          _stateManager.setValue(key, value);
        });
      }
      
      // Handle schema updates from server
      if (response.containsKey('schemaUpdate')) {
        // This would trigger a rebuild with the new schema
        // Implementation depends on how the app handles schema updates
        debugPrint('LumoraInterpreter: Received schema update from server');
      }
      
      // Handle custom actions from server
      if (response.containsKey('action')) {
        final action = response['action'] as String;
        final payload = response['payload'] as Map<String, dynamic>?;
        _handleServerAction(action, payload);
      }
    } catch (e, stackTrace) {
      debugPrint('Error handling event response: $e');
      debugPrint(stackTrace.toString());
    }
  }
  
  /// Handle custom actions from dev server
  void _handleServerAction(String action, Map<String, dynamic>? payload) {
    switch (action) {
      case 'reload':
        debugPrint('LumoraInterpreter: Server requested reload');
        // Trigger app reload
        break;
      case 'clearState':
        debugPrint('LumoraInterpreter: Server requested state clear');
        _stateManager.clearAll();
        break;
      case 'updateState':
        if (payload != null) {
          payload.forEach((key, value) {
            _stateManager.setValue(key, value);
          });
        }
        break;
      default:
        debugPrint('LumoraInterpreter: Unknown server action: $action');
    }
  }

  /// Get the widget registry
  WidgetRegistry get registry => _registry;

  /// Get the state manager
  StateManager get stateManager => _stateManager;

  /// Get the event bridge
  EventBridge get eventBridge => _eventBridge;
}
