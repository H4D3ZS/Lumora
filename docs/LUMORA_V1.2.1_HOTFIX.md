# Lumora v1.2.1 - Hotfix: Flutter Dev Client Connection

## Issue Fixed

**Problem**: Flutter Dev Client was stuck on "Waiting for UI Schema" after connecting to the dev-proxy server.

**Root Cause**: The initial schema was being batched with a delay, so when the device connected immediately after starting the server, `session.currentSchema` was still `null`. The device received a `connected` message with `initialSchema: null` and got stuck waiting.

**Solution**: Modified the initial file processing to:
1. Process all initial files first
2. Push the last IR to the session
3. Wait 100ms for the schema to be flushed to the session before showing the QR code
4. This ensures `session.currentSchema` is set before any device connects

## Changes

### packages/lumora-cli/src/commands/start.ts

**React Files Processing**:
- Store the last IR from initial file processing
- Push it to the session after all files are processed
- Wait 100ms for the batch to flush before continuing
- This ensures devices connecting via QR code receive the initial schema immediately

**Flutter Files Processing**:
- Same fix applied to Flutter file processing
- Ensures bidirectional sync works properly

## Technical Details

### Before (v1.2.0)
```typescript
// Process files and push immediately (but batched)
for (const file of initialFiles) {
  const ir = parse(file);
  devProxy.pushSchemaUpdate(session.id, ir, true); // Batched with delay
  webPreview.updateIR(ir);
}
// QR code shown immediately
// Device connects → session.currentSchema is still null → stuck waiting
```

### After (v1.2.1)
```typescript
// Process files and collect last IR
let lastIR = null;
for (const file of initialFiles) {
  const ir = parse(file);
  lastIR = ir;
  webPreview.updateIR(ir); // Update web immediately
}

// Push last IR and wait for flush
if (lastIR) {
  devProxy.pushSchemaUpdate(session.id, lastIR, true);
  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for flush
}

// Now QR code is shown
// Device connects → session.currentSchema is set → receives initial schema → renders UI
```

## Testing

### Test Case 1: Fresh Project
```bash
lumora init test-hotfix
cd test-hotfix
lumora start
# Scan QR code
# Expected: Device shows UI immediately, not stuck on "Waiting for UI Schema"
```

### Test Case 2: Existing Project
```bash
cd existing-project
lumora start
# Scan QR code
# Expected: Device shows UI immediately
```

### Test Case 3: Multiple Files
```bash
# Project with multiple src/*.tsx files
lumora start
# Expected: Last file's UI is shown on device
```

## Impact

- ✅ Fixes the "stuck on connecting" issue
- ✅ Devices now receive initial schema immediately
- ✅ No breaking changes
- ✅ Backward compatible

## Version

- **Previous**: 1.2.0
- **Current**: 1.2.1
- **Type**: Hotfix

## Installation

```bash
npm update -g lumora-cli
# or
npm install -g lumora-cli@1.2.1
```

## Verification

```bash
lumora --version
# Should output: 1.2.1
```

## Files Modified

1. `packages/lumora-cli/src/commands/start.ts` - Fixed initial schema timing
2. `packages/lumora-cli/package.json` - Version bump to 1.2.1

## Status

- [x] Code fixed
- [x] Built successfully
- [x] Version bumped
- [x] Ready to publish

## Publish

```bash
cd packages/lumora-cli
npm publish
```
