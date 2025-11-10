"use strict";
/**
 * Interface-Converter - Converts interfaces/classes between TypeScript and Dart
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceConverter = void 0;
exports.getInterfaceConverter = getInterfaceConverter;
const type_mapper_1 = require("./type-mapper");
/**
 * Interface-Converter class for converting interfaces and classes
 */
class InterfaceConverter {
    constructor() {
        this.typeMapper = (0, type_mapper_1.getTypeMapper)();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!InterfaceConverter.instance) {
            InterfaceConverter.instance = new InterfaceConverter();
        }
        return InterfaceConverter.instance;
    }
    /**
     * Convert TypeScript interface to Dart class
     * @param tsInterface - TypeScript interface definition
     * @returns Dart class definition
     */
    typeScriptInterfaceToDartClass(tsInterface) {
        // Convert properties
        const properties = tsInterface.properties.map(prop => ({
            name: prop.name,
            type: this.typeMapper.typeScriptToDart(prop.type),
            nullable: prop.optional || this.typeMapper.isNullable(prop.type),
            final: prop.readonly,
            documentation: prop.documentation,
        }));
        // Convert methods
        const methods = (tsInterface.methods || []).map(method => ({
            name: method.name,
            parameters: method.parameters.map(param => ({
                name: param.name,
                type: this.typeMapper.typeScriptToDart(param.type),
                required: !param.optional,
                named: false,
            })),
            returnType: this.typeMapper.typeScriptToDart(method.returnType),
            documentation: method.documentation,
        }));
        // Generate constructor
        const constructors = [
            {
                parameters: properties.map(prop => ({
                    name: prop.name,
                    type: prop.type,
                    required: !prop.nullable,
                    named: true,
                })),
                documentation: `Creates a new ${tsInterface.name} instance`,
            },
        ];
        // Convert extends to implements (TypeScript interfaces become Dart classes)
        const implementsInterfaces = tsInterface.extends;
        // Convert type parameters
        const typeParameters = tsInterface.typeParameters?.map(tp => this.typeMapper.typeScriptToDart(tp));
        return {
            name: tsInterface.name,
            documentation: tsInterface.documentation,
            properties,
            methods,
            implements: implementsInterfaces,
            typeParameters,
            constructors,
        };
    }
    /**
     * Convert Dart class to TypeScript interface
     * @param dartClass - Dart class definition
     * @returns TypeScript interface definition
     */
    dartClassToTypeScriptInterface(dartClass) {
        // Convert properties
        const properties = dartClass.properties.map(prop => ({
            name: prop.name,
            type: this.typeMapper.dartToTypeScript(prop.type),
            optional: prop.nullable,
            readonly: prop.final,
            documentation: prop.documentation,
        }));
        // Convert methods
        const methods = (dartClass.methods || []).map(method => ({
            name: method.name,
            parameters: method.parameters.map(param => ({
                name: param.name,
                type: this.typeMapper.dartToTypeScript(param.type),
                optional: !param.required,
            })),
            returnType: this.typeMapper.dartToTypeScript(method.returnType),
            documentation: method.documentation,
        }));
        // Convert implements to extends
        const extendsInterfaces = dartClass.implements;
        // Convert type parameters
        const typeParameters = dartClass.typeParameters?.map(tp => this.typeMapper.dartToTypeScript(tp));
        return {
            name: dartClass.name,
            documentation: dartClass.documentation,
            properties,
            methods,
            extends: extendsInterfaces,
            typeParameters,
        };
    }
    /**
     * Generate TypeScript interface code
     * @param tsInterface - TypeScript interface definition
     * @returns TypeScript interface code string
     */
    generateTypeScriptInterface(tsInterface) {
        let code = '';
        // Add documentation
        if (tsInterface.documentation) {
            code += this.formatTypeScriptDoc(tsInterface.documentation);
        }
        // Interface declaration
        code += `export interface ${tsInterface.name}`;
        // Add type parameters
        if (tsInterface.typeParameters && tsInterface.typeParameters.length > 0) {
            code += `<${tsInterface.typeParameters.join(', ')}>`;
        }
        // Add extends
        if (tsInterface.extends && tsInterface.extends.length > 0) {
            code += ` extends ${tsInterface.extends.join(', ')}`;
        }
        code += ' {\n';
        // Add properties
        for (const prop of tsInterface.properties) {
            if (prop.documentation) {
                code += this.indent(this.formatTypeScriptDoc(prop.documentation), 1);
            }
            const readonly = prop.readonly ? 'readonly ' : '';
            const optional = prop.optional ? '?' : '';
            code += `  ${readonly}${prop.name}${optional}: ${prop.type};\n`;
        }
        // Add methods
        if (tsInterface.methods && tsInterface.methods.length > 0) {
            code += '\n';
            for (const method of tsInterface.methods) {
                if (method.documentation) {
                    code += this.indent(this.formatTypeScriptDoc(method.documentation), 1);
                }
                const params = method.parameters
                    .map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`)
                    .join(', ');
                code += `  ${method.name}(${params}): ${method.returnType};\n`;
            }
        }
        code += '}\n';
        return code;
    }
    /**
     * Generate Dart class code
     * @param dartClass - Dart class definition
     * @returns Dart class code string
     */
    generateDartClass(dartClass) {
        let code = '';
        // Add documentation
        if (dartClass.documentation) {
            code += this.formatDartDoc(dartClass.documentation);
        }
        // Class declaration
        code += `class ${dartClass.name}`;
        // Add type parameters
        if (dartClass.typeParameters && dartClass.typeParameters.length > 0) {
            code += `<${dartClass.typeParameters.join(', ')}>`;
        }
        // Add extends
        if (dartClass.extends) {
            code += ` extends ${dartClass.extends}`;
        }
        // Add implements
        if (dartClass.implements && dartClass.implements.length > 0) {
            code += ` implements ${dartClass.implements.join(', ')}`;
        }
        code += ' {\n';
        // Add properties
        for (const prop of dartClass.properties) {
            if (prop.documentation) {
                code += this.indent(this.formatDartDoc(prop.documentation), 1);
            }
            const final = prop.final ? 'final ' : '';
            const nullable = prop.nullable ? '?' : '';
            code += `  ${final}${prop.type}${nullable} ${prop.name};\n`;
        }
        // Add constructors
        if (dartClass.constructors && dartClass.constructors.length > 0) {
            code += '\n';
            for (const constructor of dartClass.constructors) {
                code += this.generateDartConstructor(dartClass.name, constructor);
            }
        }
        // Add methods
        if (dartClass.methods && dartClass.methods.length > 0) {
            code += '\n';
            for (const method of dartClass.methods) {
                if (method.documentation) {
                    code += this.indent(this.formatDartDoc(method.documentation), 1);
                }
                const params = this.formatDartParameters(method.parameters);
                code += `  ${method.returnType} ${method.name}(${params}) {\n`;
                code += `    // TODO: Implement ${method.name}\n`;
                code += `    throw UnimplementedError();\n`;
                code += `  }\n\n`;
            }
        }
        code += '}\n';
        return code;
    }
    /**
     * Generate Dart constructor code
     * @param className - Class name
     * @param constructor - Constructor definition
     * @returns Constructor code string
     */
    generateDartConstructor(className, constructor) {
        let code = '';
        if (constructor.documentation) {
            code += this.indent(this.formatDartDoc(constructor.documentation), 1);
        }
        const constructorName = constructor.name ? `${className}.${constructor.name}` : className;
        const params = this.formatDartParameters(constructor.parameters);
        // Generate constructor with initializer list
        const requiredParams = constructor.parameters.filter(p => p.required && !p.named);
        const namedParams = constructor.parameters.filter(p => p.named);
        if (namedParams.length > 0) {
            code += `  ${constructorName}({\n`;
            for (const param of namedParams) {
                const required = param.required ? 'required ' : '';
                code += `    ${required}this.${param.name},\n`;
            }
            code += `  });\n\n`;
        }
        else {
            code += `  ${constructorName}(${params});\n\n`;
        }
        return code;
    }
    /**
     * Format Dart parameters
     * @param parameters - Array of parameters
     * @returns Formatted parameter string
     */
    formatDartParameters(parameters) {
        const requiredParams = parameters.filter(p => !p.named);
        const namedParams = parameters.filter(p => p.named);
        let result = requiredParams.map(p => `${p.type} ${p.name}`).join(', ');
        if (namedParams.length > 0) {
            if (result)
                result += ', ';
            result += '{';
            result += namedParams
                .map(p => {
                const required = p.required ? 'required ' : '';
                return `${required}${p.type} ${p.name}`;
            })
                .join(', ');
            result += '}';
        }
        return result;
    }
    /**
     * Format TypeScript documentation comment
     * @param doc - Documentation string
     * @returns Formatted JSDoc comment
     */
    formatTypeScriptDoc(doc) {
        const lines = doc.split('\n');
        if (lines.length === 1) {
            return `/** ${doc} */\n`;
        }
        let result = '/**\n';
        for (const line of lines) {
            result += ` * ${line}\n`;
        }
        result += ' */\n';
        return result;
    }
    /**
     * Format Dart documentation comment
     * @param doc - Documentation string
     * @returns Formatted dartdoc comment
     */
    formatDartDoc(doc) {
        const lines = doc.split('\n');
        return lines.map(line => `/// ${line}`).join('\n') + '\n';
    }
    /**
     * Indent text
     * @param text - Text to indent
     * @param level - Indentation level
     * @returns Indented text
     */
    indent(text, level) {
        const indentation = '  '.repeat(level);
        return text.split('\n').map(line => line ? indentation + line : line).join('\n');
    }
}
exports.InterfaceConverter = InterfaceConverter;
/**
 * Get singleton instance of InterfaceConverter
 */
function getInterfaceConverter() {
    return InterfaceConverter.getInstance();
}
