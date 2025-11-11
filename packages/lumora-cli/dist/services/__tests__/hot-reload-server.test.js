"use strict";
/**
 * Hot Reload Server Tests
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hot_reload_server_1 = require("../hot-reload-server");
const http = __importStar(require("http"));
const ws_1 = __importDefault(require("ws"));
const lumora_ir_1 = require("lumora-ir");
const lumora_ir_2 = require("lumora-ir");
describe('HotReloadServer', () => {
    let server;
    let hotReloadServer;
    let port;
    beforeEach((done) => {
        // Create HTTP server
        server = http.createServer();
        server.listen(0, () => {
            const address = server.address();
            port = typeof address === 'object' && address ? address.port : 0;
            // Create hot reload server
            hotReloadServer = new hot_reload_server_1.HotReloadServer({
                server,
                path: '/ws',
                verbose: false,
                heartbeatInterval: 1000,
                connectionTimeout: 2000,
            });
            done();
        });
    });
    afterEach((done) => {
        hotReloadServer.stop();
        server.close(() => {
            done();
        });
    });
    describe('Session Management', () => {
        it('should create a new session', () => {
            const session = hotReloadServer.createSession();
            expect(session).toBeDefined();
            expect(session.id).toBeDefined();
            expect(session.createdAt).toBeGreaterThan(0);
            expect(session.devices.size).toBe(0);
            expect(session.sequenceNumber).toBe(0);
        });
        it('should retrieve an existing session', () => {
            const session = hotReloadServer.createSession();
            const retrieved = hotReloadServer.getSession(session.id);
            expect(retrieved).toBe(session);
        });
        it('should delete a session', () => {
            const session = hotReloadServer.createSession();
            const deleted = hotReloadServer.deleteSession(session.id);
            expect(deleted).toBe(true);
            expect(hotReloadServer.getSession(session.id)).toBeUndefined();
        });
        it('should return false when deleting non-existent session', () => {
            const deleted = hotReloadServer.deleteSession('non-existent');
            expect(deleted).toBe(false);
        });
    });
    describe('WebSocket Connection', () => {
        it('should reject connection without session ID', (done) => {
            const ws = new ws_1.default(`ws://localhost:${port}/ws`);
            ws.on('close', (code, reason) => {
                expect(code).toBe(4400);
                expect(reason.toString()).toContain('Session ID required');
                done();
            });
        });
        it('should reject connection with invalid session ID', (done) => {
            const ws = new ws_1.default(`ws://localhost:${port}/ws?session=invalid`);
            ws.on('close', (code, reason) => {
                expect(code).toBe(4404);
                expect(reason.toString()).toContain('Session not found');
                done();
            });
        });
        it('should accept connection with valid session ID', (done) => {
            const session = hotReloadServer.createSession();
            const ws = new ws_1.default(`ws://localhost:${port}/ws?session=${session.id}`);
            ws.on('open', () => {
                // Send connect message
                const connectMsg = (0, lumora_ir_1.createConnectMessage)(session.id, 'test-device-123', 'ios', 'Test Device');
                ws.send(JSON.stringify(connectMsg));
            });
            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'connected') {
                    expect(message.sessionId).toBe(session.id);
                    expect(message.payload.connectionId).toBeDefined();
                    // Verify device was registered
                    const devices = hotReloadServer.getConnectedDevices(session.id);
                    expect(devices.length).toBe(1);
                    expect(devices[0].deviceId).toBe('test-device-123');
                    ws.close();
                    done();
                }
            });
        });
    });
    describe('Update Distribution', () => {
        it.skip('should push full update to session', (done) => {
            // TODO: Fix race condition - device registration timing issue
            const session = hotReloadServer.createSession();
            const ws = new ws_1.default(`ws://localhost:${port}/ws?session=${session.id}`);
            const schema = {
                version: '1.0',
                metadata: {
                    sourceFramework: 'react',
                    sourceFile: 'test.tsx',
                    generatedAt: Date.now(),
                },
                nodes: [
                    {
                        id: 'root',
                        type: 'View',
                        props: {},
                        children: [],
                        metadata: { lineNumber: 1 },
                    },
                ],
            };
            ws.on('open', () => {
                const connectMsg = (0, lumora_ir_1.createConnectMessage)(session.id, 'test-device', 'ios', 'Test');
                ws.send(JSON.stringify(connectMsg));
            });
            let connectedReceived = false;
            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'connected') {
                    connectedReceived = true;
                    // Push update
                    const result = hotReloadServer.pushUpdate(session.id, schema);
                    expect(result.success).toBe(true);
                    expect(result.devicesUpdated).toBe(1);
                    expect(result.updateType).toBe('full');
                }
                else if (message.type === 'update' && connectedReceived) {
                    expect(message.payload.type).toBe('full');
                    expect(message.payload.schema).toBeDefined();
                    expect(message.payload.sequenceNumber).toBe(1);
                    ws.close();
                    done();
                }
            });
        });
        it('should push incremental update when changes are small', (done) => {
            const session = hotReloadServer.createSession();
            const ws = new ws_1.default(`ws://localhost:${port}/ws?session=${session.id}`);
            const schema1 = {
                version: '1.0',
                metadata: {
                    sourceFramework: 'react',
                    sourceFile: 'test.tsx',
                    generatedAt: Date.now(),
                },
                nodes: [
                    {
                        id: 'root',
                        type: 'View',
                        props: {},
                        children: [],
                        metadata: { lineNumber: 1 },
                    },
                ],
            };
            const schema2 = {
                ...schema1,
                nodes: [
                    {
                        id: 'root',
                        type: 'View',
                        props: { backgroundColor: 'red' },
                        children: [],
                        metadata: { lineNumber: 1 },
                    },
                ],
            };
            ws.on('open', () => {
                const connectMsg = (0, lumora_ir_1.createConnectMessage)(session.id, 'test-device', 'ios', 'Test');
                ws.send(JSON.stringify(connectMsg));
            });
            let updateCount = 0;
            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'connected') {
                    // Push first update
                    hotReloadServer.pushUpdate(session.id, schema1);
                }
                else if (message.type === 'update') {
                    updateCount++;
                    if (updateCount === 1) {
                        // First update should be full
                        expect(message.payload.type).toBe('full');
                        // Push second update
                        setTimeout(() => {
                            hotReloadServer.pushUpdate(session.id, schema2);
                        }, 100);
                    }
                    else if (updateCount === 2) {
                        // Second update should be incremental
                        expect(message.payload.type).toBe('incremental');
                        expect(message.payload.delta).toBeDefined();
                        expect(message.payload.delta.modified.length).toBe(1);
                        ws.close();
                        done();
                    }
                }
            });
        });
    });
    describe('Connection Management', () => {
        it('should track connected devices', (done) => {
            const session = hotReloadServer.createSession();
            const ws = new ws_1.default(`ws://localhost:${port}/ws?session=${session.id}`);
            ws.on('open', () => {
                const connectMsg = (0, lumora_ir_1.createConnectMessage)(session.id, 'test-device', 'ios', 'Test');
                ws.send(JSON.stringify(connectMsg));
            });
            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'connected') {
                    const devices = hotReloadServer.getConnectedDevices(session.id);
                    expect(devices.length).toBe(1);
                    expect(devices[0].deviceId).toBe('test-device');
                    expect(devices[0].platform).toBe('ios');
                    ws.close();
                    done();
                }
            });
        });
        it('should handle ping-pong heartbeat', (done) => {
            const session = hotReloadServer.createSession();
            const ws = new ws_1.default(`ws://localhost:${port}/ws?session=${session.id}`);
            ws.on('open', () => {
                const connectMsg = (0, lumora_ir_1.createConnectMessage)(session.id, 'test-device', 'ios', 'Test');
                ws.send(JSON.stringify(connectMsg));
            });
            let connectedReceived = false;
            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'connected') {
                    connectedReceived = true;
                    // Send ping
                    const pingMsg = {
                        type: 'ping',
                        sessionId: session.id,
                        timestamp: Date.now(),
                        version: lumora_ir_2.PROTOCOL_VERSION,
                    };
                    ws.send(JSON.stringify(pingMsg));
                }
                else if (message.type === 'pong' && connectedReceived) {
                    expect(message.payload.serverTime).toBeDefined();
                    ws.close();
                    done();
                }
            });
        });
        it('should get session health status', (done) => {
            const session = hotReloadServer.createSession();
            const ws = new ws_1.default(`ws://localhost:${port}/ws?session=${session.id}`);
            ws.on('open', () => {
                const connectMsg = (0, lumora_ir_1.createConnectMessage)(session.id, 'test-device', 'ios', 'Test');
                ws.send(JSON.stringify(connectMsg));
            });
            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'connected') {
                    const health = hotReloadServer.getSessionHealth(session.id);
                    expect(health).toBeDefined();
                    expect(health.sessionId).toBe(session.id);
                    expect(health.totalDevices).toBe(1);
                    expect(health.healthyDevices).toBe(1);
                    expect(health.devices[0].healthy).toBe(true);
                    ws.close();
                    done();
                }
            });
        });
    });
    describe('Statistics', () => {
        it('should return server statistics', () => {
            const session1 = hotReloadServer.createSession();
            const session2 = hotReloadServer.createSession();
            const stats = hotReloadServer.getStats();
            expect(stats.sessions).toBe(2);
            expect(stats.totalDevices).toBe(0);
            expect(stats.sessionDetails.length).toBe(2);
            expect(stats.sessionDetails.find(s => s.id === session1.id)).toBeDefined();
            expect(stats.sessionDetails.find(s => s.id === session2.id)).toBeDefined();
        });
    });
});
//# sourceMappingURL=hot-reload-server.test.js.map