/**
 * Cloud Build Server
 * Manages remote builds for iOS and Android
 */
import { EventEmitter } from 'events';
export interface BuildConfig {
    platform: 'ios' | 'android' | 'both';
    mode: 'debug' | 'release' | 'profile';
    flavor?: string;
    buildNumber?: string;
    versionName?: string;
    outputDir?: string;
    signing?: SigningConfig;
    environment?: Record<string, string>;
}
export interface SigningConfig {
    ios?: {
        certificatePath?: string;
        provisioningProfilePath?: string;
        teamId?: string;
        exportMethod?: 'app-store' | 'ad-hoc' | 'development' | 'enterprise';
    };
    android?: {
        keystorePath?: string;
        keystorePassword?: string;
        keyAlias?: string;
        keyPassword?: string;
    };
}
export interface BuildRequest {
    id: string;
    projectPath: string;
    config: BuildConfig;
    priority: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    status: BuildStatus;
    logs: string[];
    artifacts?: BuildArtifacts;
    error?: string;
}
export declare enum BuildStatus {
    QUEUED = "queued",
    PREPARING = "preparing",
    BUILDING = "building",
    PACKAGING = "packaging",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface BuildArtifacts {
    ios?: {
        ipa?: string;
        dSYM?: string;
        manifest?: string;
    };
    android?: {
        apk?: string;
        aab?: string;
        mapping?: string;
    };
}
export interface BuildServerConfig {
    maxConcurrentBuilds?: number;
    buildTimeout?: number;
    artifactsDir?: string;
    cleanupAfterBuild?: boolean;
}
/**
 * Build Server
 * Manages build queue and execution
 */
export declare class BuildServer extends EventEmitter {
    private queue;
    private activeBuilds;
    private config;
    constructor(config?: BuildServerConfig);
    private initialize;
    /**
     * Submit a build request
     */
    submitBuild(projectPath: string, config: BuildConfig, priority?: number): Promise<string>;
    /**
     * Get build status
     */
    getBuildStatus(buildId: string): BuildRequest | undefined;
    /**
     * Cancel a build
     */
    cancelBuild(buildId: string): Promise<boolean>;
    /**
     * Get queue status
     */
    getQueueStatus(): {
        queued: number;
        active: number;
        total: number;
    };
    /**
     * Process build queue
     */
    private processQueue;
    /**
     * Execute a build
     */
    private executeBuild;
    /**
     * Prepare build environment
     */
    private prepareBuild;
    /**
     * Build iOS
     */
    private buildIOS;
    /**
     * Build Android
     */
    private buildAndroid;
    /**
     * Create iOS IPA
     */
    private createIPA;
    /**
     * Build Android App Bundle
     */
    private buildAAB;
    /**
     * Package build artifacts
     */
    private packageArtifacts;
    /**
     * Cleanup after build
     */
    private cleanupBuild;
    /**
     * Handle build timeout
     */
    private handleBuildTimeout;
    /**
     * Log message
     */
    private log;
    /**
     * Sort queue by priority
     */
    private sortQueue;
    /**
     * Generate unique build ID
     */
    private generateBuildId;
}
export declare function getBuildServer(config?: BuildServerConfig): BuildServer;
//# sourceMappingURL=build-server.d.ts.map