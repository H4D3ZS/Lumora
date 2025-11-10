/**
 * Auto-Converter Service
 * Watches files and automatically converts TSX → Schema → Push to Dev-Proxy
 */
export interface AutoConverterConfig {
    watchDir: string;
    devProxyUrl: string;
    sessionId: string;
    debounceMs?: number;
}
export declare class AutoConverter {
    private watcher;
    private config;
    private debounceTimers;
    constructor(config: AutoConverterConfig);
    start(): Promise<void>;
    private handleFileChange;
    private processFile;
    private convertToSchema;
    private extractComponents;
    private pushToDevProxy;
    stop(): Promise<void>;
    isWatching(): boolean;
}
//# sourceMappingURL=auto-converter.d.ts.map