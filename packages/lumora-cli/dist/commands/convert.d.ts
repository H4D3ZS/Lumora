/**
 * Convert Command
 * Bidirectional conversion between React and Flutter
 */
interface ConvertOptions {
    to?: 'react' | 'flutter';
    output?: string;
    dryRun?: boolean;
    watch?: boolean;
}
/**
 * Convert command handler
 */
export declare function convertCommand(inputFile: string, options: ConvertOptions): Promise<void>;
/**
 * Batch convert command handler
 */
export declare function batchConvertCommand(pattern: string, options: ConvertOptions): Promise<void>;
export {};
//# sourceMappingURL=convert.d.ts.map