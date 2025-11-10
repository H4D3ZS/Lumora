/**
 * Documentation Converter
 * Handles conversion between JSDoc and dartdoc formats
 */
export interface DocComment {
    description: string;
    params: Array<{
        name: string;
        type?: string;
        description: string;
    }>;
    returns?: {
        type?: string;
        description: string;
    };
    examples: string[];
    tags: Array<{
        name: string;
        value: string;
    }>;
    inlineComments: Array<{
        line: number;
        text: string;
    }>;
}
/**
 * Parse JSDoc comment into structured format
 * @param jsdoc - JSDoc comment string (with or without comment markers)
 * @returns Parsed documentation structure
 */
export declare function parseJSDoc(jsdoc: string): DocComment;
/**
 * Convert JSDoc to dartdoc format
 * @param jsdoc - JSDoc comment string
 * @param sourceFramework - Source framework for code example conversion
 * @returns dartdoc formatted comment
 */
export declare function jsdocToDartdoc(jsdoc: string, sourceFramework?: 'react' | 'flutter'): string;
/**
 * Parse dartdoc comment into structured format
 * @param dartdoc - dartdoc comment string
 * @returns Parsed documentation structure
 */
export declare function parseDartdoc(dartdoc: string): DocComment;
/**
 * Convert dartdoc to JSDoc format
 * @param dartdoc - dartdoc comment string
 * @param sourceFramework - Source framework for code example conversion
 * @returns JSDoc formatted comment
 */
export declare function dartdocToJSDoc(dartdoc: string, sourceFramework?: 'react' | 'flutter'): string;
/**
 * Extract inline comments from source code
 * @param sourceCode - Source code string
 * @returns Array of inline comments with line numbers
 */
export declare function extractInlineComments(sourceCode: string): Array<{
    line: number;
    text: string;
    type: 'single' | 'block';
}>;
