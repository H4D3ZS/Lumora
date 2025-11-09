Note

Replace ws://<YOUR_HOST_OR_IP> in the QR output with your machine’s LAN IP when testing on a physical phone.

For remote demos, use a tunnel service (ngrok/localtunnel) and update wsUrl accordingly.


# `CODEGEN_README.md`

```markdown
# Codegen — README

**Purpose:** Tools that convert React TSX files to a normalized UI schema and (optionally) generate Dart widget files per chosen state adapter.

---

## Tools
- `tsx2schema.js` — parse TSX and emit `schema.json`
- `schema2dart.js` — (future) generate `.dart` files from schema using templates (adapter-aware)

---

## `tsx2schema.js` usage
```bash
cd tools/codegen
npm install
node tsx2schema.js <input.tsx> <out.json>


input.tsx: path to the TSX file (e.g., examples/todo-app/web/src/App.tsx)

out.json: destination schema file

Supported subset (MVP)

JSX primitives: View, Text, Button, List, Image, Input

Props: string literals, object literals (converted to JSON), basic expressions serialized

How it works

Parses TSX AST with @babel/parser + @babel/traverse

Locates top-level JSX element in default export (or first JSXElement)

Walks JSX tree and converts to a normalized JSON node structure

Next steps for codegen (roadmap)

Add mapping rules for custom components via toSchema() or decorator

Implement schema2dart with Handlebars templates per adapter

Emit tests and usecase scaffolding for domain logic

Integrate kiro.config.json to control adapter and mapping rules