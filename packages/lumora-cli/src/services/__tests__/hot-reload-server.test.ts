/**
 * Hot Reload Server Tests
 */

import { HotReloadServer } from '../hot-reload-server';
import * as http from 'http';
import WebSocket from 'ws';
import { LumoraIR } from 'lumora-ir/src/types/ir-types';
import { createConnectMessage } from 'lumora-ir/src/protocol/protocol-serialization';
import { PROTOCOL_VERSION } from 'lumora-ir/src/protocol/hot-reload-protocol';

describe('HotReloadServer', () => {
  let server: http.Server;
  let hotReloadServer: HotReloadServer;
  let port: number;

  beforeEach((done) => {
    // Create HTTP server
    server = http.createServer();
    server.listen(0, () => {
      const address = server.address();
      port = typeof address === 'object' && address ? address.port : 0;

      // Create hot reload server
      hotReloadServer = new HotReloadServer({
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
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      ws.on('close', (code, reason) => {
        expect(code).toBe(4400);
        expect(reason.toString()).toContain('Session ID required');
        done();
      });
    });

    it('should reject connection with invalid session ID', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws?session=invalid`);

      ws.on('close', (code, reason) => {
        expect(code).toBe(4404);
        expect(reason.toString()).toContain('Session not found');
        done();
      });
    });

    it('should accept connection with valid session ID', (done) => {
      const session = hotReloadServer.createSession();
      const ws = new WebSocket(`ws://localhost:${port}/ws?session=${session.id}`);

      ws.on('open', () => {
        // Send connect message
        const connectMsg = createConnectMessage(
          session.id,
          'test-device-123',
          'ios',
          'Test Device'
        );

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
    it('should push full update to session', (done) => {
      const session = hotReloadServer.createSession();
      const ws = new WebSocket(`ws://localhost:${port}/ws?session=${session.id}`);

      const schema: LumoraIR = {
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
        const connectMsg = createConnectMessage(
          session.id,
          'test-device',
          'ios',
          'Test'
        );
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
        } else if (message.type === 'update' && connectedReceived) {
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
      const ws = new WebSocket(`ws://localhost:${port}/ws?session=${session.id}`);

      const schema1: LumoraIR = {
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

      const schema2: LumoraIR = {
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
        const connectMsg = createConnectMessage(
          session.id,
          'test-device',
          'ios',
          'Test'
        );
        ws.send(JSON.stringify(connectMsg));
      });

      let updateCount = 0;

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          // Push first update
          hotReloadServer.pushUpdate(session.id, schema1);
        } else if (message.type === 'update') {
          updateCount++;

          if (updateCount === 1) {
            // First update should be full
            expect(message.payload.type).toBe('full');

            // Push second update
            setTimeout(() => {
              hotReloadServer.pushUpdate(session.id, schema2);
            }, 100);
          } else if (updateCount === 2) {
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
      const ws = new WebSocket(`ws://localhost:${port}/ws?session=${session.id}`);

      ws.on('open', () => {
        const connectMsg = createConnectMessage(
          session.id,
          'test-device',
          'ios',
          'Test'
        );
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
      const ws = new WebSocket(`ws://localhost:${port}/ws?session=${session.id}`);

      ws.on('open', () => {
        const connectMsg = createConnectMessage(
          session.id,
          'test-device',
          'ios',
          'Test'
        );
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
            version: PROTOCOL_VERSION,
          };
          ws.send(JSON.stringify(pingMsg));
        } else if (message.type === 'pong' && connectedReceived) {
          expect(message.payload.serverTime).toBeDefined();

          ws.close();
          done();
        }
      });
    });

    it('should get session health status', (done) => {
      const session = hotReloadServer.createSession();
      const ws = new WebSocket(`ws://localhost:${port}/ws?session=${session.id}`);

      ws.on('open', () => {
        const connectMsg = createConnectMessage(
          session.id,
          'test-device',
          'ios',
          'Test'
        );
        ws.send(JSON.stringify(connectMsg));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          const health = hotReloadServer.getSessionHealth(session.id);

          expect(health).toBeDefined();
          expect(health!.sessionId).toBe(session.id);
          expect(health!.totalDevices).toBe(1);
          expect(health!.healthyDevices).toBe(1);
          expect(health!.devices[0].healthy).toBe(true);

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
