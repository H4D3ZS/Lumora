import { FileWatcherConfig, FileChangeEvent } from './file-watcher';
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
export declare class ModeAwareWatcher {
    private fileWatcher;
    private modeConfig;
    private mode;
    constructor(config: ModeAwareWatcherConfig);
    /**
     * Build watcher configuration based on development mode
     */
    private buildWatcherConfig;
    /**
     * Start watching files based on mode
     */
    start(): void;
    /**
     * Stop watching files
     */
    stop(): Promise<void>;
    /**
     * Register change handler
     * Filters events based on mode
     */
    onChange(handler: (event: FileChangeEvent) => void): void;
    /**
     * Check if event should be processed based on mode
     */
    private shouldProcessEvent;
    /**
     * Get current development mode
     */
    getMode(): DevelopmentMode;
    /**
     * Get mode configuration
     */
    getModeConfig(): ModeConfig;
    /**
     * Check if watching
     */
    isWatching(): boolean;
    /**
     * Get source framework based on mode
     * Returns the framework that is considered the "source of truth"
     */
    getSourceFramework(): 'react' | 'flutter' | 'both';
    /**
     * Get target framework based on mode
     * Returns the framework that will be generated
     */
    getTargetFramework(sourceFramework: 'react' | 'flutter'): 'react' | 'flutter' | null;
    /**
     * Check if file should be treated as read-only
     * In React/Flutter mode, generated files should be read-only
     */
    isReadOnly(framework: 'react' | 'flutter'): boolean;
    /**
     * Get mode description
     */
    getModeDescription(): string;
}
/**
 * Create mode-aware watcher from mode configuration
 */
export declare function createModeAwareWatcher(modeConfig: ModeConfig, watcherConfig?: Omit<FileWatcherConfig, 'reactDir' | 'flutterDir'>): ModeAwareWatcher;
