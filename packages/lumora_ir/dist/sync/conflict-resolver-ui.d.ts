import { ConflictRecord } from './conflict-detector';
/**
 * Resolution option types
 */
export declare enum ResolutionOption {
    USE_REACT = "use_react",
    USE_FLUTTER = "use_flutter",
    MANUAL_MERGE = "manual_merge",
    SKIP = "skip"
}
/**
 * Resolution choice
 */
export interface ResolutionChoice {
    option: ResolutionOption;
    conflict: ConflictRecord;
    timestamp: number;
}
/**
 * Diff view data
 */
export interface DiffViewData {
    conflict: ConflictRecord;
    reactContent: string;
    flutterContent: string;
    reactLines: string[];
    flutterLines: string[];
}
/**
 * Conflict Resolver UI
 * Provides UI components for conflict resolution across different platforms
 */
export declare class ConflictResolverUI {
    private rl?;
    /**
     * Build CLI interactive prompt
     */
    promptCLI(conflict: ConflictRecord): Promise<ResolutionChoice>;
    /**
     * Build web dashboard diff view data
     */
    buildWebDashboardDiffView(conflict: ConflictRecord): DiffViewData;
    /**
     * Build VS Code extension diff view data
     */
    buildVSCodeDiffView(conflict: ConflictRecord): {
        leftUri: string;
        rightUri: string;
        title: string;
        options: object;
    };
    /**
     * Format conflict for web dashboard JSON
     */
    formatForWebDashboard(conflict: ConflictRecord): object;
    /**
     * Format conflict for VS Code extension
     */
    formatForVSCode(conflict: ConflictRecord): object;
    /**
     * Show file preview in CLI
     */
    private showFilePreview;
    /**
     * Read file content
     */
    private readFileContent;
    /**
     * Prompt for user choice
     */
    private promptChoice;
    /**
     * Display side-by-side diff in CLI
     */
    displayCLIDiff(conflict: ConflictRecord): void;
    /**
     * Generate HTML diff view for web dashboard
     */
    generateHTMLDiff(conflict: ConflictRecord): string;
    /**
     * Generate HTML for lines with diff highlighting
     */
    private generateLineHTML;
    /**
     * Escape HTML special characters
     */
    private escapeHTML;
    /**
     * Close readline interface
     */
    close(): void;
}
