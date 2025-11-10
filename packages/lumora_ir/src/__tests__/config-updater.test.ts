/**
 * Config Updater Tests
 */

import { ConfigUpdater } from '../assets/config-updater';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';

describe('ConfigUpdater', () => {
  let tempDir: string;
  let updater: ConfigUpdater;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-updater-test-'));
    updater = new ConfigUpdater();
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('updatePubspecYaml', () => {
    it('should add assets to pubspec.yaml', () => {
      const pubspecPath = path.join(tempDir, 'pubspec.yaml');
      const initialContent = yaml.dump({
        name: 'test_app',
        flutter: {},
      });
      fs.writeFileSync(pubspecPath, initialContent);

      updater.updatePubspecYaml(pubspecPath, [
        'assets/images/logo.png',
        'assets/images/icon.png',
      ]);

      const content = fs.readFileSync(pubspecPath, 'utf8');
      const pubspec = yaml.load(content) as any;

      expect(pubspec.flutter.assets).toContain('assets/images/logo.png');
      expect(pubspec.flutter.assets).toContain('assets/images/icon.png');
    });

    it('should merge with existing assets', () => {
      const pubspecPath = path.join(tempDir, 'pubspec.yaml');
      const initialContent = yaml.dump({
        name: 'test_app',
        flutter: {
          assets: ['assets/existing.png'],
        },
      });
      fs.writeFileSync(pubspecPath, initialContent);

      updater.updatePubspecYaml(pubspecPath, ['assets/new.png']);

      const content = fs.readFileSync(pubspecPath, 'utf8');
      const pubspec = yaml.load(content) as any;

      expect(pubspec.flutter.assets).toContain('assets/existing.png');
      expect(pubspec.flutter.assets).toContain('assets/new.png');
    });

    it('should throw error if pubspec.yaml not found', () => {
      expect(() => {
        updater.updatePubspecYaml('/non/existent/pubspec.yaml', []);
      }).toThrow();
    });
  });

  describe('updatePubspecFonts', () => {
    it('should add fonts to pubspec.yaml', () => {
      const pubspecPath = path.join(tempDir, 'pubspec.yaml');
      const initialContent = yaml.dump({
        name: 'test_app',
        flutter: {},
      });
      fs.writeFileSync(pubspecPath, initialContent);

      updater.updatePubspecFonts(pubspecPath, [
        {
          family: 'Roboto',
          fonts: [
            { asset: 'assets/fonts/Roboto-Regular.ttf', weight: 400 },
            { asset: 'assets/fonts/Roboto-Bold.ttf', weight: 700 },
          ],
        },
      ]);

      const content = fs.readFileSync(pubspecPath, 'utf8');
      const pubspec = yaml.load(content) as any;

      expect(pubspec.flutter.fonts).toHaveLength(1);
      expect(pubspec.flutter.fonts[0].family).toBe('Roboto');
      expect(pubspec.flutter.fonts[0].fonts).toHaveLength(2);
    });

    it('should merge with existing fonts', () => {
      const pubspecPath = path.join(tempDir, 'pubspec.yaml');
      const initialContent = yaml.dump({
        name: 'test_app',
        flutter: {
          fonts: [
            {
              family: 'Roboto',
              fonts: [{ asset: 'assets/fonts/Roboto-Regular.ttf' }],
            },
          ],
        },
      });
      fs.writeFileSync(pubspecPath, initialContent);

      updater.updatePubspecFonts(pubspecPath, [
        {
          family: 'Roboto',
          fonts: [{ asset: 'assets/fonts/Roboto-Bold.ttf', weight: 700 }],
        },
      ]);

      const content = fs.readFileSync(pubspecPath, 'utf8');
      const pubspec = yaml.load(content) as any;

      expect(pubspec.flutter.fonts[0].fonts).toHaveLength(2);
    });
  });

  describe('updatePackageJson', () => {
    it('should add asset metadata to package.json', () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      const initialContent = JSON.stringify({
        name: 'test-app',
        version: '1.0.0',
      });
      fs.writeFileSync(packageJsonPath, initialContent);

      updater.updatePackageJson(packageJsonPath, [
        'images/logo.png',
        'images/icon.png',
      ]);

      const content = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);

      expect(packageJson.lumora.assets).toContain('images/logo.png');
      expect(packageJson.lumora.assets).toContain('images/icon.png');
    });

    it('should throw error if package.json not found', () => {
      expect(() => {
        updater.updatePackageJson('/non/existent/package.json', []);
      }).toThrow();
    });
  });

  describe('extractFontConfigs', () => {
    it('should extract font configurations from asset list', () => {
      const assets = [
        'assets/fonts/Roboto-Regular.ttf',
        'assets/fonts/Roboto-Bold.ttf',
        'assets/fonts/OpenSans-Regular.ttf',
      ];

      const configs = updater.extractFontConfigs(assets);

      expect(configs).toHaveLength(2);
      
      const roboto = configs.find(c => c.family === 'Roboto');
      expect(roboto).toBeDefined();
      expect(roboto!.fonts).toHaveLength(2);
      
      const openSans = configs.find(c => c.family === 'OpenSans');
      expect(openSans).toBeDefined();
      expect(openSans!.fonts).toHaveLength(1);
    });

    it('should extract font weights correctly', () => {
      const assets = [
        'assets/fonts/Roboto-Light.ttf',
        'assets/fonts/Roboto-Regular.ttf',
        'assets/fonts/Roboto-Bold.ttf',
      ];

      const configs = updater.extractFontConfigs(assets);
      const roboto = configs[0];

      const light = roboto.fonts.find(f => f.weight === 300);
      const regular = roboto.fonts.find(f => f.weight === 400);
      const bold = roboto.fonts.find(f => f.weight === 700);

      expect(light).toBeDefined();
      expect(regular).toBeDefined();
      expect(bold).toBeDefined();
    });

    it('should extract font styles correctly', () => {
      const assets = [
        'assets/fonts/Roboto-Italic.ttf',
        'assets/fonts/Roboto-BoldItalic.ttf',
      ];

      const configs = updater.extractFontConfigs(assets);
      const roboto = configs[0];

      expect(roboto.fonts.every(f => f.style === 'italic')).toBe(true);
    });
  });

  describe('validateAssetConfig', () => {
    it('should validate that assets are configured', () => {
      const pubspecPath = path.join(tempDir, 'pubspec.yaml');
      const content = yaml.dump({
        name: 'test_app',
        flutter: {
          assets: ['assets/images/logo.png'],
        },
      });
      fs.writeFileSync(pubspecPath, content);

      const result = updater.validateAssetConfig(pubspecPath, [
        'assets/images/logo.png',
      ]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report missing assets', () => {
      const pubspecPath = path.join(tempDir, 'pubspec.yaml');
      const content = yaml.dump({
        name: 'test_app',
        flutter: {
          assets: [],
        },
      });
      fs.writeFileSync(pubspecPath, content);

      const result = updater.validateAssetConfig(pubspecPath, [
        'assets/images/missing.png',
      ]);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
