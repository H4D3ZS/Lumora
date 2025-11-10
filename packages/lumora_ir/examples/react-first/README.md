# React-First Example

This example demonstrates using Lumora IR in React-first mode, where React is the source of truth and Flutter code is automatically generated.

## Overview

In React-first mode:
- React components are the primary source
- Flutter widgets are automatically generated
- Changes to Flutter files are overwritten
- Ideal for web-first teams adding mobile support

## Project Structure

```
react-first-example/
├── src/                    # React source (editable)
│   ├── App.tsx
│   ├── components/
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   └── AddTodo.tsx
│   └── types/
│       └── todo.ts
├── lib/                    # Flutter generated (read-only)
│   ├── app.dart
│   ├── components/
│   │   ├── todo_list.dart
│   │   ├── todo_item.dart
│   │   └── add_todo.dart
│   └── types/
│       └── todo.dart
├── .lumora/
│   └── ir/                 # Intermediate representation
├── lumora.yaml             # Configuration
└── package.json
```

## Setup

### 1. Install Dependencies

```bash
# Install Node dependencies
npm install

# Install Flutter dependencies (for running mobile app)
cd mobile && flutter pub get
```

### 2. Configure Lumora

The project is already configured with `lumora.yaml`:

```yaml
version: 1.0.0
mode: react                 # React-first mode
sourceFramework: react
paths:
  react: ./src
  flutter: ./lib
  ir: ./.lumora/ir
stateManagement: bloc
```

### 3. Start Development

```bash
# Start React development server
npm start

# In another terminal, start Lumora watch mode
lumora convert src/ --watch

# In another terminal, run Flutter app
cd mobile && flutter run
```

## Example: Todo App

### React Source (src/App.tsx)

```typescript
import React, { useState } from 'react';
import { TodoList } from './components/TodoList';
import { AddTodo } from './components/AddTodo';
import { Todo } from './types/todo';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: 'Learn React', completed: false },
    { id: '2', text: 'Learn Flutter', completed: false },
  ]);

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      completed: false,
    };
    setTodos([...todos, newTodo]);
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Todo App</h1>
      <AddTodo onAdd={addTodo} />
      <TodoList
        todos={todos}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
      />
    </div>
  );
};
```

### Generated Flutter Code (lib/app.dart)

```dart
import 'package:flutter/material.dart';
import 'components/todo_list.dart';
import 'components/add_todo.dart';
import 'types/todo.dart';

class App extends StatefulWidget {
  const App({Key? key}) : super(key: key);

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  List<Todo> todos = [
    Todo(id: '1', text: 'Learn React', completed: false),
    Todo(id: '2', text: 'Learn Flutter', completed: false),
  ];

  void addTodo(String text) {
    final newTodo = Todo(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: text,
      completed: false,
    );
    setState(() {
      todos = [...todos, newTodo];
    });
  }

  void toggleTodo(String id) {
    setState(() {
      todos = todos.map((todo) {
        if (todo.id == id) {
          return Todo(
            id: todo.id,
            text: todo.text,
            completed: !todo.completed,
          );
        }
        return todo;
      }).toList();
    });
  }

  void deleteTodo(String id) {
    setState(() {
      todos = todos.where((todo) => todo.id != id).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20),
      child: Column(
        children: [
          Text(
            'Todo App',
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
          ),
          AddTodo(onAdd: addTodo),
          TodoList(
            todos: todos,
            onToggle: toggleTodo,
            onDelete: deleteTodo,
          ),
        ],
      ),
    );
  }
}
```

## Workflow

### 1. Edit React Component

```typescript
// src/components/TodoItem.tsx
export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      padding: 10,
      borderBottom: '1px solid #ccc'
    }}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span style={{ 
        flex: 1, 
        marginLeft: 10,
        textDecoration: todo.completed ? 'line-through' : 'none'
      }}>
        {todo.text}
      </span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
};
```

### 2. Save File

Lumora automatically detects the change and generates Flutter code.

### 3. Review Generated Code

```dart
// lib/components/todo_item.dart (auto-generated)
class TodoItem extends StatelessWidget {
  final Todo todo;
  final Function(String) onToggle;
  final Function(String) onDelete;

  const TodoItem({
    Key? key,
    required this.todo,
    required this.onToggle,
    required this.onDelete,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(10),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Color(0xFFcccccc)),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Checkbox(
            value: todo.completed,
            onChanged: (_) => onToggle(todo.id),
          ),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(left: 10),
              child: Text(
                todo.text,
                style: TextStyle(
                  decoration: todo.completed 
                    ? TextDecoration.lineThrough 
                    : TextDecoration.none,
                ),
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () => onDelete(todo.id),
            child: Text('Delete'),
          ),
        ],
      ),
    );
  }
}
```

### 4. Test on Mobile

```bash
cd mobile && flutter run
```

The Flutter app now includes your changes!

## Best Practices

### 1. Keep React as Source of Truth

Never manually edit generated Flutter files - they will be overwritten.

```bash
# ✅ Good
vim src/components/TodoItem.tsx

# ❌ Bad
vim lib/components/todo_item.dart  # Changes will be lost!
```

### 2. Use TypeScript Types

Define clear types for better conversion:

```typescript
// src/types/todo.ts
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Date;
}
```

### 3. Document Your Components

JSDoc comments are preserved in generated Dart code:

```typescript
/**
 * Displays a single todo item with checkbox and delete button
 * @param todo - The todo item to display
 * @param onToggle - Callback when checkbox is toggled
 * @param onDelete - Callback when delete button is clicked
 */
export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  // ...
};
```

### 4. Review Generated Code

Periodically review generated Flutter code to ensure quality:

```bash
# Preview changes before committing
git diff lib/
```

### 5. Use Git Ignore

Add generated files to `.gitignore` if desired:

```gitignore
# Option 1: Track generated code (recommended)
# No changes needed

# Option 2: Don't track generated code
lib/**/*.dart
!lib/main.dart
```

## Common Patterns

### State Management

```typescript
// React: useState
const [count, setCount] = useState(0);

// Generated Flutter: StatefulWidget
int count = 0;
void updateCount(int value) {
  setState(() {
    count = value;
  });
}
```

### Effects

```typescript
// React: useEffect
useEffect(() => {
  fetchData();
  return () => cleanup();
}, [dependency]);

// Generated Flutter: Lifecycle methods
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
```

### Event Handlers

```typescript
// React: onClick
<button onClick={handleClick}>Click</button>

// Generated Flutter: onPressed
ElevatedButton(
  onPressed: handleClick,
  child: Text('Click'),
)
```

## Troubleshooting

### Generated code doesn't compile

1. Check React source for errors
2. Ensure all types are defined
3. Review conversion logs: `lumora convert src/ --verbose`

### Changes not appearing in Flutter

1. Verify watch mode is running
2. Check file paths in `lumora.yaml`
3. Manually trigger conversion: `lumora convert src/`

### Performance issues

1. Exclude unnecessary files in `lumora.yaml`
2. Use incremental mode: `lumora convert src/ --incremental`
3. Reduce component complexity

## Next Steps

- [Conversion Guide](../../CONVERSION_GUIDE.md) - Learn more conversion patterns
- [API Reference](../../API_REFERENCE.md) - Explore the API
- [Flutter-First Example](../flutter-first/) - See the opposite workflow
- [Universal Example](../universal/) - Try bidirectional sync

## Resources

- [React Documentation](https://react.dev)
- [Flutter Documentation](https://flutter.dev)
- [Lumora IR Documentation](../../README.md)

---

**Questions?** Join our [Discord community](https://discord.gg/lumora) or check the [Troubleshooting Guide](../../TROUBLESHOOTING.md).
