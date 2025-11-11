/**
 * Configuration Loader
 * Loads lumora.config.js or uses defaults
 */
export interface LumoraConfig {
    watchDir: string;
    reactDir: string;
    flutterDir: string;
    storageDir: string;
    port: number;
    mode: 'react' | 'flutter' | 'universal';
    autoConvert: boolean;
    autoPush: boolean;
    generateCode: boolean;
}
export declare function loadConfig(): Promise<LumoraConfig>;
export declare function getDefaultConfig(): LumoraConfig;
//# sourceMappingURL=config-loader.d.ts.map