/**
 * Type-Mapper - Converts types between TypeScript and Dart
 * Handles primitive types, nullable types, and generic type parameters
 */

export interface TypeMapping {
  typescript: string;
  dart: string;
}

export interface GenericType {
  baseType: string;
  typeParameters: string[];
}

/**
 * Type-Mapper class for bidirectional type conversion
 */
export class TypeMapper {
  private static instance: TypeMapper;

  // Primitive type mappings
  private readonly typeScriptToDartMap: Map<string, string> = new Map([
    ['string', 'String'],
    ['number', 'double'],
    ['int', 'int'],
    ['boolean', 'bool'],
    ['void', 'void'],
    ['null', 'null'],
    ['undefined', 'null'],
    ['any', 'dynamic'],
    ['unknown', 'dynamic'],
    ['never', 'Never'],
    ['object', 'Map<String, dynamic>'],
    ['Array', 'List'],
    ['Date', 'DateTime'],
    ['Promise', 'Future'],
    ['Function', 'Function'],
    ['Record', 'Map'],
  ]);

  private readonly dartToTypeScriptMap: Map<string, string> = new Map([
    ['String', 'string'],
    ['double', 'number'],
    ['int', 'number'],
    ['num', 'number'],
    ['bool', 'boolean'],
    ['void', 'void'],
    ['null', 'null'],
    ['dynamic', 'any'],
    ['Never', 'never'],
    ['Map', 'Record'],
    ['List', 'Array'],
    ['DateTime', 'Date'],
    ['Future', 'Promise'],
    ['Function', 'Function'],
  ]);

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): TypeMapper {
    if (!TypeMapper.instance) {
      TypeMapper.instance = new TypeMapper();
    }
    return TypeMapper.instance;
  }

  /**
   * Convert TypeScript type to Dart type
   * @param tsType - TypeScript type string
   * @returns Dart type string
   */
  public typeScriptToDart(tsType: string): string {
    // Handle nullable types (TypeScript optional)
    if (tsType.endsWith('?')) {
      const baseType = tsType.slice(0, -1);
      return `${this.typeScriptToDart(baseType)}?`;
    }

    // Handle union with null/undefined
    if (tsType.includes('|')) {
      return this.convertUnionType(tsType, 'dart');
    }

    // Handle array types
    if (tsType.endsWith('[]')) {
      const elementType = tsType.slice(0, -2);
      const dartElementType = this.typeScriptToDart(elementType);
      return `List<${dartElementType}>`;
    }

    // Handle generic types
    if (tsType.includes('<') && tsType.includes('>')) {
      return this.convertGenericType(tsType, 'dart');
    }

    // Handle tuple types
    if (tsType.startsWith('[') && tsType.endsWith(']')) {
      return this.convertTupleType(tsType, 'dart');
    }

    // Handle Record types
    if (tsType.startsWith('Record<')) {
      return this.convertRecordType(tsType, 'dart');
    }

    // Map primitive types
    const mapped = this.typeScriptToDartMap.get(tsType);
    if (mapped) {
      return mapped;
    }

    // If no mapping found, assume it's a custom type and keep as-is
    return tsType;
  }

  /**
   * Convert Dart type to TypeScript type
   * @param dartType - Dart type string
   * @returns TypeScript type string
   */
  public dartToTypeScript(dartType: string): string {
    // Handle nullable types (Dart nullable)
    if (dartType.endsWith('?')) {
      const baseType = dartType.slice(0, -1);
      return `${this.dartToTypeScript(baseType)} | null`;
    }

    // Handle generic types
    if (dartType.includes('<') && dartType.includes('>')) {
      return this.convertGenericType(dartType, 'typescript');
    }

    // Handle Map types
    if (dartType.startsWith('Map<')) {
      return this.convertMapType(dartType);
    }

    // Handle List types
    if (dartType.startsWith('List<')) {
      const match = dartType.match(/List<(.+)>/);
      if (match) {
        const elementType = match[1];
        const tsElementType = this.dartToTypeScript(elementType);
        return `${tsElementType}[]`;
      }
    }

    // Map primitive types
    const mapped = this.dartToTypeScriptMap.get(dartType);
    if (mapped) {
      return mapped;
    }

    // If no mapping found, assume it's a custom type and keep as-is
    return dartType;
  }

  /**
   * Convert union type (TypeScript) to Dart equivalent
   * @param unionType - Union type string
   * @param targetLang - Target language
   * @returns Converted type string
   */
  private convertUnionType(unionType: string, targetLang: 'dart' | 'typescript'): string {
    const types = unionType.split('|').map(t => t.trim());
    
    if (targetLang === 'dart') {
      // Check if it's a nullable union (T | null | undefined)
      const hasNull = types.some(t => t === 'null' || t === 'undefined');
      const nonNullTypes = types.filter(t => t !== 'null' && t !== 'undefined');
      
      if (hasNull && nonNullTypes.length === 1) {
        // Simple nullable type
        return `${this.typeScriptToDart(nonNullTypes[0])}?`;
      }
      
      // Dart doesn't have union types, use dynamic or Object
      return 'dynamic';
    }
    
    return unionType;
  }

  /**
   * Convert generic type between languages
   * @param genericType - Generic type string
   * @param targetLang - Target language
   * @returns Converted generic type string
   */
  private convertGenericType(genericType: string, targetLang: 'dart' | 'typescript'): string {
    const parsed = this.parseGenericType(genericType);
    
    if (targetLang === 'dart') {
      const baseType = this.typeScriptToDartMap.get(parsed.baseType) || parsed.baseType;
      const typeParams = parsed.typeParameters.map(tp => this.typeScriptToDart(tp));
      return `${baseType}<${typeParams.join(', ')}>`;
    } else {
      const baseType = this.dartToTypeScriptMap.get(parsed.baseType) || parsed.baseType;
      const typeParams = parsed.typeParameters.map(tp => this.dartToTypeScript(tp));
      
      // Handle special cases
      if (parsed.baseType === 'List') {
        return `${typeParams[0]}[]`;
      }
      if (parsed.baseType === 'Map') {
        return `Record<${typeParams.join(', ')}>`;
      }
      if (parsed.baseType === 'Future') {
        return `Promise<${typeParams[0]}>`;
      }
      
      return `${baseType}<${typeParams.join(', ')}>`;
    }
  }

  /**
   * Parse generic type into base type and type parameters
   * @param genericType - Generic type string
   * @returns Parsed generic type
   */
  private parseGenericType(genericType: string): GenericType {
    const match = genericType.match(/^([^<]+)<(.+)>$/);
    
    if (!match) {
      return {
        baseType: genericType,
        typeParameters: []
      };
    }
    
    const baseType = match[1].trim();
    const typeParamsStr = match[2];
    
    // Parse type parameters (handle nested generics)
    const typeParameters = this.parseTypeParameters(typeParamsStr);
    
    return {
      baseType,
      typeParameters
    };
  }

  /**
   * Parse type parameters from string
   * @param typeParamsStr - Type parameters string
   * @returns Array of type parameter strings
   */
  private parseTypeParameters(typeParamsStr: string): string[] {
    const params: string[] = [];
    let current = '';
    let depth = 0;
    
    for (const char of typeParamsStr) {
      if (char === '<') {
        depth++;
        current += char;
      } else if (char === '>') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        params.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      params.push(current.trim());
    }
    
    return params;
  }

  /**
   * Convert tuple type to Dart equivalent
   * @param tupleType - Tuple type string
   * @param targetLang - Target language
   * @returns Converted type string
   */
  private convertTupleType(tupleType: string, targetLang: 'dart'): string {
    // Dart doesn't have tuple types, use List<dynamic> or create a custom class
    return 'List<dynamic>';
  }

  /**
   * Convert Record type to Dart Map
   * @param recordType - Record type string
   * @param targetLang - Target language
   * @returns Converted type string
   */
  private convertRecordType(recordType: string, targetLang: 'dart'): string {
    const match = recordType.match(/Record<(.+),\s*(.+)>/);
    if (match) {
      const keyType = this.typeScriptToDart(match[1].trim());
      const valueType = this.typeScriptToDart(match[2].trim());
      return `Map<${keyType}, ${valueType}>`;
    }
    return 'Map<String, dynamic>';
  }

  /**
   * Convert Dart Map type to TypeScript Record
   * @param mapType - Map type string
   * @returns TypeScript Record type string
   */
  private convertMapType(mapType: string): string {
    const match = mapType.match(/Map<(.+),\s*(.+)>/);
    if (match) {
      const keyType = this.dartToTypeScript(match[1].trim());
      const valueType = this.dartToTypeScript(match[2].trim());
      return `Record<${keyType}, ${valueType}>`;
    }
    return 'Record<string, any>';
  }

  /**
   * Check if a type is nullable
   * @param type - Type string
   * @returns True if type is nullable
   */
  public isNullable(type: string): boolean {
    return type.endsWith('?') || type.includes('| null') || type.includes('| undefined');
  }

  /**
   * Make a type nullable
   * @param type - Type string
   * @param language - Target language
   * @returns Nullable type string
   */
  public makeNullable(type: string, language: 'typescript' | 'dart'): string {
    if (this.isNullable(type)) {
      return type;
    }
    
    if (language === 'dart') {
      return `${type}?`;
    } else {
      return `${type} | null`;
    }
  }

  /**
   * Make a type non-nullable
   * @param type - Type string
   * @returns Non-nullable type string
   */
  public makeNonNullable(type: string): string {
    return type
      .replace(/\?$/, '')
      .replace(/\s*\|\s*null/g, '')
      .replace(/\s*\|\s*undefined/g, '');
  }

  /**
   * Infer type from value
   * @param value - Value to infer type from
   * @param language - Target language
   * @returns Inferred type string
   */
  public inferType(value: any, language: 'typescript' | 'dart'): string {
    if (value === null || value === undefined) {
      return language === 'dart' ? 'dynamic' : 'any';
    }
    
    const jsType = typeof value;
    
    if (jsType === 'string') {
      return language === 'dart' ? 'String' : 'string';
    }
    if (jsType === 'number') {
      return language === 'dart' ? 'double' : 'number';
    }
    if (jsType === 'boolean') {
      return language === 'dart' ? 'bool' : 'boolean';
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return language === 'dart' ? 'List<dynamic>' : 'any[]';
      }
      const elementType = this.inferType(value[0], language);
      return language === 'dart' ? `List<${elementType}>` : `${elementType}[]`;
    }
    if (jsType === 'object') {
      return language === 'dart' ? 'Map<String, dynamic>' : 'Record<string, any>';
    }
    
    return language === 'dart' ? 'dynamic' : 'any';
  }
}

/**
 * Get singleton instance of TypeMapper
 */
export function getTypeMapper(): TypeMapper {
  return TypeMapper.getInstance();
}
