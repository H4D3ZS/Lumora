/**
 * Configuration Loader
 * Loads lumora.config.js or uses defaults
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LumoraConfig {
  watchDir: string;
  reactDir: string;
  flutterDir: string;
  storageDir: string;
  port: number;
  mode: 'react' | 'flutter' | 'universal';
  autoConvert: boolean;
  autoPush: boolean;
  generateCode: boolean;
}

const DEFAULT_CONFIG: LumoraConfig = {
  watchDir: 'web/src',
  reactDir: 'web/src',
  flutterDir: 'lib',
  storageDir: '.lumora/ir',
  port: 3000,
  mode: 'universal',
  autoConvert: true,
  autoPush: true,
  generateCode: true,
};

export async function loadConfig(): Promise<LumoraConfig> {
  const configPath = path.join(process.cwd(), 'lumora.config.js');

  if (fs.existsSync(configPath)) {
    try {
      const userConfig = require(configPath);
      return { ...DEFAULT_CONFIG, ...userConfig };
    } catch (error) {
      console.warn('Warning: Failed to load lumora.config.js, using defaults');
      return DEFAULT_CONFIG;
    }
  }

  return DEFAULT_CONFIG;
}

export function getDefaultConfig(): LumoraConfig {
  return { ...DEFAULT_CONFIG };
}
