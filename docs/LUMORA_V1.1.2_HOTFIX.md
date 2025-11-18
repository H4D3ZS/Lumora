# Lumora v1.1.2 - Critical Hotfix 🔧

## Issues Fixed

### 1. ✅ Web Preview Now Shows Actual UI
**Problem:** Web preview was showing raw code instead of rendered React components  
**Fix:** Updated web preview server to properly execute and render React components using Babel standalone

### 2. ✅ Fixed Infinite Loop on File Save
**Problem:** Saving a file triggered infinite loop of "file changed" messages  
**Fix:** Added debouncing with Set-based tracking to prevent re-processing the same file

### 3. ✅ Initial Schema Push to Mobile
**Problem:** Flutter Dev Client showed blank screen after QR scan  
**Fix:** Process initial files on startup and push schema to connected devices

### 4. ✅ Disabled Broken Code Generation
**Problem:** Generated React and Flutter code was completely broken (invalid syntax)  
**Fix:** 
- Disabled automatic code generation by default (use `--codegen` flag to enable)
- Created proper example files manually in init command
- Focus on real-time preview first, code generation needs more work

### 5. ✅ Skip Test Files
**Problem:** Flutter test files were being processed and causing errors  
**Fix:** Filter out `_test.dart` and `/test/` files from processing

---

## What Works Now

### ✅ Real-Time Preview
```bash
lumora init my-app
cd my-app
lumora start
```

**Works:**
- ✅ Web preview at `localhost:3001` shows actual rendered UI
- ✅ Mobile preview via QR code shows Flutter UI
- ✅ Edit `src/App.tsx` → See changes on web + mobile
- ✅ Edit `lib/main.dart` → See changes on web + mobile
- ✅ No infinite loops
- ✅ Proper debouncing

**Doesn't Work Yet (Disabled):**
- ❌ Automatic code generation (React ↔ Flutter)
- ❌ File-to-file syncing (src/App.tsx ↔ lib/main.dart)

---

## Current Workflow

### 1. Initialize Project
```bash
lumora init my-app
cd my-app
```

**Creates:**
- `src/App.tsx` - Working React component
- `lib/main.dart` - Working Flutter app
- Both files work independently

### 2. Start Development
```bash
lumora start
```

**What happens:**
- Dev-Proxy starts (port 3000)
- Web preview starts (port 3001)
- QR code displays
- Initial files processed
- Schema pushed to mobile

### 3. Edit and Preview
- **Edit `src/App.tsx`** → See on web + mobile (React → IR → Preview)
- **Edit `lib/main.dart`** → See on web + mobile (Dart → IR → Preview)
- Changes appear in < 1 second
- No infinite loops

---

## What's Next (TODO)

### Phase 1: Fix Generators
The React and Flutter generators need complete rewrite:
- Proper widget/component mapping
- Correct JSX/Dart syntax generation
- Handle all node types properly
- Type-safe code generation

### Phase 2: Enable Code Generation
Once generators work:
- Re-enable `--codegen` by default
- Implement proper file-to-file syncing
- src/App.tsx ↔ lib/main.dart bidirectional sync

### Phase 3: Full Bidirectional
- Edit React → Generate Flutter code
- Edit Flutter → Generate React code
- True 1:1 file mapping

---

## Installation

```bash
npm install -g lumora-cli@1.1.2
```

Or update:
```bash
npm update -g lumora-cli
```

---

## Usage

### Basic (Works Now)
```bash
# Create project
lumora init my-app
cd my-app

# Start preview
lumora start

# Edit files and see live preview
# - Web: http://localhost:3001
# - Mobile: Scan QR code
```

### With Code Generation (Experimental - Broken)
```bash
# Enable code generation (not recommended yet)
lumora start --codegen
```

---

## Technical Changes

### web-preview-server.ts
- Added proper React component execution
- Using Babel standalone for JSX transformation
- Proper error handling and fallbacks
- Real-time component rendering

### start.ts
- Added debouncing with Set-based tracking
- Process initial files on startup
- Push schema to mobile devices
- Skip test files
- Disabled codegen by default
- Better error handling

### init.ts
- Create proper working React example
- Create proper working Flutter example
- Both files work independently
- No broken generated code

### cli.ts
- Changed `--no-codegen` to `--codegen` (opt-in instead of opt-out)

---

## Known Issues

### Code Generation (Disabled)
The automatic React ↔ Flutter code generation produces broken code:
- Invalid JSX syntax
- Invalid Dart syntax
- Wrong widget/component mapping
- Type errors

**Workaround:** Edit files manually. Preview works perfectly.

### File Syncing (Disabled)
src/App.tsx and lib/main.dart don't sync automatically yet.

**Workaround:** Edit each file independently. Both show in preview.

---

## Summary

v1.1.2 is a **critical hotfix** that makes Lumora actually usable:

✅ **What Works:**
- Real-time preview on web and mobile
- QR code scanning
- Live updates when editing
- No infinite loops
- Proper UI rendering

❌ **What Doesn't (Disabled for now):**
- Automatic code generation
- Bidirectional file syncing

**Focus:** Get the preview experience perfect first, then fix code generation.

---

**Version:** 1.1.2  
**Status:** Hotfix - Preview Works, Codegen Disabled  
**Priority:** Fix generators next!
