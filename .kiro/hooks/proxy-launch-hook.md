# Proxy Launch Hook

## Description

This hook starts the Dev-Proxy server and creates a new development session with QR code generation for instant device connection.

## Trigger

**Type**: Manual

**When to use**: 
- Starting a new development session
- After system restart
- When switching between projects

## Purpose

Launch the development environment by:
- Starting the Dev-Proxy WebSocket server
- Creating a new session with unique ID and token
- Generating and displaying QR code for device connection
- Providing connection details for programmatic access

## Hook Configuration

```yaml
name: proxy-launch
trigger: manual
description: Start Dev-Proxy server and create development session
```

## Actions

### 1. Check Prerequisites

Verify that:
- Node.js is installed (version 16+ recommended)
- Dev-Proxy dependencies are installed (`npm install` in tools/dev-proxy)
- Port 3000 is available (or use custom port)

### 2. Start Dev-Proxy Server

```bash
cd tools/dev-proxy
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### 3. Create Development Session

Once server is running, create a new session:

```bash
curl -X POST http://localhost:3000/session/new
```

### 4. Display Connection Information

The hook should display:
- ASCII QR code in terminal
- Session ID
- Token
- WebSocket URL
- HTTP endpoint for pushing schemas

## Expected Output

```
🚀 Starting Dev-Proxy server...

✓ Dev-Proxy running on http://localhost:3000
✓ WebSocket server listening on ws://localhost:3000/ws

Creating new development session...

┌─────────────────────────────────────────┐
│                                         │
│   Scan this QR code with Flutter app   │
│                                         │
│   ███████████████████████████████████   │
│   ██ ▄▄▄▄▄ █▀ █▀▀██▀▀█ ▄▄▄▄▄ ██       │
│   ██ █   █ █▀ ▄ █▀▄ █ █   █ ██       │
│   ██ █▄▄▄█ ██▀▀▄▄ ▀▄██ █▄▄▄█ ██       │
│   ██▄▄▄▄▄▄▄█ ▀ █ ▀ █ █▄▄▄▄▄▄▄██       │
│   ██ ▄ ▀▄▀▄▀▄▀█▄▀ ▄▀▄▀▄▀▄▀▄▀▄██       │
│   ██▄██▄██▄██▄██▄██▄██▄██▄██▄███       │
│                                         │
└─────────────────────────────────────────┘

Session Details:
  Session ID: abc123def456
  Token: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
  WebSocket URL: ws://192.168.1.100:3000/ws
  Expires: 8 hours from now

Push schemas with:
  curl -X POST http://localhost:3000/send/abc123def456 \
    -H "Content-Type: application/json" \
    -d @schema.json

Waiting for device connections...
```

## Error Handling

**Port Already in Use**:
```
Error: Port 3000 is already in use
Suggestion: Stop the existing process or use a different port
  export PORT=3001 && npm start
```

**Dependencies Not Installed**:
```
Error: Cannot find module 'express'
Suggestion: Install dependencies first
  cd tools/dev-proxy && npm install
```

**Network Interface Issues**:
```
Warning: Could not determine local IP address
Using localhost (127.0.0.1) - this will only work with emulators
For physical devices, manually specify your IP:
  export HOST=192.168.1.100 && npm start
```

## Environment Variables

Configure Dev-Proxy behavior:

```bash
# Custom port
export PORT=3001

# Custom host (for specific network interface)
export HOST=192.168.1.100

# Session lifetime (in hours)
export SESSION_LIFETIME=4

# Enable debug logging
export DEBUG=true

# Start server
npm start
```

## Background Process Mode

For long-running sessions, run Dev-Proxy in background:

```bash
# Start in background
cd tools/dev-proxy
npm start > dev-proxy.log 2>&1 &
echo $! > dev-proxy.pid

# Check status
ps -p $(cat dev-proxy.pid)

# Stop background process
kill $(cat dev-proxy.pid)
rm dev-proxy.pid
```

## Integration with Flutter-Dev-Client

After launching Dev-Proxy:

1. **Using QR Code** (Recommended):
   - Open Flutter-Dev-Client app
   - Tap "Scan QR Code" button
   - Point camera at QR code in terminal
   - Connection established automatically

2. **Manual Connection**:
   - Open Flutter-Dev-Client app
   - Tap "Manual Connection"
   - Enter Session ID and Token
   - Enter WebSocket URL
   - Tap "Connect"

## Session Management

**View Active Sessions**:
```bash
curl http://localhost:3000/sessions
```

**Close Specific Session**:
```bash
curl -X DELETE http://localhost:3000/session/abc123def456
```

**View Connected Clients**:
```bash
curl http://localhost:3000/session/abc123def456/clients
```

## Monitoring and Logs

Dev-Proxy logs important events:

```
[2025-11-09 10:30:00] Session created: abc123def456
[2025-11-09 10:30:15] Device connected: device-001 (Android)
[2025-11-09 10:30:45] Schema pushed: 45KB (full_ui_schema)
[2025-11-09 10:31:00] Event received: button_tap from device-001
[2025-11-09 10:35:00] Device disconnected: device-001
[2025-11-09 18:30:00] Session expired: abc123def456
```

## Health Check

Verify Dev-Proxy is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 3600,
  "activeSessions": 1,
  "connectedClients": 2,
  "version": "1.0.0"
}
```

## Usage Example

```bash
# Using Kiro CLI
kiro hook run proxy-launch

# Or manually
cd tools/dev-proxy
npm install  # First time only
npm start
```

## Integration with Kiro

This hook can be triggered from:
- Kiro command palette: "Start Dev-Proxy"
- Kiro sidebar: "Launch Development Server" button
- Terminal: `kiro hook run proxy-launch`
- Automatically on workspace open (if configured)

## Related Hooks

- **create-app-hook**: Create new app before launching proxy
- **codegen-hook**: Generate and push schemas after connection

## Advanced Configuration

Create a `.env` file in `tools/dev-proxy/`:

```env
PORT=3000
HOST=0.0.0.0
SESSION_LIFETIME=8
MAX_SESSIONS=10
MAX_CLIENTS_PER_SESSION=15
MESSAGE_SIZE_LIMIT=10485760
RATE_LIMIT=100
PING_INTERVAL=30000
PONG_TIMEOUT=10000
DEBUG=false
```

## Troubleshooting

**QR Code Not Displaying**:
- Ensure terminal supports UTF-8 encoding
- Try a different terminal emulator
- Use manual connection as fallback

**Device Can't Connect**:
- Verify device and computer are on same network
- Check firewall settings (allow port 3000)
- For Android emulator, use `ws://10.0.2.2:3000/ws`
- For iOS simulator, use `ws://localhost:3000/ws`

**Session Expires Too Quickly**:
- Increase SESSION_LIFETIME environment variable
- Sessions expire after 8 hours by default
- Create a new session when expired

## Notes

- Dev-Proxy is designed for local development only
- For remote connections, set up TLS/WSS with proper certificates
- Multiple sessions can run simultaneously on the same server
- Each session is isolated - messages don't leak between sessions
- Sessions are stored in memory - they don't persist across server restarts
