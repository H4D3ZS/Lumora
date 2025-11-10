/**
 * Fallback Handler - Handles unmapped widgets with fallback strategies
 * 
 * Provides fallback widgets when no mapping is found, with detailed logging
 * and suggestions for adding custom mappings.
 */

import { getRegistry, WidgetMappingRegistry } from '../registry/widget-mapping-registry';

/**
 * Fallback strategy
 */
export enum FallbackStrategy {
  GENERIC = 'generic',           // Use generic container/div
  SIMILAR = 'similar',            // Use similar widget based on name
  PRESERVE = 'preserve',          // Keep original widget name with comment
  CUSTOM = 'custom',              // Use custom fallback from config
}

/**
 * Fallback result
 */
export interface FallbackResult {
  widgetName: string;
  strategy: FallbackStrategy;
  warning: string;
  suggestion: string;
  originalWidget: string;
}

/**
 * Unmapped widget record
 */
export interface UnmappedWidgetRecord {
  originalWidget: string;
  sourceFramework: 'react' | 'flutter';
  targetFramework: 'react' | 'flutter';
  fallbackUsed: string;
  occurrences: number;
  firstSeen: number;
  lastSeen: number;
}

/**
 * Fallback Handler class
 */
export class FallbackHandler {
  private static instance: FallbackHandler;
  private registry: WidgetMappingRegistry;
  private unmappedWidgets: Map<string, UnmappedWidgetRecord> = new Map();
  private strategy: FallbackStrategy = FallbackStrategy.GENERIC;

  private constructor() {
    this.registry = getRegistry();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FallbackHandler {
    if (!FallbackHandler.instance) {
      FallbackHandler.instance = new FallbackHandler();
    }
    return FallbackHandler.instance;
  }

  /**
   * Set fallback strategy
   */
  public setStrategy(strategy: FallbackStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get fallback strategy
   */
  public getStrategy(): FallbackStrategy {
    return this.strategy;
  }

  /**
   * Get fallback widget for unmapped widget
   */
  public getFallbackWidget(
    originalWidget: string,
    sourceFramework: 'react' | 'flutter',
    targetFramework: 'react' | 'flutter'
  ): FallbackResult {
    // Record unmapped widget
    this.recordUnmappedWidget(originalWidget, sourceFramework, targetFramework);

    // Apply fallback strategy
    let fallbackWidget: string;
    let strategy: FallbackStrategy;

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
  private recordUnmappedWidget(
    originalWidget: string,
    sourceFramework: 'react' | 'flutter',
    targetFramework: 'react' | 'flutter'
  ): void {
    const key = `${sourceFramework}:${originalWidget}:${targetFramework}`;
    const existing = this.unmappedWidgets.get(key);

    if (existing) {
      existing.occurrences++;
      existing.lastSeen = Date.now();
    } else {
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
  private getGenericFallback(framework: 'react' | 'flutter'): string {
    return framework === 'react' ? 'div' : 'Container';
  }

  /**
   * Find similar widget based on name
   */
  private findSimilarWidget(originalWidget: string, targetFramework: 'react' | 'flutter'): string {
    const lowerWidget = originalWidget.toLowerCase();

    // Common patterns
    const patterns: Record<string, { react: string; flutter: string }> = {
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
  private getCustomFallback(originalWidget: string, targetFramework: 'react' | 'flutter'): string {
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
  private generateWarning(
    originalWidget: string,
    sourceFramework: 'react' | 'flutter',
    targetFramework: 'react' | 'flutter',
    fallbackWidget: string
  ): string {
    return (
      `⚠️  Unmapped Widget: "${originalWidget}" (${sourceFramework}) has no mapping to ${targetFramework}\n` +
      `   Using fallback: ${fallbackWidget}`
    );
  }

  /**
   * Generate suggestion message
   */
  private generateSuggestion(
    originalWidget: string,
    sourceFramework: 'react' | 'flutter',
    targetFramework: 'react' | 'flutter'
  ): string {
    const mappingKey = sourceFramework === 'react' ? 'react_to_flutter' : 'flutter_to_react';
    const targetKey = targetFramework === 'react' ? 'react' : 'flutter';

    return (
      `💡 To resolve this warning, add a custom mapping in widget-mappings.yaml:\n\n` +
      `${mappingKey}:\n` +
      `  ${originalWidget}:\n` +
      `    ${targetKey}: YourTargetWidget\n` +
      `    props:\n` +
      `      # Add prop mappings here\n`
    );
  }

  /**
   * Get all unmapped widgets
   */
  public getUnmappedWidgets(): UnmappedWidgetRecord[] {
    return Array.from(this.unmappedWidgets.values());
  }

  /**
   * Get unmapped widgets summary
   */
  public getUnmappedWidgetsSummary(): string {
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
  public clearUnmappedWidgets(): void {
    this.unmappedWidgets.clear();
  }

  /**
   * Export unmapped widgets to YAML template
   */
  public exportUnmappedWidgetsTemplate(): string {
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

/**
 * Get singleton instance of FallbackHandler
 */
export function getFallbackHandler(): FallbackHandler {
  return FallbackHandler.getInstance();
}
