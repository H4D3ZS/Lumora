# Lumora Conversion Guide

This guide provides detailed examples of converting components between React and Flutter using Lumora IR.

## Table of Contents

1. [Basic Components](#basic-components)
2. [Props and Properties](#props-and-properties)
3. [State Management](#state-management)
4. [Event Handlers](#event-handlers)
5. [Styling](#styling)
6. [Lists and Iteration](#lists-and-iteration)
7. [Conditional Rendering](#conditional-rendering)
8. [Navigation](#navigation)
9. [Context and Providers](#context-and-providers)
10. [Advanced Patterns](#advanced-patterns)

## Basic Components

### Stateless Component

**React**:
```typescript
// src/Greeting.tsx
import React from 'react';

export const Greeting: React.FC = () => {
  return <div>Hello, World!</div>;
};
```

**Flutter** (generated):
```dart
// lib/greeting.dart
import 'package:flutter/material.dart';

class Greeting extends StatelessWidget {
  const Greeting({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Text('Hello, World!'),
    );
  }
}
```

**Command**:
```bash
lumora convert src/Greeting.tsx
```

## Props and Properties

### Simple Props

**React**:
```typescript
// src/UserCard.tsx
import React from 'react';

interface UserCardProps {
  name: string;
  age: number;
  email: string;
}

export const UserCard: React.FC<UserCardProps> = ({ name, age, email }) => {
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
      <p>Email: {email}</p>
    </div>
  );
};
```

**Flutter** (generated):
```dart
// lib/user_card.dart
import 'package:flutter/material.dart';

class UserCard extends StatelessWidget {
  final String name;
  final int age;
  final String email;

  const UserCard({
    Key? key,
    required this.name,
    required this.age,
    required this.email,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        children: [
          Text(
            name,
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          Text('Age: $age'),
          Text('Email: $email'),
        ],
      ),
    );
  }
}
```

### Optional Props

**React**:
```typescript
interface ButtonProps {
  text: string;
  disabled?: boolean;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  text, 
  disabled = false,
  icon 
}) => {
  return (
    <button disabled={disabled}>
      {icon && <img src={icon} />}
      {text}
    </button>
  );
};
```

**Flutter** (generated):
```dart
class Button extends StatelessWidget {
  final String text;
  final bool disabled;
  final String? icon;

  const Button({
    Key? key,
    required this.text,
    this.disabled = false,
    this.icon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: disabled ? null : () {},
      child: Row(
        children: [
          if (icon != null) Image.network(icon!),
          Text(text),
        ],
      ),
    );
  }
}
```

## State Management

### Local State (useState / StatefulWidget)

**React**:
```typescript
// src/Counter.tsx
import React, { useState } from 'react';

export const Counter: React.FC = () => {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  const increment = () => setCount(count + step);
  const decrement = () => setCount(count - step);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <input 
        type="number" 
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
      />
    </div>
  );
};
```

**Flutter** (generated):
```dart
// lib/counter.dart
import 'package:flutter/material.dart';

class Counter extends StatefulWidget {
  const Counter({Key? key}) : super(key: key);

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int count = 0;
  int step = 1;

  void increment() {
    setState(() {
      count = count + step;
    });
  }

  void decrement() {
    setState(() {
      count = count - step;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        children: [
          Text(
            'Count: $count',
            style: TextStyle(fontSize: 32),
          ),
          ElevatedButton(
            onPressed: increment,
            child: Text('+'),
          ),
          ElevatedButton(
            onPressed: decrement,
            child: Text('-'),
          ),
          TextField(
            keyboardType: TextInputType.number,
            onChanged: (value) {
              setState(() {
                step = int.parse(value);
              });
            },
          ),
        ],
      ),
    );
  }
}
```

### Effects (useEffect / Lifecycle)

**React**:
```typescript
import React, { useState, useEffect } from 'react';

export const Timer: React.FC = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>Elapsed: {seconds}s</div>;
};
```

**Flutter** (generated):
```dart
import 'dart:async';
import 'package:flutter/material.dart';

class Timer extends StatefulWidget {
  const Timer({Key? key}) : super(key: key);

  @override
  State<Timer> createState() => _TimerState();
}

class _TimerState extends State<Timer> {
  int seconds = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      setState(() {
        seconds = seconds + 1;
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Text('Elapsed: ${seconds}s'),
    );
  }
}
```

## Event Handlers

### Click/Tap Events

**React**:
```typescript
export const ClickableCard: React.FC = () => {
  const handleClick = () => {
    console.log('Card clicked');
  };

  const handleDoubleClick = () => {
    console.log('Card double-clicked');
  };

  return (
    <div 
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      Click me
    </div>
  );
};
```

**Flutter** (generated):
```dart
class ClickableCard extends StatelessWidget {
  const ClickableCard({Key? key}) : super(key: key);

  void handleClick() {
    print('Card clicked');
  }

  void handleDoubleClick() {
    print('Card double-clicked');
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: handleClick,
      onDoubleTap: handleDoubleClick,
      child: Container(
        child: Text('Click me'),
      ),
    );
  }
}
```

### Async Event Handlers

**React**:
```typescript
export const DataFetcher: React.FC = () => {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      {loading && <p>Loading...</p>}
      {data && <p>{data}</p>}
    </div>
  );
};
```

**Flutter** (generated):
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class DataFetcher extends StatefulWidget {
  const DataFetcher({Key? key}) : super(key: key);

  @override
  State<DataFetcher> createState() => _DataFetcherState();
}

class _DataFetcherState extends State<DataFetcher> {
  String? data;
  bool loading = false;

  Future<void> fetchData() async {
    setState(() {
      loading = true;
    });

    try {
      final response = await http.get(Uri.parse('/api/data'));
      final result = jsonDecode(response.body);
      setState(() {
        data = result;
      });
    } catch (error) {
      print('Failed to fetch: $error');
    } finally {
      setState(() {
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        children: [
          ElevatedButton(
            onPressed: fetchData,
            child: Text('Fetch Data'),
          ),
          if (loading) Text('Loading...'),
          if (data != null) Text(data!),
        ],
      ),
    );
  }
}
```

## Styling

### Inline Styles

**React**:
```typescript
export const StyledBox: React.FC = () => {
  return (
    <div style={{
      width: 200,
      height: 100,
      backgroundColor: '#3498db',
      borderRadius: 8,
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
      }}>
        Styled Box
      </span>
    </div>
  );
};
```

**Flutter** (generated):
```dart
class StyledBox extends StatelessWidget {
  const StyledBox({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 200,
      height: 100,
      decoration: BoxDecoration(
        color: Color(0xFF3498db),
        borderRadius: BorderRadius.circular(8),
      ),
      padding: EdgeInsets.all(16),
      child: Center(
        child: Text(
          'Styled Box',
          style: TextStyle(
            color: Color(0xFFffffff),
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
```

### Flexbox Layouts

**React**:
```typescript
export const FlexLayout: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{ flex: 1 }}>Item 1</div>
      <div style={{ flex: 2 }}>Item 2</div>
      <div style={{ flex: 1 }}>Item 3</div>
    </div>
  );
};
```

**Flutter** (generated):
```dart
class FlexLayout extends StatelessWidget {
  const FlexLayout({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          flex: 1,
          child: Text('Item 1'),
        ),
        SizedBox(width: 16),
        Expanded(
          flex: 2,
          child: Text('Item 2'),
        ),
        SizedBox(width: 16),
        Expanded(
          flex: 1,
          child: Text('Item 3'),
        ),
      ],
    );
  }
}
```

## Lists and Iteration

### Mapping Arrays

**React**:
```typescript
interface TodoListProps {
  todos: Array<{ id: string; text: string; done: boolean }>;
}

export const TodoList: React.FC<TodoListProps> = ({ todos }) => {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input type="checkbox" checked={todo.done} />
          <span>{todo.text}</span>
        </li>
      ))}
    </ul>
  );
};
```

**Flutter** (generated):
```dart
class TodoList extends StatelessWidget {
  final List<Todo> todos;

  const TodoList({
    Key? key,
    required this.todos,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: todos.length,
      itemBuilder: (context, index) {
        final todo = todos[index];
        return ListTile(
          leading: Checkbox(
            value: todo.done,
            onChanged: null,
          ),
          title: Text(todo.text),
        );
      },
    );
  }
}

class Todo {
  final String id;
  final String text;
  final bool done;

  Todo({
    required this.id,
    required this.text,
    required this.done,
  });
}
```

## Conditional Rendering

### Ternary and Logical Operators

**React**:
```typescript
interface MessageProps {
  isLoggedIn: boolean;
  username?: string;
}

export const Message: React.FC<MessageProps> = ({ isLoggedIn, username }) => {
  return (
    <div>
      {isLoggedIn ? (
        <p>Welcome back, {username}!</p>
      ) : (
        <p>Please log in</p>
      )}
      {isLoggedIn && <button>Logout</button>}
    </div>
  );
};
```

**Flutter** (generated):
```dart
class Message extends StatelessWidget {
  final bool isLoggedIn;
  final String? username;

  const Message({
    Key? key,
    required this.isLoggedIn,
    this.username,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        children: [
          if (isLoggedIn)
            Text('Welcome back, $username!')
          else
            Text('Please log in'),
          if (isLoggedIn)
            ElevatedButton(
              onPressed: () {},
              child: Text('Logout'),
            ),
        ],
      ),
    );
  }
}
```

## Navigation

### React Router to Flutter Navigator

**React**:
```typescript
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/settings">Settings</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
};
```

**Flutter** (generated):
```dart
class App extends StatelessWidget {
  const App({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      initialRoute: '/',
      routes: {
        '/': (context) => Home(),
        '/profile': (context) => Profile(),
        '/settings': (context) => Settings(),
      },
    );
  }
}

// Navigation helper
void navigateTo(BuildContext context, String route) {
  Navigator.pushNamed(context, route);
}
```

## Context and Providers

### React Context to InheritedWidget

**React**:
```typescript
import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

**Flutter** (generated):
```dart
class ThemeProvider extends InheritedWidget {
  final String theme;
  final VoidCallback toggleTheme;

  const ThemeProvider({
    Key? key,
    required this.theme,
    required this.toggleTheme,
    required Widget child,
  }) : super(key: key, child: child);

  static ThemeProvider? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<ThemeProvider>();
  }

  @override
  bool updateShouldNotify(ThemeProvider oldWidget) {
    return theme != oldWidget.theme;
  }
}

class ThemeProviderWidget extends StatefulWidget {
  final Widget child;

  const ThemeProviderWidget({
    Key? key,
    required this.child,
  }) : super(key: key);

  @override
  State<ThemeProviderWidget> createState() => _ThemeProviderWidgetState();
}

class _ThemeProviderWidgetState extends State<ThemeProviderWidget> {
  String theme = 'light';

  void toggleTheme() {
    setState(() {
      theme = theme == 'light' ? 'dark' : 'light';
    });
  }

  @override
  Widget build(BuildContext context) {
    return ThemeProvider(
      theme: theme,
      toggleTheme: toggleTheme,
      child: widget.child,
    );
  }
}
```

## Advanced Patterns

### Custom Hooks to Mixins

**React**:
```typescript
import { useState, useEffect } from 'react';

function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

export const ResponsiveComponent: React.FC = () => {
  const { width, height } = useWindowSize();

  return (
    <div>
      Window size: {width} x {height}
    </div>
  );
};
```

**Flutter** (generated):
```dart
mixin WindowSizeMixin<T extends StatefulWidget> on State<T> {
  Size size = Size.zero;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _updateSize();
    });
  }

  void _updateSize() {
    final newSize = MediaQuery.of(context).size;
    if (size != newSize) {
      setState(() {
        size = newSize;
      });
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _updateSize();
  }
}

class ResponsiveComponent extends StatefulWidget {
  const ResponsiveComponent({Key? key}) : super(key: key);

  @override
  State<ResponsiveComponent> createState() => _ResponsiveComponentState();
}

class _ResponsiveComponentState extends State<ResponsiveComponent>
    with WindowSizeMixin {
  @override
  Widget build(BuildContext context) {
    return Container(
      child: Text('Window size: ${size.width} x ${size.height}'),
    );
  }
}
```

## Best Practices

### 1. Use Type Annotations

Always provide type information for better conversion:

```typescript
// ✅ Good
interface Props {
  count: number;
  name: string;
}

// ❌ Bad
interface Props {
  count: any;
  name: any;
}
```

### 2. Keep Components Simple

Break complex components into smaller ones:

```typescript
// ✅ Good
<UserProfile>
  <Avatar />
  <UserInfo />
  <ActionButtons />
</UserProfile>

// ❌ Bad
<UserProfile>
  {/* 500 lines of JSX */}
</UserProfile>
```

### 3. Use Semantic Names

Use clear, descriptive names:

```typescript
// ✅ Good
const handleSubmit = () => { };
const isLoading = false;

// ❌ Bad
const h = () => { };
const f = false;
```

### 4. Document Your Code

Add JSDoc/dartdoc comments:

```typescript
/**
 * Displays user information in a card format
 * @param user - User object with name, email, and avatar
 * @param onEdit - Callback when edit button is clicked
 */
export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  // ...
};
```

## Troubleshooting

### Conversion Fails

If conversion fails, check:

1. **Syntax errors**: Ensure source code compiles
2. **Unsupported features**: Check compatibility
3. **Missing types**: Add type annotations
4. **Complex logic**: Simplify or split component

### Generated Code Issues

If generated code has issues:

1. **Review IR**: Check intermediate representation
2. **Custom mappings**: Add project-specific mappings
3. **Manual fixes**: Edit generated code if needed
4. **Report bugs**: Create issue with reproduction

### Performance Issues

If conversion is slow:

1. **Use watch mode**: Avoid repeated full conversions
2. **Exclude files**: Configure ignore patterns
3. **Optimize components**: Reduce complexity
4. **Check system**: Ensure adequate resources

## Next Steps

- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Architecture](./ARCHITECTURE.md) - System architecture details
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Examples](./examples/) - More conversion examples

---

**Need Help?** Join our [Discord community](https://discord.gg/lumora) or check the [Troubleshooting Guide](./TROUBLESHOOTING.md).
