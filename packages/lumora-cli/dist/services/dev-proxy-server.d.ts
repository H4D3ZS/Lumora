/**
 * Dev-Proxy Server
 * Manages WebSocket connections and schema broadcasting
 */
import { WebSocket } from 'ws';
export interface DevProxyConfig {
    port: number;
    enableQR: boolean;
}
export interface Session {
    id: string;
    createdAt: number;
    clients: Set<WebSocket>;
}
export declare class DevProxyServer {
    private app;
    private server;
    private wss;
    private sessions;
    private config;
    constructor(config: DevProxyConfig);
    private setupMiddleware;
    private setupRoutes;
    private setupWebSocket;
    private handleClientMessage;
    start(): Promise<void>;
    stop(): Promise<void>;
    createSession(): Promise<Session>;
    displayQRCode(sessionId: string): void;
    private generateSessionId;
    getPort(): number;
    getSessions(): Map<string, Session>;
}
//# sourceMappingURL=dev-proxy-server.d.ts.map