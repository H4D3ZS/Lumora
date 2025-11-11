# Publishing Commands Cheat Sheet

Quick copy-paste commands for publishing Lumora v1.0.0

## 🚀 Automated Publishing (Easiest)

```bash
# Dry run first
./scripts/publish.sh --version 1.0.0 --dry-run

# Actual publish
./scripts/publish.sh --version 1.0.0
```

## 🔧 Manual Publishing Commands

### Pre-Flight Checks

```bash
# Check git status
git status

# Check npm login
npm whoami

# Check Flutter pub login (if publishing Flutter packages)
flutter pub login
```

### Run All Tests

```bash
# TypeScript tests
(cd packages/lumora_ir && npm test)
(cd packages/lumora-cli && npm test)

# Flutter tests
(cd apps/flutter-dev-client && flutter test)
(cd packages/kiro_ui_tokens && flutter test)
```

### Build All Packages

```bash
# Build TypeScript packages
(cd packages/lumora_ir && npm run build)
(cd packages/lumora-cli && npm run build)

# Analyze Flutter packages
(cd apps/flutter-dev-client && flutter analyze)
(cd packages/kiro_ui_tokens && flutter analyze)
```

### Update Version Numbers

```bash
# Root package
npm version 1.0.0 --no-git-tag-version

# NPM packages
(cd packages/lumora_ir && npm version 1.0.0 --no-git-tag-version)
(cd packages/lumora-cli && npm version 1.0.0 --no-git-tag-version)

# Flutter packages (manual edit required)
# Edit: apps/flutter-dev-client/pubspec.yaml -> version: 1.0.0+1
# Edit: packages/kiro_ui_tokens/pubspec.yaml -> version: 1.0.0
```

### Git Commit and Tag

```bash
# Add all changes
git add .

# Commit
git commit -m "Release v1.0.0: Performance optimizations

- Add comprehensive caching across interpreter and parsers
- Optimize hot reload with batching and faster delta calculation
- Improve performance by 40-90% across all components
- Add cache management APIs and monitoring
- Update documentation with performance metrics"

# Create tag
git tag -a v1.0.0 -m "Release v1.0.0: Performance Optimizations

Major performance improvements:
- 50% faster schema interpretation
- 90% faster parsing (cached)
- 40% faster hot reload
- 70% faster delta calculation

See CHANGELOG.md for full details."
```

### Publish to NPM

```bash
# Publish lumora-ir
(cd packages/lumora_ir && npm publish --access public)

# Publish lumora-cli
(cd packages/lumora-cli && npm publish --access public)
```

### Publish to Pub.dev (Optional)

```bash
# Dry run first
(cd packages/kiro_ui_tokens && flutter pub publish --dry-run)

# Actual publish
(cd packages/kiro_ui_tokens && flutter pub publish)
```

### Push to Git

```bash
# Push commits
git push origin main

# Push tag
git push origin v1.0.0
```

### Create GitHub Release

```bash
# Using GitHub CLI
gh release create v1.0.0 \
  --title "Lumora v1.0.0 - Performance Optimizations" \
  --notes-file RELEASE_NOTES.md \
  --latest

# Or manually visit:
# https://github.com/your-org/lumora/releases/new
```

## ✅ Verification Commands

### Verify NPM Packages

```bash
# Check versions
npm view lumora-ir version
npm view lumora-cli version

# Check package info
npm info lumora-ir
npm info lumora-cli

# Test installation
npm install -g lumora-cli@1.0.0
lumora --version
```

### Verify Pub.dev Packages

```bash
# Visit package pages
open https://pub.dev/packages/kiro_ui_tokens

# Or check with Flutter
flutter pub outdated
```

### Verify Git

```bash
# Check tags
git tag -l

# Check remote
git ls-remote --tags origin

# View release
gh release view v1.0.0
```

## 🔄 Rollback Commands

### Unpublish from NPM (within 72 hours)

```bash
# Unpublish packages
npm unpublish lumora-ir@1.0.0
npm unpublish lumora-cli@1.0.0
```

### Deprecate on NPM

```bash
# Deprecate with message
npm deprecate lumora-ir@1.0.0 "Critical issue, use 0.1.0-alpha.1 instead"
npm deprecate lumora-cli@1.0.0 "Critical issue, use 0.1.0-alpha.1 instead"
```

### Revert Git

```bash
# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0

# Revert commit
git revert HEAD
git push origin main
```

## 📦 Post-Publishing Commands

### Update Example Apps

```bash
# Todo app
(cd examples/todo-app && npm install lumora-cli@latest lumora-ir@latest && flutter pub upgrade)

# Chat app
(cd examples/chat-app && npm install lumora-cli@latest lumora-ir@latest && flutter pub upgrade)
```

### Test Installation

```bash
# Create test directory
mkdir /tmp/lumora-test && cd /tmp/lumora-test

# Install packages
npm install lumora-cli@1.0.0 lumora-ir@1.0.0

# Test CLI
npx lumora --version

# Cleanup
cd ~ && rm -rf /tmp/lumora-test
```

### Monitor Downloads

```bash
# NPM download stats
npm info lumora-ir
npm info lumora-cli

# Or visit:
# https://www.npmjs.com/package/lumora-ir
# https://www.npmjs.com/package/lumora-cli
```

## 🐛 Debug Commands

### Check Package Contents

```bash
# See what will be published
(cd packages/lumora_ir && npm pack --dry-run)
(cd packages/lumora-cli && npm pack --dry-run)

# Create tarball to inspect
(cd packages/lumora_ir && npm pack)
tar -tzf lumora-ir-1.0.0.tgz
rm lumora-ir-1.0.0.tgz
```

### Check Git Status

```bash
# Detailed status
git status -v

# Show unpushed commits
git log origin/main..HEAD

# Show unpushed tags
git tag -l | while read tag; do
  git rev-parse $tag >/dev/null 2>&1 && \
  git ls-remote --tags origin | grep -q $tag || echo "$tag (not pushed)"
done
```

### Check Dependencies

```bash
# Check for outdated dependencies
(cd packages/lumora_ir && npm outdated)
(cd packages/lumora-cli && npm outdated)

# Check for security issues
(cd packages/lumora_ir && npm audit)
(cd packages/lumora-cli && npm audit)
```

## 📊 Performance Verification

### Run Performance Tests

```bash
# Interpreter performance
(cd apps/flutter-dev-client && flutter test test/interpreter_performance_test.dart)

# Parser performance
(cd packages/lumora_ir && npm test -- parser-performance.test.ts)

# Hot reload performance
(cd packages/lumora-cli && npm test -- hot-reload-batching.test.ts)
```

### Check Cache Statistics

```bash
# Run with cache monitoring
(cd packages/lumora_ir && npm test -- cache-test.ts)
```

## 🎯 One-Liner Commands

```bash
# Full test suite
npm test && (cd packages/lumora_ir && npm test) && (cd packages/lumora-cli && npm test) && (cd apps/flutter-dev-client && flutter test)

# Full build
(cd packages/lumora_ir && npm run build) && (cd packages/lumora-cli && npm run build)

# Publish all NPM packages
(cd packages/lumora_ir && npm publish --access public) && (cd packages/lumora-cli && npm publish --access public)

# Verify all NPM packages
npm view lumora-ir version && npm view lumora-cli version
```

## 📝 Notes

- Always run dry-run first: `--dry-run`
- Check npm login: `npm whoami`
- Verify git status: `git status`
- Test locally before publishing
- Keep backup of current state

## 🆘 Help

If commands fail:
1. Check `PUBLISHING.md` for detailed instructions
2. Review `PRE_PUBLISH_CHECKLIST.md`
3. Contact: support@lumora.dev

---

**Quick Tip**: Copy entire command blocks and paste into terminal for batch execution.
