# Todo App Example

A complete todo list application demonstrating the Lumora framework's core features including UI primitives, event handling, and real-time updates.

## Features Demonstrated

- **View Component**: Container layouts with padding, background colors, and styling
- **Text Component**: Typography with various styles and colors
- **Button Component**: Interactive buttons with event emission
- **List Component**: Dynamic list rendering with multiple items
- **Input Component**: Text input fields for user data entry
- **Event Handling**: Using `emit:action:payload` format for user interactions

## Quick Start

### Prerequisites

1. Dev-Proxy server running (see `tools/dev-proxy/README.md`)
2. Flutter-Dev-Client running on device or emulator (see `apps/flutter-dev-client/README.md`)
3. Active development session with sessionId

### Step 1: Generate Schema

From the repository root, generate the JSON schema from the TSX file:

```bash
node tools/codegen/cli.js tsx2schema examples/todo-app/App.tsx examples/todo-app/schema.json
```

The schema will be generated at `examples/todo-app/schema.json`.

### Step 2: Start Dev-Proxy

If not already running, start the Dev-Proxy server:

```bash
cd tools/dev-proxy
npm install
npm start
```

### Step 3: Create Session

Create a new development session:

```bash
curl -X POST http://localhost:3000/session/new
```

Save the `sessionId` from the response. You'll also see a QR code in the terminal.

### Step 4: Connect Flutter-Dev-Client

Launch the Flutter-Dev-Client app and scan the QR code, or manually enter the session details.

```bash
cd apps/flutter-dev-client
flutter pub get
flutter run
```

### Step 5: Push Schema to Device

Push the generated schema to your connected device:

```bash
curl -X POST http://localhost:3000/send/<YOUR_SESSION_ID> \
  -H "Content-Type: application/json" \
  -d @examples/todo-app/schema.json
```

Replace `<YOUR_SESSION_ID>` with the sessionId from Step 3.

The todo app UI should now appear on your device!

## Live Development with Watch Mode

For continuous development with automatic schema regeneration:

```bash
node tools/codegen/cli.js tsx2schema examples/todo-app/App.tsx examples/todo-app/schema.json --watch
```

Now edit `App.tsx` and the schema will automatically regenerate. Push the updated schema to see changes instantly:

```bash
# In another terminal, run this after each change:
curl -X POST http://localhost:3000/send/<YOUR_SESSION_ID> \
  -H "Content-Type: application/json" \
  -d @examples/todo-app/schema.json
```

## Event Handling

The todo app emits the following events:

- `addTodo`: Triggered when the "Add Task" button is pressed
- `completeTodo`: Triggered when a task's checkmark button is pressed (includes task ID in payload)
- `viewCompleted`: Triggered when "View All" completed tasks button is pressed

These events are sent back to the Dev-Proxy and can be received by editor clients for implementing interactive behaviors.

## UI Structure

```
TodoApp
├── Header (View with title and subtitle)
├── Add Todo Section (Input + Button)
├── Active Tasks List
│   ├── Todo Item 1 (Text + Complete Button)
│   ├── Todo Item 2 (Text + Complete Button)
│   └── Todo Item 3 (Text + Complete Button)
├── Completed Section (Summary + View All Button)
└── Footer Stats (Active, Done, Total counts)
```

## Generating Production Dart Code

To generate production-ready Dart code with state management:

### Using Bloc Adapter (Recommended for this example)

```bash
node tools/codegen/cli.js schema2dart \
  examples/todo-app/schema.json \
  examples/todo-app/generated/bloc \
  --adapter bloc \
  --feature todo
```

**Generated Files:**
- `lib/features/todo/presentation/bloc/todo_event.dart` - Event definitions
- `lib/features/todo/presentation/bloc/todo_state.dart` - State definitions
- `lib/features/todo/presentation/bloc/todo_bloc.dart` - Business logic
- `lib/features/todo/presentation/pages/todo_page.dart` - UI page with BlocProvider

**Setup Requirements:**

Add these dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5
  kiro_ui_tokens:
    path: ../../../packages/lumora_ui_tokens
```

**Usage:**

```dart
import 'package:flutter/material.dart';
import 'lib/features/todo/presentation/pages/todo_page.dart';

void main() {
  runApp(MaterialApp(
    home: TodoPage(),
  ));
}
```

### Using Riverpod Adapter

```bash
node tools/codegen/cli.js schema2dart \
  examples/todo-app/schema.json \
  examples/todo-app/generated/riverpod \
  --adapter riverpod \
  --feature todo
```

**Generated Files:**
- `lib/features/todo/presentation/providers/todo_provider.dart` - StateNotifier provider
- `lib/features/todo/presentation/pages/todo_page.dart` - UI page with ConsumerWidget

**Setup Requirements:**

Add these dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  flutter_riverpod: ^2.4.0
  kiro_ui_tokens:
    path: ../../../packages/lumora_ui_tokens
```

**Usage:**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'lib/features/todo/presentation/pages/todo_page.dart';

void main() {
  runApp(ProviderScope(
    child: MaterialApp(
      home: TodoPage(),
    ),
  ));
}
```

### Code Verification

The generated code has been verified to compile without errors. The code follows Clean Architecture principles with proper separation of concerns and includes:

- Event-driven state management (Bloc) or reactive state management (Riverpod)
- Type-safe state transitions
- Integration with Lumora design tokens
- Proper widget composition
- Event handling placeholders for interactive features

## Customization Ideas

Try modifying the app to practice with Lumora:

1. **Add Priority Levels**: Add color-coded priority indicators (high, medium, low)
2. **Add Categories**: Group todos by category (work, personal, shopping)
3. **Add Due Dates**: Display formatted due dates with icons
4. **Add Search**: Include an input field to filter todos
5. **Add Animations**: Use style props to add visual feedback
6. **Add Delete**: Add a delete button for each todo item

## Troubleshooting

### Schema doesn't appear on device

- Verify the Dev-Proxy is running on `http://localhost:3000`
- Check that the sessionId is correct and not expired (8-hour lifetime)
- Ensure the Flutter-Dev-Client is connected (check Dev-Proxy logs)
- Verify the schema JSON is valid (check for syntax errors)

### Events not working

- Events are logged in the Dev-Proxy console
- Verify the event format is `emit:action:payload`
- Check that the Flutter-Dev-Client is sending events through WebSocket

### TSX parsing errors

- Ensure all JSX elements are properly closed
- Check that props use valid JavaScript/TypeScript syntax
- Verify the default export exists in App.tsx

## Next Steps

- Explore the [chat-app example](../chat-app/README.md) for messaging UI patterns
- Read the [Codegen Tool documentation](../../tools/codegen/README.md) for advanced features
- Learn about [state management adapters](../../STATE_MANAGEMENT.md) for production apps
- Check out the [framework specification](../../FRAMEWORK_SPEC.md) for architecture details

## Related Documentation

- [Dev-Proxy README](../../tools/dev-proxy/README.md)
- [Flutter-Dev-Client README](../../apps/flutter-dev-client/README.md)
- [Codegen Tool README](../../tools/codegen/README.md)
- [Quick Reference Guide](../../tools/codegen/QUICK_REFERENCE.md)
