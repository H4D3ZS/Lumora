/**
 * GitHub Update Checker for Lumora
 *
 * Checks for OTA updates via GitHub Releases.
 * Handles version comparison, asset downloads, and checksum verification.
 */
import { GitHubClient } from './github-client';
import { ReleaseInfo } from './github-release-manager';
import { BundleManifest } from 'lumora-ir';
export interface UpdateCheckOptions {
    owner: string;
    repo: string;
    currentVersion: string;
    includePrerelease?: boolean;
    channel?: 'stable' | 'beta' | 'alpha';
}
export interface UpdateInfo {
    available: boolean;
    currentVersion: string;
    latestVersion: string;
    release?: ReleaseInfo;
    downloadUrl?: string;
    manifestUrl?: string;
    checksumUrl?: string;
    releaseNotes?: string;
}
export interface DownloadOptions {
    url: string;
    outputPath: string;
    onProgress?: (downloaded: number, total: number) => void;
}
export interface VerifyOptions {
    filePath: string;
    expectedChecksum: string;
    algorithm?: 'sha256' | 'sha512' | 'md5';
}
/**
 * GitHub Update Checker
 *
 * Handles checking for updates and downloading release assets.
 */
export declare class GitHubUpdateChecker {
    private client;
    private releaseManager;
    constructor(client: GitHubClient);
    /**
     * Check for available updates
     */
    checkForUpdates(options: UpdateCheckOptions): Promise<UpdateInfo>;
    /**
     * Get latest release (respecting prerelease setting)
     */
    private getLatestRelease;
    /**
     * Download release asset
     */
    downloadAsset(options: DownloadOptions): Promise<void>;
    /**
     * Download bundle from release
     */
    downloadBundle(updateInfo: UpdateInfo, outputDir: string, onProgress?: (downloaded: number, total: number) => void): Promise<{
        bundlePath: string;
        manifestPath: string;
        checksumPath: string;
    }>;
    /**
     * Verify file checksum
     */
    verifyChecksum(options: VerifyOptions): Promise<boolean>;
    /**
     * Verify downloaded bundle
     */
    verifyBundle(bundlePath: string, checksumPath: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Load manifest from downloaded bundle
     */
    loadManifest(manifestPath: string): Promise<BundleManifest>;
    /**
     * Compare two semantic versions
     * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
     */
    compareVersions(v1: string, v2: string): number;
    /**
     * Extract version from tag name (e.g., "v1.2.3" -> "1.2.3")
     */
    private extractVersion;
    /**
     * Parse version string into components
     * Returns [major, minor, patch, prerelease]
     */
    private parseVersion;
}
/**
 * Create a GitHub update checker
 */
export declare function createGitHubUpdateChecker(client: GitHubClient): GitHubUpdateChecker;
//# sourceMappingURL=github-update-checker.d.ts.map