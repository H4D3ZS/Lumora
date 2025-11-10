import * as chokidar from 'chokidar';
import * as path from 'path';

/**
 * File change event
 */
export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  filePath: string;
  framework: 'react' | 'flutter';
  timestamp: number;
}

/**
 * File watcher configuration
 */
export interface FileWatcherConfig {
  reactDir?: string;
  flutterDir?: string;
  ignored?: string[];
  debounceMs?: number;
}

/**
 * File Watcher
 * Watches React and Flutter files for changes
 */
export class FileWatcher {
  private reactWatcher?: chokidar.FSWatcher;
  private flutterWatcher?: chokidar.FSWatcher;
  private config: Required<FileWatcherConfig>;
  private changeHandlers: Array<(event: FileChangeEvent) => void> = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: FileWatcherConfig = {}) {
    this.config = {
      reactDir: config.reactDir || 'web/src',
      flutterDir: config.flutterDir || 'mobile/lib',
      ignored: config.ignored || ['**/node_modules/**', '**/.git/**', '**/build/**', '**/dist/**'],
      debounceMs: config.debounceMs || 100,
    };
  }

  /**
   * Start watching files
   */
  start(): void {
    // Watch React files
    if (this.config.reactDir) {
      this.reactWatcher = chokidar.watch(
        [
          path.join(this.config.reactDir, '**/*.tsx'),
          path.join(this.config.reactDir, '**/*.ts'),
          path.join(this.config.reactDir, '**/*.jsx'),
          path.join(this.config.reactDir, '**/*.js'),
        ],
        {
          ignored: this.config.ignored,
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 50,
            pollInterval: 10,
          },
        }
      );

      this.reactWatcher
        .on('add', (filePath) => this.handleChange('add', filePath, 'react'))
        .on('change', (filePath) => this.handleChange('change', filePath, 'react'))
        .on('unlink', (filePath) => this.handleChange('unlink', filePath, 'react'))
        .on('error', (error) => console.error('React watcher error:', error));
    }

    // Watch Flutter files
    if (this.config.flutterDir) {
      this.flutterWatcher = chokidar.watch(
        [
          path.join(this.config.flutterDir, '**/*.dart'),
        ],
        {
          ignored: this.config.ignored,
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 50,
            pollInterval: 10,
          },
        }
      );

      this.flutterWatcher
        .on('add', (filePath) => this.handleChange('add', filePath, 'flutter'))
        .on('change', (filePath) => this.handleChange('change', filePath, 'flutter'))
        .on('unlink', (filePath) => this.handleChange('unlink', filePath, 'flutter'))
        .on('error', (error) => console.error('Flutter watcher error:', error));
    }
  }

  /**
   * Stop watching files
   */
  async stop(): Promise<void> {
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close watchers
    if (this.reactWatcher) {
      await this.reactWatcher.close();
      this.reactWatcher = undefined;
    }

    if (this.flutterWatcher) {
      await this.flutterWatcher.close();
      this.flutterWatcher = undefined;
    }
  }

  /**
   * Handle file change with debouncing
   */
  private handleChange(
    type: 'add' | 'change' | 'unlink',
    filePath: string,
    framework: 'react' | 'flutter'
  ): void {
    // Clear existing timer for this file
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      
      const event: FileChangeEvent = {
        type,
        filePath,
        framework,
        timestamp: Date.now(),
      };

      // Notify all handlers
      for (const handler of this.changeHandlers) {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in change handler:', error);
        }
      }
    }, this.config.debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Register change handler
   */
  onChange(handler: (event: FileChangeEvent) => void): void {
    this.changeHandlers.push(handler);
  }

  /**
   * Remove change handler
   */
  removeChangeHandler(handler: (event: FileChangeEvent) => void): void {
    const index = this.changeHandlers.indexOf(handler);
    if (index !== -1) {
      this.changeHandlers.splice(index, 1);
    }
  }

  /**
   * Check if watching
   */
  isWatching(): boolean {
    return !!(this.reactWatcher || this.flutterWatcher);
  }
}

