# GitHub Gist Sharing Guide

## Overview

Lumora provides Snack-like functionality using GitHub Gists, allowing you to share projects instantly without creating full repositories. This is perfect for:

- Quick prototypes and demos
- Code snippets and examples
- Sharing projects with collaborators
- Creating shareable tutorials
- Forking and remixing projects

## Features

### Gist Manager

- ✅ Create gists for Lumora projects
- ✅ Update existing gists
- ✅ Fork gists from other users
- ✅ Generate shareable URLs
- ✅ List your gists
- ✅ Delete gists

### Gist Loader

- ✅ Load projects from gists
- ✅ Parse and validate project structure
- ✅ Extract project files to local workspace
- ✅ Preview gist content before loading
- ✅ Update gist-loaded projects
- ✅ Track gist metadata

## Quick Start

### 1. Setup Authentication

First, create a GitHub Personal Access Token (PAT):

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with `gist` scope
3. Save the token securely

```bash
export GITHUB_TOKEN=your_token_here
```

### 2. Create a Gist

```typescript
import { createGitHubClient, createGitHubGistManager } from 'lumora-cli';

const client = createGitHubClient({
  auth: { type: 'pat', token: process.env.GITHUB_TOKEN! },
});

const gistManager = createGitHubGistManager(client);

const gist = await gistManager.createProjectGist(
  'my-app',
  [
    { path: 'App.tsx', content: '...' },
    { path: 'package.json', content: '...' },
  ],
  'My awesome Lumora app'
);

console.log(`Share: ${gist.htmlUrl}`);
```

### 3. Load a Gist

```typescript
import { createGitHubGistLoader } from 'lumora-cli';

const gistLoader = createGitHubGistLoader(gistManager);

const result = await gistLoader.loadGist({
  gistId: 'abc123...',
  outputDir: './projects',
  overwrite: false,
});

console.log(`Loaded to: ${result.projectPath}`);
```

## API Reference

### GitHubGistManager

#### `createGist(options)`

Create a new gist.

```typescript
const gist = await gistManager.createGist({
  description: 'My Lumora Project',
  files: [
    { filename: 'App.tsx', content: '...' },
    { filename: 'package.json', content: '...' },
  ],
  public: true,
});
```

**Options:**
- `description` (string): Gist description
- `files` (GistFile[]): Array of files to include
- `public` (boolean): Whether gist is public (default: true)

**Returns:** `GistInfo` with gist details

#### `updateGist(options)`

Update an existing gist.

```typescript
await gistManager.updateGist({
  gistId: 'abc123',
  description: 'Updated description',
  files: [
    { filename: 'App.tsx', content: 'new content' },
  ],
});
```

**Options:**
- `gistId` (string): Gist ID to update
- `description` (string, optional): New description
- `files` (GistFile[], optional): Files to update

#### `forkGist(gistId)`

Fork an existing gist.

```typescript
const forked = await gistManager.forkGist('abc123');
console.log(`Forked to: ${forked.htmlUrl}`);
```

**Returns:** `ForkGistResult` with new gist details

#### `getGist(gistId)`

Get gist information.

```typescript
const gist = await gistManager.getGist('abc123');
console.log(`Files: ${gist.files.size}`);
```

**Returns:** `GistInfo` with complete gist details

#### `listGists(options)`

List gists for authenticated user.

```typescript
const gists = await gistManager.listGists({
  perPage: 10,
  page: 1,
});
```

**Options:**
- `perPage` (number): Results per page (default: 30)
- `page` (number): Page number (default: 1)

**Returns:** Array of `GistInfo`

#### `generateShareableUrls(gistId)`

Generate shareable URLs for a gist.

```typescript
const urls = gistManager.generateShareableUrls('abc123');
console.log(urls.htmlUrl);  // View in browser
console.log(urls.rawUrl);   // Raw content
console.log(urls.embedUrl); // Embed script
```

**Returns:** `ShareableGistUrl` object

#### `extractGistId(url)`

Extract gist ID from various URL formats.

```typescript
const id = gistManager.extractGistId('https://gist.github.com/user/abc123');
// Returns: 'abc123'
```

Supports:
- `https://gist.github.com/username/gistId`
- `https://gist.github.com/gistId`
- `gistId` (raw ID)

### GitHubGistLoader

#### `loadGist(options)`

Load a project from a gist.

```typescript
const result = await gistLoader.loadGist({
  gistId: 'abc123',
  outputDir: './projects',
  overwrite: false,
  includeReadme: true,
});
```

**Options:**
- `gistId` (string): Gist ID or URL
- `outputDir` (string): Directory to load project into
- `overwrite` (boolean): Overwrite existing directory (default: false)
- `includeReadme` (boolean): Include README file (default: false)

**Returns:** `LoadGistResult` with load details

#### `previewGist(gistId)`

Preview gist content without loading.

```typescript
const preview = await gistLoader.previewGist('abc123');
console.log(`Project: ${preview.project.name}`);
console.log(`Valid: ${preview.validation.valid}`);
```

**Returns:** Object with `info`, `project`, and `validation`

#### `updateGistProject(projectPath)`

Update a gist-loaded project.

```typescript
await gistLoader.updateGistProject('./projects/my-app');
```

Fetches latest version from the original gist.

#### `isGistProject(projectPath)`

Check if a directory is a gist-loaded project.

```typescript
const isGist = await gistLoader.isGistProject('./projects/my-app');
```

**Returns:** `boolean`

#### `listGistFiles(gistId)`

List all files in a gist.

```typescript
const files = await gistLoader.listGistFiles('abc123');
files.forEach(file => {
  console.log(`${file.filename} (${file.size} bytes)`);
});
```

**Returns:** Array of `GistFileInfo`

## Project Structure

When creating a gist for a Lumora project, include these files:

```
my-app/
├── App.tsx              # Main application component
├── package.json         # Dependencies
├── schema.json          # Lumora IR schema (optional)
├── README.md            # Project documentation (auto-generated)
└── .lumora-gist.json    # Gist metadata (auto-generated on load)
```

### Metadata File

When you load a gist, a `.lumora-gist.json` file is created:

```json
{
  "description": "My Lumora Project",
  "author": "username",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "gistId": "abc123",
  "gistUrl": "https://gist.github.com/abc123"
}
```

This allows you to:
- Track the original gist
- Update from the gist later
- Identify gist-loaded projects

## Validation

The loader validates projects before loading:

### Errors (prevent loading):
- No files in gist
- Invalid file structure

### Warnings (allow loading):
- No schema or TSX files
- No package.json
- Large files (> 1MB)

## Use Cases

### 1. Share a Quick Demo

```typescript
// Create and share
const gist = await gistManager.createProjectGist('demo', files);
console.log(`Share: ${gist.htmlUrl}`);

// Others can load
await gistLoader.loadGist({
  gistId: gist.id,
  outputDir: './demos',
});
```

### 2. Fork and Modify

```typescript
// Fork someone's gist
const forked = await gistManager.forkGist('original-id');

// Load your fork
await gistLoader.loadGist({
  gistId: forked.id,
  outputDir: './my-version',
});

// Make changes and update
await gistManager.updateGist({
  gistId: forked.id,
  files: [{ filename: 'App.tsx', content: 'modified' }],
});
```

### 3. Create a Tutorial Series

```typescript
// Create multiple gists for tutorial steps
const step1 = await gistManager.createProjectGist('tutorial-step-1', files1);
const step2 = await gistManager.createProjectGist('tutorial-step-2', files2);
const step3 = await gistManager.createProjectGist('tutorial-step-3', files3);

// Share URLs
console.log('Tutorial:');
console.log(`Step 1: ${step1.htmlUrl}`);
console.log(`Step 2: ${step2.htmlUrl}`);
console.log(`Step 3: ${step3.htmlUrl}`);
```

### 4. Sync with Latest Version

```typescript
// Load a gist
await gistLoader.loadGist({
  gistId: 'abc123',
  outputDir: './projects',
});

// Later, update to latest version
await gistLoader.updateGistProject('./projects/my-app');
```

## Best Practices

### 1. Keep Gists Small

Gists are best for small projects and demos. For larger projects, use full repositories.

**Good:**
- Single-file demos
- Small multi-file examples
- Code snippets
- Tutorials

**Not ideal:**
- Large applications
- Projects with many dependencies
- Binary assets
- Projects requiring build steps

### 2. Include Documentation

Always include a README explaining:
- What the project does
- How to run it
- Dependencies required
- Any special setup

### 3. Use Descriptive Names

```typescript
// Good
await gistManager.createProjectGist(
  'todo-app-with-local-storage',
  files,
  'Todo app demonstrating local storage in Lumora'
);

// Not as good
await gistManager.createProjectGist('app', files, 'My app');
```

### 4. Version Your Gists

For tutorials or evolving examples, create new gists for major versions:

```typescript
const v1 = await gistManager.createProjectGist('my-app-v1', filesV1);
const v2 = await gistManager.createProjectGist('my-app-v2', filesV2);
```

### 5. Handle Errors Gracefully

```typescript
try {
  await gistLoader.loadGist({ gistId, outputDir: './projects' });
} catch (error) {
  if (error.message.includes('already exists')) {
    console.log('Use --overwrite to replace existing project');
  } else {
    console.error('Failed to load gist:', error.message);
  }
}
```

## Rate Limits

GitHub API has rate limits:
- **Authenticated:** 5,000 requests/hour
- **Unauthenticated:** 60 requests/hour

The gist manager automatically:
- Checks rate limits before operations
- Warns when approaching limits
- Retries on rate limit errors

Monitor your usage:

```typescript
const rateLimit = await client.getRateLimit();
console.log(`${rateLimit.remaining}/${rateLimit.limit} requests remaining`);
console.log(`Resets at: ${rateLimit.reset}`);
```

## Troubleshooting

### "Authentication failed"

Ensure your GitHub token has the `gist` scope:
```bash
# Check token scopes at:
# https://github.com/settings/tokens
```

### "Gist not found"

- Verify the gist ID is correct
- Check if the gist is public (private gists require authentication)
- Ensure you have access to the gist

### "Directory already exists"

Use the `overwrite` option:
```typescript
await gistLoader.loadGist({
  gistId: 'abc123',
  outputDir: './projects',
  overwrite: true, // ← Add this
});
```

### "Rate limit exceeded"

Wait for the rate limit to reset, or:
- Use authentication (higher limits)
- Batch operations
- Cache results

## Examples

See `packages/lumora-cli/src/services/__examples__/gist-usage.example.ts` for complete examples.

## CLI Integration (Future)

Future CLI commands for gist operations:

```bash
# Create gist from project
lumora gist create ./my-app

# Load gist
lumora gist load abc123

# Fork gist
lumora gist fork abc123

# Update gist
lumora gist update abc123

# List gists
lumora gist list
```

## Comparison with Expo Snack

| Feature | Lumora Gists | Expo Snack |
|---------|--------------|------------|
| Storage | GitHub Gists | Expo servers |
| Authentication | GitHub PAT | Expo account |
| Sharing | GitHub URLs | Snack URLs |
| Forking | GitHub fork | Snack fork |
| Offline | Yes (after load) | No |
| Version control | Git-based | Snack versions |
| Size limit | ~10MB | ~5MB |
| Cost | Free | Free tier + paid |

## Security Considerations

1. **Never commit tokens:** Use environment variables
2. **Use minimal scopes:** Only `gist` scope needed
3. **Rotate tokens:** Regularly update your PAT
4. **Review gists:** Check content before loading
5. **Validate sources:** Only load from trusted users

## Contributing

To add gist functionality to other parts of Lumora:

1. Import the services:
```typescript
import { createGitHubGistManager, createGitHubGistLoader } from 'lumora-cli';
```

2. Create instances:
```typescript
const client = createGitHubClient({ auth: { type: 'pat', token } });
const gistManager = createGitHubGistManager(client);
const gistLoader = createGitHubGistLoader(gistManager);
```

3. Use the APIs as documented above

## License

MIT License - see LICENSE file for details
