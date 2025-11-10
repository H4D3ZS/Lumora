import { FileWatcher, FileWatcherConfig, FileChangeEvent } from './file-watcher';
import { ModeConfig, DevelopmentMode } from '../config/mode-config';

/**
 * Mode-aware watcher configuration
 */
export interface ModeAwareWatcherConfig {
  modeConfig: ModeConfig;
  watcherConfig?: Omit<FileWatcherConfig, 'reactDir' | 'flutterDir'>;
}

/**
 * Mode-Aware File Watcher
 * Configures file watching behavior based on development mode
 */
export class ModeAwareWatcher {
  private fileWatcher: FileWatcher;
  private modeConfig: ModeConfig;
  private mode: DevelopmentMode;

  constructor(config: ModeAwareWatcherConfig) {
    this.modeConfig = config.modeConfig;
    this.mode = config.modeConfig.getMode();

    // Configure file watcher based on mode
    const watcherConfig = this.buildWatcherConfig(config.watcherConfig);
    this.fileWatcher = new FileWatcher(watcherConfig);
  }

  /**
   * Build watcher configuration based on development mode
   */
  private buildWatcherConfig(
    baseConfig?: Omit<FileWatcherConfig, 'reactDir' | 'flutterDir'>
  ): FileWatcherConfig {
    const reactDir = this.modeConfig.getReactDir();
    const flutterDir = this.modeConfig.getFlutterDir();

    switch (this.mode) {
      case DevelopmentMode.REACT:
        // React mode: watch React files only, generate Flutter
        return {
          reactDir,
          flutterDir: undefined, // Don't watch Flutter files
          ...baseConfig,
        };

      case DevelopmentMode.FLUTTER:
        // Flutter mode: watch Flutter files only, generate React
        return {
          reactDir: undefined, // Don't watch React files
          flutterDir,
          ...baseConfig,
        };

      case DevelopmentMode.UNIVERSAL:
        // Universal mode: watch both React and Flutter files
        return {
          reactDir,
          flutterDir,
          ...baseConfig,
        };

      default:
        throw new Error(`Unknown development mode: ${this.mode}`);
    }
  }

  /**
   * Start watching files based on mode
   */
  start(): void {
    this.fileWatcher.start();

    // Log what we're watching
    switch (this.mode) {
      case DevelopmentMode.REACT:
        console.log(`[React Mode] Watching React files in: ${this.modeConfig.getReactDir()}`);
        console.log('[React Mode] Flutter files will be generated automatically');
        break;

      case DevelopmentMode.FLUTTER:
        console.log(`[Flutter Mode] Watching Flutter files in: ${this.modeConfig.getFlutterDir()}`);
        console.log('[Flutter Mode] React files will be generated automatically');
        break;

      case DevelopmentMode.UNIVERSAL:
        console.log(`[Universal Mode] Watching React files in: ${this.modeConfig.getReactDir()}`);
        console.log(`[Universal Mode] Watching Flutter files in: ${this.modeConfig.getFlutterDir()}`);
        console.log('[Universal Mode] Bidirectional sync enabled');
        break;
    }
  }

  /**
   * Stop watching files
   */
  async stop(): Promise<void> {
    await this.fileWatcher.stop();
    console.log(`[${this.mode} Mode] File watching stopped`);
  }

  /**
   * Register change handler
   * Filters events based on mode
   */
  onChange(handler: (event: FileChangeEvent) => void): void {
    this.fileWatcher.onChange((event) => {
      // Filter events based on mode
      if (this.shouldProcessEvent(event)) {
        handler(event);
      }
    });
  }

  /**
   * Check if event should be processed based on mode
   */
  private shouldProcessEvent(event: FileChangeEvent): boolean {
    switch (this.mode) {
      case DevelopmentMode.REACT:
        // React mode: only process React file changes
        return event.framework === 'react';

      case DevelopmentMode.FLUTTER:
        // Flutter mode: only process Flutter file changes
        return event.framework === 'flutter';

      case DevelopmentMode.UNIVERSAL:
        // Universal mode: process all changes
        return true;

      default:
        return false;
    }
  }

  /**
   * Get current development mode
   */
  getMode(): DevelopmentMode {
    return this.mode;
  }

  /**
   * Get mode configuration
   */
  getModeConfig(): ModeConfig {
    return this.modeConfig;
  }

  /**
   * Check if watching
   */
  isWatching(): boolean {
    return this.fileWatcher.isWatching();
  }

  /**
   * Get source framework based on mode
   * Returns the framework that is considered the "source of truth"
   */
  getSourceFramework(): 'react' | 'flutter' | 'both' {
    switch (this.mode) {
      case DevelopmentMode.REACT:
        return 'react';
      case DevelopmentMode.FLUTTER:
        return 'flutter';
      case DevelopmentMode.UNIVERSAL:
        return 'both';
      default:
        return 'both';
    }
  }

  /**
   * Get target framework based on mode
   * Returns the framework that will be generated
   */
  getTargetFramework(sourceFramework: 'react' | 'flutter'): 'react' | 'flutter' | null {
    switch (this.mode) {
      case DevelopmentMode.REACT:
        // React is source, Flutter is target
        return sourceFramework === 'react' ? 'flutter' : null;

      case DevelopmentMode.FLUTTER:
        // Flutter is source, React is target
        return sourceFramework === 'flutter' ? 'react' : null;

      case DevelopmentMode.UNIVERSAL:
        // Both are sources, target is opposite
        return sourceFramework === 'react' ? 'flutter' : 'react';

      default:
        return null;
    }
  }

  /**
   * Check if file should be treated as read-only
   * In React/Flutter mode, generated files should be read-only
   */
  isReadOnly(framework: 'react' | 'flutter'): boolean {
    switch (this.mode) {
      case DevelopmentMode.REACT:
        // Flutter files are generated (read-only)
        return framework === 'flutter';

      case DevelopmentMode.FLUTTER:
        // React files are generated (read-only)
        return framework === 'react';

      case DevelopmentMode.UNIVERSAL:
        // Both are editable
        return false;

      default:
        return false;
    }
  }

  /**
   * Get mode description
   */
  getModeDescription(): string {
    switch (this.mode) {
      case DevelopmentMode.REACT:
        return 'React-first: React files are source, Flutter files are generated';

      case DevelopmentMode.FLUTTER:
        return 'Flutter-first: Flutter files are source, React files are generated';

      case DevelopmentMode.UNIVERSAL:
        return 'Universal: Both React and Flutter files are sources with bidirectional sync';

      default:
        return 'Unknown mode';
    }
  }
}

/**
 * Create mode-aware watcher from mode configuration
 */
export function createModeAwareWatcher(
  modeConfig: ModeConfig,
  watcherConfig?: Omit<FileWatcherConfig, 'reactDir' | 'flutterDir'>
): ModeAwareWatcher {
  return new ModeAwareWatcher({
    modeConfig,
    watcherConfig,
  });
}
