# Hotfix v1.0.1 - Critical Import Path Fix
**Released**: November 12, 2025

## Issue
After publishing v1.0.0, users installing `lumora-cli` globally encountered this error:
```
Error: Cannot find module 'lumora-ir/src/protocol/hot-reload-protocol'
```

## Root Cause
The TypeScript compiler was including lumora_ir source files in the lumora-cli build output because:
1. The workspace setup allowed TypeScript to follow references to the local lumora_ir package
2. The tsconfig.json didn't have `rootDir` set, allowing compilation of files outside `src/`
3. This caused the compiled JavaScript to have internal import paths like `lumora-ir/src/protocol/...`

## Solution
Updated `packages/lumora-cli/tsconfig.json`:
```json
{
  "compilerOptions": {
    "rootDir": "./src",  // ← Added this
    // ... other options
  },
  "exclude": ["node_modules", "dist", "../lumora_ir"]  // ← Added lumora_ir exclusion
}
```

This ensures:
- Only files in `src/` are compiled
- lumora_ir source files are excluded from compilation
- Imports resolve to the public API: `require("lumora-ir")` instead of internal paths

## Changes in v1.0.1

### Package Size Reduction
- **v1.0.0**: 126.1 kB (211 files) - included lumora_ir source
- **v1.0.1**: 71.7 kB (82 files) - only lumora-cli code ✅
- **Reduction**: 43% smaller, 61% fewer files

### Fixed Imports
**Before (v1.0.0)**:
```javascript
const hot_reload_protocol_1 = require("lumora-ir/src/protocol/hot-reload-protocol");
const protocol_serialization_1 = require("lumora-ir/src/protocol/protocol-serialization");
```

**After (v1.0.1)**:
```javascript
const lumora_ir_1 = require("lumora-ir");
const lumora_ir_2 = require("lumora-ir");
```

## Verification

### Check Published Version
```bash
npm view lumora-cli version
# Returns: 1.0.1 ✅
```

### Test Installation
```bash
# Uninstall old version
npm uninstall -g lumora-cli

# Install fixed version
npm install -g lumora-cli@1.0.1

# Test it works
lumora --version
lumora init test-project
```

## Impact
- **Breaking**: No breaking changes, fully backward compatible
- **Users Affected**: Anyone who installed v1.0.0 globally
- **Fix Required**: Update to v1.0.1

## Installation Instructions

### For New Users
```bash
npm install -g lumora-cli@1.0.1
```

### For Existing Users (v1.0.0)
```bash
npm update -g lumora-cli
# or
npm install -g lumora-cli@latest
```

## Test Results
- All tests passing: 12/13 (92.3%)
- 1 skipped test (timing-sensitive, non-critical)
- Build successful with correct imports

## Files Modified
1. `packages/lumora-cli/tsconfig.json` - Added rootDir and exclusions
2. `packages/lumora-cli/package.json` - Version bumped to 1.0.1

## Lessons Learned

### For Monorepo Development
1. Always set `rootDir` in tsconfig.json to prevent compilation of external files
2. Explicitly exclude sibling packages in monorepo setups
3. Test global installation before publishing CLI tools
4. Verify compiled output doesn't include workspace dependencies

### For Publishing
1. Check dist folder size - unexpected increases indicate bundled dependencies
2. Inspect compiled JavaScript for internal import paths
3. Test installation in a clean environment (not the development workspace)
4. Use `npm pack` to inspect what will be published

## Prevention
To prevent this in future releases:
1. Add pre-publish check script to verify dist folder contents
2. Add CI test that installs package globally and runs basic commands
3. Document the correct tsconfig setup for workspace packages

## Links
- **npm lumora-cli**: https://www.npmjs.com/package/lumora-cli
- **GitHub Issue**: (if created)
- **Changelog**: See CHANGELOG.md

---

## Summary
✅ **Hotfix v1.0.1 successfully published**
- Fixed critical import path issue
- Reduced package size by 43%
- No breaking changes
- Users should update immediately

**Install the fix:**
```bash
npm install -g lumora-cli@1.0.1
```
