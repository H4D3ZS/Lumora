"use strict";
/**
 * Documentation Converter
 * Handles conversion between JSDoc and dartdoc formats
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJSDoc = parseJSDoc;
exports.jsdocToDartdoc = jsdocToDartdoc;
exports.parseDartdoc = parseDartdoc;
exports.dartdocToJSDoc = dartdocToJSDoc;
exports.extractInlineComments = extractInlineComments;
/**
 * Parse JSDoc comment into structured format
 * @param jsdoc - JSDoc comment string (with or without comment markers)
 * @returns Parsed documentation structure
 */
function parseJSDoc(jsdoc) {
    // Remove comment markers (/** */ or //)
    let cleaned = jsdoc.trim();
    cleaned = cleaned.replace(/^\/\*\*\s*/, '').replace(/\s*\*\/$/, '');
    cleaned = cleaned.replace(/^\s*\*\s?/gm, '');
    const doc = {
        description: '',
        params: [],
        examples: [],
        tags: [],
        inlineComments: []
    };
    const lines = cleaned.split('\n');
    let currentSection = 'description';
    let descriptionLines = [];
    let exampleLines = [];
    for (const line of lines) {
        const trimmed = line.trim();
        // Parse @param tags
        const paramMatch = trimmed.match(/^@param\s+(?:\{([^}]+)\}\s+)?(\w+)\s*-?\s*(.*)$/);
        if (paramMatch) {
            doc.params.push({
                name: paramMatch[2],
                type: paramMatch[1],
                description: paramMatch[3]
            });
            currentSection = null;
            continue;
        }
        // Parse @returns or @return tags
        const returnsMatch = trimmed.match(/^@returns?\s+(?:\{([^}]+)\}\s+)?(.*)$/);
        if (returnsMatch) {
            doc.returns = {
                type: returnsMatch[1],
                description: returnsMatch[2]
            };
            currentSection = null;
            continue;
        }
        // Parse @example tags
        if (trimmed.match(/^@example/)) {
            currentSection = 'example';
            continue;
        }
        // Parse other tags
        const tagMatch = trimmed.match(/^@(\w+)\s+(.*)$/);
        if (tagMatch) {
            doc.tags.push({
                name: tagMatch[1],
                value: tagMatch[2]
            });
            currentSection = null;
            continue;
        }
        // Accumulate content based on current section
        if (currentSection === 'description' && trimmed) {
            descriptionLines.push(trimmed);
        }
        else if (currentSection === 'example') {
            exampleLines.push(line); // Keep original indentation for examples
        }
    }
    doc.description = descriptionLines.join('\n');
    if (exampleLines.length > 0) {
        doc.examples.push(exampleLines.join('\n'));
    }
    return doc;
}
/**
 * Convert JSDoc to dartdoc format
 * @param jsdoc - JSDoc comment string
 * @param sourceFramework - Source framework for code example conversion
 * @returns dartdoc formatted comment
 */
function jsdocToDartdoc(jsdoc, sourceFramework = 'react') {
    const doc = parseJSDoc(jsdoc);
    const lines = [];
    // Add description
    if (doc.description) {
        lines.push(...doc.description.split('\n'));
        lines.push('');
    }
    // Add parameters
    if (doc.params.length > 0) {
        for (const param of doc.params) {
            let paramLine = `[${param.name}]`;
            if (param.description) {
                paramLine += ` ${param.description}`;
            }
            if (param.type) {
                paramLine += ` (${convertTypeJSToDart(param.type)})`;
            }
            lines.push(paramLine);
        }
        lines.push('');
    }
    // Add returns
    if (doc.returns) {
        let returnsLine = 'Returns';
        if (doc.returns.type) {
            const dartType = convertTypeJSToDart(doc.returns.type);
            returnsLine += ` ${dartType}`;
        }
        if (doc.returns.description) {
            returnsLine += `: ${doc.returns.description}`;
        }
        lines.push(returnsLine);
        lines.push('');
    }
    // Add examples
    if (doc.examples.length > 0) {
        for (const example of doc.examples) {
            lines.push('Example:');
            lines.push('```dart');
            // Convert code examples if from React
            const convertedExample = sourceFramework === 'react'
                ? convertReactCodeToDart(example)
                : example;
            // Split by lines and add each line
            for (const exampleLine of convertedExample.split('\n')) {
                lines.push(exampleLine);
            }
            lines.push('```');
            lines.push('');
        }
    }
    // Add other tags as dartdoc equivalents
    for (const tag of doc.tags) {
        if (tag.name === 'deprecated') {
            lines.push(`@Deprecated('${tag.value}')`);
        }
        else if (tag.name === 'see') {
            lines.push(`See also: ${tag.value}`);
        }
        else {
            lines.push(`${tag.name}: ${tag.value}`);
        }
    }
    // Format as dartdoc comment
    return lines.map(line => `/// ${line}`.trimEnd()).join('\n');
}
/**
 * Parse dartdoc comment into structured format
 * @param dartdoc - dartdoc comment string
 * @returns Parsed documentation structure
 */
function parseDartdoc(dartdoc) {
    // Remove comment markers (///)
    let cleaned = dartdoc.trim();
    cleaned = cleaned.replace(/^\/\/\/\s?/gm, '');
    const doc = {
        description: '',
        params: [],
        examples: [],
        tags: [],
        inlineComments: []
    };
    const lines = cleaned.split('\n');
    let currentSection = 'description';
    let descriptionLines = [];
    let exampleLines = [];
    let inExample = false;
    for (const line of lines) {
        const trimmed = line.trim();
        // Parse parameter documentation [paramName] description
        const paramMatch = trimmed.match(/^\[(\w+)\]\s+(.+?)(?:\s+\(([^)]+)\))?$/);
        if (paramMatch) {
            doc.params.push({
                name: paramMatch[1],
                description: paramMatch[2],
                type: paramMatch[3]
            });
            currentSection = null;
            continue;
        }
        // Parse returns documentation
        // Matches: "Returns Type: description" or "Returns Type" or "Returns: description"
        const returnsMatch = trimmed.match(/^Returns\s+(?:([^:]+?)\s*:\s*)?(.*)$/);
        if (returnsMatch) {
            // If there's a colon, group 1 is the type and group 2 is the description
            // If no colon, group 2 might be the type or description
            let type = returnsMatch[1]?.trim();
            let description = returnsMatch[2]?.trim();
            // If no type was captured but description looks like a type (contains <, >, etc.)
            if (!type && description && !description.match(/^[a-z]/)) {
                type = description;
                description = '';
            }
            doc.returns = {
                type,
                description
            };
            currentSection = null;
            continue;
        }
        // Parse example blocks
        if (trimmed.match(/^Example:/)) {
            currentSection = 'example';
            continue;
        }
        if (trimmed === '```dart' || trimmed === '```') {
            inExample = !inExample;
            if (!inExample && exampleLines.length > 0) {
                doc.examples.push(exampleLines.join('\n'));
                exampleLines = [];
            }
            continue;
        }
        if (inExample) {
            exampleLines.push(line);
            continue;
        }
        // Parse @Deprecated annotation
        const deprecatedMatch = trimmed.match(/^@Deprecated\('([^']+)'\)$/);
        if (deprecatedMatch) {
            doc.tags.push({
                name: 'deprecated',
                value: deprecatedMatch[1]
            });
            continue;
        }
        // Parse "See also:" references
        const seeAlsoMatch = trimmed.match(/^See also:\s+(.+)$/);
        if (seeAlsoMatch) {
            doc.tags.push({
                name: 'see',
                value: seeAlsoMatch[1]
            });
            continue;
        }
        // Accumulate description
        if (currentSection === 'description' && trimmed) {
            descriptionLines.push(trimmed);
        }
    }
    doc.description = descriptionLines.join('\n');
    return doc;
}
/**
 * Convert dartdoc to JSDoc format
 * @param dartdoc - dartdoc comment string
 * @param sourceFramework - Source framework for code example conversion
 * @returns JSDoc formatted comment
 */
function dartdocToJSDoc(dartdoc, sourceFramework = 'flutter') {
    const doc = parseDartdoc(dartdoc);
    const lines = [];
    lines.push('/**');
    // Add description
    if (doc.description) {
        for (const line of doc.description.split('\n')) {
            lines.push(` * ${line}`);
        }
        lines.push(' *');
    }
    // Add parameters
    if (doc.params.length > 0) {
        for (const param of doc.params) {
            let paramLine = ` * @param`;
            if (param.type) {
                paramLine += ` {${convertTypeDartToJS(param.type)}}`;
            }
            paramLine += ` ${param.name}`;
            if (param.description) {
                paramLine += ` - ${param.description}`;
            }
            lines.push(paramLine);
        }
        lines.push(' *');
    }
    // Add returns
    if (doc.returns) {
        let returnsLine = ` * @returns`;
        if (doc.returns.type) {
            const jsType = convertTypeDartToJS(doc.returns.type);
            returnsLine += ` {${jsType}}`;
        }
        if (doc.returns.description) {
            returnsLine += ` ${doc.returns.description}`;
        }
        lines.push(returnsLine);
        lines.push(' *');
    }
    // Add examples
    if (doc.examples.length > 0) {
        for (const example of doc.examples) {
            lines.push(' * @example');
            // Convert code examples if from Flutter
            const convertedExample = sourceFramework === 'flutter'
                ? convertDartCodeToReact(example)
                : example;
            for (const exampleLine of convertedExample.split('\n')) {
                lines.push(` * ${exampleLine}`);
            }
            lines.push(' *');
        }
    }
    // Add other tags
    for (const tag of doc.tags) {
        if (tag.name === 'deprecated') {
            lines.push(` * @deprecated ${tag.value}`);
        }
        else if (tag.name === 'see') {
            lines.push(` * @see ${tag.value}`);
        }
        else {
            lines.push(` * @${tag.name} ${tag.value}`);
        }
    }
    // Remove trailing empty comment line if present
    if (lines[lines.length - 1] === ' *') {
        lines.pop();
    }
    lines.push(' */');
    return lines.join('\n');
}
/**
 * Convert TypeScript/JavaScript type to Dart type
 * @param jsType - JavaScript type string
 * @returns Dart type string
 */
function convertTypeJSToDart(jsType) {
    const typeMap = {
        'string': 'String',
        'number': 'num',
        'boolean': 'bool',
        'any': 'dynamic',
        'void': 'void',
        'null': 'null',
        'undefined': 'null',
        'object': 'Map<String, dynamic>',
        'array': 'List',
        'Array': 'List',
        'function': 'Function',
        'Function': 'Function',
        'Promise': 'Future'
    };
    // Handle array types: string[] -> List<String>
    const arrayMatch = jsType.match(/^(.+)\[\]$/);
    if (arrayMatch) {
        const innerType = convertTypeJSToDart(arrayMatch[1]);
        return `List<${innerType}>`;
    }
    // Handle generic types: Array<string> -> List<String>
    const genericMatch = jsType.match(/^(\w+)<(.+)>$/);
    if (genericMatch) {
        const baseType = convertTypeJSToDart(genericMatch[1]);
        const innerType = convertTypeJSToDart(genericMatch[2]);
        return `${baseType}<${innerType}>`;
    }
    // Handle union types: string | number -> dynamic (Dart doesn't have union types)
    if (jsType.includes('|')) {
        return 'dynamic';
    }
    return typeMap[jsType] || jsType;
}
/**
 * Convert Dart type to TypeScript/JavaScript type
 * @param dartType - Dart type string
 * @returns JavaScript type string
 */
function convertTypeDartToJS(dartType) {
    const typeMap = {
        'String': 'string',
        'int': 'number',
        'double': 'number',
        'num': 'number',
        'bool': 'boolean',
        'dynamic': 'any',
        'void': 'void',
        'null': 'null',
        'Map': 'object',
        'List': 'Array',
        'Function': 'Function',
        'Future': 'Promise'
    };
    // Handle Map types first: Map<String, dynamic> -> Record<string, any>
    const mapMatch = dartType.match(/^Map<([^,]+),\s*(.+)>$/);
    if (mapMatch) {
        const keyType = convertTypeDartToJS(mapMatch[1].trim());
        const valueType = convertTypeDartToJS(mapMatch[2].trim());
        return `Record<${keyType}, ${valueType}>`;
    }
    // Handle generic types: List<String> -> Array<string>, Future<Map<...>> -> Promise<Record<...>>
    const genericMatch = dartType.match(/^(\w+)<(.+)>$/);
    if (genericMatch) {
        const baseType = convertTypeDartToJS(genericMatch[1]);
        const innerType = convertTypeDartToJS(genericMatch[2]);
        return `${baseType}<${innerType}>`;
    }
    return typeMap[dartType] || dartType;
}
/**
 * Convert React code example to Dart
 * Basic conversion for code examples in documentation
 * @param reactCode - React code string
 * @returns Dart code string
 */
function convertReactCodeToDart(reactCode) {
    let dartCode = reactCode;
    // Convert const/let to var/final
    dartCode = dartCode.replace(/\bconst\s+/g, 'final ');
    dartCode = dartCode.replace(/\blet\s+/g, 'var ');
    // Convert arrow functions to Dart functions
    dartCode = dartCode.replace(/\(\s*\)\s*=>\s*/g, '() ');
    dartCode = dartCode.replace(/\(([^)]+)\)\s*=>\s*/g, '($1) ');
    // Convert console.log to print
    dartCode = dartCode.replace(/console\.log\(/g, 'print(');
    // Convert template literals to string interpolation
    dartCode = dartCode.replace(/`([^`]*)\$\{([^}]+)\}([^`]*)`/g, "'$1${$2}$3'");
    return dartCode;
}
/**
 * Convert Dart code example to React
 * Basic conversion for code examples in documentation
 * @param dartCode - Dart code string
 * @returns React code string
 */
function convertDartCodeToReact(dartCode) {
    let reactCode = dartCode;
    // Convert var/final to const/let
    reactCode = reactCode.replace(/\bfinal\s+/g, 'const ');
    reactCode = reactCode.replace(/\bvar\s+/g, 'let ');
    // Convert print to console.log
    reactCode = reactCode.replace(/\bprint\(/g, 'console.log(');
    // Convert string interpolation to template literals
    reactCode = reactCode.replace(/'([^']*)\$\{([^}]+)\}([^']*)'/g, '`$1${$2}$3`');
    reactCode = reactCode.replace(/"([^"]*)\$\{([^}]+)\}([^"]*)"/g, '`$1${$2}$3`');
    return reactCode;
}
/**
 * Extract inline comments from source code
 * @param sourceCode - Source code string
 * @returns Array of inline comments with line numbers
 */
function extractInlineComments(sourceCode) {
    const comments = [];
    const lines = sourceCode.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Extract single-line comments
        const singleLineMatch = line.match(/\/\/\s*(.*)$/);
        if (singleLineMatch) {
            comments.push({
                line: i + 1,
                text: singleLineMatch[1].trim(),
                type: 'single'
            });
        }
        // Extract block comments (simple detection)
        const blockCommentMatch = line.match(/\/\*\s*(.*?)\s*\*\//);
        if (blockCommentMatch) {
            comments.push({
                line: i + 1,
                text: blockCommentMatch[1].trim(),
                type: 'block'
            });
        }
    }
    return comments;
}
