"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeAwareWatcher = void 0;
exports.createModeAwareWatcher = createModeAwareWatcher;
const file_watcher_1 = require("./file-watcher");
const mode_config_1 = require("../config/mode-config");
/**
 * Mode-Aware File Watcher
 * Configures file watching behavior based on development mode
 */
class ModeAwareWatcher {
    constructor(config) {
        this.modeConfig = config.modeConfig;
        this.mode = config.modeConfig.getMode();
        // Configure file watcher based on mode
        const watcherConfig = this.buildWatcherConfig(config.watcherConfig);
        this.fileWatcher = new file_watcher_1.FileWatcher(watcherConfig);
    }
    /**
     * Build watcher configuration based on development mode
     */
    buildWatcherConfig(baseConfig) {
        const reactDir = this.modeConfig.getReactDir();
        const flutterDir = this.modeConfig.getFlutterDir();
        switch (this.mode) {
            case mode_config_1.DevelopmentMode.REACT:
                // React mode: watch React files only, generate Flutter
                return {
                    reactDir,
                    flutterDir: undefined, // Don't watch Flutter files
                    ...baseConfig,
                };
            case mode_config_1.DevelopmentMode.FLUTTER:
                // Flutter mode: watch Flutter files only, generate React
                return {
                    reactDir: undefined, // Don't watch React files
                    flutterDir,
                    ...baseConfig,
                };
            case mode_config_1.DevelopmentMode.UNIVERSAL:
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
    start() {
        this.fileWatcher.start();
        // Log what we're watching
        switch (this.mode) {
            case mode_config_1.DevelopmentMode.REACT:
                console.log(`[React Mode] Watching React files in: ${this.modeConfig.getReactDir()}`);
                console.log('[React Mode] Flutter files will be generated automatically');
                break;
            case mode_config_1.DevelopmentMode.FLUTTER:
                console.log(`[Flutter Mode] Watching Flutter files in: ${this.modeConfig.getFlutterDir()}`);
                console.log('[Flutter Mode] React files will be generated automatically');
                break;
            case mode_config_1.DevelopmentMode.UNIVERSAL:
                console.log(`[Universal Mode] Watching React files in: ${this.modeConfig.getReactDir()}`);
                console.log(`[Universal Mode] Watching Flutter files in: ${this.modeConfig.getFlutterDir()}`);
                console.log('[Universal Mode] Bidirectional sync enabled');
                break;
        }
    }
    /**
     * Stop watching files
     */
    async stop() {
        await this.fileWatcher.stop();
        console.log(`[${this.mode} Mode] File watching stopped`);
    }
    /**
     * Register change handler
     * Filters events based on mode
     */
    onChange(handler) {
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
    shouldProcessEvent(event) {
        switch (this.mode) {
            case mode_config_1.DevelopmentMode.REACT:
                // React mode: only process React file changes
                return event.framework === 'react';
            case mode_config_1.DevelopmentMode.FLUTTER:
                // Flutter mode: only process Flutter file changes
                return event.framework === 'flutter';
            case mode_config_1.DevelopmentMode.UNIVERSAL:
                // Universal mode: process all changes
                return true;
            default:
                return false;
        }
    }
    /**
     * Get current development mode
     */
    getMode() {
        return this.mode;
    }
    /**
     * Get mode configuration
     */
    getModeConfig() {
        return this.modeConfig;
    }
    /**
     * Check if watching
     */
    isWatching() {
        return this.fileWatcher.isWatching();
    }
    /**
     * Get source framework based on mode
     * Returns the framework that is considered the "source of truth"
     */
    getSourceFramework() {
        switch (this.mode) {
            case mode_config_1.DevelopmentMode.REACT:
                return 'react';
            case mode_config_1.DevelopmentMode.FLUTTER:
                return 'flutter';
            case mode_config_1.DevelopmentMode.UNIVERSAL:
                return 'both';
            default:
                return 'both';
        }
    }
    /**
     * Get target framework based on mode
     * Returns the framework that will be generated
     */
    getTargetFramework(sourceFramework) {
        switch (this.mode) {
            case mode_config_1.DevelopmentMode.REACT:
                // React is source, Flutter is target
                return sourceFramework === 'react' ? 'flutter' : null;
            case mode_config_1.DevelopmentMode.FLUTTER:
                // Flutter is source, React is target
                return sourceFramework === 'flutter' ? 'react' : null;
            case mode_config_1.DevelopmentMode.UNIVERSAL:
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
    isReadOnly(framework) {
        switch (this.mode) {
            case mode_config_1.DevelopmentMode.REACT:
                // Flutter files are generated (read-only)
                return framework === 'flutter';
            case mode_config_1.DevelopmentMode.FLUTTER:
                // React files are generated (read-only)
                return framework === 'react';
            case mode_config_1.DevelopmentMode.UNIVERSAL:
                // Both are editable
                return false;
            default:
                return false;
        }
    }
    /**
     * Get mode description
     */
    getModeDescription() {
        switch (this.mode) {
            case mode_config_1.DevelopmentMode.REACT:
                return 'React-first: React files are source, Flutter files are generated';
            case mode_config_1.DevelopmentMode.FLUTTER:
                return 'Flutter-first: Flutter files are source, React files are generated';
            case mode_config_1.DevelopmentMode.UNIVERSAL:
                return 'Universal: Both React and Flutter files are sources with bidirectional sync';
            default:
                return 'Unknown mode';
        }
    }
}
exports.ModeAwareWatcher = ModeAwareWatcher;
/**
 * Create mode-aware watcher from mode configuration
 */
function createModeAwareWatcher(modeConfig, watcherConfig) {
    return new ModeAwareWatcher({
        modeConfig,
        watcherConfig,
    });
}
