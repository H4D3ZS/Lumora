/**
 * Documentation Generator
 * Generates API documentation from TypeScript and Dart source files
 */
export interface DocConfig {
    projectPath: string;
    outputDir: string;
    title?: string;
    includePrivate?: boolean;
    format?: 'markdown' | 'html' | 'json';
}
export interface APIDoc {
    name: string;
    type: 'class' | 'function' | 'interface' | 'type' | 'enum';
    description?: string;
    signature?: string;
    parameters?: ParameterDoc[];
    returnType?: string;
    properties?: PropertyDoc[];
    methods?: MethodDoc[];
    examples?: string[];
    tags?: Record<string, string>;
}
export interface ParameterDoc {
    name: string;
    type: string;
    description?: string;
    optional?: boolean;
    defaultValue?: string;
}
export interface PropertyDoc {
    name: string;
    type: string;
    description?: string;
    readonly?: boolean;
    optional?: boolean;
}
export interface MethodDoc {
    name: string;
    description?: string;
    signature: string;
    parameters?: ParameterDoc[];
    returnType?: string;
    examples?: string[];
}
/**
 * Documentation Generator
 */
export declare class DocGenerator {
    private config;
    constructor(config: DocConfig);
    /**
     * Generate documentation for entire project
     */
    generateDocs(): Promise<void>;
    /**
     * Find source files
     */
    private findSourceFiles;
    /**
     * Extract documentation from TypeScript file
     */
    private extractDocsFromFile;
    /**
     * Extract class documentation
     */
    private extractClassDoc;
    /**
     * Extract interface documentation
     */
    private extractInterfaceDoc;
    /**
     * Extract function documentation
     */
    private extractFunctionDoc;
    /**
     * Extract type alias documentation
     */
    private extractTypeDoc;
    /**
     * Extract enum documentation
     */
    private extractEnumDoc;
    /**
     * Extract properties from class
     */
    private extractProperties;
    /**
     * Extract methods from class
     */
    private extractMethods;
    /**
     * Extract property documentation
     */
    private extractPropertyDoc;
    /**
     * Extract parameter documentation
     */
    private extractParameterDoc;
    /**
     * Get JSDoc comments
     */
    private getJSDoc;
    /**
     * Check if node is private
     */
    private isPrivate;
    /**
     * Generate Markdown documentation
     */
    private generateMarkdownDocs;
    /**
     * Generate Markdown for specific type
     */
    private generateMarkdownForType;
    /**
     * Generate HTML documentation
     */
    private generateHTMLDocs;
    /**
     * Generate HTML page
     */
    private generateHTMLPage;
    /**
     * Generate JSON documentation
     */
    private generateJSONDocs;
    /**
     * Generate index file
     */
    private generateIndex;
    /**
     * Group docs by type
     */
    private groupByType;
    /**
     * Escape HTML
     */
    private escapeHTML;
}
export declare function createDocGenerator(config: DocConfig): DocGenerator;
//# sourceMappingURL=doc-generator.d.ts.map