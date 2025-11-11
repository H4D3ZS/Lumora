/**
 * Platform-Specific Code Generator
 * Generates platform-specific code for React and Flutter
 */

import {
  PlatformCode,
  PlatformImplementation,
  CodeBlock,
  PlatformType,
  PlatformSchema,
} from '../types/platform-types';

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
export class ReactPlatformGenerator {
  private config: PlatformGeneratorConfig;

  constructor(config: Partial<PlatformGeneratorConfig> = {}) {
    this.config = {
      includeFallback: true,
      addComments: true,
      indent: '  ',
      ...config,
    };
  }

  /**
   * Generate React/TypeScript code from platform schema
   */
  generateCode(platformSchema: PlatformSchema): string {
    if (!platformSchema.platformCode || platformSchema.platformCode.length === 0) {
      return '';
    }

    const codeBlocks = platformSchema.platformCode.map(block =>
      this.generatePlatformBlock(block)
    );

    return codeBlocks.filter(Boolean).join('\n\n');
  }

  /**
   * Generate a single platform-specific code block
   */
  private generatePlatformBlock(platformCode: PlatformCode): string {
    const { implementations, fallback, metadata } = platformCode;

    if (implementations.length === 0) {
      return '';
    }

    let code = '';

    // Add comment if enabled
    if (this.config.addComments && metadata?.description) {
      code += `// ${metadata.description}\n`;
    }

    // Generate if-else chain
    for (let i = 0; i < implementations.length; i++) {
      const impl = implementations[i];
      const isFirst = i === 0;
      const isLast = i === implementations.length - 1;

      if (isFirst) {
        code += this.generateIfBlock(impl);
      } else {
        code += ` else ${this.generateIfBlock(impl)}`;
      }
    }

    // Add fallback (else block)
    if (this.config.includeFallback && fallback) {
      code += ` else {\n`;
      code += this.indentCode(fallback.source, 1);
      code += `\n}`;
    } else if (!fallback && this.config.addComments) {
      code += ` // No fallback provided`;
    }

    return code;
  }

  /**
   * Generate if block for platform implementation
   */
  private generateIfBlock(impl: PlatformImplementation): string {
    const condition = this.generatePlatformCondition(impl.platforms, impl.condition);
    let code = `if (${condition}) {\n`;
    code += this.indentCode(impl.code.source, 1);
    code += `\n}`;
    return code;
  }

  /**
   * Generate platform condition expression
   */
  private generatePlatformCondition(platforms: PlatformType[], customCondition?: string): string {
    if (customCondition) {
      return customCondition;
    }

    if (platforms.length === 0) {
      return 'false';
    }

    if (platforms.length === 1) {
      return this.getPlatformCheck(platforms[0]);
    }

    // Multiple platforms: Platform.OS === 'ios' || Platform.OS === 'android'
    return platforms.map(p => this.getPlatformCheck(p)).join(' || ');
  }

  /**
   * Get platform check expression for React
   */
  private getPlatformCheck(platform: PlatformType): string {
    return `Platform.OS === '${platform}'`;
  }

  /**
   * Indent code by specified levels
   */
  private indentCode(code: string, levels: number): string {
    const indent = this.config.indent.repeat(levels);
    return code
      .split('\n')
      .map(line => (line.trim() ? indent + line : line))
      .join('\n');
  }

  /**
   * Generate platform-specific imports
   */
  generateImports(platformSchema: PlatformSchema): string[] {
    const imports: string[] = [];

    // Check if Platform is used
    if (platformSchema.platformCode && platformSchema.platformCode.length > 0) {
      imports.push("import { Platform } from 'react-native';");
    }

    return imports;
  }
}

/**
 * Platform code generator for Flutter/Dart
 */
export class DartPlatformGenerator {
  private config: PlatformGeneratorConfig;

  constructor(config: Partial<PlatformGeneratorConfig> = {}) {
    this.config = {
      includeFallback: true,
      addComments: true,
      indent: '  ',
      ...config,
    };
  }

  /**
   * Generate Dart code from platform schema
   */
  generateCode(platformSchema: PlatformSchema): string {
    if (!platformSchema.platformCode || platformSchema.platformCode.length === 0) {
      return '';
    }

    const codeBlocks = platformSchema.platformCode.map(block =>
      this.generatePlatformBlock(block)
    );

    return codeBlocks.filter(Boolean).join('\n\n');
  }

  /**
   * Generate a single platform-specific code block
   */
  private generatePlatformBlock(platformCode: PlatformCode): string {
    const { implementations, fallback, metadata } = platformCode;

    if (implementations.length === 0) {
      return '';
    }

    let code = '';

    // Add comment if enabled
    if (this.config.addComments && metadata?.description) {
      code += `// ${metadata.description}\n`;
    }

    // Generate if-else chain
    for (let i = 0; i < implementations.length; i++) {
      const impl = implementations[i];
      const isFirst = i === 0;

      if (isFirst) {
        code += this.generateIfBlock(impl);
      } else {
        code += ` else ${this.generateIfBlock(impl)}`;
      }
    }

    // Add fallback (else block)
    if (this.config.includeFallback && fallback) {
      code += ` else {\n`;
      code += this.indentCode(fallback.source, 1);
      code += `\n}`;
    } else if (!fallback && this.config.addComments) {
      code += ` // No fallback provided`;
    }

    return code;
  }

  /**
   * Generate if block for platform implementation
   */
  private generateIfBlock(impl: PlatformImplementation): string {
    const condition = this.generatePlatformCondition(impl.platforms, impl.condition);
    let code = `if (${condition}) {\n`;
    code += this.indentCode(impl.code.source, 1);
    code += `\n}`;
    return code;
  }

  /**
   * Generate platform condition expression
   */
  private generatePlatformCondition(platforms: PlatformType[], customCondition?: string): string {
    if (customCondition) {
      return customCondition;
    }

    if (platforms.length === 0) {
      return 'false';
    }

    if (platforms.length === 1) {
      return this.getPlatformCheck(platforms[0]);
    }

    // Multiple platforms: Platform.isIOS || Platform.isAndroid
    return platforms.map(p => this.getPlatformCheck(p)).join(' || ');
  }

  /**
   * Get platform check expression for Dart
   */
  private getPlatformCheck(platform: PlatformType): string {
    const checkMap: Record<PlatformType, string> = {
      ios: 'Platform.isIOS',
      android: 'Platform.isAndroid',
      web: 'Platform.isWeb',
      macos: 'Platform.isMacOS',
      windows: 'Platform.isWindows',
      linux: 'Platform.isLinux',
    };
    return checkMap[platform] || 'false';
  }

  /**
   * Indent code by specified levels
   */
  private indentCode(code: string, levels: number): string {
    const indent = this.config.indent.repeat(levels);
    return code
      .split('\n')
      .map(line => (line.trim() ? indent + line : line))
      .join('\n');
  }

  /**
   * Generate platform-specific imports
   */
  generateImports(platformSchema: PlatformSchema): string[] {
    const imports: string[] = [];

    // Check if Platform is used
    if (platformSchema.platformCode && platformSchema.platformCode.length > 0) {
      imports.push("import 'dart:io' show Platform;");
    }

    return imports;
  }
}

/**
 * Platform-aware code generator that selects appropriate generator
 */
export class PlatformCodeGenerator {
  private reactGenerator: ReactPlatformGenerator;
  private dartGenerator: DartPlatformGenerator;

  constructor(config: Partial<PlatformGeneratorConfig> = {}) {
    this.reactGenerator = new ReactPlatformGenerator(config);
    this.dartGenerator = new DartPlatformGenerator(config);
  }

  /**
   * Generate code for specified target framework
   */
  generateCode(
    platformSchema: PlatformSchema,
    targetFramework: 'react' | 'flutter'
  ): string {
    if (targetFramework === 'react') {
      return this.reactGenerator.generateCode(platformSchema);
    } else {
      return this.dartGenerator.generateCode(platformSchema);
    }
  }

  /**
   * Generate imports for specified target framework
   */
  generateImports(
    platformSchema: PlatformSchema,
    targetFramework: 'react' | 'flutter'
  ): string[] {
    if (targetFramework === 'react') {
      return this.reactGenerator.generateImports(platformSchema);
    } else {
      return this.dartGenerator.generateImports(platformSchema);
    }
  }

  /**
   * Optimize platform code by removing unreachable branches
   */
  optimizeForPlatform(
    platformSchema: PlatformSchema,
    targetPlatform: PlatformType
  ): PlatformSchema {
    const optimizedCode = platformSchema.platformCode.map(block => {
      // Find implementation for target platform
      const targetImpl = block.implementations.find(impl =>
        impl.platforms.includes(targetPlatform)
      );

      if (targetImpl) {
        // Only keep the target implementation
        return {
          ...block,
          implementations: [targetImpl],
          fallback: undefined, // Remove fallback since we have exact match
        };
      } else if (block.fallback) {
        // Use fallback as the only implementation
        return {
          ...block,
          implementations: [
            {
              platforms: [targetPlatform],
              code: block.fallback,
            },
          ],
          fallback: undefined,
        };
      }

      return block;
    });

    return {
      ...platformSchema,
      platformCode: optimizedCode,
    };
  }

  /**
   * Generate platform-specific code with optimization
   */
  generateOptimizedCode(
    platformSchema: PlatformSchema,
    targetFramework: 'react' | 'flutter',
    targetPlatform?: PlatformType
  ): string {
    let schema = platformSchema;

    // Optimize if target platform is specified
    if (targetPlatform) {
      schema = this.optimizeForPlatform(schema, targetPlatform);
    }

    return this.generateCode(schema, targetFramework);
  }
}

/**
 * Helper function to create platform code generator
 */
export function createPlatformGenerator(
  config?: Partial<PlatformGeneratorConfig>
): PlatformCodeGenerator {
  return new PlatformCodeGenerator(config);
}
