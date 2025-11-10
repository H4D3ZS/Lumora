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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeConfig = exports.DevelopmentMode = void 0;
exports.loadModeConfig = loadModeConfig;
exports.initModeConfig = initModeConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const ajv_1 = __importDefault(require("ajv"));
/**
 * Development mode types
 */
var DevelopmentMode;
(function (DevelopmentMode) {
    DevelopmentMode["REACT"] = "react";
    DevelopmentMode["FLUTTER"] = "flutter";
    DevelopmentMode["UNIVERSAL"] = "universal";
})(DevelopmentMode || (exports.DevelopmentMode = DevelopmentMode = {}));
/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
    mode: DevelopmentMode.UNIVERSAL,
    reactDir: 'web/src',
    flutterDir: 'mobile/lib',
    storageDir: '.lumora/ir',
    namingConventions: {
        fileNaming: 'snake_case',
        identifierNaming: 'camelCase',
        componentNaming: 'PascalCase',
    },
    formatting: {
        indentSize: 2,
        useTabs: false,
        lineWidth: 80,
        semicolons: true,
        trailingComma: 'es5',
        singleQuote: true,
    },
    sync: {
        enabled: true,
        debounceMs: 300,
        excludePatterns: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/.git/**'],
        testSync: true,
    },
    conversion: {
        preserveComments: true,
        generateDocumentation: true,
        strictTypeChecking: true,
        fallbackBehavior: 'warn',
    },
    validation: {
        validateIR: true,
        validateGenerated: true,
    },
};
/**
 * Mode Configuration Manager
 * Handles loading, saving, and validating lumora.yaml configuration
 */
class ModeConfig {
    constructor(projectRoot = process.cwd()) {
        this.validator = null;
        this.configPath = path.join(projectRoot, 'lumora.yaml');
        this.schemaPath = path.join(__dirname, '../schema/lumora-config-schema.json');
        this.loadValidator();
        this.config = this.loadConfig();
    }
    /**
     * Load JSON schema validator
     */
    loadValidator() {
        try {
            if (fs.existsSync(this.schemaPath)) {
                const schemaContent = fs.readFileSync(this.schemaPath, 'utf8');
                const schema = JSON.parse(schemaContent);
                const ajv = new ajv_1.default({ allErrors: true, strict: false });
                this.validator = ajv.compile(schema);
            }
        }
        catch (error) {
            console.warn(`Failed to load configuration schema: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Load configuration from lumora.yaml
     */
    loadConfig() {
        if (!fs.existsSync(this.configPath)) {
            return { ...DEFAULT_CONFIG };
        }
        try {
            const fileContent = fs.readFileSync(this.configPath, 'utf8');
            const parsed = yaml.load(fileContent);
            // Validate and merge with defaults
            return this.validateAndMerge(parsed);
        }
        catch (error) {
            console.warn(`Failed to load lumora.yaml: ${error instanceof Error ? error.message : String(error)}`);
            console.warn('Using default configuration');
            return { ...DEFAULT_CONFIG };
        }
    }
    /**
     * Validate configuration against JSON schema
     */
    validateConfig(config) {
        if (!this.validator) {
            return { valid: true, errors: [] };
        }
        const valid = this.validator(config);
        const errors = [];
        if (!valid && this.validator.errors) {
            for (const error of this.validator.errors) {
                const path = error.instancePath || 'root';
                const message = error.message || 'validation error';
                errors.push(`${path}: ${message}`);
            }
        }
        return { valid: !!valid, errors };
    }
    /**
     * Validate and merge configuration with defaults
     */
    validateAndMerge(parsed) {
        // Validate against schema
        const validation = this.validateConfig(parsed);
        if (!validation.valid) {
            console.warn('Configuration validation warnings:');
            validation.errors.forEach((error) => console.warn(`  - ${error}`));
            console.warn('Using default values for invalid fields');
        }
        const config = { ...DEFAULT_CONFIG };
        // Validate mode
        if (parsed.mode) {
            if (!Object.values(DevelopmentMode).includes(parsed.mode)) {
                console.warn(`Invalid mode "${parsed.mode}". Using default: ${DEFAULT_CONFIG.mode}`);
            }
            else {
                config.mode = parsed.mode;
            }
        }
        // Merge directories
        if (parsed.reactDir)
            config.reactDir = parsed.reactDir;
        if (parsed.flutterDir)
            config.flutterDir = parsed.flutterDir;
        if (parsed.storageDir)
            config.storageDir = parsed.storageDir;
        if (parsed.customMappings)
            config.customMappings = parsed.customMappings;
        // Merge naming conventions
        if (parsed.namingConventions) {
            config.namingConventions = {
                ...DEFAULT_CONFIG.namingConventions,
                ...parsed.namingConventions,
            };
        }
        // Merge formatting
        if (parsed.formatting) {
            config.formatting = {
                ...DEFAULT_CONFIG.formatting,
                ...parsed.formatting,
            };
        }
        // Merge sync settings
        if (parsed.sync) {
            config.sync = {
                ...DEFAULT_CONFIG.sync,
                ...parsed.sync,
            };
        }
        // Merge conversion settings
        if (parsed.conversion) {
            config.conversion = {
                ...DEFAULT_CONFIG.conversion,
                ...parsed.conversion,
            };
        }
        // Merge validation settings
        if (parsed.validation) {
            config.validation = {
                ...DEFAULT_CONFIG.validation,
                ...parsed.validation,
            };
        }
        return config;
    }
    /**
     * Save configuration to lumora.yaml
     */
    save(config) {
        if (config) {
            this.config = this.validateAndMerge({ ...this.config, ...config });
        }
        try {
            const yamlContent = yaml.dump(this.config, {
                indent: 2,
                lineWidth: 80,
                noRefs: true,
            });
            fs.writeFileSync(this.configPath, yamlContent, 'utf8');
            console.log(`Configuration saved to ${this.configPath}`);
        }
        catch (error) {
            throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Initialize configuration with mode
     */
    static init(projectRoot, mode, options) {
        const configPath = path.join(projectRoot, 'lumora.yaml');
        // Check if config already exists
        if (fs.existsSync(configPath)) {
            throw new Error('lumora.yaml already exists. Use ModeConfig.load() to load existing configuration.');
        }
        // Create config instance
        const modeConfig = new ModeConfig(projectRoot);
        // Set mode and options
        modeConfig.config = modeConfig.validateAndMerge({
            ...DEFAULT_CONFIG,
            mode,
            ...options,
        });
        // Save to file
        modeConfig.save();
        return modeConfig;
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get development mode
     */
    getMode() {
        return this.config.mode;
    }
    /**
     * Set development mode
     */
    setMode(mode) {
        this.config.mode = mode;
        this.save();
    }
    /**
     * Get React directory
     */
    getReactDir() {
        return this.config.reactDir;
    }
    /**
     * Get Flutter directory
     */
    getFlutterDir() {
        return this.config.flutterDir;
    }
    /**
     * Get storage directory
     */
    getStorageDir() {
        return this.config.storageDir || DEFAULT_CONFIG.storageDir;
    }
    /**
     * Check if mode is React-first
     */
    isReactFirst() {
        return this.config.mode === DevelopmentMode.REACT;
    }
    /**
     * Check if mode is Flutter-first
     */
    isFlutterFirst() {
        return this.config.mode === DevelopmentMode.FLUTTER;
    }
    /**
     * Check if mode is Universal (bidirectional)
     */
    isUniversal() {
        return this.config.mode === DevelopmentMode.UNIVERSAL;
    }
    /**
     * Get configuration file path
     */
    getConfigPath() {
        return this.configPath;
    }
    /**
     * Reload configuration from file
     */
    reload() {
        this.config = this.loadConfig();
    }
    /**
     * Get custom mappings path
     */
    getCustomMappings() {
        return this.config.customMappings;
    }
    /**
     * Get naming conventions
     */
    getNamingConventions() {
        return { ...DEFAULT_CONFIG.namingConventions, ...this.config.namingConventions };
    }
    /**
     * Get formatting preferences
     */
    getFormattingPreferences() {
        return { ...DEFAULT_CONFIG.formatting, ...this.config.formatting };
    }
    /**
     * Get sync settings
     */
    getSyncSettings() {
        return { ...DEFAULT_CONFIG.sync, ...this.config.sync };
    }
    /**
     * Get conversion settings
     */
    getConversionSettings() {
        return { ...DEFAULT_CONFIG.conversion, ...this.config.conversion };
    }
    /**
     * Get validation settings
     */
    getValidationSettings() {
        return { ...DEFAULT_CONFIG.validation, ...this.config.validation };
    }
    /**
     * Apply naming convention to a string
     */
    applyFileNamingConvention(name) {
        const convention = this.getNamingConventions().fileNaming || 'snake_case';
        return this.convertCase(name, convention);
    }
    /**
     * Apply identifier naming convention to a string
     */
    applyIdentifierNamingConvention(name) {
        const convention = this.getNamingConventions().identifierNaming || 'camelCase';
        return this.convertCase(name, convention);
    }
    /**
     * Apply component naming convention to a string
     */
    applyComponentNamingConvention(name) {
        const convention = this.getNamingConventions().componentNaming || 'PascalCase';
        return this.convertCase(name, convention);
    }
    /**
     * Convert string to specified case
     */
    convertCase(str, targetCase) {
        // Split string into words, handling various formats
        let words = [];
        // First, split on underscores and hyphens
        const parts = str.split(/[_-]+/);
        // Then split each part on capital letters (for camelCase/PascalCase)
        for (const part of parts) {
            // Split on capital letters while preserving them
            const subWords = part.split(/(?=[A-Z])/).filter((w) => w.length > 0);
            words.push(...subWords);
        }
        // Filter out empty words
        words = words.filter((w) => w.length > 0);
        if (words.length === 0) {
            return str;
        }
        switch (targetCase) {
            case 'snake_case':
                return words.map((w) => w.toLowerCase()).join('_');
            case 'kebab-case':
                return words.map((w) => w.toLowerCase()).join('-');
            case 'PascalCase':
                return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
            case 'camelCase':
                return words
                    .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join('');
            default:
                return str;
        }
    }
    /**
     * Get default configuration
     */
    static getDefaultConfig() {
        return { ...DEFAULT_CONFIG };
    }
}
exports.ModeConfig = ModeConfig;
/**
 * Load mode configuration from project root
 */
function loadModeConfig(projectRoot) {
    return new ModeConfig(projectRoot);
}
/**
 * Initialize new mode configuration
 */
function initModeConfig(projectRoot, mode, options) {
    return ModeConfig.init(projectRoot, mode, options);
}
