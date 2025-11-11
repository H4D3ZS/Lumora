/**
 * Navigation Converter
 * Converts between React Router, Flutter Navigator, and Lumora Navigation Schema
 */
import type { NavigationSchema } from './navigation-types';
/**
 * React Router route definition (from code)
 */
export interface ReactRouterRoute {
    path: string;
    element?: string;
    component?: string;
    children?: ReactRouterRoute[];
    index?: boolean;
    caseSensitive?: boolean;
    loader?: string;
    action?: string;
    errorElement?: string;
    handle?: any;
}
/**
 * Flutter Navigator route definition (from code)
 */
export interface FlutterNavigatorRoute {
    name: string;
    builder: string;
    settings?: {
        name?: string;
        arguments?: string;
    };
    transition?: string;
    transitionDuration?: number;
    maintainState?: boolean;
    fullscreenDialog?: boolean;
}
/**
 * Navigation Converter
 * Converts navigation definitions between frameworks
 */
export declare class NavigationConverter {
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
    convertReactRouter(source: string): NavigationSchema;
    /**
     * Parse React source code to AST
     */
    private parseReactSource;
    /**
     * Extract React Router routes from AST
     */
    private extractReactRoutes;
    /**
     * Find Route elements in JSX children
     */
    private findRouteElements;
    /**
     * Parse a single React Router <Route> element
     */
    private parseReactRoute;
    /**
     * Extract component name from JSX element
     */
    private extractComponentName;
    /**
     * Serialize JSX member expression to string
     */
    private serializeJSXMemberExpression;
    /**
     * Extract route guards from React code
     */
    private extractReactGuards;
    /**
     * Parse a React guard component
     */
    private parseReactGuard;
    /**
     * Parse a React useEffect guard
     */
    private parseReactEffectGuard;
    /**
     * Convert React Router route to Navigation Schema route
     */
    private convertReactRouteToSchema;
    /**
     * Generate route name from path
     */
    private generateRouteName;
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
    convertFlutterNavigator(source: string): NavigationSchema;
    /**
     * Extract Flutter Navigator routes from source code
     */
    private extractFlutterRoutes;
    /**
     * Infer builder/component name from route name
     */
    private inferBuilderFromRouteName;
    /**
     * Extract Flutter transition configuration
     */
    private extractFlutterTransitions;
    /**
     * Map Flutter transition type to schema transition type
     */
    private mapFlutterTransitionType;
    /**
     * Convert Flutter Navigator route to Navigation Schema route
     */
    private convertFlutterRouteToSchema;
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
    generateReactRouter(schema: NavigationSchema): string;
    /**
     * Generate React imports
     */
    private generateReactImports;
    /**
     * Generate React routes JSX
     */
    private generateReactRoutes;
    /**
     * Generate React guard components
     */
    private generateReactGuards;
    /**
     * Generate React guard wrapper component
     */
    private generateReactGuardWrapper;
    /**
     * Generate React navigation hooks
     */
    private generateReactNavigationHooks;
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
    generateFlutterNavigator(schema: NavigationSchema): string;
    /**
     * Generate Flutter imports
     */
    private generateFlutterImports;
    /**
     * Generate Flutter routes map
     */
    private generateFlutterRoutes;
    /**
     * Generate Flutter route builders with transitions
     */
    private generateFlutterRouteBuilders;
    /**
     * Generate Flutter transition animation code
     */
    private generateFlutterTransitionCode;
    /**
     * Map easing function to Flutter Curve
     */
    private mapEasingToCurve;
    /**
     * Generate Flutter onGenerateRoute for custom transitions
     */
    private generateFlutterOnGenerateRoute;
    /**
     * Generate Flutter navigation methods
     */
    private generateFlutterNavigationMethods;
    /**
     * Generate navigation method for a specific route
     */
    private generateFlutterRouteNavigationMethod;
    /**
     * Map Lumora type to Dart type
     */
    private mapDartType;
    /**
     * Convert string to PascalCase
     */
    private toPascalCase;
    /**
     * Convert string to camelCase
     */
    private toCamelCase;
    /**
     * Convert string to snake_case
     */
    private toSnakeCase;
}
