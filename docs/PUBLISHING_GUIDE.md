# Lumora Publishing Guide

This guide covers the steps to publish Lumora packages to NPM and pub.dev.

## Prerequisites

### NPM Publishing

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **NPM Authentication**: Login via CLI
   ```bash
   npm login
   ```
3. **Organization Access**: Request access to `@lumora` organization (or create it)
4. **Two-Factor Authentication**: Enable 2FA for security

### Pub.dev Publishing

1. **Google Account**: Required for pub.dev authentication
2. **Pub Tool**: Comes with Flutter SDK
3. **Package Verification**: Ensure package meets pub.dev requirements

## Pre-Publishing Checklist

### Code Quality

- [ ] All tests passing
  ```bash
  cd packages/lumora_ir && npm test
  cd packages/lumora-cli && npm test
  ```

- [ ] No linting errors
  ```bash
  npm run lint
  ```

- [ ] Build succeeds
  ```bash
  cd packages/lumora_ir && npm run build
  cd packages/lumora-cli && npm run build
  ```

### Documentation

- [ ] README.md is up to date
- [ ] CHANGELOG.md includes version notes
- [ ] API documentation is complete
- [ ] Examples are working

### Version Management

- [ ] Version numbers updated in package.json/pubspec.yaml
- [ ] Version follows semantic versioning
- [ ] Git tags created for release

### Legal

- [ ] LICENSE file present
- [ ] Copyright notices updated
- [ ] Third-party licenses acknowledged

## Publishing Steps

### 1. Publish @lumora/ir to NPM

```bash
# Navigate to package directory
cd packages/lumora_ir

# Ensure clean build
rm -rf dist node_modules
npm install
npm run build

# Run tests
npm test

# Dry run to verify package contents
npm pack --dry-run

# Publish to NPM
npm publish --access public

# For alpha/beta releases
npm publish --access public --tag alpha
```

**Verify Publication:**
```bash
npm view @lumora/ir
```

### 2. Publish @lumora/cli to NPM

```bash
# Navigate to package directory
cd packages/lumora-cli

# Ensure clean build
rm -rf dist node_modules
npm install
npm run build

# Run tests
npm test

# Dry run to verify package contents
npm pack --dry-run

# Publish to NPM
npm publish --access public

# For alpha/beta releases
npm publish --access public --tag alpha
```

**Verify Publication:**
```bash
npm view @lumora/cli
```

### 3. Publish lumora_core to pub.dev

```bash
# Navigate to package directory
cd packages/kiro_core

# Ensure dependencies are up to date
flutter pub get

# Run tests
flutter test

# Analyze package
flutter pub publish --dry-run

# Review the output carefully
# Check for warnings or errors

# Publish to pub.dev
flutter pub publish
```

**Important Notes:**
- First-time publishing requires email verification
- You'll be prompted to confirm publication
- Package name must be unique on pub.dev

**Verify Publication:**
Visit [https://pub.dev/packages/lumora_core](https://pub.dev/packages/lumora_core)

### 4. Publish lumora_ui_tokens to pub.dev

```bash
# Navigate to package directory
cd packages/lumora_ui_tokens

# Ensure dependencies are up to date
flutter pub get

# Run tests
flutter test

# Analyze package
flutter pub publish --dry-run

# Publish to pub.dev
flutter pub publish
```

**Verify Publication:**
Visit [https://pub.dev/packages/lumora_ui_tokens](https://pub.dev/packages/lumora_ui_tokens)

## Post-Publishing Steps

### 1. Create Git Tag

```bash
# Tag the release
git tag -a v0.1.0-alpha.1 -m "Release v0.1.0-alpha.1"

# Push tag to remote
git push origin v0.1.0-alpha.1
```

### 2. Create GitHub Release

1. Go to [GitHub Releases](https://github.com/lumora/lumora/releases)
2. Click "Draft a new release"
3. Select the tag you just created
4. Title: "v0.1.0-alpha.1 - Alpha Release"
5. Copy content from RELEASE_NOTES_v0.1.0-alpha.1.md
6. Mark as "pre-release" for alpha versions
7. Publish release

### 3. Update Documentation

- [ ] Update main README.md with installation instructions
- [ ] Update package READMEs with version badges
- [ ] Update documentation site (if applicable)
- [ ] Announce on social media/blog

### 4. Verify Installation

Test that users can install the packages:

```bash
# Test NPM packages
npm install -g @lumora/cli
npm install @lumora/ir

# Test pub.dev packages
flutter pub add lumora_core
flutter pub add lumora_ui_tokens
```

### 5. Monitor for Issues

- Watch GitHub issues for bug reports
- Monitor NPM download stats
- Check pub.dev package health score
- Respond to community feedback

## Troubleshooting

### NPM Publishing Issues

**Error: 403 Forbidden**
- Ensure you're logged in: `npm whoami`
- Check organization access
- Verify package name isn't taken

**Error: Package already exists**
- Increment version number
- Check if version was already published

**Error: Missing files in package**
- Check `.npmignore` file
- Verify `files` field in package.json
- Use `npm pack --dry-run` to preview

### Pub.dev Publishing Issues

**Error: Package validation failed**
- Run `flutter pub publish --dry-run`
- Fix all warnings and errors
- Ensure pubspec.yaml is valid

**Error: Package name already taken**
- Choose a different package name
- Check pub.dev for availability

**Error: Missing required fields**
- Add `homepage`, `repository`, `description`
- Ensure version follows semantic versioning

## Version Management

### Semantic Versioning

Follow [semver.org](https://semver.org/) guidelines:

- **Major (1.0.0)**: Breaking changes
- **Minor (0.1.0)**: New features, backward compatible
- **Patch (0.0.1)**: Bug fixes, backward compatible

### Pre-release Versions

- **Alpha (0.1.0-alpha.1)**: Early testing, unstable
- **Beta (0.1.0-beta.1)**: Feature complete, testing
- **RC (0.1.0-rc.1)**: Release candidate, final testing

### Updating Versions

Update all package versions consistently:

```bash
# NPM packages
cd packages/lumora_ir
npm version 0.1.0-alpha.2

cd packages/lumora-cli
npm version 0.1.0-alpha.2

# Dart packages (manual edit)
# Edit pubspec.yaml version field
```

## Rollback Procedure

If a published version has critical issues:

### NPM Rollback

```bash
# Deprecate a version
npm deprecate @lumora/ir@0.1.0-alpha.1 "Critical bug, use 0.1.0-alpha.2"

# Unpublish (only within 72 hours)
npm unpublish @lumora/ir@0.1.0-alpha.1
```

### Pub.dev Rollback

**Note**: pub.dev doesn't support unpublishing. Instead:

1. Publish a new version with fixes
2. Mark the problematic version as discontinued
3. Update documentation to warn users

## Automation (Future)

Consider setting up automated publishing with CI/CD:

### GitHub Actions Example

```yaml
name: Publish Packages

on:
  release:
    types: [published]

jobs:
  publish-npm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-pub:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - run: flutter pub get
      - run: flutter test
      - run: flutter pub publish --force
        env:
          PUB_CREDENTIALS: ${{ secrets.PUB_CREDENTIALS }}
```

## Support

For publishing issues:
- NPM Support: [https://www.npmjs.com/support](https://www.npmjs.com/support)
- Pub.dev Help: [https://dart.dev/tools/pub/publishing](https://dart.dev/tools/pub/publishing)
- GitHub Issues: [https://github.com/lumora/lumora/issues](https://github.com/lumora/lumora/issues)

## Checklist Summary

Before publishing:
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version numbers incremented
- [ ] CHANGELOG.md updated
- [ ] LICENSE file present
- [ ] Clean build successful
- [ ] Dry run completed

After publishing:
- [ ] Git tag created
- [ ] GitHub release created
- [ ] Installation verified
- [ ] Documentation updated
- [ ] Community notified

---

**Last Updated:** 2025-11-10
