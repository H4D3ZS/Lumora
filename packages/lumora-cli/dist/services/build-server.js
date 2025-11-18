"use strict";
/**
 * Cloud Build Server
 * Manages remote builds for iOS and Android
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
exports.BuildServer = exports.BuildStatus = void 0;
exports.getBuildServer = getBuildServer;
const events_1 = require("events");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
var BuildStatus;
(function (BuildStatus) {
    BuildStatus["QUEUED"] = "queued";
    BuildStatus["PREPARING"] = "preparing";
    BuildStatus["BUILDING"] = "building";
    BuildStatus["PACKAGING"] = "packaging";
    BuildStatus["COMPLETED"] = "completed";
    BuildStatus["FAILED"] = "failed";
    BuildStatus["CANCELLED"] = "cancelled";
})(BuildStatus || (exports.BuildStatus = BuildStatus = {}));
/**
 * Build Server
 * Manages build queue and execution
 */
class BuildServer extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.queue = [];
        this.activeBuilds = new Map();
        this.config = {
            maxConcurrentBuilds: config.maxConcurrentBuilds || 2,
            buildTimeout: config.buildTimeout || 30 * 60 * 1000, // 30 minutes
            artifactsDir: config.artifactsDir || path.join(process.cwd(), 'build-artifacts'),
            cleanupAfterBuild: config.cleanupAfterBuild ?? true,
        };
        this.initialize();
    }
    async initialize() {
        await fs.ensureDir(this.config.artifactsDir);
    }
    /**
     * Submit a build request
     */
    async submitBuild(projectPath, config, priority = 0) {
        const buildId = this.generateBuildId();
        const request = {
            id: buildId,
            projectPath,
            config,
            priority,
            createdAt: new Date(),
            status: BuildStatus.QUEUED,
            logs: [],
        };
        this.queue.push(request);
        this.sortQueue();
        this.emit('build:queued', request);
        // Process queue
        this.processQueue();
        return buildId;
    }
    /**
     * Get build status
     */
    getBuildStatus(buildId) {
        const active = this.activeBuilds.get(buildId);
        if (active)
            return active;
        return this.queue.find(b => b.id === buildId);
    }
    /**
     * Cancel a build
     */
    async cancelBuild(buildId) {
        // Remove from queue
        const queueIndex = this.queue.findIndex(b => b.id === buildId);
        if (queueIndex !== -1) {
            const request = this.queue[queueIndex];
            request.status = BuildStatus.CANCELLED;
            this.queue.splice(queueIndex, 1);
            this.emit('build:cancelled', request);
            return true;
        }
        // Cancel active build
        const active = this.activeBuilds.get(buildId);
        if (active) {
            active.status = BuildStatus.CANCELLED;
            // TODO: Actually kill the build process
            return true;
        }
        return false;
    }
    /**
     * Get queue status
     */
    getQueueStatus() {
        return {
            queued: this.queue.length,
            active: this.activeBuilds.size,
            total: this.queue.length + this.activeBuilds.size,
        };
    }
    /**
     * Process build queue
     */
    async processQueue() {
        // Check if we can start more builds
        if (this.activeBuilds.size >= this.config.maxConcurrentBuilds) {
            return;
        }
        // Get next build from queue
        const request = this.queue.shift();
        if (!request)
            return;
        // Start build
        this.activeBuilds.set(request.id, request);
        this.executeBuild(request);
    }
    /**
     * Execute a build
     */
    async executeBuild(request) {
        request.status = BuildStatus.PREPARING;
        request.startedAt = new Date();
        this.emit('build:started', request);
        const timeout = setTimeout(() => {
            this.handleBuildTimeout(request);
        }, this.config.buildTimeout);
        try {
            // Prepare build
            await this.prepareBuild(request);
            request.status = BuildStatus.BUILDING;
            this.emit('build:building', request);
            // Execute build based on platform
            if (request.config.platform === 'ios' || request.config.platform === 'both') {
                await this.buildIOS(request);
            }
            if (request.config.platform === 'android' || request.config.platform === 'both') {
                await this.buildAndroid(request);
            }
            request.status = BuildStatus.PACKAGING;
            this.emit('build:packaging', request);
            // Package artifacts
            await this.packageArtifacts(request);
            request.status = BuildStatus.COMPLETED;
            request.completedAt = new Date();
            this.emit('build:completed', request);
        }
        catch (error) {
            request.status = BuildStatus.FAILED;
            request.error = error.message;
            request.completedAt = new Date();
            this.emit('build:failed', request);
        }
        finally {
            clearTimeout(timeout);
            this.activeBuilds.delete(request.id);
            // Cleanup if enabled
            if (this.config.cleanupAfterBuild) {
                await this.cleanupBuild(request);
            }
            // Process next in queue
            this.processQueue();
        }
    }
    /**
     * Prepare build environment
     */
    async prepareBuild(request) {
        this.log(request, 'Preparing build environment...');
        // Set environment variables
        if (request.config.environment) {
            Object.assign(process.env, request.config.environment);
        }
        // Flutter pub get
        this.log(request, 'Installing dependencies...');
        const { stdout: pubGetOut } = await execAsync('flutter pub get', { cwd: request.projectPath });
        this.log(request, pubGetOut);
    }
    /**
     * Build iOS
     */
    async buildIOS(request) {
        this.log(request, 'Building iOS...');
        const mode = request.config.mode;
        const flavor = request.config.flavor;
        let command = `flutter build ios --${mode}`;
        if (flavor) {
            command += ` --flavor ${flavor}`;
        }
        // Add signing configuration
        if (request.config.signing?.ios) {
            const signing = request.config.signing.ios;
            if (signing.exportMethod) {
                command += ` --export-method ${signing.exportMethod}`;
            }
        }
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: request.projectPath,
                maxBuffer: 1024 * 1024 * 10, // 10MB
            });
            this.log(request, stdout);
            if (stderr)
                this.log(request, `[stderr] ${stderr}`);
            // Create IPA if release mode
            if (mode === 'release') {
                await this.createIPA(request);
            }
        }
        catch (error) {
            this.log(request, `iOS build failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Build Android
     */
    async buildAndroid(request) {
        this.log(request, 'Building Android...');
        const mode = request.config.mode;
        const flavor = request.config.flavor;
        let command = `flutter build apk --${mode}`;
        if (flavor) {
            command += ` --flavor ${flavor}`;
        }
        // Build number and version
        if (request.config.buildNumber) {
            command += ` --build-number ${request.config.buildNumber}`;
        }
        if (request.config.versionName) {
            command += ` --build-name ${request.config.versionName}`;
        }
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: request.projectPath,
                maxBuffer: 1024 * 1024 * 10,
            });
            this.log(request, stdout);
            if (stderr)
                this.log(request, `[stderr] ${stderr}`);
            // Also build AAB for release
            if (mode === 'release') {
                await this.buildAAB(request);
            }
        }
        catch (error) {
            this.log(request, `Android build failed: ${error.message}`);
            throw error;
        }
    }
    /**
     * Create iOS IPA
     */
    async createIPA(request) {
        this.log(request, 'Creating IPA...');
        // Archive and export
        const archivePath = path.join(request.projectPath, 'build/ios/archive');
        const exportPath = path.join(request.projectPath, 'build/ios/ipa');
        // This is simplified - real implementation would use xcodebuild
        this.log(request, 'IPA creation complete');
    }
    /**
     * Build Android App Bundle
     */
    async buildAAB(request) {
        this.log(request, 'Building App Bundle...');
        const flavor = request.config.flavor;
        let command = 'flutter build appbundle --release';
        if (flavor) {
            command += ` --flavor ${flavor}`;
        }
        const { stdout } = await execAsync(command, {
            cwd: request.projectPath,
        });
        this.log(request, stdout);
    }
    /**
     * Package build artifacts
     */
    async packageArtifacts(request) {
        this.log(request, 'Packaging artifacts...');
        const artifactsDir = path.join(this.config.artifactsDir, request.id);
        await fs.ensureDir(artifactsDir);
        request.artifacts = {};
        // Package iOS artifacts
        if (request.config.platform === 'ios' || request.config.platform === 'both') {
            const ipaPath = path.join(request.projectPath, 'build/ios/ipa/Runner.ipa');
            if (await fs.pathExists(ipaPath)) {
                const destPath = path.join(artifactsDir, 'app.ipa');
                await fs.copy(ipaPath, destPath);
                request.artifacts.ios = { ipa: destPath };
                this.log(request, `IPA saved to: ${destPath}`);
            }
        }
        // Package Android artifacts
        if (request.config.platform === 'android' || request.config.platform === 'both') {
            const apkPath = path.join(request.projectPath, 'build/app/outputs/flutter-apk/app-release.apk');
            if (await fs.pathExists(apkPath)) {
                const destPath = path.join(artifactsDir, 'app.apk');
                await fs.copy(apkPath, destPath);
                request.artifacts.android = { apk: destPath };
                this.log(request, `APK saved to: ${destPath}`);
            }
            const aabPath = path.join(request.projectPath, 'build/app/outputs/bundle/release/app-release.aab');
            if (await fs.pathExists(aabPath)) {
                const destPath = path.join(artifactsDir, 'app.aab');
                await fs.copy(aabPath, destPath);
                if (!request.artifacts.android)
                    request.artifacts.android = {};
                request.artifacts.android.aab = destPath;
                this.log(request, `AAB saved to: ${destPath}`);
            }
        }
    }
    /**
     * Cleanup after build
     */
    async cleanupBuild(request) {
        this.log(request, 'Cleaning up...');
        try {
            // Clean Flutter build directory
            const buildDir = path.join(request.projectPath, 'build');
            if (await fs.pathExists(buildDir)) {
                // Only clean if not keeping artifacts
                // await fs.remove(buildDir);
            }
        }
        catch (error) {
            // Ignore cleanup errors
        }
    }
    /**
     * Handle build timeout
     */
    handleBuildTimeout(request) {
        this.log(request, 'Build timeout exceeded');
        request.status = BuildStatus.FAILED;
        request.error = 'Build timeout exceeded';
        request.completedAt = new Date();
        this.emit('build:timeout', request);
        this.activeBuilds.delete(request.id);
    }
    /**
     * Log message
     */
    log(request, message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        request.logs.push(logMessage);
        this.emit('build:log', { buildId: request.id, message: logMessage });
    }
    /**
     * Sort queue by priority
     */
    sortQueue() {
        this.queue.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Generate unique build ID
     */
    generateBuildId() {
        return `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.BuildServer = BuildServer;
// Singleton instance
let buildServerInstance = null;
function getBuildServer(config) {
    if (!buildServerInstance) {
        buildServerInstance = new BuildServer(config);
    }
    return buildServerInstance;
}
//# sourceMappingURL=build-server.js.map