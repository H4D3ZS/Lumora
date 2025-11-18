# 🚨 Urgent Update Required - lumora-cli v1.0.1

## If you installed lumora-cli v1.0.0, please update immediately!

### The Problem
Version 1.0.0 had a critical bug that prevented the CLI from running:
```
Error: Cannot find module 'lumora-ir/src/protocol/hot-reload-protocol'
```

### The Fix
Version 1.0.1 fixes this issue and is now available.

### How to Update

```bash
# Update to the latest version
npm install -g lumora-cli@latest

# Or specifically install v1.0.1
npm install -g lumora-cli@1.0.1

# Verify the fix
lumora --version
# Should show: 1.0.1
```

### What Changed
- Fixed TypeScript compilation to use public API imports
- Reduced package size by 43%
- No breaking changes - fully backward compatible

### Verification
After updating, test that it works:
```bash
lumora init test-project
```

This should now work without errors!

---

**We apologize for the inconvenience. Version 1.0.0 was published with a build configuration issue that has been resolved in 1.0.1.**

For questions or issues, please visit: https://github.com/lumora/lumora/issues
