import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dev_client/interpreter/schema_interpreter.dart';
import 'package:flutter_dev_client/interpreter/platform_manager.dart';

void main() {
  group('Platform Runtime Support', () {
    late SchemaInterpreter interpreter;

    setUp(() {
      interpreter = SchemaInterpreter();
    });

    tearDown(() {
      interpreter.dispose();
    });

    test('should detect current platform', () {
      final platform = interpreter.getCurrentPlatform();
      expect(platform, isNotEmpty);
      expect(PlatformManager.supportedPlatforms.contains(platform), isTrue);
    });

    test('should get platform capabilities', () {
      final capabilities = interpreter.getPlatformCapabilities();
      expect(capabilities, isNotNull);
      expect(capabilities['platform'], isNotEmpty);
      expect(capabilities.containsKey('isMobile'), isTrue);
      expect(capabilities.containsKey('isDesktop'), isTrue);
    });

    test('should resolve platform-specific props', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {
            'backgroundColor': {
              'ios': '#FF0000',
              'android': '#00FF00',
              'fallback': '#0000FF',
            },
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      expect(widget, isA<Container>());
    });

    test('should handle platform-specific image assets', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Image',
          'props': {
            'src': {
              'ios': 'assets/icons/ios/icon.png',
              'android': 'assets/icons/android/icon.png',
              'fallback': 'assets/icons/default.png',
            },
            'width': 100,
            'height': 100,
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      expect(widget, isA<Image>());
    });

    test('should process platform schema', () {
      final schema = {
        'schemaVersion': '1.0',
        'platform': {
          'platformCode': [
            {
              'id': 'test-platform-code',
              'implementations': [
                {
                  'platforms': ['ios'],
                  'code': {
                    'source': 'print("iOS specific code");',
                    'language': 'dart',
                  },
                },
                {
                  'platforms': ['android'],
                  'code': {
                    'source': 'print("Android specific code");',
                    'language': 'dart',
                  },
                },
              ],
              'fallback': {
                'source': 'print("Fallback code");',
                'language': 'dart',
              },
            },
          ],
        },
        'root': {
          'type': 'Text',
          'props': {
            'text': 'Platform test',
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      expect(widget, isA<Text>());
    });

    test('should validate platform code blocks', () {
      final validPlatformCode = {
        'id': 'test',
        'implementations': [
          {
            'platforms': ['ios'],
            'code': {
              'source': 'print("test");',
              'language': 'dart',
            },
          },
        ],
      };

      expect(interpreter.validatePlatformCode(validPlatformCode), isTrue);

      final invalidPlatformCode = {
        'id': 'test',
        // Missing implementations
      };

      expect(interpreter.validatePlatformCode(invalidPlatformCode), isFalse);
    });

    test('should handle nested platform-specific props', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {
            'style': {
              'padding': {
                'ios': 16,
                'android': 12,
                'fallback': 8,
              },
            },
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      expect(widget, isA<Container>());
    });

    test('should use fallback when platform not matched', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'Text',
          'props': {
            'text': {
              'web': 'Web text',
              'fallback': 'Default text',
            },
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      expect(widget, isA<Text>());
    });

    test('should handle platform-specific lists', () {
      final schema = {
        'schemaVersion': '1.0',
        'root': {
          'type': 'View',
          'props': {
            'items': [
              {
                'icon': {
                  'ios': 'ios-icon.png',
                  'android': 'android-icon.png',
                  'fallback': 'default-icon.png',
                },
              },
            ],
          },
          'children': [],
        },
      };

      final widget = interpreter.interpretSchema(schema);
      expect(widget, isA<Container>());
    });

    test('should check platform type', () {
      final currentPlatform = interpreter.getCurrentPlatform();
      expect(interpreter.isPlatform(currentPlatform), isTrue);
      expect(interpreter.isPlatform('unknown-platform'), isFalse);
    });
  });

  group('PlatformManager', () {
    late PlatformManager manager;

    setUp(() {
      manager = PlatformManager();
    });

    test('should get current platform', () {
      final platform = PlatformManager.getCurrentPlatform();
      expect(platform, isNotEmpty);
    });

    test('should check platform match', () {
      final currentPlatform = PlatformManager.getCurrentPlatform();
      expect(PlatformManager.isPlatform(currentPlatform), isTrue);
    });

    test('should get platform-specific value', () {
      final values = {
        'ios': 'iOS value',
        'android': 'Android value',
      };

      final result = manager.getPlatformValue(
        values,
        fallback: 'Fallback value',
      );

      expect(result, isNotNull);
    });

    test('should check if should execute for platforms', () {
      final currentPlatform = PlatformManager.getCurrentPlatform();
      expect(manager.shouldExecuteForPlatforms([currentPlatform]), isTrue);
      expect(manager.shouldExecuteForPlatforms(['unknown']), isFalse);
    });

    test('should get platform asset', () {
      final assetConfig = {
        'paths': {
          'ios': 'assets/ios/icon.png',
          'android': 'assets/android/icon.png',
        },
        'fallback': 'assets/default/icon.png',
      };

      final result = manager.getPlatformAsset(assetConfig);
      expect(result, isNotNull);
    });

    test('should validate platform code', () {
      final validCode = {
        'implementations': [
          {
            'platforms': ['ios'],
            'code': {
              'source': 'print("test");',
            },
          },
        ],
      };

      expect(manager.validatePlatformCode(validCode), isTrue);

      final invalidCode = {
        'implementations': [],
      };

      expect(manager.validatePlatformCode(invalidCode), isFalse);
    });

    test('should get platform capabilities', () {
      final capabilities = manager.getPlatformCapabilities();
      expect(capabilities, isNotNull);
      expect(capabilities['platform'], isNotEmpty);
      expect(capabilities.containsKey('isMobile'), isTrue);
      expect(capabilities.containsKey('isDesktop'), isTrue);
      expect(capabilities.containsKey('operatingSystem'), isTrue);
    });

    test('should execute platform code', () {
      final platformCode = {
        'implementations': [
          {
            'platforms': [PlatformManager.getCurrentPlatform()],
            'code': {
              'source': 'print("Platform-specific code");',
              'language': 'dart',
            },
          },
        ],
        'fallback': {
          'source': 'print("Fallback code");',
          'language': 'dart',
        },
      };

      // Should not throw
      expect(
        () => manager.executePlatformCode(platformCode),
        returnsNormally,
      );
    });

    test('should handle missing implementations gracefully', () {
      final platformCode = {
        'implementations': [],
      };

      final result = manager.executePlatformCode(platformCode);
      expect(result, isNull);
    });

    test('should use fallback when no platform match', () {
      final platformCode = {
        'implementations': [
          {
            'platforms': ['unknown-platform'],
            'code': {
              'source': 'print("Unknown platform");',
              'language': 'dart',
            },
          },
        ],
        'fallback': {
          'source': 'print("Fallback code");',
          'language': 'dart',
        },
      };

      // Should execute fallback without error
      expect(
        () => manager.executePlatformCode(platformCode),
        returnsNormally,
      );
    });
  });
}
