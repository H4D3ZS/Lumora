import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { loadAndApplyConfig, initConfigWithMappings, reloadConfig } from '../config/config-loader';
import { DevelopmentMode, LumoraConfig } from '../config/mode-config';
import { resetRegistry } from '../registry/widget-mapping-registry';

describe('ConfigLoader', () => {
  const testDir = path.join(__dirname, 'test-config-loader');
  const configPath = path.join(testDir, 'lumora.yaml');
  const customMappingsPath = path.join(testDir, 'custom-mappings.yaml');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    // Reset registry before each test
    resetRegistry();
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    // Reset registry after each test
    resetRegistry();
  });

  describe('loadAndApplyConfig', () => {
    it('should load config without custom mappings', () => {
      const testConfig: LumoraConfig = {
        mode: DevelopmentMode.UNIVERSAL,
        reactDir: 'web/src',
        flutterDir: 'mobile/lib',
      };

      fs.writeFileSync(configPath, yaml.dump(testConfig), 'utf8');

      const { modeConfig, registry } = loadAndApplyConfig(testDir);

      expect(modeConfig.getMode()).toBe(DevelopmentMode.UNIVERSAL);
      expect(registry).toBeDefined();
    });

    it('should load config with custom mappings', () => {
      const customMappings = {
        schemaVersion: '1.0',
        CustomWidget: {
          react: { component: 'CustomWidget' },
          flutter: { widget: 'CustomWidget' },
          custom: true,
        },
      };

      fs.writeFileSync(customMappingsPath, yaml.dump(customMappings), 'utf8');

      const testConfig: LumoraConfig = {
        mode: DevelopmentMode.UNIVERSAL,
        reactDir: 'web/src',
        flutterDir: 'mobile/lib',
        customMappings: 'custom-mappings.yaml',
      };

      fs.writeFileSync(configPath, yaml.dump(testConfig), 'utf8');

      const { modeConfig, registry } = loadAndApplyConfig(testDir);

      expect(modeConfig.getMode()).toBe(DevelopmentMode.UNIVERSAL);
      expect(modeConfig.getCustomMappings()).toBe('custom-mappings.yaml');
      expect(registry.hasMapping('CustomWidget')).toBe(true);
    });

    it('should handle missing custom mappings file gracefully', () => {
      const testConfig: LumoraConfig = {
        mode: DevelopmentMode.UNIVERSAL,
        reactDir: 'web/src',
        flutterDir: 'mobile/lib',
        customMappings: 'non-existent.yaml',
      };

      fs.writeFileSync(configPath, yaml.dump(testConfig), 'utf8');

      const { modeConfig, registry } = loadAndApplyConfig(testDir);

      expect(modeConfig.getMode()).toBe(DevelopmentMode.UNIVERSAL);
      expect(registry).toBeDefined();
      // Should still have default mappings
      expect(registry.hasMapping('Container')).toBe(true);
    });
  });

  describe('initConfigWithMappings', () => {
    it('should initialize config without custom mappings', () => {
      const { modeConfig, registry } = initConfigWithMappings(
        testDir,
        'universal'
      );

      expect(modeConfig.getMode()).toBe(DevelopmentMode.UNIVERSAL);
      expect(fs.existsSync(configPath)).toBe(true);
      expect(registry).toBeDefined();
    });

    it('should initialize config with custom mappings', () => {
      const customMappings = {
        schemaVersion: '1.0',
        CustomButton: {
          react: { component: 'CustomButton' },
          flutter: { widget: 'CustomButton' },
          custom: true,
        },
      };

      fs.writeFileSync(customMappingsPath, yaml.dump(customMappings), 'utf8');

      const { modeConfig, registry } = initConfigWithMappings(
        testDir,
        'react',
        'custom-mappings.yaml'
      );

      expect(modeConfig.getMode()).toBe(DevelopmentMode.REACT);
      expect(modeConfig.getCustomMappings()).toBe('custom-mappings.yaml');
      expect(registry.hasMapping('CustomButton')).toBe(true);
    });

    it('should handle absolute path for custom mappings', () => {
      const customMappings = {
        schemaVersion: '1.0',
        AbsoluteWidget: {
          react: { component: 'AbsoluteWidget' },
          flutter: { widget: 'AbsoluteWidget' },
          custom: true,
        },
      };

      fs.writeFileSync(customMappingsPath, yaml.dump(customMappings), 'utf8');

      const { modeConfig, registry } = initConfigWithMappings(
        testDir,
        'flutter',
        customMappingsPath
      );

      expect(modeConfig.getMode()).toBe(DevelopmentMode.FLUTTER);
      expect(registry.hasMapping('AbsoluteWidget')).toBe(true);
    });
  });

  describe('reloadConfig', () => {
    it('should reload config and custom mappings', () => {
      // Initial setup
      const customMappings = {
        schemaVersion: '1.0',
        InitialWidget: {
          react: { component: 'InitialWidget' },
          flutter: { widget: 'InitialWidget' },
          custom: true,
        },
      };

      fs.writeFileSync(customMappingsPath, yaml.dump(customMappings), 'utf8');

      const { modeConfig, registry } = initConfigWithMappings(
        testDir,
        'universal',
        'custom-mappings.yaml'
      );

      expect(modeConfig.getMode()).toBe(DevelopmentMode.UNIVERSAL);
      expect(registry.hasMapping('InitialWidget')).toBe(true);

      // Update config file
      const updatedConfig: LumoraConfig = {
        mode: DevelopmentMode.REACT,
        reactDir: 'web/src',
        flutterDir: 'mobile/lib',
        customMappings: 'custom-mappings.yaml',
      };

      fs.writeFileSync(configPath, yaml.dump(updatedConfig), 'utf8');

      // Update custom mappings
      const updatedMappings = {
        schemaVersion: '1.0',
        UpdatedWidget: {
          react: { component: 'UpdatedWidget' },
          flutter: { widget: 'UpdatedWidget' },
          custom: true,
        },
      };

      fs.writeFileSync(customMappingsPath, yaml.dump(updatedMappings), 'utf8');

      // Reload
      reloadConfig(modeConfig, registry);

      expect(modeConfig.getMode()).toBe(DevelopmentMode.REACT);
      expect(registry.hasMapping('UpdatedWidget')).toBe(true);
    });
  });
});

