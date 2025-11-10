/**
 * Asset Manager Tests
 */

import { AssetManager } from '../assets/asset-manager';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AssetManager', () => {
  let tempDir: string;
  let reactAssetsDir: string;
  let flutterAssetsDir: string;
  let assetManager: AssetManager;

  beforeEach(() => {
    // Create temporary directories
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-manager-test-'));
    reactAssetsDir = path.join(tempDir, 'react-assets');
    flutterAssetsDir = path.join(tempDir, 'flutter-assets');

    fs.mkdirSync(reactAssetsDir, { recursive: true });
    fs.mkdirSync(flutterAssetsDir, { recursive: true });

    assetManager = new AssetManager({
      reactAssetsDir,
      flutterAssetsDir,
    });
  });

  afterEach(() => {
    // Clean up temporary directories
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('syncReactToFlutter', () => {
    it('should sync image assets from React to Flutter', () => {
      // Create test image in React assets
      const imagePath = 'images/logo.png';
      const reactImagePath = path.join(reactAssetsDir, imagePath);
      fs.mkdirSync(path.dirname(reactImagePath), { recursive: true });
      fs.writeFileSync(reactImagePath, 'fake-image-data');

      // Sync to Flutter
      const synced = assetManager.syncReactToFlutter([imagePath]);

      // Verify
      expect(synced).toHaveLength(1);
      expect(synced[0].type).toBe('image');
      expect(synced[0].framework).toBe('flutter');

      const flutterImagePath = path.join(flutterAssetsDir, imagePath);
      expect(fs.existsSync(flutterImagePath)).toBe(true);
      expect(fs.readFileSync(flutterImagePath, 'utf8')).toBe('fake-image-data');
    });

    it('should sync font assets from React to Flutter', () => {
      const fontPath = 'fonts/Roboto-Regular.ttf';
      const reactFontPath = path.join(reactAssetsDir, fontPath);
      fs.mkdirSync(path.dirname(reactFontPath), { recursive: true });
      fs.writeFileSync(reactFontPath, 'fake-font-data');

      const synced = assetManager.syncReactToFlutter([fontPath]);

      expect(synced).toHaveLength(1);
      expect(synced[0].type).toBe('font');

      const flutterFontPath = path.join(flutterAssetsDir, fontPath);
      expect(fs.existsSync(flutterFontPath)).toBe(true);
    });

    it('should handle missing assets gracefully', () => {
      const synced = assetManager.syncReactToFlutter(['missing/asset.png']);
      expect(synced).toHaveLength(0);
    });
  });

  describe('syncFlutterToReact', () => {
    it('should sync assets from Flutter to React', () => {
      const imagePath = 'images/icon.png';
      const flutterImagePath = path.join(flutterAssetsDir, imagePath);
      fs.mkdirSync(path.dirname(flutterImagePath), { recursive: true });
      fs.writeFileSync(flutterImagePath, 'flutter-image-data');

      const synced = assetManager.syncFlutterToReact([imagePath]);

      expect(synced).toHaveLength(1);
      expect(synced[0].framework).toBe('react');

      const reactImagePath = path.join(reactAssetsDir, imagePath);
      expect(fs.existsSync(reactImagePath)).toBe(true);
      expect(fs.readFileSync(reactImagePath, 'utf8')).toBe('flutter-image-data');
    });
  });

  describe('extractAssetReferences', () => {
    it('should extract image sources from IR nodes', () => {
      const ir = {
        nodes: [
          {
            type: 'Image',
            props: { source: 'images/logo.png' },
            children: [],
          },
          {
            type: 'View',
            props: {},
            children: [
              {
                type: 'Image',
                props: { source: { uri: 'images/icon.png' } },
                children: [],
              },
            ],
          },
        ],
      };

      const assets = assetManager.extractAssetReferences(ir);

      expect(assets).toContain('images/logo.png');
      expect(assets).toContain('images/icon.png');
      expect(assets).toHaveLength(2);
    });

    it('should extract background images from styles', () => {
      const ir = {
        nodes: [
          {
            type: 'View',
            props: {
              style: {
                backgroundImage: "url('images/background.jpg')",
              },
            },
            children: [],
          },
        ],
      };

      const assets = assetManager.extractAssetReferences(ir);

      expect(assets).toContain('images/background.jpg');
    });

    it('should return empty array for IR without assets', () => {
      const ir = {
        nodes: [
          {
            type: 'Text',
            props: { text: 'Hello' },
            children: [],
          },
        ],
      };

      const assets = assetManager.extractAssetReferences(ir);
      expect(assets).toHaveLength(0);
    });
  });

  describe('getAllAssets', () => {
    it('should list all assets in React directory', () => {
      // Create test assets
      fs.mkdirSync(path.join(reactAssetsDir, 'images'), { recursive: true });
      fs.writeFileSync(path.join(reactAssetsDir, 'images', 'logo.png'), '');
      fs.writeFileSync(path.join(reactAssetsDir, 'images', 'icon.png'), '');

      const assets = assetManager.getAllAssets('react');

      expect(assets).toContain(path.join('images', 'logo.png'));
      expect(assets).toContain(path.join('images', 'icon.png'));
      expect(assets.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for non-existent directory', () => {
      const nonExistentManager = new AssetManager({
        reactAssetsDir: '/non/existent/path',
        flutterAssetsDir: '/non/existent/path',
      });

      const assets = nonExistentManager.getAllAssets('react');
      expect(assets).toHaveLength(0);
    });
  });
});
