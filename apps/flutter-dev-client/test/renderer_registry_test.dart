import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kiro_core/kiro_core.dart';

void main() {
  group('RendererRegistry', () {
    test('registers and retrieves custom renderer', () {
      final registry = RendererRegistry();
      
      // Register a custom renderer
      registry.register('CustomCard', (props, children) {
        return Card(
          elevation: (props['elevation'] as num?)?.toDouble() ?? 2.0,
          child: Column(children: children),
        );
      });
      
      expect(registry.hasRenderer('CustomCard'), true);
      expect(registry.hasRenderer('UnknownType'), false);
      expect(registry.count, 1);
    });

    test('renders widget with custom renderer', () {
      final registry = RendererRegistry();
      
      registry.register('CustomCard', (props, children) {
        return Card(
          elevation: (props['elevation'] as num?)?.toDouble() ?? 2.0,
          child: Column(children: children),
        );
      });
      
      final widget = registry.render('CustomCard', {'elevation': 4.0}, []);
      
      expect(widget, isNotNull);
      expect(widget, isA<Card>());
    });

    test('returns null for unregistered type', () {
      final registry = RendererRegistry();
      
      final widget = registry.render('UnknownType', {}, []);
      
      expect(widget, isNull);
    });

    test('unregisters custom renderer', () {
      final registry = RendererRegistry();
      
      registry.register('CustomCard', (props, children) {
        return Card(child: Column(children: children));
      });
      
      expect(registry.hasRenderer('CustomCard'), true);
      
      final removed = registry.unregister('CustomCard');
      
      expect(removed, true);
      expect(registry.hasRenderer('CustomCard'), false);
      expect(registry.count, 0);
    });

    test('clears all renderers', () {
      final registry = RendererRegistry();
      
      registry.register('Type1', (props, children) => Container());
      registry.register('Type2', (props, children) => Container());
      registry.register('Type3', (props, children) => Container());
      
      expect(registry.count, 3);
      
      registry.clear();
      
      expect(registry.count, 0);
      expect(registry.hasRenderer('Type1'), false);
    });

    test('gets list of registered types', () {
      final registry = RendererRegistry();
      
      registry.register('Type1', (props, children) => Container());
      registry.register('Type2', (props, children) => Container());
      
      final types = registry.getRegisteredTypes();
      
      expect(types.length, 2);
      expect(types.contains('Type1'), true);
      expect(types.contains('Type2'), true);
    });
  });

  group('SchemaInterpreter with RendererRegistry', () {
    testWidgets('uses custom renderer for registered type', (WidgetTester tester) async {
      final registry = RendererRegistry();
      
      // Register a custom renderer for "Badge" type
      registry.register('Badge', (props, children) {
        return Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.red,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(props['text'] as String? ?? ''),
        );
      });
      
      final interpreter = SchemaInterpreter(registry: registry);
      
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Badge',
          'props': {'text': 'New'},
          'children': [],
        },
      };
      
      final widget = interpreter.interpretSchema(schema);
      
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));
      
      // Verify the custom renderer was used
      expect(find.text('New'), findsOneWidget);
      expect(find.byType(Container), findsWidgets);
    });

    testWidgets('falls back to default renderer for core types', (WidgetTester tester) async {
      final registry = RendererRegistry();
      final interpreter = SchemaInterpreter(registry: registry);
      
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {'text': 'Hello World'},
          'children': [],
        },
      };
      
      final widget = interpreter.interpretSchema(schema);
      
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));
      
      // Verify the default Text renderer was used
      expect(find.text('Hello World'), findsOneWidget);
    });

    testWidgets('custom renderer can override core types', (WidgetTester tester) async {
      final registry = RendererRegistry();
      
      // Override the default Button renderer
      registry.register('Button', (props, children) {
        return TextButton(
          onPressed: () {},
          child: Text(props['title'] as String? ?? 'Custom Button'),
        );
      });
      
      final interpreter = SchemaInterpreter(registry: registry);
      
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Button',
          'props': {'title': 'Click Me'},
          'children': [],
        },
      };
      
      final widget = interpreter.interpretSchema(schema);
      
      await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));
      
      // Verify the custom renderer was used (TextButton instead of ElevatedButton)
      expect(find.byType(TextButton), findsOneWidget);
      expect(find.text('Click Me'), findsOneWidget);
    });
  });
}
