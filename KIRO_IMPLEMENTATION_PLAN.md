
---

# `KIRO_IMPLEMENTATION_PLAN.md`

```markdown
# Kiro Implementation Plan — Full Boilerplate & Framework (Actionable)

**Purpose:** A complete implementation plan for Kiro to scaffold, generate, and maintain a mobile-first Flutter dev-client plus React/TSX authoring path.

---

## Goals (priority)
1. Mobile-first native dev client (Flutter) that reliably runs on Android & iOS.
2. Fast authoring in React + TypeScript (Vite + Monaco).
3. Deterministic codegen path: TSX -> JSON UI schema -> (optionally) Dart widgets.
4. Support for multiple state adapters (Bloc, Riverpod, Provider, GetX).
5. Clean Architecture and design token driven mapping.

---

## Deliverables (MVP)
- `tools/dev-proxy` — Node server (session, QR, WS broker, POST /send/:sessionId)
- `apps/flutter-dev-client` — Flutter app that:
  - Connects to WS, joins session, receives `full_ui_schema` and `ui_schema_delta`.
  - Interprets JSON schema into Flutter widgets (View/Text/Button/List).
  - Sends UI events back to the editor/proxy.
- `tools/codegen/tsx2schema.js` — CLI to convert TSX to minimal UI schema.
- `examples/todo-app` & `examples/chat-app` — two sample apps using templates.
- `.kiro/` — spec.yaml, steering.md, hooks (create-app, proxy-launch, codegen).

---

## Implementation steps (detailed)

### Phase 1 — Core MVP (3–7 days)
1. Implement `tools/dev-proxy`:
   - Routes: `/session/new`, `POST /send/:sessionId`
   - WebSocket at `/ws`
   - ASCII QR printed on session create
2. Implement `apps/flutter-dev-client`:
   - WebSocket client to proxy
   - Schema interpreter for core primitives
   - Template resolver for `{{ }}` placeholders
   - Debounce & isolate parsing for large payloads
3. Implement `tools/codegen/tsx2schema.js`:
   - Use `@babel/parser` to parse TSX and extract JSXElements
   - Map supported primitives to schema nodes
4. Create example apps and ensure the quickstart works end-to-end.

### Phase 2 — Robustness & state adapters (2–4 days)
1. Implement `packages/kiro_core` for interpreter & renderer registry
2. Implement `packages/kiro_state_adapters` scaffolds for Bloc & Riverpod
3. Add `schema2dart` (adapter: bloc) for production scaffolding
4. Add `.kiro/hooks` to automate scaffolding and doc updates

### Phase 3 — Polishing & stretch
1. Inspector overlay, delta optimization, gzipped WS frames
2. schema2dart for all adapters, unit test generation
3. CI for build & tests, APK/publishing helpers, TestFlight distribution instructions

---

## Protocol: WebSocket envelopes (stable)
- `type`: `full_ui_schema | ui_schema_delta | dart_code_diff | event | ping | pong`
- `meta`: `{sessionId, source, timestamp, version}`
- `payload`: content (schema or diff or code)

---

## `/.kiro` minimal contents
- `spec.yaml` (describe features & hooks)
- `steering.md` (constraints and deliverables)
- `hooks/create-app-hook.md`, `hooks/proxy-launch-hook.md`, `hooks/codegen-hook.md`
- `vibe/session-logs.md` (paste sample Kiro prompts & outputs)

---

## Quality benchmarks
- Setup: running the full demo in < 3 commands
- Schema push latency: < 500ms round-trip (local)
- Large schema: parse & render within < 2s (use isolate)
- Example generation time: < 30s for create-app

---

## Anti-patterns to avoid
- Relying on runtime compilation of Dart on-device (not feasible); focus on interpreter + codegen artifacts.
- Mapping arbitrary React features — restrict to supported primitives and clear extension points.
- Sending huge full-page bundles each change — use diffs and batching.

---

## Notes for judges & devs
- Provide debug APK/IPA for judges who cannot compile iOS locally.
- Provide demo video < 3 minutes that highlights QR scan, live edit, and generated code.
