# Quick Publishing Guide

Fast reference for publishing Lumora v1.0.0

## Prerequisites

```bash
# Ensure you're logged in
npm whoami
flutter pub login  # If publishing Flutter packages

# Ensure working directory is clean
git status
```

## Option 1: Automated Publishing (Recommended)

```bash
# Dry run first to verify everything
./scripts/publish.sh --version 1.0.0 --dry-run

# If dry run looks good, publish for real
./scripts/publish.sh --version 1.0.0
```

## Option 2: Manual Publishing

### Step 1: Test Everything

```bash
# TypeScript tests
cd packages/lumora_ir && npm test && cd ../..
cd packages/lumora-cli && npm test && cd ../..

# Flutter tests
cd apps/flutter-dev-client && flutter test && cd ../..
cd packages/kiro_ui_tokens && flutter test && cd ../..
```

### Step 2: Build Packages

```bash
cd packages/lumora_ir && npm run build && cd ../..
cd packages/lumora-cli && npm run build && cd ../..
```

### Step 3: Update Versions

```bash
# Update npm packages
npm version 1.0.0 --no-git-tag-version
cd packages/lumora_ir && npm version 1.0.0 --no-git-tag-version && cd ../..
cd packages/lumora-cli && npm version 1.0.0 --no-git-tag-version && cd ../..

# Manually update Flutter packages
# Edit apps/flutter-dev-client/pubspec.yaml: version: 1.0.0+1
# Edit packages/kiro_ui_tokens/pubspec.yaml: version: 1.0.0
```

### Step 4: Commit and Tag

```bash
git add .
git commit -m "Release v1.0.0: Performance optimizations"
git tag -a v1.0.0 -m "Release v1.0.0: Performance Optimizations"
```

### Step 5: Publish to NPM

```bash
# Publish lumora-ir
cd packages/lumora_ir
npm publish --access public
cd ../..

# Publish lumora-cli
cd packages/lumora-cli
npm publish --access public
cd ../..
```

### Step 6: Publish to Pub.dev (Optional)

```bash
# Publish kiro_ui_tokens
cd packages/kiro_ui_tokens
flutter pub publish --dry-run  # Test first
flutter pub publish
cd ../..
```

### Step 7: Push to Git

```bash
git push origin main
git push origin v1.0.0
```

### Step 8: Create GitHub Release

```bash
# Using GitHub CLI
gh release create v1.0.0 \
  --title "Lumora v1.0.0 - Performance Optimizations" \
  --notes-file RELEASE_NOTES.md \
  --latest

# Or manually at: https://github.com/your-org/lumora/releases/new
```

## Verification

After publishing, verify:

```bash
# Check npm
npm view lumora-ir version
npm view lumora-cli version

# Check pub.dev
# Visit: https://pub.dev/packages/kiro_ui_tokens

# Test installation
npm install -g lumora-cli@1.0.0
lumora --version
```

## Rollback (If Needed)

```bash
# Unpublish from npm (within 72 hours)
npm unpublish lumora-ir@1.0.0
npm unpublish lumora-cli@1.0.0

# Or deprecate
npm deprecate lumora-ir@1.0.0 "Use version 0.1.0-alpha.1"
npm deprecate lumora-cli@1.0.0 "Use version 0.1.0-alpha.1"

# Delete git tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

## Post-Publishing

```bash
# Update examples
cd examples/todo-app
npm install lumora-cli@latest lumora-ir@latest
flutter pub upgrade

cd ../chat-app
npm install lumora-cli@latest lumora-ir@latest
flutter pub upgrade
```

## Announce

- [ ] Twitter/X
- [ ] Reddit (r/FlutterDev, r/reactjs)
- [ ] Discord/Slack
- [ ] Newsletter
- [ ] Blog post

## Support

Issues? Contact:
- GitHub: https://github.com/your-org/lumora/issues
- Discord: https://discord.gg/lumora
- Email: support@lumora.dev

---

**Quick Reference**: See `PUBLISHING.md` for detailed instructions
