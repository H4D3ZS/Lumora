# Navigation System

The Lumora navigation system provides a framework-agnostic way to define and manage application routing and navigation. It supports both React Router and Flutter Navigator patterns, with conversion between them.

## Overview

The navigation schema allows you to define:
- Routes with parameters and metadata
- Navigation transitions and animations
- Deep linking configuration
- Navigation guards for route protection
- Multiple navigation modes (stack, tabs, drawer, etc.)

## Core Concepts

### NavigationSchema

The root navigation configuration for an application:

```typescript
interface NavigationSchema {
  routes: Route[];              // All application routes
  initialRoute: string;         // Starting route
  transitions?: TransitionConfig; // Global transitions
  mode?: NavigationMode;        // Navigation mode
  deepLinking?: DeepLinkingConfig; // Deep link config
  guards?: NavigationGuard[];   // Route guards
}
```

### Route

Individual route definition with full configuration:

```typescript
interface Route {
  name: string;                 // Unique identifier
  path: string;                 // URL pattern
  component: string;            // Component to render
  params?: RouteParam[];        // Route parameters
  queryParams?: RouteParam[];   // Query parameters
  transition?: TransitionConfig; // Route-specific transition
  meta?: RouteMeta;            // Metadata
  children?: Route[];          // Nested routes
  aliases?: string[];          // Alternative paths
  redirect?: RouteRedirect;    // Redirect config
}
```

### TransitionConfig

Animation configuration for route transitions:

```typescript
interface TransitionConfig {
  type: TransitionType;         // Transition type
  duration?: number;            // Duration in ms
  easing?: EasingFunction;      // Easing function
  properties?: TransitionProperties; // Custom properties
}
```

## Usage Examples

### Basic Navigation Schema

```typescript
const navigationSchema: NavigationSchema = {
  routes: [
    {
      name: 'home',
      path: '/',
      component: 'HomeScreen',
      meta: {
        title: 'Home'
      }
    },
    {
      name: 'profile',
      path: '/profile/:userId',
      component: 'ProfileScreen',
      params: [
        {
          name: 'userId',
          type: 'string',
          required: true,
          description: 'User ID to display'
        }
      ],
      meta: {
        title: 'User Profile',
        requiresAuth: true
      }
    }
  ],
  initialRoute: 'home',
  transitions: {
    type: 'slide',
    duration: 300,
    easing: 'easeInOut'
  }
};
```

### Route with Parameters

```typescript
const userRoute: Route = {
  name: 'userDetail',
  path: '/users/:id',
  component: 'UserDetailScreen',
  params: [
    {
      name: 'id',
      type: 'string',
      required: true,
      pattern: '^[0-9]+$',
      description: 'Numeric user ID'
    }
  ],
  queryParams: [
    {
      name: 'tab',
      type: 'string',
      required: false,
      defaultValue: 'overview',
      description: 'Active tab'
    }
  ]
};
```

### Nested Routes

```typescript
const settingsRoute: Route = {
  name: 'settings',
  path: '/settings',
  component: 'SettingsScreen',
  children: [
    {
      name: 'settingsProfile',
      path: '/settings/profile',
      component: 'ProfileSettingsScreen'
    },
    {
      name: 'settingsPrivacy',
      path: '/settings/privacy',
      component: 'PrivacySettingsScreen'
    }
  ]
};
```

### Route with Guards

```typescript
const navigationSchema: NavigationSchema = {
  routes: [
    {
      name: 'admin',
      path: '/admin',
      component: 'AdminScreen',
      meta: {
        requiresAuth: true,
        permissions: ['admin']
      }
    }
  ],
  guards: [
    {
      name: 'authGuard',
      type: 'before',
      handler: 'checkAuthentication',
      priority: 100
    },
    {
      name: 'permissionGuard',
      type: 'before',
      routes: ['admin'],
      handler: 'checkPermissions',
      priority: 90
    }
  ],
  initialRoute: 'home'
};
```

### Custom Transitions

```typescript
const fadeTransition: TransitionConfig = {
  type: 'fade',
  duration: 250,
  easing: 'easeOut'
};

const slideTransition: TransitionConfig = {
  type: 'slideRight',
  duration: 300,
  easing: 'fastOutSlowIn',
  properties: {
    reversible: true
  }
};

const customRoute: Route = {
  name: 'modal',
  path: '/modal',
  component: 'ModalScreen',
  transition: fadeTransition
};
```

### Deep Linking

```typescript
const navigationSchema: NavigationSchema = {
  routes: [
    {
      name: 'product',
      path: '/products/:id',
      component: 'ProductScreen',
      params: [
        {
          name: 'id',
          type: 'string',
          required: true
        }
      ]
    }
  ],
  deepLinking: {
    enabled: true,
    scheme: 'myapp',
    host: 'example.com',
    pathPrefix: '/app',
    handlers: [
      {
        pattern: '/products/:id',
        handler: 'handleProductLink',
        route: 'product'
      }
    ]
  },
  initialRoute: 'home'
};
```

### Tab Navigation

```typescript
const tabNavigation: NavigationSchema = {
  mode: 'tabs',
  routes: [
    {
      name: 'homeTab',
      path: '/home',
      component: 'HomeScreen',
      meta: {
        icon: 'home',
        title: 'Home'
      }
    },
    {
      name: 'searchTab',
      path: '/search',
      component: 'SearchScreen',
      meta: {
        icon: 'search',
        title: 'Search'
      }
    },
    {
      name: 'profileTab',
      path: '/profile',
      component: 'ProfileScreen',
      meta: {
        icon: 'person',
        title: 'Profile'
      }
    }
  ],
  initialRoute: 'homeTab'
};
```

## Navigation Modes

### Stack Navigation
Standard push/pop navigation (default):
```typescript
{ mode: 'stack' }
```

### Tab Navigation
Bottom tab bar navigation:
```typescript
{ mode: 'tabs' }
```

### Drawer Navigation
Side drawer/menu navigation:
```typescript
{ mode: 'drawer' }
```

### Modal Navigation
Modal/overlay navigation:
```typescript
{ mode: 'modal' }
```

## Transition Types

Available transition types:
- `slide` - Horizontal slide (platform default)
- `fade` - Fade in/out
- `scale` - Scale up/down
- `slideUp` - Slide from bottom
- `slideDown` - Slide from top
- `slideLeft` - Slide from right
- `slideRight` - Slide from left
- `cupertino` - iOS-style transition
- `material` - Material Design transition
- `custom` - Custom transition
- `none` - No transition

## Route Parameters

### Path Parameters

Defined in the path using `:paramName`:
```typescript
path: '/users/:userId/posts/:postId'
```

### Query Parameters

Optional parameters passed in URL query string:
```typescript
queryParams: [
  {
    name: 'sort',
    type: 'string',
    required: false,
    defaultValue: 'date'
  }
]
```

### Parameter Types

Supported parameter types:
- `string` - Text value
- `number` - Numeric value
- `boolean` - True/false
- `array` - Array of values
- `object` - Complex object

### Parameter Validation

Use patterns for validation:
```typescript
{
  name: 'id',
  type: 'string',
  pattern: '^[0-9]+$',  // Only digits
  required: true
}
```

## Navigation Guards

Guards allow you to protect routes and execute logic before/after navigation:

### Guard Types

- `before` - Runs before navigation
- `after` - Runs after navigation
- `resolve` - Runs during route resolution

### Guard Example

```typescript
{
  name: 'authGuard',
  type: 'before',
  routes: ['profile', 'settings'],  // Apply to specific routes
  handler: 'checkAuth',
  priority: 100  // Higher priority runs first
}
```

## Route Metadata

Store additional information about routes:

```typescript
meta: {
  title: 'Page Title',
  requiresAuth: true,
  permissions: ['read', 'write'],
  icon: 'home',
  badge: 5,
  // Custom properties
  analytics: {
    pageView: 'home_screen'
  }
}
```

## Framework Conversion

### React Router → Navigation Schema

```typescript
// React Router
<Route path="/users/:id" element={<UserScreen />} />

// Converts to
{
  name: 'user',
  path: '/users/:id',
  component: 'UserScreen',
  params: [
    { name: 'id', type: 'string', required: true }
  ]
}
```

### Flutter Navigator → Navigation Schema

```dart
// Flutter
Navigator.pushNamed(context, '/users/123');

// Converts to
{
  name: 'user',
  path: '/users/:id',
  component: 'UserScreen',
  params: [
    { name: 'id', type: 'string', required: true }
  ]
}
```

## Best Practices

1. **Use Descriptive Names**: Route names should be clear and descriptive
   ```typescript
   name: 'userProfile'  // Good
   name: 'up'          // Bad
   ```

2. **Define Parameters**: Always define route parameters with types
   ```typescript
   params: [
     { name: 'id', type: 'string', required: true }
   ]
   ```

3. **Add Metadata**: Include useful metadata for each route
   ```typescript
   meta: {
     title: 'User Profile',
     requiresAuth: true
   }
   ```

4. **Use Guards**: Protect sensitive routes with guards
   ```typescript
   guards: [
     { name: 'authGuard', type: 'before', handler: 'checkAuth' }
   ]
   ```

5. **Configure Transitions**: Define smooth transitions for better UX
   ```typescript
   transitions: {
     type: 'slide',
     duration: 300,
     easing: 'easeInOut'
   }
   ```

6. **Handle Deep Links**: Configure deep linking for better user experience
   ```typescript
   deepLinking: {
     enabled: true,
     scheme: 'myapp'
   }
   ```

## API Reference

See `navigation-types.ts` for complete type definitions.

## Related

- [Route Parsing](./route-parser.ts) - Parse route patterns
- [Navigation Converter](./navigation-converter.ts) - Convert between frameworks
- [Navigation Runtime](../../packages/lumora_runtime/lib/src/navigation/) - Runtime navigation support
