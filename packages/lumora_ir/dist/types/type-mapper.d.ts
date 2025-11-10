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
export declare class TypeMapper {
    private static instance;
    private readonly typeScriptToDartMap;
    private readonly dartToTypeScriptMap;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): TypeMapper;
    /**
     * Convert TypeScript type to Dart type
     * @param tsType - TypeScript type string
     * @returns Dart type string
     */
    typeScriptToDart(tsType: string): string;
    /**
     * Convert Dart type to TypeScript type
     * @param dartType - Dart type string
     * @returns TypeScript type string
     */
    dartToTypeScript(dartType: string): string;
    /**
     * Convert union type (TypeScript) to Dart equivalent
     * @param unionType - Union type string
     * @param targetLang - Target language
     * @returns Converted type string
     */
    private convertUnionType;
    /**
     * Convert generic type between languages
     * @param genericType - Generic type string
     * @param targetLang - Target language
     * @returns Converted generic type string
     */
    private convertGenericType;
    /**
     * Parse generic type into base type and type parameters
     * @param genericType - Generic type string
     * @returns Parsed generic type
     */
    private parseGenericType;
    /**
     * Parse type parameters from string
     * @param typeParamsStr - Type parameters string
     * @returns Array of type parameter strings
     */
    private parseTypeParameters;
    /**
     * Convert tuple type to Dart equivalent
     * @param tupleType - Tuple type string
     * @param targetLang - Target language
     * @returns Converted type string
     */
    private convertTupleType;
    /**
     * Convert Record type to Dart Map
     * @param recordType - Record type string
     * @param targetLang - Target language
     * @returns Converted type string
     */
    private convertRecordType;
    /**
     * Convert Dart Map type to TypeScript Record
     * @param mapType - Map type string
     * @returns TypeScript Record type string
     */
    private convertMapType;
    /**
     * Check if a type is nullable
     * @param type - Type string
     * @returns True if type is nullable
     */
    isNullable(type: string): boolean;
    /**
     * Make a type nullable
     * @param type - Type string
     * @param language - Target language
     * @returns Nullable type string
     */
    makeNullable(type: string, language: 'typescript' | 'dart'): string;
    /**
     * Make a type non-nullable
     * @param type - Type string
     * @returns Non-nullable type string
     */
    makeNonNullable(type: string): string;
    /**
     * Infer type from value
     * @param value - Value to infer type from
     * @param language - Target language
     * @returns Inferred type string
     */
    inferType(value: any, language: 'typescript' | 'dart'): string;
}
/**
 * Get singleton instance of TypeMapper
 */
export declare function getTypeMapper(): TypeMapper;
