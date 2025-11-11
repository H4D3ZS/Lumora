/**
 * Platform-Specific Code Generator
 * Generates platform-specific code for React and Flutter
 */
import { PlatformType, PlatformSchema } from '../types/platform-types';
/**
 * Configuration for platform code generation
 */
export interface PlatformGeneratorConfig {
    /** Target platform for generation */
    targetPlatform?: PlatformType;
    /** Whether to include fallback code */
    includeFallback: boolean;
    /** Whether to add comments explaining platform checks */
    addComments: boolean;
    /** Indentation string (spaces or tabs) */
    indent: string;
}
/**
 * Platform code generator for React/TypeScript
 */
export declare class ReactPlatformGenerator {
    private config;
    constructor(config?: Partial<PlatformGeneratorConfig>);
    /**
     * Generate React/TypeScript code from platform schema
     */
    generateCode(platformSchema: PlatformSchema): string;
    /**
     * Generate a single platform-specific code block
     */
    private generatePlatformBlock;
    /**
     * Generate if block for platform implementation
     */
    private generateIfBlock;
    /**
     * Generate platform condition expression
     */
    private generatePlatformCondition;
    /**
     * Get platform check expression for React
     */
    private getPlatformCheck;
    /**
     * Indent code by specified levels
     */
    private indentCode;
    /**
     * Generate platform-specific imports
     */
    generateImports(platformSchema: PlatformSchema): string[];
}
/**
 * Platform code generator for Flutter/Dart
 */
export declare class DartPlatformGenerator {
    private config;
    constructor(config?: Partial<PlatformGeneratorConfig>);
    /**
     * Generate Dart code from platform schema
     */
    generateCode(platformSchema: PlatformSchema): string;
    /**
     * Generate a single platform-specific code block
     */
    private generatePlatformBlock;
    /**
     * Generate if block for platform implementation
     */
    private generateIfBlock;
    /**
     * Generate platform condition expression
     */
    private generatePlatformCondition;
    /**
     * Get platform check expression for Dart
     */
    private getPlatformCheck;
    /**
     * Indent code by specified levels
     */
    private indentCode;
    /**
     * Generate platform-specific imports
     */
    generateImports(platformSchema: PlatformSchema): string[];
}
/**
 * Platform-aware code generator that selects appropriate generator
 */
export declare class PlatformCodeGenerator {
    private reactGenerator;
    private dartGenerator;
    constructor(config?: Partial<PlatformGeneratorConfig>);
    /**
     * Generate code for specified target framework
     */
    generateCode(platformSchema: PlatformSchema, targetFramework: 'react' | 'flutter'): string;
    /**
     * Generate imports for specified target framework
     */
    generateImports(platformSchema: PlatformSchema, targetFramework: 'react' | 'flutter'): string[];
    /**
     * Optimize platform code by removing unreachable branches
     */
    optimizeForPlatform(platformSchema: PlatformSchema, targetPlatform: PlatformType): PlatformSchema;
    /**
     * Generate platform-specific code with optimization
     */
    generateOptimizedCode(platformSchema: PlatformSchema, targetFramework: 'react' | 'flutter', targetPlatform?: PlatformType): string;
}
/**
 * Helper function to create platform code generator
 */
export declare function createPlatformGenerator(config?: Partial<PlatformGeneratorConfig>): PlatformCodeGenerator;
