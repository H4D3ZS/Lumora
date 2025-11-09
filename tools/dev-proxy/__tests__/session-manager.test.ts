import { SessionManager } from '../src/session-manager';
import { Session, Client } from '../src/types';
import { WebSocket } from 'ws';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  afterEach(() => {
    sessionManager.stopCleanup();
  });

  describe('Session Creation and Token Generation', () => {
    test('creates unique session with sessionId and token', () => {
      const session = sessionManager.createSession();

      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();
      expect(session.token).toBeDefined();
      expect(session.sessionId).toHaveLength(32); // 16 bytes hex = 32 chars
      expect(session.token).toHaveLength(64); // 32 bytes hex = 64 chars
      expect(session.connectedClients).toEqual([]);
    });

    test('generates unique sessionIds for multiple sessions', () => {
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();
      const session3 = sessionManager.createSession();

      expect(session1.sessionId).not.toBe(session2.sessionId);
      expect(session2.sessionId).not.toBe(session3.sessionId);
      expect(session1.sessionId).not.toBe(session3.sessionId);
    });

    test('generates unique tokens for multiple sessions', () => {
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();

      expect(session1.token).not.toBe(session2.token);
    });

    test('sets createdAt and expiresAt timestamps', () => {
      const beforeCreate = Date.now();
      const session = sessionManager.createSession();
      const afterCreate = Date.now();

      expect(session.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(session.createdAt).toBeLessThanOrEqual(afterCreate);
      
      // Session should expire 8 hours after creation
      const expectedExpiry = session.createdAt + (8 * 60 * 60 * 1000);
      expect(session.expiresAt).toBe(expectedExpiry);
    });
  });

  describe('Session Retrieval and Validation', () => {
    test('retrieves session by sessionId', () => {
      const session = sessionManager.createSession();
      const retrieved = sessionManager.getSession(session.sessionId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.sessionId).toBe(session.sessionId);
      expect(retrieved?.token).toBe(session.token);
    });

    test('returns null for non-existent sessionId', () => {
      const retrieved = sessionManager.getSession('non-existent-id');
      expect(retrieved).toBeNull();
    });

    test('validates active session successfully', () => {
      const session = sessionManager.createSession();
      const validation = sessionManager.validateSession(session.sessionId);

      expect(validation.valid).toBe(true);
      expect(validation.session).toBeDefined();
      expect(validation.session?.sessionId).toBe(session.sessionId);
      expect(validation.error).toBeUndefined();
    });

    test('returns error for non-existent session', () => {
      const validation = sessionManager.validateSession('non-existent-id');

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('SESSION_NOT_FOUND');
      expect(validation.session).toBeUndefined();
    });

    test('detects expired session', () => {
      const session = sessionManager.createSession();
      
      // Manually set expiration to past
      session.expiresAt = Date.now() - 1000;
      
      const isExpired = sessionManager.isSessionExpired(session);
      expect(isExpired).toBe(true);
    });

    test('validates and removes expired session', () => {
      const session = sessionManager.createSession();
      
      // Manually set expiration to past
      session.expiresAt = Date.now() - 1000;
      
      const validation = sessionManager.validateSession(session.sessionId);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('SESSION_EXPIRED');
      
      // Session should be removed from storage
      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved).toBeNull();
    });
  });

  describe('Client Management', () => {
    test('adds client to session', () => {
      const session = sessionManager.createSession();
      const mockWs = {} as WebSocket;
      
      const client: Client = {
        clientId: 'client-1',
        clientType: 'device',
        connection: mockWs,
        connectedAt: Date.now()
      };

      const added = sessionManager.addClient(session.sessionId, client);
      expect(added).toBe(true);

      const clients = sessionManager.getSessionClients(session.sessionId);
      expect(clients).toHaveLength(1);
      expect(clients[0].clientId).toBe('client-1');
      expect(clients[0].clientType).toBe('device');
    });

    test('returns false when adding client to non-existent session', () => {
      const mockWs = {} as WebSocket;
      const client: Client = {
        clientId: 'client-1',
        clientType: 'device',
        connection: mockWs,
        connectedAt: Date.now()
      };

      const added = sessionManager.addClient('non-existent-id', client);
      expect(added).toBe(false);
    });

    test('removes client from session', () => {
      const session = sessionManager.createSession();
      const mockWs = {} as WebSocket;
      
      const client: Client = {
        clientId: 'client-1',
        clientType: 'device',
        connection: mockWs,
        connectedAt: Date.now()
      };

      sessionManager.addClient(session.sessionId, client);
      
      const removed = sessionManager.removeClient(session.sessionId, 'client-1');
      expect(removed).toBe(true);

      const clients = sessionManager.getSessionClients(session.sessionId);
      expect(clients).toHaveLength(0);
    });

    test('returns false when removing non-existent client', () => {
      const session = sessionManager.createSession();
      const removed = sessionManager.removeClient(session.sessionId, 'non-existent-client');
      expect(removed).toBe(false);
    });

    test('manages multiple clients in session', () => {
      const session = sessionManager.createSession();
      const mockWs = {} as WebSocket;
      
      const client1: Client = {
        clientId: 'client-1',
        clientType: 'device',
        connection: mockWs,
        connectedAt: Date.now()
      };

      const client2: Client = {
        clientId: 'client-2',
        clientType: 'editor',
        connection: mockWs,
        connectedAt: Date.now()
      };

      sessionManager.addClient(session.sessionId, client1);
      sessionManager.addClient(session.sessionId, client2);

      const clients = sessionManager.getSessionClients(session.sessionId);
      expect(clients).toHaveLength(2);
      expect(clients.map(c => c.clientId)).toContain('client-1');
      expect(clients.map(c => c.clientId)).toContain('client-2');
    });
  });

  describe('Session Expiration and Cleanup', () => {
    test('cleans up expired sessions', () => {
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();
      
      // Set session1 to expired
      session1.expiresAt = Date.now() - 1000;

      const cleanedCount = sessionManager.cleanupExpiredSessions();
      expect(cleanedCount).toBe(1);

      // Session1 should be removed
      expect(sessionManager.getSession(session1.sessionId)).toBeNull();
      
      // Session2 should still exist
      expect(sessionManager.getSession(session2.sessionId)).toBeDefined();
    });

    test('closes WebSocket connections on session cleanup', () => {
      const session = sessionManager.createSession();
      
      const mockWs = {
        readyState: 1, // OPEN
        close: jest.fn()
      } as unknown as WebSocket;
      
      const client: Client = {
        clientId: 'client-1',
        clientType: 'device',
        connection: mockWs,
        connectedAt: Date.now()
      };

      sessionManager.addClient(session.sessionId, client);
      
      // Set session to expired
      session.expiresAt = Date.now() - 1000;

      sessionManager.cleanupExpiredSessions();

      expect(mockWs.close).toHaveBeenCalledWith(1000, 'Session expired');
    });

    test('returns zero when no sessions are expired', () => {
      sessionManager.createSession();
      sessionManager.createSession();

      const cleanedCount = sessionManager.cleanupExpiredSessions();
      expect(cleanedCount).toBe(0);
    });

    test('starts and stops automatic cleanup', () => {
      jest.useFakeTimers();

      sessionManager.startCleanup();
      
      // Create expired session
      const session = sessionManager.createSession();
      session.expiresAt = Date.now() - 1000;

      // Fast-forward 5 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);

      // Session should be cleaned up
      expect(sessionManager.getSession(session.sessionId)).toBeNull();

      sessionManager.stopCleanup();
      jest.useRealTimers();
    });
  });

  describe('Session Isolation', () => {
    test('isolates clients between different sessions', () => {
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();
      const mockWs = {} as WebSocket;

      const client1: Client = {
        clientId: 'client-1',
        clientType: 'device',
        connection: mockWs,
        connectedAt: Date.now()
      };

      const client2: Client = {
        clientId: 'client-2',
        clientType: 'device',
        connection: mockWs,
        connectedAt: Date.now()
      };

      sessionManager.addClient(session1.sessionId, client1);
      sessionManager.addClient(session2.sessionId, client2);

      const session1Clients = sessionManager.getSessionClients(session1.sessionId);
      const session2Clients = sessionManager.getSessionClients(session2.sessionId);

      expect(session1Clients).toHaveLength(1);
      expect(session2Clients).toHaveLength(1);
      expect(session1Clients[0].clientId).toBe('client-1');
      expect(session2Clients[0].clientId).toBe('client-2');
    });

    test('handles concurrent session creation safely', () => {
      const sessions = Array.from({ length: 10 }, () => sessionManager.createSession());
      
      const sessionIds = sessions.map(s => s.sessionId);
      const uniqueIds = new Set(sessionIds);

      expect(uniqueIds.size).toBe(10);
      expect(sessionManager.getActiveSessionCount()).toBe(10);
    });
  });

  describe('QR Code Payload Generation', () => {
    test('session contains all required fields for QR payload', () => {
      const session = sessionManager.createSession();

      // Verify session has all fields needed for QR code
      expect(session.sessionId).toBeDefined();
      expect(session.token).toBeDefined();
      
      // QR payload would be: { wsUrl, sessionId, token }
      const qrPayload = {
        wsUrl: 'ws://localhost:3000/ws',
        sessionId: session.sessionId,
        token: session.token
      };

      expect(qrPayload.sessionId).toHaveLength(32);
      expect(qrPayload.token).toHaveLength(64);
      expect(qrPayload.wsUrl).toContain('/ws');
    });
  });
});
