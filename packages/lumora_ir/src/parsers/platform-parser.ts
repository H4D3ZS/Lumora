/**
 * Platform-Specific Code Parser
 * Detects and extracts platform-specific code from React and Flutter
 */

import * as t from '@babel/types';
import traverse, { NodePath } from '@babel/traverse';
import {
  PlatformCode,
  PlatformImplementation,
  CodeBlock,
  PlatformType,
  PlatformCheck,
  PlatformExtractionResult,
  PlatformCodeMetadata,
} from '../types/platform-types';
import { ErrorHandler, getErrorHandler } from '../errors/error-handler';

/**
 * Platform parser for React/TypeScript code
 */
export class ReactPlatformParser {
  private errorHandler: ErrorHandler;
  private platformCodeBlocks: PlatformCode[] = [];
  private warnings: string[] = [];
  private blockIdCounter = 0;

  constructor(errorHandler?: ErrorHandler) {
    this.errorHandler = errorHandler || getErrorHandler();
  }

  /**
   * Extract platform-specific code from React AST
   */
  extractPlatformCode(ast: t.File, sourceCode: string): PlatformExtractionResult {
    this.platformCodeBlocks = [];
    this.warnings = [];
    this.blockIdCounter = 0;

    traverse(ast, {
      IfStatement: (path) => {
        const platformCheck = this.detectPlatformCheck(path.node.test);
        if (platformCheck) {
          const platformCode = this.extractPlatformBlock(path, platformCheck, sourceCode);
          if (platformCode) {
            this.platformCodeBlocks.push(platformCode);
          }
        }
      },
      ConditionalExpression: (path) => {
        const platformCheck = this.detectPlatformCheck(path.node.test);
        if (platformCheck) {
          const platformCode = this.extractTernaryPlatformBlock(path, platformCheck, sourceCode);
          if (platformCode) {
            this.platformCodeBlocks.push(platformCode);
          }
        }
      },
    });

    return {
      platformCode: this.platformCodeBlocks,
      warnings: this.warnings,
      hasPlatformCode: this.platformCodeBlocks.length > 0,
    };
  }

  /**
   * Detect if an expression is a platform check
   */
  private detectPlatformCheck(test: t.Expression): PlatformCheck | null {
    // Check for Platform.OS === 'ios' or Platform.OS === 'android'
    if (t.isBinaryExpression(test) && (test.operator === '===' || test.operator === '==')) {
      const left = test.left;
      const right = test.right;

      if (this.isPlatformOSAccess(left) && t.isStringLiteral(right)) {
        return this.createPlatformCheck(right.value, false, test.loc);
      }
      if (this.isPlatformOSAccess(right) && t.isStringLiteral(left)) {
        return this.createPlatformCheck(left.value, false, test.loc);
      }
    }

    // Check for negated platform checks: Platform.OS !== 'ios'
    if (t.isBinaryExpression(test) && (test.operator === '!==' || test.operator === '!=')) {
      const left = test.left;
      const right = test.right;

      if (this.isPlatformOSAccess(left) && t.isStringLiteral(right)) {
        return this.createPlatformCheck(right.value, true, test.loc);
      }
      if (this.isPlatformOSAccess(right) && t.isStringLiteral(left)) {
        return this.createPlatformCheck(left.value, true, test.loc);
      }
    }

    return null;
  }

  /**
   * Check if expression is Platform.OS access
   */
  private isPlatformOSAccess(node: t.Expression | t.PrivateName): boolean {
    return (
      t.isMemberExpression(node) &&
      t.isIdentifier(node.object) &&
      node.object.name === 'Platform' &&
      t.isIdentifier(node.property) &&
      node.property.name === 'OS'
    );
  }

  /**
   * Create platform check object
   */
  private createPlatformCheck(
    platform: string,
    negated: boolean,
    loc: t.SourceLocation | null | undefined
  ): PlatformCheck | null {
    const platformMap: Record<string, PlatformCheck['type']> = {
      ios: 'isIOS',
      android: 'isAndroid',
      web: 'isWeb',
      macos: 'isMacOS',
      windows: 'isWindows',
      linux: 'isLinux',
    };

    const checkType = platformMap[platform.toLowerCase()];
    if (!checkType) {
      this.warnings.push(`Unknown platform type: ${platform}`);
      return null;
    }

    return {
      type: checkType,
      negated,
      location: loc
        ? {
            line: loc.start.line,
            column: loc.start.column,
          }
        : undefined,
    };
  }

  /**
   * Extract platform-specific code block from if statement
   */
  private extractPlatformBlock(
    path: NodePath<t.IfStatement>,
    platformCheck: PlatformCheck,
    sourceCode: string
  ): PlatformCode | null {
    const implementations: PlatformImplementation[] = [];
    let fallback: CodeBlock | undefined;

    // Extract consequent (if block)
    const consequentCode = this.extractCodeBlock(path.node.consequent, sourceCode);
    if (consequentCode) {
      const platforms = this.getPlatformsFromCheck(platformCheck);
      implementations.push({
        platforms,
        code: consequentCode,
      });
    }

    // Extract alternate (else block)
    if (path.node.alternate) {
      // Check if alternate is another if statement (else if)
      if (t.isIfStatement(path.node.alternate)) {
        const alternateCheck = this.detectPlatformCheck(path.node.alternate.test);
        if (alternateCheck) {
          const alternateCode = this.extractCodeBlock(path.node.alternate.consequent, sourceCode);
          if (alternateCode) {
            const platforms = this.getPlatformsFromCheck(alternateCheck);
            implementations.push({
              platforms,
              code: alternateCode,
            });
          }

          // Check for final else
          if (path.node.alternate.alternate) {
            fallback = this.extractCodeBlock(path.node.alternate.alternate, sourceCode);
          }
        }
      } else {
        // Simple else block
        fallback = this.extractCodeBlock(path.node.alternate, sourceCode);
      }
    }

    if (implementations.length === 0) {
      return null;
    }

    const metadata: PlatformCodeMetadata = {
      sourceLocation: path.node.loc
        ? {
            file: '',
            line: path.node.loc.start.line,
            column: path.node.loc.start.column,
          }
        : undefined,
    };

    if (!fallback) {
      metadata.warnings = ['No fallback implementation provided for platform-specific code'];
      this.warnings.push(
        `Platform-specific code at line ${path.node.loc?.start.line} has no fallback`
      );
    }

    return {
      id: `platform_block_${this.blockIdCounter++}`,
      implementations,
      fallback,
      metadata,
    };
  }

  /**
   * Extract platform-specific code from ternary expression
   */
  private extractTernaryPlatformBlock(
    path: NodePath<t.ConditionalExpression>,
    platformCheck: PlatformCheck,
    sourceCode: string
  ): PlatformCode | null {
    const implementations: PlatformImplementation[] = [];

    const consequentCode = this.extractExpressionCode(path.node.consequent, sourceCode);
    const alternateCode = this.extractExpressionCode(path.node.alternate, sourceCode);

    if (consequentCode) {
      const platforms = this.getPlatformsFromCheck(platformCheck);
      implementations.push({
        platforms,
        code: consequentCode,
      });
    }

    return {
      id: `platform_ternary_${this.blockIdCounter++}`,
      implementations,
      fallback: alternateCode,
      metadata: {
        sourceLocation: path.node.loc
          ? {
              file: '',
              line: path.node.loc.start.line,
              column: path.node.loc.start.column,
            }
          : undefined,
      },
    };
  }

  /**
   * Extract code block from statement
   */
  private extractCodeBlock(
    statement: t.Statement,
    sourceCode: string
  ): CodeBlock | undefined {
    if (!statement.loc) {
      return undefined;
    }

    const source = sourceCode.slice(statement.start!, statement.end!);

    return {
      source: source.trim(),
      language: 'typescript',
    };
  }

  /**
   * Extract code from expression
   */
  private extractExpressionCode(
    expression: t.Expression,
    sourceCode: string
  ): CodeBlock | undefined {
    if (!expression.loc) {
      return undefined;
    }

    const source = sourceCode.slice(expression.start!, expression.end!);

    return {
      source: source.trim(),
      language: 'typescript',
    };
  }

  /**
   * Get platform types from platform check
   */
  private getPlatformsFromCheck(check: PlatformCheck): PlatformType[] {
    const platformMap: Record<PlatformCheck['type'], PlatformType> = {
      isIOS: 'ios',
      isAndroid: 'android',
      isWeb: 'web',
      isMacOS: 'macos',
      isWindows: 'windows',
      isLinux: 'linux',
    };

    const platform = platformMap[check.type];
    return check.negated ? [] : [platform];
  }
}

/**
 * Platform parser for Flutter/Dart code
 */
export class DartPlatformParser {
  private errorHandler: ErrorHandler;
  private platformCodeBlocks: PlatformCode[] = [];
  private warnings: string[] = [];
  private blockIdCounter = 0;

  constructor(errorHandler?: ErrorHandler) {
    this.errorHandler = errorHandler || getErrorHandler();
  }

  /**
   * Extract platform-specific code from Dart source
   */
  extractPlatformCode(dartSource: string): PlatformExtractionResult {
    this.platformCodeBlocks = [];
    this.warnings = [];
    this.blockIdCounter = 0;

    // Parse Dart code for platform checks
    const platformChecks = this.findPlatformChecks(dartSource);

    for (const check of platformChecks) {
      const platformCode = this.extractDartPlatformBlock(check, dartSource);
      if (platformCode) {
        this.platformCodeBlocks.push(platformCode);
      }
    }

    return {
      platformCode: this.platformCodeBlocks,
      warnings: this.warnings,
      hasPlatformCode: this.platformCodeBlocks.length > 0,
    };
  }

  /**
   * Find platform checks in Dart source code
   */
  private findPlatformChecks(source: string): Array<{
    type: PlatformCheck['type'];
    start: number;
    end: number;
    line: number;
  }> {
    const checks: Array<{
      type: PlatformCheck['type'];
      start: number;
      end: number;
      line: number;
    }> = [];

    // Regex patterns for platform checks
    const patterns = [
      { regex: /Platform\.isIOS/g, type: 'isIOS' as const },
      { regex: /Platform\.isAndroid/g, type: 'isAndroid' as const },
      { regex: /Platform\.isWeb/g, type: 'isWeb' as const },
      { regex: /Platform\.isMacOS/g, type: 'isMacOS' as const },
      { regex: /Platform\.isWindows/g, type: 'isWindows' as const },
      { regex: /Platform\.isLinux/g, type: 'isLinux' as const },
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(source)) !== null) {
        const line = source.substring(0, match.index).split('\n').length;
        checks.push({
          type: pattern.type,
          start: match.index,
          end: match.index + match[0].length,
          line,
        });
      }
    }

    return checks.sort((a, b) => a.start - b.start);
  }

  /**
   * Extract platform-specific code block from Dart
   */
  private extractDartPlatformBlock(
    check: { type: PlatformCheck['type']; start: number; end: number; line: number },
    source: string
  ): PlatformCode | null {
    // Find the if statement containing this check
    const ifMatch = this.findIfStatement(source, check.start);
    if (!ifMatch) {
      return null;
    }

    const implementations: PlatformImplementation[] = [];
    let fallback: CodeBlock | undefined;

    // Extract the if block
    const ifBlock = this.extractBlock(source, ifMatch.consequentStart, ifMatch.consequentEnd);
    if (ifBlock) {
      implementations.push({
        platforms: [this.getPlatformType(check.type)],
        code: {
          source: ifBlock,
          language: 'dart',
        },
      });
    }

    // Extract else block if present
    if (ifMatch.alternateStart !== undefined && ifMatch.alternateEnd !== undefined) {
      const elseBlock = this.extractBlock(source, ifMatch.alternateStart, ifMatch.alternateEnd);
      if (elseBlock) {
        // Check if else block contains another platform check
        const nestedCheck = this.findPlatformChecks(elseBlock);
        if (nestedCheck.length > 0) {
          // This is an else-if with another platform check
          const nestedBlock = this.extractBlock(
            elseBlock,
            nestedCheck[0].start,
            nestedCheck[0].end
          );
          if (nestedBlock) {
            implementations.push({
              platforms: [this.getPlatformType(nestedCheck[0].type)],
              code: {
                source: nestedBlock,
                language: 'dart',
              },
            });
          }
        } else {
          // This is a simple else block (fallback)
          fallback = {
            source: elseBlock,
            language: 'dart',
          };
        }
      }
    }

    if (implementations.length === 0) {
      return null;
    }

    const metadata: PlatformCodeMetadata = {
      sourceLocation: {
        file: '',
        line: check.line,
        column: 0,
      },
    };

    if (!fallback) {
      metadata.warnings = ['No fallback implementation provided for platform-specific code'];
      this.warnings.push(`Platform-specific code at line ${check.line} has no fallback`);
    }

    return {
      id: `dart_platform_block_${this.blockIdCounter++}`,
      implementations,
      fallback,
      metadata,
    };
  }

  /**
   * Find if statement containing the platform check
   */
  private findIfStatement(
    source: string,
    checkPosition: number
  ): {
    consequentStart: number;
    consequentEnd: number;
    alternateStart?: number;
    alternateEnd?: number;
  } | null {
    // Find the opening brace after the check
    let braceCount = 0;
    let consequentStart = -1;
    let consequentEnd = -1;

    for (let i = checkPosition; i < source.length; i++) {
      if (source[i] === '{') {
        if (consequentStart === -1) {
          consequentStart = i + 1;
        }
        braceCount++;
      } else if (source[i] === '}') {
        braceCount--;
        if (braceCount === 0 && consequentStart !== -1) {
          consequentEnd = i;
          break;
        }
      }
    }

    if (consequentStart === -1 || consequentEnd === -1) {
      return null;
    }

    // Check for else block
    let alternateStart: number | undefined;
    let alternateEnd: number | undefined;

    const afterIf = source.substring(consequentEnd).trim();
    if (afterIf.startsWith('}') && afterIf.substring(1).trim().startsWith('else')) {
      const elseIndex = consequentEnd + afterIf.indexOf('else') + 4;
      const elseContent = source.substring(elseIndex).trim();

      if (elseContent.startsWith('{')) {
        braceCount = 0;
        for (let i = elseIndex; i < source.length; i++) {
          if (source[i] === '{') {
            if (alternateStart === undefined) {
              alternateStart = i + 1;
            }
            braceCount++;
          } else if (source[i] === '}') {
            braceCount--;
            if (braceCount === 0 && alternateStart !== undefined) {
              alternateEnd = i;
              break;
            }
          }
        }
      }
    }

    return {
      consequentStart,
      consequentEnd,
      alternateStart,
      alternateEnd,
    };
  }

  /**
   * Extract code block between positions
   */
  private extractBlock(source: string, start: number, end: number): string | null {
    if (start < 0 || end < 0 || start >= end) {
      return null;
    }
    return source.substring(start, end).trim();
  }

  /**
   * Convert platform check type to platform type
   */
  private getPlatformType(checkType: PlatformCheck['type']): PlatformType {
    const map: Record<PlatformCheck['type'], PlatformType> = {
      isIOS: 'ios',
      isAndroid: 'android',
      isWeb: 'web',
      isMacOS: 'macos',
      isWindows: 'windows',
      isLinux: 'linux',
    };
    return map[checkType];
  }
}
