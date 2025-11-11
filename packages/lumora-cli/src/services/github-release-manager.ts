/**
 * GitHub Release Manager for Lumora
 * 
 * Manages OTA (Over-The-Air) updates via GitHub Releases.
 * Handles release creation, asset uploads, version tagging, and release notes generation.
 */

import { GitHubClient } from './github-client';
import { Bundle, BundleManifest } from 'lumora-ir';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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
export class GitHubReleaseManager {
  constructor(private client: GitHubClient) {}

  /**
   * Create a new GitHub release
   */
  async createRelease(options: CreateReleaseOptions): Promise<ReleaseInfo> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      // Generate release notes if requested
      let body = options.body || '';
      if (options.generateNotes) {
        body = await this.generateReleaseNotes(
          options.owner,
          options.repo,
          options.version,
          { previousVersion: this.getPreviousVersion(options.version) }
        );
      }

      const response = await octokit.repos.createRelease({
        owner: options.owner,
        repo: options.repo,
        tag_name: `v${options.version}`,
        name: options.name || `Release v${options.version}`,
        body,
        draft: options.draft ?? false,
        prerelease: options.prerelease ?? false,
        target_commitish: options.targetCommitish,
      });

      return this.mapReleaseInfo(response.data);
    } catch (error: any) {
      throw new Error(`Failed to create release: ${error.message}`);
    }
  }

  /**
   * Get release by tag
   */
  async getRelease(owner: string, repo: string, tag: string): Promise<ReleaseInfo> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();
      const response = await octokit.repos.getReleaseByTag({
        owner,
        repo,
        tag,
      });

      return this.mapReleaseInfo(response.data);
    } catch (error: any) {
      throw new Error(`Failed to get release: ${error.message}`);
    }
  }

  /**
   * Get latest release
   */
  async getLatestRelease(owner: string, repo: string): Promise<ReleaseInfo> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();
      const response = await octokit.repos.getLatestRelease({
        owner,
        repo,
      });

      return this.mapReleaseInfo(response.data);
    } catch (error: any) {
      throw new Error(`Failed to get latest release: ${error.message}`);
    }
  }

  /**
   * List all releases
   */
  async listReleases(
    owner: string,
    repo: string,
    options?: {
      perPage?: number;
      page?: number;
    }
  ): Promise<ReleaseInfo[]> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();
      const response = await octokit.repos.listReleases({
        owner,
        repo,
        per_page: options?.perPage || 30,
        page: options?.page || 1,
      });

      return response.data.map(this.mapReleaseInfo);
    } catch (error: any) {
      throw new Error(`Failed to list releases: ${error.message}`);
    }
  }

  /**
   * Update an existing release
   */
  async updateRelease(
    owner: string,
    repo: string,
    releaseId: number,
    updates: {
      tagName?: string;
      name?: string;
      body?: string;
      draft?: boolean;
      prerelease?: boolean;
    }
  ): Promise<ReleaseInfo> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();
      const response = await octokit.repos.updateRelease({
        owner,
        repo,
        release_id: releaseId,
        tag_name: updates.tagName,
        name: updates.name,
        body: updates.body,
        draft: updates.draft,
        prerelease: updates.prerelease,
      });

      return this.mapReleaseInfo(response.data);
    } catch (error: any) {
      throw new Error(`Failed to update release: ${error.message}`);
    }
  }

  /**
   * Delete a release
   */
  async deleteRelease(owner: string, repo: string, releaseId: number): Promise<void> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();
      await octokit.repos.deleteRelease({
        owner,
        repo,
        release_id: releaseId,
      });
    } catch (error: any) {
      throw new Error(`Failed to delete release: ${error.message}`);
    }
  }

  /**
   * Upload asset to release
   */
  async uploadAsset(options: UploadAssetOptions): Promise<ReleaseAsset> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();

      // Determine content type
      const contentType = options.contentType || this.getContentType(options.name);

      const response = await octokit.repos.uploadReleaseAsset({
        owner: options.owner,
        repo: options.repo,
        release_id: options.releaseId,
        name: options.name,
        data: options.data as any,
        headers: {
          'content-type': contentType,
          'content-length': options.data.length,
        },
        label: options.label,
      });

      return this.mapReleaseAsset(response.data);
    } catch (error: any) {
      throw new Error(`Failed to upload asset: ${error.message}`);
    }
  }

  /**
   * Upload bundle to release
   */
  async uploadBundle(
    owner: string,
    repo: string,
    releaseId: number,
    bundle: Bundle,
    bundlePath?: string
  ): Promise<ReleaseAsset[]> {
    const uploadedAssets: ReleaseAsset[] = [];

    try {
      // Create bundle file if not provided
      let bundleData: Buffer;
      if (bundlePath && fs.existsSync(bundlePath)) {
        bundleData = fs.readFileSync(bundlePath);
      } else {
        // Serialize bundle to JSON
        const bundleJson = {
          manifest: bundle.manifest,
          schemas: Array.from(bundle.schemas.entries()).map(([path, schema]) => ({
            path,
            content: schema,
          })),
          assets: Array.from(bundle.assets.entries()).map(([path, content]) => ({
            path,
            content: content.toString('base64'),
          })),
          metadata: bundle.metadata,
        };
        bundleData = Buffer.from(JSON.stringify(bundleJson), 'utf-8');
      }

      // Upload main bundle file
      const bundleAsset = await this.uploadAsset({
        owner,
        repo,
        releaseId,
        name: 'bundle.json',
        data: bundleData,
        contentType: 'application/json',
        label: 'Lumora Bundle',
      });
      uploadedAssets.push(bundleAsset);

      // Upload manifest separately for quick access
      const manifestData = Buffer.from(
        JSON.stringify(bundle.manifest, null, 2),
        'utf-8'
      );
      const manifestAsset = await this.uploadAsset({
        owner,
        repo,
        releaseId,
        name: 'manifest.json',
        data: manifestData,
        contentType: 'application/json',
        label: 'Bundle Manifest',
      });
      uploadedAssets.push(manifestAsset);

      // Upload checksum file
      const checksum = this.calculateChecksum(bundleData);
      const checksumData = Buffer.from(
        `${checksum}  bundle.json\n${bundle.manifest.checksum}  manifest.json`,
        'utf-8'
      );
      const checksumAsset = await this.uploadAsset({
        owner,
        repo,
        releaseId,
        name: 'checksums.txt',
        data: checksumData,
        contentType: 'text/plain',
        label: 'Checksums',
      });
      uploadedAssets.push(checksumAsset);

      return uploadedAssets;
    } catch (error: any) {
      // Clean up uploaded assets on failure
      for (const asset of uploadedAssets) {
        try {
          await this.deleteAsset(owner, repo, asset.id);
        } catch {
          // Ignore cleanup errors
        }
      }
      throw new Error(`Failed to upload bundle: ${error.message}`);
    }
  }

  /**
   * Delete release asset
   */
  async deleteAsset(owner: string, repo: string, assetId: number): Promise<void> {
    try {
      await this.client.checkRateLimit();

      const octokit = this.client.getOctokit();
      await octokit.repos.deleteReleaseAsset({
        owner,
        repo,
        asset_id: assetId,
      });
    } catch (error: any) {
      throw new Error(`Failed to delete asset: ${error.message}`);
    }
  }

  /**
   * Generate release notes
   */
  async generateReleaseNotes(
    owner: string,
    repo: string,
    version: string,
    options?: ReleaseNotesOptions
  ): Promise<string> {
    const sections: string[] = [];

    // Add version header
    sections.push(`# Release v${version}\n`);

    // Add custom sections if provided
    if (options?.customSections) {
      if (options.customSections.features && options.customSections.features.length > 0) {
        sections.push('## ✨ New Features\n');
        options.customSections.features.forEach(feature => {
          sections.push(`- ${feature}`);
        });
        sections.push('');
      }

      if (options.customSections.fixes && options.customSections.fixes.length > 0) {
        sections.push('## 🐛 Bug Fixes\n');
        options.customSections.fixes.forEach(fix => {
          sections.push(`- ${fix}`);
        });
        sections.push('');
      }

      if (options.customSections.breaking && options.customSections.breaking.length > 0) {
        sections.push('## ⚠️ Breaking Changes\n');
        options.customSections.breaking.forEach(change => {
          sections.push(`- ${change}`);
        });
        sections.push('');
      }
    }

    // Try to use GitHub's automatic release notes generation
    try {
      await this.client.checkRateLimit();
      const octokit = this.client.getOctokit();

      const previousTag = options?.previousVersion
        ? `v${options.previousVersion}`
        : undefined;

      if (previousTag) {
        const response = await octokit.repos.generateReleaseNotes({
          owner,
          repo,
          tag_name: `v${version}`,
          previous_tag_name: previousTag,
        });

        sections.push('## Changes\n');
        sections.push(response.data.body);
      }
    } catch (error) {
      // If automatic generation fails, add a placeholder
      sections.push('## Changes\n');
      sections.push('See commit history for details.');
    }

    // Add installation instructions
    sections.push('\n## 📦 Installation\n');
    sections.push('Download the `bundle.json` asset and deploy to your Lumora app.\n');
    sections.push('```bash');
    sections.push(`# Download bundle`);
    sections.push(`curl -L -o bundle.json https://github.com/${owner}/${repo}/releases/download/v${version}/bundle.json`);
    sections.push('```');

    return sections.join('\n');
  }

  /**
   * Get previous version from current version
   */
  private getPreviousVersion(version: string): string {
    const parts = version.replace(/^v/, '').split('.');
    const major = parseInt(parts[0] || '0', 10);
    const minor = parseInt(parts[1] || '0', 10);
    const patch = parseInt(parts[2] || '0', 10);

    if (patch > 0) {
      return `${major}.${minor}.${patch - 1}`;
    } else if (minor > 0) {
      return `${major}.${minor - 1}.0`;
    } else if (major > 0) {
      return `${major - 1}.0.0`;
    }

    return '0.0.0';
  }

  /**
   * Calculate checksum for data
   */
  private calculateChecksum(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get content type from file extension
   */
  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();

    const contentTypes: Record<string, string> = {
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Map GitHub API release data to ReleaseInfo
   */
  private mapReleaseInfo(data: any): ReleaseInfo {
    return {
      id: data.id,
      tagName: data.tag_name,
      name: data.name,
      body: data.body || '',
      draft: data.draft,
      prerelease: data.prerelease,
      createdAt: new Date(data.created_at),
      publishedAt: data.published_at ? new Date(data.published_at) : null,
      htmlUrl: data.html_url,
      uploadUrl: data.upload_url,
      assets: (data.assets || []).map(this.mapReleaseAsset),
    };
  }

  /**
   * Map GitHub API asset data to ReleaseAsset
   */
  private mapReleaseAsset(data: any): ReleaseAsset {
    return {
      id: data.id,
      name: data.name,
      label: data.label,
      contentType: data.content_type,
      size: data.size,
      downloadCount: data.download_count,
      browserDownloadUrl: data.browser_download_url,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

/**
 * Create a GitHub release manager
 */
export function createGitHubReleaseManager(client: GitHubClient): GitHubReleaseManager {
  return new GitHubReleaseManager(client);
}
