/**
 * OTA Update System Types
 * Defines all types for the over-the-air update system
 */

export interface UpdateManifest {
  id: string;
  version: string;
  channel: UpdateChannel;
  platform: Platform;
  createdAt: string;
  publishedAt?: string;
  assets: Asset[];
  metadata: UpdateMetadata;
  checksum: string;
  size: number;
  runtimeVersion: string;
}

export type UpdateChannel = 'production' | 'staging' | 'development' | 'preview';

export type Platform = 'ios' | 'android' | 'web' | 'all';

export interface Asset {
  key: string;
  path: string;
  url: string;
  hash: string;
  size: number;
  contentType: string;
}

export interface UpdateMetadata {
  description?: string;
  releaseNotes?: string;
  author?: string;
  commitHash?: string;
  buildNumber?: number;
  requiredMinVersion?: string;
  tags?: string[];
}

export interface UpdateRequest {
  projectId: string;
  runtimeVersion: string;
  platform: Platform;
  channel: UpdateChannel;
  currentUpdateId?: string;
  sdkVersion?: string;
  deviceId?: string;
}

export interface UpdateResponse {
  updateId: string;
  manifestUrl: string;
  isRollBackToEmbedded: boolean;
  directive: UpdateDirective;
}

export type UpdateDirective = 'normal' | 'rollback' | 'no_update_available';

export interface UpdateDeployment {
  id: string;
  manifestId: string;
  channel: UpdateChannel;
  rolloutPercentage: number;
  status: DeploymentStatus;
  createdAt: string;
  updatedAt: string;
}

export type DeploymentStatus = 'pending' | 'active' | 'paused' | 'completed' | 'rolled_back';

export interface UpdateStats {
  totalDownloads: number;
  successfulUpdates: number;
  failedUpdates: number;
  rollbacks: number;
  activeUsers: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  apiKey: string;
  channels: UpdateChannel[];
  createdAt: string;
  owner: string;
}

export interface UpdateHistory {
  updateId: string;
  timestamp: string;
  action: 'published' | 'downloaded' | 'installed' | 'failed' | 'rolled_back';
  deviceId?: string;
  error?: string;
}
