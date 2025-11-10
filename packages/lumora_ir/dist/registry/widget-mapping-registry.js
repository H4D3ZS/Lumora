"use strict";
/**
 * Widget Mapping Registry
 * Manages bidirectional widget mappings between React and Flutter
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetMappingRegistry = void 0;
exports.getRegistry = getRegistry;
exports.resetRegistry = resetRegistry;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
/**
 * Widget Mapping Registry
 * Provides lookup and conversion methods for widget mappings
 */
class WidgetMappingRegistry {
    constructor() {
        this.mappings = new Map();
        this.reactToWidgetName = new Map();
        this.flutterToWidgetName = new Map();
        this.schemaVersion = '1.0';
        // Load default mappings on initialization
        this.loadDefaultMappings();
    }
    /**
     * Load default widget mappings from the bundled YAML file
     */
    loadDefaultMappings() {
        const defaultMappingsPath = path.join(__dirname, '../schema/widget-mappings.yaml');
        this.loadMappingsFromFile(defaultMappingsPath, false);
    }
    /**
     * Load widget mappings from a YAML file
     * @param filePath Path to the YAML file
     * @param isCustom Whether these are custom mappings (override defaults)
     */
    loadMappingsFromFile(filePath, isCustom = false) {
        try {
            if (!fs.existsSync(filePath)) {
                if (isCustom) {
                    // Custom mappings are optional
                    return;
                }
                throw new Error(`Widget mappings file not found: ${filePath}`);
            }
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const data = yaml.load(fileContent);
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
                const widgetMapping = mapping;
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
        }
        catch (error) {
            throw new Error(`Error loading widget mappings from ${filePath}: ${error}`);
        }
    }
    /**
     * Load custom widget mappings from a project configuration
     * @param customMappingsPath Path to custom widget-mappings.yaml
     */
    loadCustomMappings(customMappingsPath) {
        this.loadMappingsFromFile(customMappingsPath, true);
    }
    /**
     * Get widget mapping by widget name
     * @param widgetName The widget name (e.g., "Container", "Text")
     * @returns Widget mapping or undefined if not found
     */
    getMapping(widgetName) {
        return this.mappings.get(widgetName);
    }
    /**
     * Get widget name from React component name
     * @param reactComponent React component name (e.g., "div", "button")
     * @returns Widget name or undefined if not found (returns first match)
     */
    getWidgetNameFromReact(reactComponent) {
        const matches = this.reactToWidgetName.get(reactComponent);
        return matches && matches.length > 0 ? matches[0] : undefined;
    }
    /**
     * Get widget name from Flutter widget name
     * @param flutterWidget Flutter widget name (e.g., "Container", "Text")
     * @returns Widget name or undefined if not found (returns first match)
     */
    getWidgetNameFromFlutter(flutterWidget) {
        const matches = this.flutterToWidgetName.get(flutterWidget);
        return matches && matches.length > 0 ? matches[0] : undefined;
    }
    /**
     * Get Flutter widget name from React component
     * @param reactComponent React component name
     * @returns Flutter widget name or fallback
     */
    getFlutterWidget(reactComponent) {
        const widgetName = this.getWidgetNameFromReact(reactComponent);
        if (widgetName) {
            const mapping = this.getMapping(widgetName);
            if (mapping?.flutter?.widget) {
                return mapping.flutter.widget;
            }
        }
        // Return fallback or the original component name
        console.warn(`No Flutter mapping found for React component: ${reactComponent}`);
        return 'Container'; // Generic fallback
    }
    /**
     * Get React component name from Flutter widget
     * @param flutterWidget Flutter widget name
     * @returns React component name or fallback
     */
    getReactComponent(flutterWidget) {
        const widgetName = this.getWidgetNameFromFlutter(flutterWidget);
        if (widgetName) {
            const mapping = this.getMapping(widgetName);
            if (mapping?.react?.component) {
                return mapping.react.component;
            }
        }
        // Return fallback or the original widget name
        console.warn(`No React mapping found for Flutter widget: ${flutterWidget}`);
        return 'div'; // Generic fallback
    }
    /**
     * Get prop mapping for a widget
     * @param widgetName Widget name
     * @param propName Prop name
     * @returns Prop mapping or undefined
     */
    getPropMapping(widgetName, propName) {
        const mapping = this.getMapping(widgetName);
        return mapping?.props?.[propName];
    }
    /**
     * Get Flutter prop name from React prop
     * @param widgetName Widget name
     * @param reactProp React prop name
     * @returns Flutter prop name or the original prop name
     */
    getFlutterProp(widgetName, reactProp) {
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
    getReactProp(widgetName, flutterProp) {
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
    getStyleMapping(widgetName, styleName) {
        const mapping = this.getMapping(widgetName);
        return mapping?.styles?.[styleName];
    }
    /**
     * Get event mapping for a widget
     * @param widgetName Widget name
     * @param eventName Event name
     * @returns Event mapping or undefined
     */
    getEventMapping(widgetName, eventName) {
        const mapping = this.getMapping(widgetName);
        return mapping?.events?.[eventName];
    }
    /**
     * Get Flutter event name from React event
     * @param widgetName Widget name
     * @param reactEvent React event name (e.g., "onClick")
     * @returns Flutter event name or the original event name
     */
    getFlutterEvent(widgetName, reactEvent) {
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
    getReactEvent(widgetName, flutterEvent) {
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
    getAllWidgetNames() {
        return Array.from(this.mappings.keys());
    }
    /**
     * Check if a widget mapping exists
     * @param widgetName Widget name
     * @returns True if mapping exists
     */
    hasMapping(widgetName) {
        return this.mappings.has(widgetName);
    }
    /**
     * Get the schema version
     * @returns Schema version string
     */
    getSchemaVersion() {
        return this.schemaVersion;
    }
    /**
     * Get fallback widget for a given widget name
     * @param widgetName Widget name
     * @param framework Target framework ('react' or 'flutter')
     * @returns Fallback widget name or generic fallback
     */
    getFallback(widgetName, framework) {
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
    getImport(widgetName, framework) {
        const mapping = this.getMapping(widgetName);
        if (mapping) {
            return framework === 'react' ? mapping.react?.import : mapping.flutter?.import;
        }
        return undefined;
    }
}
exports.WidgetMappingRegistry = WidgetMappingRegistry;
// Singleton instance
let registryInstance = null;
/**
 * Get the singleton instance of WidgetMappingRegistry
 * @returns WidgetMappingRegistry instance
 */
function getRegistry() {
    if (!registryInstance) {
        registryInstance = new WidgetMappingRegistry();
    }
    return registryInstance;
}
/**
 * Reset the registry instance (useful for testing)
 */
function resetRegistry() {
    registryInstance = null;
}
