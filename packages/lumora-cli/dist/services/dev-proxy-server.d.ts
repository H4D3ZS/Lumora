/**
 * Dev-Proxy Server
 * Manages WebSocket connections and schema broadcasting
 * Now integrates with HotReloadServer for protocol-compliant hot reload
 */
import { WebSocket } from 'ws';
import { HotReloadServer } from './hot-reload-server';
import { LumoraIR } from 'lumora-ir/src/types/ir-types';
export interface DevProxyConfig {
    port: number;
    enableQR: boolean;
    verbose?: boolean;
}
export interface Session {
    id: string;
    createdAt: number;
    clients: Set<WebSocket>;
}
export declare class DevProxyServer {
    private app;
    private server;
    private hotReloadServer;
    private sessions;
    private config;
    constructor(config: DevProxyConfig);
    private setupMiddleware;
    private setupRoutes;
    private setupWebSocket;
    start(): Promise<void>;
    stop(): Promise<void>;
    createSession(): Promise<Session>;
    /**
     * Get hot reload server instance
     */
    getHotReloadServer(): HotReloadServer | null;
    /**
     * Get local network IP address
     */
    private getNetworkIP;
    displayQRCode(sessionId: string): void;
    getPort(): number;
    getSessions(): Map<string, Session>;
    /**
     * Push schema update to session using hot reload protocol
     */
    pushSchemaUpdate(sessionId: string, schema: LumoraIR, preserveState?: boolean): {
        success: boolean;
        devicesUpdated: number;
        updateType: 'full' | 'incremental';
        error?: string;
    };
}
//# sourceMappingURL=dev-proxy-server.d.ts.map