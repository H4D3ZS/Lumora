# State Management & Adapter Selection Guide

This guide helps you choose the right state management pattern for your Lumora project. The framework supports four popular Flutter state management solutions, each with different strengths and use cases.

## Table of Contents

- [Overview](#overview)
- [Available Adapters](#available-adapters)
- [Selection Guide](#selection-guide)
- [Adapter Comparison](#adapter-comparison)
- [Generated Code Examples](#generated-code-examples)
- [Migration Between Adapters](#migration-between-adapters)
- [Best Practices](#best-practices)

---

## Overview

Lumora's codegen tool generates complete state management scaffolding based on your chosen adapter. This allows teams to use the pattern that best fits their project size, team experience, and architectural preferences.

**Key Benefits**:
- Consistent architecture across projects
- Reduced boilerplate through code generation
- Easy switching between adapters
- Clean Architecture principles enforced
- Production-ready patterns out of the box

---

## Available Adapters

### Provider

**Best For**: Simple apps, prototypes, small projects

**Strengths**:
- Minimal boilerplate
- Easy to learn and understand
- Built into Flutter (no external dependencies for basic usage)
- Great for beginners
- Fast development iteration

**Weaknesses**:
- Can become messy in large apps
- Less structured than other options
- Harder to test complex logic
- No built-in event handling

**When to Use**:
- Prototypes and MVPs
- Apps with 1-5 screens
- Simple state requirements
- Learning Flutter state management
- Quick demos and experiments

### Riverpod

**Best For**: Modern, scalable applications with modular architecture

**Strengths**:
- Compile-time safety
- No BuildContext required
- Excellent testability
- Modular and composable
- Great for large teams
- Active development and community

**Weaknesses**:
- Steeper learning curve
- More concepts to understand
- Requires code generation for some features
- Newer than other options

**When to Use**:
- Medium to large projects (6+ screens)
- Apps requiring high testability
- Projects with multiple developers
- Long-term maintainability is priority
- Modern Flutter best practices

### Bloc

**Best For**: Structured, event-driven applications requiring predictability

**Strengths**:
- Clear separation of concerns
- Predictable state changes
- Excellent testability
- Well-documented patterns
- Large community and ecosystem
- Great for complex business logic

**Weaknesses**:
- More boilerplate than other options
- Steeper learning curve
- Can be overkill for simple apps
- Requires understanding of streams

**When to Use**:
- Medium to large projects (10-20+ screens)
- Complex business logic
- Team familiar with event-driven patterns
- High testability requirements
- Enterprise applications

### GetX

**Best For**: Rapid development with minimal boilerplate

**Strengths**:
- Minimal boilerplate
- Fast development
- Built-in dependency injection
- Route management included
- Performance optimized
- Easy to learn

**Weaknesses**:
- Less structured than Bloc/Riverpod
- Can lead to tightly coupled code
- Smaller community than other options
- Some controversial design decisions
- Less emphasis on testability

**When to Use**:
- Rapid prototyping
- Small to medium projects
- Solo developers
- Performance-critical apps
- Quick MVPs and demos

---

## Selection Guide

### By Project Size

| Project Size | Screens | Recommended Adapter | Alternative |
|-------------|---------|---------------------|-------------|
| Tiny | 1-5 | Provider | Riverpod |
| Small | 6-10 | Riverpod | Provider |
| Medium | 11-20 | Bloc | Riverpod |
| Large | 20+ | Riverpod | Bloc |
| Enterprise | 50+ | Bloc | Riverpod |

### By Team Size

| Team Size | Recommended Adapter | Rationale |
|-----------|---------------------|-----------|
| Solo | Provider or GetX | Minimal overhead, fast iteration |
| 2-3 | Riverpod | Good balance of structure and flexibility |
| 4-10 | Bloc or Riverpod | Clear patterns, good for collaboration |
| 10+ | Bloc | Enforced structure, predictable patterns |

### By Experience Level

| Experience | Recommended Adapter | Rationale |
|-----------|---------------------|-----------|
| Beginner | Provider | Easiest to learn, minimal concepts |
| Intermediate | Riverpod or GetX | Modern patterns, good documentation |
| Advanced | Bloc or Riverpod | Full control, advanced patterns |

### By Project Type

| Project Type | Recommended Adapter | Rationale |
|-------------|---------------------|-----------|
| Prototype/MVP | Provider or GetX | Fast development, minimal setup |
| Startup Product | Riverpod | Scalable, maintainable |
| Enterprise App | Bloc | Structured, testable, predictable |
| Open Source | Riverpod or Bloc | Well-documented, community standards |

---

## Adapter Comparison

### Feature Matrix

| Feature | Provider | Riverpod | Bloc | GetX |
|---------|----------|----------|------|------|
| Learning Curve | Easy | Medium | Hard | Easy |
| Boilerplate | Low | Medium | High | Low |
| Testability | Medium | High | High | Medium |
| Type Safety | Medium | High | High | Medium |
| Performance | Good | Excellent | Good | Excellent |
| Community | Large | Growing | Large | Medium |
| Documentation | Excellent | Good | Excellent | Good |
| Scalability | Medium | High | High | Medium |

---

## Generated Code Examples

### What Codegen Produces Per Adapter

#### Provider
- `ChangeNotifier` classes
- `ChangeNotifierProvider` wiring
- `Consumer` widget usage
- Clean Architecture structure

#### Riverpod
- `StateNotifier` or `Provider` modules
- `ConsumerWidget` scaffolds
- Provider declarations
- Clean Architecture structure

#### Bloc
- Event classes (`feature_event.dart`)
- State classes (`feature_state.dart`)
- Bloc classes (`feature_bloc.dart`)
- Page with `BlocProvider` and `BlocBuilder`
- Clean Architecture structure

#### GetX
- Controller classes
- Binding classes for dependency injection
- `GetMaterialApp` wiring
- `GetView` and `Obx` usage
- Clean Architecture structure

---

## Example: Bloc Scaffold (Generated)

When you run:
```bash
node cli.js schema2dart schema.json ./output -a bloc -f Counter
```

Generated files:
```
lib/features/counter/
├── domain/
│   ├── entities/
│   └── usecases/
├── data/
│   ├── models/
│   └── repositories/
└── presentation/
    ├── bloc/
    │   ├── counter_event.dart
    │   ├── counter_state.dart
    │   └── counter_bloc.dart
    └── pages/
        └── counter_page.dart
```

**counter_page.dart** uses `BlocProvider` and `BlocBuilder`:
```dart
class CounterPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => CounterBloc(),
      child: BlocBuilder<CounterBloc, CounterState>(
        builder: (context, state) {
          // Build UI based on state
          return Scaffold(
            body: Center(
              child: Text('Count: ${state.count}'),
            ),
          );
        },
      ),
    );
  }
}
```

---

## Migration Between Adapters

### Switching Adapters

To switch from one adapter to another:

1. **Regenerate Code**:
```bash
node cli.js schema2dart schema.json ./output -a <new-adapter>
```

2. **Update Dependencies** in `pubspec.yaml`:
```yaml
dependencies:
  # For Bloc
  flutter_bloc: ^8.1.0
  
  # For Riverpod
  flutter_riverpod: ^2.3.0
  
  # For Provider
  provider: ^6.0.0
  
  # For GetX
  get: ^4.6.0
```

3. **Update Main App** initialization based on the new adapter

### Migration Checklist

- [ ] Backup existing code
- [ ] Regenerate with new adapter
- [ ] Update pubspec.yaml dependencies
- [ ] Update main.dart app initialization
- [ ] Update page imports and usage
- [ ] Run tests to verify functionality
- [ ] Update documentation

---

## Best Practices

### General Guidelines

1. **Choose Early**: Select adapter at project start to avoid migration costs
2. **Stay Consistent**: Use the same adapter throughout the project
3. **Follow Patterns**: Use generated code patterns as templates
4. **Test Thoroughly**: Write tests for business logic regardless of adapter
5. **Document Decisions**: Document why you chose a specific adapter

### Provider Best Practices

- Keep notifiers focused and single-purpose
- Use `select` to optimize rebuilds
- Dispose resources properly
- Avoid deep nesting of providers

### Riverpod Best Practices

- Use `ref.watch` for reactive dependencies
- Use `ref.read` for one-time reads
- Leverage family and autoDispose modifiers
- Keep providers pure and testable

### Bloc Best Practices

- Keep events and states immutable
- Use Equatable for value equality
- Handle all events explicitly
- Test blocs independently of UI

### GetX Best Practices

- Use `.obs` sparingly for reactive state
- Leverage GetX dependency injection
- Clean up controllers with `onClose`
- Avoid overusing global state

---

## Integration Points

### Lumora Core Integration

- `packages/lumora_core` provides the base schema interpreter
- State adapters integrate with `RenderContext` for persistent state
- `packages/lumora_state_adapters` provides templates and helper code for each adapter
- Generated code follows Clean Architecture with domain, data, and presentation layers

### Configuration

Specify your adapter in `kiro.config.json`:

```json
{
  "adapter": "bloc",
  "codegen": {
    "outputDir": "./lib/features",
    "cleanArchitecture": true,
    "generateTests": false
  }
}
```

---

## Additional Resources

- [Provider Documentation](https://pub.dev/packages/provider)
- [Riverpod Documentation](https://riverpod.dev/)
- [Bloc Documentation](https://bloclibrary.dev/)
- [GetX Documentation](https://pub.dev/packages/get)
- [Flutter State Management Guide](https://docs.flutter.dev/development/data-and-backend/state-mgmt)
- [Clean Architecture in Flutter](https://resocoder.com/flutter-clean-architecture-tdd/)

---

## Getting Help

If you need help choosing an adapter:

1. Review the [Selection Guide](#selection-guide)
2. Check the [Adapter Comparison](#adapter-comparison)
3. Try the [examples](examples/) with different adapters
4. Ask in the community discussions

---

**Last Updated**: November 2025
