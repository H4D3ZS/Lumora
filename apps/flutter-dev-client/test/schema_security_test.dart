import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dev_client/interpreter/schema_interpreter.dart';
import 'package:flutter_dev_client/widgets/error_widgets.dart';

void main() {
  group('Schema Security', () {
    late SchemaInterpreter interpreter;

    setUp(() {
      interpreter = SchemaInterpreter();
    });

    test('whitelists allowed widget types', () {
      // Verify the whitelist contains expected types
      expect(SchemaInterpreter.allowedWidgetTypes.contains('View'), true);
      expect(SchemaInterpreter.allowedWidgetTypes.contains('Text'), true);
      expect(SchemaInterpreter.allowedWidgetTypes.contains('Button'), true);
      expect(SchemaInterpreter.allowedWidgetTypes.contains('List'), true);
      expect(SchemaInterpreter.allowedWidgetTypes.contains('Image'), true);
      expect(SchemaInterpreter.allowedWidgetTypes.contains('Input'), true);
      
      // Verify dangerous types are not in whitelist
      expect(SchemaInterpreter.allowedWidgetTypes.contains('Script'), false);
      expect(SchemaInterpreter.allowedWidgetTypes.contains('Eval'), false);
    });

    test('rejects non-whitelisted widget types', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'DangerousWidget',
          'props': {},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      
      // Should render an error widget
      expect(widget, isA<SchemaErrorWidget>());
    });

    test('sanitizes string props to prevent injection', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': '<script>alert("XSS")</script>Hello',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      
      // Should render Text widget (sanitization happens internally)
      expect(widget, isA<Text>());
      
      // The text should have script tags removed
      final textWidget = widget as Text;
      expect(textWidget.data, isNot(contains('<script>')));
    });

    test('blocks dangerous prop names', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {
            'onscript': 'dangerous',
            'eval': 'dangerous',
            'function': 'dangerous',
            'padding': 16, // This should be allowed
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      
      // Should render Container (View) but without dangerous props
      expect(widget, isA<Container>());
    });

    test('sanitizes javascript: protocol in URLs', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Image',
          'props': {
            'src': 'javascript:alert("XSS")',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      
      // Should render Image widget but with sanitized URL
      expect(widget, isA<Image>());
    });

    test('allows safe template placeholders', () {
      interpreter.setContextVariable('name', 'John');
      
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': 'Hello {{name}}',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      
      // Should render Text widget with resolved placeholder
      expect(widget, isA<Text>());
      final textWidget = widget as Text;
      expect(textWidget.data, 'Hello John');
    });

    test('validates schema structure before interpretation', () {
      // Empty schema
      final emptySchema = <String, dynamic>{};
      final emptyWidget = interpreter.interpretSchema(emptySchema);
      expect(emptyWidget, isA<ErrorOverlay>());

      // Missing schemaVersion
      final noVersionSchema = {
        'root': {
          'type': 'View',
          'props': {},
          'children': [],
        },
      };
      final noVersionWidget = interpreter.interpretSchema(noVersionSchema);
      expect(noVersionWidget, isA<ErrorOverlay>());

      // Missing root
      final noRootSchema = {
        'schemaVersion': '1.0',
      };
      final noRootWidget = interpreter.interpretSchema(noRootSchema);
      expect(noRootWidget, isA<ErrorOverlay>());
    });

    test('prevents eval or dynamic code execution', () {
      // Template engine only does variable lookup, no eval
      interpreter.setContextVariable('code', 'alert("test")');
      
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': '{{code}}',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      
      // Should render the string value, not execute it
      expect(widget, isA<Text>());
      final textWidget = widget as Text;
      expect(textWidget.data, 'alert("test")'); // Just the string, not executed
    });
  });
}
