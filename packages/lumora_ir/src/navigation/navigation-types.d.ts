/**
 * Navigation Schema Type Definitions
 * Framework-agnostic navigation and routing system for Lumora IR
 */
/**
 * Complete navigation schema for an application
 */
export interface NavigationSchema {
    /** List of all routes in the application */
    routes: Route[];
    /** Initial route to display when app starts */
    initialRoute: string;
    /** Global transition configuration */
    transitions?: TransitionConfig;
    /** Navigation mode (stack, tabs, drawer, etc.) */
    mode?: NavigationMode;
    /** Deep linking configuration */
    deepLinking?: DeepLinkingConfig;
    /** Navigation guards for route protection */
    guards?: NavigationGuard[];
}
/**
 * Individual route definition
 */
export interface Route {
    /** Unique route name/identifier */
    name: string;
    /** URL path pattern (e.g., "/user/:id") */
    path: string;
    /** Component to render for this route */
    component: string;
    /** Route parameters definition */
    params?: RouteParam[];
    /** Query parameters definition */
    queryParams?: RouteParam[];
    /** Route-specific transition override */
    transition?: TransitionConfig;
    /** Route metadata (title, auth required, etc.) */
    meta?: RouteMeta;
    /** Child/nested routes */
    children?: Route[];
    /** Route aliases */
    aliases?: string[];
    /** Redirect configuration */
    redirect?: RouteRedirect;
}
/**
 * Route parameter definition
 */
export interface RouteParam {
    /** Parameter name */
    name: string;
    /** Parameter type */
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    /** Whether parameter is required */
    required: boolean;
    /** Default value if not provided */
    defaultValue?: any;
    /** Validation pattern (regex) */
    pattern?: string;
    /** Parameter description */
    description?: string;
}
/**
 * Route metadata
 */
export interface RouteMeta {
    /** Page title */
    title?: string;
    /** Whether authentication is required */
    requiresAuth?: boolean;
    /** Required permissions/roles */
    permissions?: string[];
    /** Custom metadata */
    [key: string]: any;
}
/**
 * Route redirect configuration
 */
export interface RouteRedirect {
    /** Target route name or path */
    to: string;
    /** Whether to replace history entry */
    replace?: boolean;
    /** Condition for redirect */
    condition?: string;
}
/**
 * Transition/animation configuration for route changes
 */
export interface TransitionConfig {
    /** Transition type */
    type: TransitionType;
    /** Duration in milliseconds */
    duration?: number;
    /** Easing function */
    easing?: EasingFunction;
    /** Custom transition properties */
    properties?: TransitionProperties;
}
/**
 * Transition type enumeration
 */
export type TransitionType = 'slide' | 'fade' | 'scale' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'cupertino' | 'material' | 'custom' | 'none';
/**
 * Easing function types
 */
export type EasingFunction = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'fastOutSlowIn' | 'decelerate' | 'cubic' | 'custom';
/**
 * Custom transition properties
 */
export interface TransitionProperties {
    /** Starting position/value */
    from?: any;
    /** Ending position/value */
    to?: any;
    /** Custom curve definition */
    curve?: string;
    /** Reverse animation on pop */
    reversible?: boolean;
}
/**
 * Navigation mode types
 */
export type NavigationMode = 'stack' | 'tabs' | 'drawer' | 'modal' | 'bottomSheet' | 'custom';
/**
 * Deep linking configuration
 */
export interface DeepLinkingConfig {
    /** Whether deep linking is enabled */
    enabled: boolean;
    /** URL scheme (e.g., "myapp://") */
    scheme?: string;
    /** Host domain for universal links */
    host?: string;
    /** Path prefix for deep links */
    pathPrefix?: string;
    /** Custom link handlers */
    handlers?: DeepLinkHandler[];
}
/**
 * Deep link handler
 */
export interface DeepLinkHandler {
    /** Pattern to match */
    pattern: string;
    /** Handler function name */
    handler: string;
    /** Route to navigate to */
    route?: string;
}
/**
 * Navigation guard for route protection
 */
export interface NavigationGuard {
    /** Guard name/identifier */
    name: string;
    /** Guard type */
    type: 'before' | 'after' | 'resolve';
    /** Routes this guard applies to (empty = all routes) */
    routes?: string[];
    /** Guard handler function */
    handler: string;
    /** Priority (higher = runs first) */
    priority?: number;
}
/**
 * Navigation action types
 */
export type NavigationAction = 'push' | 'pop' | 'replace' | 'popToRoot' | 'popUntil' | 'pushReplacement';
/**
 * Navigation context passed to components
 */
export interface NavigationContext {
    /** Current route */
    currentRoute: Route;
    /** Route parameters */
    params: Record<string, any>;
    /** Query parameters */
    query: Record<string, any>;
    /** Navigation history */
    history: NavigationHistoryEntry[];
    /** Navigation methods */
    navigate: NavigationMethods;
}
/**
 * Navigation history entry
 */
export interface NavigationHistoryEntry {
    /** Route name */
    route: string;
    /** Parameters */
    params: Record<string, any>;
    /** Timestamp */
    timestamp: number;
}
/**
 * Navigation methods available to components
 */
export interface NavigationMethods {
    /** Navigate to a route */
    push: (route: string, params?: Record<string, any>) => void;
    /** Go back */
    pop: () => void;
    /** Replace current route */
    replace: (route: string, params?: Record<string, any>) => void;
    /** Pop to root */
    popToRoot: () => void;
    /** Pop until condition */
    popUntil: (condition: (route: Route) => boolean) => void;
    /** Check if can go back */
    canPop: () => boolean;
}
/**
 * Route matching result
 */
export interface RouteMatch {
    /** Matched route */
    route: Route;
    /** Extracted parameters */
    params: Record<string, any>;
    /** Query parameters */
    query: Record<string, any>;
    /** Match score (for ranking) */
    score: number;
}
/**
 * Navigation event types
 */
export type NavigationEventType = 'beforeNavigate' | 'afterNavigate' | 'navigationError' | 'routeChanged';
/**
 * Navigation event
 */
export interface NavigationEvent {
    /** Event type */
    type: NavigationEventType;
    /** From route */
    from?: Route;
    /** To route */
    to?: Route;
    /** Navigation action */
    action: NavigationAction;
    /** Event timestamp */
    timestamp: number;
    /** Additional data */
    data?: any;
}
//# sourceMappingURL=navigation-types.d.ts.map