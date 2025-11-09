import { WebSocketBroker } from '../src/websocket-broker';
import { SessionManager } from '../src/session-manager';
import { WebSocketEnvelope, JoinPayload } from '../src/types';
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { AddressInfo } from 'net';

describe('WebSocketBroker', () => {
  let server: Server;
  let sessionManager: SessionManager;
  let broker: WebSocketBroker;
  let port: number;

  beforeEach((done) => {
    sessionManager = new SessionManager();
    server = new Server();
    
    server.listen(0, () => {
      port = (server.address() as AddressInfo).port;
      broker = new WebSocketBroker(server, sessionManager);
      done();
    });
  });

  afterEach((done) => {
    broker.shutdown();
    sessionManager.stopCleanup();
    server.close(() => done());
  });

  describe('WebSocket Connection and Join Flow', () => {
    test('accepts WebSocket connection', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('accepts valid join message', (done) => {
      const session = sessionManager.createSession();
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      ws.on('open', () => {
        const joinMessage: WebSocketEnvelope = {
          type: 'join',
          meta: {
            sessionId: session.sessionId,
            source: 'test-client',
            timestamp: Date.now(),
            version: '1.0.0'
          },
          payload: {
            sessionId: session.sessionId,
            token: session.token,
            clientType: 'device'
          } as JoinPayload
        };

        ws.send(JSON.stringify(joinMessage));
      });

      ws.on('message', (data: Buffer) => {
        const response = JSON.parse(data.toString()) as WebSocketEnvelope;
        
        if (response.type === 'join') {
          expect(response.payload.status).toBe('connected');
          expect(response.payload.clientId).toBeDefined();
          
          const clients = sessionManager.getSessionClients(session.sessionId);
          expect(clients).toHaveLength(1);
          expect(clients[0].clientType).toBe('device');
          
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('rejects join with invalid sessionId', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      ws.on('open', () => {
        const joinMessage: WebSocketEnvelope = {
          type: 'join',
          meta: {
            sessionId: 'invalid-session',
            source: 'test-client',
            timestamp: Date.now(),
            version: '1.0.0'
          },
          payload: {
            sessionId: 'invalid-session',
            token: 'invalid-token',
            clientType: 'device'
          } as JoinPayload
        };

        ws.send(JSON.stringify(joinMessage));
      });

      ws.on('close', (code: number, reason: Buffer) => {
        expect(code).toBe(4001);
        expect(reason.toString()).toContain('SESSION_NOT_FOUND');
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('rejects join with invalid token', (done) => {
      const session = sessionManager.createSession();
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      ws.on('open', () => {
        const joinMessage: WebSocketEnvelope = {
          type: 'join',
          meta: {
            sessionId: session.sessionId,
            source: 'test-client',
            timestamp: Date.now(),
            version: '1.0.0'
          },
          payload: {
            sessionId: session.sessionId,
            token: 'wrong-token',
            clientType: 'device'
          } as JoinPayload
        };

        ws.send(JSON.stringify(joinMessage));
      });

      ws.on('close', (code: number, reason: Buffer) => {
        expect(code).toBe(4001);
        expect(reason.toString()).toContain('Invalid token');
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('closes connection on join timeout', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      ws.on('close', (code: number, reason: Buffer) => {
        expect(code).toBe(4000);
        expect(reason.toString()).toContain('Join timeout');
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    }, 35000); // Timeout longer than 30s join timeout
  });

  describe('Message Broadcasting', () => {
    test('broadcasts message to all clients in session', (done) => {
      const session = sessionManager.createSession();
      const ws1 = new WebSocket(`ws://localhost:${port}/ws`);
      const ws2 = new WebSocket(`ws://localhost:${port}/ws`);
      
      let ws1Joined = false;
      let ws2Joined = false;
      let messageReceived = false;

      const joinMessage: WebSocketEnvelope = {
        type: 'join',
        meta: {
          sessionId: session.sessionId,
          source: 'test-client',
          timestamp: Date.now(),
          version: '1.0.0'
        },
        payload: {
          sessionId: session.sessionId,
          token: session.token,
          clientType: 'device'
        } as JoinPayload
      };

      ws1.on('open', () => {
        ws1.send(JSON.stringify(joinMessage));
      });

      ws2.on('open', () => {
        ws2.send(JSON.stringify(joinMessage));
      });

      ws1.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as WebSocketEnvelope;
        
        if (message.type === 'join') {
          ws1Joined = true;
          
          if (ws1Joined && ws2Joined) {
            // Send test message from ws1
            const testMessage: WebSocketEnvelope = {
              type: 'full_ui_schema',
              meta: {
                sessionId: session.sessionId,
                source: 'test',
                timestamp: Date.now(),
                version: '1.0.0'
              },
              payload: { test: 'data' }
            };
            
            ws1.send(JSON.stringify(testMessage));
          }
        } else if (message.type === 'full_ui_schema') {
          // ws1 should not receive its own broadcast
          messageReceived = true;
        }
      });

      ws2.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as WebSocketEnvelope;
        
        if (message.type === 'join') {
          ws2Joined = true;
          
          if (ws1Joined && ws2Joined) {
            // Send test message from ws1
            const testMessage: WebSocketEnvelope = {
              type: 'full_ui_schema',
              meta: {
                sessionId: session.sessionId,
                source: 'test',
                timestamp: Date.now(),
                version: '1.0.0'
              },
              payload: { test: 'data' }
            };
            
            ws1.send(JSON.stringify(testMessage));
          }
        } else if (message.type === 'full_ui_schema') {
          // ws2 should receive the broadcast
          expect(message.payload.test).toBe('data');
          ws1.close();
          ws2.close();
          done();
        }
      });
    }, 10000);

    test('isolates broadcasts between different sessions', (done) => {
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();
      
      const ws1 = new WebSocket(`ws://localhost:${port}/ws`);
      const ws2 = new WebSocket(`ws://localhost:${port}/ws`);
      
      let ws1Joined = false;
      let ws2Joined = false;
      let ws2ReceivedMessage = false;

      ws1.on('open', () => {
        const joinMessage: WebSocketEnvelope = {
          type: 'join',
          meta: {
            sessionId: session1.sessionId,
            source: 'test-client',
            timestamp: Date.now(),
            version: '1.0.0'
          },
          payload: {
            sessionId: session1.sessionId,
            token: session1.token,
            clientType: 'device'
          } as JoinPayload
        };
        ws1.send(JSON.stringify(joinMessage));
      });

      ws2.on('open', () => {
        const joinMessage: WebSocketEnvelope = {
          type: 'join',
          meta: {
            sessionId: session2.sessionId,
            source: 'test-client',
            timestamp: Date.now(),
            version: '1.0.0'
          },
          payload: {
            sessionId: session2.sessionId,
            token: session2.token,
            clientType: 'device'
          } as JoinPayload
        };
        ws2.send(JSON.stringify(joinMessage));
      });

      ws1.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as WebSocketEnvelope;
        
        if (message.type === 'join') {
          ws1Joined = true;
          
          if (ws1Joined && ws2Joined) {
            // Send message to session1
            const testMessage: WebSocketEnvelope = {
              type: 'full_ui_schema',
              meta: {
                sessionId: session1.sessionId,
                source: 'test',
                timestamp: Date.now(),
                version: '1.0.0'
              },
              payload: { session: 'session1' }
            };
            
            ws1.send(JSON.stringify(testMessage));
            
            // Wait a bit to ensure ws2 doesn't receive it
            setTimeout(() => {
              expect(ws2ReceivedMessage).toBe(false);
              ws1.close();
              ws2.close();
              done();
            }, 500);
          }
        }
      });

      ws2.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as WebSocketEnvelope;
        
        if (message.type === 'join') {
          ws2Joined = true;
          
          if (ws1Joined && ws2Joined) {
            // Trigger the test from ws1 side
            const testMessage: WebSocketEnvelope = {
              type: 'full_ui_schema',
              meta: {
                sessionId: session1.sessionId,
                source: 'test',
                timestamp: Date.now(),
                version: '1.0.0'
              },
              payload: { session: 'session1' }
            };
            
            ws1.send(JSON.stringify(testMessage));
            
            // Wait a bit to ensure ws2 doesn't receive it
            setTimeout(() => {
              expect(ws2ReceivedMessage).toBe(false);
              ws1.close();
              ws2.close();
              done();
            }, 500);
          }
        } else if (message.type === 'full_ui_schema') {
          // ws2 should NOT receive messages from session1
          ws2ReceivedMessage = true;
        }
      });
    }, 15000);

    test('broadcasts events to editor clients only', (done) => {
      const session = sessionManager.createSession();
      const deviceWs = new WebSocket(`ws://localhost:${port}/ws`);
      const editorWs = new WebSocket(`ws://localhost:${port}/ws`);
      
      let deviceJoined = false;
      let editorJoined = false;

      deviceWs.on('open', () => {
        const joinMessage: WebSocketEnvelope = {
          type: 'join',
          meta: {
            sessionId: session.sessionId,
            source: 'device',
            timestamp: Date.now(),
            version: '1.0.0'
          },
          payload: {
            sessionId: session.sessionId,
            token: session.token,
            clientType: 'device'
          } as JoinPayload
        };
        deviceWs.send(JSON.stringify(joinMessage));
      });

      editorWs.on('open', () => {
        const joinMessage: WebSocketEnvelope = {
          type: 'join',
          meta: {
            sessionId: session.sessionId,
            source: 'editor',
            timestamp: Date.now(),
            version: '1.0.0'
          },
          payload: {
            sessionId: session.sessionId,
            token: session.token,
            clientType: 'editor'
          } as JoinPayload
        };
        editorWs.send(JSON.stringify(joinMessage));
      });

      deviceWs.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as WebSocketEnvelope;
        
        if (message.type === 'join') {
          deviceJoined = true;
          
          if (deviceJoined && editorJoined) {
            // Send event from device
            const eventMessage: WebSocketEnvelope = {
              type: 'event',
              meta: {
                sessionId: session.sessionId,
                source: 'device',
                timestamp: Date.now(),
                version: '1.0.0'
              },
              payload: {
                action: 'button_clicked',
                data: { buttonId: 'submit' }
              }
            };
            
            deviceWs.send(JSON.stringify(eventMessage));
          }
        }
      });

      editorWs.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as WebSocketEnvelope;
        
        if (message.type === 'join') {
          editorJoined = true;
          
          if (deviceJoined && editorJoined) {
            // Send event from device
            const eventMessage: WebSocketEnvelope = {
              type: 'event',
              meta: {
                sessionId: session.sessionId,
                source: 'device',
                timestamp: Date.now(),
                version: '1.0.0'
              },
              payload: {
                action: 'button_clicked',
                data: { buttonId: 'submit' }
              }
            };
            
            deviceWs.send(JSON.stringify(eventMessage));
          }
        } else if (message.type === 'event') {
          // Editor should receive the event
          expect(message.payload.action).toBe('button_clicked');
          expect(message.payload.data.buttonId).toBe('submit');
          deviceWs.close();
          editorWs.close();
          done();
        }
      });
    }, 15000);
  });

  describe('Ping/Pong Health Checks', () => {
    test('responds to ping with pong', (done) => {
      const session = sessionManager.createSession();
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      ws.on('open', () => {
        const joinMessage: WebSocketEnvelope = {
          type: 'join',
          meta: {
            sessionId: session.sessionId,
            source: 'test-client',
            timestamp: Date.now(),
            version: '1.0.0'
          },
          payload: {
            sessionId: session.sessionId,
            token: session.token,
            clientType: 'device'
          } as JoinPayload
        };
        ws.send(JSON.stringify(joinMessage));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as WebSocketEnvelope;
        
        if (message.type === 'join') {
          // Send ping
          const pingMessage: WebSocketEnvelope = {
            type: 'ping',
            meta: {
              sessionId: session.sessionId,
              source: 'test-client',
              timestamp: Date.now(),
              version: '1.0.0'
            },
            payload: {}
          };
          ws.send(JSON.stringify(pingMessage));
        } else if (message.type === 'pong') {
          // Received pong response
          expect(message.type).toBe('pong');
          ws.close();
          done();
        }
      });
    }, 10000);

    test('handles pong message from client', (done) => {
      const session = sessionManager.createSession();
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      ws.on('open', () => {
        const joinMessage: WebSocketEnvelope = {
          type: 'join',
          meta: {
            sessionId: session.sessionId,
            source: 'test-client',
            timestamp: Date.now(),
            version: '1.0.0'
          },
          payload: {
            sessionId: session.sessionId,
            token: session.token,
            clientType: 'device'
          } as JoinPayload
        };
        ws.send(JSON.stringify(joinMessage));
      });

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString()) as WebSocketEnvelope;
        
        if (message.type === 'join') {
          // Send pong
          const pongMessage: WebSocketEnvelope = {
            type: 'pong',
            meta: {
              sessionId: session.sessionId,
              source: 'test-client',
              timestamp: Date.now(),
              version: '1.0.0'
            },
            payload: {}
          };
          ws.send(JSON.stringify(pongMessage));
          
          // Connection should remain open
          setTimeout(() => {
            expect(ws.readyState).toBe(WebSocket.OPEN);
            ws.close();
            done();
          }, 100);
        }
      });
    }, 10000);
  });
});
