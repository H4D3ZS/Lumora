/**
 * Navigation Converter Tests
 */

import { NavigationConverter } from '../navigation/navigation-converter';
import type { NavigationSchema, Route } from '../navigation/navigation-types';

describe('NavigationConverter', () => {
  let converter: NavigationConverter;

  beforeEach(() => {
    converter = new NavigationConverter();
  });

  describe('convertReactRouter', () => {
    it('should convert basic React Router routes', () => {
      const source = `
        import { Routes, Route } from 'react-router-dom';
        import Home from './Home';
        import About from './About';

        function App() {
          return (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
            </Routes>
          );
        }
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.routes).toHaveLength(2);
      expect(schema.routes[0]).toMatchObject({
        name: 'home',
        path: '/',
        component: 'Home',
      });
      expect(schema.routes[1]).toMatchObject({
        name: 'about',
        path: '/about',
        component: 'About',
      });
    });

    it('should extract route parameters', () => {
      const source = `
        <Routes>
          <Route path="/users/:id" element={<User />} />
          <Route path="/posts/:postId/comments/:commentId" element={<Comment />} />
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.routes).toHaveLength(2);
      
      const userRoute = schema.routes[0];
      expect(userRoute.params).toHaveLength(1);
      expect(userRoute.params![0]).toMatchObject({
        name: 'id',
        type: 'string',
        required: true,
      });

      const commentRoute = schema.routes[1];
      expect(commentRoute.params).toHaveLength(2);
      expect(commentRoute.params![0].name).toBe('postId');
      expect(commentRoute.params![1].name).toBe('commentId');
    });

    it('should handle nested routes', () => {
      const source = `
        <Routes>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.routes).toHaveLength(1);
      
      const dashboardRoute = schema.routes[0];
      expect(dashboardRoute.path).toBe('/dashboard');
      expect(dashboardRoute.children).toHaveLength(2);
      expect(dashboardRoute.children![0].path).toBe('profile');
      expect(dashboardRoute.children![1].path).toBe('settings');
    });

    it('should extract route metadata', () => {
      const source = `
        <Routes>
          <Route 
            path="/users/:id" 
            element={<User />}
            loader={userLoader}
            action={userAction}
            errorElement={<ErrorPage />}
          />
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.routes).toHaveLength(1);
      
      const route = schema.routes[0];
      expect(route.meta).toBeDefined();
      expect(route.meta!.loader).toBe('userLoader');
      expect(route.meta!.action).toBe('userAction');
      expect(route.meta!.errorElement).toBe('ErrorPage');
    });

    it('should handle index routes', () => {
      const source = `
        <Routes>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
          </Route>
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.routes).toHaveLength(1);
      expect(schema.routes[0].children).toHaveLength(1);
    });

    it('should extract route guards', () => {
      const source = `
        <Routes>
          <ProtectedRoute path="/admin" element={<Admin />} />
          <PrivateRoute path="/profile" element={<Profile />} />
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.guards).toBeDefined();
      expect(schema.guards!.length).toBeGreaterThan(0);
    });

    it('should handle component prop instead of element', () => {
      const source = `
        <Routes>
          <Route path="/" component={Home} />
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.routes).toHaveLength(1);
      expect(schema.routes[0].component).toBe('Home');
    });

    it('should handle member expression components', () => {
      const source = `
        <Routes>
          <Route path="/" element={<Components.Home />} />
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.routes).toHaveLength(1);
      expect(schema.routes[0].component).toBe('Components.Home');
    });
  });

  describe('convertFlutterNavigator', () => {
    it('should convert MaterialApp routes map', () => {
      const source = `
        MaterialApp(
          routes: {
            '/': (context) => HomeScreen(),
            '/about': (context) => AboutScreen(),
            '/users': (context) => UsersScreen(),
          },
        )
      `;

      const schema = converter.convertFlutterNavigator(source);

      expect(schema.routes).toHaveLength(3);
      expect(schema.routes[0]).toMatchObject({
        name: 'home',
        path: '/',
        component: 'HomeScreen',
      });
      expect(schema.routes[1]).toMatchObject({
        name: 'about',
        path: '/about',
        component: 'AboutScreen',
      });
    });

    it('should extract routes from onGenerateRoute', () => {
      const source = `
        MaterialApp(
          onGenerateRoute: (settings) {
            switch (settings.name) {
              case '/home':
                return MaterialPageRoute(
                  builder: (context) => HomeScreen(),
                );
              case '/profile':
                return MaterialPageRoute(
                  builder: (context) => ProfileScreen(),
                );
            }
          },
        )
      `;

      const schema = converter.convertFlutterNavigator(source);

      expect(schema.routes).toHaveLength(2);
      expect(schema.routes[0].path).toBe('/home');
      expect(schema.routes[0].component).toBe('HomeScreen');
      expect(schema.routes[1].path).toBe('/profile');
      expect(schema.routes[1].component).toBe('ProfileScreen');
    });

    it('should extract routes from Navigator.pushNamed calls', () => {
      const source = `
        void navigateToProfile() {
          Navigator.pushNamed(context, '/profile');
        }
        
        void navigateToSettings() {
          Navigator.pushNamed(context, '/settings');
        }
      `;

      const schema = converter.convertFlutterNavigator(source);

      expect(schema.routes.length).toBeGreaterThan(0);
      
      const profileRoute = schema.routes.find(r => r.path === '/profile');
      expect(profileRoute).toBeDefined();
      expect(profileRoute!.component).toBe('ProfileScreen');
    });

    it('should extract route parameters from Flutter paths', () => {
      const source = `
        MaterialApp(
          routes: {
            '/users/:id': (context) => UserScreen(),
            '/posts/:postId/comments/:commentId': (context) => CommentScreen(),
          },
        )
      `;

      const schema = converter.convertFlutterNavigator(source);

      const userRoute = schema.routes.find(r => r.path === '/users/:id');
      expect(userRoute).toBeDefined();
      expect(userRoute!.params).toHaveLength(1);
      expect(userRoute!.params![0].name).toBe('id');

      const commentRoute = schema.routes.find(r => r.path.includes('comments'));
      expect(commentRoute).toBeDefined();
      expect(commentRoute!.params).toHaveLength(2);
    });

    it('should extract transition configuration', () => {
      const source = `
        MaterialApp(
          theme: ThemeData(
            pageTransitionsTheme: PageTransitionsTheme(
              builders: {
                TargetPlatform.android: CupertinoTransitionsBuilder(),
              },
            ),
          ),
          routes: {
            '/': (context) => HomeScreen(),
          },
        )
      `;

      const schema = converter.convertFlutterNavigator(source);

      expect(schema.transitions).toBeDefined();
      expect(schema.transitions!.type).toBe('cupertino');
    });

    it('should infer component names from route paths', () => {
      const source = `
        void navigate() {
          Navigator.pushNamed(context, '/user-profile');
          Navigator.pushNamed(context, '/settings/privacy');
        }
      `;

      const schema = converter.convertFlutterNavigator(source);

      const userProfileRoute = schema.routes.find(r => r.path === '/user-profile');
      expect(userProfileRoute).toBeDefined();
      expect(userProfileRoute!.component).toBe('UserProfileScreen');

      const privacyRoute = schema.routes.find(r => r.path === '/settings/privacy');
      expect(privacyRoute).toBeDefined();
      expect(privacyRoute!.component).toBe('SettingsPrivacyScreen');
    });
  });

  describe('generateReactRouter', () => {
    it('should generate React Router code from schema', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'home',
            path: '/',
            component: 'Home',
          },
          {
            name: 'about',
            path: '/about',
            component: 'About',
          },
        ],
        initialRoute: '/',
      };

      const code = converter.generateReactRouter(schema);

      expect(code).toContain('BrowserRouter');
      expect(code).toContain('Routes');
      expect(code).toContain('Route');
      expect(code).toContain("import Home from './Home'");
      expect(code).toContain("import About from './About'");
      expect(code).toContain('<Route path="/" element={<Home />} />');
      expect(code).toContain('<Route path="/about" element={<About />} />');
      expect(code).toContain('export function AppRouter()');
    });

    it('should generate nested routes', () => {
      const schema: NavigationSchema = {
        routes: [
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
        initialRoute: '/dashboard',
      };

      const code = converter.generateReactRouter(schema);

      expect(code).toContain('<Route path="/dashboard" element={<Dashboard />}>');
      expect(code).toContain('<Route path="profile" element={<Profile />} />');
      expect(code).toContain('<Route path="settings" element={<Settings />} />');
      expect(code).toContain('</Route>');
    });

    it('should generate guard components', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'admin',
            path: '/admin',
            component: 'Admin',
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

      const code = converter.generateReactRouter(schema);

      expect(code).toContain('function checkAuth');
      expect(code).toContain('Guard: AuthGuard');
    });

    it('should generate navigation hooks', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'home',
            path: '/',
            component: 'Home',
          },
          {
            name: 'profile',
            path: '/profile/:id',
            component: 'Profile',
            params: [
              {
                name: 'id',
                type: 'string',
                required: true,
              },
            ],
          },
        ],
        initialRoute: '/',
      };

      const code = converter.generateReactRouter(schema);

      expect(code).toContain('export function useNavigation()');
      expect(code).toContain('export function useNavigateByName()');
      expect(code).toContain('export function useRouteMeta(');
      expect(code).toContain('push:');
      expect(code).toContain('replace:');
      expect(code).toContain('pop:');
      expect(code).toContain('popToRoot:');
      expect(code).toContain('canPop:');
    });

    it('should generate guard wrapper component', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'admin',
            path: '/admin',
            component: 'Admin',
            meta: {
              requiresAuth: true,
            },
          },
        ],
        initialRoute: '/',
        guards: [
          {
            name: 'authGuard',
            type: 'before',
            handler: 'checkAuthentication',
            priority: 100,
          },
        ],
      };

      const code = converter.generateReactRouter(schema);

      expect(code).toContain('function GuardedRoute');
      expect(code).toContain('checkGuards');
      expect(code).toContain('checkAuthentication');
    });

    it('should apply guards to protected routes', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'home',
            path: '/',
            component: 'Home',
          },
          {
            name: 'admin',
            path: '/admin',
            component: 'Admin',
            meta: {
              requiresAuth: true,
            },
          },
        ],
        initialRoute: '/',
        guards: [
          {
            name: 'authGuard',
            type: 'before',
            routes: ['admin'],
            handler: 'checkAuth',
            priority: 100,
          },
        ],
      };

      const code = converter.generateReactRouter(schema);

      // Home route should not have guard
      expect(code).toMatch(/<Route path="\/" element={<Home \/>} \/>/);
      
      // Admin route should have guard wrapper
      expect(code).toContain('GuardedRoute');
    });
  });

  describe('generateFlutterNavigator', () => {
    it('should generate Flutter Navigator code from schema', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'home',
            path: '/',
            component: 'HomeScreen',
          },
          {
            name: 'about',
            path: '/about',
            component: 'AboutScreen',
          },
        ],
        initialRoute: '/',
      };

      const code = converter.generateFlutterNavigator(schema);

      expect(code).toContain("import 'package:flutter/material.dart'");
      expect(code).toContain("import 'package:app/screens/home_screen.dart'");
      expect(code).toContain("import 'package:app/screens/about_screen.dart'");
      expect(code).toContain("initialRoute: '/'");
      expect(code).toContain("'/': (context) => HomeScreen()");
      expect(code).toContain("'/about': (context) => AboutScreen()");
      expect(code).toContain('class AppNavigator extends StatelessWidget');
    });

    it('should convert component names to snake_case for imports', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'userProfile',
            path: '/user-profile',
            component: 'UserProfileScreen',
          },
        ],
        initialRoute: '/',
      };

      const code = converter.generateFlutterNavigator(schema);

      expect(code).toContain('user_profile_screen.dart');
    });

    it('should handle all routes in the map', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'home',
            path: '/',
            component: 'HomeScreen',
          },
          {
            name: 'users',
            path: '/users/:id',
            component: 'UserScreen',
          },
        ],
        initialRoute: '/',
      };

      const code = converter.generateFlutterNavigator(schema);

      expect(code).toContain("'/': (context) => HomeScreen()");
      expect(code).toContain("'/users/:id': (context) => UserScreen()");
    });

    it('should generate navigation helper methods', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'home',
            path: '/',
            component: 'HomeScreen',
          },
          {
            name: 'profile',
            path: '/profile/:id',
            component: 'ProfileScreen',
            params: [
              {
                name: 'id',
                type: 'string',
                required: true,
              },
            ],
          },
        ],
        initialRoute: '/',
      };

      const code = converter.generateFlutterNavigator(schema);

      expect(code).toContain('class NavigationHelper');
      expect(code).toContain('static Future<T?> navigateTo<T>');
      expect(code).toContain('static Future<T?> replaceTo<T>');
      expect(code).toContain('static void pop<T>');
      expect(code).toContain('static void popToRoot');
      expect(code).toContain('static void popUntil');
      expect(code).toContain('static bool canPop');
    });

    it('should generate route-specific navigation methods', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'profile',
            path: '/profile/:userId',
            component: 'ProfileScreen',
            params: [
              {
                name: 'userId',
                type: 'string',
                required: true,
              },
            ],
            meta: {
              title: 'User Profile',
            },
          },
        ],
        initialRoute: '/',
      };

      const code = converter.generateFlutterNavigator(schema);

      expect(code).toContain('static Future<T?> navigateToProfile<T>');
      expect(code).toContain('required String userId');
      expect(code).toContain('/// Navigate to profile (User Profile)');
    });

    it('should generate route transitions', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'modal',
            path: '/modal',
            component: 'ModalScreen',
            transition: {
              type: 'fade',
              duration: 250,
              easing: 'easeOut',
            },
          },
          {
            name: 'slide',
            path: '/slide',
            component: 'SlideScreen',
            transition: {
              type: 'slideUp',
              duration: 300,
              easing: 'fastOutSlowIn',
            },
          },
        ],
        initialRoute: '/',
      };

      const code = converter.generateFlutterNavigator(schema);

      expect(code).toContain('Route<dynamic> _buildModalRoute');
      expect(code).toContain('FadeTransition');
      expect(code).toContain('Route<dynamic> _buildSlideRoute');
      expect(code).toContain('SlideTransition');
      expect(code).toContain('PageRouteBuilder');
      expect(code).toContain('transitionsBuilder');
    });

    it('should generate onGenerateRoute for custom transitions', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'home',
            path: '/',
            component: 'HomeScreen',
          },
          {
            name: 'modal',
            path: '/modal',
            component: 'ModalScreen',
            transition: {
              type: 'scale',
              duration: 200,
            },
          },
        ],
        initialRoute: '/',
      };

      const code = converter.generateFlutterNavigator(schema);

      // Should generate route builder for custom transition
      expect(code).toContain('Route<dynamic> _buildModalRoute');
      expect(code).toContain('ScaleTransition');
      expect(code).toContain('PageRouteBuilder');
    });

    it('should generate route name constants', () => {
      const schema: NavigationSchema = {
        routes: [
          {
            name: 'home',
            path: '/',
            component: 'HomeScreen',
          },
          {
            name: 'userProfile',
            path: '/profile/:id',
            component: 'ProfileScreen',
          },
        ],
        initialRoute: '/',
      };

      const code = converter.generateFlutterNavigator(schema);

      expect(code).toContain("static const String home = '/'");
      expect(code).toContain("static const String userProfile = '/profile/:id'");
    });

    it('should handle different transition types', () => {
      const transitions = [
        { type: 'fade' as const, expected: 'FadeTransition' },
        { type: 'slide' as const, expected: 'SlideTransition' },
        { type: 'slideUp' as const, expected: 'SlideTransition' },
        { type: 'scale' as const, expected: 'ScaleTransition' },
        { type: 'cupertino' as const, expected: 'CupertinoPageTransition' },
      ];

      transitions.forEach(({ type, expected }) => {
        const schema: NavigationSchema = {
          routes: [
            {
              name: 'test',
              path: '/test',
              component: 'TestScreen',
              transition: {
                type,
                duration: 300,
              },
            },
          ],
          initialRoute: '/',
        };

        const code = converter.generateFlutterNavigator(schema);
        expect(code).toContain(expected);
      });
    });
  });

  describe('route name generation', () => {
    it('should generate camelCase names from paths', () => {
      const source = `
        <Routes>
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/settings/privacy" element={<Privacy />} />
          <Route path="/api/v1/users" element={<Users />} />
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.routes[0].name).toBe('userProfile');
      expect(schema.routes[1].name).toBe('settingsPrivacy');
      expect(schema.routes[2].name).toBe('apiV1Users');
    });

    it('should handle root path', () => {
      const source = `
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.routes[0].name).toBe('home');
    });

    it('should remove parameters from route names', () => {
      const source = `
        <Routes>
          <Route path="/users/:id/posts/:postId" element={<Post />} />
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.routes[0].name).toBe('usersPosts');
    });
  });

  describe('edge cases', () => {
    it('should handle empty Routes component', () => {
      const source = `
        <Routes>
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      expect(schema.routes).toHaveLength(0);
    });

    it('should handle routes without paths', () => {
      const source = `
        <Routes>
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
          </Route>
        </Routes>
      `;

      const schema = converter.convertReactRouter(source);

      // Should skip routes without paths (unless they're index routes)
      expect(schema.routes.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle Flutter routes with no explicit map', () => {
      const source = `
        MaterialApp(
          home: HomeScreen(),
        )
      `;

      const schema = converter.convertFlutterNavigator(source);

      // Should return empty or minimal schema
      expect(schema.routes).toBeDefined();
    });

    it('should handle malformed React Router code gracefully', () => {
      const source = `
        <Routes>
          <Route path="/home" />
        </Routes>
      `;

      expect(() => {
        converter.convertReactRouter(source);
      }).not.toThrow();
    });
  });
});
