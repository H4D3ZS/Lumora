# GitHub Workflow Fixes

## Issues Fixed

### 1. Missing npm Lock Files ✅

**Problem**: GitHub Actions was looking for `package-lock.json` files in individual package directories, but with npm workspaces, there's only one lock file at the root.

**Solution**: 
- Removed `cache: 'npm'` from all `setup-node` actions in CI workflow
- Changed from `npm ci` to `npm install` (workspaces handle dependencies centrally)
- The root `package-lock.json` is sufficient for the entire monorepo

**Files Modified**:
- `.github/workflows/ci.yml`

### 2. Incorrect Package Name Reference ✅

**Problem**: `packages/kiro_core/pubspec.yaml` was referencing `kiro_ui_tokens` but the actual package name is `lumora_ui_tokens`.

**Error Message**:
```
Error on line 1, column 7 of ../lumora_ui_tokens/pubspec.yaml: 
"name" field doesn't match expected name "kiro_ui_tokens".
```

**Solution**:
- Updated `packages/kiro_core/pubspec.yaml` to reference `lumora_ui_tokens`
- Updated import statements in Dart files to use correct package name
- The library file `kiro_ui_tokens.dart` remains the same (it's the export file name)

**Files Modified**:
- `packages/kiro_core/pubspec.yaml`
- `packages/kiro_core/lib/src/schema_interpreter.dart`
- `packages/lumora_ui_tokens/example/design_tokens_example.dart`

## Changes Made

### 1. CI Workflow (.github/workflows/ci.yml)

**Before**:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18.x'
    cache: 'npm'  # ❌ This requires lock files in each directory

- name: Install dependencies
  run: npm ci  # ❌ Doesn't work with workspaces
```

**After**:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18.x'
    # ✅ No cache option

- name: Install dependencies
  run: npm install  # ✅ Works with workspaces
```

### 2. Package Dependencies (packages/kiro_core/pubspec.yaml)

**Before**:
```yaml
dependencies:
  kiro_ui_tokens:  # ❌ Wrong package name
    path: ../kiro_ui_tokens  # ❌ Wrong path
```

**After**:
```yaml
dependencies:
  lumora_ui_tokens:  # ✅ Correct package name
    path: ../lumora_ui_tokens  # ✅ Correct path
```

### 3. Import Statements

**Before**:
```dart
import 'package:kiro_ui_tokens/kiro_ui_tokens.dart';  // ❌ Wrong package name
```

**After**:
```dart
import 'package:lumora_ui_tokens/kiro_ui_tokens.dart';  // ✅ Correct package name
```

## Why These Changes Work

### NPM Workspaces Behavior

When using npm workspaces (defined in root `package.json`):
```json
{
  "workspaces": [
    "tools/*",
    "packages/*"
  ]
}
```

- All dependencies are hoisted to the root `node_modules`
- Only one `package-lock.json` at the root
- `npm install` at root installs all workspace dependencies
- Individual packages don't need their own lock files

### Flutter Package Naming

In Flutter/Dart:
- The `name` field in `pubspec.yaml` is the package identifier
- Import statements use the package name: `package:<name>/<file>.dart`
- The library file name (e.g., `kiro_ui_tokens.dart`) can be different from the package name
- Dependencies reference the package name, not the library file name

## Verification

### Test Locally

```bash
# Test npm workspace setup
npm install
npm test

# Test Flutter packages
cd packages/kiro_core
flutter pub get
flutter analyze
flutter test

cd ../lumora_ui_tokens
flutter pub get
flutter analyze
flutter test
```

### Expected CI Results

All jobs should now pass:
- ✅ Test NPM Packages (16.x, 18.x, 20.x)
- ✅ Test Dart Packages
- ✅ Code Quality Checks
- ✅ Build Verification
- ✅ Security Scan
- ✅ Code Coverage

## Additional Notes

### Lock File Strategy

For npm workspaces, we have two options:

**Option 1: No Caching (Current)**
- Simpler setup
- No cache configuration needed
- Slightly slower CI (downloads packages each time)

**Option 2: Cache with Root Lock File**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18.x'
    cache: 'npm'
    cache-dependency-path: 'package-lock.json'  # Specify root lock file
```

We chose Option 1 for simplicity, but Option 2 can be implemented later for faster CI runs.

### Package Naming Consistency

To avoid future confusion, consider:

1. **Rename library file** to match package name:
   - Rename `kiro_ui_tokens.dart` → `lumora_ui_tokens.dart`
   - Update all imports

2. **Or rename package** to match library file:
   - Rename package `lumora_ui_tokens` → `kiro_ui_tokens`
   - Update all references

For now, we've kept the current naming (package: `lumora_ui_tokens`, library: `kiro_ui_tokens.dart`) as it requires fewer changes.

## Files Changed Summary

```
Modified:
  .github/workflows/ci.yml
  packages/kiro_core/pubspec.yaml
  packages/kiro_core/lib/src/schema_interpreter.dart
  packages/lumora_ui_tokens/example/design_tokens_example.dart

No changes needed:
  package.json (already has workspaces configured)
  package-lock.json (already exists at root)
  packages/lumora_ui_tokens/pubspec.yaml (name is correct)
```

## Next Steps

1. ✅ Commit these changes
2. ✅ Push to GitHub
3. ✅ Verify CI passes
4. ✅ Proceed with publishing

## Troubleshooting

If CI still fails:

### Check npm workspace setup
```bash
npm ls --depth=0
```

### Check Flutter dependencies
```bash
cd packages/kiro_core
flutter pub deps
```

### Verify package names
```bash
grep -r "kiro_ui_tokens" packages/
grep -r "lumora_ui_tokens" packages/
```

---

**Status**: ✅ All issues fixed and ready for CI
**Date**: 2024-01-XX
**Impact**: GitHub Actions workflow should now pass successfully
