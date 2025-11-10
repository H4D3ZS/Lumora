"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileWatcher = void 0;
const chokidar = __importStar(require("chokidar"));
const path = __importStar(require("path"));
/**
 * File Watcher
 * Watches React and Flutter files for changes
 */
class FileWatcher {
    constructor(config = {}) {
        this.changeHandlers = [];
        this.debounceTimers = new Map();
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
    start() {
        // Watch React files
        if (this.config.reactDir) {
            this.reactWatcher = chokidar.watch([
                path.join(this.config.reactDir, '**/*.tsx'),
                path.join(this.config.reactDir, '**/*.ts'),
                path.join(this.config.reactDir, '**/*.jsx'),
                path.join(this.config.reactDir, '**/*.js'),
            ], {
                ignored: this.config.ignored,
                persistent: true,
                ignoreInitial: true,
                awaitWriteFinish: {
                    stabilityThreshold: 50,
                    pollInterval: 10,
                },
            });
            this.reactWatcher
                .on('add', (filePath) => this.handleChange('add', filePath, 'react'))
                .on('change', (filePath) => this.handleChange('change', filePath, 'react'))
                .on('unlink', (filePath) => this.handleChange('unlink', filePath, 'react'))
                .on('error', (error) => console.error('React watcher error:', error));
        }
        // Watch Flutter files
        if (this.config.flutterDir) {
            this.flutterWatcher = chokidar.watch([
                path.join(this.config.flutterDir, '**/*.dart'),
            ], {
                ignored: this.config.ignored,
                persistent: true,
                ignoreInitial: true,
                awaitWriteFinish: {
                    stabilityThreshold: 50,
                    pollInterval: 10,
                },
            });
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
    async stop() {
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
    handleChange(type, filePath, framework) {
        // Clear existing timer for this file
        const existingTimer = this.debounceTimers.get(filePath);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Set new debounce timer
        const timer = setTimeout(() => {
            this.debounceTimers.delete(filePath);
            const event = {
                type,
                filePath,
                framework,
                timestamp: Date.now(),
            };
            // Notify all handlers
            for (const handler of this.changeHandlers) {
                try {
                    handler(event);
                }
                catch (error) {
                    console.error('Error in change handler:', error);
                }
            }
        }, this.config.debounceMs);
        this.debounceTimers.set(filePath, timer);
    }
    /**
     * Register change handler
     */
    onChange(handler) {
        this.changeHandlers.push(handler);
    }
    /**
     * Remove change handler
     */
    removeChangeHandler(handler) {
        const index = this.changeHandlers.indexOf(handler);
        if (index !== -1) {
            this.changeHandlers.splice(index, 1);
        }
    }
    /**
     * Check if watching
     */
    isWatching() {
        return !!(this.reactWatcher || this.flutterWatcher);
    }
}
exports.FileWatcher = FileWatcher;
