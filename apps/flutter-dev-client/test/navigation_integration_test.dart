import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dev_client/interpreter/schema_interpreter.dart';
import 'package:flutter_dev_client/interpreter/navigation_manager.dart';

void main() {
  group('Navigation Integration Tests', () {
    late SchemaInterpreter interpreter;
    late NavigationManager navigationManager;

    setUp(() {
      navigationManager = NavigationManager();
      interpreter = SchemaInterpreter(navigationManager: navigationManager);
    });

    tearDown(() {
      navigationManager.dispose();
    });

    test('should interpret schema with navigation', () {
      final schema = {
        'schemaVersion': '1.0',
        'navigation': {
          'routes': [
            {
              'name': 'home',
              'path': '/',
              'component': 'HomeScreen',
            },
            {
              'name': 'profile',
              'path': '/profile',
              'component': 'ProfileScreen',
            },
          ],
          'initialRoute': '/',
        },
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'Text',
              'props': {'text': 'Hello World'},
              'children': [],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      expect(widget, isA<Widget>());
      expect(navigationManager.navigationSchema, isNotNull);
      expect(navigationManager.getInitialRoute(), equals('/'));
    });

    test('should handle navigation action in button', () {
      final schema = {
        'schemaVersion': '1.0',
        'navigation': {
          'routes': [
            {
              'name': 'home',
              'path': '/',
              'component': 'HomeScreen',
            },
            {
              'name': 'profile',
              'path': '/profile',
              'component': 'ProfileScreen',
            },
          ],
          'initialRoute': '/',
        },
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'Button',
              'props': {
                'title': 'Go to Profile',
                'onTap': 'navigate:profile',
              },
              'children': [],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      expect(widget, isA<Widget>());
      expect(navigationManager.navigationSchema, isNotNull);
    });

    test('should handle navigation action with parameters', () {
      final schema = {
        'schemaVersion': '1.0',
        'navigation': {
          'routes': [
            {
              'name': 'home',
              'path': '/',
              'component': 'HomeScreen',
            },
            {
              'name': 'userProfile',
              'path': '/users/:id',
              'component': 'UserProfileScreen',
              'params': [
                {
                  'name': 'id',
                  'type': 'string',
                  'required': true,
                },
              ],
            },
          ],
          'initialRoute': '/',
        },
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'Button',
              'props': {
                'title': 'View User',
                'onTap': 'navigate:userProfile?id=123',
              },
              'children': [],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      expect(widget, isA<Widget>());
      expect(navigationManager.navigationSchema, isNotNull);
    });

    test('should handle back navigation action', () {
      final schema = {
        'schemaVersion': '1.0',
        'navigation': {
          'routes': [
            {
              'name': 'home',
              'path': '/',
              'component': 'HomeScreen',
            },
            {
              'name': 'profile',
              'path': '/profile',
              'component': 'ProfileScreen',
            },
          ],
          'initialRoute': '/',
        },
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'Button',
              'props': {
                'title': 'Go Back',
                'onTap': 'goBack',
              },
              'children': [],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      expect(widget, isA<Widget>());
      expect(navigationManager.navigationSchema, isNotNull);
    });

    test('should handle replace navigation action', () {
      final schema = {
        'schemaVersion': '1.0',
        'navigation': {
          'routes': [
            {
              'name': 'home',
              'path': '/',
              'component': 'HomeScreen',
            },
            {
              'name': 'login',
              'path': '/login',
              'component': 'LoginScreen',
            },
          ],
          'initialRoute': '/',
        },
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'Button',
              'props': {
                'title': 'Login',
                'onTap': 'replace:login',
              },
              'children': [],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      expect(widget, isA<Widget>());
      expect(navigationManager.navigationSchema, isNotNull);
    });

    test('should handle popToRoot navigation action', () {
      final schema = {
        'schemaVersion': '1.0',
        'navigation': {
          'routes': [
            {
              'name': 'home',
              'path': '/',
              'component': 'HomeScreen',
            },
            {
              'name': 'settings',
              'path': '/settings',
              'component': 'SettingsScreen',
            },
          ],
          'initialRoute': '/',
        },
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'Button',
              'props': {
                'title': 'Go Home',
                'onTap': 'popToRoot',
              },
              'children': [],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      expect(widget, isA<Widget>());
      expect(navigationManager.navigationSchema, isNotNull);
    });

    test('should handle navigation action object format', () {
      final schema = {
        'schemaVersion': '1.0',
        'navigation': {
          'routes': [
            {
              'name': 'home',
              'path': '/',
              'component': 'HomeScreen',
            },
            {
              'name': 'details',
              'path': '/details',
              'component': 'DetailsScreen',
            },
          ],
          'initialRoute': '/',
        },
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'Button',
              'props': {
                'title': 'View Details',
                'onTap': {
                  'action': 'navigate',
                  'route': 'details',
                  'params': {
                    'id': '123',
                    'source': 'home',
                  },
                },
              },
              'children': [],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      expect(widget, isA<Widget>());
      expect(navigationManager.navigationSchema, isNotNull);
    });

    test('should get current route information', () {
      final schema = {
        'schemaVersion': '1.0',
        'navigation': {
          'routes': [
            {
              'name': 'home',
              'path': '/',
              'component': 'HomeScreen',
            },
          ],
          'initialRoute': '/',
        },
        'root': {
          'type': 'View',
          'props': {},
          'children': [],
        },
      };

      interpreter.interpretSchema(schema);

      expect(interpreter.getCurrentRoute(), isNull); // No navigation has occurred yet
      expect(interpreter.getCurrentRouteParams(), isEmpty);
      expect(interpreter.canNavigateBack(), isFalse);
    });

    test('should handle schema without navigation', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {},
          'children': [
            {
              'type': 'Text',
              'props': {'text': 'No Navigation'},
              'children': [],
            },
          ],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      expect(widget, isA<Widget>());
      expect(navigationManager.navigationSchema, isNull);
    });

    test('should handle navigation with transitions', () {
      final schema = {
        'schemaVersion': '1.0',
        'navigation': {
          'routes': [
            {
              'name': 'home',
              'path': '/',
              'component': 'HomeScreen',
              'transition': {
                'type': 'fade',
                'duration': 300,
                'easing': 'easeInOut',
              },
            },
            {
              'name': 'profile',
              'path': '/profile',
              'component': 'ProfileScreen',
              'transition': {
                'type': 'slide',
                'duration': 250,
                'easing': 'fastOutSlowIn',
              },
            },
          ],
          'initialRoute': '/',
          'transitions': {
            'type': 'material',
            'duration': 300,
          },
        },
        'root': {
          'type': 'View',
          'props': {},
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);

      expect(widget, isA<Widget>());
      expect(navigationManager.navigationSchema, isNotNull);
      
      final navSchema = navigationManager.navigationSchema!;
      expect(navSchema['transitions'], isNotNull);
      expect(navSchema['routes'], isA<List>());
    });
  });
}
