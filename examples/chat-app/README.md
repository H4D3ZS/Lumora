# Chat App Example

A complete messaging application demonstrating the Lumora framework's capabilities for building interactive chat interfaces with message lists, input fields, and real-time event handling.

## Features Demonstrated

- **View Component**: Complex layouts with flexbox styling for message bubbles
- **Text Component**: Multi-line text with various styles for messages, timestamps, and usernames
- **Button Component**: Icon buttons for quick actions and sending messages
- **List Component**: Scrollable message history with sender/receiver differentiation
- **Input Component**: Message input field with placeholder text
- **Event Handling**: Multiple event types for sending messages, attachments, and media
- **Styling**: WhatsApp-inspired design with sent/received message styling

## Quick Start

### Prerequisites

1. Dev-Proxy server running (see `tools/dev-proxy/README.md`)
2. Flutter-Dev-Client running on device or emulator (see `apps/flutter-dev-client/README.md`)
3. Active development session with sessionId

### Step 1: Generate Schema

From the repository root, generate the JSON schema from the TSX file:

```bash
node tools/codegen/cli.js tsx2schema examples/chat-app/App.tsx examples/chat-app/schema.json
```

The schema will be generated at `examples/chat-app/schema.json`.

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
  -d @examples/chat-app/schema.json
```

Replace `<YOUR_SESSION_ID>` with the sessionId from Step 3.

The chat app UI should now appear on your device!

## Live Development with Watch Mode

For continuous development with automatic schema regeneration:

```bash
node tools/codegen/cli.js tsx2schema examples/chat-app/App.tsx examples/chat-app/schema.json --watch
```

Now edit `App.tsx` and the schema will automatically regenerate. Push the updated schema to see changes instantly:

```bash
# In another terminal, run this after each change:
curl -X POST http://localhost:3000/send/<YOUR_SESSION_ID> \
  -H "Content-Type: application/json" \
  -d @examples/chat-app/schema.json
```

## Event Handling

The chat app emits the following events:

- `sendMessage`: Triggered when the send button (📤) is pressed
- `attachFile`: Triggered when the attachment button (📎) is pressed
- `takePhoto`: Triggered when the camera button (📷) is pressed
- `recordVoice`: Triggered when the voice recording button (🎤) is pressed
- `openEmoji`: Triggered when the emoji button (😊) is pressed
- `openMenu`: Triggered when the menu button (⋮) in the header is pressed

These events are sent back to the Dev-Proxy and can be received by editor clients for implementing interactive chat behaviors.

## UI Structure

```
ChatApp
├── Header (Team name, online status, menu button)
├── Messages List
│   ├── Received Messages (white background, left-aligned)
│   │   ├── Sender name
│   │   ├── Message text
│   │   └── Timestamp
│   ├── Sent Messages (green background, right-aligned)
│   │   ├── Message text
│   │   └── Timestamp with read receipts
│   └── System Messages (yellow background, centered)
├── Typing Indicator
├── Input Area (Text field + Send button)
└── Quick Actions (Attach, Photo, Voice, Emoji)
```

## Design Patterns

### Message Bubble Styling

**Received Messages:**
- White background (`#FFFFFF`)
- Left-aligned (`alignItems: "flex-start"`)
- Sender name displayed
- Gray timestamp

**Sent Messages:**
- Light green background (`#DCF8C6`)
- Right-aligned (`alignItems: "flex-end"`)
- No sender name (implied as current user)
- Timestamp with read receipts (✓✓)

**System Messages:**
- Yellow background (`#FFF9C4`)
- Center-aligned
- Icon prefix (📌)
- Distinct styling for announcements

### Color Scheme

The app uses a WhatsApp-inspired color palette:
- Primary: `#075E54` (dark teal)
- Sent bubble: `#DCF8C6` (light green)
- Received bubble: `#FFFFFF` (white)
- Background: `#E5DDD5` (light beige)
- System message: `#FFF9C4` (light yellow)

## Generating Production Dart Code

To generate production-ready Dart code with state management:

### Using Riverpod Adapter (Recommended for this example)

```bash
node tools/codegen/cli.js schema2dart \
  examples/chat-app/schema.json \
  examples/chat-app/generated/riverpod \
  --adapter riverpod \
  --feature chat
```

**Generated Files:**
- `lib/features/chat/presentation/providers/chat_provider.dart` - StateNotifier provider
- `lib/features/chat/presentation/pages/chat_page.dart` - UI page with ConsumerWidget

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
import 'lib/features/chat/presentation/pages/chat_page.dart';

void main() {
  runApp(ProviderScope(
    child: MaterialApp(
      home: ChatPage(),
    ),
  ));
}
```

**Why Riverpod for Chat?**

Riverpod is ideal for chat applications because:
- Reactive state updates for real-time messages
- Efficient rebuilds for message list updates
- Easy integration with WebSocket streams
- Minimal boilerplate for state management
- Better performance for frequently updating UI

### Using Bloc Adapter

```bash
node tools/codegen/cli.js schema2dart \
  examples/chat-app/schema.json \
  examples/chat-app/generated/bloc \
  --adapter bloc \
  --feature chat
```

**Generated Files:**
- `lib/features/chat/presentation/bloc/chat_event.dart` - Event definitions
- `lib/features/chat/presentation/bloc/chat_state.dart` - State definitions
- `lib/features/chat/presentation/bloc/chat_bloc.dart` - Business logic
- `lib/features/chat/presentation/pages/chat_page.dart` - UI page with BlocProvider

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
import 'lib/features/chat/presentation/pages/chat_page.dart';

void main() {
  runApp(MaterialApp(
    home: ChatPage(),
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

1. **Add User Avatars**: Include circular avatar images next to usernames
2. **Add Message Status**: Show different icons for sent, delivered, and read
3. **Add Timestamps**: Group messages by date with date separators
4. **Add Reactions**: Allow emoji reactions to messages
5. **Add Reply Feature**: Show quoted messages when replying
6. **Add Media Messages**: Display image and video message types
7. **Add Voice Messages**: Show waveform visualization for voice notes
8. **Add Search**: Include a search bar to find messages

## Advanced Features to Explore

### Real-time Updates

Connect the chat app to a real backend to demonstrate:
- Live message delivery using WebSocket events
- Typing indicators based on user activity
- Read receipts updating in real-time
- Online/offline status changes

### State Management Integration

When generating production code, the state management adapter will handle:
- Message list state
- Input field state
- Typing indicator state
- User presence state
- Message sending/receiving logic

### Template Placeholders

Use template placeholders for dynamic content:

```tsx
<Text text="{{username}} is typing..." />
<Text text="{{messageCount}} messages" />
<Text text="{{lastSeen}}" />
```

## Troubleshooting

### Schema doesn't appear on device

- Verify the Dev-Proxy is running on `http://localhost:3000`
- Check that the sessionId is correct and not expired (8-hour lifetime)
- Ensure the Flutter-Dev-Client is connected (check Dev-Proxy logs)
- Verify the schema JSON is valid (check for syntax errors)

### Messages not displaying correctly

- Check that View components have proper `alignItems` for left/right alignment
- Verify background colors are set correctly for message bubbles
- Ensure `maxWidth` is set on message containers to prevent full-width bubbles

### Events not working

- Events are logged in the Dev-Proxy console
- Verify the event format is `emit:action:payload`
- Check that the Flutter-Dev-Client is sending events through WebSocket

### TSX parsing errors

- Ensure all JSX elements are properly closed
- Check that props use valid JavaScript/TypeScript syntax
- Verify the default export exists in App.tsx

## Performance Considerations

The chat app demonstrates efficient list rendering:
- Messages are rendered in a scrollable List component
- For production apps with many messages, consider using lazy loading
- The Flutter-Dev-Client automatically uses `ListView.builder` for lists > 20 items
- Consider implementing pagination for message history

## Next Steps

- Explore the [todo-app example](../todo-app/README.md) for task management UI patterns
- Read the [Codegen Tool documentation](../../tools/codegen/README.md) for advanced features
- Learn about [state management adapters](../../STATE_MANAGEMENT.md) for production apps
- Check out the [framework specification](../../FRAMEWORK_SPEC.md) for architecture details
- Review [event handling documentation](../../apps/flutter-dev-client/lib/services/README.md)

## Related Documentation

- [Dev-Proxy README](../../tools/dev-proxy/README.md)
- [Flutter-Dev-Client README](../../apps/flutter-dev-client/README.md)
- [Codegen Tool README](../../tools/codegen/README.md)
- [Event Bridge Documentation](../../apps/flutter-dev-client/lib/services/event_bridge.dart)
- [Quick Reference Guide](../../tools/codegen/QUICK_REFERENCE.md)
