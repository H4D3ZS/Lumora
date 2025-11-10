# CI/CD Guide for Lumora

This guide explains the Continuous Integration and Continuous Deployment setup for the Lumora project.

## Overview

Lumora uses GitHub Actions for automated testing, code quality checks, and package publishing. The CI/CD pipeline ensures code quality, prevents regressions, and automates the release process.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Trigger**: Push to `main` or `develop` branches, Pull Requests

**Jobs**:

#### test-npm-packages
- Tests all NPM packages (@lumora/ir, @lumora/cli, codegen, dev-proxy)
- Runs on Node.js 16.x, 18.x, and 20.x
- Executes build and test commands
- Ensures cross-version compatibility

#### test-dart-packages
- Tests all Dart packages (lumora_core, lumora_ui_tokens)
- Tests Flutter dev client
- Runs Flutter analyzer
- Executes Flutter tests

#### code-quality
- Lints TypeScript code
- Checks code formatting
- Analyzes Dart code with strict settings
- Ensures code style consistency

#### build-verification
- Builds all NPM packages
- Verifies package contents with `npm pack --dry-run`
- Builds Dart packages with `flutter pub publish --dry-run`
- Builds Flutter app APK
- Ensures packages are publishable

#### security-scan
- Runs `npm audit` on all packages
- Checks for known vulnerabilities
- Reports security issues

#### coverage
- Runs tests with coverage reporting
- Uploads coverage to Codecov
- Tracks test coverage over time

### 2. Publish Workflow (`.github/workflows/publish.yml`)

**Trigger**: 
- GitHub Release published
- Manual workflow dispatch

**Jobs**:

#### publish-npm-ir
- Publishes @lumora/ir to NPM
- Runs tests before publishing
- Supports dry-run mode

#### publish-npm-cli
- Publishes @lumora/cli to NPM
- Runs tests before publishing
- Supports dry-run mode

#### publish-pub-core
- Publishes lumora_core to pub.dev
- Runs tests and analysis before publishing
- Supports dry-run mode

#### publish-pub-tokens
- Publishes lumora_ui_tokens to pub.dev
- Runs tests and analysis before publishing
- Supports dry-run mode

#### create-release-summary
- Creates a summary of published packages
- Provides installation instructions
- Runs after all publish jobs complete

### 3. Code Quality Workflow (`.github/workflows/code-quality.yml`)

**Trigger**: 
- Push to `main` or `develop` branches
- Pull Requests
- Weekly schedule (Monday 00:00 UTC)

**Jobs**:

#### lint
- Lints TypeScript code with ESLint
- Checks TypeScript compilation

#### format-check
- Checks code formatting with Prettier

#### dart-analyze
- Analyzes Dart code with strict settings
- Treats warnings as errors

#### dart-format
- Checks Dart code formatting

#### dependency-check
- Checks for outdated dependencies
- Identifies unused dependencies

#### type-coverage
- Checks TypeScript type coverage
- Ensures minimum type coverage threshold

#### complexity-analysis
- Analyzes code complexity
- Identifies overly complex code

#### documentation-check
- Validates documentation completeness
- Checks markdown links

#### bundle-size
- Checks package bundle sizes
- Prevents bundle size regressions

#### performance-benchmarks
- Runs performance benchmarks
- Tracks performance over time

## Required Secrets

Configure these secrets in GitHub repository settings:

### NPM_TOKEN
- **Purpose**: Authenticate with NPM registry for publishing
- **How to get**: 
  1. Login to npmjs.com
  2. Go to Account Settings → Access Tokens
  3. Generate new token with "Automation" type
  4. Copy token value

### PUB_CREDENTIALS
- **Purpose**: Authenticate with pub.dev for publishing
- **How to get**:
  1. Run `flutter pub publish --dry-run` locally
  2. Complete OAuth flow
  3. Copy credentials from `~/.pub-cache/credentials.json`
  4. Store as GitHub secret

### CODECOV_TOKEN (Optional)
- **Purpose**: Upload coverage reports to Codecov
- **How to get**:
  1. Sign up at codecov.io
  2. Add repository
  3. Copy upload token

## Branch Protection Rules

Recommended branch protection for `main` branch:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
  - test-npm-packages
  - test-dart-packages
  - code-quality
  - build-verification
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

## Release Process

### Automated Release (Recommended)

1. **Create a release on GitHub**:
   ```bash
   # Tag the release locally
   git tag -a v0.1.0-alpha.1 -m "Release v0.1.0-alpha.1"
   git push origin v0.1.0-alpha.1
   ```

2. **Create GitHub Release**:
   - Go to GitHub → Releases → Draft a new release
   - Select the tag you just created
   - Title: "v0.1.0-alpha.1 - Alpha Release"
   - Description: Copy from RELEASE_NOTES
   - Mark as pre-release for alpha/beta versions
   - Publish release

3. **Automated publishing**:
   - Publish workflow triggers automatically
   - All packages are built, tested, and published
   - Release summary is created

### Manual Release

Use workflow dispatch for manual control:

1. Go to Actions → Publish Packages → Run workflow
2. Select package to publish (or "all")
3. Enable/disable dry-run
4. Run workflow

### Dry Run Testing

Before actual release, test with dry-run:

```bash
# Locally test NPM publish
cd packages/lumora_ir
npm publish --dry-run

# Locally test pub.dev publish
cd packages/kiro_core
flutter pub publish --dry-run
```

Or use GitHub Actions workflow dispatch with dry-run enabled.

## Status Badges

Add these badges to README.md:

```markdown
[![CI](https://github.com/lumora/lumora/workflows/CI/badge.svg)](https://github.com/lumora/lumora/actions/workflows/ci.yml)
[![Code Quality](https://github.com/lumora/lumora/workflows/Code%20Quality/badge.svg)](https://github.com/lumora/lumora/actions/workflows/code-quality.yml)
[![codecov](https://codecov.io/gh/lumora/lumora/branch/main/graph/badge.svg)](https://codecov.io/gh/lumora/lumora)
```

## Monitoring

### GitHub Actions Dashboard
- View workflow runs: `https://github.com/lumora/lumora/actions`
- Monitor success/failure rates
- Review logs for failed runs

### NPM Package Stats
- View downloads: `https://www.npmjs.com/package/@lumora/ir`
- Monitor version adoption

### Pub.dev Package Stats
- View pub points: `https://pub.dev/packages/lumora_core`
- Monitor package health

### Codecov Dashboard
- View coverage trends: `https://codecov.io/gh/lumora/lumora`
- Track coverage changes in PRs

## Troubleshooting

### CI Failures

**Tests failing**:
1. Check test logs in GitHub Actions
2. Reproduce locally: `npm test`
3. Fix failing tests
4. Push fix

**Build failing**:
1. Check build logs
2. Reproduce locally: `npm run build`
3. Fix build errors
4. Push fix

**Linting errors**:
1. Run linter locally
2. Fix issues or update rules
3. Push fix

### Publishing Failures

**NPM authentication failed**:
1. Verify NPM_TOKEN secret is set
2. Check token hasn't expired
3. Regenerate token if needed

**Pub.dev authentication failed**:
1. Verify PUB_CREDENTIALS secret is set
2. Regenerate credentials locally
3. Update secret

**Version already published**:
1. Increment version number
2. Update package.json/pubspec.yaml
3. Create new tag
4. Retry publish

**Package validation failed**:
1. Run dry-run locally
2. Fix validation errors
3. Retry publish

## Best Practices

### Before Merging PR

1. Ensure all CI checks pass
2. Review code coverage changes
3. Check for security vulnerabilities
4. Verify documentation updates
5. Test locally

### Before Release

1. Update version numbers
2. Update CHANGELOG.md
3. Update RELEASE_NOTES
4. Test dry-run publish
5. Verify all tests pass
6. Review documentation

### After Release

1. Verify packages are published
2. Test installation
3. Update documentation site
4. Announce release
5. Monitor for issues

## Future Improvements

### Planned Enhancements

- [ ] Add E2E testing workflow
- [ ] Implement automatic changelog generation
- [ ] Add performance regression detection
- [ ] Set up automatic dependency updates (Dependabot)
- [ ] Add visual regression testing
- [ ] Implement canary releases
- [ ] Add automatic rollback on failure
- [ ] Set up staging environment
- [ ] Add load testing
- [ ] Implement blue-green deployments

### Integration Ideas

- Slack notifications for releases
- Discord bot for CI status
- Automated issue creation for failures
- PR size labeling
- Automatic PR reviews
- Stale PR management

## Support

For CI/CD issues:
- Check workflow logs in GitHub Actions
- Review this guide
- Open an issue on GitHub
- Contact maintainers

---

**Last Updated:** 2025-11-10
