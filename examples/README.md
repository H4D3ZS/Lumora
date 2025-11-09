# Lumora Examples

This directory contains example applications demonstrating the Lumora framework's capabilities for building mobile-first Flutter applications using React/TSX authoring.

## Available Examples

### 📝 [Todo App](./todo-app/README.md)

A complete task management application showcasing:
- List rendering with dynamic items
- Form inputs and buttons
- Event handling for user interactions
- Statistics and summary views
- Clean, organized UI layout

**Best for learning:**
- Basic UI primitives (View, Text, Button, List, Input)
- Event emission patterns
- State management with Bloc adapter
- CRUD operations UI patterns

**Quick Start:**
```bash
node tools/codegen/cli.js tsx2schema examples/todo-app/App.tsx examples/todo-app/schema.json
curl -X POST http://localhost:3000/send/<sessionId> -H "Content-Type: application/json" -d @examples/todo-app/schema.json
```

### 💬 [Chat App](./chat-app/README.md)

A messaging application demonstrating:
- Message list with sender/receiver styling
- Real-time message input
- Quick action buttons
- Typing indicators
- WhatsApp-inspired design

**Best for learning:**
- Complex layouts with flexbox
- Message bubble styling patterns
- Multiple event types
- State management with Riverpod adapter
- Real-time UI patterns

**Quick Start:**
```bash
node tools/codegen/cli.js tsx2schema examples/chat-app/App.tsx examples/chat-app/schema.json
curl -X POST http://localhost:3000/send/<sessionId> -H "Content-Type: application/json" -d @examples/chat-app/schema.json
```

## Prerequisites

Before running any example, ensure you have:

1. **Dev-Proxy running:**
   ```bash
   cd tools/dev-proxy
   npm install
   npm start
   ```

2. **Active session created:**
   ```bash
   curl -X POST http://localhost:3000/session/new
   ```
   Save the `sessionId` from the response.

3. **Flutter-Dev-Client connected:**
   ```bash
   cd apps/flutter-dev-client
   flutter pub get
   flutter run
   ```
   Scan the QR code or manually enter session details.

## Development Workflow

### 1. Generate Schema from TSX

Convert your TSX component to a JSON schema:

```bash
node tools/codegen/cli.js tsx2schema <example>/App.tsx <example>/schema.json
```

### 2. Push to Device

Send the schema to your connected device:

```bash
curl -X POST http://localhost:3000/send/<sessionId> \
  -H "Content-Type: application/json" \
  -d @<example>/schema.json
```

### 3. Live Development (Optional)

Enable watch mode for automatic regeneration:

```bash
node tools/codegen/cli.js tsx2schema <example>/App.tsx <example>/schema.json --watch
```

## Generating Production Code

Both examples include generated production Dart code with different state management adapters:

### Todo App - Bloc Adapter

```bash
node tools/codegen/cli.js schema2dart \
  examples/todo-app/schema.json \
  examples/todo-app/generated/bloc \
  --adapter bloc \
  --feature todo
```

**Generated structure:**
```
examples/todo-app/generated/bloc/
└── lib/
    └── features/
        └── todo/
            └── presentation/
                ├── bloc/
                │   ├── todo_event.dart
                │   ├── todo_state.dart
                │   └── todo_bloc.dart
                └── pages/
                    └── todo_page.dart
```

### Chat App - Riverpod Adapter

```bash
node tools/codegen/cli.js schema2dart \
  examples/chat-app/schema.json \
  examples/chat-app/generated/riverpod \
  --adapter riverpod \
  --feature chat
```

**Generated structure:**
```
examples/chat-app/generated/riverpod/
└── lib/
    └── features/
        └── chat/
            └── presentation/
                ├── providers/
                │   └── chat_provider.dart
                └── pages/
                    └── chat_page.dart
```

## Code Verification

All generated code has been verified to:
- ✅ Compile without syntax errors
- ✅ Follow Clean Architecture principles
- ✅ Use Lumora design tokens
- ✅ Include proper state management patterns
- ✅ Support event handling

## Comparison: Bloc vs Riverpod

| Feature | Bloc (Todo App) | Riverpod (Chat App) |
|---------|----------------|---------------------|
| **Best For** | CRUD operations, form handling | Real-time updates, streams |
| **Boilerplate** | More (events, states, bloc) | Less (providers, notifiers) |
| **Learning Curve** | Moderate | Gentle |
| **Testability** | Excellent | Excellent |
| **Performance** | Good | Excellent |
| **Use Case** | Task management, forms | Chat, feeds, real-time data |

## Learning Path

1. **Start with Todo App** - Learn the basics of Lumora primitives and event handling
2. **Move to Chat App** - Explore complex layouts and styling patterns
3. **Generate Production Code** - See how schemas transform into native Dart
4. **Customize Examples** - Modify the apps to practice your skills
5. **Build Your Own** - Create a new app using the patterns you've learned

## Common Patterns Demonstrated

### Layout Patterns
- **Vertical stacking** - Column-based layouts with spacing
- **Horizontal arrangement** - Row-based layouts with flex
- **Card-based UI** - Rounded containers with shadows
- **List rendering** - Scrollable lists with items

### Styling Patterns
- **Color schemes** - Consistent color usage across components
- **Typography** - Font sizes, weights, and colors
- **Spacing** - Padding and margins for visual hierarchy
- **Borders and radius** - Rounded corners and borders

### Interaction Patterns
- **Button actions** - Event emission on tap
- **Form inputs** - Text field with placeholders
- **List interactions** - Item-level actions
- **Quick actions** - Icon button groups

## Troubleshooting

### Schema doesn't appear on device
- Verify Dev-Proxy is running on `http://localhost:3000`
- Check sessionId is valid and not expired
- Ensure Flutter-Dev-Client is connected
- Validate JSON schema syntax

### Generated code doesn't compile
- Check that dependencies are added to `pubspec.yaml`
- Verify `kiro_ui_tokens` package path is correct
- Run `flutter pub get` to fetch dependencies
- Check for Dart SDK version compatibility

### Events not working
- Events are logged in Dev-Proxy console
- Verify event format: `emit:action:payload`
- Check WebSocket connection is active
- Review event bridge implementation

## Next Steps

- Read the [Framework Specification](../FRAMEWORK_SPEC.md) for architecture details
- Explore [State Management Guide](../STATE_MANAGEMENT.md) for adapter selection
- Review [Codegen Documentation](../tools/codegen/README.md) for advanced features
- Check [Dev-Proxy Documentation](../tools/dev-proxy/README.md) for API details
- Study [Flutter-Dev-Client Documentation](../apps/flutter-dev-client/README.md) for client features

## Contributing Examples

Want to add a new example? Follow these guidelines:

1. Create a new directory in `examples/`
2. Write an `App.tsx` file with your component
3. Generate the schema JSON
4. Create a comprehensive README
5. Test end-to-end with Dev-Proxy and Flutter-Dev-Client
6. Generate production code with at least one adapter
7. Verify generated code compiles
8. Document any special setup requirements

## Related Documentation

- [Root README](../README.md) - Project overview and quickstart
- [Codegen Tool](../tools/codegen/README.md) - TSX to schema conversion
- [Dev-Proxy](../tools/dev-proxy/README.md) - Session management and WebSocket broker
- [Flutter-Dev-Client](../apps/flutter-dev-client/README.md) - Mobile client features
- [Design Tokens](../packages/lumora_ui_tokens/README.md) - UI token system
