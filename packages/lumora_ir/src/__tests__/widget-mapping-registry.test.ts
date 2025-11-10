/**
 * Tests for Widget Mapping Registry
 */

import { WidgetMappingRegistry, getRegistry, resetRegistry } from '../registry/widget-mapping-registry';
import * as path from 'path';

describe('WidgetMappingRegistry', () => {
  let registry: WidgetMappingRegistry;

  beforeEach(() => {
    resetRegistry();
    registry = new WidgetMappingRegistry();
  });

  describe('Default Mappings', () => {
    it('should load default mappings on initialization', () => {
      expect(registry.hasMapping('Container')).toBe(true);
      expect(registry.hasMapping('Text')).toBe(true);
      expect(registry.hasMapping('Button')).toBe(true);
    });

    it('should have at least 50 widget mappings', () => {
      const widgetNames = registry.getAllWidgetNames();
      expect(widgetNames.length).toBeGreaterThanOrEqual(50);
    });

    it('should return correct schema version', () => {
      const version = registry.getSchemaVersion();
      expect(version).toBe('1.0');
    });
  });

  describe('Widget Lookup', () => {
    it('should get mapping by widget name', () => {
      const mapping = registry.getMapping('Container');
      expect(mapping).toBeDefined();
      expect(mapping?.react.component).toBe('div');
      expect(mapping?.flutter.widget).toBe('Container');
    });

    it('should get widget name from React component', () => {
      const widgetName = registry.getWidgetNameFromReact('button');
      expect(widgetName).toBeDefined();
    });

    it('should get widget name from Flutter widget', () => {
      const widgetName = registry.getWidgetNameFromFlutter('Text');
      expect(widgetName).toBe('Text');
    });

    it('should return undefined for non-existent widget', () => {
      const mapping = registry.getMapping('NonExistentWidget');
      expect(mapping).toBeUndefined();
    });
  });

  describe('React to Flutter Conversion', () => {
    it('should convert React component to Flutter widget', () => {
      const flutterWidget = registry.getFlutterWidget('div');
      expect(flutterWidget).toBe('Container');
    });

    it('should convert button to ElevatedButton', () => {
      const flutterWidget = registry.getFlutterWidget('button');
      expect(flutterWidget).toBe('ElevatedButton');
    });

    it('should return fallback for unmapped React component', () => {
      const flutterWidget = registry.getFlutterWidget('unknown-component');
      expect(flutterWidget).toBe('Container');
    });
  });

  describe('Flutter to React Conversion', () => {
    it('should convert Flutter widget to React component', () => {
      const reactComponent = registry.getReactComponent('Container');
      expect(reactComponent).toBe('div');
    });

    it('should convert Text to span', () => {
      const reactComponent = registry.getReactComponent('Text');
      expect(reactComponent).toBe('span');
    });

    it('should return fallback for unmapped Flutter widget', () => {
      const reactComponent = registry.getReactComponent('UnknownWidget');
      expect(reactComponent).toBe('div');
    });
  });

  describe('Prop Mappings', () => {
    it('should get prop mapping for a widget', () => {
      const propMapping = registry.getPropMapping('Container', 'padding');
      expect(propMapping).toBeDefined();
      expect(propMapping?.react).toBe('padding');
      expect(propMapping?.flutter).toBe('padding');
      expect(propMapping?.type).toBe('number');
    });

    it('should convert React prop to Flutter prop', () => {
      const flutterProp = registry.getFlutterProp('Text', 'children');
      expect(flutterProp).toBe('data');
    });

    it('should convert Flutter prop to React prop', () => {
      const reactProp = registry.getReactProp('Text', 'data');
      expect(reactProp).toBe('children');
    });

    it('should return original prop name if no mapping exists', () => {
      const flutterProp = registry.getFlutterProp('Container', 'unknownProp');
      expect(flutterProp).toBe('unknownProp');
    });
  });

  describe('Style Mappings', () => {
    it('should get style mapping for a widget', () => {
      const styleMapping = registry.getStyleMapping('Container', 'backgroundColor');
      expect(styleMapping).toBeDefined();
      expect(styleMapping?.react).toBe('backgroundColor');
      expect(styleMapping?.flutter).toBe('decoration.color');
    });

    it('should return undefined for non-existent style mapping', () => {
      const styleMapping = registry.getStyleMapping('Text', 'unknownStyle');
      expect(styleMapping).toBeUndefined();
    });
  });

  describe('Event Mappings', () => {
    it('should get event mapping for a widget', () => {
      const eventMapping = registry.getEventMapping('Button', 'onClick');
      expect(eventMapping).toBeDefined();
      expect(eventMapping?.react).toBe('onClick');
      expect(eventMapping?.flutter).toBe('onPressed');
    });

    it('should convert React event to Flutter event', () => {
      const flutterEvent = registry.getFlutterEvent('Button', 'onClick');
      expect(flutterEvent).toBe('onPressed');
    });

    it('should convert Flutter event to React event', () => {
      const reactEvent = registry.getReactEvent('GestureDetector', 'onTap');
      expect(reactEvent).toBe('onClick');
    });

    it('should return original event name if no mapping exists', () => {
      const flutterEvent = registry.getFlutterEvent('Container', 'unknownEvent');
      expect(flutterEvent).toBe('unknownEvent');
    });
  });

  describe('Imports', () => {
    it('should get Flutter import for a widget', () => {
      const flutterImport = registry.getImport('Container', 'flutter');
      expect(flutterImport).toBe('package:flutter/material.dart');
    });

    it('should get React import for a widget', () => {
      const reactImport = registry.getImport('View', 'react');
      expect(reactImport).toBe('react-native');
    });

    it('should return undefined if no import is specified', () => {
      const reactImport = registry.getImport('Container', 'react');
      expect(reactImport).toBeUndefined();
    });
  });

  describe('Fallbacks', () => {
    it('should get React fallback', () => {
      const fallback = registry.getFallback('UnknownWidget', 'react');
      expect(fallback).toBe('div');
    });

    it('should get Flutter fallback', () => {
      const fallback = registry.getFallback('UnknownWidget', 'flutter');
      expect(fallback).toBe('Container');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const registry1 = getRegistry();
      const registry2 = getRegistry();
      expect(registry1).toBe(registry2);
    });

    it('should reset the singleton instance', () => {
      const registry1 = getRegistry();
      resetRegistry();
      const registry2 = getRegistry();
      expect(registry1).not.toBe(registry2);
    });
  });

  describe('Common Widget Mappings', () => {
    const commonMappings = [
      { react: 'div', flutter: 'Container' },
      { react: 'span', flutter: 'Text' },
      { react: 'button', flutter: 'ElevatedButton' },
      { react: 'input', flutter: 'TextField' },
      { react: 'img', flutter: 'Image.network' },
      { react: 'ul', flutter: 'ListView' },
    ];

    commonMappings.forEach(({ react, flutter }) => {
      it(`should map ${react} to ${flutter}`, () => {
        const flutterWidget = registry.getFlutterWidget(react);
        expect(flutterWidget).toBe(flutter);
      });

      it(`should map ${flutter} to ${react}`, () => {
        const reactComponent = registry.getReactComponent(flutter);
        expect(reactComponent).toBe(react);
      });
    });
  });
});
