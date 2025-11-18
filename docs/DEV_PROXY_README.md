
---

# `DEV_PROXY_README.md`

```markdown
# Dev Proxy — README

**Purpose:** Small Node server to manage dev sessions, print QR payloads, accept schema pushes, and broadcast to connected device clients.

---

## Install & Run
```bash
cd tools/dev-proxy
npm install
node index.js

Endpoints

GET /session/new — create a new session. Returns { sessionId, token, wsUrl } and prints ASCII QR.

POST /send/:sessionId — push a JSON envelope (e.g., { type: 'full_ui_schema', payload: {...} }) that will be broadcast to connected clients in that session.

WebSocket

Path: /ws

Join message:
{ "type": "join", "payload": { "sessionId": "<id>", "token":"<token>", "clientType":"device|editor" } }

Envelope format:
{
  "type": "full_ui_schema",
  "meta": { "sessionId": "<id>", "source": "editor", "timestamp": 12345 },
  "payload": { ... schema ... }
}

Usage pattern (editor)

Editor calls /session/new (or operator calls curl)

Editor receives sessionId & token & wsUrl

Editor posts a full schema to POST /send/:sessionId or sends it via WS

Device connections that joined the session receive the schema

Note

Replace ws://<YOUR_HOST_OR_IP> in the QR output with your machine’s LAN IP when testing on a physical phone.

For remote demos, use a tunnel service (ngrok/localtunnel) and update wsUrl accordingly.