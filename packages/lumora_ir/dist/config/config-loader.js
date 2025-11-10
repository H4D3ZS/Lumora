"use strict";
/**
 * Configuration Loader
 * Integrates ModeConfig with WidgetMappingRegistry and other components
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
exports.loadAndApplyConfig = loadAndApplyConfig;
exports.initConfigWithMappings = initConfigWithMappings;
exports.reloadConfig = reloadConfig;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const mode_config_1 = require("./mode-config");
const widget_mapping_registry_1 = require("../registry/widget-mapping-registry");
/**
 * Load and apply configuration to all components
 */
function loadAndApplyConfig(projectRoot) {
    // Load mode configuration
    const modeConfig = new mode_config_1.ModeConfig(projectRoot);
    // Get widget mapping registry
    const registry = (0, widget_mapping_registry_1.getRegistry)();
    // Load custom widget mappings if specified
    const customMappingsPath = modeConfig.getCustomMappings();
    if (customMappingsPath) {
        const absolutePath = path.isAbsolute(customMappingsPath)
            ? customMappingsPath
            : path.join(projectRoot || process.cwd(), customMappingsPath);
        if (fs.existsSync(absolutePath)) {
            console.log(`Loading custom widget mappings from: ${absolutePath}`);
            registry.loadCustomMappings(absolutePath);
        }
        else {
            console.warn(`Custom widget mappings file not found: ${absolutePath}\n` +
                `Skipping custom mappings. Using default mappings only.`);
        }
    }
    return { modeConfig, registry };
}
/**
 * Initialize configuration with custom mappings
 */
function initConfigWithMappings(projectRoot, mode, customMappingsPath) {
    // Initialize mode config
    const modeConfig = mode_config_1.ModeConfig.init(projectRoot, mode, {
        customMappings: customMappingsPath,
    });
    // Get widget mapping registry
    const registry = (0, widget_mapping_registry_1.getRegistry)();
    // Load custom mappings if provided
    if (customMappingsPath) {
        const absolutePath = path.isAbsolute(customMappingsPath)
            ? customMappingsPath
            : path.join(projectRoot, customMappingsPath);
        if (fs.existsSync(absolutePath)) {
            registry.loadCustomMappings(absolutePath);
        }
    }
    return { modeConfig, registry };
}
/**
 * Reload configuration and custom mappings
 */
function reloadConfig(modeConfig, registry) {
    // Reload mode config
    modeConfig.reload();
    // Reload custom mappings if specified
    const customMappingsPath = modeConfig.getCustomMappings();
    if (customMappingsPath) {
        const projectRoot = path.dirname(modeConfig.getConfigPath());
        const absolutePath = path.isAbsolute(customMappingsPath)
            ? customMappingsPath
            : path.join(projectRoot, customMappingsPath);
        if (fs.existsSync(absolutePath)) {
            registry.loadCustomMappings(absolutePath);
        }
    }
}
