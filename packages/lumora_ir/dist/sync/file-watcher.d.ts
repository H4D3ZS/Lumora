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
export declare class FileWatcher {
    private reactWatcher?;
    private flutterWatcher?;
    private config;
    private changeHandlers;
    private debounceTimers;
    constructor(config?: FileWatcherConfig);
    /**
     * Start watching files
     */
    start(): void;
    /**
     * Stop watching files
     */
    stop(): Promise<void>;
    /**
     * Handle file change with debouncing
     */
    private handleChange;
    /**
     * Register change handler
     */
    onChange(handler: (event: FileChangeEvent) => void): void;
    /**
     * Remove change handler
     */
    removeChangeHandler(handler: (event: FileChangeEvent) => void): void;
    /**
     * Check if watching
     */
    isWatching(): boolean;
}
