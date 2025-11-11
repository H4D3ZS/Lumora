/**
 * Platform-Specific Code Type Definitions
 * Handles platform-specific implementations for iOS, Android, and Web
 */

/**
 * Supported platform types
 */
export type PlatformType = 'ios' | 'android' | 'web' | 'macos' | 'windows' | 'linux';

/**
 * Platform-specific code block
 */
export interface PlatformCode {
  /** Unique identifier for this platform code block */
  id: string;
  
  /** Platform-specific implementations */
  implementations: PlatformImplementation[];
  
  /** Fallback implementation when platform doesn't match */
  fallback?: CodeBlock;
  
  /** Metadata about the platform code */
  metadata?: PlatformCodeMetadata;
}

/**
 * Platform-specific implementation
 */
export interface PlatformImplementation {
  /** Target platform(s) for this implementation */
  platforms: PlatformType[];
  
  /** Code to execute for this platform */
  code: CodeBlock;
  
  /** Optional condition for more granular control */
  condition?: string;
}

/**
 * Code block representation
 */
export interface CodeBlock {
  /** Source code as string */
  source: string;
  
  /** Language of the code (dart, typescript, etc.) */
  language: 'dart' | 'typescript' | 'javascript';
  
  /** Dependencies required by this code */
  dependencies?: string[];
  
  /** Imports needed for this code */
  imports?: string[];
}

/**
 * Metadata for platform code
 */
export interface PlatformCodeMetadata {
  /** Description of what this platform code does */
  description?: string;
  
  /** Source location in original file */
  sourceLocation?: {
    file: string;
    line: number;
    column: number;
  };
  
  /** Warnings about platform-specific dependencies */
  warnings?: string[];
}

/**
 * Platform detection configuration
 */
export interface PlatformDetectionConfig {
  /** Current platform being targeted */
  targetPlatform?: PlatformType;
  
  /** Whether to include fallback code */
  includeFallback: boolean;
  
  /** Whether to warn about platform-specific code */
  warnOnPlatformCode: boolean;
  
  /** Whether to strip platform code for unsupported platforms */
  stripUnsupportedPlatforms: boolean;
}

/**
 * Platform schema for Lumora IR
 */
export interface PlatformSchema {
  /** Platform-specific code blocks */
  platformCode: PlatformCode[];
  
  /** Platform detection configuration */
  config?: PlatformDetectionConfig;
  
  /** Platform-specific assets */
  platformAssets?: PlatformAsset[];
}

/**
 * Platform-specific asset
 */
export interface PlatformAsset {
  /** Asset identifier */
  id: string;
  
  /** Platform-specific asset paths */
  paths: Record<PlatformType, string>;
  
  /** Fallback asset path */
  fallback?: string;
}

/**
 * Platform check expression
 */
export interface PlatformCheck {
  /** Type of check (isIOS, isAndroid, etc.) */
  type: 'isIOS' | 'isAndroid' | 'isWeb' | 'isMacOS' | 'isWindows' | 'isLinux';
  
  /** Whether this is a negated check */
  negated: boolean;
  
  /** Source location */
  location?: {
    line: number;
    column: number;
  };
}

/**
 * Result of platform code extraction
 */
export interface PlatformExtractionResult {
  /** Extracted platform code blocks */
  platformCode: PlatformCode[];
  
  /** Warnings generated during extraction */
  warnings: string[];
  
  /** Whether any platform-specific code was found */
  hasPlatformCode: boolean;
}
