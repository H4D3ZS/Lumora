/**
 * Development mode types
 */
export declare enum DevelopmentMode {
    REACT = "react",
    FLUTTER = "flutter",
    UNIVERSAL = "universal"
}
/**
 * Naming conventions configuration
 */
export interface NamingConventions {
    fileNaming?: 'snake_case' | 'kebab-case' | 'PascalCase' | 'camelCase';
    identifierNaming?: 'camelCase' | 'PascalCase' | 'snake_case';
    componentNaming?: 'PascalCase' | 'camelCase';
}
/**
 * Formatting preferences configuration
 */
export interface FormattingPreferences {
    indentSize?: number;
    useTabs?: boolean;
    lineWidth?: number;
    semicolons?: boolean;
    trailingComma?: 'none' | 'es5' | 'all';
    singleQuote?: boolean;
}
/**
 * Synchronization settings
 */
export interface SyncSettings {
    enabled?: boolean;
    debounceMs?: number;
    excludePatterns?: string[];
    testSync?: boolean;
}
/**
 * Conversion behavior settings
 */
export interface ConversionSettings {
    preserveComments?: boolean;
    generateDocumentation?: boolean;
    strictTypeChecking?: boolean;
    fallbackBehavior?: 'warn' | 'error' | 'ignore';
}
/**
 * Validation settings
 */
export interface ValidationSettings {
    validateIR?: boolean;
    validateGenerated?: boolean;
}
/**
 * Lumora configuration
 */
export interface LumoraConfig {
    mode: DevelopmentMode;
    reactDir: string;
    flutterDir: string;
    storageDir?: string;
    customMappings?: string;
    namingConventions?: NamingConventions;
    formatting?: FormattingPreferences;
    sync?: SyncSettings;
    conversion?: ConversionSettings;
    validation?: ValidationSettings;
}
/**
 * Mode Configuration Manager
 * Handles loading, saving, and validating lumora.yaml configuration
 */
export declare class ModeConfig {
    private config;
    private configPath;
    private validator;
    private schemaPath;
    constructor(projectRoot?: string);
    /**
     * Load JSON schema validator
     */
    private loadValidator;
    /**
     * Load configuration from lumora.yaml
     */
    private loadConfig;
    /**
     * Validate configuration against JSON schema
     */
    private validateConfig;
    /**
     * Validate and merge configuration with defaults
     */
    private validateAndMerge;
    /**
     * Save configuration to lumora.yaml
     */
    save(config?: Partial<LumoraConfig>): void;
    /**
     * Initialize configuration with mode
     */
    static init(projectRoot: string, mode: DevelopmentMode, options?: Partial<LumoraConfig>): ModeConfig;
    /**
     * Get current configuration
     */
    getConfig(): LumoraConfig;
    /**
     * Get development mode
     */
    getMode(): DevelopmentMode;
    /**
     * Set development mode
     */
    setMode(mode: DevelopmentMode): void;
    /**
     * Get React directory
     */
    getReactDir(): string;
    /**
     * Get Flutter directory
     */
    getFlutterDir(): string;
    /**
     * Get storage directory
     */
    getStorageDir(): string;
    /**
     * Check if mode is React-first
     */
    isReactFirst(): boolean;
    /**
     * Check if mode is Flutter-first
     */
    isFlutterFirst(): boolean;
    /**
     * Check if mode is Universal (bidirectional)
     */
    isUniversal(): boolean;
    /**
     * Get configuration file path
     */
    getConfigPath(): string;
    /**
     * Reload configuration from file
     */
    reload(): void;
    /**
     * Get custom mappings path
     */
    getCustomMappings(): string | undefined;
    /**
     * Get naming conventions
     */
    getNamingConventions(): NamingConventions;
    /**
     * Get formatting preferences
     */
    getFormattingPreferences(): FormattingPreferences;
    /**
     * Get sync settings
     */
    getSyncSettings(): SyncSettings;
    /**
     * Get conversion settings
     */
    getConversionSettings(): ConversionSettings;
    /**
     * Get validation settings
     */
    getValidationSettings(): ValidationSettings;
    /**
     * Apply naming convention to a string
     */
    applyFileNamingConvention(name: string): string;
    /**
     * Apply identifier naming convention to a string
     */
    applyIdentifierNamingConvention(name: string): string;
    /**
     * Apply component naming convention to a string
     */
    applyComponentNamingConvention(name: string): string;
    /**
     * Convert string to specified case
     */
    private convertCase;
    /**
     * Get default configuration
     */
    static getDefaultConfig(): LumoraConfig;
}
/**
 * Load mode configuration from project root
 */
export declare function loadModeConfig(projectRoot?: string): ModeConfig;
/**
 * Initialize new mode configuration
 */
export declare function initModeConfig(projectRoot: string, mode: DevelopmentMode, options?: Partial<LumoraConfig>): ModeConfig;
