import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ModeConfig, DevelopmentMode, LumoraConfig, initModeConfig, loadModeConfig } from '../config/mode-config';

describe('ModeConfig', () => {
  const testDir = path.join(__dirname, 'test-mode-config');
  const configPath = path.join(testDir, 'lumora.yaml');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('initialization', () => {
    it('should create default configuration when no file exists', () => {
      const config = new ModeConfig(testDir);
      const loadedConfig = config.getConfig();

      expect(loadedConfig.mode).toBe(DevelopmentMode.UNIVERSAL);
      expect(loadedConfig.reactDir).toBe('web/src');
      expect(loadedConfig.flutterDir).toBe('mobile/lib');
      expect(loadedConfig.storageDir).toBe('.lumora/ir');
    });

    it('should initialize with React mode', () => {
      const config = initModeConfig(testDir, DevelopmentMode.REACT);

      expect(config.getMode()).toBe(DevelopmentMode.REACT);
      expect(config.isReactFirst()).toBe(true);
      expect(config.isFlutterFirst()).toBe(false);
      expect(config.isUniversal()).toBe(false);
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should initialize with Flutter mode', () => {
      const config = initModeConfig(testDir, DevelopmentMode.FLUTTER);

      expect(config.getMode()).toBe(DevelopmentMode.FLUTTER);
      expect(config.isReactFirst()).toBe(false);
      expect(config.isFlutterFirst()).toBe(true);
      expect(config.isUniversal()).toBe(false);
    });

    it('should initialize with Universal mode', () => {
      const config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL);

      expect(config.getMode()).toBe(DevelopmentMode.UNIVERSAL);
      expect(config.isReactFirst()).toBe(false);
      expect(config.isFlutterFirst()).toBe(false);
      expect(config.isUniversal()).toBe(true);
    });

    it('should throw error if config already exists', () => {
      initModeConfig(testDir, DevelopmentMode.REACT);

      expect(() => {
        initModeConfig(testDir, DevelopmentMode.FLUTTER);
      }).toThrow('lumora.yaml already exists');
    });

    it('should initialize with custom options', () => {
      const config = initModeConfig(testDir, DevelopmentMode.REACT, {
        reactDir: 'src',
        flutterDir: 'lib',
        storageDir: '.ir',
      });

      expect(config.getReactDir()).toBe('src');
      expect(config.getFlutterDir()).toBe('lib');
      expect(config.getStorageDir()).toBe('.ir');
    });
  });

  describe('loading configuration', () => {
    it('should load existing configuration', () => {
      const testConfig: LumoraConfig = {
        mode: DevelopmentMode.FLUTTER,
        reactDir: 'web',
        flutterDir: 'mobile',
        storageDir: '.lumora',
      };

      fs.writeFileSync(configPath, yaml.dump(testConfig), 'utf8');

      const config = loadModeConfig(testDir);
      const loaded = config.getConfig();

      expect(loaded.mode).toBe(DevelopmentMode.FLUTTER);
      expect(loaded.reactDir).toBe('web');
      expect(loaded.flutterDir).toBe('mobile');
      expect(loaded.storageDir).toBe('.lumora');
    });

    it('should use defaults for missing fields', () => {
      const partialConfig = {
        mode: DevelopmentMode.REACT,
      };

      fs.writeFileSync(configPath, yaml.dump(partialConfig), 'utf8');

      const config = loadModeConfig(testDir);
      const loaded = config.getConfig();

      expect(loaded.mode).toBe(DevelopmentMode.REACT);
      expect(loaded.reactDir).toBe('web/src');
      expect(loaded.flutterDir).toBe('mobile/lib');
    });

    it('should handle invalid mode gracefully', () => {
      const invalidConfig = {
        mode: 'invalid-mode',
        reactDir: 'web',
      };

      fs.writeFileSync(configPath, yaml.dump(invalidConfig), 'utf8');

      const config = loadModeConfig(testDir);

      // Should fall back to default mode
      expect(config.getMode()).toBe(DevelopmentMode.UNIVERSAL);
    });

    it('should handle corrupted YAML gracefully', () => {
      fs.writeFileSync(configPath, 'invalid: yaml: content: [', 'utf8');

      const config = loadModeConfig(testDir);

      // Should use default configuration
      expect(config.getMode()).toBe(DevelopmentMode.UNIVERSAL);
    });
  });

  describe('saving configuration', () => {
    it('should save configuration to file', () => {
      const config = new ModeConfig(testDir);
      config.setMode(DevelopmentMode.REACT);

      expect(fs.existsSync(configPath)).toBe(true);

      const fileContent = fs.readFileSync(configPath, 'utf8');
      const parsed = yaml.load(fileContent) as LumoraConfig;

      expect(parsed.mode).toBe(DevelopmentMode.REACT);
    });

    it('should update existing configuration', () => {
      const config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL);

      config.save({
        mode: DevelopmentMode.FLUTTER,
        reactDir: 'custom/react',
      });

      const reloaded = loadModeConfig(testDir);
      expect(reloaded.getMode()).toBe(DevelopmentMode.FLUTTER);
      expect(reloaded.getReactDir()).toBe('custom/react');
    });
  });

  describe('mode queries', () => {
    it('should correctly identify React-first mode', () => {
      const config = initModeConfig(testDir, DevelopmentMode.REACT);

      expect(config.isReactFirst()).toBe(true);
      expect(config.isFlutterFirst()).toBe(false);
      expect(config.isUniversal()).toBe(false);
    });

    it('should correctly identify Flutter-first mode', () => {
      const config = initModeConfig(testDir, DevelopmentMode.FLUTTER);

      expect(config.isReactFirst()).toBe(false);
      expect(config.isFlutterFirst()).toBe(true);
      expect(config.isUniversal()).toBe(false);
    });

    it('should correctly identify Universal mode', () => {
      const config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL);

      expect(config.isReactFirst()).toBe(false);
      expect(config.isFlutterFirst()).toBe(false);
      expect(config.isUniversal()).toBe(true);
    });
  });

  describe('configuration reload', () => {
    it('should reload configuration from file', () => {
      const config = initModeConfig(testDir, DevelopmentMode.REACT);

      // Manually modify the file
      const newConfig: LumoraConfig = {
        mode: DevelopmentMode.FLUTTER,
        reactDir: 'web/src',
        flutterDir: 'mobile/lib',
      };
      fs.writeFileSync(configPath, yaml.dump(newConfig), 'utf8');

      // Reload
      config.reload();

      expect(config.getMode()).toBe(DevelopmentMode.FLUTTER);
    });
  });

  describe('getters', () => {
    it('should return correct directory paths', () => {
      const config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        reactDir: 'custom/react',
        flutterDir: 'custom/flutter',
        storageDir: 'custom/ir',
      });

      expect(config.getReactDir()).toBe('custom/react');
      expect(config.getFlutterDir()).toBe('custom/flutter');
      expect(config.getStorageDir()).toBe('custom/ir');
      expect(config.getConfigPath()).toBe(configPath);
    });
  });

  describe('naming conventions', () => {
    it('should load naming conventions', () => {
      const config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        namingConventions: {
          fileNaming: 'kebab-case',
          identifierNaming: 'PascalCase',
        },
      });

      const loaded = config.getConfig();
      expect(loaded.namingConventions?.fileNaming).toBe('kebab-case');
      expect(loaded.namingConventions?.identifierNaming).toBe('PascalCase');
    });
  });

  describe('formatting preferences', () => {
    it('should load formatting preferences', () => {
      const config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        formatting: {
          indentSize: 4,
          useTabs: true,
          lineWidth: 120,
        },
      });

      const loaded = config.getConfig();
      expect(loaded.formatting?.indentSize).toBe(4);
      expect(loaded.formatting?.useTabs).toBe(true);
      expect(loaded.formatting?.lineWidth).toBe(120);
    });
  });

  describe('default configuration', () => {
    it('should return default configuration', () => {
      const defaults = ModeConfig.getDefaultConfig();

      expect(defaults.mode).toBe(DevelopmentMode.UNIVERSAL);
      expect(defaults.reactDir).toBe('web/src');
      expect(defaults.flutterDir).toBe('mobile/lib');
      expect(defaults.storageDir).toBe('.lumora/ir');
    });
  });
});
