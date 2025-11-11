/// Lumora Runtime - Dynamic Flutter widget interpreter for Lumora IR schemas
///
/// This library provides runtime interpretation of Lumora IR schemas,
/// enabling instant preview of React/TSX code as Flutter widgets without
/// compilation. It includes:
///
/// - Schema interpretation and widget building
/// - Widget registry for extensible rendering
/// - State management integration
/// - Event bridge for user interactions
library lumora_runtime;

// Core interpreter
export 'src/interpreter/schema_interpreter.dart';
export 'src/interpreter/lumora_node.dart';

// Widget registry
export 'src/registry/widget_registry.dart';
export 'src/registry/widget_builder.dart';
export 'src/registry/core_widgets.dart';

// State management
export 'src/state/state_manager.dart';
export 'src/state/state_definition.dart';

// Event system
export 'src/events/event_bridge.dart';
export 'src/events/event_definition.dart';

// Utilities
export 'src/utils/prop_parser.dart';
export 'src/utils/key_generator.dart';
