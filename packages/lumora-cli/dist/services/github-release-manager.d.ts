/**
 * GitHub Release Manager for Lumora
 *
 * Manages OTA (Over-The-Air) updates via GitHub Releases.
 * Handles release creation, asset uploads, version tagging, and release notes generation.
 */
import { GitHubClient } from './github-client';
import { Bundle } from 'lumora-ir';
export interface CreateReleaseOptions {
    owner: string;
    repo: string;
    version: string;
    name?: string;
    body?: string;
    draft?: boolean;
    prerelease?: boolean;
    generateNotes?: boolean;
    targetCommitish?: string;
}
export interface ReleaseInfo {
    id: number;
    tagName: string;
    name: string;
    body: string;
    draft: boolean;
    prerelease: boolean;
    createdAt: Date;
    publishedAt: Date | null;
    htmlUrl: string;
    uploadUrl: string;
    assets: ReleaseAsset[];
}
export interface ReleaseAsset {
    id: number;
    name: string;
    label: string | null;
    contentType: string;
    size: number;
    downloadCount: number;
    browserDownloadUrl: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface UploadAssetOptions {
    owner: string;
    repo: string;
    releaseId: number;
    name: string;
    data: Buffer;
    contentType?: string;
    label?: string;
}
export interface ReleaseNotesOptions {
    previousVersion?: string;
    includeChangelog?: boolean;
    customSections?: {
        features?: string[];
        fixes?: string[];
        breaking?: string[];
    };
}
/**
 * GitHub Release Manager
 *
 * Handles creation and management of GitHub releases for OTA updates.
 */
export declare class GitHubReleaseManager {
    private client;
    constructor(client: GitHubClient);
    /**
     * Create a new GitHub release
     */
    createRelease(options: CreateReleaseOptions): Promise<ReleaseInfo>;
    /**
     * Get release by tag
     */
    getRelease(owner: string, repo: string, tag: string): Promise<ReleaseInfo>;
    /**
     * Get latest release
     */
    getLatestRelease(owner: string, repo: string): Promise<ReleaseInfo>;
    /**
     * List all releases
     */
    listReleases(owner: string, repo: string, options?: {
        perPage?: number;
        page?: number;
    }): Promise<ReleaseInfo[]>;
    /**
     * Update an existing release
     */
    updateRelease(owner: string, repo: string, releaseId: number, updates: {
        tagName?: string;
        name?: string;
        body?: string;
        draft?: boolean;
        prerelease?: boolean;
    }): Promise<ReleaseInfo>;
    /**
     * Delete a release
     */
    deleteRelease(owner: string, repo: string, releaseId: number): Promise<void>;
    /**
     * Upload asset to release
     */
    uploadAsset(options: UploadAssetOptions): Promise<ReleaseAsset>;
    /**
     * Upload bundle to release
     */
    uploadBundle(owner: string, repo: string, releaseId: number, bundle: Bundle, bundlePath?: string): Promise<ReleaseAsset[]>;
    /**
     * Delete release asset
     */
    deleteAsset(owner: string, repo: string, assetId: number): Promise<void>;
    /**
     * Generate release notes
     */
    generateReleaseNotes(owner: string, repo: string, version: string, options?: ReleaseNotesOptions): Promise<string>;
    /**
     * Get previous version from current version
     */
    private getPreviousVersion;
    /**
     * Calculate checksum for data
     */
    private calculateChecksum;
    /**
     * Get content type from file extension
     */
    private getContentType;
    /**
     * Map GitHub API release data to ReleaseInfo
     */
    private mapReleaseInfo;
    /**
     * Map GitHub API asset data to ReleaseAsset
     */
    private mapReleaseAsset;
}
/**
 * Create a GitHub release manager
 */
export declare function createGitHubReleaseManager(client: GitHubClient): GitHubReleaseManager;
//# sourceMappingURL=github-release-manager.d.ts.map