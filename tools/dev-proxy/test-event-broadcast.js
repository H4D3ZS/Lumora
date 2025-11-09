/**
 * Test script to verify event broadcasting from device to editor clients
 * 
 * This script:
 * 1. Creates a session
 * 2. Connects a device client
 * 3. Connects an editor client
 * 4. Sends an event from the device
 * 5. Verifies the editor receives the event
 */

const WebSocket = require('ws');
const http = require('http');

// Helper to make HTTP requests
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEventBroadcast() {
  console.log('=== Event Broadcasting Test ===\n');

  // Step 1: Create a session
  console.log('1. Creating session...');
  const session = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/session/new',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  console.log(`   Session created: ${session.sessionId}`);
  console.log(`   Token: ${session.token}\n`);

  // Step 2: Connect device client
  console.log('2. Connecting device client...');
  const deviceWs = new WebSocket('ws://localhost:3000/ws');
  
  await new Promise((resolve) => {
    deviceWs.on('open', () => {
      console.log('   Device connected');
      deviceWs.send(JSON.stringify({
        type: 'join',
        payload: {
          sessionId: session.sessionId,
          token: session.token,
          clientType: 'device'
        }
      }));
    });
    
    deviceWs.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'join' && msg.payload.status === 'connected') {
        console.log('   Device authenticated\n');
        resolve();
      }
    });
  });

  // Step 3: Connect editor client
  console.log('3. Connecting editor client...');
  const editorWs = new WebSocket('ws://localhost:3000/ws');
  
  await new Promise((resolve) => {
    editorWs.on('open', () => {
      console.log('   Editor connected');
      editorWs.send(JSON.stringify({
        type: 'join',
        payload: {
          sessionId: session.sessionId,
          token: session.token,
          clientType: 'editor'
        }
      }));
    });
    
    editorWs.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'join' && msg.payload.status === 'connected') {
        console.log('   Editor authenticated\n');
        resolve();
      }
    });
  });

  // Step 4: Send event from device and verify editor receives it
  console.log('4. Sending event from device...');
  
  const eventReceived = new Promise((resolve) => {
    editorWs.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'event') {
        console.log('   ✓ Editor received event!');
        console.log('   Event action:', msg.payload.action);
        console.log('   Event payload:', JSON.stringify(msg.payload.data, null, 2));
        console.log('   Meta fields preserved:', {
          sessionId: msg.meta.sessionId,
          source: msg.meta.source,
          timestamp: msg.meta.timestamp,
          version: msg.meta.version
        });
        resolve(true);
      }
    });
  });

  // Send event from device
  deviceWs.send(JSON.stringify({
    type: 'event',
    meta: {
      sessionId: session.sessionId,
      source: 'device-client',
      timestamp: Date.now(),
      version: '1.0.0'
    },
    payload: {
      action: 'button_tap',
      data: {
        buttonId: 'submit-btn',
        value: 'Hello from device!'
      }
    }
  }));

  // Wait for event to be received
  const success = await Promise.race([
    eventReceived,
    new Promise((resolve) => setTimeout(() => resolve(false), 2000))
  ]);

  if (success) {
    console.log('\n✓ Test PASSED: Event successfully broadcast from device to editor');
  } else {
    console.log('\n✗ Test FAILED: Editor did not receive event within 2 seconds');
  }

  // Cleanup
  deviceWs.close();
  editorWs.close();
  
  console.log('\n=== Test Complete ===');
  process.exit(success ? 0 : 1);
}

// Run test
testEventBroadcast().catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
});
