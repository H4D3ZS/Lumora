/**
 * Navigation System Example
 * Demonstrates how to use the navigation schema and route parser
 */

import {
  NavigationSchema,
  Route,
  TransitionConfig,
  NavigationGuard,
  RouteParser,
} from '../src/navigation';

// Example 1: Basic Navigation Schema
const basicNavigation: NavigationSchema = {
  routes: [
    {
      name: 'home',
      path: '/',
      component: 'HomeScreen',
      meta: {
        title: 'Home',
      },
    },
    {
      name: 'about',
      path: '/about',
      component: 'AboutScreen',
      meta: {
        title: 'About Us',
      },
    },
  ],
  initialRoute: 'home',
  mode: 'stack',
};

// Example 2: Routes with Parameters
const userRoutes: Route[] = [
  {
    name: 'userList',
    path: '/users',
    component: 'UserListScreen',
    meta: {
      title: 'Users',
    },
  },
  {
    name: 'userDetail',
    path: '/users/:id',
    component: 'UserDetailScreen',
    params: [
      {
        name: 'id',
        type: 'string',
        required: true,
        pattern: '^[0-9]+$',
        description: 'User ID',
      },
    ],
    queryParams: [
      {
        name: 'tab',
        type: 'string',
        required: false,
        defaultValue: 'overview',
        description: 'Active tab',
      },
    ],
    meta: {
      title: 'User Profile',
      requiresAuth: true,
    },
  },
  {
    name: 'userPosts',
    path: '/users/:userId/posts/:postId',
    component: 'PostDetailScreen',
    params: [
      {
        name: 'userId',
        type: 'string',
        required: true,
      },
      {
        name: 'postId',
        type: 'string',
        required: true,
      },
    ],
    meta: {
      title: 'Post Detail',
    },
  },
];

// Example 3: Nested Routes
const settingsRoute: Route = {
  name: 'settings',
  path: '/settings',
  component: 'SettingsScreen',
  meta: {
    title: 'Settings',
    requiresAuth: true,
  },
  children: [
    {
      name: 'settingsProfile',
      path: '/settings/profile',
      component: 'ProfileSettingsScreen',
      meta: {
        title: 'Profile Settings',
      },
    },
    {
      name: 'settingsPrivacy',
      path: '/settings/privacy',
      component: 'PrivacySettingsScreen',
      meta: {
        title: 'Privacy Settings',
      },
    },
    {
      name: 'settingsNotifications',
      path: '/settings/notifications',
      component: 'NotificationSettingsScreen',
      meta: {
        title: 'Notification Settings',
      },
    },
  ],
};

// Example 4: Custom Transitions
const fadeTransition: TransitionConfig = {
  type: 'fade',
  duration: 250,
  easing: 'easeOut',
};

const slideTransition: TransitionConfig = {
  type: 'slideRight',
  duration: 300,
  easing: 'fastOutSlowIn',
  properties: {
    reversible: true,
  },
};

const modalRoute: Route = {
  name: 'modal',
  path: '/modal',
  component: 'ModalScreen',
  transition: fadeTransition,
  meta: {
    title: 'Modal',
  },
};

// Example 5: Navigation Guards
const authGuard: NavigationGuard = {
  name: 'authGuard',
  type: 'before',
  handler: 'checkAuthentication',
  priority: 100,
};

const permissionGuard: NavigationGuard = {
  name: 'permissionGuard',
  type: 'before',
  routes: ['admin', 'settings'],
  handler: 'checkPermissions',
  priority: 90,
};

// Example 6: Complete Navigation Schema with Guards
const completeNavigation: NavigationSchema = {
  routes: [
    ...userRoutes,
    settingsRoute,
    modalRoute,
    {
      name: 'admin',
      path: '/admin',
      component: 'AdminScreen',
      meta: {
        title: 'Admin Panel',
        requiresAuth: true,
        permissions: ['admin'],
      },
    },
  ],
  initialRoute: 'userList',
  mode: 'stack',
  transitions: slideTransition,
  guards: [authGuard, permissionGuard],
  deepLinking: {
    enabled: true,
    scheme: 'myapp',
    host: 'example.com',
    pathPrefix: '/app',
    handlers: [
      {
        pattern: '/users/:id',
        handler: 'handleUserLink',
        route: 'userDetail',
      },
    ],
  },
};

// Example 7: Tab Navigation
const tabNavigation: NavigationSchema = {
  mode: 'tabs',
  routes: [
    {
      name: 'homeTab',
      path: '/home',
      component: 'HomeScreen',
      meta: {
        icon: 'home',
        title: 'Home',
      },
    },
    {
      name: 'searchTab',
      path: '/search',
      component: 'SearchScreen',
      meta: {
        icon: 'search',
        title: 'Search',
      },
    },
    {
      name: 'notificationsTab',
      path: '/notifications',
      component: 'NotificationsScreen',
      meta: {
        icon: 'notifications',
        title: 'Notifications',
        badge: 5,
      },
    },
    {
      name: 'profileTab',
      path: '/profile',
      component: 'ProfileScreen',
      meta: {
        icon: 'person',
        title: 'Profile',
      },
    },
  ],
  initialRoute: 'homeTab',
};

// Example 8: Using RouteParser

// Extract parameters from a path pattern
const params = RouteParser.extractParameters('/users/:id/posts/:postId');
console.log('Extracted parameters:', params);
// Output: [
//   { name: 'id', type: 'string', required: true, ... },
//   { name: 'postId', type: 'string', required: true, ... }
// ]

// Match a URL path against a route pattern
const matchResult = RouteParser.matchPath('/users/:id', '/users/123');
console.log('Match result:', matchResult);
// Output: { id: '123' }

// Find the best matching route
const match = RouteParser.findMatchingRoute(userRoutes, '/users/123');
console.log('Matched route:', match?.route.name);
console.log('Extracted params:', match?.params);
// Output: route: 'userDetail', params: { id: '123' }

// Build a path from route and parameters
const userRoute = userRoutes.find(r => r.name === 'userDetail')!;
const path = RouteParser.buildPath(
  userRoute,
  { id: '123' },
  { tab: 'posts' }
);
console.log('Built path:', path);
// Output: '/users/123?tab=posts'

// Parse query string
const query = RouteParser.parseQueryString('/users?sort=name&page=2');
console.log('Query params:', query);
// Output: { sort: 'name', page: '2' }

// Validate parameters
const validation = RouteParser.validateParameters(
  { id: '123' },
  userRoute.params || []
);
console.log('Validation result:', validation);
// Output: { valid: true, errors: [] }

// Normalize path
const normalized = RouteParser.normalizePath('/users/123/');
console.log('Normalized path:', normalized);
// Output: '/users/123'

// Check if path is dynamic
const isDynamic = RouteParser.isDynamicPath('/users/:id');
console.log('Is dynamic:', isDynamic);
// Output: true

// Example 9: Wildcard Routes
const fileRoute: Route = {
  name: 'files',
  path: '/files/*path',
  component: 'FileViewerScreen',
  params: [
    {
      name: 'path',
      type: 'string',
      required: false,
      description: 'File path',
    },
  ],
};

const fileMatch = RouteParser.matchPath('/files/*path', '/files/docs/readme.md');
console.log('File match:', fileMatch);
// Output: { path: 'docs/readme.md' }

// Example 10: Route Aliases and Redirects
const productRoute: Route = {
  name: 'product',
  path: '/products/:id',
  component: 'ProductScreen',
  aliases: ['/items/:id', '/p/:id'],
  params: [
    {
      name: 'id',
      type: 'string',
      required: true,
    },
  ],
  redirect: {
    to: '/products/:id/details',
    replace: false,
    condition: 'isOldVersion',
  },
};

export {
  basicNavigation,
  userRoutes,
  settingsRoute,
  completeNavigation,
  tabNavigation,
  fadeTransition,
  slideTransition,
  authGuard,
  permissionGuard,
};

// Example 11: Converting React Router to Navigation Schema
import { NavigationConverter } from '../src/navigation';

const converter = new NavigationConverter();

// React Router source code
const reactRouterSource = `
  import { Routes, Route } from 'react-router-dom';
  import Home from './Home';
  import About from './About';
  import User from './User';
  import Post from './Post';

  function App() {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users/:id" element={<User />} />
        <Route path="/users/:userId/posts/:postId" element={<Post />} />
      </Routes>
    );
  }
`;

// Convert React Router to Navigation Schema
const reactSchema = converter.convertReactRouter(reactRouterSource);
console.log('React Router Schema:', JSON.stringify(reactSchema, null, 2));
// Output: Navigation schema with routes extracted from React Router

// Example 12: Converting Flutter Navigator to Navigation Schema

// Flutter Navigator source code
const flutterNavigatorSource = `
  MaterialApp(
    initialRoute: '/',
    routes: {
      '/': (context) => HomeScreen(),
      '/about': (context) => AboutScreen(),
      '/users/:id': (context) => UserScreen(),
      '/settings': (context) => SettingsScreen(),
    },
    theme: ThemeData(
      pageTransitionsTheme: PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoTransitionsBuilder(),
        },
      ),
    ),
  )
`;

// Convert Flutter Navigator to Navigation Schema
const flutterSchema = converter.convertFlutterNavigator(flutterNavigatorSource);
console.log('Flutter Navigator Schema:', JSON.stringify(flutterSchema, null, 2));
// Output: Navigation schema with routes extracted from Flutter Navigator

// Example 13: Generating React Router Code from Schema

const schemaToConvert: NavigationSchema = {
  routes: [
    {
      name: 'home',
      path: '/',
      component: 'Home',
    },
    {
      name: 'users',
      path: '/users/:id',
      component: 'User',
      params: [
        {
          name: 'id',
          type: 'string',
          required: true,
        },
      ],
    },
    {
      name: 'dashboard',
      path: '/dashboard',
      component: 'Dashboard',
      children: [
        {
          name: 'profile',
          path: 'profile',
          component: 'Profile',
        },
        {
          name: 'settings',
          path: 'settings',
          component: 'Settings',
        },
      ],
    },
  ],
  initialRoute: '/',
  guards: [
    {
      name: 'AuthGuard',
      type: 'before',
      handler: 'checkAuth',
      priority: 100,
    },
  ],
};

// Generate React Router code
const reactRouterCode = converter.generateReactRouter(schemaToConvert);
console.log('Generated React Router Code:');
console.log(reactRouterCode);
/* Output:
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import User from './User';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Settings from './Settings';

// Guard: AuthGuard
function AuthGuard({ children }: { children: React.ReactNode }) {
  // TODO: Implement checkAuth
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users/:id" element={<User />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
*/

// Example 14: Generating Flutter Navigator Code from Schema

// Generate Flutter Navigator code
const flutterNavigatorCode = converter.generateFlutterNavigator(schemaToConvert);
console.log('Generated Flutter Navigator Code:');
console.log(flutterNavigatorCode);
/* Output:
import 'package:flutter/material.dart';
import 'package:app/screens/home.dart';
import 'package:app/screens/user.dart';
import 'package:app/screens/dashboard.dart';
import 'package:app/screens/profile.dart';
import 'package:app/screens/settings.dart';

class AppNavigator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      initialRoute: '/',
      routes: {
        '/': (context) => Home(),
        '/users/:id': (context) => User(),
        '/dashboard': (context) => Dashboard(),
        'profile': (context) => Profile(),
        'settings': (context) => Settings(),
      },
    );
  }
}
*/

// Example 15: Round-trip Conversion (React → Schema → Flutter)

// Start with React Router code
const originalReactCode = `
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/products/:id" element={<Product />} />
  </Routes>
`;

// Convert to schema
const intermediateSchema = converter.convertReactRouter(originalReactCode);

// Generate Flutter code from schema
const generatedFlutterCode = converter.generateFlutterNavigator(intermediateSchema);

console.log('Round-trip conversion (React → Schema → Flutter):');
console.log(generatedFlutterCode);

// Example 16: Extracting Routes from Navigator.pushNamed calls

const flutterCodeWithPushNamed = `
  class MyApp extends StatelessWidget {
    void navigateToProfile() {
      Navigator.pushNamed(context, '/profile');
    }
    
    void navigateToSettings() {
      Navigator.pushNamed(context, '/settings/privacy');
    }
    
    void navigateToUser(String userId) {
      Navigator.pushNamed(context, '/users/$userId');
    }
  }
`;

const extractedSchema = converter.convertFlutterNavigator(flutterCodeWithPushNamed);
console.log('Extracted routes from pushNamed calls:');
console.log(JSON.stringify(extractedSchema.routes, null, 2));
// Output: Routes inferred from Navigator.pushNamed calls with auto-generated component names

// Example 17: Complex Nested Routes with Guards

const complexReactRouter = `
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="about" element={<About />} />
      
      <ProtectedRoute path="dashboard" element={<Dashboard />}>
        <Route path="overview" element={<Overview />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </ProtectedRoute>
      
      <Route path="users">
        <Route index element={<UserList />} />
        <Route path=":id" element={<UserDetail />} />
        <Route path=":id/edit" element={<UserEdit />} />
      </Route>
    </Route>
  </Routes>
`;

const complexSchema = converter.convertReactRouter(complexReactRouter);
console.log('Complex nested routes with guards:');
console.log(JSON.stringify(complexSchema, null, 2));

export {
  converter,
  reactSchema,
  flutterSchema,
  schemaToConvert,
  reactRouterCode,
  flutterNavigatorCode,
};
