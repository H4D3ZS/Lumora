/// Defines a state variable
class StateVariable {
  const StateVariable({
    required this.name,
    required this.type,
    required this.initialValue,
    this.mutable = true,
  });

  factory StateVariable.fromJson(Map<String, dynamic> json) {
    return StateVariable(
      name: json['name'] as String,
      type: json['type'] as String,
      initialValue: json['initialValue'],
      mutable: json['mutable'] as bool? ?? true,
    );
  }

  /// Variable name
  final String name;

  /// Variable type
  final String type;

  /// Initial value
  final dynamic initialValue;

  /// Whether the variable is mutable
  final bool mutable;

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type,
      'initialValue': initialValue,
      'mutable': mutable,
    };
  }
}

/// Defines state for a component
class StateDefinition {
  const StateDefinition({
    required this.type,
    required this.variables,
  });

  factory StateDefinition.fromJson(Map<String, dynamic> json) {
    return StateDefinition(
      type: json['type'] as String,
      variables: (json['variables'] as List<dynamic>?)
              ?.map((v) => StateVariable.fromJson(v as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  /// State type (local, global, etc.)
  final String type;

  /// State variables
  final List<StateVariable> variables;

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'variables': variables.map((v) => v.toJson()).toList(),
    };
  }
}
