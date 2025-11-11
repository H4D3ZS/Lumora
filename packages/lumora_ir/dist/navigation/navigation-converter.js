"use strict";
/**
 * Navigation Converter
 * Converts between React Router, Flutter Navigator, and Lumora Navigation Schema
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationConverter = void 0;
const parser = __importStar(require("@babel/parser"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
const route_parser_1 = require("./route-parser");
/**
 * Navigation Converter
 * Converts navigation definitions between frameworks
 */
class NavigationConverter {
    /**
     * Convert React Router routes to Navigation Schema
     *
     * @param source - React/TSX source code containing route definitions
     * @returns Navigation schema
     *
     * @example
     * ```typescript
     * const source = `
     *   <Routes>
     *     <Route path="/" element={<Home />} />
     *     <Route path="/users/:id" element={<User />} />
     *   </Routes>
     * `;
     * const schema = converter.convertReactRouter(source);
     * ```
     */
    convertReactRouter(source) {
        const ast = this.parseReactSource(source);
        const routes = this.extractReactRoutes(ast);
        const guards = this.extractReactGuards(ast);
        return {
            routes: routes.map(r => this.convertReactRouteToSchema(r)),
            initialRoute: routes.length > 0 ? routes[0].path : '/',
            guards: guards.length > 0 ? guards : undefined,
        };
    }
    /**
     * Parse React source code to AST
     */
    parseReactSource(source) {
        return parser.parse(source, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript'],
        });
    }
    /**
     * Extract React Router routes from AST
     */
    extractReactRoutes(ast) {
        const routes = [];
        (0, traverse_1.default)(ast, {
            // Find <Routes> component
            JSXElement: (path) => {
                const openingElement = path.node.openingElement;
                // Check if this is a Routes component
                if (t.isJSXIdentifier(openingElement.name) &&
                    openingElement.name.name === 'Routes') {
                    // Extract all <Route> children
                    const routeElements = this.findRouteElements(path.node.children);
                    routes.push(...routeElements);
                }
            },
        });
        return routes;
    }
    /**
     * Find Route elements in JSX children
     */
    findRouteElements(children) {
        const routes = [];
        for (const child of children) {
            if (t.isJSXElement(child)) {
                const openingElement = child.openingElement;
                if (t.isJSXIdentifier(openingElement.name) &&
                    openingElement.name.name === 'Route') {
                    const route = this.parseReactRoute(child);
                    if (route) {
                        routes.push(route);
                    }
                }
            }
        }
        return routes;
    }
    /**
     * Parse a single React Router <Route> element
     */
    parseReactRoute(element) {
        const attributes = element.openingElement.attributes;
        const route = {
            path: '',
        };
        // Extract attributes
        for (const attr of attributes) {
            if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                const name = attr.name.name;
                const value = attr.value;
                switch (name) {
                    case 'path':
                        if (t.isStringLiteral(value)) {
                            route.path = value.value;
                        }
                        break;
                    case 'element':
                        if (t.isJSXExpressionContainer(value) && t.isJSXElement(value.expression)) {
                            const componentName = this.extractComponentName(value.expression);
                            route.element = componentName;
                        }
                        break;
                    case 'component':
                        if (t.isJSXExpressionContainer(value) && t.isIdentifier(value.expression)) {
                            route.component = value.expression.name;
                        }
                        break;
                    case 'index':
                        route.index = true;
                        break;
                    case 'caseSensitive':
                        route.caseSensitive = true;
                        break;
                    case 'loader':
                        if (t.isJSXExpressionContainer(value) && t.isIdentifier(value.expression)) {
                            route.loader = value.expression.name;
                        }
                        break;
                    case 'action':
                        if (t.isJSXExpressionContainer(value) && t.isIdentifier(value.expression)) {
                            route.action = value.expression.name;
                        }
                        break;
                    case 'errorElement':
                        if (t.isJSXExpressionContainer(value) && t.isJSXElement(value.expression)) {
                            const componentName = this.extractComponentName(value.expression);
                            route.errorElement = componentName;
                        }
                        break;
                }
            }
        }
        // Extract nested routes
        if (element.children.length > 0) {
            const childRoutes = this.findRouteElements(element.children);
            if (childRoutes.length > 0) {
                route.children = childRoutes;
            }
        }
        return route.path || route.index ? route : null;
    }
    /**
     * Extract component name from JSX element
     */
    extractComponentName(element) {
        const name = element.openingElement.name;
        if (t.isJSXIdentifier(name)) {
            return name.name;
        }
        if (t.isJSXMemberExpression(name)) {
            // Handle cases like <Components.User />
            return this.serializeJSXMemberExpression(name);
        }
        return 'Component';
    }
    /**
     * Serialize JSX member expression to string
     */
    serializeJSXMemberExpression(expr) {
        const parts = [];
        let current = expr;
        while (t.isJSXMemberExpression(current)) {
            if (t.isJSXIdentifier(current.property)) {
                parts.unshift(current.property.name);
            }
            current = current.object;
        }
        if (t.isJSXIdentifier(current)) {
            parts.unshift(current.name);
        }
        return parts.join('.');
    }
    /**
     * Extract route guards from React code
     */
    extractReactGuards(ast) {
        const guards = [];
        (0, traverse_1.default)(ast, {
            // Look for ProtectedRoute or similar guard components
            JSXElement: (path) => {
                const name = path.node.openingElement.name;
                if (t.isJSXIdentifier(name)) {
                    const componentName = name.name;
                    // Common guard component names
                    if (componentName === 'ProtectedRoute' ||
                        componentName === 'PrivateRoute' ||
                        componentName === 'AuthRoute' ||
                        componentName === 'GuardedRoute') {
                        const guard = this.parseReactGuard(path.node);
                        if (guard) {
                            guards.push(guard);
                        }
                    }
                }
            },
            // Look for useEffect hooks that might be guards
            CallExpression: (path) => {
                if (t.isIdentifier(path.node.callee) &&
                    path.node.callee.name === 'useEffect') {
                    // Check if this effect is doing navigation/auth checks
                    const guard = this.parseReactEffectGuard(path.node);
                    if (guard) {
                        guards.push(guard);
                    }
                }
            },
        });
        return guards;
    }
    /**
     * Parse a React guard component
     */
    parseReactGuard(element) {
        const attributes = element.openingElement.attributes;
        const name = t.isJSXIdentifier(element.openingElement.name)
            ? element.openingElement.name.name
            : 'guard';
        let handler = 'checkAuth';
        let routes;
        for (const attr of attributes) {
            if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                const attrName = attr.name.name;
                const value = attr.value;
                if (attrName === 'check' || attrName === 'guard') {
                    if (t.isJSXExpressionContainer(value) && t.isIdentifier(value.expression)) {
                        handler = value.expression.name;
                    }
                }
            }
        }
        return {
            name,
            type: 'before',
            handler,
            routes,
            priority: 100,
        };
    }
    /**
     * Parse a React useEffect guard
     */
    parseReactEffectGuard(call) {
        // This is a simplified implementation
        // In a real scenario, we'd analyze the effect body to determine if it's a guard
        return null;
    }
    /**
     * Convert React Router route to Navigation Schema route
     */
    convertReactRouteToSchema(reactRoute) {
        const path = reactRoute.path || '/';
        const component = reactRoute.element || reactRoute.component || 'Component';
        // Generate route name from path
        const name = this.generateRouteName(path);
        // Extract parameters from path
        const params = route_parser_1.RouteParser.extractParameters(path);
        // Build route metadata
        const meta = {};
        if (reactRoute.loader) {
            meta.loader = reactRoute.loader;
        }
        if (reactRoute.action) {
            meta.action = reactRoute.action;
        }
        if (reactRoute.errorElement) {
            meta.errorElement = reactRoute.errorElement;
        }
        const route = {
            name,
            path,
            component,
            params: params.length > 0 ? params : undefined,
            meta: Object.keys(meta).length > 0 ? meta : undefined,
        };
        // Add nested routes
        if (reactRoute.children && reactRoute.children.length > 0) {
            route.children = reactRoute.children.map(child => this.convertReactRouteToSchema(child));
        }
        return route;
    }
    /**
     * Generate route name from path
     */
    generateRouteName(path) {
        if (path === '/' || path === '') {
            return 'home';
        }
        // Remove leading slash and parameters
        let name = path
            .replace(/^\//, '')
            .replace(/:\w+/g, '')
            .replace(/\*/g, '')
            .replace(/\//g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        // If empty after cleanup, use 'route'
        if (!name) {
            name = 'route';
        }
        // Convert to camelCase (handle both underscores and dashes)
        name = name
            .replace(/[-_](\w)/g, (_, letter) => letter.toUpperCase())
            .replace(/^(\w)/, (_, letter) => letter.toLowerCase());
        return name;
    }
    /**
     * Convert Flutter Navigator routes to Navigation Schema
     *
     * @param source - Dart source code containing route definitions
     * @returns Navigation schema
     *
     * @example
     * ```typescript
     * const source = `
     *   MaterialApp(
     *     routes: {
     *       '/': (context) => HomeScreen(),
     *       '/users': (context) => UsersScreen(),
     *     },
     *   )
     * `;
     * const schema = converter.convertFlutterNavigator(source);
     * ```
     */
    convertFlutterNavigator(source) {
        const routes = this.extractFlutterRoutes(source);
        const transitions = this.extractFlutterTransitions(source);
        return {
            routes: routes.map(r => this.convertFlutterRouteToSchema(r)),
            initialRoute: routes.length > 0 ? routes[0].name : '/',
            transitions: transitions || undefined,
        };
    }
    /**
     * Extract Flutter Navigator routes from source code
     */
    extractFlutterRoutes(source) {
        const routes = [];
        // Pattern 1: MaterialApp routes map
        // routes: { '/': (context) => HomeScreen(), '/users': (context) => UsersScreen() }
        const routesMapPattern = /routes:\s*\{([^}]+)\}/s;
        const routesMapMatch = routesMapPattern.exec(source);
        if (routesMapMatch) {
            const routesContent = routesMapMatch[1];
            const routePattern = /['"]([^'"]+)['"]\s*:\s*\([^)]*\)\s*=>\s*(\w+)\s*\(/g;
            let match;
            while ((match = routePattern.exec(routesContent)) !== null) {
                const path = match[1];
                const builder = match[2];
                routes.push({
                    name: path,
                    builder,
                });
            }
        }
        // Pattern 2: onGenerateRoute
        // onGenerateRoute: (settings) { switch(settings.name) { case '/home': return MaterialPageRoute(...) } }
        const onGenerateRoutePattern = /onGenerateRoute:\s*\([^)]*\)\s*\{([^}]+)\}/s;
        const onGenerateMatch = onGenerateRoutePattern.exec(source);
        if (onGenerateMatch) {
            const switchContent = onGenerateMatch[1];
            const casePattern = /case\s+['"]([^'"]+)['"]:\s*return\s+\w+\s*\([^)]*builder:\s*\([^)]*\)\s*=>\s*(\w+)\s*\(/g;
            let match;
            while ((match = casePattern.exec(switchContent)) !== null) {
                const path = match[1];
                const builder = match[2];
                // Check if route already exists
                if (!routes.find(r => r.name === path)) {
                    routes.push({
                        name: path,
                        builder,
                    });
                }
            }
        }
        // Pattern 3: Named routes with Navigator.pushNamed
        // Extract from Navigator.pushNamed(context, '/route')
        const pushNamedPattern = /Navigator\.pushNamed\s*\([^,]+,\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = pushNamedPattern.exec(source)) !== null) {
            const routeName = match[1];
            // Only add if not already in routes
            if (!routes.find(r => r.name === routeName)) {
                routes.push({
                    name: routeName,
                    builder: this.inferBuilderFromRouteName(routeName),
                });
            }
        }
        return routes;
    }
    /**
     * Infer builder/component name from route name
     */
    inferBuilderFromRouteName(routeName) {
        // Remove leading slash
        let name = routeName.replace(/^\//, '');
        // Convert to PascalCase
        name = name
            .split(/[_\-\/]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
        // Add 'Screen' suffix if not present
        if (!name.endsWith('Screen') && !name.endsWith('Page')) {
            name += 'Screen';
        }
        return name || 'HomeScreen';
    }
    /**
     * Extract Flutter transition configuration
     */
    extractFlutterTransitions(source) {
        // Look for pageTransitionsTheme in ThemeData
        // Match pattern like: CupertinoTransitionsBuilder(), FadeTransitionsBuilder(), etc.
        const transitionPattern = /(\w+)TransitionsBuilder\s*\(\s*\)/;
        const match = transitionPattern.exec(source);
        if (match) {
            const transitionType = match[1].toLowerCase();
            return this.mapFlutterTransitionType(transitionType);
        }
        return null;
    }
    /**
     * Map Flutter transition type to schema transition type
     */
    mapFlutterTransitionType(flutterType) {
        const typeMap = {
            'cupertino': {
                type: 'cupertino',
                duration: 300,
                easing: 'fastOutSlowIn',
            },
            'fade': {
                type: 'fade',
                duration: 300,
                easing: 'linear',
            },
            'zoom': {
                type: 'scale',
                duration: 300,
                easing: 'easeInOut',
            },
            'openupwards': {
                type: 'slideUp',
                duration: 300,
                easing: 'fastOutSlowIn',
            },
        };
        return typeMap[flutterType] || {
            type: 'material',
            duration: 300,
            easing: 'fastOutSlowIn',
        };
    }
    /**
     * Convert Flutter Navigator route to Navigation Schema route
     */
    convertFlutterRouteToSchema(flutterRoute) {
        const path = flutterRoute.name;
        const component = flutterRoute.builder;
        // Generate route name from path
        const name = this.generateRouteName(path);
        // Extract parameters from path
        const params = route_parser_1.RouteParser.extractParameters(path);
        // Build route metadata
        const meta = {};
        if (flutterRoute.settings?.name) {
            meta.title = flutterRoute.settings.name;
        }
        const route = {
            name,
            path,
            component,
            params: params.length > 0 ? params : undefined,
            meta: Object.keys(meta).length > 0 ? meta : undefined,
        };
        // Add transition if specified
        if (flutterRoute.transition) {
            route.transition = this.mapFlutterTransitionType(flutterRoute.transition);
        }
        return route;
    }
    /**
     * Generate React Router code from Navigation Schema
     *
     * @param schema - Navigation schema
     * @returns React Router code
     *
     * @example
     * ```typescript
     * const code = converter.generateReactRouter(schema);
     * // Returns:
     * // <BrowserRouter>
     * //   <Routes>
     * //     <Route path="/" element={<Home />} />
     * //   </Routes>
     * // </BrowserRouter>
     * ```
     */
    generateReactRouter(schema) {
        const imports = this.generateReactImports(schema);
        const routes = this.generateReactRoutes(schema.routes, '        ', schema.guards);
        const guards = schema.guards ? this.generateReactGuards(schema.guards) : '';
        const hooks = this.generateReactNavigationHooks(schema);
        const guardWrapper = schema.guards ? this.generateReactGuardWrapper(schema.guards) : '';
        return `${imports}

${guards}

${guardWrapper}

${hooks}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
${routes}
      </Routes>
    </BrowserRouter>
  );
}
`;
    }
    /**
     * Generate React imports
     */
    generateReactImports(schema) {
        const components = new Set();
        const collectComponents = (routes) => {
            routes.forEach(route => {
                components.add(route.component);
                if (route.children) {
                    collectComponents(route.children);
                }
            });
        };
        collectComponents(schema.routes);
        const componentImports = Array.from(components)
            .map(comp => `import ${comp} from './${comp}';`)
            .join('\n');
        const hasGuards = schema.guards && schema.guards.length > 0;
        return `import * as React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
${componentImports}`;
    }
    /**
     * Generate React routes JSX
     */
    generateReactRoutes(routes, indent = '        ', parentGuards) {
        return routes
            .map(route => {
            const hasChildren = route.children && route.children.length > 0;
            const requiresAuth = route.meta?.requiresAuth;
            const permissions = route.meta?.permissions;
            // Determine which guards apply to this route
            const routeGuards = parentGuards?.filter(g => !g.routes || g.routes.length === 0 || g.routes.includes(route.name)) || [];
            // Build element with guards if needed
            let element = `<${route.component} />`;
            if (routeGuards.length > 0) {
                const guardNames = routeGuards.map(g => `'${g.name}'`).join(', ');
                element = `<GuardedRoute element={${element}} guards={[${guardNames}]} />`;
            }
            if (hasChildren) {
                const childRoutes = this.generateReactRoutes(route.children, indent + '  ', routeGuards);
                return `${indent}<Route path="${route.path}" element={${element}}>
${childRoutes}
${indent}</Route>`;
            }
            else {
                return `${indent}<Route path="${route.path}" element={${element}} />`;
            }
        })
            .join('\n');
    }
    /**
     * Generate React guard components
     */
    generateReactGuards(guards) {
        return guards
            .map(guard => {
            return `// Guard: ${guard.name}
// Type: ${guard.type}
// Priority: ${guard.priority || 0}
function ${guard.handler}(to: string, from: string): boolean | Promise<boolean> {
  // TODO: Implement guard logic
  // Return true to allow navigation, false to block
  console.log('Guard ${guard.name}: navigating from', from, 'to', to);
  return true;
}`;
        })
            .join('\n\n');
    }
    /**
     * Generate React guard wrapper component
     */
    generateReactGuardWrapper(guards) {
        const sortedGuards = [...guards].sort((a, b) => (b.priority || 0) - (a.priority || 0));
        return `// Guard Wrapper Component
function GuardedRoute({ 
  element, 
  guards = [] 
}: { 
  element: React.ReactElement; 
  guards?: string[];
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAllowed, setIsAllowed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkGuards = async () => {
      const from = location.state?.from || '/';
      const to = location.pathname;

      // Run guards in priority order
      const guardsToRun = [${sortedGuards.map(g => `'${g.name}'`).join(', ')}]
        .filter(guardName => guards.length === 0 || guards.includes(guardName));

      for (const guardName of guardsToRun) {
        let allowed = true;
        
        switch (guardName) {
${sortedGuards.map(g => `          case '${g.name}':
            allowed = await ${g.handler}(to, from);
            break;`).join('\n')}
        }

        if (!allowed) {
          setIsAllowed(false);
          navigate('/unauthorized', { replace: true });
          return;
        }
      }

      setIsAllowed(true);
    };

    checkGuards();
  }, [location, navigate, guards]);

  if (isAllowed === null) {
    return <div>Loading...</div>;
  }

  if (!isAllowed) {
    return null;
  }

  return element;
}`;
    }
    /**
     * Generate React navigation hooks
     */
    generateReactNavigationHooks(schema) {
        return `// Navigation Hooks

/**
 * Hook to access navigation methods
 * @returns Navigation methods and current route info
 */
export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  return {
    // Current route information
    currentPath: location.pathname,
    params,
    query: new URLSearchParams(location.search),

    // Navigation methods
    push: (path: string, state?: any) => {
      navigate(path, { state });
    },

    replace: (path: string, state?: any) => {
      navigate(path, { replace: true, state });
    },

    pop: () => {
      navigate(-1);
    },

    popToRoot: () => {
      navigate('/', { replace: true });
    },

    canPop: () => {
      return window.history.length > 1;
    },
  };
}

/**
 * Hook to navigate to a specific route by name
 * @returns Function to navigate by route name
 */
export function useNavigateByName() {
  const navigate = useNavigate();

  const routes: Record<string, string> = {
${schema.routes.map(route => `    '${route.name}': '${route.path}',`).join('\n')}
  };

  return (routeName: string, params?: Record<string, any>, query?: Record<string, any>) => {
    let path = routes[routeName];
    
    if (!path) {
      console.error(\`Route '\${routeName}' not found\`);
      return;
    }

    // Replace path parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(\`:\${key}\`, String(value));
      });
    }

    // Add query parameters
    if (query) {
      const queryString = new URLSearchParams(
        Object.entries(query).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      
      if (queryString) {
        path += '?' + queryString;
      }
    }

    navigate(path);
  };
}

/**
 * Hook to get route metadata
 * @param routeName - Route name
 * @returns Route metadata
 */
export function useRouteMeta(routeName?: string) {
  const location = useLocation();

  const routeMetadata: Record<string, any> = {
${schema.routes.filter(r => r.meta).map(route => `    '${route.name}': ${JSON.stringify(route.meta, null, 6)},`).join('\n')}
  };

  if (routeName) {
    return routeMetadata[routeName];
  }

  // Find current route metadata by matching path
  const currentRoute = [${schema.routes.map(r => `'${r.name}'`).join(', ')}]
    .find(name => {
      const path = routes[name];
      // Simple path matching (could be enhanced with route-parser)
      return location.pathname === path || location.pathname.startsWith(path + '/');
    });

  return currentRoute ? routeMetadata[currentRoute] : null;
}`;
    }
    /**
     * Generate Flutter Navigator code from Navigation Schema
     *
     * @param schema - Navigation schema
     * @returns Flutter Navigator code
     *
     * @example
     * ```typescript
     * const code = converter.generateFlutterNavigator(schema);
     * // Returns:
     * // MaterialApp(
     * //   initialRoute: '/',
     * //   routes: {
     * //     '/': (context) => HomeScreen(),
     * //   },
     * // )
     * ```
     */
    generateFlutterNavigator(schema) {
        const imports = this.generateFlutterImports(schema);
        const routes = this.generateFlutterRoutes(schema.routes);
        const routeBuilders = this.generateFlutterRouteBuilders(schema.routes, schema.transitions);
        const navigationMethods = this.generateFlutterNavigationMethods(schema);
        const initialRoute = schema.initialRoute || '/';
        const onGenerateRoute = schema.transitions ? this.generateFlutterOnGenerateRoute(schema) : '';
        return `${imports}

${navigationMethods}

class AppNavigator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      initialRoute: '${initialRoute}',
      routes: {
${routes}
      },${onGenerateRoute ? `
      onGenerateRoute: ${onGenerateRoute},` : ''}
    );
  }
}

${routeBuilders}
`;
    }
    /**
     * Generate Flutter imports
     */
    generateFlutterImports(schema) {
        const components = new Set();
        const collectComponents = (routes) => {
            routes.forEach(route => {
                components.add(route.component);
                if (route.children) {
                    collectComponents(route.children);
                }
            });
        };
        collectComponents(schema.routes);
        const componentImports = Array.from(components)
            .map(comp => `import 'package:app/screens/${this.toSnakeCase(comp)}.dart';`)
            .join('\n');
        return `import 'package:flutter/material.dart';
${componentImports}`;
    }
    /**
     * Generate Flutter routes map
     */
    generateFlutterRoutes(routes, indent = '        ') {
        return routes
            .map(route => {
            return `${indent}'${route.path}': (context) => ${route.component}(),`;
        })
            .join('\n');
    }
    /**
     * Generate Flutter route builders with transitions
     */
    generateFlutterRouteBuilders(routes, globalTransition) {
        return routes
            .map(route => {
            const transition = route.transition || globalTransition;
            if (!transition || transition.type === 'material') {
                return ''; // Use default MaterialPageRoute
            }
            return `// Route builder for ${route.name} with ${transition.type} transition
Route<dynamic> _build${this.toPascalCase(route.name)}Route(RouteSettings settings) {
  return PageRouteBuilder(
    settings: settings,
    pageBuilder: (context, animation, secondaryAnimation) => ${route.component}(),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      ${this.generateFlutterTransitionCode(transition)}
    },
    transitionDuration: Duration(milliseconds: ${transition.duration || 300}),
  );
}`;
        })
            .filter(code => code.length > 0)
            .join('\n\n');
    }
    /**
     * Generate Flutter transition animation code
     */
    generateFlutterTransitionCode(transition) {
        switch (transition.type) {
            case 'fade':
                return `return FadeTransition(
        opacity: animation,
        child: child,
      );`;
            case 'slide':
            case 'slideRight':
                return `const begin = Offset(-1.0, 0.0);
      const end = Offset.zero;
      const curve = Curves.${this.mapEasingToCurve(transition.easing)};
      final tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
      return SlideTransition(
        position: animation.drive(tween),
        child: child,
      );`;
            case 'slideLeft':
                return `const begin = Offset(1.0, 0.0);
      const end = Offset.zero;
      const curve = Curves.${this.mapEasingToCurve(transition.easing)};
      final tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
      return SlideTransition(
        position: animation.drive(tween),
        child: child,
      );`;
            case 'slideUp':
                return `const begin = Offset(0.0, 1.0);
      const end = Offset.zero;
      const curve = Curves.${this.mapEasingToCurve(transition.easing)};
      final tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
      return SlideTransition(
        position: animation.drive(tween),
        child: child,
      );`;
            case 'slideDown':
                return `const begin = Offset(0.0, -1.0);
      const end = Offset.zero;
      const curve = Curves.${this.mapEasingToCurve(transition.easing)};
      final tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
      return SlideTransition(
        position: animation.drive(tween),
        child: child,
      );`;
            case 'scale':
                return `const curve = Curves.${this.mapEasingToCurve(transition.easing)};
      final tween = Tween(begin: 0.0, end: 1.0).chain(CurveTween(curve: curve));
      return ScaleTransition(
        scale: animation.drive(tween),
        child: child,
      );`;
            case 'cupertino':
                return `return CupertinoPageTransition(
        primaryRouteAnimation: animation,
        secondaryRouteAnimation: secondaryAnimation,
        linearTransition: false,
        child: child,
      );`;
            default:
                return `return child;`;
        }
    }
    /**
     * Map easing function to Flutter Curve
     */
    mapEasingToCurve(easing) {
        const easingMap = {
            'linear': 'linear',
            'easeIn': 'easeIn',
            'easeOut': 'easeOut',
            'easeInOut': 'easeInOut',
            'fastOutSlowIn': 'fastOutSlowIn',
            'decelerate': 'decelerate',
            'cubic': 'easeInOutCubic',
        };
        return easingMap[easing || 'easeInOut'] || 'easeInOut';
    }
    /**
     * Generate Flutter onGenerateRoute for custom transitions
     */
    generateFlutterOnGenerateRoute(schema) {
        const routesWithTransitions = schema.routes.filter(r => r.transition && r.transition.type !== 'material');
        if (routesWithTransitions.length === 0) {
            return '';
        }
        return `(settings) {
        switch (settings.name) {
${routesWithTransitions.map(route => `          case '${route.path}':
            return _build${this.toPascalCase(route.name)}Route(settings);`).join('\n')}
          default:
            return null;
        }
      }`;
    }
    /**
     * Generate Flutter navigation methods
     */
    generateFlutterNavigationMethods(schema) {
        return `// Navigation Helper Methods
class NavigationHelper {
  /// Navigate to a route by name
  static Future<T?> navigateTo<T>(
    BuildContext context,
    String routeName, {
    Map<String, dynamic>? arguments,
  }) {
    return Navigator.pushNamed<T>(
      context,
      routeName,
      arguments: arguments,
    );
  }

  /// Replace current route
  static Future<T?> replaceTo<T>(
    BuildContext context,
    String routeName, {
    Map<String, dynamic>? arguments,
  }) {
    return Navigator.pushReplacementNamed<T, dynamic>(
      context,
      routeName,
      arguments: arguments,
    );
  }

  /// Navigate back
  static void pop<T>(BuildContext context, [T? result]) {
    Navigator.pop<T>(context, result);
  }

  /// Navigate to root
  static void popToRoot(BuildContext context) {
    Navigator.popUntil(context, (route) => route.isFirst);
  }

  /// Pop until condition is met
  static void popUntil(BuildContext context, bool Function(Route<dynamic>) predicate) {
    Navigator.popUntil(context, predicate);
  }

  /// Check if can pop
  static bool canPop(BuildContext context) {
    return Navigator.canPop(context);
  }

  /// Navigate with custom transition
  static Future<T?> navigateWithTransition<T>(
    BuildContext context,
    Widget page, {
    Duration duration = const Duration(milliseconds: 300),
    RouteTransitionsBuilder? transitionsBuilder,
  }) {
    return Navigator.push<T>(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => page,
        transitionsBuilder: transitionsBuilder ??
            (context, animation, secondaryAnimation, child) {
              return FadeTransition(opacity: animation, child: child);
            },
        transitionDuration: duration,
      ),
    );
  }

  // Route name constants
${schema.routes.map(route => `  static const String ${this.toCamelCase(route.name)} = '${route.path}';`).join('\n')}

  // Navigation methods for each route
${schema.routes.map(route => this.generateFlutterRouteNavigationMethod(route)).join('\n\n')}
}`;
    }
    /**
     * Generate navigation method for a specific route
     */
    generateFlutterRouteNavigationMethod(route) {
        const methodName = `navigateTo${this.toPascalCase(route.name)}`;
        const params = route.params?.filter(p => p.required) || [];
        const paramList = params.length > 0
            ? params.map(p => `required ${this.mapDartType(p.type)} ${p.name}`).join(', ')
            : '';
        const argumentsMap = params.length > 0
            ? `{
${params.map(p => `      '${p.name}': ${p.name},`).join('\n')}
    }`
            : 'null';
        return `  /// Navigate to ${route.name}${route.meta?.title ? ` (${route.meta.title})` : ''}
  static Future<T?> ${methodName}<T>(
    BuildContext context,${paramList ? `\n    ${paramList},` : ''}
  ) {
    return navigateTo<T>(
      context,
      ${this.toCamelCase(route.name)},
      arguments: ${argumentsMap},
    );
  }`;
    }
    /**
     * Map Lumora type to Dart type
     */
    mapDartType(type) {
        const typeMap = {
            'string': 'String',
            'number': 'num',
            'boolean': 'bool',
            'array': 'List<dynamic>',
            'object': 'Map<String, dynamic>',
        };
        return typeMap[type] || 'dynamic';
    }
    /**
     * Convert string to PascalCase
     */
    toPascalCase(str) {
        return str
            .replace(/[-_](\w)/g, (_, letter) => letter.toUpperCase())
            .replace(/^(\w)/, (_, letter) => letter.toUpperCase());
    }
    /**
     * Convert string to camelCase
     */
    toCamelCase(str) {
        return str
            .replace(/[-_](\w)/g, (_, letter) => letter.toUpperCase())
            .replace(/^(\w)/, (_, letter) => letter.toLowerCase());
    }
    /**
     * Convert string to snake_case
     */
    toSnakeCase(str) {
        return str
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
    }
}
exports.NavigationConverter = NavigationConverter;
