import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Development mode types
 */
export enum DevelopmentMode {
  REACT = 'react',
  FLUTTER = 'flutter',
  UNIVERSAL = 'universal',
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
  namingConventions?: {
    fileNaming?: 'snake_case' | 'kebab-case' | 'PascalCase';
    identifierNaming?: 'camelCase' | 'PascalCase' | 'snake_case';
  };
  formatting?: {
    indentSize?: number;
    useTabs?: boolean;
    lineWidth?: number;
  };
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
  },
  formatting: {
    indentSize: 2,
    useTabs: false,
    lineWidth: 80,
  },
};

/**
 * Mode Configuration Manager
 * Handles loading, saving, and validating lumora.yaml configuration
 */
export class ModeConfig {
  private config: LumoraConfig;
  private configPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.configPath = path.join(projectRoot, 'lumora.yaml');
    this.config = this.loadConfig();
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
   * Validate and merge configuration with defaults
   */
  private validateAndMerge(parsed: Partial<LumoraConfig>): LumoraConfig {
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
