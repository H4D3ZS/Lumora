# Framework Spec — Production-grade Lumora Framework

**Scope:** This file describes the overall architecture, packages, APIs, and extension points for a production-ready framework any Flutter dev would adopt.

---

## Core design principles
- Mobile-first: native Flutter client is primary artifact.
- Two-tier runtime: interpreted schema (fast) + codegen (native).
- Clean Architecture enforced by codegen templates.
- Adapter-driven state management (Bloc/Riverpod/Provider/GetX).
- Design tokens & component mapping drive consistent UI across platforms.

---

## Packages & responsibilities

### `packages/kiro_core` (Dart)
- `SchemaInterpreter` — interprets schema -> Widget
- `RendererRegistry` — register custom renderers
- `EventBridge` — bridge back to proxy/editor
- `TemplateEngine` — resolves `{{}}` placeholders safely

### `packages/kiro_codegen` (Node)
- `tsx2schema` CLI (AST walker)
- `schema2dart` CLI (templates for each adapter)
- `kiro.config.json` for mappings & adapter selection

### `packages/kiro_state_adapters` (Dart templates)
- `BlocAdapter` — scaffolds bloc classes + wiring
- `RiverpodAdapter` — provider scaffolds
- `ProviderAdapter`, `GetXAdapter`

### `packages/kiro_plugin_api`
- Node & Dart plugin interfaces for schema transformation & runtime renderer injection

---

## Adapter selection logic
- Config (`kiro.config.json`): `adapter: "bloc" | "riverpod" | "provider" | "getx"`
- Small projects (<=5 screens): Provider/Riverpod
- Medium (6–20): Bloc
- Large (>20): Riverpod or Bloc with modularization

---

## Component & design token mapping
- `shared/ui-mapping.json` -> mapping of primitives to Dart widgets and prop transforms
- `packages/kiro_ui_tokens` -> colors, typography, spacing constants

---

## CLI (kiro)
- `kiro init` — initialize project & choose adapter
- `kiro create-app <name>` — generate app templates
- `kiro proxy` — start dev-proxy
- `kiro codegen --watch` — watch TSX and emit schema/dart
- `kiro plugin add <plugin>`

---

## Runtime performance & delta model
- Use JSON Patch/JSON Merge Patch for `ui_schema_delta`
- Batch changes & debounce (100–300ms)
- Use Isolate for parsing big payloads
- Lazy list rendering with `ListView.builder`

---

## Security
- Ephemeral tokens (session lifetime default 8h)
- TLS recommended for remote use
- Dev-client warns about remote session code execution

---

## Testing & CI
- `codegen:smoke` action to generate sample outputs and compare to golden files
- `dart analyze`, `flutter test` for runtime packages
- macOS runners for iOS build checks

---

## Extensibility
- Plugin lifecycle hooks:
  - `onBeforeSchemaEmit(schema)`
  - `onAfterSchemaEmit(schema)`
  - `onBeforeRender(node, ctx)`
  - `onAfterRender(widget, ctx)`
- Plugins must declare compatibility and version

---

## Example mapping (snippet)
`shared/ui-mapping.json`:
```json
{
  "View": { "dart": "Container", "props": { "padding": "EdgeInsets.all" } },
  "Text": { "dart": "Text", "props": { "text": "text", "style": "TextStyle" } },
  "Button": { "dart": "ElevatedButton", "props": { "title": "child", "onTap": "onPressed" } }
}
