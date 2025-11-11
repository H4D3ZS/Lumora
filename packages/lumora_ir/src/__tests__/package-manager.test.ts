/**
 * Package Manager Tests
 */

import { PackageManager } from '../registry/package-manager';
import * as fs from 'fs';
import * as path from 'path';

describe('PackageManager', () => {
  let manager: PackageManager;

  beforeEach(() => {
    manager = new PackageManager();
  });

  describe('checkPackageCompatibility', () => {
    it('should identify native packages', () => {
      const info = manager.checkPackageCompatibility('camera', '1.0.0', 'flutter');
      expect(info.hasNativeDependencies).toBe(true);
      expect(info.warnings.length).toBeGreaterThan(0);
    });

    it('should identify compatible packages', () => {
      const info = manager.checkPackageCompatibility('provider', '6.0.0', 'flutter');
      expect(info.isLumoraCompatible).toBe(true);
      expect(info.hasNativeDependencies).toBe(false);
    });

    it('should warn about unknown packages', () => {
      const info = manager.checkPackageCompatibility('unknown-package', '1.0.0', 'react');
      expect(info.isLumoraCompatible).toBe(false);
      expect(info.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('parsePubspec', () => {
    it('should parse valid pubspec.yaml', () => {
      const testPubspec = `
name: test_app
version: 1.0.0
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.0.0
`;
      const tempFile = path.join(__dirname, 'test-pubspec.yaml');
      fs.writeFileSync(tempFile, testPubspec);

      const pubspec = manager.parsePubspec(tempFile);
      expect(pubspec.name).toBe('test_app');
      expect(pubspec.dependencies).toBeDefined();

      fs.unlinkSync(tempFile);
    });

    it('should throw error for non-existent file', () => {
      expect(() => {
        manager.parsePubspec('/non/existent/pubspec.yaml');
      }).toThrow();
    });
  });

  describe('parsePackageJson', () => {
    it('should parse valid package.json', () => {
      const testPackage = {
        name: 'test-app',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          axios: '^1.0.0',
        },
      };
      const tempFile = path.join(__dirname, 'test-package.json');
      fs.writeFileSync(tempFile, JSON.stringify(testPackage));

      const packageJson = manager.parsePackageJson(tempFile);
      expect(packageJson.name).toBe('test-app');
      expect(packageJson.dependencies).toBeDefined();

      fs.unlinkSync(tempFile);
    });
  });

  describe('getDocumentationUrl', () => {
    it('should return pub.dev URL for Flutter packages', () => {
      const url = manager.getDocumentationUrl('provider', 'flutter');
      expect(url).toBe('https://pub.dev/packages/provider');
    });

    it('should return npmjs URL for React packages', () => {
      const url = manager.getDocumentationUrl('axios', 'react');
      expect(url).toBe('https://www.npmjs.com/package/axios');
    });
  });

  describe('packageToPlugin', () => {
    it('should convert package info to plugin', () => {
      const packageInfo = manager.checkPackageCompatibility('provider', '6.0.0', 'flutter');
      const plugin = manager.packageToPlugin(packageInfo);

      expect(plugin.metadata.name).toBe('provider');
      expect(plugin.metadata.version).toBe('6.0.0');
      expect(plugin.enabled).toBe(true);
    });

    it('should mark native packages correctly', () => {
      const packageInfo = manager.checkPackageCompatibility('camera', '1.0.0', 'flutter');
      const plugin = manager.packageToPlugin(packageInfo);

      expect(plugin.capabilities?.nativeCode).toBe(true);
      expect(plugin.compatibility.platforms).toEqual(['ios', 'android']);
    });
  });

  describe('warnAboutNativeDependencies', () => {
    it('should generate warnings for native packages', () => {
      const packages = [
        manager.checkPackageCompatibility('camera', '1.0.0', 'flutter'),
        manager.checkPackageCompatibility('provider', '6.0.0', 'flutter'),
      ];

      const warnings = manager.warnAboutNativeDependencies(packages);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('camera'))).toBe(true);
    });

    it('should return empty array when no native packages', () => {
      const packages = [
        manager.checkPackageCompatibility('provider', '6.0.0', 'flutter'),
      ];

      const warnings = manager.warnAboutNativeDependencies(packages);
      expect(warnings).toHaveLength(0);
    });
  });
});
