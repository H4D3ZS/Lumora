import 'dart:developer' as developer;

/// Manages render context variables for template resolution
/// 
/// Supports nested context scopes for component hierarchy, allowing
/// child components to inherit and override parent context variables.
class RenderContext {
  final Map<String, dynamic> _variables = {};
  final RenderContext? _parent;

  /// Creates a new RenderContext
  /// 
  /// Parameters:
  /// - parent: Optional parent context for nested scopes
  RenderContext({RenderContext? parent}) : _parent = parent;

  /// Sets a variable in the current context
  void set(String name, dynamic value) {
    _variables[name] = value;
  }

  /// Sets multiple variables at once
  void setAll(Map<String, dynamic> variables) {
    _variables.addAll(variables);
  }

  /// Gets a variable from the current context or parent contexts
  /// 
  /// Returns null if the variable is not found in any context.
  dynamic get(String name) {
    if (_variables.containsKey(name)) {
      return _variables[name];
    }
    
    // Look up in parent context if available
    if (_parent != null) {
      return _parent!.get(name);
    }
    
    return null;
  }

  /// Checks if a variable exists in the current context or parent contexts
  bool has(String name) {
    if (_variables.containsKey(name)) {
      return true;
    }
    
    if (_parent != null) {
      return _parent!.has(name);
    }
    
    return false;
  }

  /// Creates a child context that inherits from this context
  RenderContext createChild() {
    return RenderContext(parent: this);
  }

  /// Clears all variables in the current context (does not affect parent)
  void clear() {
    _variables.clear();
  }

  /// Gets all variables in the current context (does not include parent variables)
  Map<String, dynamic> getAll() {
    return Map<String, dynamic>.from(_variables);
  }
}

/// Template engine for resolving placeholders in strings
/// 
/// Detects strings containing {{ and }} delimiters and replaces them
/// with values from the render context.
class TemplateEngine {
  static final RegExp _placeholderPattern = RegExp(r'\{\{([^}]+)\}\}');

  /// Resolves template placeholders in a string value
  /// 
  /// Parameters:
  /// - value: The string value that may contain placeholders
  /// - context: The RenderContext to look up variable values
  /// 
  /// Returns the string with all placeholders replaced with their values.
  /// If a variable is not found, an empty string is used by default.
  /// 
  /// Example:
  /// ```dart
  /// final context = RenderContext();
  /// context.set('name', 'John');
  /// final result = TemplateEngine.resolve('Hello {{name}}!', context);
  /// // result: 'Hello John!'
  /// ```
  static String resolve(String value, RenderContext context) {
    if (!value.contains('{{')) {
      // Fast path: no placeholders
      return value;
    }

    return value.replaceAllMapped(_placeholderPattern, (match) {
      final variableName = match.group(1)?.trim();
      
      if (variableName == null || variableName.isEmpty) {
        developer.log(
          'Empty placeholder found in template',
          name: 'TemplateEngine',
        );
        return '';
      }

      // Look up variable in context
      final variableValue = context.get(variableName);
      
      if (variableValue == null) {
        developer.log(
          'Variable not found in context: $variableName',
          name: 'TemplateEngine',
        );
        return ''; // Use empty string as default
      }

      // Convert value to string
      return variableValue.toString();
    });
  }

  /// Resolves template placeholders in any value (recursive)
  /// 
  /// This method handles strings, maps, lists, and other types:
  /// - Strings: Resolves placeholders
  /// - Maps: Recursively resolves all values
  /// - Lists: Recursively resolves all elements
  /// - Other types: Returns as-is
  /// 
  /// Parameters:
  /// - value: The value to resolve (can be any type)
  /// - context: The RenderContext to look up variable values
  /// 
  /// Returns the value with all nested placeholders resolved.
  static dynamic resolveValue(dynamic value, RenderContext context) {
    if (value is String) {
      return resolve(value, context);
    } else if (value is Map) {
      // Convert any Map to Map<String, dynamic> before resolving
      return resolveMap(Map<String, dynamic>.from(value), context);
    } else if (value is List) {
      return resolveList(value, context);
    } else {
      // Return other types as-is (numbers, booleans, null, etc.)
      return value;
    }
  }

  /// Resolves template placeholders in a map (recursive)
  /// 
  /// Creates a new map with all string values resolved.
  static Map<String, dynamic> resolveMap(
    Map<String, dynamic> map,
    RenderContext context,
  ) {
    final result = <String, dynamic>{};
    
    for (final entry in map.entries) {
      final value = entry.value;
      if (value is Map) {
        // Ensure nested maps are properly typed
        result[entry.key] = resolveMap(
          Map<String, dynamic>.from(value),
          context,
        );
      } else {
        result[entry.key] = resolveValue(value, context);
      }
    }
    
    return result;
  }

  /// Resolves template placeholders in a list (recursive)
  /// 
  /// Creates a new list with all elements resolved.
  static List<dynamic> resolveList(
    List<dynamic> list,
    RenderContext context,
  ) {
    return list.map((item) => resolveValue(item, context)).toList();
  }

  /// Checks if a string contains template placeholders
  static bool hasPlaceholders(String value) {
    return _placeholderPattern.hasMatch(value);
  }

  /// Extracts all placeholder variable names from a string
  /// 
  /// Returns a list of variable names found in the template.
  /// 
  /// Example:
  /// ```dart
  /// final names = TemplateEngine.extractVariableNames('Hello {{name}}, you have {{count}} messages');
  /// // names: ['name', 'count']
  /// ```
  static List<String> extractVariableNames(String value) {
    final matches = _placeholderPattern.allMatches(value);
    return matches
        .map((match) => match.group(1)?.trim())
        .where((name) => name != null && name.isNotEmpty)
        .cast<String>()
        .toList();
  }
}
