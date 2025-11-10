/**
 * Lumora Start Command
 * Starts the complete development environment with automatic updates
 */
export interface StartOptions {
    port: string;
    mode: 'react' | 'flutter' | 'universal';
    qr: boolean;
    watch: boolean;
    codegen: boolean;
    webOnly: boolean;
}
export declare function startCommand(options: StartOptions): Promise<void>;
//# sourceMappingURL=start.d.ts.map