"use strict";
/**
 * Platform-Specific Code Parser
 * Detects and extracts platform-specific code from React and Flutter
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DartPlatformParser = exports.ReactPlatformParser = void 0;
const t = __importStar(require("@babel/types"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const error_handler_1 = require("../errors/error-handler");
/**
 * Platform parser for React/TypeScript code
 */
class ReactPlatformParser {
    constructor(errorHandler) {
        this.platformCodeBlocks = [];
        this.warnings = [];
        this.blockIdCounter = 0;
        this.errorHandler = errorHandler || (0, error_handler_1.getErrorHandler)();
    }
    /**
     * Extract platform-specific code from React AST
     */
    extractPlatformCode(ast, sourceCode) {
        this.platformCodeBlocks = [];
        this.warnings = [];
        this.blockIdCounter = 0;
        (0, traverse_1.default)(ast, {
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
    detectPlatformCheck(test) {
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
    isPlatformOSAccess(node) {
        return (t.isMemberExpression(node) &&
            t.isIdentifier(node.object) &&
            node.object.name === 'Platform' &&
            t.isIdentifier(node.property) &&
            node.property.name === 'OS');
    }
    /**
     * Create platform check object
     */
    createPlatformCheck(platform, negated, loc) {
        const platformMap = {
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
    extractPlatformBlock(path, platformCheck, sourceCode) {
        const implementations = [];
        let fallback;
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
            }
            else {
                // Simple else block
                fallback = this.extractCodeBlock(path.node.alternate, sourceCode);
            }
        }
        if (implementations.length === 0) {
            return null;
        }
        const metadata = {
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
            this.warnings.push(`Platform-specific code at line ${path.node.loc?.start.line} has no fallback`);
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
    extractTernaryPlatformBlock(path, platformCheck, sourceCode) {
        const implementations = [];
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
    extractCodeBlock(statement, sourceCode) {
        if (!statement.loc) {
            return undefined;
        }
        const source = sourceCode.slice(statement.start, statement.end);
        return {
            source: source.trim(),
            language: 'typescript',
        };
    }
    /**
     * Extract code from expression
     */
    extractExpressionCode(expression, sourceCode) {
        if (!expression.loc) {
            return undefined;
        }
        const source = sourceCode.slice(expression.start, expression.end);
        return {
            source: source.trim(),
            language: 'typescript',
        };
    }
    /**
     * Get platform types from platform check
     */
    getPlatformsFromCheck(check) {
        const platformMap = {
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
exports.ReactPlatformParser = ReactPlatformParser;
/**
 * Platform parser for Flutter/Dart code
 */
class DartPlatformParser {
    constructor(errorHandler) {
        this.platformCodeBlocks = [];
        this.warnings = [];
        this.blockIdCounter = 0;
        this.errorHandler = errorHandler || (0, error_handler_1.getErrorHandler)();
    }
    /**
     * Extract platform-specific code from Dart source
     */
    extractPlatformCode(dartSource) {
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
    findPlatformChecks(source) {
        const checks = [];
        // Regex patterns for platform checks
        const patterns = [
            { regex: /Platform\.isIOS/g, type: 'isIOS' },
            { regex: /Platform\.isAndroid/g, type: 'isAndroid' },
            { regex: /Platform\.isWeb/g, type: 'isWeb' },
            { regex: /Platform\.isMacOS/g, type: 'isMacOS' },
            { regex: /Platform\.isWindows/g, type: 'isWindows' },
            { regex: /Platform\.isLinux/g, type: 'isLinux' },
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
    extractDartPlatformBlock(check, source) {
        // Find the if statement containing this check
        const ifMatch = this.findIfStatement(source, check.start);
        if (!ifMatch) {
            return null;
        }
        const implementations = [];
        let fallback;
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
                    const nestedBlock = this.extractBlock(elseBlock, nestedCheck[0].start, nestedCheck[0].end);
                    if (nestedBlock) {
                        implementations.push({
                            platforms: [this.getPlatformType(nestedCheck[0].type)],
                            code: {
                                source: nestedBlock,
                                language: 'dart',
                            },
                        });
                    }
                }
                else {
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
        const metadata = {
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
    findIfStatement(source, checkPosition) {
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
            }
            else if (source[i] === '}') {
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
        let alternateStart;
        let alternateEnd;
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
                    }
                    else if (source[i] === '}') {
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
    extractBlock(source, start, end) {
        if (start < 0 || end < 0 || start >= end) {
            return null;
        }
        return source.substring(start, end).trim();
    }
    /**
     * Convert platform check type to platform type
     */
    getPlatformType(checkType) {
        const map = {
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
exports.DartPlatformParser = DartPlatformParser;
