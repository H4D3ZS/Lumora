# Flutter-First Example

This example demonstrates using Lumora IR in Flutter-first mode, where Flutter is the source of truth and React code is automatically generated.

## Overview

In Flutter-first mode:
- Flutter widgets are the primary source
- React components are automatically generated
- Changes to React files are overwritten
- Ideal for mobile-first teams adding web support

## Project Structure

```
flutter-first-example/
├── lib/                    # Flutter source (editable)
│   ├── main.dart
│   ├── screens/
│   │   ├── home_screen.dart
│   │   └── profile_screen.dart
│   ├── widgets/
│   │   ├── user_card.dart
│   │   └── action_button.dart
│   └── models/
│       └── user.dart
├── src/                    # React generated (read-only)
│   ├── App.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/
│   │   ├── UserCard.tsx
│   │   └── ActionButton.tsx
│   └── types/
│       └── user.ts
├── .lumora/
│   └── ir/                 # Intermediate representation
├── lumora.yaml             # Configuration
└── pubspec.yaml
```

## Setup

### 1. Install Dependencies

```bash
# Install Flutter dependencies
flutter pub get

# Install Node dependencies (for running web app)
cd web && npm install
```

### 2. Configure Lumora

The project is already configured with `lumora.yaml`:

```yaml
version: 1.0.0
mode: flutter               # Flutter-first mode
sourceFramework: flutter
paths:
  flutter: ./lib
  react: ./src
  ir: ./.lumora/ir
stateManagement: bloc
```

### 3. Start Development

```bash
# Start Flutter development
flutter run

# In another terminal, start Lumora watch mode
lumora convert lib/ --watch

# In another terminal, run React web app
cd web && npm start
```

## Example: User Profile App

### Flutter Source (lib/screens/profile_screen.dart)

```dart
import 'package:flutter/material.dart';
import '../widgets/user_card.dart';
import '../widgets/action_button.dart';
import '../models/user.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  User user = User(
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
  );

  bool isEditing = false;

  void toggleEdit() {
    setState(() {
      isEditing = !isEditing;
    });
  }

  void saveProfile() {
    // Save logic here
    setState(() {
      isEditing = false;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Profile saved!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Profile'),
        actions: [
          IconButton(
            icon: Icon(isEditing ? Icons.close : Icons.edit),
            onPressed: toggleEdit,
          ),
        ],
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            UserCard(
              user: user,
              isEditing: isEditing,
            ),
            SizedBox(height: 20),
            if (isEditing)
              ActionButton(
                text: 'Save Changes',
                onPressed: saveProfile,
                primary: true,
              ),
          ],
        ),
      ),
    );
  }
}
```

### Generated React Code (src/screens/ProfileScreen.tsx)

```typescript
import React, { useState } from 'react';
import { UserCard } from '../components/UserCard';
import { ActionButton } from '../components/ActionButton';
import { User } from '../types/user';

export const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<User>({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
  });

  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const saveProfile = () => {
    // Save logic here
    setIsEditing(false);
    alert('Profile saved!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#2196F3',
        color: 'white',
      }}>
        <h1>Profile</h1>
        <button onClick={toggleEdit}>
          {isEditing ? '✕' : '✎'}
        </button>
      </header>
      <main style={{ padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <UserCard user={user} isEditing={isEditing} />
          <div style={{ height: 20 }} />
          {isEditing && (
            <ActionButton
              text="Save Changes"
              onPressed={saveProfile}
              primary={true}
            />
          )}
        </div>
      </main>
    </div>
  );
};
```

## Workflow

### 1. Edit Flutter Widget

```dart
// lib/widgets/user_card.dart
class UserCard extends StatelessWidget {
  final User user;
  final bool isEditing;

  const UserCard({
    Key? key,
    required this.user,
    this.isEditing = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            CircleAvatar(
              radius: 50,
              backgroundImage: NetworkImage(user.avatar),
            ),
            SizedBox(height: 16),
            if (isEditing)
              TextField(
                decoration: InputDecoration(labelText: 'Name'),
                controller: TextEditingController(text: user.name),
              )
            else
              Text(
                user.name,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
            SizedBox(height: 8),
            Text(
              user.email,
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 2. Save File

Lumora automatically detects the change and generates React code.

### 3. Review Generated Code

```typescript
// src/components/UserCard.tsx (auto-generated)
import React from 'react';
import { User } from '../types/user';

interface UserCardProps {
  user: User;
  isEditing?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  isEditing = false 
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: 16,
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <img
          src={user.avatar}
          alt={user.name}
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
          }}
        />
        <div style={{ height: 16 }} />
        {isEditing ? (
          <input
            type="text"
            placeholder="Name"
            defaultValue={user.name}
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              border: '1px solid #ccc',
              padding: 8,
              borderRadius: 4,
            }}
          />
        ) : (
          <span style={{
            fontSize: 24,
            fontWeight: 'bold',
          }}>
            {user.name}
          </span>
        )}
        <div style={{ height: 8 }} />
        <span style={{ color: '#666' }}>
          {user.email}
        </span>
      </div>
    </div>
  );
};
```

### 4. Test on Web

```bash
cd web && npm start
```

The React web app now includes your changes!

## Best Practices

### 1. Keep Flutter as Source of Truth

Never manually edit generated React files - they will be overwritten.

```bash
# ✅ Good
vim lib/widgets/user_card.dart

# ❌ Bad
vim src/components/UserCard.tsx  # Changes will be lost!
```

### 2. Use Dart Types

Define clear models for better conversion:

```dart
// lib/models/user.dart
class User {
  final String id;
  final String name;
  final String email;
  final String avatar;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.avatar,
  });
}
```

### 3. Document Your Widgets

dartdoc comments are preserved in generated TypeScript code:

```dart
/// Displays user information in a card format
/// 
/// The [user] parameter contains the user data to display.
/// When [isEditing] is true, shows editable fields.
class UserCard extends StatelessWidget {
  final User user;
  final bool isEditing;
  
  // ...
}
```

### 4. Use Material Design

Leverage Material widgets for consistent UI:

```dart
// ✅ Good - Material widgets convert well
Card(
  child: ListTile(
    leading: Icon(Icons.person),
    title: Text('User'),
  ),
)

// ⚠️ Caution - Custom widgets may need mappings
CustomCard(
  child: CustomListItem(
    icon: CustomIcon.person,
    text: 'User',
  ),
)
```

### 5. Review Generated Code

Periodically review generated React code:

```bash
# Preview changes before committing
git diff src/
```

## Common Patterns

### State Management

```dart
// Flutter: StatefulWidget
class Counter extends StatefulWidget {
  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int count = 0;
  
  void increment() {
    setState(() {
      count++;
    });
  }
}

// Generated React: useState
const [count, setCount] = useState(0);

const increment = () => {
  setCount(count + 1);
};
```

### Lifecycle Methods

```dart
// Flutter: Lifecycle
@override
void initState() {
  super.initState();
  fetchData();
}

@override
void dispose() {
  cleanup();
  super.dispose();
}

// Generated React: useEffect
useEffect(() => {
  fetchData();
  return () => cleanup();
}, []);
```

### Navigation

```dart
// Flutter: Navigator
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => ProfileScreen()),
);

// Generated React: React Router
navigate('/profile');
```

## Troubleshooting

### Generated code doesn't compile

1. Check Flutter source for errors: `flutter analyze`
2. Ensure all types are defined
3. Review conversion logs: `lumora convert lib/ --verbose`

### Changes not appearing in React

1. Verify watch mode is running
2. Check file paths in `lumora.yaml`
3. Manually trigger conversion: `lumora convert lib/`

### Widget not converting

1. Check if widget is supported
2. Add custom mapping in `widget-mappings.yaml`
3. Use standard Material widgets

## Advanced Features

### Custom Widget Mappings

```yaml
# widget-mappings.yaml
mappings:
  - flutter: CustomButton
    react: MyButton
    props:
      text: label
      onPressed: onClick
```

### State Management Adapters

```yaml
# lumora.yaml
stateManagement: bloc  # or riverpod, provider, getx
```

### Styling Customization

```yaml
# lumora.yaml
styling:
  useStyledComponents: true
  cssModules: false
```

## Next Steps

- [Conversion Guide](../../CONVERSION_GUIDE.md) - Learn more conversion patterns
- [API Reference](../../API_REFERENCE.md) - Explore the API
- [React-First Example](../react-first/) - See the opposite workflow
- [Universal Example](../universal/) - Try bidirectional sync

## Resources

- [Flutter Documentation](https://flutter.dev)
- [React Documentation](https://react.dev)
- [Lumora IR Documentation](../../README.md)
- [Material Design](https://material.io)

---

**Questions?** Join our [Discord community](https://discord.gg/lumora) or check the [Troubleshooting Guide](../../TROUBLESHOOTING.md).
