/**
 * Template Manager
 * Manages project templates for quick start
 */
export interface Template {
    id: string;
    name: string;
    description: string;
    category: 'basic' | 'navigation' | 'auth' | 'data' | 'ui' | 'advanced';
    features: string[];
    dependencies: Record<string, string>;
    files: TemplateFile[];
}
export interface TemplateFile {
    path: string;
    content: string;
}
/**
 * Template Manager
 */
export declare class TemplateManager {
    private templates;
    constructor();
    /**
     * Register default templates
     */
    private registerDefaultTemplates;
    /**
     * Get template by ID
     */
    getTemplate(id: string): Template | undefined;
    /**
     * List all templates
     */
    listTemplates(): Template[];
    /**
     * Create project from template
     */
    createFromTemplate(templateId: string, projectPath: string, projectName: string): Promise<void>;
    /**
     * Create package.json
     */
    private createPackageJson;
    /**
     * Create lumora.config.json
     */
    private createLumoraConfig;
    private createBlankTemplate;
    private createTabsTemplate;
    private createDrawerTemplate;
    private createAuthTemplate;
    private createCameraAppTemplate;
    private createTodoListTemplate;
    private createWeatherAppTemplate;
    private createSocialFeedTemplate;
    private createECommerceTemplate;
    private createChatAppTemplate;
    private createMusicPlayerTemplate;
    private createFitnessTrackerTemplate;
    private toPascalCase;
}
export declare function getTemplateManager(): TemplateManager;
//# sourceMappingURL=template-manager.d.ts.map