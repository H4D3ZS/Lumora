/**
 * Widget Mapping Registry
 * Manages bidirectional widget mappings between React and Flutter
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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
export class WidgetMappingRegistry {
  private mappings: Map<string, WidgetMapping> = new Map();
  private reactToWidgetName: Map<string, string[]> = new Map();
  private flutterToWidgetName: Map<string, string[]> = new Map();
  private schemaVersion: string = '1.0';

  constructor() {
    // Load default mappings on initialization
    this.loadDefaultMappings();
  }

  /**
   * Load default widget mappings from the bundled YAML file
   */
  private loadDefaultMappings(): void {
    const defaultMappingsPath = path.join(__dirname, '../schema/widget-mappings.yaml');
    this.loadMappingsFromFile(defaultMappingsPath, false);
  }

  /**
   * Load widget mappings from a YAML file
   * @param filePath Path to the YAML file
   * @param isCustom Whether these are custom mappings (override defaults)
   */
  public loadMappingsFromFile(filePath: string, isCustom: boolean = false): void {
    try {
      if (!fs.existsSync(filePath)) {
        if (isCustom) {
          // Custom mappings are optional
          return;
        }
        throw new Error(`Widget mappings file not found: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(fileContent) as WidgetMappings;

      if (!data) {
        throw new Error(`Failed to parse widget mappings from: ${filePath}`);
      }

      // Store schema version
      if (data.schemaVersion) {
        this.schemaVersion = data.schemaVersion;
      }

      // Process each widget mapping
      for (const [widgetName, mapping] of Object.entries(data)) {
        if (widgetName === 'schemaVersion') {
          continue;
        }

        const widgetMapping = mapping as WidgetMapping;
        
        // Only override if custom or if not already defined
        if (isCustom || widgetMapping.custom || !this.mappings.has(widgetName)) {
          this.mappings.set(widgetName, widgetMapping);

          // Build reverse lookup maps (store all mappings)
          if (widgetMapping.react?.component) {
            const existing = this.reactToWidgetName.get(widgetMapping.react.component) || [];
            if (!existing.includes(widgetName)) {
              existing.push(widgetName);
              this.reactToWidgetName.set(widgetMapping.react.component, existing);
            }
          }
          if (widgetMapping.flutter?.widget) {
            const existing = this.flutterToWidgetName.get(widgetMapping.flutter.widget) || [];
            if (!existing.includes(widgetName)) {
              existing.push(widgetName);
              this.flutterToWidgetName.set(widgetMapping.flutter.widget, existing);
            }
          }
        }
      }
    } catch (error) {
      throw new Error(`Error loading widget mappings from ${filePath}: ${error}`);
    }
  }

  /**
   * Load custom widget mappings from a project configuration
   * @param customMappingsPath Path to custom widget-mappings.yaml
   */
  public loadCustomMappings(customMappingsPath: string): void {
    this.loadMappingsFromFile(customMappingsPath, true);
  }

  /**
   * Get widget mapping by widget name
   * @param widgetName The widget name (e.g., "Container", "Text")
   * @returns Widget mapping or undefined if not found
   */
  public getMapping(widgetName: string): WidgetMapping | undefined {
    return this.mappings.get(widgetName);
  }

  /**
   * Get widget name from React component name
   * @param reactComponent React component name (e.g., "div", "button")
   * @returns Widget name or undefined if not found (returns first match)
   */
  public getWidgetNameFromReact(reactComponent: string): string | undefined {
    const matches = this.reactToWidgetName.get(reactComponent);
    return matches && matches.length > 0 ? matches[0] : undefined;
  }

  /**
   * Get widget name from Flutter widget name
   * @param flutterWidget Flutter widget name (e.g., "Container", "Text")
   * @returns Widget name or undefined if not found (returns first match)
   */
  public getWidgetNameFromFlutter(flutterWidget: string): string | undefined {
    const matches = this.flutterToWidgetName.get(flutterWidget);
    return matches && matches.length > 0 ? matches[0] : undefined;
  }

  /**
   * Get Flutter widget name from React component
   * @param reactComponent React component name
   * @returns Flutter widget name or fallback
   */
  public getFlutterWidget(reactComponent: string): string {
    const widgetName = this.getWidgetNameFromReact(reactComponent);
    if (widgetName) {
      const mapping = this.getMapping(widgetName);
      if (mapping?.flutter?.widget) {
        return mapping.flutter.widget;
      }
    }

    // Return fallback or the original component name
    this.logUnmappedWidget(reactComponent, 'react', 'flutter');
    return this.getGenericFallback('flutter');
  }

  /**
   * Get React component name from Flutter widget
   * @param flutterWidget Flutter widget name
   * @returns React component name or fallback
   */
  public getReactComponent(flutterWidget: string): string {
    const widgetName = this.getWidgetNameFromFlutter(flutterWidget);
    if (widgetName) {
      const mapping = this.getMapping(widgetName);
      if (mapping?.react?.component) {
        return mapping.react.component;
      }
    }

    // Return fallback or the original widget name
    this.logUnmappedWidget(flutterWidget, 'flutter', 'react');
    return this.getGenericFallback('react');
  }

  /**
   * Log unmapped widget warning
   */
  private logUnmappedWidget(
    widgetName: string,
    sourceFramework: 'react' | 'flutter',
    targetFramework: 'react' | 'flutter'
  ): void {
    const fallback = this.getGenericFallback(targetFramework);
    console.warn(
      `⚠️  Unmapped Widget: No ${targetFramework} mapping found for ${sourceFramework} widget "${widgetName}"\n` +
      `   Using fallback: ${fallback}\n` +
      `   💡 Add a custom mapping in widget-mappings.yaml to resolve this warning`
    );
  }

  /**
   * Get generic fallback widget for framework
   */
  private getGenericFallback(framework: 'react' | 'flutter'): string {
    return framework === 'react' ? 'div' : 'Container';
  }

  /**
   * Get prop mapping for a widget
   * @param widgetName Widget name
   * @param propName Prop name
   * @returns Prop mapping or undefined
   */
  public getPropMapping(widgetName: string, propName: string): PropMapping | undefined {
    const mapping = this.getMapping(widgetName);
    return mapping?.props?.[propName];
  }

  /**
   * Get Flutter prop name from React prop
   * @param widgetName Widget name
   * @param reactProp React prop name
   * @returns Flutter prop name or the original prop name
   */
  public getFlutterProp(widgetName: string, reactProp: string): string {
    const mapping = this.getMapping(widgetName);
    if (mapping?.props) {
      for (const [key, propMapping] of Object.entries(mapping.props)) {
        if (propMapping.react === reactProp) {
          return propMapping.flutter;
        }
      }
    }
    return reactProp; // Return original if no mapping found
  }

  /**
   * Get React prop name from Flutter prop
   * @param widgetName Widget name
   * @param flutterProp Flutter prop name
   * @returns React prop name or the original prop name
   */
  public getReactProp(widgetName: string, flutterProp: string): string {
    const mapping = this.getMapping(widgetName);
    if (mapping?.props) {
      for (const [key, propMapping] of Object.entries(mapping.props)) {
        if (propMapping.flutter === flutterProp) {
          return propMapping.react;
        }
      }
    }
    return flutterProp; // Return original if no mapping found
  }

  /**
   * Get style mapping for a widget
   * @param widgetName Widget name
   * @param styleName Style property name
   * @returns Style mapping or undefined
   */
  public getStyleMapping(widgetName: string, styleName: string): StyleMapping | undefined {
    const mapping = this.getMapping(widgetName);
    return mapping?.styles?.[styleName];
  }

  /**
   * Get event mapping for a widget
   * @param widgetName Widget name
   * @param eventName Event name
   * @returns Event mapping or undefined
   */
  public getEventMapping(widgetName: string, eventName: string): EventMapping | undefined {
    const mapping = this.getMapping(widgetName);
    return mapping?.events?.[eventName];
  }

  /**
   * Get Flutter event name from React event
   * @param widgetName Widget name
   * @param reactEvent React event name (e.g., "onClick")
   * @returns Flutter event name or the original event name
   */
  public getFlutterEvent(widgetName: string, reactEvent: string): string {
    const mapping = this.getMapping(widgetName);
    if (mapping?.events) {
      for (const [key, eventMapping] of Object.entries(mapping.events)) {
        if (eventMapping.react === reactEvent) {
          return eventMapping.flutter;
        }
      }
    }
    return reactEvent; // Return original if no mapping found
  }

  /**
   * Get React event name from Flutter event
   * @param widgetName Widget name
   * @param flutterEvent Flutter event name (e.g., "onTap")
   * @returns React event name or the original event name
   */
  public getReactEvent(widgetName: string, flutterEvent: string): string {
    const mapping = this.getMapping(widgetName);
    if (mapping?.events) {
      for (const [key, eventMapping] of Object.entries(mapping.events)) {
        if (eventMapping.flutter === flutterEvent) {
          return eventMapping.react;
        }
      }
    }
    return flutterEvent; // Return original if no mapping found
  }

  /**
   * Get all widget names
   * @returns Array of widget names
   */
  public getAllWidgetNames(): string[] {
    return Array.from(this.mappings.keys());
  }

  /**
   * Check if a widget mapping exists
   * @param widgetName Widget name
   * @returns True if mapping exists
   */
  public hasMapping(widgetName: string): boolean {
    return this.mappings.has(widgetName);
  }

  /**
   * Get the schema version
   * @returns Schema version string
   */
  public getSchemaVersion(): string {
    return this.schemaVersion;
  }

  /**
   * Get fallback widget for a given widget name
   * @param widgetName Widget name
   * @param framework Target framework ('react' or 'flutter')
   * @returns Fallback widget name or generic fallback
   */
  public getFallback(widgetName: string, framework: 'react' | 'flutter'): string {
    const mapping = this.getMapping(widgetName);
    if (mapping?.fallback) {
      const fallback = framework === 'react' ? mapping.fallback.react : mapping.fallback.flutter;
      if (fallback) {
        return fallback;
      }
    }
    // Generic fallbacks
    return framework === 'react' ? 'div' : 'Container';
  }

  /**
   * Get required imports for a widget
   * @param widgetName Widget name
   * @param framework Target framework ('react' or 'flutter')
   * @returns Import statement or undefined
   */
  public getImport(widgetName: string, framework: 'react' | 'flutter'): string | undefined {
    const mapping = this.getMapping(widgetName);
    if (mapping) {
      return framework === 'react' ? mapping.react?.import : mapping.flutter?.import;
    }
    return undefined;
  }
}

// Singleton instance
let registryInstance: WidgetMappingRegistry | null = null;

/**
 * Get the singleton instance of WidgetMappingRegistry
 * @returns WidgetMappingRegistry instance
 */
export function getRegistry(): WidgetMappingRegistry {
  if (!registryInstance) {
    registryInstance = new WidgetMappingRegistry();
  }
  return registryInstance;
}

/**
 * Reset the registry instance (useful for testing)
 */
export function resetRegistry(): void {
  registryInstance = null;
}
