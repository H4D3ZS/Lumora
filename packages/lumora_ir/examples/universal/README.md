# Universal Mode Example

This example demonstrates using Lumora IR in universal mode, where both React and Flutter are editable sources with bidirectional synchronization and conflict resolution.

## Overview

In universal mode:
- Both React and Flutter are editable
- Changes sync bidirectionally in real-time
- Conflicts are detected and resolved
- Ideal for mixed teams (React + Flutter developers)

## Project Structure

```
universal-example/
├── src/                    # React source (editable)
│   ├── App.tsx
│   ├── components/
│   │   ├── ChatList.tsx
│   │   ├── ChatMessage.tsx
│   │   └── MessageInput.tsx
│   └── types/
│       └── message.ts
├── lib/                    # Flutter source (editable)
│   ├── main.dart
│   ├── widgets/
│   │   ├── chat_list.dart
│   │   ├── chat_message.dart
│   │   └── message_input.dart
│   └── models/
│       └── message.dart
├── .lumora/
│   ├── ir/                 # Intermediate representation
│   └── conflicts/          # Conflict records
├── lumora.yaml             # Configuration
├── package.json
└── pubspec.yaml
```

## Setup

### 1. Install Dependencies

```bash
# Install Node dependencies
npm install

# Install Flutter dependencies
flutter pub get
```

### 2. Configure Lumora

The project is configured with `lumora.yaml`:

```yaml
version: 1.0.0
mode: universal             # Universal mode
paths:
  react: ./src
  flutter: ./lib
  ir: ./.lumora/ir
  conflicts: ./.lumora/conflicts
stateManagement: bloc
conflictResolution:
  strategy: prompt          # prompt, react, flutter, or manual
  autoResolve: false
```

### 3. Start Bidirectional Sync

```bash
# Start bidirectional sync
lumora sync --watch

# In another terminal, start React dev server
npm start

# In another terminal, start Flutter app
flutter run
```

## Example: Chat Application

### Scenario 1: React Developer Adds Feature

**React Developer** edits `src/components/MessageInput.tsx`:

```typescript
import React, { useState } from 'react';

interface MessageInputProps {
  onSend: (text: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend }) => {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
      setIsTyping(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      padding: 16,
      borderTop: '1px solid #ccc'
    }}>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Type a message..."
        style={{ flex: 1, padding: 8, marginRight: 8 }}
      />
      <button 
        onClick={handleSend}
        disabled={!text.trim()}
        style={{ padding: '8px 16px' }}
      >
        Send
      </button>
      {isTyping && <span style={{ marginLeft: 8 }}>✍️</span>}
    </div>
  );
};
```

**Lumora automatically generates** `lib/widgets/message_input.dart`:

```dart
import 'package:flutter/material.dart';

class MessageInput extends StatefulWidget {
  final Function(String) onSend;

  const MessageInput({
    Key? key,
    required this.onSend,
  }) : super(key: key);

  @override
  State<MessageInput> createState() => _MessageInputState();
}

class _MessageInputState extends State<MessageInput> {
  String text = '';
  bool isTyping = false;
  final TextEditingController _controller = TextEditingController();

  void handleChange(String value) {
    setState(() {
      text = value;
      isTyping = value.isNotEmpty;
    });
  }

  void handleSend() {
    if (text.trim().isNotEmpty) {
      widget.onSend(text);
      setState(() {
        text = '';
        isTyping = false;
      });
      _controller.clear();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Color(0xFFcccccc)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              onChanged: handleChange,
              decoration: InputDecoration(
                hintText: 'Type a message...',
                contentPadding: EdgeInsets.all(8),
              ),
            ),
          ),
          SizedBox(width: 8),
          ElevatedButton(
            onPressed: text.trim().isEmpty ? null : handleSend,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text('Send'),
            ),
          ),
          if (isTyping) ...[
            SizedBox(width: 8),
            Text('✍️'),
          ],
        ],
      ),
    );
  }
}
```

### Scenario 2: Flutter Developer Adds Feature

**Flutter Developer** edits `lib/widgets/chat_message.dart`:

```dart
import 'package:flutter/material.dart';
import '../models/message.dart';

class ChatMessage extends StatelessWidget {
  final Message message;
  final bool isCurrentUser;
  final VoidCallback? onLongPress;

  const ChatMessage({
    Key? key,
    required this.message,
    required this.isCurrentUser,
    this.onLongPress,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPress: onLongPress,
      child: Align(
        alignment: isCurrentUser 
          ? Alignment.centerRight 
          : Alignment.centerLeft,
        child: Container(
          margin: EdgeInsets.symmetric(vertical: 4, horizontal: 8),
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isCurrentUser 
              ? Colors.blue[100] 
              : Colors.grey[200],
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                message.text,
                style: TextStyle(fontSize: 16),
              ),
              SizedBox(height: 4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _formatTime(message.timestamp),
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  if (isCurrentUser && message.isRead) ...[
                    SizedBox(width: 4),
                    Icon(Icons.done_all, size: 16, color: Colors.blue),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime timestamp) {
    return '${timestamp.hour}:${timestamp.minute.toString().padLeft(2, '0')}';
  }
}
```

**Lumora automatically generates** `src/components/ChatMessage.tsx`:

```typescript
import React from 'react';
import { Message } from '../types/message';

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  onLongPress?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isCurrentUser,
  onLongPress 
}) => {
  const formatTime = (timestamp: Date): string => {
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress?.();
      }}
      style={{
        display: 'flex',
        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          margin: '4px 8px',
          padding: 12,
          backgroundColor: isCurrentUser ? '#BBDEFB' : '#EEEEEE',
          borderRadius: 16,
          maxWidth: '70%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 16 }}>
            {message.text}
          </span>
          <div style={{ height: 4 }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#666' }}>
              {formatTime(message.timestamp)}
            </span>
            {isCurrentUser && message.isRead && (
              <>
                <div style={{ width: 4 }} />
                <span style={{ color: '#2196F3' }}>✓✓</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Scenario 3: Conflict Resolution

**Conflict occurs** when both developers edit the same component simultaneously.

**React Developer** edits `src/components/ChatList.tsx`:
```typescript
// Adds search functionality
const [searchQuery, setSearchQuery] = useState('');
```

**Flutter Developer** edits `lib/widgets/chat_list.dart` at the same time:
```dart
// Adds filter functionality
String filterType = 'all';
```

**Lumora detects conflict**:
```
⚠️  Conflict detected in ChatList component

Both React and Flutter versions were modified:
- React: src/components/ChatList.tsx (modified 2 seconds ago)
- Flutter: lib/widgets/chat_list.dart (modified 1 second ago)

How would you like to resolve this conflict?
  1. Use React version (discard Flutter changes)
  2. Use Flutter version (discard React changes)
  3. Manual merge (open diff editor)
  4. Skip for now

Your choice:
```

**Developer chooses option 3** (Manual merge):

```diff
// Diff view shows both changes
+ // React changes
+ const [searchQuery, setSearchQuery] = useState('');

+ // Flutter changes  
+ String filterType = 'all';

// Developer can merge both features
```

**After resolution**, Lumora regenerates both files with merged changes.

## Conflict Resolution Strategies

### 1. Prompt Strategy (Default)

Ask developer to choose resolution:

```yaml
# lumora.yaml
conflictResolution:
  strategy: prompt
```

### 2. React-First Strategy

Always use React version:

```yaml
# lumora.yaml
conflictResolution:
  strategy: react
```

### 3. Flutter-First Strategy

Always use Flutter version:

```yaml
# lumora.yaml
conflictResolution:
  strategy: flutter
```

### 4. Manual Strategy

Always require manual merge:

```yaml
# lumora.yaml
conflictResolution:
  strategy: manual
```

## Best Practices

### 1. Communicate with Team

Use team chat to coordinate edits:

```
👤 React Dev: "Working on MessageInput component"
👤 Flutter Dev: "Got it, I'll work on ChatMessage"
```

### 2. Use Feature Branches

Work on separate branches to avoid conflicts:

```bash
# React developer
git checkout -b feature/search

# Flutter developer
git checkout -b feature/filter
```

### 3. Sync Frequently

Pull latest changes often:

```bash
git pull origin main
lumora sync
```

### 4. Review Conflicts Carefully

Don't rush conflict resolution:

```bash
# Take time to understand both changes
lumora show-conflict chat-list

# Review diff
git diff src/components/ChatList.tsx lib/widgets/chat_list.dart
```

### 5. Test After Conflicts

Always test after resolving conflicts:

```bash
# Test React
npm test

# Test Flutter
flutter test
```

## Workflow Tips

### Daily Workflow

```bash
# Morning: Sync latest changes
git pull
lumora sync

# During development: Keep sync running
lumora sync --watch

# Before committing: Verify no conflicts
lumora check-conflicts

# Commit both React and Flutter changes
git add src/ lib/
git commit -m "Add feature X"
```

### Code Review

```bash
# Review both React and Flutter changes
git diff src/
git diff lib/

# Verify IR is consistent
lumora validate-ir
```

### Debugging Sync Issues

```bash
# Check sync status
lumora status

# View sync logs
lumora logs --tail 50

# Force resync
lumora sync --force
```

## Advanced Features

### Conflict Hooks

Run custom scripts on conflicts:

```yaml
# lumora.yaml
conflictResolution:
  hooks:
    onConflict: ./scripts/notify-team.sh
    onResolve: ./scripts/update-docs.sh
```

### Selective Sync

Sync only specific directories:

```yaml
# lumora.yaml
sync:
  include:
    - src/components/**
    - lib/widgets/**
  exclude:
    - "**/*.test.*"
    - "**/*.spec.*"
```

### Conflict Notifications

Get notified via Slack/Discord:

```yaml
# lumora.yaml
notifications:
  slack:
    webhook: https://hooks.slack.com/...
    channel: "#dev-team"
  discord:
    webhook: https://discord.com/api/webhooks/...
```

## Troubleshooting

### Conflicts not detected

1. Verify universal mode: `mode: universal` in `lumora.yaml`
2. Check sync is running: `lumora status`
3. Review conflict settings

### Sync loop (infinite syncing)

1. Stop sync: Ctrl+C
2. Clear IR cache: `rm -rf .lumora/ir`
3. Restart sync: `lumora sync --watch`

### Lost changes after conflict

1. Check conflict backups: `.lumora/conflicts/`
2. Review git history: `git log --all`
3. Restore from backup if needed

## Monitoring

### Sync Dashboard

View real-time sync status:

```bash
lumora dashboard
```

Shows:
- Active syncs
- Recent conflicts
- Sync statistics
- Error logs

### Metrics

Track sync performance:

```bash
lumora metrics

# Output:
# Total syncs: 1,234
# Average sync time: 245ms
# Conflicts: 12 (resolved: 10, pending: 2)
# Success rate: 99.2%
```

## Next Steps

- [Conversion Guide](../../CONVERSION_GUIDE.md) - Learn conversion patterns
- [API Reference](../../API_REFERENCE.md) - Explore the API
- [React-First Example](../react-first/) - Single-source workflow
- [Flutter-First Example](../flutter-first/) - Single-source workflow

## Resources

- [React Documentation](https://react.dev)
- [Flutter Documentation](https://flutter.dev)
- [Lumora IR Documentation](../../README.md)
- [Git Conflict Resolution](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)

---

**Questions?** Join our [Discord community](https://discord.gg/lumora) or check the [Troubleshooting Guide](../../TROUBLESHOOTING.md).
