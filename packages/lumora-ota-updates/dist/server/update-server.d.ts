/**
 * Lumora OTA Update Server
 * Production-ready over-the-air update server with versioning, channels, and rollback
 */
export declare class LumoraUpdateServer {
    private app;
    private port;
    private manifests;
    private deployments;
    private projects;
    private updateHistory;
    private dataDir;
    constructor(port?: number, dataDir?: string);
    private initializeMiddleware;
    private initializeRoutes;
    private handleHealthCheck;
    private handleUpdateCheck;
    private handleGetManifest;
    private handlePublishUpdate;
    private handleListUpdates;
    private handleRollback;
    private handleGetStats;
    private handleCreateProject;
    private handleGetProject;
    private handleCreateDeployment;
    private handleListDeployments;
    private handleUpdateDeployment;
    private findBestUpdate;
    private generateChecksum;
    private calculateSize;
    private generateApiKey;
    private logUpdateHistory;
    private loadPersistedData;
    private persistData;
    start(): Promise<void>;
}
export declare function createUpdateServer(port?: number, dataDir?: string): LumoraUpdateServer;
export declare function getUpdateServer(): LumoraUpdateServer | null;
//# sourceMappingURL=update-server.d.ts.map