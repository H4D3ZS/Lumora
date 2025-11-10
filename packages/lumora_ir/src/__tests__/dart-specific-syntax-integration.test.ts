/**
 * Integration tests for Dart-specific syntax parsing
 * Tests the complete flow of named parameters, null safety, and custom widgets
 */

import { DartParser } from '../parsers/dart-parser';

describe('Dart-specific syntax integration', () => {
  let parser: DartParser;

  beforeEach(() => {
    parser = new DartParser();
  });

  it('should handle complex widget with all Dart-specific features', () => {
    const source = `
class ComplexWidget extends StatefulWidget {
  final String title;
  final int? count;
  final List<String>? items;
  
  const ComplexWidget({
    required this.title,
    this.count,
    this.items,
  });

  @override
  _ComplexWidgetState createState() => _ComplexWidgetState();
}

class _ComplexWidgetState extends State<ComplexWidget> {
  late String displayTitle;
  int? selectedIndex;
  List<String>? filteredItems;
  Map<String, dynamic>? metadata;
  
  @override
  void initState() {
    super.initState();
    displayTitle = widget.title.toUpperCase();
    filteredItems = widget.items?.where((item) => item.isNotEmpty).toList();
  }

  void updateSelection(int? index) {
    setState(() {
      selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(displayTitle),
        Text('Count: \${widget.count ?? 0}'),
        if (filteredItems != null)
          ListView.builder(
            itemCount: filteredItems!.length,
            itemBuilder: (context, index) {
              return Text(filteredItems![index]);
            },
          ),
      ],
    );
  }
}
`;

    const ir = parser.parse(source, 'complex_widget.dart');
    const node = ir.nodes[0];

    // Verify widget parsing
    expect(node.type).toBe('ComplexWidget');

    // Verify state with null safety
    expect(node.state).toBeDefined();
    expect(node.state?.variables).toHaveLength(4);

    const displayTitle = node.state?.variables.find(v => v.name === 'displayTitle');
    expect(displayTitle?.type).toBe('string');
    expect(displayTitle?.mutable).toBe(true);

    const selectedIndex = node.state?.variables.find(v => v.name === 'selectedIndex');
    expect(selectedIndex?.type).toBe('number | null');

    const filteredItems = node.state?.variables.find(v => v.name === 'filteredItems');
    expect(filteredItems?.type).toBe('string[] | null');

    const metadata = node.state?.variables.find(v => v.name === 'metadata');
    expect(metadata?.type).toBe('Record<string, any> | null');

    // Verify custom widget registration
    const registry = parser.getCustomWidgetRegistry();
    expect(registry.has('ComplexWidget')).toBe(true);
  });

  it('should handle multiple custom widgets with cross-references', () => {
    const source = `
class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color? color;
  
  const CustomButton({
    required this.label,
    this.onPressed,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      child: Text(label),
    );
  }
}

class CustomCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? action;
  
  const CustomCard({
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Text(title),
          if (subtitle != null) Text(subtitle!),
          if (action != null) action!,
        ],
      ),
    );
  }
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CustomCard(
      title: 'Welcome',
      subtitle: 'Hello World',
      action: CustomButton(
        label: 'Click Me',
        onPressed: () {},
      ),
    );
  }
}
`;

    const ir = parser.parse(source, 'app.dart');

    // Verify all widgets parsed
    expect(ir.nodes).toHaveLength(3);

    // Verify custom widget registry
    const registry = parser.getCustomWidgetRegistry();
    expect(registry.has('CustomButton')).toBe(true);
    expect(registry.has('CustomCard')).toBe(true);
    expect(registry.has('MyApp')).toBe(true);

    // Verify custom widgets in metadata
    expect(ir.metadata.customWidgets).toBeDefined();
    expect(ir.metadata.customWidgets).toHaveLength(3);

    // Verify CustomButton properties
    const customButton = registry.get('CustomButton');
    expect(customButton?.properties).toHaveLength(3);
    expect(customButton?.properties.find(p => p.name === 'label')?.isRequired).toBe(true);
    expect(customButton?.properties.find(p => p.name === 'onPressed')?.isRequired).toBe(false);

    // Verify CustomCard properties
    const customCard = registry.get('CustomCard');
    expect(customCard?.properties).toHaveLength(3);
    expect(customCard?.properties.find(p => p.name === 'title')?.isRequired).toBe(true);
    expect(customCard?.properties.find(p => p.name === 'subtitle')?.isRequired).toBe(false);
  });

  it('should generate proper TypeScript interfaces for custom widgets', () => {
    const source = `
class DataCard extends StatelessWidget {
  final String title;
  final int value;
  final double? percentage;
  final bool isActive;
  final List<String>? tags;
  
  const DataCard({
    required this.title,
    required this.value,
    this.percentage,
    this.isActive = true,
    this.tags,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Text(title),
          Text('\$value'),
        ],
      ),
    );
  }
}
`;

    parser.parse(source, 'data_card.dart');

    const builder = parser.extractCustomWidgetBuilder('DataCard');
    expect(builder).toBeDefined();
    expect(builder).toContain('interface DataCardProps');
    expect(builder).toContain('title: string');
    expect(builder).toContain('value: number');
    expect(builder).toContain('percentage?: number | null');
    expect(builder).toContain('isActive?: boolean');
    expect(builder).toContain('tags?: string[] | null');
    expect(builder).toContain('default: true');
  });

  it('should handle null-aware operators in expressions', () => {
    const source = `
class SafeWidget extends StatefulWidget {
  @override
  _SafeWidgetState createState() => _SafeWidgetState();
}

class _SafeWidgetState extends State<SafeWidget> {
  String? username;
  int? count;
  
  String getDisplayName() {
    return username ?? 'Guest';
  }
  
  int getCount() {
    return count ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(username?.toUpperCase() ?? 'N/A'),
        Text('Count: \${count ?? 0}'),
      ],
    );
  }
}
`;

    const ir = parser.parse(source, 'safe_widget.dart');
    const node = ir.nodes[0];

    expect(node.state).toBeDefined();
    expect(node.state?.variables).toHaveLength(2);

    const username = node.state?.variables.find(v => v.name === 'username');
    expect(username?.type).toBe('string | null');

    const count = node.state?.variables.find(v => v.name === 'count');
    expect(count?.type).toBe('number | null');
  });

  it('should preserve parameter metadata for code generation', () => {
    const source = `
class ConfigurableWidget extends StatelessWidget {
  final String title;
  final int maxItems;
  final bool showHeader;
  final double? customHeight;
  
  const ConfigurableWidget({
    required this.title,
    this.maxItems = 10,
    this.showHeader = true,
    this.customHeight,
  });

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
`;

    const ir = parser.parse(source, 'configurable_widget.dart');
    const node = ir.nodes[0];

    // Verify default values are captured
    expect(node.props.maxItems).toBe(10);
    expect(node.props.showHeader).toBe(true);

    // Verify custom widget metadata includes properties with defaults
    const customWidget = ir.metadata.customWidgets?.find(w => w.name === 'ConfigurableWidget');
    expect(customWidget).toBeDefined();
    expect(customWidget?.properties.length).toBeGreaterThanOrEqual(3);

    const titleProp = customWidget?.properties.find(p => p.name === 'title');
    expect(titleProp?.required).toBe(true);
    expect(titleProp?.type).toBe('string');

    const maxItemsProp = customWidget?.properties.find(p => p.name === 'maxItems');
    expect(maxItemsProp?.required).toBe(false);
    expect(maxItemsProp?.defaultValue).toBe('10');

    const showHeaderProp = customWidget?.properties.find(p => p.name === 'showHeader');
    expect(showHeaderProp?.defaultValue).toBe('true');
  });
});
