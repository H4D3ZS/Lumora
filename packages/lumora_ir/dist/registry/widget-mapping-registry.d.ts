/**
 * Widget Mapping Registry
 * Manages bidirectional widget mappings between React and Flutter
 */
export interface PropMapping {
    react: string;
    flutter: string;
    type: string;
    transform?: string;
    default?: any;
}
export interface StyleMapping {
    react: string;
    flutter: string;
    type: string;
    transform?: string;
}
export interface EventMapping {
    react: string;
    flutter: string;
    parameters?: string[];
}
export interface FrameworkMapping {
    component?: string;
    widget?: string;
    import?: string;
}
export interface WidgetMapping {
    react: FrameworkMapping;
    flutter: FrameworkMapping;
    props?: Record<string, PropMapping>;
    styles?: Record<string, StyleMapping>;
    events?: Record<string, EventMapping>;
    fallback?: {
        react?: string;
        flutter?: string;
    };
    custom?: boolean;
}
export interface WidgetMappings {
    schemaVersion: string;
    [widgetName: string]: any;
}
/**
 * Widget Mapping Registry
 * Provides lookup and conversion methods for widget mappings
 */
export declare class WidgetMappingRegistry {
    private mappings;
    private reactToWidgetName;
    private flutterToWidgetName;
    private schemaVersion;
    constructor();
    /**
     * Load default widget mappings from the bundled YAML file
     */
    private loadDefaultMappings;
    /**
     * Load widget mappings from a YAML file
     * @param filePath Path to the YAML file
     * @param isCustom Whether these are custom mappings (override defaults)
     */
    loadMappingsFromFile(filePath: string, isCustom?: boolean): void;
    /**
     * Load custom widget mappings from a project configuration
     * @param customMappingsPath Path to custom widget-mappings.yaml
     */
    loadCustomMappings(customMappingsPath: string): void;
    /**
     * Get widget mapping by widget name
     * @param widgetName The widget name (e.g., "Container", "Text")
     * @returns Widget mapping or undefined if not found
     */
    getMapping(widgetName: string): WidgetMapping | undefined;
    /**
     * Get widget name from React component name
     * @param reactComponent React component name (e.g., "div", "button")
     * @returns Widget name or undefined if not found (returns first match)
     */
    getWidgetNameFromReact(reactComponent: string): string | undefined;
    /**
     * Get widget name from Flutter widget name
     * @param flutterWidget Flutter widget name (e.g., "Container", "Text")
     * @returns Widget name or undefined if not found (returns first match)
     */
    getWidgetNameFromFlutter(flutterWidget: string): string | undefined;
    /**
     * Get Flutter widget name from React component
     * @param reactComponent React component name
     * @returns Flutter widget name or fallback
     */
    getFlutterWidget(reactComponent: string): string;
    /**
     * Get React component name from Flutter widget
     * @param flutterWidget Flutter widget name
     * @returns React component name or fallback
     */
    getReactComponent(flutterWidget: string): string;
    /**
     * Get prop mapping for a widget
     * @param widgetName Widget name
     * @param propName Prop name
     * @returns Prop mapping or undefined
     */
    getPropMapping(widgetName: string, propName: string): PropMapping | undefined;
    /**
     * Get Flutter prop name from React prop
     * @param widgetName Widget name
     * @param reactProp React prop name
     * @returns Flutter prop name or the original prop name
     */
    getFlutterProp(widgetName: string, reactProp: string): string;
    /**
     * Get React prop name from Flutter prop
     * @param widgetName Widget name
     * @param flutterProp Flutter prop name
     * @returns React prop name or the original prop name
     */
    getReactProp(widgetName: string, flutterProp: string): string;
    /**
     * Get style mapping for a widget
     * @param widgetName Widget name
     * @param styleName Style property name
     * @returns Style mapping or undefined
     */
    getStyleMapping(widgetName: string, styleName: string): StyleMapping | undefined;
    /**
     * Get event mapping for a widget
     * @param widgetName Widget name
     * @param eventName Event name
     * @returns Event mapping or undefined
     */
    getEventMapping(widgetName: string, eventName: string): EventMapping | undefined;
    /**
     * Get Flutter event name from React event
     * @param widgetName Widget name
     * @param reactEvent React event name (e.g., "onClick")
     * @returns Flutter event name or the original event name
     */
    getFlutterEvent(widgetName: string, reactEvent: string): string;
    /**
     * Get React event name from Flutter event
     * @param widgetName Widget name
     * @param flutterEvent Flutter event name (e.g., "onTap")
     * @returns React event name or the original event name
     */
    getReactEvent(widgetName: string, flutterEvent: string): string;
    /**
     * Get all widget names
     * @returns Array of widget names
     */
    getAllWidgetNames(): string[];
    /**
     * Check if a widget mapping exists
     * @param widgetName Widget name
     * @returns True if mapping exists
     */
    hasMapping(widgetName: string): boolean;
    /**
     * Get the schema version
     * @returns Schema version string
     */
    getSchemaVersion(): string;
    /**
     * Get fallback widget for a given widget name
     * @param widgetName Widget name
     * @param framework Target framework ('react' or 'flutter')
     * @returns Fallback widget name or generic fallback
     */
    getFallback(widgetName: string, framework: 'react' | 'flutter'): string;
    /**
     * Get required imports for a widget
     * @param widgetName Widget name
     * @param framework Target framework ('react' or 'flutter')
     * @returns Import statement or undefined
     */
    getImport(widgetName: string, framework: 'react' | 'flutter'): string | undefined;
}
/**
 * Get the singleton instance of WidgetMappingRegistry
 * @returns WidgetMappingRegistry instance
 */
export declare function getRegistry(): WidgetMappingRegistry;
/**
 * Reset the registry instance (useful for testing)
 */
export declare function resetRegistry(): void;
