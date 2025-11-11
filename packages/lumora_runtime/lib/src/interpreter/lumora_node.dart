/// Represents a node in the Lumora IR tree
class LumoraNode {
  const LumoraNode({
    required this.id,
    required this.type,
    this.props = const {},
    this.children = const [],
    this.sourceLine,
    this.metadata,
  });

  /// Create a LumoraNode from JSON
  factory LumoraNode.fromJson(Map<String, dynamic> json) {
    return LumoraNode(
      id: json['id'] as String,
      type: json['type'] as String,
      props: Map<String, dynamic>.from(json['props'] ?? {}),
      children: (json['children'] as List<dynamic>?)
              ?.map((child) => LumoraNode.fromJson(child as Map<String, dynamic>))
              .toList() ??
          [],
      sourceLine: json['sourceLine'] as int?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  /// Unique identifier for this node
  final String id;

  /// Widget type (e.g., 'View', 'Text', 'Button')
  final String type;

  /// Properties/props for this widget
  final Map<String, dynamic> props;

  /// Child nodes
  final List<LumoraNode> children;

  /// Source location metadata
  final int? sourceLine;

  /// Additional metadata
  final Map<String, dynamic>? metadata;

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'props': props,
      'children': children.map((child) => child.toJson()).toList(),
      if (sourceLine != null) 'sourceLine': sourceLine,
      if (metadata != null) 'metadata': metadata,
    };
  }

  @override
  String toString() => 'LumoraNode(id: $id, type: $type)';
}
