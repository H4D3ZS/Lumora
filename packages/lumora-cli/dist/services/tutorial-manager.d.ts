/**
 * Tutorial Manager
 * Interactive tutorials for learning Lumora
 */
export interface TutorialStep {
    title: string;
    description: string;
    code?: string;
    codeFile?: string;
    command?: string;
    explanation?: string;
    tips?: string[];
    checkCondition?: () => Promise<boolean> | boolean;
}
export interface Tutorial {
    id: string;
    title: string;
    description: string;
    category: 'getting-started' | 'intermediate' | 'advanced';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    prerequisites: string[];
    steps: TutorialStep[];
    completion?: {
        message: string;
        nextSteps: string[];
    };
}
/**
 * Tutorial Manager
 */
export declare class TutorialManager {
    private tutorials;
    private currentStep;
    private currentTutorial;
    constructor();
    /**
     * Register default tutorials
     */
    private registerDefaultTutorials;
    /**
     * List all tutorials
     */
    listTutorials(category?: string): Tutorial[];
    /**
     * Get tutorial by ID
     */
    getTutorial(id: string): Tutorial | undefined;
    /**
     * Start a tutorial
     */
    startTutorial(tutorialId: string): Promise<void>;
    /**
     * Run the tutorial
     */
    private runTutorial;
    /**
     * Display a tutorial step
     */
    private displayStep;
    /**
     * Display completion message
     */
    private displayCompletion;
    /**
     * Create Getting Started tutorial
     */
    private createGettingStartedTutorial;
    /**
     * Create First App tutorial
     */
    private createFirstAppTutorial;
    /**
     * Create OTA Updates tutorial
     */
    private createOTAUpdatesTutorial;
    /**
     * Create Native Modules tutorial
     */
    private createNativeModulesTutorial;
    /**
     * Create State Management tutorial
     */
    private createStateManagementTutorial;
    /**
     * Create Building for Production tutorial
     */
    private createBuildingProductionTutorial;
}
//# sourceMappingURL=tutorial-manager.d.ts.map