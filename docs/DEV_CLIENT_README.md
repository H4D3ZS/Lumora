
---

# `DEV_CLIENT_README.md`

```markdown
# Flutter Dev Client — README

**Purpose:** Native-first Flutter app that connects to the dev-proxy and renders UI from JSON schema in real time.

---

## Features (MVP)
- WebSocket connection to dev-proxy
- Join session via `join` message (sessionId & token)
- Receive `full_ui_schema` and `ui_schema_delta`
- Render primitives: `View`, `Text`, `Button`, `List`, `Image` (basic)
- Event bridge: `emit:action` semantics send events back to proxy/editor
- Isolate-based parsing for large payloads

---

## Running locally

1. Ensure dev-proxy is running and you have a sessionId/token (from `/session/new`).
2. Edit `lib/main.dart` to set `wsUrl`, or better: implement QR scanning to set `sessionId` & `token`.
3. Install dependencies and run:
```bash
cd apps/flutter-dev-client
flutter pub get
flutter run -d <device-id>


Example join message (sent by dev-proxy or on scan)
{
  "type": "join",
  "payload": {
    "sessionId": "abcd1234",
    "token": "deadbeef",
    "clientType": "device"
  }
}

JSON schema contract (short)

Root: { "schemaVersion": "1.0", "root": { ... } }

Node: { "type": "View" | "Text" | "Button" | "List", "props": {...}, "children": [...] }

Events: onTap: "emit:action:payload" where dev-client will send an envelope { type: 'event', payload: { action, meta } } to WS.

Tips for productionizing

Extract interpreter to packages/kiro_core and optimize using Dart isolates and incremental application of deltas.

Add renderer registry so teams can add custom native renderers (e.g., native map view).

Add ephemeral storage for downloaded dart_code_diff files for developer inspection.

Troubleshooting

If connection fails: ensure wsUrl reachable from device (use local IP, not localhost, for physical devices).

If schema not rendering: inspect WS messages in logs; validate JSON shape.