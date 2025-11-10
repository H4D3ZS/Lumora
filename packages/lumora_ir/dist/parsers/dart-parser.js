"use strict";
/**
 * Dart/Flutter Parser
 * Parses Dart widgets and converts them to Lumora IR
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DartParser = void 0;
const ir_utils_1 = require("../utils/ir-utils");
const error_handler_1 = require("../errors/error-handler");
/**
 * Dart AST Parser
 * Converts Dart/Flutter code to Lumora IR
 */
class DartParser {
    constructor(config = {}) {
        this.sourceFile = '';
        this.sourceCode = '';
        this.config = {
            strictMode: false,
            ...config,
        };
        this.errorHandler = config.errorHandler || (0, error_handler_1.getErrorHandler)();
    }
    /**
     * Parse Dart/Flutter source code to Lumora IR
     */
    parse(source, filename) {
        this.sourceFile = filename;
        this.sourceCode = source;
        try {
            const widgets = this.extractWidgets(source);
            const nodes = widgets.map(w => this.convertWidget(w));
            return (0, ir_utils_1.createIR)({
                sourceFramework: 'flutter',
                sourceFile: filename,
                generatedAt: Date.now(),
            }, nodes);
        }
        catch (error) {
            this.errorHandler.handleParseError({
                filePath: filename,
                errorMessage: error.message,
                sourceCode: source,
                framework: 'flutter',
            });
            throw error;
        }
    }
    /**
     * Extract all widget definitions from source code
     */
    extractWidgets(source) {
        const widgets = [];
        // Find StatelessWidget classes
        const statelessWidgets = this.findStatelessWidgets(source);
        widgets.push(...statelessWidgets);
        // Find StatefulWidget classes
        const statefulWidgets = this.findStatefulWidgets(source);
        widgets.push(...statefulWidgets);
        return widgets;
    }
    /**
     * Find StatelessWidget classes in source code
     */
    findStatelessWidgets(source) {
        const widgets = [];
        // Pattern to match StatelessWidget class declarations (just the start)
        const classPattern = /class\s+(\w+)\s+extends\s+StatelessWidget\s*\{/g;
        let match;
        while ((match = classPattern.exec(source)) !== null) {
            const className = match[1];
            const lineNumber = this.getLineNumber(source, match.index);
            const classStartIndex = match.index + match[0].length;
            try {
                // Extract full class body by matching braces
                const classBody = this.extractMethodBody(source, classStartIndex);
                const properties = this.extractProperties(classBody);
                const buildMethod = this.extractBuildMethod(classBody);
                widgets.push({
                    name: className,
                    type: 'StatelessWidget',
                    properties,
                    buildMethod,
                    lineNumber,
                });
            }
            catch (error) {
                this.errorHandler.handleParseError({
                    filePath: this.sourceFile,
                    line: lineNumber,
                    errorMessage: `Failed to parse StatelessWidget ${className}: ${error}`,
                    sourceCode: this.sourceCode,
                    framework: 'flutter',
                });
            }
        }
        return widgets;
    }
    /**
     * Find StatefulWidget classes in source code
     */
    findStatefulWidgets(source) {
        const widgets = [];
        // Pattern to match StatefulWidget class declarations (just the start)
        const classPattern = /class\s+(\w+)\s+extends\s+StatefulWidget\s*\{/g;
        let match;
        while ((match = classPattern.exec(source)) !== null) {
            const className = match[1];
            const lineNumber = this.getLineNumber(source, match.index);
            const classStartIndex = match.index + match[0].length;
            try {
                // Extract full class body by matching braces
                const classBody = this.extractMethodBody(source, classStartIndex);
                const properties = this.extractProperties(classBody);
                // Find corresponding State class
                const stateClassName = `_${className}State`;
                const stateClass = this.findStateClass(source, stateClassName);
                widgets.push({
                    name: className,
                    type: 'StatefulWidget',
                    properties,
                    buildMethod: stateClass?.buildMethod || '',
                    stateClass: stateClass ? {
                        name: stateClassName,
                        stateVariables: stateClass.stateVariables,
                        methods: stateClass.methods,
                    } : undefined,
                    lineNumber,
                });
            }
            catch (error) {
                this.errorHandler.handleParseError({
                    filePath: this.sourceFile,
                    line: lineNumber,
                    errorMessage: `Failed to parse StatefulWidget ${className}: ${error}`,
                    sourceCode: this.sourceCode,
                    framework: 'flutter',
                });
            }
        }
        return widgets;
    }
    /**
     * Find State class for StatefulWidget
     */
    findStateClass(source, stateClassName) {
        // Pattern to match State class (just the start)
        const statePattern = new RegExp(`class\\s+${stateClassName}\\s+extends\\s+State<\\w+>\\s*\\{`, '');
        const match = statePattern.exec(source);
        if (!match) {
            return null;
        }
        const classStartIndex = match.index + match[0].length;
        const classBody = this.extractMethodBody(source, classStartIndex);
        return {
            buildMethod: this.extractBuildMethod(classBody),
            stateVariables: this.extractStateVariables(classBody),
            methods: this.extractMethods(classBody),
        };
    }
    /**
     * Extract properties from class body
     */
    extractProperties(classBody) {
        const properties = [];
        // Pattern to match property declarations
        const propPattern = /(?:final\s+)?(\w+(?:<[^>]+>)?)\s+(\w+)\s*(?:=\s*([^;]+))?;/g;
        let match;
        while ((match = propPattern.exec(classBody)) !== null) {
            const type = match[1];
            const name = match[2];
            const defaultValue = match[3]?.trim();
            const isFinal = classBody.substring(Math.max(0, match.index - 10), match.index).includes('final');
            // Skip if it's inside a method
            if (this.isInsideMethod(classBody, match.index)) {
                continue;
            }
            properties.push({
                name,
                type,
                isRequired: false, // Will be determined from constructor
                isFinal,
                defaultValue,
            });
        }
        // Check constructor for required parameters
        this.updateRequiredProperties(classBody, properties);
        return properties;
    }
    /**
     * Update properties with required information from constructor
     */
    updateRequiredProperties(classBody, properties) {
        // Pattern to match constructor with named parameters
        const constructorPattern = /\w+\s*\(\s*\{([^}]+)\}\s*\)/s;
        const match = constructorPattern.exec(classBody);
        if (!match) {
            return;
        }
        const params = match[1];
        properties.forEach(prop => {
            // Check if required
            const requiredPattern = new RegExp(`required\\s+this\\.${prop.name}\\b`);
            if (requiredPattern.test(params)) {
                prop.isRequired = true;
            }
            // Extract default value from constructor if present
            // Pattern: this.propName = value
            const defaultPattern = new RegExp(`this\\.${prop.name}\\s*=\\s*([^,}\\n]+)`);
            const defaultMatch = defaultPattern.exec(params);
            if (defaultMatch) {
                prop.defaultValue = defaultMatch[1].trim();
            }
        });
    }
    /**
     * Extract build method from class body
     */
    extractBuildMethod(classBody) {
        // Pattern to match build method
        const buildPattern = /@override\s+Widget\s+build\s*\([^)]*\)\s*\{/;
        const match = buildPattern.exec(classBody);
        if (!match) {
            return '';
        }
        // Find the matching closing brace
        const startIndex = match.index + match[0].length;
        const methodBody = this.extractMethodBody(classBody, startIndex);
        return this.extractReturnStatement(methodBody);
    }
    /**
     * Extract method body by matching braces
     */
    extractMethodBody(text, startIndex) {
        let braceCount = 1;
        let endIndex = startIndex;
        while (braceCount > 0 && endIndex < text.length) {
            if (text[endIndex] === '{')
                braceCount++;
            if (text[endIndex] === '}')
                braceCount--;
            endIndex++;
        }
        return text.substring(startIndex, endIndex - 1);
    }
    /**
     * Extract return statement from build method
     */
    extractReturnStatement(methodBody) {
        const returnPattern = /return\s+([\s\S]+?);/;
        const match = returnPattern.exec(methodBody.trim());
        return match ? match[1].trim() : '';
    }
    /**
     * Extract state variables from State class body
     */
    extractStateVariables(classBody) {
        const variables = [];
        // Pattern to match state variable declarations
        const varPattern = /(late\s+)?(final\s+)?(\w+(?:<[^>]+>)?)\s+(\w+)\s*(?:=\s*([^;]+))?;/g;
        let match;
        while ((match = varPattern.exec(classBody)) !== null) {
            const isLate = !!match[1];
            const isFinal = !!match[2];
            const type = match[3];
            const name = match[4];
            const initialValue = match[5]?.trim();
            // Skip if it's inside a method
            if (this.isInsideMethod(classBody, match.index)) {
                continue;
            }
            variables.push({
                name,
                type,
                initialValue,
                isFinal,
                isLate,
            });
        }
        return variables;
    }
    /**
     * Extract methods from class body
     */
    extractMethods(classBody) {
        const methods = [];
        // Pattern to match method declarations (simplified)
        const methodPattern = /(\w+)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
        let match;
        while ((match = methodPattern.exec(classBody)) !== null) {
            const returnType = match[1];
            const name = match[2];
            const params = match[3];
            // Skip build method as it's handled separately
            if (name === 'build') {
                continue;
            }
            methods.push({
                name,
                returnType,
                parameters: this.parseParameters(params),
                body: '', // Body extraction would require more complex parsing
            });
        }
        return methods;
    }
    /**
     * Parse method parameters
     */
    parseParameters(paramsString) {
        if (!paramsString.trim()) {
            return [];
        }
        const parameters = [];
        // Simple parameter parsing (can be enhanced)
        const params = paramsString.split(',').map(p => p.trim());
        for (const param of params) {
            const match = /(\w+)\s+(\w+)/.exec(param);
            if (match) {
                parameters.push({
                    name: match[2],
                    type: match[1],
                    isRequired: param.includes('required'),
                    isNamed: false,
                });
            }
        }
        return parameters;
    }
    /**
     * Check if position is inside a method
     */
    isInsideMethod(text, position) {
        const beforeText = text.substring(0, position);
        const methodPattern = /\w+\s+\w+\s*\([^)]*\)\s*\{/g;
        let lastMethodStart = -1;
        let match;
        while ((match = methodPattern.exec(beforeText)) !== null) {
            lastMethodStart = match.index;
        }
        if (lastMethodStart === -1) {
            return false;
        }
        // Count braces to see if we're still inside the method
        const textSinceMethod = text.substring(lastMethodStart, position);
        let braceCount = 0;
        for (const char of textSinceMethod) {
            if (char === '{')
                braceCount++;
            if (char === '}')
                braceCount--;
        }
        return braceCount > 0;
    }
    /**
     * Get line number for a position in source code
     */
    getLineNumber(source, position) {
        return source.substring(0, position).split('\n').length;
    }
    /**
     * Convert widget to Lumora IR node
     */
    convertWidget(widget) {
        const node = (0, ir_utils_1.createNode)(widget.name, this.convertProperties(widget.properties), [], widget.lineNumber);
        // Add state if StatefulWidget
        if (widget.type === 'StatefulWidget' && widget.stateClass) {
            node.state = this.convertState(widget.stateClass);
        }
        // Parse build method to extract children
        if (widget.buildMethod) {
            node.children = this.parseWidgetTree(widget.buildMethod);
        }
        return node;
    }
    /**
     * Convert properties to props object
     */
    convertProperties(properties) {
        const props = {};
        properties.forEach(prop => {
            // Include properties with default values (from constructor or field declaration)
            if (prop.defaultValue) {
                props[prop.name] = this.parseValue(prop.defaultValue);
            }
        });
        return props;
    }
    /**
     * Convert state class to state definition
     */
    convertState(stateClass) {
        return {
            type: 'local',
            variables: stateClass.stateVariables.map(v => ({
                name: v.name,
                type: this.mapDartTypeToTS(v.type),
                initialValue: v.initialValue ? this.parseValue(v.initialValue) : undefined,
                mutable: !v.isFinal,
            })),
        };
    }
    /**
     * Parse widget tree from build method return statement
     */
    parseWidgetTree(widgetCode) {
        // This is a simplified parser - a full implementation would need
        // proper AST parsing or a more sophisticated approach
        const widgets = [];
        widgetCode = widgetCode.trim();
        // Extract widget type
        const widgetMatch = /^(\w+)\s*\(/.exec(widgetCode);
        if (!widgetMatch) {
            // Handle simple widget references without parentheses (e.g., variable names)
            // For now, return empty array
            return widgets;
        }
        const widgetType = widgetMatch[1];
        const props = this.extractWidgetProps(widgetCode);
        const children = this.extractWidgetChildren(widgetCode);
        // Special handling for Text widget - extract text from first parameter
        if (widgetType === 'Text' && !props.text) {
            const parenIndex = widgetCode.indexOf('(');
            if (parenIndex !== -1) {
                const paramsSection = this.extractParenthesesContent(widgetCode, parenIndex);
                const params = this.parseNamedParameters(paramsSection);
                // If no named parameters, first parameter is the text
                if (Object.keys(params).length === 0 || !params.child) {
                    // Extract first positional parameter
                    const firstParam = paramsSection.split(',')[0].trim();
                    if (firstParam && !firstParam.includes(':')) {
                        props.text = this.parseValue(firstParam);
                    }
                }
            }
        }
        widgets.push((0, ir_utils_1.createNode)(widgetType, props, children));
        return widgets;
    }
    /**
     * Extract widget properties from widget constructor
     */
    extractWidgetProps(widgetCode) {
        const props = {};
        // Find the opening parenthesis
        const parenIndex = widgetCode.indexOf('(');
        if (parenIndex === -1) {
            return props;
        }
        // Extract the parameters section
        const paramsSection = this.extractParenthesesContent(widgetCode, parenIndex);
        // Parse named parameters
        const params = this.parseNamedParameters(paramsSection);
        for (const [name, value] of Object.entries(params)) {
            // Skip 'child' and 'children' as they're handled separately
            if (name === 'child' || name === 'children') {
                continue;
            }
            props[name] = this.parseValue(value);
        }
        return props;
    }
    /**
     * Extract content within parentheses
     */
    extractParenthesesContent(text, startIndex) {
        let parenCount = 1;
        let endIndex = startIndex + 1;
        while (parenCount > 0 && endIndex < text.length) {
            if (text[endIndex] === '(')
                parenCount++;
            if (text[endIndex] === ')')
                parenCount--;
            endIndex++;
        }
        return text.substring(startIndex + 1, endIndex - 1);
    }
    /**
     * Parse named parameters from parameter string
     */
    parseNamedParameters(paramsString) {
        const params = {};
        let currentParam = '';
        let currentValue = '';
        let inValue = false;
        let depth = 0;
        for (let i = 0; i < paramsString.length; i++) {
            const char = paramsString[i];
            if (char === '(' || char === '[' || char === '{') {
                depth++;
            }
            else if (char === ')' || char === ']' || char === '}') {
                depth--;
            }
            if (char === ':' && depth === 0 && !inValue) {
                inValue = true;
                continue;
            }
            if (char === ',' && depth === 0) {
                if (currentParam && currentValue) {
                    params[currentParam.trim()] = currentValue.trim();
                }
                currentParam = '';
                currentValue = '';
                inValue = false;
                continue;
            }
            if (inValue) {
                currentValue += char;
            }
            else {
                currentParam += char;
            }
        }
        // Add last parameter
        if (currentParam && currentValue) {
            params[currentParam.trim()] = currentValue.trim();
        }
        return params;
    }
    /**
     * Extract child widgets
     */
    extractWidgetChildren(widgetCode) {
        const children = [];
        // Find the opening parenthesis
        const parenIndex = widgetCode.indexOf('(');
        if (parenIndex === -1) {
            return children;
        }
        // Extract the parameters section
        const paramsSection = this.extractParenthesesContent(widgetCode, parenIndex);
        const params = this.parseNamedParameters(paramsSection);
        // Look for child parameter
        if (params.child) {
            const childWidgets = this.parseWidgetTree(params.child);
            children.push(...childWidgets);
        }
        // Look for children parameter
        if (params.children) {
            // Remove brackets
            let childrenStr = params.children.trim();
            if (childrenStr.startsWith('[')) {
                childrenStr = childrenStr.substring(1, childrenStr.length - 1);
            }
            // Split by commas at depth 0
            const childrenList = this.splitAtDepth(childrenStr, ',');
            for (const child of childrenList) {
                const childWidgets = this.parseWidgetTree(child.trim());
                children.push(...childWidgets);
            }
        }
        return children;
    }
    /**
     * Split string by delimiter at depth 0
     */
    splitAtDepth(text, delimiter) {
        const parts = [];
        let current = '';
        let depth = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '(' || char === '[' || char === '{') {
                depth++;
            }
            else if (char === ')' || char === ']' || char === '}') {
                depth--;
            }
            if (char === delimiter && depth === 0) {
                if (current.trim()) {
                    parts.push(current.trim());
                }
                current = '';
            }
            else {
                current += char;
            }
        }
        if (current.trim()) {
            parts.push(current.trim());
        }
        return parts;
    }
    /**
     * Parse Dart value to JavaScript value
     */
    parseValue(value) {
        value = value.trim();
        // Boolean
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        // Null
        if (value === 'null')
            return null;
        // Number
        if (/^-?\d+(\.\d+)?$/.test(value)) {
            return parseFloat(value);
        }
        // String
        if (/^['"].*['"]$/.test(value)) {
            return value.slice(1, -1);
        }
        // Keep as string for complex expressions
        return value;
    }
    /**
     * Map Dart types to TypeScript types
     */
    mapDartTypeToTS(dartType) {
        const typeMap = {
            'int': 'number',
            'double': 'number',
            'num': 'number',
            'String': 'string',
            'bool': 'boolean',
            'List': 'array',
            'Map': 'object',
            'dynamic': 'any',
            'void': 'void',
        };
        // Handle generic types
        const genericMatch = /^(\w+)<(.+)>$/.exec(dartType);
        if (genericMatch) {
            const baseType = genericMatch[1];
            const genericType = genericMatch[2];
            if (baseType === 'List') {
                return `${this.mapDartTypeToTS(genericType)}[]`;
            }
            return typeMap[baseType] || dartType;
        }
        return typeMap[dartType] || dartType;
    }
}
exports.DartParser = DartParser;
