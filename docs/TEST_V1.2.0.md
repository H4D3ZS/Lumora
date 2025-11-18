# Testing Lumora v1.2.0

## Pre-Test Checklist

- [x] Built lumora-ir package
- [x] Built lumora-cli package
- [x] Updated version to 1.2.0
- [x] Updated CHANGELOG.md
- [x] Created release notes

## Test Plan

### Test 1: Web Preview Renders UI ✅

**Steps**:
1. Create new project: `lumora init test-web-preview`
2. Navigate: `cd test-web-preview`
3. Start server: `lumora start`
4. Open browser: `http://localhost:3001`

**Expected**:
- Browser shows "Welcome to Lumora! 🚀" heading
- Counter shows "Count: 0"
- "Increment" button is visible
- Clicking button increases count
- UI is interactive and styled

**Actual**:
- [ ] Heading displays correctly
- [ ] Counter shows initial value
- [ ] Button is clickable
- [ ] State updates work
- [ ] Styling is applied

### Test 2: Web Preview Auto-Refresh ✅

**Steps**:
1. With server running from Test 1
2. Edit `src/App.tsx`
3. Change heading to "Hello World!"
4. Save file
5. Watch browser

**Expected**:
- Browser auto-refreshes within 1-2 seconds
- New heading "Hello World!" appears
- No manual refresh needed

**Actual**:
- [ ] Auto-refresh triggered
- [ ] New content displays
- [ ] No errors in console

### Test 3: Code Generation After Init ✅

**Steps**:
1. Create new project: `lumora init test-codegen`
2. Navigate: `cd test-codegen`
3. Check files exist: `ls src/App.tsx lib/main.dart`
4. Start with codegen: `lumora start --codegen`
5. Verify no overwriting

**Expected**:
- Both `src/App.tsx` and `lib/main.dart` exist
- Files are NOT overwritten on startup
- Manual content is preserved

**Actual**:
- [ ] src/App.tsx exists and unchanged
- [ ] lib/main.dart exists and unchanged
- [ ] No "Generated" messages on startup

### Test 4: React → Flutter Generation ✅

**Steps**:
1. With server running from Test 3
2. Edit `src/App.tsx`:
   ```tsx
   export function App() {
     return <div><h1>Test Generation</h1></div>;
   }
   ```
3. Save file
4. Check `lib/main.dart`

**Expected**:
- `lib/main.dart` updates automatically
- Contains Flutter equivalent of React code
- No infinite loop

**Actual**:
- [ ] lib/main.dart updated
- [ ] Contains generated Flutter code
- [ ] No repeated updates
- [ ] Terminal shows generation message

### Test 5: Flutter → React Generation ✅

**Steps**:
1. With server running from Test 3
2. Edit `lib/main.dart`:
   ```dart
   Text('Flutter Test')
   ```
3. Save file
4. Check `src/App.tsx`

**Expected**:
- `src/App.tsx` updates automatically
- Contains React equivalent of Flutter code
- No infinite loop

**Actual**:
- [ ] src/App.tsx updated
- [ ] Contains generated React code
- [ ] No repeated updates
- [ ] Terminal shows generation message

### Test 6: No Infinite Loops ✅

**Steps**:
1. With server running from Test 3
2. Edit `src/App.tsx`
3. Save file
4. Watch terminal for 10 seconds

**Expected**:
- File processes once
- No repeated "File changed" messages
- Debouncing works

**Actual**:
- [ ] Single processing message
- [ ] No repeated updates
- [ ] System stable after 10 seconds

### Test 7: Mobile Preview Still Works ✅

**Steps**:
1. Start server: `lumora start --qr`
2. Check terminal for QR code
3. Scan with Lumora Dev Client (if available)

**Expected**:
- QR code displays in terminal
- Mobile app can connect
- UI renders on device

**Actual**:
- [ ] QR code visible
- [ ] Connection URL shown
- [ ] (Optional) Mobile app connects

### Test 8: Web Preview Fallback UI ✅

**Steps**:
1. Create empty project: `lumora init test-empty`
2. Delete `src/App.tsx`
3. Start server: `lumora start`
4. Open browser: `http://localhost:3001`

**Expected**:
- Browser shows fallback UI
- "Getting Started" instructions visible
- No errors or blank page

**Actual**:
- [ ] Fallback UI displays
- [ ] Instructions are clear
- [ ] No console errors

## Performance Tests

### Test 9: Auto-Refresh Latency ✅

**Steps**:
1. Start server with web preview
2. Edit file and save
3. Measure time until browser updates

**Expected**:
- Update within 1-2 seconds
- Smooth refresh, no flicker

**Actual**:
- [ ] Latency: _____ seconds
- [ ] Smooth transition

### Test 10: Code Generation Speed ✅

**Steps**:
1. Start server with `--codegen`
2. Edit file and save
3. Measure time until target file updates

**Expected**:
- Generation within 500ms
- No lag or delay

**Actual**:
- [ ] Generation time: _____ ms
- [ ] No noticeable delay

## Edge Cases

### Test 11: Large Files ✅

**Steps**:
1. Create large React component (500+ lines)
2. Save file
3. Check web preview and generation

**Expected**:
- Handles large files gracefully
- No timeout or crash

**Actual**:
- [ ] Web preview works
- [ ] Generation completes
- [ ] No errors

### Test 12: Syntax Errors ✅

**Steps**:
1. Edit `src/App.tsx` with invalid syntax
2. Save file
3. Check web preview

**Expected**:
- Error message displays
- System doesn't crash
- Can recover after fixing

**Actual**:
- [ ] Error shown in browser
- [ ] Terminal shows error
- [ ] System recovers

### Test 13: Rapid File Changes ✅

**Steps**:
1. Start server with `--codegen`
2. Edit file multiple times quickly
3. Save repeatedly

**Expected**:
- Debouncing prevents multiple processing
- System remains stable
- Final state is correct

**Actual**:
- [ ] No duplicate processing
- [ ] System stable
- [ ] Correct final output

## Regression Tests

### Test 14: Init Command ✅

**Steps**:
1. Run: `lumora init test-init`
2. Check created files

**Expected**:
- All files created correctly
- No errors during init
- Project structure is correct

**Actual**:
- [ ] src/ directory exists
- [ ] lib/ directory exists
- [ ] package.json correct
- [ ] tsconfig.json correct
- [ ] lumora.yaml correct

### Test 15: Version Command ✅

**Steps**:
1. Run: `lumora --version`

**Expected**:
- Shows "1.2.0"

**Actual**:
- [ ] Version: _____

### Test 16: Help Command ✅

**Steps**:
1. Run: `lumora --help`

**Expected**:
- Shows all commands
- No errors

**Actual**:
- [ ] Help displays
- [ ] Commands listed

## Summary

### Passing Tests: __ / 16

### Critical Issues Found:
- None expected (this is a bug fix release)

### Minor Issues Found:
- (List any minor issues)

### Performance Notes:
- Web preview latency: _____ seconds
- Code generation speed: _____ ms
- Memory usage: _____ MB

### Ready for Release?
- [ ] All tests passing
- [ ] No critical issues
- [ ] Performance acceptable
- [ ] Documentation complete

## Notes

(Add any additional observations or notes here)
