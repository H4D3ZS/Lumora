# Lumora v1.2.0 - User Experience Guide

## What You'll See Now

### 1. Web Preview (localhost:3001)

#### When You First Start

```bash
lumora init my-app
cd my-app
lumora start
```

**Open browser to `http://localhost:3001`**

You'll see:

```
🚀 Welcome to Lumora! 🚀

Count: 0

[Increment Button]

💡 This React code auto-syncs to lib/main.dart!
```

- The heading is styled and prominent
- The counter shows "0"
- The button is clickable and styled (purple background, white text)
- Clicking the button increases the count
- Everything is interactive and works!

#### When You Edit Files

**Edit `src/App.tsx`:**
```tsx
export function App() {
  return <div><h1>Hello World!</h1></div>;
}
```

**Save the file**

**Browser automatically refreshes (1-2 seconds)**

You'll see:
```
Hello World!
```

No manual refresh needed! The page polls for updates and reloads automatically.

### 2. Mobile Preview (Scan QR Code)

**Terminal shows:**
```
✓ Dev-Proxy started for mobile
✓ Web preview at http://localhost:3001

[QR CODE HERE]

📱 Mobile Preview:
   1. Open Lumora Dev Client on your device
   2. Scan the QR code above
   3. See Flutter native UI with live updates
```

**On your mobile device:**
- Native Flutter widgets render
- Instant updates via WebSocket
- Full device capabilities
- Production-like performance

### 3. Code Generation (with --codegen flag)

#### Initial Setup

```bash
lumora init my-app
cd my-app
lumora start --codegen
```

**Terminal shows:**
```
✓ Dev-Proxy started for mobile
✓ Web preview at http://localhost:3001
✓ Watching React files: src
✓ Watching Flutter files: lib
Processing 1 initial file(s)...
✓ Initial setup complete

🌐 Web Preview:
   Open http://localhost:3001 in your browser
   See React UI with live updates

📱 Mobile Preview:
   1. Open Lumora Dev Client on your device
   2. Scan the QR code above
   3. See Flutter native UI with live updates

🔄 Bidirectional Magic:
   • Write React → See on Flutter mobile + React web
   • Write Flutter → See on React web + Flutter mobile
   • Changes sync instantly to BOTH platforms
   • Production code auto-generates

✨ Edit your code and watch it update everywhere instantly!
```

#### When You Edit React

**Edit `src/App.tsx`:**
```tsx
export function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Add One
      </button>
    </div>
  );
}
```

**Save the file**

**Terminal shows:**
```
🔄 React file changed: App.tsx
  ✓ Updated Flutter mobile
  ✓ Updated React web
  → src/App.tsx → lib/main.dart
```

**Check `lib/main.dart`:**
```dart
class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Counter: $count'),
        ElevatedButton(
          onPressed: () {
            setState(() {
              count = count + 1;
            });
          },
          child: const Text('Add One'),
        ),
      ],
    );
  }
}
```

**Result:**
- ✅ Flutter code generated automatically
- ✅ Web browser shows updated UI
- ✅ Mobile device shows updated UI
- ✅ No infinite loops
- ✅ No repeated updates

#### When You Edit Flutter

**Edit `lib/main.dart`:**
```dart
Text('Hello from Flutter!')
```

**Save the file**

**Terminal shows:**
```
🔄 Flutter file changed: main.dart
  ✓ Updated Flutter mobile
  ✓ Updated React web
  → lib/main.dart → src/App.tsx
```

**Check `src/App.tsx`:**
```tsx
export function App() {
  return (
    <div>
      <p>Hello from Flutter!</p>
    </div>
  );
}
```

**Result:**
- ✅ React code generated automatically
- ✅ Web browser shows updated UI
- ✅ Mobile device shows updated UI
- ✅ No infinite loops
- ✅ No repeated updates

### 4. What Happens Behind the Scenes

#### File Change Detection

```
You save src/App.tsx
    ↓
Chokidar detects change
    ↓
Check: Is file already being processed?
    ↓ No
Add to processing set
    ↓
Parse React code → Lumora IR
    ↓
Update web preview (browser)
    ↓
Update mobile preview (device)
    ↓
Generate Flutter code (if --codegen)
    ↓
Write to lib/main.dart
    ↓
Wait 1 second
    ↓
Remove from processing set
```

#### Web Preview Auto-Refresh

```
Browser polls /api/status every 1 second
    ↓
Check: Has IR been updated?
    ↓ Yes (lastUpdate timestamp changed)
Reload page
    ↓
Fetch new HTML with updated React code
    ↓
Render new UI
```

### 5. Error Handling

#### Syntax Error in React

**Edit `src/App.tsx` with invalid syntax:**
```tsx
export function App() {
  return <div>Missing closing tag
}
```

**Terminal shows:**
```
🔄 React file changed: App.tsx
  ✗ Error: Unexpected token (3:0)
```

**Browser shows:**
```
Error rendering app
SyntaxError: Unexpected token
```

**Fix the error and save:**
```tsx
export function App() {
  return <div>Fixed!</div>;
}
```

**Terminal shows:**
```
🔄 React file changed: App.tsx
  ✓ Updated Flutter mobile
  ✓ Updated React web
```

**Browser auto-refreshes with fixed UI**

### 6. No Overwriting Manual Files

#### After lumora init

**Files created:**
- `src/App.tsx` - Manual, hand-crafted example
- `lib/main.dart` - Manual, hand-crafted example

**Start with codegen:**
```bash
lumora start --codegen
```

**Terminal shows:**
```
Processing 1 initial file(s)...
✓ Initial setup complete
```

**Check files:**
```bash
cat src/App.tsx
# Still shows original manual content

cat lib/main.dart
# Still shows original manual content
```

**Result:**
- ✅ No overwriting during startup
- ✅ Manual files are safe
- ✅ Generation only happens on changes

### 7. Complete Workflow Example

```bash
# 1. Create project
lumora init todo-app
cd todo-app

# 2. Start development
lumora start --codegen

# 3. Open web preview
open http://localhost:3001
# See: "Welcome to Lumora! 🚀" with counter

# 4. Scan QR code with mobile device
# See: Same UI in native Flutter

# 5. Edit React code
echo 'export function App() { return <div><h1>My Todo App</h1></div>; }' > src/App.tsx

# 6. Watch updates
# Terminal: "✓ Updated Flutter mobile"
# Terminal: "✓ Updated React web"
# Browser: Auto-refreshes, shows "My Todo App"
# Mobile: Instantly shows "My Todo App"

# 7. Check generated Flutter
cat lib/main.dart
# Shows Flutter equivalent

# 8. Edit Flutter code
# Add more widgets to lib/main.dart

# 9. Watch updates
# Terminal: "✓ Updated React web"
# Browser: Auto-refreshes with new content
# Mobile: Instantly updates

# 10. Build for production
flutter build apk
# Uses generated Flutter code
```

### 8. Performance You'll Experience

| Action | Time | Experience |
|--------|------|------------|
| Save React file | < 100ms | Instant |
| Parse to IR | < 200ms | Instant |
| Update web preview | 1-2s | Auto-refresh |
| Update mobile | < 500ms | Instant |
| Generate Flutter code | < 500ms | Instant |
| Total React → Flutter | < 3s | Smooth |

### 9. What You Won't See (Fixed Issues)

❌ **No more status page** - Web preview shows actual UI
❌ **No more infinite loops** - Smart debouncing prevents them
❌ **No more overwriting** - Manual files are safe
❌ **No more broken generation** - Works reliably
❌ **No more confusion** - Clear feedback and instructions

### 10. What You Will See (New Features)

✅ **Interactive web UI** - Buttons work, state updates
✅ **Auto-refresh** - No manual browser refresh needed
✅ **Smart generation** - Only when appropriate
✅ **Clear feedback** - Terminal shows what's happening
✅ **Smooth workflow** - Everything just works

## Summary

Lumora v1.2.0 delivers the Expo-like experience you expect:

1. **Create project**: `lumora init my-app`
2. **Start server**: `lumora start`
3. **See UI**: Browser + mobile, both work
4. **Edit code**: React or Flutter, your choice
5. **Watch magic**: Everything updates automatically

No manual commands, no configuration, no hassle. Just code and see results instantly! 🚀
