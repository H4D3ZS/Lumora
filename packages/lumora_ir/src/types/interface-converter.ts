/**
 * Interface-Converter - Converts interfaces/classes between TypeScript and Dart
 */

import { TypeMapper, getTypeMapper } from './type-mapper';

export interface TypeScriptInterface {
  name: string;
  documentation?: string;
  properties: TypeScriptProperty[];
  methods?: TypeScriptMethod[];
  extends?: string[];
  typeParameters?: string[];
}

export interface TypeScriptProperty {
  name: string;
  type: string;
  optional?: boolean;
  readonly?: boolean;
  documentation?: string;
}

export interface TypeScriptMethod {
  name: string;
  parameters: TypeScriptParameter[];
  returnType: string;
  documentation?: string;
}

export interface TypeScriptParameter {
  name: string;
  type: string;
  optional?: boolean;
}

export interface DartClass {
  name: string;
  documentation?: string;
  properties: DartProperty[];
  methods?: DartMethod[];
  extends?: string;
  implements?: string[];
  typeParameters?: string[];
  constructors?: DartConstructor[];
}

export interface DartProperty {
  name: string;
  type: string;
  nullable?: boolean;
  final?: boolean;
  documentation?: string;
}

export interface DartMethod {
  name: string;
  parameters: DartParameter[];
  returnType: string;
  documentation?: string;
}

export interface DartParameter {
  name: string;
  type: string;
  required?: boolean;
  named?: boolean;
}

export interface DartConstructor {
  name?: string; // undefined for default constructor
  parameters: DartParameter[];
  documentation?: string;
}

/**
 * Interface-Converter class for converting interfaces and classes
 */
export class InterfaceConverter {
  private static instance: InterfaceConverter;
  private typeMapper: TypeMapper;

  private constructor() {
    this.typeMapper = getTypeMapper();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): InterfaceConverter {
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
  public typeScriptInterfaceToDartClass(tsInterface: TypeScriptInterface): DartClass {
    // Convert properties
    const properties: DartProperty[] = tsInterface.properties.map(prop => ({
      name: prop.name,
      type: this.typeMapper.typeScriptToDart(prop.type),
      nullable: prop.optional || this.typeMapper.isNullable(prop.type),
      final: prop.readonly,
      documentation: prop.documentation,
    }));

    // Convert methods
    const methods: DartMethod[] = (tsInterface.methods || []).map(method => ({
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
    const constructors: DartConstructor[] = [
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
    const typeParameters = tsInterface.typeParameters?.map(tp => 
      this.typeMapper.typeScriptToDart(tp)
    );

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
  public dartClassToTypeScriptInterface(dartClass: DartClass): TypeScriptInterface {
    // Convert properties
    const properties: TypeScriptProperty[] = dartClass.properties.map(prop => ({
      name: prop.name,
      type: this.typeMapper.dartToTypeScript(prop.type),
      optional: prop.nullable,
      readonly: prop.final,
      documentation: prop.documentation,
    }));

    // Convert methods
    const methods: TypeScriptMethod[] = (dartClass.methods || []).map(method => ({
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
    const typeParameters = dartClass.typeParameters?.map(tp => 
      this.typeMapper.dartToTypeScript(tp)
    );

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
  public generateTypeScriptInterface(tsInterface: TypeScriptInterface): string {
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
  public generateDartClass(dartClass: DartClass): string {
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
  private generateDartConstructor(className: string, constructor: DartConstructor): string {
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
    } else {
      code += `  ${constructorName}(${params});\n\n`;
    }

    return code;
  }

  /**
   * Format Dart parameters
   * @param parameters - Array of parameters
   * @returns Formatted parameter string
   */
  private formatDartParameters(parameters: DartParameter[]): string {
    const requiredParams = parameters.filter(p => !p.named);
    const namedParams = parameters.filter(p => p.named);

    let result = requiredParams.map(p => `${p.type} ${p.name}`).join(', ');

    if (namedParams.length > 0) {
      if (result) result += ', ';
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
  private formatTypeScriptDoc(doc: string): string {
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
  private formatDartDoc(doc: string): string {
    const lines = doc.split('\n');
    return lines.map(line => `/// ${line}`).join('\n') + '\n';
  }

  /**
   * Indent text
   * @param text - Text to indent
   * @param level - Indentation level
   * @returns Indented text
   */
  private indent(text: string, level: number): string {
    const indentation = '  '.repeat(level);
    return text.split('\n').map(line => line ? indentation + line : line).join('\n');
  }
}

/**
 * Get singleton instance of InterfaceConverter
 */
export function getInterfaceConverter(): InterfaceConverter {
  return InterfaceConverter.getInstance();
}
