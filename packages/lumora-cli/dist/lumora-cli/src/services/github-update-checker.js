"use strict";
/**
 * GitHub Update Checker for Lumora
 *
 * Checks for OTA updates via GitHub Releases.
 * Handles version comparison, asset downloads, and checksum verification.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubUpdateChecker = void 0;
exports.createGitHubUpdateChecker = createGitHubUpdateChecker;
const github_release_manager_1 = require("./github-release-manager");
const crypto = __importStar(require("crypto"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * GitHub Update Checker
 *
 * Handles checking for updates and downloading release assets.
 */
class GitHubUpdateChecker {
    constructor(client) {
        this.client = client;
        this.releaseManager = new github_release_manager_1.GitHubReleaseManager(client);
    }
    /**
     * Check for available updates
     */
    async checkForUpdates(options) {
        try {
            // Get latest release
            const release = await this.getLatestRelease(options.owner, options.repo, options.includePrerelease);
            if (!release) {
                return {
                    available: false,
                    currentVersion: options.currentVersion,
                    latestVersion: options.currentVersion,
                };
            }
            // Compare versions
            const latestVersion = this.extractVersion(release.tagName);
            const isNewer = this.compareVersions(latestVersion, options.currentVersion) > 0;
            if (!isNewer) {
                return {
                    available: false,
                    currentVersion: options.currentVersion,
                    latestVersion,
                };
            }
            // Find bundle assets
            const bundleAsset = release.assets.find(a => a.name === 'bundle.json');
            const manifestAsset = release.assets.find(a => a.name === 'manifest.json');
            const checksumAsset = release.assets.find(a => a.name === 'checksums.txt');
            return {
                available: true,
                currentVersion: options.currentVersion,
                latestVersion,
                release,
                downloadUrl: bundleAsset?.browserDownloadUrl,
                manifestUrl: manifestAsset?.browserDownloadUrl,
                checksumUrl: checksumAsset?.browserDownloadUrl,
                releaseNotes: release.body,
            };
        }
        catch (error) {
            throw new Error(`Failed to check for updates: ${error.message}`);
        }
    }
    /**
     * Get latest release (respecting prerelease setting)
     */
    async getLatestRelease(owner, repo, includePrerelease) {
        try {
            if (!includePrerelease) {
                // Get latest stable release
                return await this.releaseManager.getLatestRelease(owner, repo);
            }
            // Get all releases and find the latest (including prereleases)
            const releases = await this.releaseManager.listReleases(owner, repo, {
                perPage: 10,
            });
            if (releases.length === 0) {
                return null;
            }
            // Sort by version (descending)
            releases.sort((a, b) => {
                const versionA = this.extractVersion(a.tagName);
                const versionB = this.extractVersion(b.tagName);
                return this.compareVersions(versionB, versionA);
            });
            return releases[0];
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Download release asset
     */
    async downloadAsset(options) {
        return new Promise((resolve, reject) => {
            const outputDir = path.dirname(options.outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const file = fs.createWriteStream(options.outputPath);
            const protocol = options.url.startsWith('https') ? https : http;
            const request = protocol.get(options.url, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Handle redirect
                    if (response.headers.location) {
                        file.close();
                        this.downloadAsset({
                            ...options,
                            url: response.headers.location,
                        }).then(resolve).catch(reject);
                        return;
                    }
                }
                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(options.outputPath);
                    reject(new Error(`Download failed with status ${response.statusCode}`));
                    return;
                }
                const totalSize = parseInt(response.headers['content-length'] || '0', 10);
                let downloadedSize = 0;
                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    if (options.onProgress && totalSize > 0) {
                        options.onProgress(downloadedSize, totalSize);
                    }
                });
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            });
            request.on('error', (error) => {
                file.close();
                if (fs.existsSync(options.outputPath)) {
                    fs.unlinkSync(options.outputPath);
                }
                reject(error);
            });
            file.on('error', (error) => {
                file.close();
                if (fs.existsSync(options.outputPath)) {
                    fs.unlinkSync(options.outputPath);
                }
                reject(error);
            });
        });
    }
    /**
     * Download bundle from release
     */
    async downloadBundle(updateInfo, outputDir, onProgress) {
        if (!updateInfo.available || !updateInfo.downloadUrl) {
            throw new Error('No update available to download');
        }
        const bundlePath = path.join(outputDir, 'bundle.json');
        const manifestPath = path.join(outputDir, 'manifest.json');
        const checksumPath = path.join(outputDir, 'checksums.txt');
        try {
            // Download bundle
            if (updateInfo.downloadUrl) {
                await this.downloadAsset({
                    url: updateInfo.downloadUrl,
                    outputPath: bundlePath,
                    onProgress,
                });
            }
            // Download manifest
            if (updateInfo.manifestUrl) {
                await this.downloadAsset({
                    url: updateInfo.manifestUrl,
                    outputPath: manifestPath,
                });
            }
            // Download checksums
            if (updateInfo.checksumUrl) {
                await this.downloadAsset({
                    url: updateInfo.checksumUrl,
                    outputPath: checksumPath,
                });
            }
            return { bundlePath, manifestPath, checksumPath };
        }
        catch (error) {
            // Clean up partial downloads
            [bundlePath, manifestPath, checksumPath].forEach(p => {
                if (fs.existsSync(p)) {
                    fs.unlinkSync(p);
                }
            });
            throw new Error(`Failed to download bundle: ${error.message}`);
        }
    }
    /**
     * Verify file checksum
     */
    async verifyChecksum(options) {
        if (!fs.existsSync(options.filePath)) {
            throw new Error(`File not found: ${options.filePath}`);
        }
        const algorithm = options.algorithm || 'sha256';
        const hash = crypto.createHash(algorithm);
        const stream = fs.createReadStream(options.filePath);
        return new Promise((resolve, reject) => {
            stream.on('data', (data) => {
                hash.update(data);
            });
            stream.on('end', () => {
                const checksum = hash.digest('hex');
                resolve(checksum === options.expectedChecksum);
            });
            stream.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Verify downloaded bundle
     */
    async verifyBundle(bundlePath, checksumPath) {
        const errors = [];
        try {
            // Read checksums file
            if (!fs.existsSync(checksumPath)) {
                errors.push('Checksums file not found');
                return { valid: false, errors };
            }
            const checksumContent = fs.readFileSync(checksumPath, 'utf-8');
            const checksumLines = checksumContent.split('\n').filter(l => l.trim());
            // Parse checksums
            const checksums = new Map();
            for (const line of checksumLines) {
                const [checksum, filename] = line.trim().split(/\s+/);
                if (checksum && filename) {
                    checksums.set(filename, checksum);
                }
            }
            // Verify bundle checksum
            const bundleChecksum = checksums.get('bundle.json');
            if (!bundleChecksum) {
                errors.push('Bundle checksum not found in checksums file');
                return { valid: false, errors };
            }
            const bundleValid = await this.verifyChecksum({
                filePath: bundlePath,
                expectedChecksum: bundleChecksum,
            });
            if (!bundleValid) {
                errors.push('Bundle checksum verification failed');
            }
            // Verify manifest if present
            const manifestPath = path.join(path.dirname(bundlePath), 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                const manifestChecksum = checksums.get('manifest.json');
                if (manifestChecksum) {
                    const manifestValid = await this.verifyChecksum({
                        filePath: manifestPath,
                        expectedChecksum: manifestChecksum,
                    });
                    if (!manifestValid) {
                        errors.push('Manifest checksum verification failed');
                    }
                }
            }
            return {
                valid: errors.length === 0,
                errors,
            };
        }
        catch (error) {
            errors.push(`Verification error: ${error.message}`);
            return { valid: false, errors };
        }
    }
    /**
     * Load manifest from downloaded bundle
     */
    async loadManifest(manifestPath) {
        if (!fs.existsSync(manifestPath)) {
            throw new Error(`Manifest not found: ${manifestPath}`);
        }
        try {
            const content = fs.readFileSync(manifestPath, 'utf-8');
            const manifest = JSON.parse(content);
            // Validate manifest structure
            if (!manifest.version || !manifest.entry || !manifest.checksum) {
                throw new Error('Invalid manifest structure');
            }
            return manifest;
        }
        catch (error) {
            throw new Error(`Failed to load manifest: ${error.message}`);
        }
    }
    /**
     * Compare two semantic versions
     * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
     */
    compareVersions(v1, v2) {
        const parts1 = this.parseVersion(v1);
        const parts2 = this.parseVersion(v2);
        // Compare major, minor, patch
        for (let i = 0; i < 3; i++) {
            if (parts1[i] > parts2[i])
                return 1;
            if (parts1[i] < parts2[i])
                return -1;
        }
        // Compare prerelease
        if (parts1[3] && !parts2[3])
            return -1; // v1 is prerelease, v2 is stable
        if (!parts1[3] && parts2[3])
            return 1; // v1 is stable, v2 is prerelease
        if (parts1[3] && parts2[3]) {
            if (parts1[3] > parts2[3])
                return 1;
            if (parts1[3] < parts2[3])
                return -1;
        }
        return 0;
    }
    /**
     * Extract version from tag name (e.g., "v1.2.3" -> "1.2.3")
     */
    extractVersion(tag) {
        return tag.replace(/^v/, '');
    }
    /**
     * Parse version string into components
     * Returns [major, minor, patch, prerelease]
     */
    parseVersion(version) {
        const cleaned = version.replace(/^v/, '');
        const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
        if (!match) {
            throw new Error(`Invalid version format: ${version}`);
        }
        return [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3], 10),
            match[4] || '',
        ];
    }
}
exports.GitHubUpdateChecker = GitHubUpdateChecker;
/**
 * Create a GitHub update checker
 */
function createGitHubUpdateChecker(client) {
    return new GitHubUpdateChecker(client);
}
//# sourceMappingURL=github-update-checker.js.map