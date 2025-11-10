/**
 * Asset Path Converter Tests
 */

import { AssetPathConverter } from '../assets/asset-path-converter';

describe('AssetPathConverter', () => {
  let converter: AssetPathConverter;

  beforeEach(() => {
    converter = new AssetPathConverter({
      reactPublicPath: '/',
      flutterAssetsPath: 'assets/',
    });
  });

  describe('reactToFlutter', () => {
    it('should convert React absolute path to Flutter path', () => {
      const result = converter.reactToFlutter('/images/logo.png');
      expect(result).toBe('assets/images/logo.png');
    });

    it('should convert React relative path to Flutter path', () => {
      const result = converter.reactToFlutter('./images/logo.png');
      expect(result).toBe('assets/images/logo.png');
    });

    it('should handle paths without leading slash', () => {
      const result = converter.reactToFlutter('images/logo.png');
      expect(result).toBe('assets/images/logo.png');
    });
  });

  describe('flutterToReact', () => {
    it('should convert Flutter path to React absolute path', () => {
      const result = converter.flutterToReact('assets/images/logo.png');
      expect(result).toBe('/images/logo.png');
    });

    it('should handle Flutter paths without assets prefix', () => {
      const result = converter.flutterToReact('images/logo.png');
      expect(result).toBe('/images/logo.png');
    });
  });

  describe('convertImageReference', () => {
    it('should convert image node with string source', () => {
      const node = {
        type: 'Image',
        props: {
          source: '/images/logo.png',
        },
        children: [],
      };

      const result = converter.convertImageReference(node, 'flutter');

      expect(result.props.source).toBe('assets/images/logo.png');
    });

    it('should convert image node with uri object', () => {
      const node = {
        type: 'Image',
        props: {
          source: {
            uri: '/images/logo.png',
          },
        },
        children: [],
      };

      const result = converter.convertImageReference(node, 'flutter');

      expect(result.props.source.uri).toBe('assets/images/logo.png');
    });

    it('should not modify non-image nodes', () => {
      const node = {
        type: 'Text',
        props: {
          text: 'Hello',
        },
        children: [],
      };

      const result = converter.convertImageReference(node, 'flutter');

      expect(result).toEqual(node);
    });
  });

  describe('convertBackgroundImage', () => {
    it('should convert background image URL', () => {
      const style = {
        backgroundImage: "url('/images/bg.jpg')",
      };

      const result = converter.convertBackgroundImage(style, 'flutter');

      expect(result.backgroundImage).toBe("url('assets/images/bg.jpg')");
    });

    it('should handle styles without background image', () => {
      const style = {
        color: 'red',
      };

      const result = converter.convertBackgroundImage(style, 'flutter');

      expect(result).toEqual(style);
    });
  });

  describe('convertFontReference', () => {
    it('should preserve font family name', () => {
      const result = converter.convertFontReference('Roboto', 'flutter');
      expect(result).toBe('Roboto');
    });
  });

  describe('getFontPath', () => {
    it('should return Flutter font path', () => {
      const result = converter.getFontPath('Roboto-Regular.ttf', 'flutter');
      expect(result).toBe('assets/fonts/Roboto-Regular.ttf');
    });

    it('should return React font path', () => {
      const result = converter.getFontPath('Roboto-Regular.ttf', 'react');
      expect(result).toBe('/fonts/Roboto-Regular.ttf');
    });
  });

  describe('convertIRAssets', () => {
    it('should convert all asset references in IR', () => {
      const ir = {
        nodes: [
          {
            type: 'Image',
            props: {
              source: '/images/logo.png',
            },
            children: [],
          },
          {
            type: 'View',
            props: {
              style: {
                backgroundImage: "url('/images/bg.jpg')",
              },
            },
            children: [
              {
                type: 'Image',
                props: {
                  source: { uri: '/images/icon.png' },
                },
                children: [],
              },
            ],
          },
        ],
      };

      const result = converter.convertIRAssets(ir, 'flutter');

      expect(result.nodes[0].props.source).toBe('assets/images/logo.png');
      expect(result.nodes[1].props.style.backgroundImage).toBe("url('assets/images/bg.jpg')");
      expect(result.nodes[1].children[0].props.source.uri).toBe('assets/images/icon.png');
    });
  });
});
