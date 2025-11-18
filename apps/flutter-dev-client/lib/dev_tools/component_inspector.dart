import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'dart:ui' as ui;

/// Component Inspector - Expo Go-like element inspector
/// Tap any element to see its properties, state, and position
class ComponentInspector extends StatefulWidget {
  final Widget child;
  final bool enabled;
  final Map<String, dynamic>? currentSchema;

  const ComponentInspector({
    super.key,
    required this.child,
    required this.enabled,
    this.currentSchema,
  });

  @override
  State<ComponentInspector> createState() => _ComponentInspectorState();
}

class _ComponentInspectorState extends State<ComponentInspector> {
  Widget? _selectedWidget;
  Offset? _selectedPosition;
  Size? _selectedSize;
  Map<String, dynamic>? _selectedNodeData;
  final GlobalKey _childKey = GlobalKey();

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) {
      return widget.child;
    }

    return Stack(
      children: [
        // Original content with inspection overlay
        GestureDetector(
          key: _childKey,
          onTapDown: (details) {
            if (widget.enabled) {
              _handleTap(details.globalPosition);
            }
          },
          behavior: HitTestBehavior.translucent,
          child: widget.child,
        ),

        // Highlight overlay
        if (_selectedPosition != null && _selectedSize != null)
          Positioned(
            left: _selectedPosition!.dx,
            top: _selectedPosition!.dy,
            child: IgnorePointer(
              child: Container(
                width: _selectedSize!.width,
                height: _selectedSize!.height,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: Colors.blue,
                    width: 2,
                  ),
                  color: Colors.blue.withOpacity(0.1),
                ),
              ),
            ),
          ),

        // Inspector panel
        if (_selectedNodeData != null)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _buildInspectorPanel(),
          ),

        // Inspector mode indicator
        Positioned(
          top: MediaQuery.of(context).padding.top + 10,
          left: 0,
          right: 0,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.blue,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.touch_app, color: Colors.white, size: 16),
                  SizedBox(width: 8),
                  Text(
                    'Tap any element to inspect',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _handleTap(Offset globalPosition) {
    final RenderBox? renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox == null) return;

    // Find widget at position
    final result = BoxHitTestResult();
    renderBox.hitTest(result, position: globalPosition);

    // Extract information from hit test
    for (final entry in result.path) {
      final target = entry.target;
      if (target is RenderBox) {
        final transform = target.getTransformTo(null);
        final position = MatrixUtils.transformPoint(transform, Offset.zero);
        final size = target.size;

        setState(() {
          _selectedPosition = position;
          _selectedSize = size;
          _selectedNodeData = _extractWidgetInfo(target);
        });
        break;
      }
    }
  }

  Map<String, dynamic> _extractWidgetInfo(RenderBox renderBox) {
    final widget = _findWidgetForRenderObject(renderBox);

    return {
      'type': widget.runtimeType.toString(),
      'size': {
        'width': renderBox.size.width.toStringAsFixed(1),
        'height': renderBox.size.height.toStringAsFixed(1),
      },
      'position': {
        'x': _selectedPosition!.dx.toStringAsFixed(1),
        'y': _selectedPosition!.dy.toStringAsFixed(1),
      },
      'constraints': {
        'minWidth': renderBox.constraints.minWidth.toStringAsFixed(1),
        'maxWidth': renderBox.constraints.maxWidth == double.infinity
            ? 'infinity'
            : renderBox.constraints.maxWidth.toStringAsFixed(1),
        'minHeight': renderBox.constraints.minHeight.toStringAsFixed(1),
        'maxHeight': renderBox.constraints.maxHeight == double.infinity
            ? 'infinity'
            : renderBox.constraints.maxHeight.toStringAsFixed(1),
      },
      'properties': _extractWidgetProperties(widget),
    };
  }

  Widget _findWidgetForRenderObject(RenderObject renderObject) {
    // Try to find the widget element
    Widget? widget;
    void visitor(Element element) {
      if (element.renderObject == renderObject) {
        widget = element.widget;
      }
    }

    context.visitChildElements(visitor);
    return widget ?? Container();
  }

  Map<String, dynamic> _extractWidgetProperties(Widget widget) {
    final properties = <String, dynamic>{};

    if (widget is Text) {
      final textWidget = widget;
      properties['text'] = textWidget.data ?? '';
      if (textWidget.style != null) {
        properties['fontSize'] = textWidget.style!.fontSize?.toStringAsFixed(1) ?? 'default';
        properties['color'] = textWidget.style!.color?.toString() ?? 'default';
        properties['fontWeight'] = textWidget.style!.fontWeight?.toString() ?? 'default';
      }
    } else if (widget is Container) {
      final container = widget;
      if (container.color != null) {
        properties['backgroundColor'] = container.color.toString();
      }
      if (container.padding != null) {
        properties['padding'] = container.padding.toString();
      }
      if (container.margin != null) {
        properties['margin'] = container.margin.toString();
      }
    } else if (widget is Padding) {
      properties['padding'] = widget.padding.toString();
    } else if (widget is Center) {
      properties['alignment'] = 'center';
    } else if (widget is Align) {
      properties['alignment'] = widget.alignment.toString();
    }

    return properties;
  }

  Widget _buildInspectorPanel() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.5,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.widgets,
                    color: Colors.blue,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _selectedNodeData!['type'],
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'Selected Element',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.7),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () {
                    setState(() {
                      _selectedNodeData = null;
                      _selectedPosition = null;
                      _selectedSize = null;
                    });
                  },
                ),
              ],
            ),
          ),

          const Divider(color: Colors.white24, height: 1),

          // Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Layout Info
                  _buildSection(
                    'Layout',
                    Icons.aspect_ratio,
                    [
                      _buildPropertyRow(
                        'Size',
                        '${_selectedNodeData!['size']['width']} × ${_selectedNodeData!['size']['height']}',
                      ),
                      _buildPropertyRow(
                        'Position',
                        'x: ${_selectedNodeData!['position']['x']}, y: ${_selectedNodeData!['position']['y']}',
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Constraints
                  _buildSection(
                    'Constraints',
                    Icons.crop_free,
                    [
                      _buildPropertyRow(
                        'Width',
                        '${_selectedNodeData!['constraints']['minWidth']} - ${_selectedNodeData!['constraints']['maxWidth']}',
                      ),
                      _buildPropertyRow(
                        'Height',
                        '${_selectedNodeData!['constraints']['minHeight']} - ${_selectedNodeData!['constraints']['maxHeight']}',
                      ),
                    ],
                  ),

                  // Properties
                  if (_selectedNodeData!['properties'].isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _buildSection(
                      'Properties',
                      Icons.settings,
                      (_selectedNodeData!['properties'] as Map<String, dynamic>)
                          .entries
                          .map((e) => _buildPropertyRow(e.key, e.value.toString()))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title, IconData icon, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.blue, size: 16),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                color: Colors.blue,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.3),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildPropertyRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 12,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontFamily: 'monospace',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Component tree hierarchy viewer
class ComponentTreeViewer extends StatelessWidget {
  final Map<String, dynamic>? schema;

  const ComponentTreeViewer({
    super.key,
    this.schema,
  });

  @override
  Widget build(BuildContext context) {
    if (schema == null) {
      return const Center(
        child: Text(
          'No schema available',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    return Container(
      color: Colors.grey[900],
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: _buildTree(schema!['nodes'] ?? []),
      ),
    );
  }

  Widget _buildTree(dynamic nodes) {
    if (nodes is! List) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: nodes.map<Widget>((node) => _buildNode(node, 0)).toList(),
    );
  }

  Widget _buildNode(Map<String, dynamic> node, int depth) {
    final type = node['type'] ?? 'Unknown';
    final children = node['children'] as List?;
    final hasChildren = children != null && children.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(left: depth * 20.0, top: 4, bottom: 4),
          child: Row(
            children: [
              Icon(
                hasChildren ? Icons.arrow_drop_down : Icons.arrow_right,
                color: Colors.white54,
                size: 20,
              ),
              const SizedBox(width: 4),
              Icon(
                _getIconForType(type),
                color: Colors.blue,
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                type,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
        ),
        if (hasChildren)
          ...children.map<Widget>((child) => _buildNode(child, depth + 1)).toList(),
      ],
    );
  }

  IconData _getIconForType(String type) {
    switch (type.toLowerCase()) {
      case 'view':
      case 'container':
        return Icons.crop_square;
      case 'text':
        return Icons.text_fields;
      case 'button':
        return Icons.smart_button;
      case 'image':
        return Icons.image;
      case 'list':
        return Icons.list;
      case 'input':
        return Icons.input;
      default:
        return Icons.widgets;
    }
  }
}
