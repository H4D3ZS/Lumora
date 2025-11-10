import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Ajv, { ValidateFunction } from 'ajv';

/**
 * Development mode types
 */
export enum DevelopmentMode {
  REACT = 'react',
  FLUTTER = 'flutter',
  UNIVERSAL = 'universal',
}

/**
 * Naming conventions configuration
 */
export interface NamingConventions {
  fileNaming?: 'snake_case' | 'kebab-case' | 'PascalCase' | 'camelCase';
  identifierNaming?: 'camelCase' | 'PascalCase' | 'snake_case';
  componentNaming?: 'PascalCase' | 'camelCase';
}

/**
 * Formatting preferences configuration
 */
export interface FormattingPreferences {
  indentSize?: number;
  useTabs?: boolean;
  lineWidth?: number;
  semicolons?: boolean;
  trailingComma?: 'none' | 'es5' | 'all';
  singleQuote?: boolean;
}

/**
 * Synchronization settings
 */
export interface SyncSettings {
  enabled?: boolean;
  debounceMs?: number;
  excludePatterns?: string[];
  testSync?: boolean;
}

/**
 * Conversion behavior settings
 */
export interface ConversionSettings {
  preserveComments?: boolean;
  generateDocumentation?: boolean;
  strictTypeChecking?: boolean;
  fallbackBehavior?: 'warn' | 'error' | 'ignore';
}

/**
 * Validation settings
 */
export interface ValidationSettings {
  validateIR?: boolean;
  validateGenerated?: boolean;
}

/**
 * Lumora configuration
 */
export interface LumoraConfig {
  mode: DevelopmentMode;
  reactDir: string;
  flutterDir: string;
  storageDir?: string;
  customMappings?: string;
  namingConventions?: NamingConventions;
  formatting?: FormattingPreferences;
  sync?: SyncSettings;
  conversion?: ConversionSettings;
  validation?: ValidationSettings;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: LumoraConfig = {
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
export class ModeConfig {
  private config: LumoraConfig;
  private configPath: string;
  private validator: ValidateFunction | null = null;
  private schemaPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.configPath = path.join(projectRoot, 'lumora.yaml');
    this.schemaPath = path.join(__dirname, '../schema/lumora-config-schema.json');
    this.loadValidator();
    this.config = this.loadConfig();
  }

  /**
   * Load JSON schema validator
   */
  private loadValidator(): void {
    try {
      if (fs.existsSync(this.schemaPath)) {
        const schemaContent = fs.readFileSync(this.schemaPath, 'utf8');
        const schema = JSON.parse(schemaContent);
        const ajv = new Ajv({ allErrors: true, strict: false });
        this.validator = ajv.compile(schema);
      }
    } catch (error) {
      console.warn(
        `Failed to load configuration schema: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load configuration from lumora.yaml
   */
  private loadConfig(): LumoraConfig {
    if (!fs.existsSync(this.configPath)) {
      return { ...DEFAULT_CONFIG };
    }

    try {
      const fileContent = fs.readFileSync(this.configPath, 'utf8');
      const parsed = yaml.load(fileContent) as Partial<LumoraConfig>;

      // Validate and merge with defaults
      return this.validateAndMerge(parsed);
    } catch (error) {
      console.warn(
        `Failed to load lumora.yaml: ${error instanceof Error ? error.message : String(error)}`
      );
      console.warn('Using default configuration');
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Validate configuration against JSON schema
   */
  private validateConfig(config: any): { valid: boolean; errors: string[] } {
    if (!this.validator) {
      return { valid: true, errors: [] };
    }

    const valid = this.validator(config);
    const errors: string[] = [];

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
  private validateAndMerge(parsed: Partial<LumoraConfig>): LumoraConfig {
    // Validate against schema
    const validation = this.validateConfig(parsed);
    if (!validation.valid) {
      console.warn('Configuration validation warnings:');
      validation.errors.forEach((error) => console.warn(`  - ${error}`));
      console.warn('Using default values for invalid fields');
    }

    const config: LumoraConfig = { ...DEFAULT_CONFIG };

    // Validate mode
    if (parsed.mode) {
      if (!Object.values(DevelopmentMode).includes(parsed.mode as DevelopmentMode)) {
        console.warn(
          `Invalid mode "${parsed.mode}". Using default: ${DEFAULT_CONFIG.mode}`
        );
      } else {
        config.mode = parsed.mode as DevelopmentMode;
      }
    }

    // Merge directories
    if (parsed.reactDir) config.reactDir = parsed.reactDir;
    if (parsed.flutterDir) config.flutterDir = parsed.flutterDir;
    if (parsed.storageDir) config.storageDir = parsed.storageDir;
    if (parsed.customMappings) config.customMappings = parsed.customMappings;

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
  save(config?: Partial<LumoraConfig>): void {
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
    } catch (error) {
      throw new Error(
        `Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Initialize configuration with mode
   */
  static init(
    projectRoot: string,
    mode: DevelopmentMode,
    options?: Partial<LumoraConfig>
  ): ModeConfig {
    const configPath = path.join(projectRoot, 'lumora.yaml');

    // Check if config already exists
    if (fs.existsSync(configPath)) {
      throw new Error(
        'lumora.yaml already exists. Use ModeConfig.load() to load existing configuration.'
      );
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
  getConfig(): LumoraConfig {
    return { ...this.config };
  }

  /**
   * Get development mode
   */
  getMode(): DevelopmentMode {
    return this.config.mode;
  }

  /**
   * Set development mode
   */
  setMode(mode: DevelopmentMode): void {
    this.config.mode = mode;
    this.save();
  }

  /**
   * Get React directory
   */
  getReactDir(): string {
    return this.config.reactDir;
  }

  /**
   * Get Flutter directory
   */
  getFlutterDir(): string {
    return this.config.flutterDir;
  }

  /**
   * Get storage directory
   */
  getStorageDir(): string {
    return this.config.storageDir || DEFAULT_CONFIG.storageDir!;
  }

  /**
   * Check if mode is React-first
   */
  isReactFirst(): boolean {
    return this.config.mode === DevelopmentMode.REACT;
  }

  /**
   * Check if mode is Flutter-first
   */
  isFlutterFirst(): boolean {
    return this.config.mode === DevelopmentMode.FLUTTER;
  }

  /**
   * Check if mode is Universal (bidirectional)
   */
  isUniversal(): boolean {
    return this.config.mode === DevelopmentMode.UNIVERSAL;
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Reload configuration from file
   */
  reload(): void {
    this.config = this.loadConfig();
  }

  /**
   * Get custom mappings path
   */
  getCustomMappings(): string | undefined {
    return this.config.customMappings;
  }

  /**
   * Get naming conventions
   */
  getNamingConventions(): NamingConventions {
    return { ...DEFAULT_CONFIG.namingConventions, ...this.config.namingConventions };
  }

  /**
   * Get formatting preferences
   */
  getFormattingPreferences(): FormattingPreferences {
    return { ...DEFAULT_CONFIG.formatting, ...this.config.formatting };
  }

  /**
   * Get sync settings
   */
  getSyncSettings(): SyncSettings {
    return { ...DEFAULT_CONFIG.sync, ...this.config.sync };
  }

  /**
   * Get conversion settings
   */
  getConversionSettings(): ConversionSettings {
    return { ...DEFAULT_CONFIG.conversion, ...this.config.conversion };
  }

  /**
   * Get validation settings
   */
  getValidationSettings(): ValidationSettings {
    return { ...DEFAULT_CONFIG.validation, ...this.config.validation };
  }

  /**
   * Apply naming convention to a string
   */
  applyFileNamingConvention(name: string): string {
    const convention = this.getNamingConventions().fileNaming || 'snake_case';
    return this.convertCase(name, convention);
  }

  /**
   * Apply identifier naming convention to a string
   */
  applyIdentifierNamingConvention(name: string): string {
    const convention = this.getNamingConventions().identifierNaming || 'camelCase';
    return this.convertCase(name, convention);
  }

  /**
   * Apply component naming convention to a string
   */
  applyComponentNamingConvention(name: string): string {
    const convention = this.getNamingConventions().componentNaming || 'PascalCase';
    return this.convertCase(name, convention);
  }

  /**
   * Convert string to specified case
   */
  private convertCase(
    str: string,
    targetCase: 'snake_case' | 'kebab-case' | 'PascalCase' | 'camelCase'
  ): string {
    // Split string into words, handling various formats
    let words: string[] = [];
    
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
          .map((w, i) =>
            i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          )
          .join('');
      default:
        return str;
    }
  }

  /**
   * Get default configuration
   */
  static getDefaultConfig(): LumoraConfig {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Load mode configuration from project root
 */
export function loadModeConfig(projectRoot?: string): ModeConfig {
  return new ModeConfig(projectRoot);
}

/**
 * Initialize new mode configuration
 */
export function initModeConfig(
  projectRoot: string,
  mode: DevelopmentMode,
  options?: Partial<LumoraConfig>
): ModeConfig {
  return ModeConfig.init(projectRoot, mode, options);
}
