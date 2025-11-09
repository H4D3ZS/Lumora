const WebSocket = require('ws');

// Get session info from command line or create new session
const sessionId = process.argv[2];
const token = process.argv[3];

if (!sessionId || !token) {
  console.error('Usage: node test-ws-client.js <sessionId> <token>');
  process.exit(1);
}

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send join message
  const joinMessage = {
    type: 'join',
    payload: {
      sessionId,
      token,
      clientType: 'device'
    }
  };
  
  console.log('Sending join message:', JSON.stringify(joinMessage, null, 2));
  ws.send(JSON.stringify(joinMessage));
});

ws.on('message', (data) => {
  console.log('Received message:', data.toString());
});

ws.on('close', (code, reason) => {
  console.log(`Connection closed: code=${code}, reason=${reason}`);
});

ws.on('ping', () => {
  console.log('Received ping, sending pong');
  ws.pong();
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});
