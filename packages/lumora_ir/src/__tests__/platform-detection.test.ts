/**
 * Platform Detection Tests
 * Tests for platform-specific code parsing and generation
 */

import { ReactPlatformParser, DartPlatformParser } from '../parsers/platform-parser';
import {
  ReactPlatformGenerator,
  DartPlatformGenerator,
  PlatformCodeGenerator,
} from '../parsers/platform-generator';
import { PlatformSchema, PlatformCode } from '../types/platform-types';
import * as parser from '@babel/parser';

describe('Platform Detection', () => {
  describe('ReactPlatformParser', () => {
    let platformParser: ReactPlatformParser;

    beforeEach(() => {
      platformParser = new ReactPlatformParser();
    });

    it('should detect iOS platform check', () => {
      const source = `
        function MyComponent() {
          if (Platform.OS === 'ios') {
            console.log('iOS');
          }
        }
      `;

      const ast = parser.parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      const result = platformParser.extractPlatformCode(ast, source);

      expect(result.hasPlatformCode).toBe(true);
      expect(result.platformCode.length).toBeGreaterThan(0);
      expect(result.platformCode[0].implementations[0].platforms).toContain('ios');
    });

    it('should detect Android platform check', () => {
      const source = `
        function MyComponent() {
          if (Platform.OS === 'android') {
            console.log('Android');
          }
        }
      `;

      const ast = parser.parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      const result = platformParser.extractPlatformCode(ast, source);

      expect(result.hasPlatformCode).toBe(true);
      expect(result.platformCode[0].implementations[0].platforms).toContain('android');
    });

    it('should detect multiple platform checks with fallback', () => {
      const source = `
        function MyComponent() {
          if (Platform.OS === 'ios') {
            console.log('iOS');
          } else if (Platform.OS === 'android') {
            console.log('Android');
          } else {
            console.log('Other');
          }
        }
      `;

      const ast = parser.parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      const result = platformParser.extractPlatformCode(ast, source);

      expect(result.hasPlatformCode).toBe(true);
      expect(result.platformCode[0].implementations.length).toBe(2);
      expect(result.platformCode[0].fallback).toBeDefined();
    });

    it('should warn when no fallback is provided', () => {
      const source = `
        function MyComponent() {
          if (Platform.OS === 'ios') {
            console.log('iOS');
          }
        }
      `;

      const ast = parser.parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      const result = platformParser.extractPlatformCode(ast, source);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('no fallback');
    });

    it('should detect ternary platform checks', () => {
      const source = `
        const value = Platform.OS === 'ios' ? 'iOS value' : 'Other value';
      `;

      const ast = parser.parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      const result = platformParser.extractPlatformCode(ast, source);

      expect(result.hasPlatformCode).toBe(true);
      expect(result.platformCode[0].implementations[0].platforms).toContain('ios');
      expect(result.platformCode[0].fallback).toBeDefined();
    });
  });

  describe('DartPlatformParser', () => {
    let platformParser: DartPlatformParser;

    beforeEach(() => {
      platformParser = new DartPlatformParser();
    });

    it('should detect iOS platform check', () => {
      const source = `
        void myFunction() {
          if (Platform.isIOS) {
            print('iOS');
          }
        }
      `;

      const result = platformParser.extractPlatformCode(source);

      expect(result.hasPlatformCode).toBe(true);
      expect(result.platformCode.length).toBeGreaterThan(0);
    });

    it('should detect Android platform check', () => {
      const source = `
        void myFunction() {
          if (Platform.isAndroid) {
            print('Android');
          }
        }
      `;

      const result = platformParser.extractPlatformCode(source);

      expect(result.hasPlatformCode).toBe(true);
      expect(result.platformCode.length).toBeGreaterThan(0);
    });

    it('should detect multiple platform checks', () => {
      const source = `
        void myFunction() {
          if (Platform.isIOS) {
            print('iOS');
          } else if (Platform.isAndroid) {
            print('Android');
          } else {
            print('Other');
          }
        }
      `;

      const result = platformParser.extractPlatformCode(source);

      expect(result.hasPlatformCode).toBe(true);
      expect(result.platformCode.length).toBeGreaterThan(0);
    });
  });

  describe('ReactPlatformGenerator', () => {
    let generator: ReactPlatformGenerator;

    beforeEach(() => {
      generator = new ReactPlatformGenerator({
        addComments: false,
        includeFallback: true,
      });
    });

    it('should generate iOS platform check', () => {
      const platformSchema: PlatformSchema = {
        platformCode: [
          {
            id: 'test',
            implementations: [
              {
                platforms: ['ios'],
                code: {
                  source: "console.log('iOS');",
                  language: 'typescript',
                },
              },
            ],
          },
        ],
        config: {
          includeFallback: true,
          warnOnPlatformCode: true,
          stripUnsupportedPlatforms: false,
        },
      };

      const code = generator.generateCode(platformSchema);

      expect(code).toContain("Platform.OS === 'ios'");
      expect(code).toContain("console.log('iOS');");
    });

    it('should generate multiple platform checks', () => {
      const platformSchema: PlatformSchema = {
        platformCode: [
          {
            id: 'test',
            implementations: [
              {
                platforms: ['ios'],
                code: {
                  source: "console.log('iOS');",
                  language: 'typescript',
                },
              },
              {
                platforms: ['android'],
                code: {
                  source: "console.log('Android');",
                  language: 'typescript',
                },
              },
            ],
            fallback: {
              source: "console.log('Other');",
              language: 'typescript',
            },
          },
        ],
        config: {
          includeFallback: true,
          warnOnPlatformCode: true,
          stripUnsupportedPlatforms: false,
        },
      };

      const code = generator.generateCode(platformSchema);

      expect(code).toContain("Platform.OS === 'ios'");
      expect(code).toContain("Platform.OS === 'android'");
      expect(code).toContain('else');
    });

    it('should generate imports', () => {
      const platformSchema: PlatformSchema = {
        platformCode: [
          {
            id: 'test',
            implementations: [
              {
                platforms: ['ios'],
                code: {
                  source: "console.log('iOS');",
                  language: 'typescript',
                },
              },
            ],
          },
        ],
      };

      const imports = generator.generateImports(platformSchema);

      expect(imports).toContain("import { Platform } from 'react-native';");
    });
  });

  describe('DartPlatformGenerator', () => {
    let generator: DartPlatformGenerator;

    beforeEach(() => {
      generator = new DartPlatformGenerator({
        addComments: false,
        includeFallback: true,
      });
    });

    it('should generate iOS platform check', () => {
      const platformSchema: PlatformSchema = {
        platformCode: [
          {
            id: 'test',
            implementations: [
              {
                platforms: ['ios'],
                code: {
                  source: "print('iOS');",
                  language: 'dart',
                },
              },
            ],
          },
        ],
        config: {
          includeFallback: true,
          warnOnPlatformCode: true,
          stripUnsupportedPlatforms: false,
        },
      };

      const code = generator.generateCode(platformSchema);

      expect(code).toContain('Platform.isIOS');
      expect(code).toContain("print('iOS');");
    });

    it('should generate multiple platform checks', () => {
      const platformSchema: PlatformSchema = {
        platformCode: [
          {
            id: 'test',
            implementations: [
              {
                platforms: ['ios'],
                code: {
                  source: "print('iOS');",
                  language: 'dart',
                },
              },
              {
                platforms: ['android'],
                code: {
                  source: "print('Android');",
                  language: 'dart',
                },
              },
            ],
            fallback: {
              source: "print('Other');",
              language: 'dart',
            },
          },
        ],
        config: {
          includeFallback: true,
          warnOnPlatformCode: true,
          stripUnsupportedPlatforms: false,
        },
      };

      const code = generator.generateCode(platformSchema);

      expect(code).toContain('Platform.isIOS');
      expect(code).toContain('Platform.isAndroid');
      expect(code).toContain('else');
    });

    it('should generate imports', () => {
      const platformSchema: PlatformSchema = {
        platformCode: [
          {
            id: 'test',
            implementations: [
              {
                platforms: ['ios'],
                code: {
                  source: "print('iOS');",
                  language: 'dart',
                },
              },
            ],
          },
        ],
      };

      const imports = generator.generateImports(platformSchema);

      expect(imports).toContain("import 'dart:io' show Platform;");
    });
  });

  describe('PlatformCodeGenerator', () => {
    let generator: PlatformCodeGenerator;

    beforeEach(() => {
      generator = new PlatformCodeGenerator();
    });

    it('should generate React code', () => {
      const platformSchema: PlatformSchema = {
        platformCode: [
          {
            id: 'test',
            implementations: [
              {
                platforms: ['ios'],
                code: {
                  source: "console.log('iOS');",
                  language: 'typescript',
                },
              },
            ],
          },
        ],
      };

      const code = generator.generateCode(platformSchema, 'react');

      expect(code).toContain("Platform.OS === 'ios'");
    });

    it('should generate Flutter code', () => {
      const platformSchema: PlatformSchema = {
        platformCode: [
          {
            id: 'test',
            implementations: [
              {
                platforms: ['ios'],
                code: {
                  source: "print('iOS');",
                  language: 'dart',
                },
              },
            ],
          },
        ],
      };

      const code = generator.generateCode(platformSchema, 'flutter');

      expect(code).toContain('Platform.isIOS');
    });

    it('should optimize for target platform', () => {
      const platformSchema: PlatformSchema = {
        platformCode: [
          {
            id: 'test',
            implementations: [
              {
                platforms: ['ios'],
                code: {
                  source: "print('iOS');",
                  language: 'dart',
                },
              },
              {
                platforms: ['android'],
                code: {
                  source: "print('Android');",
                  language: 'dart',
                },
              },
            ],
            fallback: {
              source: "print('Other');",
              language: 'dart',
            },
          },
        ],
      };

      const optimized = generator.optimizeForPlatform(platformSchema, 'ios');

      expect(optimized.platformCode[0].implementations.length).toBe(1);
      expect(optimized.platformCode[0].implementations[0].platforms).toContain('ios');
      expect(optimized.platformCode[0].fallback).toBeUndefined();
    });

    it('should use fallback when optimizing for unsupported platform', () => {
      const platformSchema: PlatformSchema = {
        platformCode: [
          {
            id: 'test',
            implementations: [
              {
                platforms: ['ios'],
                code: {
                  source: "print('iOS');",
                  language: 'dart',
                },
              },
            ],
            fallback: {
              source: "print('Other');",
              language: 'dart',
            },
          },
        ],
      };

      const optimized = generator.optimizeForPlatform(platformSchema, 'web');

      expect(optimized.platformCode[0].implementations.length).toBe(1);
      expect(optimized.platformCode[0].implementations[0].code.source).toContain('Other');
    });
  });
});
