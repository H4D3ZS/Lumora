/**
 * Web Preview Server
 * Serves React UI at localhost:3000 with live updates
 * Works alongside Dev-Proxy for mobile
 */
import { LumoraIR } from 'lumora-ir';
export interface WebPreviewServerConfig {
    port: number;
    mode: 'react' | 'flutter' | 'universal';
}
export declare class WebPreviewServer {
    private app;
    private config;
    private converter;
    private currentIR;
    private lastUpdate;
    constructor(config: WebPreviewServerConfig);
    private setupRoutes;
    private generatePreviewPage;
    updateIR(ir: LumoraIR): void;
    start(): Promise<void>;
}
//# sourceMappingURL=web-preview-server.d.ts.map