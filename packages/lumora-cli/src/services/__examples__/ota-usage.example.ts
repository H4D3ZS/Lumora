/**
 * OTA (Over-The-Air) Updates via GitHub Releases - Usage Examples
 * 
 * This file demonstrates how to use the GitHub Release Manager and Update Checker
 * for implementing OTA updates in Lumora applications.
 */

import {
  createGitHubClient,
  createGitHubReleaseManager,
  createGitHubUpdateChecker,
} from '../index';
import { getBundler } from '../../../../lumora_ir/src/bundler';

/**
 * Example 1: Create a release and upload bundle
 */
async function publishRelease() {
  // Initialize GitHub client
  const client = createGitHubClient({
    auth: {
      type: 'pat',
      token: process.env.GITHUB_TOKEN || 'your-token-here',
    },
  });

  const releaseManager = createGitHubReleaseManager(client);

  // Create bundle
  const bundler = getBundler();
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
    name: 'Release v1.0.0',
    generateNotes: true,
    draft: false,
    prerelease: false,
  });

  console.log(`✅ Created release: ${release.htmlUrl}`);

  // Upload bundle to release
  const assets = await releaseManager.uploadBundle(
    'your-username',
    'your-app',
    release.id,
    bundle
  );

  console.log(`✅ Uploaded ${assets.length} assets:`);
  assets.forEach(asset => {
    console.log(`   - ${asset.name} (${asset.size} bytes)`);
  });
}

/**
 * Example 2: Create release with custom release notes
 */
async function publishReleaseWithNotes() {
  const client = createGitHubClient({
    auth: {
      type: 'pat',
      token: process.env.GITHUB_TOKEN || 'your-token-here',
    },
  });

  const releaseManager = createGitHubReleaseManager(client);

  // Generate custom release notes
  const releaseNotes = await releaseManager.generateReleaseNotes(
    'your-username',
    'your-app',
    '1.1.0',
    {
      previousVersion: '1.0.0',
      customSections: {
        features: [
          'Added dark mode support',
          'Improved performance by 30%',
          'New animation system',
        ],
        fixes: [
          'Fixed crash on startup',
          'Fixed memory leak in image loading',
        ],
        breaking: [
          'Removed deprecated API methods',
        ],
      },
    }
  );

  // Create release with custom notes
  const release = await releaseManager.createRelease({
    owner: 'your-username',
    repo: 'your-app',
    version: '1.1.0',
    body: releaseNotes,
  });

  console.log(`✅ Created release with custom notes: ${release.htmlUrl}`);
}

/**
 * Example 3: Check for updates
 */
async function checkForUpdates() {
  const client = createGitHubClient({
    auth: {
      type: 'pat',
      token: process.env.GITHUB_TOKEN || 'your-token-here',
    },
  });

  const updateChecker = createGitHubUpdateChecker(client);

  // Check for updates
  const updateInfo = await updateChecker.checkForUpdates({
    owner: 'your-username',
    repo: 'your-app',
    currentVersion: '1.0.0',
    includePrerelease: false,
  });

  if (updateInfo.available) {
    console.log(`🎉 Update available!`);
    console.log(`   Current: v${updateInfo.currentVersion}`);
    console.log(`   Latest: v${updateInfo.latestVersion}`);
    console.log(`   Download: ${updateInfo.downloadUrl}`);
    console.log(`\n📝 Release Notes:\n${updateInfo.releaseNotes}`);
  } else {
    console.log(`✅ You're up to date! (v${updateInfo.currentVersion})`);
  }
}

/**
 * Example 4: Download and verify update
 */
async function downloadAndVerifyUpdate() {
  const client = createGitHubClient({
    auth: {
      type: 'pat',
      token: process.env.GITHUB_TOKEN || 'your-token-here',
    },
  });

  const updateChecker = createGitHubUpdateChecker(client);

  // Check for updates
  const updateInfo = await updateChecker.checkForUpdates({
    owner: 'your-username',
    repo: 'your-app',
    currentVersion: '1.0.0',
  });

  if (!updateInfo.available) {
    console.log('No updates available');
    return;
  }

  console.log(`📥 Downloading update v${updateInfo.latestVersion}...`);

  // Download bundle with progress
  const { bundlePath, checksumPath } = await updateChecker.downloadBundle(
    updateInfo,
    './downloads',
    (downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(1);
      process.stdout.write(`\r   Progress: ${percent}%`);
    }
  );

  console.log('\n✅ Download complete!');

  // Verify checksums
  console.log('🔐 Verifying checksums...');
  const verification = await updateChecker.verifyBundle(bundlePath, checksumPath);

  if (verification.valid) {
    console.log('✅ Checksums verified successfully!');
    console.log(`   Bundle ready at: ${bundlePath}`);
  } else {
    console.error('❌ Checksum verification failed:');
    verification.errors.forEach(error => {
      console.error(`   - ${error}`);
    });
  }
}

/**
 * Example 5: Complete OTA update workflow
 */
async function completeOTAWorkflow() {
  const client = createGitHubClient({
    auth: {
      type: 'pat',
      token: process.env.GITHUB_TOKEN || 'your-token-here',
    },
  });

  const updateChecker = createGitHubUpdateChecker(client);

  console.log('🔍 Checking for updates...');

  const updateInfo = await updateChecker.checkForUpdates({
    owner: 'your-username',
    repo: 'your-app',
    currentVersion: '1.0.0',
  });

  if (!updateInfo.available) {
    console.log('✅ Already on latest version');
    return;
  }

  console.log(`\n🎉 Update available: v${updateInfo.latestVersion}`);
  console.log(`📝 Release notes:\n${updateInfo.releaseNotes}\n`);

  // Download update
  console.log('📥 Downloading update...');
  const { bundlePath, manifestPath, checksumPath } = await updateChecker.downloadBundle(
    updateInfo,
    './updates',
    (downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(1);
      process.stdout.write(`\r   Progress: ${percent}%`);
    }
  );

  console.log('\n✅ Download complete!');

  // Verify integrity
  console.log('🔐 Verifying integrity...');
  const verification = await updateChecker.verifyBundle(bundlePath, checksumPath);

  if (!verification.valid) {
    console.error('❌ Verification failed:');
    verification.errors.forEach(error => console.error(`   - ${error}`));
    return;
  }

  console.log('✅ Verification successful!');

  // Load manifest
  const manifest = await updateChecker.loadManifest(manifestPath);
  console.log(`\n📦 Bundle info:`);
  console.log(`   Version: ${manifest.version}`);
  console.log(`   Entry: ${manifest.entry}`);
  console.log(`   Schemas: ${manifest.schemas.length}`);
  console.log(`   Assets: ${manifest.assets.length}`);
  console.log(`   Size: ${(manifest.bundleSize / 1024).toFixed(2)} KB`);

  console.log('\n✅ Update ready to apply!');
}

/**
 * Example 6: Publish prerelease
 */
async function publishPrerelease() {
  const client = createGitHubClient({
    auth: {
      type: 'pat',
      token: process.env.GITHUB_TOKEN || 'your-token-here',
    },
  });

  const releaseManager = createGitHubReleaseManager(client);
  const bundler = getBundler();

  // Create bundle
  const bundle = await bundler.bundle({
    entry: './src/App.tsx',
    output: './dist/bundle.json',
    minify: true,
    compress: true,
  });

  // Create prerelease
  const release = await releaseManager.createRelease({
    owner: 'your-username',
    repo: 'your-app',
    version: '1.1.0-beta.1',
    name: 'Beta Release v1.1.0-beta.1',
    prerelease: true,
    generateNotes: true,
  });

  // Upload bundle
  await releaseManager.uploadBundle(
    'your-username',
    'your-app',
    release.id,
    bundle
  );

  console.log(`✅ Published prerelease: ${release.htmlUrl}`);
}

/**
 * Example 7: Version comparison
 */
function demonstrateVersionComparison() {
  const client = createGitHubClient({
    auth: {
      type: 'pat',
      token: process.env.GITHUB_TOKEN || 'your-token-here',
    },
  });

  const updateChecker = createGitHubUpdateChecker(client);

  const comparisons = [
    ['1.0.0', '1.0.1'],
    ['1.0.0', '1.1.0'],
    ['1.0.0', '2.0.0'],
    ['1.0.0', '1.0.0'],
    ['1.0.0', '1.0.0-beta.1'],
    ['1.0.0-beta.1', '1.0.0'],
  ];

  console.log('Version Comparisons:');
  comparisons.forEach(([v1, v2]) => {
    const result = updateChecker.compareVersions(v1, v2);
    const symbol = result < 0 ? '<' : result > 0 ? '>' : '===';
    console.log(`   ${v1} ${symbol} ${v2}`);
  });
}

// Export examples
export {
  publishRelease,
  publishReleaseWithNotes,
  checkForUpdates,
  downloadAndVerifyUpdate,
  completeOTAWorkflow,
  publishPrerelease,
  demonstrateVersionComparison,
};
