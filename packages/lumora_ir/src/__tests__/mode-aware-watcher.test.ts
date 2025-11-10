import * as fs from 'fs';
import * as path from 'path';
import { ModeAwareWatcher, createModeAwareWatcher } from '../sync/mode-aware-watcher';
import { ModeConfig, DevelopmentMode, initModeConfig } from '../config/mode-config';
import { FileChangeEvent } from '../sync/file-watcher';

describe('ModeAwareWatcher', () => {
  const testDir = path.join(__dirname, 'test-mode-watcher');
  let modeConfig: ModeConfig;

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('React mode', () => {
    beforeEach(() => {
      modeConfig = initModeConfig(testDir, DevelopmentMode.REACT, {
        reactDir: 'web/src',
        flutterDir: 'mobile/lib',
      });
    });

    it('should create watcher for React mode', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      expect(watcher.getMode()).toBe(DevelopmentMode.REACT);
      expect(watcher.getSourceFramework()).toBe('react');
    });

    it('should only process React file changes', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      const reactEvent: FileChangeEvent = {
        type: 'change',
        filePath: 'web/src/App.tsx',
        framework: 'react',
        timestamp: Date.now(),
      };

      const flutterEvent: FileChangeEvent = {
        type: 'change',
        filePath: 'mobile/lib/app.dart',
        framework: 'flutter',
        timestamp: Date.now(),
      };

      // React events should be processed
      expect(watcher['shouldProcessEvent'](reactEvent)).toBe(true);

      // Flutter events should be ignored
      expect(watcher['shouldProcessEvent'](flutterEvent)).toBe(false);
    });

    it('should mark Flutter files as read-only', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      expect(watcher.isReadOnly('react')).toBe(false);
      expect(watcher.isReadOnly('flutter')).toBe(true);
    });

    it('should return Flutter as target framework', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      expect(watcher.getTargetFramework('react')).toBe('flutter');
      expect(watcher.getTargetFramework('flutter')).toBe(null);
    });
  });

  describe('Flutter mode', () => {
    beforeEach(() => {
      modeConfig = initModeConfig(testDir, DevelopmentMode.FLUTTER, {
        reactDir: 'web/src',
        flutterDir: 'mobile/lib',
      });
    });

    it('should create watcher for Flutter mode', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      expect(watcher.getMode()).toBe(DevelopmentMode.FLUTTER);
      expect(watcher.getSourceFramework()).toBe('flutter');
    });

    it('should only process Flutter file changes', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      const reactEvent: FileChangeEvent = {
        type: 'change',
        filePath: 'web/src/App.tsx',
        framework: 'react',
        timestamp: Date.now(),
      };

      const flutterEvent: FileChangeEvent = {
        type: 'change',
        filePath: 'mobile/lib/app.dart',
        framework: 'flutter',
        timestamp: Date.now(),
      };

      // React events should be ignored
      expect(watcher['shouldProcessEvent'](reactEvent)).toBe(false);

      // Flutter events should be processed
      expect(watcher['shouldProcessEvent'](flutterEvent)).toBe(true);
    });

    it('should mark React files as read-only', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      expect(watcher.isReadOnly('react')).toBe(true);
      expect(watcher.isReadOnly('flutter')).toBe(false);
    });

    it('should return React as target framework', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      expect(watcher.getTargetFramework('react')).toBe(null);
      expect(watcher.getTargetFramework('flutter')).toBe('react');
    });
  });

  describe('Universal mode', () => {
    beforeEach(() => {
      modeConfig = initModeConfig(testDir, DevelopmentMode.UNIVERSAL, {
        reactDir: 'web/src',
        flutterDir: 'mobile/lib',
      });
    });

    it('should create watcher for Universal mode', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      expect(watcher.getMode()).toBe(DevelopmentMode.UNIVERSAL);
      expect(watcher.getSourceFramework()).toBe('both');
    });

    it('should process both React and Flutter file changes', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      const reactEvent: FileChangeEvent = {
        type: 'change',
        filePath: 'web/src/App.tsx',
        framework: 'react',
        timestamp: Date.now(),
      };

      const flutterEvent: FileChangeEvent = {
        type: 'change',
        filePath: 'mobile/lib/app.dart',
        framework: 'flutter',
        timestamp: Date.now(),
      };

      // Both should be processed
      expect(watcher['shouldProcessEvent'](reactEvent)).toBe(true);
      expect(watcher['shouldProcessEvent'](flutterEvent)).toBe(true);
    });

    it('should not mark any files as read-only', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      expect(watcher.isReadOnly('react')).toBe(false);
      expect(watcher.isReadOnly('flutter')).toBe(false);
    });

    it('should return opposite framework as target', () => {
      const watcher = createModeAwareWatcher(modeConfig);

      expect(watcher.getTargetFramework('react')).toBe('flutter');
      expect(watcher.getTargetFramework('flutter')).toBe('react');
    });
  });

  describe('mode descriptions', () => {
    it('should provide correct description for React mode', () => {
      modeConfig = initModeConfig(testDir, DevelopmentMode.REACT);
      const watcher = createModeAwareWatcher(modeConfig);

      const description = watcher.getModeDescription();
      expect(description).toContain('React-first');
      expect(description).toContain('source');
      expect(description).toContain('generated');
    });

    it('should provide correct description for Flutter mode', () => {
      modeConfig = initModeConfig(testDir, DevelopmentMode.FLUTTER);
      const watcher = createModeAwareWatcher(modeConfig);

      const description = watcher.getModeDescription();
      expect(description).toContain('Flutter-first');
      expect(description).toContain('source');
      expect(description).toContain('generated');
    });

    it('should provide correct description for Universal mode', () => {
      modeConfig = initModeConfig(testDir, DevelopmentMode.UNIVERSAL);
      const watcher = createModeAwareWatcher(modeConfig);

      const description = watcher.getModeDescription();
      expect(description).toContain('Universal');
      expect(description).toContain('bidirectional');
    });
  });

  describe('watcher lifecycle', () => {
    beforeEach(() => {
      modeConfig = initModeConfig(testDir, DevelopmentMode.UNIVERSAL);
    });

    it('should start and stop watcher', async () => {
      const watcher = createModeAwareWatcher(modeConfig);

      expect(watcher.isWatching()).toBe(false);

      watcher.start();
      expect(watcher.isWatching()).toBe(true);

      await watcher.stop();
      expect(watcher.isWatching()).toBe(false);
    });
  });
});
