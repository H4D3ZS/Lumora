"use strict";
/**
 * Base State Adapter Interface
 * Defines the contract for state management adapters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseStateAdapter = void 0;
/**
 * Abstract base adapter with common utilities
 */
class BaseStateAdapter {
    /**
     * Map TypeScript type to Flutter/Dart type
     */
    mapTypeToFlutter(tsType) {
        const typeMap = {
            'string': 'String',
            'number': 'double',
            'boolean': 'bool',
            'any': 'dynamic',
            'void': 'void',
            'null': 'Null',
            'undefined': 'Null',
            'object': 'Map<String, dynamic>',
            'array': 'List<dynamic>',
            'function': 'Function',
            'ref': 'dynamic',
        };
        // Handle array types: string[] -> List<String>
        if (tsType.endsWith('[]')) {
            const elementType = tsType.slice(0, -2);
            return `List<${this.mapTypeToFlutter(elementType)}>`;
        }
        // Handle generic types: Array<string> -> List<String>
        const genericMatch = tsType.match(/^(\w+)<(.+)>$/);
        if (genericMatch) {
            const [, container, inner] = genericMatch;
            if (container === 'Array') {
                return `List<${this.mapTypeToFlutter(inner)}>`;
            }
            return `${container}<${this.mapTypeToFlutter(inner)}>`;
        }
        return typeMap[tsType] || tsType;
    }
    /**
     * Format initial value for Flutter with type awareness
     */
    formatInitialValue(value, type) {
        if (value === undefined || value === null) {
            // Return default values based on type
            if (type === 'string')
                return "''";
            if (type === 'number')
                return '0';
            if (type === 'boolean')
                return 'false';
            if (type.includes('List') || type.includes('array'))
                return '[]';
            if (type.includes('Map') || type.includes('object'))
                return '{}';
            return 'null';
        }
        if (typeof value === 'string') {
            return `'${value.replace(/'/g, "\\'")}'`;
        }
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        if (typeof value === 'number') {
            return String(value);
        }
        if (Array.isArray(value)) {
            const elements = value.map(v => this.formatInitialValue(v, typeof v)).join(', ');
            return `[${elements}]`;
        }
        if (typeof value === 'object') {
            const entries = Object.entries(value)
                .map(([k, v]) => `'${k}': ${this.formatInitialValue(v, typeof v)}`)
                .join(', ');
            return `{${entries}}`;
        }
        return String(value);
    }
    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    /**
     * Uncapitalize first letter
     */
    uncapitalize(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }
    /**
     * Generate state variable declarations
     */
    generateStateVariables(variables, isFinal = true) {
        return variables
            .map(v => {
            const type = this.mapTypeToFlutter(v.type);
            const finalKeyword = isFinal ? 'final ' : '';
            return `  ${finalKeyword}${type} ${v.name};`;
        })
            .join('\n');
    }
    /**
     * Generate constructor parameters
     */
    generateConstructorParams(variables) {
        return variables
            .map(v => `required this.${v.name}`)
            .join(', ');
    }
    /**
     * Generate copyWith method parameters
     */
    generateCopyWithParams(variables) {
        return variables
            .map(v => `    ${this.mapTypeToFlutter(v.type)}? ${v.name},`)
            .join('\n');
    }
    /**
     * Generate copyWith method body
     */
    generateCopyWithBody(variables, className) {
        return `    return ${className}(
${variables.map(v => `      ${v.name}: ${v.name} ?? this.${v.name},`).join('\n')}
    );`;
    }
    /**
     * Generate initial state
     */
    generateInitialState(variables, className) {
        return `${className}(
${variables.map(v => `      ${v.name}: ${this.formatInitialValue(v.initialValue, v.type)},`).join('\n')}
    )`;
    }
}
exports.BaseStateAdapter = BaseStateAdapter;
