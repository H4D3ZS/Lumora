import 'package:flutter/material.dart';
import 'dart:developer' as developer;

/// Navigation Manager for runtime navigation support
/// Handles route changes, navigation state, route parameters, and back navigation
class NavigationManager {
  /// Navigation schema from Lumora IR
  Map<String, dynamic>? _navigationSchema;
  
  /// Navigation history stack
  final List<NavigationHistoryEntry> _history = [];
  
  /// Current route index in history
  int _currentIndex = -1;
  
  /// Route parameter storage
  final Map<String, Map<String, dynamic>> _routeParams = {};
  
  /// Navigation state change listeners
  final List<VoidCallback> _listeners = [];
  
  /// Global navigator key for programmatic navigation
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  
  /// Route builders map (route name -> widget builder)
  final Map<String, WidgetBuilder> _routeBuilders = {};
  
  /// Current route name
  String? _currentRoute;
  
  /// Current route parameters
  Map<String, dynamic> _currentParams = {};
  
  NavigationManager();
  
  /// Sets the navigation schema from Lumora IR
  void setNavigationSchema(Map<String, dynamic> schema) {
    _navigationSchema = schema;
    _buildRouteMap();
    
    developer.log(
      'Navigation schema set with ${_routeBuilders.length} routes',
      name: 'NavigationManager',
    );
  }
  
  /// Gets the navigation schema
  Map<String, dynamic>? get navigationSchema => _navigationSchema;
  
  /// Gets the current route name
  String? get currentRoute => _currentRoute;
  
  /// Gets the current route parameters
  Map<String, dynamic> get currentParams => Map.unmodifiable(_currentParams);
  
  /// Gets the navigation history
  List<NavigationHistoryEntry> get history => List.unmodifiable(_history);
  
  /// Checks if can navigate back
  bool get canPop => _currentIndex > 0 || (_history.isNotEmpty && _currentIndex >= 0);
  
  /// Builds the route map from navigation schema
  void _buildRouteMap() {
    if (_navigationSchema == null) return;
    
    final routes = _navigationSchema!['routes'] as List<dynamic>?;
    if (routes == null) return;
    
    _routeBuilders.clear();
    
    for (final route in routes) {
      if (route is! Map<String, dynamic>) continue;
      
      final name = route['name'] as String?;
      final path = route['path'] as String?;
      final component = route['component'] as String?;
      
      if (name != null && path != null) {
        // Store route builder (will be resolved by interpreter)
        _routeBuilders[name] = (context) {
          // This will be replaced with actual widget from interpreter
          return Container(
            child: Center(
              child: Text('Route: $name (Component: $component)'),
            ),
          );
        };
        
        developer.log(
          'Registered route: $name -> $path',
          name: 'NavigationManager',
        );
      }
    }
  }
  
  /// Registers a route builder
  void registerRoute(String name, WidgetBuilder builder) {
    _routeBuilders[name] = builder;
    developer.log('Registered custom route builder: $name', name: 'NavigationManager');
  }
  
  /// Gets a route builder by name
  WidgetBuilder? getRouteBuilder(String name) {
    return _routeBuilders[name];
  }
  
  /// Navigates to a route by name
  Future<void> push(String routeName, {Map<String, dynamic>? params}) async {
    if (_navigationSchema == null) {
      developer.log(
        'Cannot navigate: navigation schema not set',
        name: 'NavigationManager',
        level: 900,
      );
      return;
    }
    
    final route = _findRoute(routeName);
    if (route == null) {
      developer.log(
        'Route not found: $routeName',
        name: 'NavigationManager',
        level: 900,
      );
      return;
    }
    
    // Store route parameters
    if (params != null) {
      _routeParams[routeName] = params;
    }
    
    // Add to history
    final entry = NavigationHistoryEntry(
      route: routeName,
      params: params ?? {},
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    
    // Remove any forward history if we're not at the end
    if (_currentIndex < _history.length - 1) {
      _history.removeRange(_currentIndex + 1, _history.length);
    }
    
    _history.add(entry);
    _currentIndex = _history.length - 1;
    
    // Update current route
    _currentRoute = routeName;
    _currentParams = params ?? {};
    
    developer.log(
      'Navigating to: $routeName with params: $params',
      name: 'NavigationManager',
    );
    
    // Notify listeners
    _notifyListeners();
    
    // Perform navigation using Flutter Navigator
    final context = navigatorKey.currentContext;
    if (context != null) {
      final path = route['path'] as String?;
      if (path != null) {
        await Navigator.of(context).pushNamed(
          path,
          arguments: params,
        );
      }
    }
  }
  
  /// Replaces the current route
  Future<void> replace(String routeName, {Map<String, dynamic>? params}) async {
    if (_navigationSchema == null) {
      developer.log(
        'Cannot navigate: navigation schema not set',
        name: 'NavigationManager',
        level: 900,
      );
      return;
    }
    
    final route = _findRoute(routeName);
    if (route == null) {
      developer.log(
        'Route not found: $routeName',
        name: 'NavigationManager',
        level: 900,
      );
      return;
    }
    
    // Store route parameters
    if (params != null) {
      _routeParams[routeName] = params;
    }
    
    // Replace current history entry
    final entry = NavigationHistoryEntry(
      route: routeName,
      params: params ?? {},
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    
    if (_currentIndex >= 0 && _currentIndex < _history.length) {
      _history[_currentIndex] = entry;
    } else {
      _history.add(entry);
      _currentIndex = _history.length - 1;
    }
    
    // Update current route
    _currentRoute = routeName;
    _currentParams = params ?? {};
    
    developer.log(
      'Replacing route with: $routeName with params: $params',
      name: 'NavigationManager',
    );
    
    // Notify listeners
    _notifyListeners();
    
    // Perform navigation using Flutter Navigator
    final context = navigatorKey.currentContext;
    if (context != null) {
      final path = route['path'] as String?;
      if (path != null) {
        await Navigator.of(context).pushReplacementNamed(
          path,
          arguments: params,
        );
      }
    }
  }
  
  /// Navigates back
  Future<void> pop() async {
    if (!canPop) {
      developer.log(
        'Cannot pop: no previous route',
        name: 'NavigationManager',
        level: 900,
      );
      return;
    }
    
    // Move back in history
    _currentIndex--;
    
    if (_currentIndex >= 0 && _currentIndex < _history.length) {
      final entry = _history[_currentIndex];
      _currentRoute = entry.route;
      _currentParams = entry.params;
      
      developer.log(
        'Navigating back to: ${entry.route}',
        name: 'NavigationManager',
      );
    } else {
      _currentRoute = null;
      _currentParams = {};
    }
    
    // Notify listeners
    _notifyListeners();
    
    // Perform navigation using Flutter Navigator
    final context = navigatorKey.currentContext;
    if (context != null && Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
  }
  
  /// Pops to the root route
  Future<void> popToRoot() async {
    if (_history.isEmpty) {
      developer.log(
        'Cannot pop to root: no history',
        name: 'NavigationManager',
        level: 900,
      );
      return;
    }
    
    // Go to first entry in history
    _currentIndex = 0;
    final entry = _history[0];
    _currentRoute = entry.route;
    _currentParams = entry.params;
    
    developer.log(
      'Popping to root: ${entry.route}',
      name: 'NavigationManager',
    );
    
    // Notify listeners
    _notifyListeners();
    
    // Perform navigation using Flutter Navigator
    final context = navigatorKey.currentContext;
    if (context != null) {
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }
  
  /// Pops until a condition is met
  Future<void> popUntil(bool Function(String routeName) condition) async {
    if (_history.isEmpty) {
      developer.log(
        'Cannot pop until: no history',
        name: 'NavigationManager',
        level: 900,
      );
      return;
    }
    
    // Find the target route in history
    int targetIndex = _currentIndex;
    while (targetIndex > 0) {
      final entry = _history[targetIndex];
      if (condition(entry.route)) {
        break;
      }
      targetIndex--;
    }
    
    if (targetIndex < 0) {
      targetIndex = 0;
    }
    
    _currentIndex = targetIndex;
    final entry = _history[_currentIndex];
    _currentRoute = entry.route;
    _currentParams = entry.params;
    
    developer.log(
      'Popping until: ${entry.route}',
      name: 'NavigationManager',
    );
    
    // Notify listeners
    _notifyListeners();
    
    // Perform navigation using Flutter Navigator
    final context = navigatorKey.currentContext;
    if (context != null) {
      Navigator.of(context).popUntil((route) {
        // This is a simplified check - in production you'd match route names
        return route.isFirst || condition(_currentRoute ?? '');
      });
    }
  }
  
  /// Gets route parameters for a specific route
  Map<String, dynamic>? getRouteParams(String routeName) {
    return _routeParams[routeName];
  }
  
  /// Finds a route by name in the navigation schema
  Map<String, dynamic>? _findRoute(String routeName) {
    if (_navigationSchema == null) return null;
    
    final routes = _navigationSchema!['routes'] as List<dynamic>?;
    if (routes == null) return null;
    
    for (final route in routes) {
      if (route is Map<String, dynamic>) {
        final name = route['name'] as String?;
        if (name == routeName) {
          return route;
        }
      }
    }
    
    return null;
  }
  
  /// Extracts route parameters from a path
  Map<String, dynamic> extractPathParams(String path, String pattern) {
    final params = <String, dynamic>{};
    
    // Simple parameter extraction (e.g., /users/:id -> /users/123)
    final patternParts = pattern.split('/');
    final pathParts = path.split('/');
    
    if (patternParts.length != pathParts.length) {
      return params;
    }
    
    for (int i = 0; i < patternParts.length; i++) {
      final patternPart = patternParts[i];
      if (patternPart.startsWith(':')) {
        final paramName = patternPart.substring(1);
        params[paramName] = pathParts[i];
      }
    }
    
    return params;
  }
  
  /// Adds a navigation state change listener
  void addListener(VoidCallback listener) {
    _listeners.add(listener);
  }
  
  /// Removes a navigation state change listener
  void removeListener(VoidCallback listener) {
    _listeners.remove(listener);
  }
  
  /// Notifies all listeners of navigation state changes
  void _notifyListeners() {
    for (final listener in _listeners) {
      try {
        listener();
      } catch (e) {
        developer.log(
          'Error in navigation listener: $e',
          name: 'NavigationManager',
          level: 900,
        );
      }
    }
  }
  
  /// Clears navigation history
  void clearHistory() {
    _history.clear();
    _currentIndex = -1;
    _currentRoute = null;
    _currentParams = {};
    _routeParams.clear();
    
    developer.log('Navigation history cleared', name: 'NavigationManager');
    
    _notifyListeners();
  }
  
  /// Gets the initial route from navigation schema
  String? getInitialRoute() {
    if (_navigationSchema == null) return null;
    return _navigationSchema!['initialRoute'] as String?;
  }
  
  /// Builds a MaterialApp with navigation support
  MaterialApp buildNavigationApp({
    required Widget Function(String routeName, Map<String, dynamic> params) routeBuilder,
    String? title,
    ThemeData? theme,
  }) {
    final initialRoute = getInitialRoute() ?? '/';
    
    return MaterialApp(
      title: title ?? 'App',
      theme: theme,
      navigatorKey: navigatorKey,
      initialRoute: initialRoute,
      onGenerateRoute: (settings) {
        final routeName = settings.name ?? initialRoute;
        final args = settings.arguments as Map<String, dynamic>?;
        
        // Find route in schema
        final route = _findRoute(routeName);
        if (route == null) {
          developer.log(
            'Route not found: $routeName',
            name: 'NavigationManager',
            level: 900,
          );
          return null;
        }
        
        // Extract path parameters if needed
        final path = route['path'] as String?;
        Map<String, dynamic> params = args ?? {};
        if (path != null && path.contains(':')) {
          final pathParams = extractPathParams(routeName, path);
          params = {...params, ...pathParams};
        }
        
        // Build widget using route builder
        final widget = routeBuilder(routeName, params);
        
        // Apply transition if specified
        final transition = route['transition'] as Map<String, dynamic>?;
        if (transition != null) {
          return _buildPageRouteWithTransition(widget, transition, settings);
        }
        
        return MaterialPageRoute(
          builder: (context) => widget,
          settings: settings,
        );
      },
    );
  }
  
  /// Builds a PageRoute with custom transition
  PageRoute _buildPageRouteWithTransition(
    Widget widget,
    Map<String, dynamic> transition,
    RouteSettings settings,
  ) {
    final type = transition['type'] as String? ?? 'material';
    final duration = transition['duration'] as int? ?? 300;
    
    return PageRouteBuilder(
      pageBuilder: (context, animation, secondaryAnimation) => widget,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return _buildTransition(type, animation, child);
      },
      transitionDuration: Duration(milliseconds: duration),
      settings: settings,
    );
  }
  
  /// Builds a transition animation
  Widget _buildTransition(String type, Animation<double> animation, Widget child) {
    switch (type) {
      case 'fade':
        return FadeTransition(
          opacity: animation,
          child: child,
        );
      
      case 'slide':
      case 'slideRight':
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(-1.0, 0.0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        );
      
      case 'slideLeft':
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(1.0, 0.0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        );
      
      case 'slideUp':
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.0, 1.0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        );
      
      case 'slideDown':
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.0, -1.0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        );
      
      case 'scale':
        return ScaleTransition(
          scale: animation,
          child: child,
        );
      
      default:
        // Material or unknown - use default
        return child;
    }
  }
  
  /// Disposes the navigation manager
  void dispose() {
    _listeners.clear();
    _history.clear();
    _routeParams.clear();
    _routeBuilders.clear();
  }
}

/// Navigation history entry
class NavigationHistoryEntry {
  final String route;
  final Map<String, dynamic> params;
  final int timestamp;
  
  NavigationHistoryEntry({
    required this.route,
    required this.params,
    required this.timestamp,
  });
  
  @override
  String toString() {
    return 'NavigationHistoryEntry(route: $route, params: $params, timestamp: $timestamp)';
  }
}
