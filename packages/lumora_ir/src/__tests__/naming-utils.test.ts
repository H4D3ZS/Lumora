import * as fs from 'fs';
import * as path from 'path';
import { ModeConfig, DevelopmentMode, initModeConfig } from '../config/mode-config';
import {
  applyFileNaming,
  applyIdentifierNaming,
  applyComponentNaming,
  generateFileName,
  generateClassName,
  generateIdentifierName,
  convertNamingConvention,
} from '../utils/naming-utils';

describe('NamingUtils', () => {
  const testDir = path.join(__dirname, 'test-naming-utils');
  let config: ModeConfig;

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('applyFileNaming', () => {
    it('should apply snake_case convention', () => {
      config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        namingConventions: { fileNaming: 'snake_case' },
      });

      expect(applyFileNaming('MyComponent', config)).toBe('my_component');
      expect(applyFileNaming('user-profile', config)).toBe('user_profile');
      expect(applyFileNaming('UserProfile', config)).toBe('user_profile');
    });

    it('should apply kebab-case convention', () => {
      config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        namingConventions: { fileNaming: 'kebab-case' },
      });

      expect(applyFileNaming('MyComponent', config)).toBe('my-component');
      expect(applyFileNaming('user_profile', config)).toBe('user-profile');
    });

    it('should apply PascalCase convention', () => {
      config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        namingConventions: { fileNaming: 'PascalCase' },
      });

      expect(applyFileNaming('my-component', config)).toBe('MyComponent');
      expect(applyFileNaming('user_profile', config)).toBe('UserProfile');
    });
  });

  describe('applyIdentifierNaming', () => {
    it('should apply camelCase convention', () => {
      config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        namingConventions: { identifierNaming: 'camelCase' },
      });

      expect(applyIdentifierNaming('MyVariable', config)).toBe('myVariable');
      expect(applyIdentifierNaming('user_name', config)).toBe('userName');
      expect(applyIdentifierNaming('user-name', config)).toBe('userName');
    });

    it('should apply PascalCase convention', () => {
      config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        namingConventions: { identifierNaming: 'PascalCase' },
      });

      expect(applyIdentifierNaming('myVariable', config)).toBe('MyVariable');
      expect(applyIdentifierNaming('user_name', config)).toBe('UserName');
    });
  });

  describe('applyComponentNaming', () => {
    it('should apply PascalCase convention', () => {
      config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        namingConventions: { componentNaming: 'PascalCase' },
      });

      expect(applyComponentNaming('my-component', config)).toBe('MyComponent');
      expect(applyComponentNaming('user_profile', config)).toBe('UserProfile');
    });
  });

  describe('generateFileName', () => {
    it('should generate file name with extension', () => {
      config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        namingConventions: { fileNaming: 'snake_case' },
      });

      expect(generateFileName('MyComponent', 'tsx', config)).toBe('my_component.tsx');
      expect(generateFileName('UserProfile', 'dart', config)).toBe('user_profile.dart');
    });

    it('should generate file name with kebab-case', () => {
      config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        namingConventions: { fileNaming: 'kebab-case' },
      });

      expect(generateFileName('MyComponent', 'tsx', config)).toBe('my-component.tsx');
    });
  });

  describe('generateClassName', () => {
    it('should generate class name in PascalCase', () => {
      config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        namingConventions: { componentNaming: 'PascalCase' },
      });

      expect(generateClassName('my-component', config)).toBe('MyComponent');
      expect(generateClassName('user_profile', config)).toBe('UserProfile');
    });
  });

  describe('generateIdentifierName', () => {
    it('should generate identifier name in camelCase', () => {
      config = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        namingConventions: { identifierNaming: 'camelCase' },
      });

      expect(generateIdentifierName('MyVariable', config)).toBe('myVariable');
      expect(generateIdentifierName('user_name', config)).toBe('userName');
    });
  });

  describe('convertNamingConvention', () => {
    it('should convert from snake_case to camelCase', () => {
      expect(convertNamingConvention('user_name', 'snake_case', 'camelCase')).toBe('userName');
      expect(convertNamingConvention('my_component', 'snake_case', 'camelCase')).toBe('myComponent');
    });

    it('should convert from snake_case to PascalCase', () => {
      expect(convertNamingConvention('user_name', 'snake_case', 'PascalCase')).toBe('UserName');
      expect(convertNamingConvention('my_component', 'snake_case', 'PascalCase')).toBe('MyComponent');
    });

    it('should convert from kebab-case to camelCase', () => {
      expect(convertNamingConvention('user-name', 'kebab-case', 'camelCase')).toBe('userName');
      expect(convertNamingConvention('my-component', 'kebab-case', 'camelCase')).toBe('myComponent');
    });

    it('should convert from PascalCase to snake_case', () => {
      expect(convertNamingConvention('UserName', 'PascalCase', 'snake_case')).toBe('user_name');
      expect(convertNamingConvention('MyComponent', 'PascalCase', 'snake_case')).toBe('my_component');
    });

    it('should convert from camelCase to kebab-case', () => {
      expect(convertNamingConvention('userName', 'camelCase', 'kebab-case')).toBe('user-name');
      expect(convertNamingConvention('myComponent', 'camelCase', 'kebab-case')).toBe('my-component');
    });

    it('should return same string if from and to are the same', () => {
      expect(convertNamingConvention('userName', 'camelCase', 'camelCase')).toBe('userName');
      expect(convertNamingConvention('user_name', 'snake_case', 'snake_case')).toBe('user_name');
    });
  });
});

