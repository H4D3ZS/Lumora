# Navigation Runtime Implementation

## Overview

This document describes the implementation of navigation runtime support in the Lumora Flutter Dev Client. The navigation system enables dynamic routing, state preservation, parameter passing, and back navigation based on the Lumora IR navigation schema.

## Architecture

### Components

1. **NavigationManager** (`navigation_manager.dart`)
   - Manages navigation state and history
   - Handles route registration and resolution
   - Provides navigation methods (push, pop, replace, popToRoot)
   - Supports route parameters and transitions
   - Maintains navigation history stack

2. **SchemaInterpreter Integration**
   - Parses navigation schema from Lumora IR
   - Handles navigation actions in event handlers
   - Resolves navigation-related template variables
   - Integrates with EventBridge for navigation events

## Features

### 1. Route Management

The NavigationManager maintains a registry of routes defined in the navigation schema:

```dart
{
  "navigation": {
    "routes": [
      {
        "name": "home",
        "path": "/",
        "component": "HomeScreen"
      },
      {
        "name": "userProfile",
        "path": "/users/:id",
        "component": "UserProfileScreen",
        "params": [
          {
            "name": "id",
            "type": "string",
            "required": true
          }
        ]
      }
    ],
    "initialRoute": "/"
  }
}
```

### 2. Navigation Actions

Navigation actions can be triggered from UI events:

#### String Format
```dart
{
  "type": "Button",
  "props": {
    "title": "Go to Profile",
    "onTap": "navigate:profile"
  }
}
```

#### With Parameters
```dart
{
  "type": "Button",
  "props": {
    "title": "View User",
    "onTap": "navigate:userProfile?id=123&source=home"
  }
}
```

#### Object Format
```dart
{
  "type": "Button",
  "props": {
    "title": "View Details",
    "onTap": {
      "action": "navigate",
      "route": "details",
      "params": {
        "id": "123",
        "source": "home"
      }
    }
  }
}
```

#### Back Navigation
```dart
{
  "type": "Button",
  "props": {
    "title": "Go Back",
    "onTap": "goBack"
  }
}
```

#### Replace Navigation
```dart
{
  "type": "Button",
  "props": {
    "title": "Login",
    "onTap": "replace:login"
  }
}
```

#### Pop to Root
```dart
{
  "type": "Button",
  "props": {
    "title": "Go Home",
    "onTap": "popToRoot"
  }
}
```

### 3. Navigation History

The NavigationManager maintains a history stack of navigation entries:

```dart
class NavigationHistoryEntry {
  final String route;
  final Map<String, dynamic> params;
  final int timestamp;
}
```

Features:
- Forward and backward navigation
- History preservation during hot reload
- State restoration after app restart
- Navigation state queries (canPop, currentRoute, etc.)

### 4. Route Parameters

Route parameters are extracted from paths and passed to components:

```dart
// Route definition
{
  "name": "userProfile",
  "path": "/users/:id",
  "component": "UserProfileScreen"
}

// Navigation with parameters
navigationManager.push("userProfile", params: {"id": "123"});

// Access parameters
final params = navigationManager.currentParams;
final userId = params["id"]; // "123"
```

### 5. Transitions

Custom transitions can be defined per route or globally:

```dart
{
  "navigation": {
    "routes": [
      {
        "name": "profile",
        "path": "/profile",
        "component": "ProfileScreen",
        "transition": {
          "type": "fade",
          "duration": 300,
          "easing": "easeInOut"
        }
      }
    ],
    "transitions": {
      "type": "slide",
      "duration": 250
    }
  }
}
```

Supported transition types:
- `fade` - Fade in/out
- `slide` / `slideRight` - Slide from left
- `slideLeft` - Slide from right
- `slideUp` - Slide from bottom
- `slideDown` - Slide from top
- `scale` - Scale animation
- `material` - Material Design default
- `cupertino` - iOS-style transition

### 6. Navigation State Preservation

Navigation state is preserved during:
- Hot reload updates
- Schema delta applications
- App state restoration

The NavigationManager maintains:
- Current route name
- Current route parameters
- Navigation history stack
- Route parameter cache

## API Reference

### NavigationManager

#### Methods

```dart
// Set navigation schema
void setNavigationSchema(Map<String, dynamic> schema)

// Navigate to a route
Future<void> push(String routeName, {Map<String, dynamic>? params})

// Replace current route
Future<void> replace(String routeName, {Map<String, dynamic>? params})

// Navigate back
Future<void> pop()

// Pop to root route
Future<void> popToRoot()

// Pop until condition
Future<void> popUntil(bool Function(String routeName) condition)

// Get route parameters
Map<String, dynamic>? getRouteParams(String routeName)

// Extract path parameters
Map<String, dynamic> extractPathParams(String path, String pattern)

// Get initial route
String? getInitialRoute()

// Clear navigation history
void clearHistory()

// Add/remove listeners
void addListener(VoidCallback listener)
void removeListener(VoidCallback listener)
```

#### Properties

```dart
// Current navigation schema
Map<String, dynamic>? get navigationSchema

// Current route name
String? get currentRoute

// Current route parameters
Map<String, dynamic> get currentParams

// Navigation history
List<NavigationHistoryEntry> get history

// Can navigate back
bool get canPop

// Global navigator key
GlobalKey<NavigatorState> navigatorKey
```

### SchemaInterpreter Navigation Methods

```dart
// Get current route
String? getCurrentRoute()

// Get current route parameters
Map<String, dynamic> getCurrentRouteParams()

// Check if can navigate back
bool canNavigateBack()
```

## Usage Examples

### Basic Navigation

```dart
// Create navigation manager
final navigationManager = NavigationManager();

// Create interpreter with navigation support
final interpreter = SchemaInterpreter(
  navigationManager: navigationManager,
);

// Interpret schema with navigation
final schema = {
  "schemaVersion": "1.0",
  "navigation": {
    "routes": [
      {"name": "home", "path": "/", "component": "HomeScreen"},
      {"name": "profile", "path": "/profile", "component": "ProfileScreen"},
    ],
    "initialRoute": "/",
  },
  "root": {
    "type": "View",
    "props": {},
    "children": [
      {
        "type": "Button",
        "props": {
          "title": "Go to Profile",
          "onTap": "navigate:profile"
        }
      }
    ]
  }
};

final widget = interpreter.interpretSchema(schema);
```

### Navigation with Parameters

```dart
final schema = {
  "schemaVersion": "1.0",
  "navigation": {
    "routes": [
      {
        "name": "userProfile",
        "path": "/users/:id",
        "component": "UserProfileScreen",
        "params": [
          {"name": "id", "type": "string", "required": true}
        ]
      }
    ]
  },
  "root": {
    "type": "Button",
    "props": {
      "title": "View User 123",
      "onTap": "navigate:userProfile?id=123"
    }
  }
};
```

### Programmatic Navigation

```dart
// Navigate to a route
await navigationManager.push("profile");

// Navigate with parameters
await navigationManager.push("userProfile", params: {"id": "123"});

// Replace current route
await navigationManager.replace("login");

// Go back
await navigationManager.pop();

// Go to root
await navigationManager.popToRoot();

// Pop until condition
await navigationManager.popUntil((route) => route == "home");
```

### Navigation Listeners

```dart
// Add listener for navigation changes
navigationManager.addListener(() {
  print("Navigation changed to: ${navigationManager.currentRoute}");
  print("Parameters: ${navigationManager.currentParams}");
});

// Remove listener
navigationManager.removeListener(listener);
```

### Custom Transitions

```dart
final schema = {
  "navigation": {
    "routes": [
      {
        "name": "profile",
        "path": "/profile",
        "component": "ProfileScreen",
        "transition": {
          "type": "fade",
          "duration": 300,
          "easing": "easeInOut"
        }
      }
    ]
  }
};
```

## Integration with Hot Reload

Navigation state is preserved during hot reload:

1. Current route name is maintained
2. Route parameters are preserved
3. Navigation history is kept intact
4. Back navigation continues to work

When a schema update is received:
- Navigation schema is updated if changed
- Current route remains active
- History is preserved unless explicitly cleared

## Testing

### Unit Tests

See `test/navigation_manager_test.dart` for comprehensive unit tests covering:
- Schema parsing
- Route registration
- History tracking
- Parameter extraction
- Listener notifications

### Integration Tests

See `test/navigation_integration_test.dart` for integration tests covering:
- Schema interpretation with navigation
- Navigation action handling
- Parameter passing
- Back navigation
- Transition support

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

### Requirement 7.3: Navigation State Preservation
✅ Navigation state is preserved during hot reload
✅ History stack is maintained across updates
✅ Route parameters are cached and restored

### Requirement 7.4: Route Parameters
✅ Path parameters are extracted (e.g., `/users/:id`)
✅ Query parameters are parsed (e.g., `?id=123&source=home`)
✅ Parameters are passed to components
✅ Parameter types are validated

### Additional Features
✅ Back navigation support
✅ Replace navigation
✅ Pop to root
✅ Conditional pop (popUntil)
✅ Custom transitions
✅ Navigation listeners
✅ History tracking

## Future Enhancements

Potential improvements for future versions:

1. **Deep Linking**
   - Handle app URLs and universal links
   - Parse deep link parameters
   - Navigate to specific routes on app launch

2. **Navigation Guards**
   - Before navigation hooks
   - Authentication checks
   - Permission validation

3. **Nested Navigation**
   - Tab-based navigation
   - Drawer navigation
   - Bottom navigation bar

4. **Route Metadata**
   - Page titles
   - Analytics tracking
   - SEO information

5. **Advanced Transitions**
   - Shared element transitions
   - Hero animations
   - Custom transition builders

## Performance Considerations

- Route builders are cached for efficiency
- History is limited to prevent memory issues
- Transitions are hardware-accelerated
- Parameter parsing is optimized for common cases

## Security Considerations

- Route names are validated against schema
- Parameters are sanitized before use
- Navigation actions are whitelisted
- Deep links are validated before navigation

## Conclusion

The navigation runtime implementation provides a complete solution for handling navigation in the Lumora Flutter Dev Client. It supports all required features including route changes, state preservation, parameter passing, and back navigation, while maintaining compatibility with hot reload and delta updates.
