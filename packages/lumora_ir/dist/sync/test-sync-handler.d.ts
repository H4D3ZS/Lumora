/**
 * Test Sync Handler
 * Handles automatic conversion of test files during sync
 */
export interface TestSyncConfig {
    enabled: boolean;
    convertTests: boolean;
    convertMocks: boolean;
    generateStubs: boolean;
}
export interface TestConversionResult {
    success: boolean;
    sourceFile: string;
    targetFile?: string;
    error?: string;
    stubGenerated?: boolean;
}
/**
 * Test Sync Handler
 * Automatically converts test files between React and Flutter
 */
export declare class TestSyncHandler {
    private testConverter;
    private mockConverter;
    private config;
    constructor(config?: Partial<TestSyncConfig>);
    /**
     * Check if file is a test file
     */
    isTestFile(filePath: string): boolean;
    /**
     * Get test framework from file path
     */
    getTestFramework(filePath: string): 'react' | 'flutter' | null;
    /**
     * Convert test file
     */
    convertTestFile(sourceFile: string, targetFile: string, sourceFramework: 'react' | 'flutter'): Promise<TestConversionResult>;
    /**
     * Wrap test stub in proper structure
     */
    private wrapTestStub;
    /**
     * Ensure directory exists
     */
    private ensureDirectoryExists;
    /**
     * Get target test file path
     */
    getTargetTestPath(sourceFile: string, sourceFramework: 'react' | 'flutter', reactDir: string, flutterDir: string): string;
    /**
     * Convert to snake_case
     */
    private toSnakeCase;
    /**
     * Convert to PascalCase
     */
    private toPascalCase;
    /**
     * Enable test conversion
     */
    enable(): void;
    /**
     * Disable test conversion
     */
    disable(): void;
    /**
     * Check if test conversion is enabled
     */
    isEnabled(): boolean;
    /**
     * Get configuration
     */
    getConfig(): TestSyncConfig;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<TestSyncConfig>): void;
}
