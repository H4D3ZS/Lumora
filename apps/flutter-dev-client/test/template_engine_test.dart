import 'package:flutter_test/flutter_test.dart';
import 'package:kiro_core/kiro_core.dart';

void main() {
  group('RenderContext', () {
    test('stores and retrieves variables', () {
      final context = RenderContext();
      context.set('name', 'John');
      context.set('age', 30);

      expect(context.get('name'), equals('John'));
      expect(context.get('age'), equals(30));
    });

    test('returns null for non-existent variables', () {
      final context = RenderContext();
      expect(context.get('nonexistent'), isNull);
    });

    test('supports nested context scopes', () {
      final parent = RenderContext();
      parent.set('parentVar', 'parent value');
      parent.set('sharedVar', 'parent shared');

      final child = parent.createChild();
      child.set('childVar', 'child value');
      child.set('sharedVar', 'child shared');

      // Child can access its own variables
      expect(child.get('childVar'), equals('child value'));
      
      // Child can access parent variables
      expect(child.get('parentVar'), equals('parent value'));
      
      // Child variables override parent variables
      expect(child.get('sharedVar'), equals('child shared'));
      
      // Parent cannot access child variables
      expect(parent.get('childVar'), isNull);
      
      // Parent variables remain unchanged
      expect(parent.get('sharedVar'), equals('parent shared'));
    });

    test('setAll adds multiple variables', () {
      final context = RenderContext();
      context.setAll({
        'name': 'Alice',
        'age': 25,
        'city': 'New York',
      });

      expect(context.get('name'), equals('Alice'));
      expect(context.get('age'), equals(25));
      expect(context.get('city'), equals('New York'));
    });

    test('has checks variable existence', () {
      final parent = RenderContext();
      parent.set('parentVar', 'value');

      final child = parent.createChild();
      child.set('childVar', 'value');

      expect(child.has('childVar'), isTrue);
      expect(child.has('parentVar'), isTrue);
      expect(child.has('nonexistent'), isFalse);
    });

    test('clear removes all variables from current context', () {
      final parent = RenderContext();
      parent.set('parentVar', 'value');

      final child = parent.createChild();
      child.set('childVar', 'value');

      child.clear();

      expect(child.get('childVar'), isNull);
      expect(child.get('parentVar'), equals('value')); // Parent still accessible
    });
  });

  group('TemplateEngine', () {
    test('resolves simple placeholder', () {
      final context = RenderContext();
      context.set('name', 'John');

      final result = TemplateEngine.resolve('Hello {{name}}!', context);
      expect(result, equals('Hello John!'));
    });

    test('resolves multiple placeholders', () {
      final context = RenderContext();
      context.set('firstName', 'John');
      context.set('lastName', 'Doe');

      final result = TemplateEngine.resolve(
        'Hello {{firstName}} {{lastName}}!',
        context,
      );
      expect(result, equals('Hello John Doe!'));
    });

    test('handles missing variables with empty string', () {
      final context = RenderContext();

      final result = TemplateEngine.resolve('Hello {{name}}!', context);
      expect(result, equals('Hello !'));
    });

    test('handles strings without placeholders', () {
      final context = RenderContext();

      final result = TemplateEngine.resolve('Hello World!', context);
      expect(result, equals('Hello World!'));
    });

    test('handles whitespace in placeholders', () {
      final context = RenderContext();
      context.set('name', 'John');

      final result = TemplateEngine.resolve('Hello {{ name }}!', context);
      expect(result, equals('Hello John!'));
    });

    test('converts non-string values to strings', () {
      final context = RenderContext();
      context.set('count', 42);
      context.set('active', true);

      final result = TemplateEngine.resolve(
        'Count: {{count}}, Active: {{active}}',
        context,
      );
      expect(result, equals('Count: 42, Active: true'));
    });

    test('resolveValue handles different types', () {
      final context = RenderContext();
      context.set('name', 'John');

      // String with placeholder
      expect(
        TemplateEngine.resolveValue('Hello {{name}}', context),
        equals('Hello John'),
      );

      // Number (unchanged)
      expect(TemplateEngine.resolveValue(42, context), equals(42));

      // Boolean (unchanged)
      expect(TemplateEngine.resolveValue(true, context), equals(true));

      // Null (unchanged)
      expect(TemplateEngine.resolveValue(null, context), isNull);
    });

    test('resolveMap resolves all string values in map', () {
      final context = RenderContext();
      context.set('name', 'John');
      context.set('count', 5);

      final map = {
        'greeting': 'Hello {{name}}',
        'message': 'You have {{count}} messages',
        'number': 42,
      };

      final result = TemplateEngine.resolveMap(map, context);

      expect(result['greeting'], equals('Hello John'));
      expect(result['message'], equals('You have 5 messages'));
      expect(result['number'], equals(42));
    });

    test('resolveList resolves all elements in list', () {
      final context = RenderContext();
      context.set('name', 'John');

      final list = [
        'Hello {{name}}',
        42,
        {'text': 'Hi {{name}}'},
      ];

      final result = TemplateEngine.resolveList(list, context);

      expect(result[0], equals('Hello John'));
      expect(result[1], equals(42));
      expect(result[2]['text'], equals('Hi John'));
    });

    test('resolves nested structures', () {
      final context = RenderContext();
      context.set('name', 'John');
      context.set('city', 'New York');

      final data = {
        'user': {
          'greeting': 'Hello {{name}}',
          'location': {
            'city': '{{city}}',
          },
        },
        'items': [
          'Item for {{name}}',
          {'label': 'City: {{city}}'},
        ],
      };

      final result = TemplateEngine.resolveValue(data, context);

      expect(result['user']['greeting'], equals('Hello John'));
      expect(result['user']['location']['city'], equals('New York'));
      expect(result['items'][0], equals('Item for John'));
      expect(result['items'][1]['label'], equals('City: New York'));
    });

    test('hasPlaceholders detects placeholders', () {
      expect(TemplateEngine.hasPlaceholders('Hello {{name}}'), isTrue);
      expect(TemplateEngine.hasPlaceholders('Hello World'), isFalse);
      expect(TemplateEngine.hasPlaceholders('{{a}} and {{b}}'), isTrue);
    });

    test('extractVariableNames extracts all variable names', () {
      final names = TemplateEngine.extractVariableNames(
        'Hello {{name}}, you have {{count}} messages in {{city}}',
      );

      expect(names, equals(['name', 'count', 'city']));
    });

    test('extractVariableNames handles whitespace', () {
      final names = TemplateEngine.extractVariableNames(
        'Hello {{ name }}, you have {{ count }} messages',
      );

      expect(names, equals(['name', 'count']));
    });

    test('extractVariableNames returns empty list for no placeholders', () {
      final names = TemplateEngine.extractVariableNames('Hello World');
      expect(names, isEmpty);
    });
  });

  group('SchemaInterpreter Integration', () {
    test('context variables are accessible through nested scopes', () {
      final parent = RenderContext();
      parent.set('theme', 'dark');
      parent.set('language', 'en');

      final child1 = parent.createChild();
      child1.set('component', 'header');

      final child2 = child1.createChild();
      child2.set('element', 'title');

      // All levels accessible from deepest child
      expect(child2.get('theme'), equals('dark'));
      expect(child2.get('language'), equals('en'));
      expect(child2.get('component'), equals('header'));
      expect(child2.get('element'), equals('title'));
    });
  });
}
