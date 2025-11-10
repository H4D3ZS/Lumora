"use strict";
/**
 * Naming Utilities
 * Helper functions for applying naming conventions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyFileNaming = applyFileNaming;
exports.applyIdentifierNaming = applyIdentifierNaming;
exports.applyComponentNaming = applyComponentNaming;
exports.generateFileName = generateFileName;
exports.generateClassName = generateClassName;
exports.generateIdentifierName = generateIdentifierName;
exports.convertNamingConvention = convertNamingConvention;
/**
 * Apply file naming convention from config
 */
function applyFileNaming(name, config) {
    return config.applyFileNamingConvention(name);
}
/**
 * Apply identifier naming convention from config
 */
function applyIdentifierNaming(name, config) {
    return config.applyIdentifierNamingConvention(name);
}
/**
 * Apply component naming convention from config
 */
function applyComponentNaming(name, config) {
    return config.applyComponentNamingConvention(name);
}
/**
 * Generate file name with proper extension and naming convention
 */
function generateFileName(baseName, extension, config) {
    const convertedName = config.applyFileNamingConvention(baseName);
    return `${convertedName}.${extension}`;
}
/**
 * Generate class/component name with proper naming convention
 */
function generateClassName(baseName, config) {
    return config.applyComponentNamingConvention(baseName);
}
/**
 * Generate variable/function name with proper naming convention
 */
function generateIdentifierName(baseName, config) {
    return config.applyIdentifierNamingConvention(baseName);
}
/**
 * Convert between different naming conventions
 */
function convertNamingConvention(name, from, to) {
    if (from === to)
        return name;
    // Parse the name into words based on the source convention
    let words = [];
    switch (from) {
        case 'snake_case':
            words = name.split('_');
            break;
        case 'kebab-case':
            words = name.split('-');
            break;
        case 'PascalCase':
        case 'camelCase':
            // Split on capital letters
            words = name.split(/(?=[A-Z])/).filter((w) => w.length > 0);
            break;
    }
    // Convert to target convention
    switch (to) {
        case 'snake_case':
            return words.map((w) => w.toLowerCase()).join('_');
        case 'kebab-case':
            return words.map((w) => w.toLowerCase()).join('-');
        case 'PascalCase':
            return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
        case 'camelCase':
            return words
                .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join('');
    }
}
