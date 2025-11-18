/**
 * Lumora OTA Update Server
 * Production-ready over-the-air update server with versioning, channels, and rollback
 */
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import * as semver from 'semver';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';
export class LumoraUpdateServer {
    constructor(port = 3002, dataDir = './data') {
        this.manifests = new Map();
        this.deployments = new Map();
        this.projects = new Map();
        this.updateHistory = [];
        this.port = port;
        this.dataDir = dataDir;
        this.app = express();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.loadPersistedData();
    }
    initializeMiddleware() {
        // Security
        this.app.use(helmet());
        // CORS
        this.app.use(cors({
            origin: '*', // Configure based on your needs
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        }));
        // Body parsing
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
        // Compression
        this.app.use(compression());
        // Static files (for serving update assets)
        this.app.use('/assets', express.static(path.join(this.dataDir, 'assets')));
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }
    initializeRoutes() {
        // Health check
        this.app.get('/health', this.handleHealthCheck.bind(this));
        // Update check endpoint (client requests)
        this.app.post('/api/v1/updates/check', this.handleUpdateCheck.bind(this));
        // Update manifest endpoint
        this.app.get('/api/v1/manifests/:manifestId', this.handleGetManifest.bind(this));
        // Publish new update
        this.app.post('/api/v1/updates/publish', this.handlePublishUpdate.bind(this));
        // List updates
        this.app.get('/api/v1/updates', this.handleListUpdates.bind(this));
        // Rollback update
        this.app.post('/api/v1/updates/:updateId/rollback', this.handleRollback.bind(this));
        // Get update stats
        this.app.get('/api/v1/stats', this.handleGetStats.bind(this));
        // Project management
        this.app.post('/api/v1/projects', this.handleCreateProject.bind(this));
        this.app.get('/api/v1/projects/:projectId', this.handleGetProject.bind(this));
        // Deployment management
        this.app.post('/api/v1/deployments', this.handleCreateDeployment.bind(this));
        this.app.get('/api/v1/deployments', this.handleListDeployments.bind(this));
        this.app.put('/api/v1/deployments/:deploymentId', this.handleUpdateDeployment.bind(this));
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Not found' });
        });
        // Error handler
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal server error', message: err.message });
        });
    }
    // Health check
    handleHealthCheck(req, res) {
        res.json({
            status: 'healthy',
            version: '1.0.0',
            uptime: process.uptime(),
            manifests: this.manifests.size,
            deployments: this.deployments.size,
        });
    }
    // Update check - client requests available update
    async handleUpdateCheck(req, res) {
        try {
            const updateRequest = req.body;
            // Validate request
            if (!updateRequest.projectId || !updateRequest.runtimeVersion || !updateRequest.platform) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            // Find matching update
            const update = this.findBestUpdate(updateRequest);
            if (!update) {
                res.json({
                    directive: 'no_update_available',
                    isRollBackToEmbedded: false,
                });
                return;
            }
            // Log download
            this.logUpdateHistory({
                updateId: update.id,
                timestamp: new Date().toISOString(),
                action: 'downloaded',
                deviceId: updateRequest.deviceId,
            });
            // Return update response
            const response = {
                updateId: update.id,
                manifestUrl: `/api/v1/manifests/${update.id}`,
                isRollBackToEmbedded: false,
                directive: 'normal',
            };
            res.json(response);
        }
        catch (error) {
            console.error('Update check error:', error);
            res.status(500).json({ error: 'Failed to check for updates' });
        }
    }
    // Get manifest
    handleGetManifest(req, res) {
        const { manifestId } = req.params;
        const manifest = this.manifests.get(manifestId);
        if (!manifest) {
            res.status(404).json({ error: 'Manifest not found' });
            return;
        }
        res.json(manifest);
    }
    // Publish new update
    async handlePublishUpdate(req, res) {
        try {
            const manifest = req.body;
            // Validate
            if (!manifest.version || !manifest.channel || !manifest.platform) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            // Create manifest
            const updateId = uuidv4();
            const fullManifest = {
                id: updateId,
                version: manifest.version,
                channel: manifest.channel,
                platform: manifest.platform,
                createdAt: new Date().toISOString(),
                publishedAt: new Date().toISOString(),
                assets: manifest.assets || [],
                metadata: manifest.metadata || {},
                checksum: this.generateChecksum(manifest),
                size: this.calculateSize(manifest.assets || []),
                runtimeVersion: manifest.runtimeVersion || '1.0.0',
            };
            // Store manifest
            this.manifests.set(updateId, fullManifest);
            // Log publish
            this.logUpdateHistory({
                updateId,
                timestamp: new Date().toISOString(),
                action: 'published',
            });
            // Persist
            await this.persistData();
            res.status(201).json({
                success: true,
                updateId,
                manifest: fullManifest,
            });
        }
        catch (error) {
            console.error('Publish error:', error);
            res.status(500).json({ error: 'Failed to publish update' });
        }
    }
    // List updates
    handleListUpdates(req, res) {
        const { channel, platform, limit = 50 } = req.query;
        let updates = Array.from(this.manifests.values());
        // Filter by channel
        if (channel) {
            updates = updates.filter(u => u.channel === channel);
        }
        // Filter by platform
        if (platform) {
            updates = updates.filter(u => u.platform === platform || u.platform === 'all');
        }
        // Sort by date (newest first)
        updates.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() -
            new Date(a.publishedAt || a.createdAt).getTime());
        // Limit
        updates = updates.slice(0, Number(limit));
        res.json({
            updates,
            total: this.manifests.size,
            filtered: updates.length,
        });
    }
    // Rollback update
    async handleRollback(req, res) {
        try {
            const { updateId } = req.params;
            const { targetVersion } = req.body;
            const manifest = this.manifests.get(updateId);
            if (!manifest) {
                res.status(404).json({ error: 'Update not found' });
                return;
            }
            // Find target version
            let targetManifest;
            if (targetVersion) {
                targetManifest = Array.from(this.manifests.values()).find(m => m.version === targetVersion && m.channel === manifest.channel);
            }
            // Log rollback
            this.logUpdateHistory({
                updateId,
                timestamp: new Date().toISOString(),
                action: 'rolled_back',
            });
            await this.persistData();
            res.json({
                success: true,
                rolledBackFrom: updateId,
                rolledBackTo: targetManifest?.id,
            });
        }
        catch (error) {
            console.error('Rollback error:', error);
            res.status(500).json({ error: 'Failed to rollback update' });
        }
    }
    // Get stats
    handleGetStats(req, res) {
        const downloads = this.updateHistory.filter(h => h.action === 'downloaded').length;
        const successful = this.updateHistory.filter(h => h.action === 'installed').length;
        const failed = this.updateHistory.filter(h => h.action === 'failed').length;
        const rollbacks = this.updateHistory.filter(h => h.action === 'rolled_back').length;
        const stats = {
            totalDownloads: downloads,
            successfulUpdates: successful,
            failedUpdates: failed,
            rollbacks,
            activeUsers: new Set(this.updateHistory.map(h => h.deviceId).filter(Boolean)).size,
        };
        res.json(stats);
    }
    // Create project
    async handleCreateProject(req, res) {
        try {
            const { name, slug } = req.body;
            if (!name || !slug) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            const projectId = uuidv4();
            const project = {
                id: projectId,
                name,
                slug,
                apiKey: this.generateApiKey(),
                channels: ['production', 'staging', 'development'],
                createdAt: new Date().toISOString(),
                owner: req.headers['x-user-id'] || 'anonymous',
            };
            this.projects.set(projectId, project);
            await this.persistData();
            res.status(201).json(project);
        }
        catch (error) {
            console.error('Create project error:', error);
            res.status(500).json({ error: 'Failed to create project' });
        }
    }
    // Get project
    handleGetProject(req, res) {
        const { projectId } = req.params;
        const project = this.projects.get(projectId);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json(project);
    }
    // Create deployment
    async handleCreateDeployment(req, res) {
        try {
            const { manifestId, channel, rolloutPercentage = 100 } = req.body;
            const manifest = this.manifests.get(manifestId);
            if (!manifest) {
                res.status(404).json({ error: 'Manifest not found' });
                return;
            }
            const deploymentId = uuidv4();
            const deployment = {
                id: deploymentId,
                manifestId,
                channel: channel || manifest.channel,
                rolloutPercentage,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            this.deployments.set(deploymentId, deployment);
            await this.persistData();
            res.status(201).json(deployment);
        }
        catch (error) {
            console.error('Create deployment error:', error);
            res.status(500).json({ error: 'Failed to create deployment' });
        }
    }
    // List deployments
    handleListDeployments(req, res) {
        const { channel, status } = req.query;
        let deployments = Array.from(this.deployments.values());
        if (channel) {
            deployments = deployments.filter(d => d.channel === channel);
        }
        if (status) {
            deployments = deployments.filter(d => d.status === status);
        }
        res.json({ deployments });
    }
    // Update deployment
    async handleUpdateDeployment(req, res) {
        try {
            const { deploymentId } = req.params;
            const updates = req.body;
            const deployment = this.deployments.get(deploymentId);
            if (!deployment) {
                res.status(404).json({ error: 'Deployment not found' });
                return;
            }
            // Update fields
            Object.assign(deployment, updates, {
                updatedAt: new Date().toISOString(),
            });
            this.deployments.set(deploymentId, deployment);
            await this.persistData();
            res.json(deployment);
        }
        catch (error) {
            console.error('Update deployment error:', error);
            res.status(500).json({ error: 'Failed to update deployment' });
        }
    }
    // Helper: Find best update for request
    findBestUpdate(request) {
        const candidates = Array.from(this.manifests.values()).filter(manifest => {
            // Match channel
            if (manifest.channel !== request.channel)
                return false;
            // Match platform
            if (manifest.platform !== 'all' && manifest.platform !== request.platform)
                return false;
            // Check runtime version compatibility
            if (manifest.runtimeVersion && request.runtimeVersion) {
                try {
                    if (!semver.satisfies(request.runtimeVersion, `>=${manifest.runtimeVersion}`)) {
                        return false;
                    }
                }
                catch (e) {
                    // Invalid semver, skip
                    return false;
                }
            }
            return true;
        });
        if (candidates.length === 0)
            return null;
        // Sort by version (newest first)
        candidates.sort((a, b) => {
            try {
                return semver.rcompare(a.version, b.version);
            }
            catch (e) {
                return 0;
            }
        });
        return candidates[0];
    }
    // Helper: Generate checksum
    generateChecksum(data) {
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(data));
        return hash.digest('hex');
    }
    // Helper: Calculate total size
    calculateSize(assets) {
        return assets.reduce((total, asset) => total + (asset.size || 0), 0);
    }
    // Helper: Generate API key
    generateApiKey() {
        return `lum_${crypto.randomBytes(32).toString('hex')}`;
    }
    // Helper: Log update history
    logUpdateHistory(entry) {
        this.updateHistory.push(entry);
        // Keep last 10000 entries
        if (this.updateHistory.length > 10000) {
            this.updateHistory = this.updateHistory.slice(-10000);
        }
    }
    // Persistence
    async loadPersistedData() {
        try {
            await fs.ensureDir(this.dataDir);
            const manifestsPath = path.join(this.dataDir, 'manifests.json');
            const deploymentsPath = path.join(this.dataDir, 'deployments.json');
            const projectsPath = path.join(this.dataDir, 'projects.json');
            const historyPath = path.join(this.dataDir, 'history.json');
            if (await fs.pathExists(manifestsPath)) {
                const data = await fs.readJson(manifestsPath);
                this.manifests = new Map(Object.entries(data));
            }
            if (await fs.pathExists(deploymentsPath)) {
                const data = await fs.readJson(deploymentsPath);
                this.deployments = new Map(Object.entries(data));
            }
            if (await fs.pathExists(projectsPath)) {
                const data = await fs.readJson(projectsPath);
                this.projects = new Map(Object.entries(data));
            }
            if (await fs.pathExists(historyPath)) {
                this.updateHistory = await fs.readJson(historyPath);
            }
            console.log('✅ Loaded persisted data');
        }
        catch (error) {
            console.error('Failed to load persisted data:', error);
        }
    }
    async persistData() {
        try {
            await fs.ensureDir(this.dataDir);
            await fs.writeJson(path.join(this.dataDir, 'manifests.json'), Object.fromEntries(this.manifests), { spaces: 2 });
            await fs.writeJson(path.join(this.dataDir, 'deployments.json'), Object.fromEntries(this.deployments), { spaces: 2 });
            await fs.writeJson(path.join(this.dataDir, 'projects.json'), Object.fromEntries(this.projects), { spaces: 2 });
            await fs.writeJson(path.join(this.dataDir, 'history.json'), this.updateHistory, { spaces: 2 });
        }
        catch (error) {
            console.error('Failed to persist data:', error);
        }
    }
    // Start server
    async start() {
        return new Promise((resolve) => {
            const server = createServer(this.app);
            server.listen(this.port, () => {
                console.log(`\n🚀 Lumora OTA Update Server`);
                console.log(`📡 Server running on http://localhost:${this.port}`);
                console.log(`📊 Health check: http://localhost:${this.port}/health`);
                console.log(`📦 Manifests loaded: ${this.manifests.size}`);
                console.log(`🚀 Deployments active: ${this.deployments.size}`);
                console.log(`\n✅ Ready to serve updates!\n`);
                resolve();
            });
        });
    }
}
// Export singleton instance
let serverInstance = null;
export function createUpdateServer(port, dataDir) {
    if (!serverInstance) {
        serverInstance = new LumoraUpdateServer(port, dataDir);
    }
    return serverInstance;
}
export function getUpdateServer() {
    return serverInstance;
}
//# sourceMappingURL=update-server.js.map