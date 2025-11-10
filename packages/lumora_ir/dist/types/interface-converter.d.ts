/**
 * Interface-Converter - Converts interfaces/classes between TypeScript and Dart
 */
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
    name?: string;
    parameters: DartParameter[];
    documentation?: string;
}
/**
 * Interface-Converter class for converting interfaces and classes
 */
export declare class InterfaceConverter {
    private static instance;
    private typeMapper;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): InterfaceConverter;
    /**
     * Convert TypeScript interface to Dart class
     * @param tsInterface - TypeScript interface definition
     * @returns Dart class definition
     */
    typeScriptInterfaceToDartClass(tsInterface: TypeScriptInterface): DartClass;
    /**
     * Convert Dart class to TypeScript interface
     * @param dartClass - Dart class definition
     * @returns TypeScript interface definition
     */
    dartClassToTypeScriptInterface(dartClass: DartClass): TypeScriptInterface;
    /**
     * Generate TypeScript interface code
     * @param tsInterface - TypeScript interface definition
     * @returns TypeScript interface code string
     */
    generateTypeScriptInterface(tsInterface: TypeScriptInterface): string;
    /**
     * Generate Dart class code
     * @param dartClass - Dart class definition
     * @returns Dart class code string
     */
    generateDartClass(dartClass: DartClass): string;
    /**
     * Generate Dart constructor code
     * @param className - Class name
     * @param constructor - Constructor definition
     * @returns Constructor code string
     */
    private generateDartConstructor;
    /**
     * Format Dart parameters
     * @param parameters - Array of parameters
     * @returns Formatted parameter string
     */
    private formatDartParameters;
    /**
     * Format TypeScript documentation comment
     * @param doc - Documentation string
     * @returns Formatted JSDoc comment
     */
    private formatTypeScriptDoc;
    /**
     * Format Dart documentation comment
     * @param doc - Documentation string
     * @returns Formatted dartdoc comment
     */
    private formatDartDoc;
    /**
     * Indent text
     * @param text - Text to indent
     * @param level - Indentation level
     * @returns Indented text
     */
    private indent;
}
/**
 * Get singleton instance of InterfaceConverter
 */
export declare function getInterfaceConverter(): InterfaceConverter;
