/// Defines an event handler
class EventDefinition {
  const EventDefinition({
    required this.name,
    required this.handler,
    this.parameters,
  });

  factory EventDefinition.fromJson(Map<String, dynamic> json) {
    return EventDefinition(
      name: json['name'] as String,
      handler: json['handler'] as String,
      parameters: json['parameters'] as Map<String, dynamic>?,
    );
  }

  /// Event name (e.g., 'onClick', 'onChange')
  final String name;

  /// Handler function code or identifier
  final String handler;

  /// Event parameters
  final Map<String, dynamic>? parameters;

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'handler': handler,
      if (parameters != null) 'parameters': parameters,
    };
  }
}
