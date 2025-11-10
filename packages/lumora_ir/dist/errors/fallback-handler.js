"use strict";
/**
 * Fallback Handler - Handles unmapped widgets with fallback strategies
 *
 * Provides fallback widgets when no mapping is found, with detailed logging
 * and suggestions for adding custom mappings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackHandler = exports.FallbackStrategy = void 0;
exports.getFallbackHandler = getFallbackHandler;
const widget_mapping_registry_1 = require("../registry/widget-mapping-registry");
/**
 * Fallback strategy
 */
var FallbackStrategy;
(function (FallbackStrategy) {
    FallbackStrategy["GENERIC"] = "generic";
    FallbackStrategy["SIMILAR"] = "similar";
    FallbackStrategy["PRESERVE"] = "preserve";
    FallbackStrategy["CUSTOM"] = "custom";
})(FallbackStrategy || (exports.FallbackStrategy = FallbackStrategy = {}));
/**
 * Fallback Handler class
 */
class FallbackHandler {
    constructor() {
        this.unmappedWidgets = new Map();
        this.strategy = FallbackStrategy.GENERIC;
        this.registry = (0, widget_mapping_registry_1.getRegistry)();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!FallbackHandler.instance) {
            FallbackHandler.instance = new FallbackHandler();
        }
        return FallbackHandler.instance;
    }
    /**
     * Set fallback strategy
     */
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    /**
     * Get fallback strategy
     */
    getStrategy() {
        return this.strategy;
    }
    /**
     * Get fallback widget for unmapped widget
     */
    getFallbackWidget(originalWidget, sourceFramework, targetFramework) {
        // Record unmapped widget
        this.recordUnmappedWidget(originalWidget, sourceFramework, targetFramework);
        // Apply fallback strategy
        let fallbackWidget;
        let strategy;
        switch (this.strategy) {
            case FallbackStrategy.SIMILAR:
                fallbackWidget = this.findSimilarWidget(originalWidget, targetFramework);
                strategy = FallbackStrategy.SIMILAR;
                break;
            case FallbackStrategy.PRESERVE:
                fallbackWidget = originalWidget;
                strategy = FallbackStrategy.PRESERVE;
                break;
            case FallbackStrategy.CUSTOM:
                fallbackWidget = this.getCustomFallback(originalWidget, targetFramework);
                strategy = FallbackStrategy.CUSTOM;
                break;
            case FallbackStrategy.GENERIC:
            default:
                fallbackWidget = this.getGenericFallback(targetFramework);
                strategy = FallbackStrategy.GENERIC;
                break;
        }
        // Generate warning and suggestion
        const warning = this.generateWarning(originalWidget, sourceFramework, targetFramework, fallbackWidget);
        const suggestion = this.generateSuggestion(originalWidget, sourceFramework, targetFramework);
        return {
            widgetName: fallbackWidget,
            strategy,
            warning,
            suggestion,
            originalWidget,
        };
    }
    /**
     * Record unmapped widget
     */
    recordUnmappedWidget(originalWidget, sourceFramework, targetFramework) {
        const key = `${sourceFramework}:${originalWidget}:${targetFramework}`;
        const existing = this.unmappedWidgets.get(key);
        if (existing) {
            existing.occurrences++;
            existing.lastSeen = Date.now();
        }
        else {
            const fallback = this.getGenericFallback(targetFramework);
            this.unmappedWidgets.set(key, {
                originalWidget,
                sourceFramework,
                targetFramework,
                fallbackUsed: fallback,
                occurrences: 1,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
            });
        }
    }
    /**
     * Get generic fallback widget
     */
    getGenericFallback(framework) {
        return framework === 'react' ? 'div' : 'Container';
    }
    /**
     * Find similar widget based on name
     */
    findSimilarWidget(originalWidget, targetFramework) {
        const lowerWidget = originalWidget.toLowerCase();
        // Common patterns
        const patterns = {
            button: { react: 'button', flutter: 'ElevatedButton' },
            text: { react: 'span', flutter: 'Text' },
            input: { react: 'input', flutter: 'TextField' },
            image: { react: 'img', flutter: 'Image' },
            list: { react: 'ul', flutter: 'ListView' },
            view: { react: 'div', flutter: 'Container' },
            container: { react: 'div', flutter: 'Container' },
            row: { react: 'div', flutter: 'Row' },
            column: { react: 'div', flutter: 'Column' },
            scroll: { react: 'div', flutter: 'SingleChildScrollView' },
        };
        // Check for pattern matches
        for (const [pattern, mapping] of Object.entries(patterns)) {
            if (lowerWidget.includes(pattern)) {
                return targetFramework === 'react' ? mapping.react : mapping.flutter;
            }
        }
        // No similar widget found, use generic fallback
        return this.getGenericFallback(targetFramework);
    }
    /**
     * Get custom fallback from configuration
     */
    getCustomFallback(originalWidget, targetFramework) {
        // Try to get fallback from registry
        const widgetName = targetFramework === 'react'
            ? this.registry.getWidgetNameFromFlutter(originalWidget)
            : this.registry.getWidgetNameFromReact(originalWidget);
        if (widgetName) {
            const fallback = this.registry.getFallback(widgetName, targetFramework);
            if (fallback) {
                return fallback;
            }
        }
        // No custom fallback, use generic
        return this.getGenericFallback(targetFramework);
    }
    /**
     * Generate warning message
     */
    generateWarning(originalWidget, sourceFramework, targetFramework, fallbackWidget) {
        return (`⚠️  Unmapped Widget: "${originalWidget}" (${sourceFramework}) has no mapping to ${targetFramework}\n` +
            `   Using fallback: ${fallbackWidget}`);
    }
    /**
     * Generate suggestion message
     */
    generateSuggestion(originalWidget, sourceFramework, targetFramework) {
        const mappingKey = sourceFramework === 'react' ? 'react_to_flutter' : 'flutter_to_react';
        const targetKey = targetFramework === 'react' ? 'react' : 'flutter';
        return (`💡 To resolve this warning, add a custom mapping in widget-mappings.yaml:\n\n` +
            `${mappingKey}:\n` +
            `  ${originalWidget}:\n` +
            `    ${targetKey}: YourTargetWidget\n` +
            `    props:\n` +
            `      # Add prop mappings here\n`);
    }
    /**
     * Get all unmapped widgets
     */
    getUnmappedWidgets() {
        return Array.from(this.unmappedWidgets.values());
    }
    /**
     * Get unmapped widgets summary
     */
    getUnmappedWidgetsSummary() {
        const records = this.getUnmappedWidgets();
        if (records.length === 0) {
            return '✓ No unmapped widgets found';
        }
        let summary = `\n⚠️  Unmapped Widgets Summary (${records.length} unique widgets):\n\n`;
        // Sort by occurrences (most common first)
        records.sort((a, b) => b.occurrences - a.occurrences);
        records.forEach((record, index) => {
            summary += `${index + 1}. ${record.originalWidget} (${record.sourceFramework} → ${record.targetFramework})\n`;
            summary += `   Occurrences: ${record.occurrences}\n`;
            summary += `   Fallback: ${record.fallbackUsed}\n`;
            summary += `   First seen: ${new Date(record.firstSeen).toISOString()}\n\n`;
        });
        summary += `💡 Add custom mappings in widget-mappings.yaml to resolve these warnings\n`;
        return summary;
    }
    /**
     * Clear unmapped widgets log
     */
    clearUnmappedWidgets() {
        this.unmappedWidgets.clear();
    }
    /**
     * Export unmapped widgets to YAML template
     */
    exportUnmappedWidgetsTemplate() {
        const records = this.getUnmappedWidgets();
        if (records.length === 0) {
            return '# No unmapped widgets to export';
        }
        let yaml = '# Custom Widget Mappings\n';
        yaml += '# Add these mappings to your widget-mappings.yaml file\n\n';
        yaml += 'schemaVersion: "1.0"\n\n';
        // Group by source framework
        const reactToFlutter = records.filter(r => r.sourceFramework === 'react');
        const flutterToReact = records.filter(r => r.sourceFramework === 'flutter');
        if (reactToFlutter.length > 0) {
            yaml += '# React to Flutter mappings\n';
            reactToFlutter.forEach(record => {
                yaml += `${record.originalWidget}:\n`;
                yaml += `  react:\n`;
                yaml += `    component: ${record.originalWidget}\n`;
                yaml += `  flutter:\n`;
                yaml += `    widget: # TODO: Add Flutter widget name\n`;
                yaml += `  props:\n`;
                yaml += `    # TODO: Add prop mappings\n`;
                yaml += `  custom: true\n\n`;
            });
        }
        if (flutterToReact.length > 0) {
            yaml += '# Flutter to React mappings\n';
            flutterToReact.forEach(record => {
                yaml += `${record.originalWidget}:\n`;
                yaml += `  react:\n`;
                yaml += `    component: # TODO: Add React component name\n`;
                yaml += `  flutter:\n`;
                yaml += `    widget: ${record.originalWidget}\n`;
                yaml += `  props:\n`;
                yaml += `    # TODO: Add prop mappings\n`;
                yaml += `  custom: true\n\n`;
            });
        }
        return yaml;
    }
}
exports.FallbackHandler = FallbackHandler;
/**
 * Get singleton instance of FallbackHandler
 */
function getFallbackHandler() {
    return FallbackHandler.getInstance();
}
