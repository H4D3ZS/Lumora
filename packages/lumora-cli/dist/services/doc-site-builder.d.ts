/**
 * Documentation Site Builder
 * Generates a static documentation website
 */
import { APIDoc } from './doc-generator';
export interface DocSiteConfig {
    outputDir: string;
    title?: string;
    description?: string;
    logo?: string;
    theme?: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    githubUrl?: string;
}
/**
 * Documentation Site Builder
 */
export declare class DocSiteBuilder {
    private config;
    constructor(config: DocSiteConfig);
    /**
     * Build the documentation site
     */
    buildSite(docs: APIDoc[]): Promise<void>;
    /**
     * Create directory structure
     */
    private createDirectoryStructure;
    /**
     * Generate home page
     */
    private generateHomePage;
    /**
     * Generate API documentation pages
     */
    private generateDocsPages;
    /**
     * Generate API index page
     */
    private generateAPIIndex;
    /**
     * Generate individual documentation page
     */
    private generateDocPage;
    /**
     * Generate search index
     */
    private generateSearchIndex;
    /**
     * Generate styles
     */
    private generateStyles;
    /**
     * Generate JavaScript
     */
    private generateScripts;
    /**
     * Wrap content in template
     */
    private wrapInTemplate;
    /**
     * Group docs by type
     */
    private groupByType;
    /**
     * Capitalize string
     */
    private capitalize;
    /**
     * Escape HTML
     */
    private escapeHtml;
}
//# sourceMappingURL=doc-site-builder.d.ts.map