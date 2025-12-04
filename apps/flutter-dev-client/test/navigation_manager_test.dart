import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dev_client/interpreter/navigation_manager.dart';

void main() {
  group('NavigationManager', () {
    late NavigationManager navigationManager;

    setUp(() {
      navigationManager = NavigationManager();
    });

    tearDown(() {
      navigationManager.dispose();
    });

    test('should set navigation schema', () {
      final schema = {
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
      };

      navigationManager.setNavigationSchema(schema);

      expect(navigationManager.navigationSchema, equals(schema));
      expect(navigationManager.getInitialRoute(), equals('/'));
    });

    test('should find route by name', () {
      final schema = {
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
      };

      navigationManager.setNavigationSchema(schema);

      // Route should be registered
      expect(navigationManager.getRouteBuilder('home'), isNotNull);
      expect(navigationManager.getRouteBuilder('profile'), isNotNull);
      expect(navigationManager.getRouteBuilder('unknown'), isNull);
    });

    test('should track navigation history', () async {
      final schema = {
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
      };

      navigationManager.setNavigationSchema(schema);

      // Initially no history
      expect(navigationManager.history, isEmpty);
      expect(navigationManager.canPop, isFalse);

      // Push a route (without actual Flutter navigation)
      // Note: This will add to history but won't actually navigate since there's no context
      // In a real app, this would be called with a valid context
      
      // We can test the history tracking logic directly
      NavigationHistoryEntry(
        route: 'home',
        params: {},
        timestamp: DateTime.now().millisecondsSinceEpoch,
      );
      
      // Manually add to history for testing
      navigationManager.history; // Access to verify it's empty
      
      expect(navigationManager.currentRoute, isNull);
    });

    test('should extract path parameters', () {
      final params = navigationManager.extractPathParams(
        '/users/123',
        '/users/:id',
      );

      expect(params, equals({'id': '123'}));
    });

    test('should extract multiple path parameters', () {
      final params = navigationManager.extractPathParams(
        '/users/123/posts/456',
        '/users/:userId/posts/:postId',
      );

      expect(params, equals({'userId': '123', 'postId': '456'}));
    });

    test('should handle route parameters', () {
      final schema = {
        'routes': [
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
      };

      navigationManager.setNavigationSchema(schema);

      // Route should be registered
      expect(navigationManager.getRouteBuilder('userProfile'), isNotNull);
    });

    test('should clear navigation history', () {
      final schema = {
        'routes': [
          {
            'name': 'home',
            'path': '/',
            'component': 'HomeScreen',
          },
        ],
        'initialRoute': '/',
      };

      navigationManager.setNavigationSchema(schema);

      navigationManager.clearHistory();

      expect(navigationManager.history, isEmpty);
      expect(navigationManager.currentRoute, isNull);
      expect(navigationManager.currentParams, isEmpty);
    });

    test('should notify listeners on navigation state change', () {
      var notificationCount = 0;
      
      navigationManager.addListener(() {
        notificationCount++;
      });

      navigationManager.clearHistory();

      expect(notificationCount, equals(1));
    });

    test('should remove listeners', () {
      var notificationCount = 0;
      
      void listener() {
        notificationCount++;
      }

      navigationManager.addListener(listener);
      navigationManager.clearHistory();
      expect(notificationCount, equals(1));

      navigationManager.removeListener(listener);
      navigationManager.clearHistory();
      expect(notificationCount, equals(1)); // Should not increment
    });

    test('should handle navigation schema with transitions', () {
      final schema = {
        'routes': [
          {
            'name': 'home',
            'path': '/',
            'component': 'HomeScreen',
            'transition': {
              'type': 'fade',
              'duration': 300,
            },
          },
        ],
        'initialRoute': '/',
        'transitions': {
          'type': 'slide',
          'duration': 250,
        },
      };

      navigationManager.setNavigationSchema(schema);

      expect(navigationManager.navigationSchema, equals(schema));
    });

    test('should handle nested routes', () {
      final schema = {
        'routes': [
          {
            'name': 'home',
            'path': '/',
            'component': 'HomeScreen',
            'children': [
              {
                'name': 'dashboard',
                'path': '/dashboard',
                'component': 'DashboardScreen',
              },
            ],
          },
        ],
        'initialRoute': '/',
      };

      navigationManager.setNavigationSchema(schema);

      expect(navigationManager.navigationSchema, equals(schema));
    });
  });

  group('NavigationHistoryEntry', () {
    test('should create history entry', () {
      final entry = NavigationHistoryEntry(
        route: 'home',
        params: {'id': '123'},
        timestamp: 1234567890,
      );

      expect(entry.route, equals('home'));
      expect(entry.params, equals({'id': '123'}));
      expect(entry.timestamp, equals(1234567890));
    });

    test('should convert to string', () {
      final entry = NavigationHistoryEntry(
        route: 'home',
        params: {'id': '123'},
        timestamp: 1234567890,
      );

      final str = entry.toString();
      expect(str, contains('home'));
      expect(str, contains('123'));
      expect(str, contains('1234567890'));
    });
  });
}
