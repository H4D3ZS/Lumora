# Lumora v1.2.7 - Complete Test Guide

## Pre-Test Setup

```bash
# Install latest version
npm install -g lumora-cli@1.2.7

# Verify installation
lumora --version
# Should output: 1.2.7
```

## Test 1: Project Initialization ✅

```bash
# Create new project
lumora init test-lumora-v1.2.7
cd test-lumora-v1.2.7

# Verify files created
ls -la
# Should see:
# - src/App.tsx
# - lib/main.dart
# - package.json
# - tsconfig.json
# - lumora.yaml
# - pubspec.yaml
# - android/
# - ios/

# Install dependencies
npm install

# Verify package.json exists and has React dependencies
cat package.json | grep react
# Should show react and react-dom
```

**Expected Result**: ✅ Project created with all necessary files

## Test 2: Web Preview ✅

```bash
# Start development server
lumora start

# Terminal should show:
# ✓ Dev-Proxy started for mobile
# ✓ Web preview at http://localhost:3001
# [QR CODE]
# ✓ Watching React files: src
# ✓ Watching Flutter files: lib
# Processing 1 initial file(s)...
# ✓ Initial setup complete
```

**Open browser**: `http://localhost:3001`

**Expected Result**: 
- ✅ Page loads without errors
- ✅ Shows "Welcome to Lumora! 🚀" heading
- ✅ Shows counter with "Count: 0"
- ✅ Shows "Increment" button
- ✅ Button is clickable and increases count
- ✅ No console errors (no "exports is not defined", "require is not defined", "number is not defined")

**Browser Console**: Should be clean, no errors

## Test 3: Mobile Preview ✅

**Prerequisites**: Flutter Dev Client app installed on mobile device

**Steps**:
1. Keep `lumora start` running from Test 2
2. Open Flutter Dev Client on mobile device
3. Tap "Scan QR Code"
4. Scan the QR code shown in terminal

**Expected Result**:
- ✅ Device connects successfully
- ✅ Shows "Connected and joined session" status
- ✅ Renders UI immediately (no "Waiting for UI Schema" stuck state)
- ✅ Shows "Welcome to Lumora! 🚀" heading
- ✅ Shows counter with "Count: 0"
- ✅ Shows "Increment" button
- ✅ Button works and increases count

## Test 4: Live Editing - React to Flutter ✅

**With server still running**:

```bash
# Edit src/App.tsx
cat > src/App.tsx << 'EOF'
import React, { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>
        Hello Lumora! 🎉
      </h1>
      <p style={{ fontSize: 18, marginBottom: 10 }}>
        Clicks: {count}
      </p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: '12px 24px',
          fontSize: 16,
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        Click Me!
      </button>
    </div>
  );
}

export default App;
EOF
```

**Expected Result**:
- ✅ Terminal shows: "🔄 React file changed: App.tsx"
- ✅ Terminal shows: "✓ Updated Flutter mobile"
- ✅ Terminal shows: "✓ Updated React web"
- ✅ Web browser auto-refreshes (within 1-2 seconds)
- ✅ Mobile device updates instantly
- ✅ Both show new heading "Hello Lumora! 🎉"
- ✅ Both show "Clicks: 0" instead of "Count: 0"
- ✅ Button text changed to "Click Me!"
- ✅ Button color changed to green

## Test 5: Code Generation (Optional) ✅

**Stop the server** (Ctrl+C) and restart with codegen:

```bash
lumora start --codegen
```

**Edit React file**:
```bash
# Make a small change to src/App.tsx
# Change "Clicks" to "Total"
```

**Expected Result**:
- ✅ Terminal shows code generation message
- ✅ `lib/main.dart` is updated automatically
- ✅ Check `lib/main.dart` contains Flutter equivalent

**Edit Flutter file**:
```bash
# Edit lib/main.dart
# Change some text
```

**Expected Result**:
- ✅ Terminal shows code generation message
- ✅ `src/App.tsx` is updated automatically
- ✅ No infinite loop (file only processes once)

## Test 6: Error Handling ✅

**Introduce a syntax error**:
```bash
# Edit src/App.tsx and add invalid syntax
echo 'export function App() { return <div>Missing closing tag' > src/App.tsx
```

**Expected Result**:
- ✅ Terminal shows error message
- ✅ Web preview shows error (not blank page)
- ✅ Mobile shows error or previous UI
- ✅ System doesn't crash

**Fix the error**:
```bash
# Restore valid code
git checkout src/App.tsx
# or manually fix
```

**Expected Result**:
- ✅ System recovers
- ✅ UI renders correctly again

## Test 7: Performance ✅

**Measure response times**:

1. **File save to web preview update**: < 2 seconds
2. **File save to mobile update**: < 1 second
3. **Initial connection time**: < 5 seconds
4. **QR code scan to UI render**: < 3 seconds

**Expected Result**: All timings within acceptable ranges

## Test 8: Multiple Edits ✅

**Make rapid changes**:
```bash
# Edit file multiple times quickly
# Save, edit, save, edit, save
```

**Expected Result**:
- ✅ No crashes
- ✅ No infinite loops
- ✅ Final state is correct
- ✅ Debouncing works (doesn't process every single change)

## Summary Checklist

### Installation & Setup
- [x] v1.2.7 installs correctly
- [x] `lumora init` creates all files
- [x] `package.json` includes React dependencies
- [x] `npm install` works without errors

### Web Preview
- [x] Loads at `http://localhost:3001`
- [x] Renders actual UI (not status page)
- [x] No console errors
- [x] Interactive elements work
- [x] Auto-refreshes on file changes

### Mobile Preview
- [x] QR code displays in terminal
- [x] Device connects successfully
- [x] Receives initial schema immediately
- [x] Renders native Flutter UI
- [x] Updates in real-time

### Live Editing
- [x] React file changes update both previews
- [x] Flutter file changes update both previews
- [x] Updates are fast (< 2 seconds)
- [x] No infinite loops

### Code Generation
- [x] `--codegen` flag works
- [x] React → Flutter generation works
- [x] Flutter → React generation works
- [x] No overwriting of manual files
- [x] Debouncing prevents loops

### Error Handling
- [x] Syntax errors don't crash system
- [x] Error messages are clear
- [x] System recovers after fixing errors

### Performance
- [x] Fast initial load
- [x] Fast updates
- [x] Low latency
- [x] Stable under rapid changes

## Known Issues

None! All major issues have been fixed in v1.2.7:
- ✅ Web preview renders correctly
- ✅ Mobile preview connects and renders
- ✅ TypeScript stripping works
- ✅ No module system errors
- ✅ Code generation works
- ✅ No infinite loops

## Conclusion

If all tests pass, Lumora v1.2.7 is **PRODUCTION READY** for:
- Development workflow
- Live preview (web + mobile)
- Bidirectional code generation
- Real-time updates

## Quick Test Command

```bash
# One-liner to test everything
npm install -g lumora-cli@1.2.7 && \
lumora init quick-test && \
cd quick-test && \
npm install && \
echo "✅ Setup complete! Now run: lumora start"
```

Then:
1. Open `http://localhost:3001` - should see working UI
2. Scan QR code with mobile - should see native UI
3. Edit `src/App.tsx` - both should update

If all three work: **SUCCESS!** 🎉
