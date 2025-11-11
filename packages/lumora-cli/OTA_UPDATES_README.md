# OTA Updates via GitHub Releases

## Overview

Lumora supports Over-The-Air (OTA) updates using GitHub Releases. This allows you to distribute app updates without requiring app store submissions or complex deployment infrastructure.

## Features

- ✅ **Release Management** - Create, update, and manage GitHub releases
- ✅ **Bundle Upload** - Upload Lumora bundles with automatic checksums
- ✅ **Update Detection** - Check for available updates with semantic versioning
- ✅ **Secure Downloads** - Download bundles with integrity verification
- ✅ **Progress Tracking** - Monitor download progress in real-time
- ✅ **Automatic Release Notes** - Generate release notes from commits
- ✅ **Prerelease Support** - Publish beta/alpha versions
- ✅ **Rollback Safety** - Atomic operations with automatic cleanup

## Quick Start

### 1. Setup GitHub Authentication

```typescript
import { createGitHubClient } from '@lumora/cli';

const client = createGitHubClient({
  auth: {
    type: 'pat', // Personal Access Token
    token: process.env.GITHUB_TOKEN,
  },
});
```

### 2. Publish a Release

```typescript
import { createGitHubReleaseManager } from '@lumora/cli';
import { getBundler } from '@lumora/ir';

const releaseManager = createGitHubReleaseManager(client);
const bundler = getBundler();

// Create bundle
const bundle = await bundler.bundle({
  entry: './src/App.tsx',
  output: './dist/bundle.json',
  minify: true,
  compress: true,
  treeShake: true,
});

// Create release
const release = await releaseManager.createRelease({
  owner: 'your-username',
  repo: 'your-app',
  version: '1.0.0',
  generateNotes: true,
});

// Upload bundle
await releaseManager.uploadBundle(
  'your-username',
  'your-app',
  release.id,
  bundle
);

console.log(`✅ Published: ${release.htmlUrl}`);
```

### 3. Check for Updates

```typescript
import { createGitHubUpdateChecker } from '@lumora/cli';

const updateChecker = createGitHubUpdateChecker(client);

const updateInfo = await updateChecker.checkForUpdates({
  owner: 'your-username',
  repo: 'your-app',
  currentVersion: '1.0.0',
});

if (updateInfo.available) {
  console.log(`Update available: v${updateInfo.latestVersion}`);
  console.log(`Download: ${updateInfo.downloadUrl}`);
}
```

### 4. Download and Verify Update

```typescript
// Download bundle
const { bundlePath, checksumPath } = await updateChecker.downloadBundle(
  updateInfo,
  './downloads',
  (downloaded, total) => {
    const percent = ((downloaded / total) * 100).toFixed(1);
    console.log(`Progress: ${percent}%`);
  }
);

// Verify integrity
const verification = await updateChecker.verifyBundle(
  bundlePath,
  checksumPath
);

if (verification.valid) {
  console.log('✅ Update verified and ready to apply!');
} else {
  console.error('❌ Verification failed:', verification.errors);
}
```

## API Reference

### GitHubReleaseManager

#### `createRelease(options)`

Create a new GitHub release.

```typescript
const release = await releaseManager.createRelease({
  owner: 'username',
  repo: 'app',
  version: '1.0.0',
  name: 'Release v1.0.0',
  body: 'Release notes...',
  draft: false,
  prerelease: false,
  generateNotes: true,
});
```

#### `uploadBundle(owner, repo, releaseId, bundle)`

Upload a Lumora bundle to a release. Automatically uploads:
- `bundle.json` - Complete bundle
- `manifest.json` - Bundle manifest
- `checksums.txt` - SHA-256 checksums

```typescript
const assets = await releaseManager.uploadBundle(
  'username',
  'app',
  release.id,
  bundle
);
```

#### `getLatestRelease(owner, repo)`

Get the latest release.

```typescript
const release = await releaseManager.getLatestRelease('username', 'app');
```

#### `generateReleaseNotes(owner, repo, version, options)`

Generate release notes with custom sections.

```typescript
const notes = await releaseManager.generateReleaseNotes(
  'username',
  'app',
  '1.1.0',
  {
    previousVersion: '1.0.0',
    customSections: {
      features: ['Added dark mode', 'Improved performance'],
      fixes: ['Fixed crash on startup'],
      breaking: ['Removed deprecated API'],
    },
  }
);
```

### GitHubUpdateChecker

#### `checkForUpdates(options)`

Check for available updates.

```typescript
const updateInfo = await updateChecker.checkForUpdates({
  owner: 'username',
  repo: 'app',
  currentVersion: '1.0.0',
  includePrerelease: false,
});
```

Returns:
```typescript
{
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  release?: ReleaseInfo;
  downloadUrl?: string;
  manifestUrl?: string;
  checksumUrl?: string;
  releaseNotes?: string;
}
```

#### `downloadBundle(updateInfo, outputDir, onProgress?)`

Download bundle with progress tracking.

```typescript
const { bundlePath, manifestPath, checksumPath } = 
  await updateChecker.downloadBundle(
    updateInfo,
    './downloads',
    (downloaded, total) => {
      console.log(`${downloaded}/${total} bytes`);
    }
  );
```

#### `verifyBundle(bundlePath, checksumPath)`

Verify bundle integrity using checksums.

```typescript
const { valid, errors } = await updateChecker.verifyBundle(
  bundlePath,
  checksumPath
);
```

#### `compareVersions(v1, v2)`

Compare two semantic versions.

```typescript
const result = updateChecker.compareVersions('1.0.0', '1.1.0');
// Returns: -1 (v1 < v2), 0 (v1 === v2), or 1 (v1 > v2)
```

## Semantic Versioning

Lumora uses semantic versioning (semver) for releases:

- **Major.Minor.Patch** - e.g., `1.2.3`
- **Prerelease** - e.g., `1.2.3-beta.1`, `1.2.3-alpha.2`

Version comparison rules:
- `1.0.0` < `1.0.1` (patch increment)
- `1.0.0` < `1.1.0` (minor increment)
- `1.0.0` < `2.0.0` (major increment)
- `1.0.0-beta.1` < `1.0.0` (prerelease < stable)
- `1.0.0-alpha.1` < `1.0.0-beta.1` (alpha < beta)

## Release Channels

### Stable Releases

```typescript
const release = await releaseManager.createRelease({
  version: '1.0.0',
  prerelease: false,
});
```

### Prerelease (Beta/Alpha)

```typescript
const release = await releaseManager.createRelease({
  version: '1.1.0-beta.1',
  prerelease: true,
});
```

Check for prereleases:

```typescript
const updateInfo = await updateChecker.checkForUpdates({
  currentVersion: '1.0.0',
  includePrerelease: true, // Include beta/alpha versions
});
```

## Security

### Checksum Verification

All bundles include SHA-256 checksums for integrity verification:

1. Bundle checksum is calculated during upload
2. Checksums are stored in `checksums.txt`
3. Downloads are verified before use
4. Verification failures prevent update application

### GitHub Authentication

Use Personal Access Tokens (PAT) with minimal permissions:

Required scopes:
- `repo` - For private repositories
- `public_repo` - For public repositories only

```bash
# Create token at: https://github.com/settings/tokens
export GITHUB_TOKEN="ghp_your_token_here"
```

## Best Practices

### 1. Version Numbering

- Use semantic versioning consistently
- Increment major version for breaking changes
- Increment minor version for new features
- Increment patch version for bug fixes

### 2. Release Notes

- Always include release notes
- Use `generateNotes: true` for automatic generation
- Add custom sections for clarity
- Include migration guides for breaking changes

### 3. Testing

- Test bundles before publishing
- Use draft releases for testing
- Publish prereleases for beta testing
- Verify checksums after download

### 4. Rollback Strategy

- Keep previous versions available
- Test updates in staging first
- Monitor update success rates
- Have rollback plan ready

## Troubleshooting

### Rate Limiting

GitHub API has rate limits (5000 requests/hour for authenticated users):

```typescript
const rateLimit = await client.getRateLimit();
console.log(`Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);
```

The client automatically handles rate limiting with retries.

### Download Failures

Downloads are automatically cleaned up on failure:

```typescript
try {
  await updateChecker.downloadBundle(updateInfo, './downloads');
} catch (error) {
  // Partial downloads are automatically removed
  console.error('Download failed:', error);
}
```

### Verification Failures

If verification fails, check:

1. Network connection during download
2. Disk space availability
3. File permissions
4. Checksum file format

```typescript
const { valid, errors } = await updateChecker.verifyBundle(
  bundlePath,
  checksumPath
);

if (!valid) {
  errors.forEach(error => console.error(error));
}
```

## Examples

See `src/services/__examples__/ota-usage.example.ts` for complete examples:

- Publishing releases
- Checking for updates
- Downloading and verifying bundles
- Handling prereleases
- Version comparison
- Complete OTA workflow

## CLI Integration

The OTA system can be integrated into CLI commands:

```bash
# Publish release
lumora publish --version 1.0.0 --repo username/app

# Check for updates
lumora update check --repo username/app

# Download update
lumora update download --repo username/app --output ./downloads
```

## Future Enhancements

Planned improvements:

- Delta updates (only download changes)
- Background downloads
- Automatic rollback on failure
- Update channels (stable/beta/alpha)
- Compression support
- Download caching

## Support

For issues or questions:

- GitHub Issues: https://github.com/your-org/lumora/issues
- Documentation: https://lumora.dev/docs/ota-updates
- Examples: `src/services/__examples__/ota-usage.example.ts`

## License

MIT License - See LICENSE file for details
