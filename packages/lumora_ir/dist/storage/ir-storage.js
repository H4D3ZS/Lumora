"use strict";
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
exports.IRStorage = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const ir_validator_1 = require("../validator/ir-validator");
/**
 * IR Storage System
 * Manages storage and versioning of Lumora IR
 */
class IRStorage {
    constructor(storageDir = '.lumora/ir') {
        this.validator = (0, ir_validator_1.getValidator)();
        this.storageDir = storageDir;
        this.ensureStorageDir();
    }
    /**
     * Ensure storage directory exists
     */
    ensureStorageDir() {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }
    /**
     * Generate checksum for IR
     */
    generateChecksum(ir) {
        const content = JSON.stringify(ir, null, 2);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    /**
     * Get file path for IR entry
     */
    getFilePath(id, version) {
        const filename = version !== undefined
            ? `${id}.v${version}.json`
            : `${id}.json`;
        return path.join(this.storageDir, filename);
    }
    /**
     * Get history directory path
     */
    getHistoryDir(id) {
        return path.join(this.storageDir, 'history', id);
    }
    /**
     * Store IR with versioning
     */
    store(id, ir) {
        // Validate IR before storing
        this.validator.validateOrThrow(ir);
        const timestamp = Date.now();
        const checksum = this.generateChecksum(ir);
        // Get current version
        const currentVersion = this.getCurrentVersion(id);
        const newVersion = currentVersion + 1;
        // Archive previous version to history BEFORE writing new version
        if (currentVersion > 0) {
            this.archiveVersion(id, currentVersion);
        }
        const entry = {
            id,
            ir,
            version: newVersion,
            timestamp,
            checksum,
        };
        // Store current version
        const filePath = this.getFilePath(id);
        fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8');
        return entry;
    }
    /**
     * Retrieve IR by id
     */
    retrieve(id, version) {
        try {
            let filePath;
            if (version !== undefined) {
                // Retrieve specific version from history
                const historyDir = this.getHistoryDir(id);
                filePath = path.join(historyDir, `v${version}.json`);
            }
            else {
                // Retrieve latest version
                filePath = this.getFilePath(id);
            }
            if (!fs.existsSync(filePath)) {
                return null;
            }
            const content = fs.readFileSync(filePath, 'utf8');
            const entry = JSON.parse(content);
            // Validate retrieved IR
            this.validator.validateOrThrow(entry.ir);
            return entry;
        }
        catch (error) {
            console.error(`Failed to retrieve IR ${id}:`, error);
            return null;
        }
    }
    /**
     * Get current version number
     */
    getCurrentVersion(id) {
        const filePath = this.getFilePath(id);
        if (!fs.existsSync(filePath)) {
            return 0;
        }
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const entry = JSON.parse(content);
            return entry.version;
        }
        catch {
            return 0;
        }
    }
    /**
     * Archive version to history
     */
    archiveVersion(id, version) {
        const currentPath = this.getFilePath(id);
        if (!fs.existsSync(currentPath)) {
            return;
        }
        const historyDir = this.getHistoryDir(id);
        if (!fs.existsSync(historyDir)) {
            fs.mkdirSync(historyDir, { recursive: true });
        }
        const historyPath = path.join(historyDir, `v${version}.json`);
        fs.copyFileSync(currentPath, historyPath);
    }
    /**
     * Get version history for an IR
     */
    getHistory(id) {
        const historyDir = this.getHistoryDir(id);
        if (!fs.existsSync(historyDir)) {
            return [];
        }
        const files = fs.readdirSync(historyDir)
            .filter(f => f.endsWith('.json'))
            .sort();
        const history = [];
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(historyDir, file), 'utf8');
                const entry = JSON.parse(content);
                history.push(entry);
            }
            catch (error) {
                console.error(`Failed to read history file ${file}:`, error);
            }
        }
        return history;
    }
    /**
     * Delete IR and its history
     */
    delete(id) {
        try {
            // Delete current version
            const filePath = this.getFilePath(id);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            // Delete history
            const historyDir = this.getHistoryDir(id);
            if (fs.existsSync(historyDir)) {
                fs.rmSync(historyDir, { recursive: true, force: true });
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to delete IR ${id}:`, error);
            return false;
        }
    }
    /**
     * List all stored IRs
     */
    list() {
        const files = fs.readdirSync(this.storageDir)
            .filter(f => f.endsWith('.json') && !f.includes('.v'));
        return files.map(f => f.replace('.json', ''));
    }
    /**
     * Check if IR has changed since last store
     */
    hasChanged(id, ir) {
        const current = this.retrieve(id);
        if (!current) {
            return true;
        }
        const newChecksum = this.generateChecksum(ir);
        return newChecksum !== current.checksum;
    }
}
exports.IRStorage = IRStorage;
