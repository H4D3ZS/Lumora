/**
 * Plugin Registry Tests
 */

import { PluginRegistry, Plugin } from '../registry/plugin-registry';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry('0.1.0');
  });

  describe('register', () => {
    it('should register a valid plugin', () => {
      const plugin: Plugin = {
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
        },
        compatibility: {
          lumora: '^0.1.0',
        },
        enabled: true,
      };

      const result = registry.register(plugin);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject plugin without name', () => {
      const plugin: Plugin = {
        metadata: {
          name: '',
          version: '1.0.0',
        },
        compatibility: {},
        enabled: true,
      };

      const result = registry.register(plugin);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin name is required');
    });

    it('should reject plugin without version', () => {
      const plugin: Plugin = {
        metadata: {
          name: 'test-plugin',
          version: '',
        },
        compatibility: {},
        enabled: true,
      };

      const result = registry.register(plugin);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin version is required');
    });

    it('should warn about native code', () => {
      const plugin: Plugin = {
        metadata: {
          name: 'native-plugin',
          version: '1.0.0',
        },
        compatibility: {},
        capabilities: {
          nativeCode: true,
        },
        enabled: true,
      };

      const result = registry.register(plugin);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('native code');
    });
  });

  describe('getPlugin', () => {
    it('should retrieve registered plugin', () => {
      const plugin: Plugin = {
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
        },
        compatibility: {},
        enabled: true,
      };

      registry.register(plugin);
      const retrieved = registry.getPlugin('test-plugin');
      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.name).toBe('test-plugin');
    });

    it('should return undefined for non-existent plugin', () => {
      const retrieved = registry.getPlugin('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('enablePlugin and disablePlugin', () => {
    it('should enable and disable plugins', () => {
      const plugin: Plugin = {
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
        },
        compatibility: {},
        enabled: false,
      };

      registry.register(plugin);
      
      expect(registry.enablePlugin('test-plugin')).toBe(true);
      expect(registry.getPlugin('test-plugin')?.enabled).toBe(true);
      
      expect(registry.disablePlugin('test-plugin')).toBe(true);
      expect(registry.getPlugin('test-plugin')?.enabled).toBe(false);
    });
  });

  describe('resolveDependencies', () => {
    it('should resolve plugin dependencies', () => {
      const pluginA: Plugin = {
        metadata: { name: 'plugin-a', version: '1.0.0' },
        compatibility: {},
        enabled: true,
      };

      const pluginB: Plugin = {
        metadata: { name: 'plugin-b', version: '1.0.0' },
        compatibility: {},
        dependencies: [{ name: 'plugin-a', version: '1.0.0' }],
        enabled: true,
      };

      registry.register(pluginA);
      registry.register(pluginB);

      const resolved = registry.resolveDependencies('plugin-b');
      expect(resolved).toEqual(['plugin-a', 'plugin-b']);
    });
  });

  describe('getPluginWidgets', () => {
    it('should return widgets from plugin', () => {
      const plugin: Plugin = {
        metadata: { name: 'widget-plugin', version: '1.0.0' },
        compatibility: {},
        capabilities: {
          widgets: [
            { name: 'CustomButton', type: 'component', framework: 'react' },
            { name: 'CustomCard', type: 'widget', framework: 'flutter' },
          ],
        },
        enabled: true,
      };

      registry.register(plugin);
      const widgets = registry.getPluginWidgets('widget-plugin');
      expect(widgets).toHaveLength(2);
      expect(widgets[0].name).toBe('CustomButton');
    });
  });
});
