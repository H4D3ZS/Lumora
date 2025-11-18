# CRITICAL BUG: Web Preview Showing Flutter Code

## Issue Discovered

When running `lumora start`, the web preview at `http://localhost:3001` is showing **Flutter code mixed with React**, resulting in invalid JSX like:

```jsx
<MaterialApp title="Lumora App" theme="ThemeData(...)" />
<div children="Center(child: Padding(...))" />
```

## Root Cause

In `packages/lumora-cli/src/commands/start.ts`, the initial file processing handles BOTH React and Flutter files:

1. Processes React files → Updates `webPreview.updateIR(ir)` with React IR
2. Processes Flutter files → Updates `webPreview.updateIR(ir)` with Flutter IR ❌

The Flutter IR **overwrites** the React IR, so the web preview tries to render Flutter widgets as React components.

## The Problem

```typescript
// React files processed first
if (initialFiles.length > 0) {
  for (const file of initialFiles) {
    const ir = reactParser.parse(code, file);
    webPreview.updateIR(ir); // ✅ Sets React IR
  }
}

// Flutter files processed second
if (initialFiles.length > 0) {
  for (const file of initialFiles) {
    const ir = dartParser.parse(code, file);
    webPreview.updateIR(ir); // ❌ OVERWRITES with Flutter IR!
  }
}
```

## The Fix

**Web preview should ONLY use React IR, never Flutter IR.**

### Solution 1: Don't update web preview from Flutter files

```typescript
// Flutter file processing
const ir = dartParser.parse(code, file);
devProxy.pushSchemaUpdate(session.id, ir, true); // ✅ Update mobile
// webPreview.updateIR(ir); // ❌ DON'T update web preview
```

### Solution 2: Separate IR for web and mobile

```typescript
let webIR: LumoraIR | null = null;
let mobileIR: LumoraIR | null = null;

// React files
webIR = reactParser.parse(reactCode);
webPreview.updateIR(webIR); // Web gets React

// Flutter files  
mobileIR = dartParser.parse(flutterCode);
devProxy.pushSchemaUpdate(sessionId, mobileIR); // Mobile gets Flutter
```

## Impact

**CRITICAL** - Web preview is completely broken:
- Shows invalid JSX mixing Flutter and React
- Browser console errors
- UI doesn't render correctly
- Defeats the purpose of web preview

## Affected Versions

- v1.2.0 through v1.2.7

## Workaround

Currently, there's no workaround. The web preview will always show Flutter code if both React and Flutter files exist.

## Recommended Fix

**Immediate**: Update `start.ts` to NOT call `webPreview.updateIR()` when processing Flutter files.

```typescript
// In Flutter file watcher
const ir = dartParser.parse(code, file);
devProxy.pushSchemaUpdate(session.id, ir, true); // Mobile only
// Remove: webPreview.updateIR(ir);
```

## Test Case

1. Run `lumora init test-app`
2. Run `lumora start`
3. Open `http://localhost:3001`
4. **Expected**: Shows React UI from `src/App.tsx`
5. **Actual**: Shows Flutter widgets from `lib/main.dart` (WRONG!)

## Status

🔴 **CRITICAL BUG** - Needs immediate fix in v1.2.8
