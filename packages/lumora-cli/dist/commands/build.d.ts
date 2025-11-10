/**
 * Lumora Build Command
 * Builds production Flutter app
 */
export interface BuildOptions {
    platform: 'android' | 'ios' | 'both';
    release: boolean;
}
export declare function buildCommand(options: BuildOptions): Promise<void>;
//# sourceMappingURL=build.d.ts.map