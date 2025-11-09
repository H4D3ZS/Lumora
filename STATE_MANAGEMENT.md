
---

# `STATE_MANAGEMENT.md`

```markdown
# State Management & Adapter Strategy

**Goal:** Let teams choose the state management strategy that fits project size and complexity. Codegen will generate scaffolding accordingly.

---

## Available adapters
- **Provider**: simple apps, prototypes
- **Riverpod**: modular, testable, scalable
- **Bloc**: predictable, event-driven patterns, good for medium-sized apps
- **GetX**: quick wiring, performance-focused (optional)

---

## Selection rules
- Tiny (<= 5 screens): Provider / Riverpod
- Small/Medium (6–20 screens): Bloc
- Large (>20 screens): Riverpod (preferred) or Bloc with modules

---

## What codegen produces per adapter
- **Provider**: `ChangeNotifier` classes, `ChangeNotifierProvider` wiring
- **Riverpod**: `StateNotifier` or `Provider` modules, `ConsumerWidget` scaffolds
- **Bloc**: `events`, `states`, `bloc` files + `BlocProvider` & `BlocBuilder` usage
- **GetX**: controllers + bindings + `GetMaterialApp` wiring

---

## Example: Bloc scaffold (generated)
- `counter_event.dart`
- `counter_state.dart`
- `counter_bloc.dart`
- `counter_page.dart` (uses `BlocProvider` and `BlocBuilder`)

---

## Integration points
- `packages/kiro_state_adapters` provides templates and helper code for each adapter.
- `packages/kiro_core` expects a `StateAdapter` to be injected into `RenderContext` for pages requiring persistent state.
