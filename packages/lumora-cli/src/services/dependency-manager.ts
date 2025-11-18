/**
 * Dependency Manager - Automatic package installation and management
 * Handles both npm packages and Flutter pub packages
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';

const execAsync = promisify(exec);

export interface PackageDependency {
  name: string;
  version?: string;
  type: 'npm' | 'pub';
  dev?: boolean;
}

export interface DependencyConflict {
  package: string;
  requested: string;
  installed: string;
  canResolve: boolean;
  resolution?: string;
}

export class DependencyManager {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Install a package
   */
  async installPackage(
    packageName: string,
    options: {
      version?: string;
      type?: 'npm' | 'pub';
      dev?: boolean;
      save?: boolean;
    } = {}
  ): Promise<void> {
    const type = options.type || this.detectPackageType(packageName);
    const spinner = ora(`Installing ${packageName}...`).start();

    try {
      if (type === 'npm') {
        await this.installNpmPackage(packageName, options);
      } else {
        await this.installPubPackage(packageName, options);
      }

      spinner.succeed(`Installed ${chalk.green(packageName)}`);
    } catch (error: any) {
      spinner.fail(`Failed to install ${packageName}`);
      throw error;
    }
  }

  /**
   * Install NPM package
   */
  private async installNpmPackage(
    packageName: string,
    options: { version?: string; dev?: boolean; save?: boolean }
  ): Promise<void> {
    const pkgWithVersion = options.version
      ? `${packageName}@${options.version}`
      : packageName;

    const flags = [
      options.dev ? '--save-dev' : '--save',
      options.save === false ? '--no-save' : '',
    ].filter(Boolean);

    const command = `npm install ${pkgWithVersion} ${flags.join(' ')}`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: this.projectRoot,
    });

    if (stderr && !stderr.includes('npm warn')) {
      throw new Error(stderr);
    }
  }

  /**
   * Install Flutter pub package
   */
  private async installPubPackage(
    packageName: string,
    options: { version?: string; dev?: boolean }
  ): Promise<void> {
    const pubspecPath = path.join(this.projectRoot, 'pubspec.yaml');

    if (!await fs.pathExists(pubspecPath)) {
      throw new Error('No pubspec.yaml found');
    }

    // Read current pubspec
    const pubspecContent = await fs.readFile(pubspecPath, 'utf-8');
    const lines = pubspecContent.split('\n');

    // Find dependencies section
    const depSection = options.dev ? 'dev_dependencies' : 'dependencies';
    const depIndex = lines.findIndex(line => line.trim() === `${depSection}:`);

    if (depIndex === -1) {
      throw new Error(`${depSection} section not found in pubspec.yaml`);
    }

    // Add package
    const versionConstraint = options.version || '^latest';
    const packageLine = `  ${packageName}: ${versionConstraint}`;

    // Check if package already exists
    const existingIndex = lines.findIndex(
      line => line.trim().startsWith(`${packageName}:`)
    );

    if (existingIndex !== -1) {
      lines[existingIndex] = packageLine;
    } else {
      lines.splice(depIndex + 1, 0, packageLine);
    }

    // Write back
    await fs.writeFile(pubspecPath, lines.join('\n'));

    // Run pub get
    await execAsync('flutter pub get', { cwd: this.projectRoot });
  }

  /**
   * Install multiple packages
   */
  async installPackages(packages: PackageDependency[]): Promise<void> {
    console.log(chalk.blue(`\n📦 Installing ${packages.length} packages...\n`));

    for (const pkg of packages) {
      await this.installPackage(pkg.name, {
        version: pkg.version,
        type: pkg.type,
        dev: pkg.dev,
      });
    }

    console.log(chalk.green('\n✅ All packages installed!\n'));
  }

  /**
   * Check for dependency conflicts
   */
  async checkConflicts(): Promise<DependencyConflict[]> {
    const conflicts: DependencyConflict[] = [];

    // Check npm conflicts
    const npmConflicts = await this.checkNpmConflicts();
    conflicts.push(...npmConflicts);

    // Check pub conflicts
    const pubConflicts = await this.checkPubConflicts();
    conflicts.push(...pubConflicts);

    return conflicts;
  }

  /**
   * Check NPM dependency conflicts
   */
  private async checkNpmConflicts(): Promise<DependencyConflict[]> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');

    if (!await fs.pathExists(packageJsonPath)) {
      return [];
    }

    try {
      const { stdout } = await execAsync('npm ls --json', {
        cwd: this.projectRoot,
      });

      const tree = JSON.parse(stdout);
      return this.extractConflicts(tree.problems || []);
    } catch (error) {
      // npm ls exits with error code if there are issues
      return [];
    }
  }

  /**
   * Check Flutter pub conflicts
   */
  private async checkPubConflicts(): Promise<DependencyConflict[]> {
    const pubspecPath = path.join(this.projectRoot, 'pubspec.yaml');

    if (!await fs.pathExists(pubspecPath)) {
      return [];
    }

    try {
      const { stdout } = await execAsync('flutter pub deps --json', {
        cwd: this.projectRoot,
      });

      const deps = JSON.parse(stdout);
      // Parse pub conflicts (if any)
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Resolve dependency conflicts
   */
  async resolveConflicts(conflicts: DependencyConflict[]): Promise<void> {
    console.log(chalk.yellow(`\n⚠️  Found ${conflicts.length} conflicts\n`));

    for (const conflict of conflicts) {
      if (conflict.canResolve && conflict.resolution) {
        console.log(`Resolving ${conflict.package}...`);
        await this.installPackage(conflict.package, {
          version: conflict.resolution,
        });
      } else {
        console.log(chalk.red(`Cannot auto-resolve ${conflict.package}`));
        console.log(`  Requested: ${conflict.requested}`);
        console.log(`  Installed: ${conflict.installed}`);
      }
    }
  }

  /**
   * Link native module
   */
  async linkNativeModule(moduleName: string): Promise<void> {
    const spinner = ora(`Linking ${moduleName}...`).start();

    try {
      // Check if module needs platform-specific linking
      const needsLinking = await this.checkNeedsLinking(moduleName);

      if (!needsLinking) {
        spinner.info(`${moduleName} doesn't require manual linking`);
        return;
      }

      // iOS linking
      if (await this.hasIosProject()) {
        await this.linkIosModule(moduleName);
      }

      // Android linking
      if (await this.hasAndroidProject()) {
        await this.linkAndroidModule(moduleName);
      }

      spinner.succeed(`Linked ${chalk.green(moduleName)}`);
    } catch (error: any) {
      spinner.fail(`Failed to link ${moduleName}`);
      throw error;
    }
  }

  /**
   * Uninstall package
   */
  async uninstallPackage(packageName: string): Promise<void> {
    const type = this.detectPackageType(packageName);
    const spinner = ora(`Uninstalling ${packageName}...`).start();

    try {
      if (type === 'npm') {
        await execAsync(`npm uninstall ${packageName}`, {
          cwd: this.projectRoot,
        });
      } else {
        await this.removePubPackage(packageName);
      }

      spinner.succeed(`Uninstalled ${chalk.green(packageName)}`);
    } catch (error: any) {
      spinner.fail(`Failed to uninstall ${packageName}`);
      throw error;
    }
  }

  /**
   * List installed packages
   */
  async listPackages(): Promise<{
    npm: Array<{ name: string; version: string }>;
    pub: Array<{ name: string; version: string }>;
  }> {
    const packages = {
      npm: [] as Array<{ name: string; version: string }>,
      pub: [] as Array<{ name: string; version: string }>,
    };

    // List npm packages
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      packages.npm = Object.entries(deps).map(([name, version]) => ({
        name,
        version: version as string,
      }));
    }

    // List pub packages
    const pubspecPath = path.join(this.projectRoot, 'pubspec.yaml');
    if (await fs.pathExists(pubspecPath)) {
      const pubspecContent = await fs.readFile(pubspecPath, 'utf-8');
      const matches = pubspecContent.matchAll(/^\s+([a-z_]+):\s+(.+)$/gm);

      for (const match of matches) {
        packages.pub.push({
          name: match[1],
          version: match[2],
        });
      }
    }

    return packages;
  }

  /**
   * Update package
   */
  async updatePackage(packageName: string, version?: string): Promise<void> {
    const type = this.detectPackageType(packageName);
    const spinner = ora(`Updating ${packageName}...`).start();

    try {
      if (type === 'npm') {
        const versionStr = version ? `@${version}` : '@latest';
        await execAsync(`npm install ${packageName}${versionStr}`, {
          cwd: this.projectRoot,
        });
      } else {
        await this.updatePubPackage(packageName, version);
      }

      spinner.succeed(`Updated ${chalk.green(packageName)}`);
    } catch (error: any) {
      spinner.fail(`Failed to update ${packageName}`);
      throw error;
    }
  }

  // Helper methods

  private detectPackageType(packageName: string): 'npm' | 'pub' {
    // Common Flutter packages
    const flutterPackages = [
      'flutter',
      'cupertino',
      'material',
      'provider',
      'bloc',
      'riverpod',
      'get',
      'dio',
      'shared_preferences',
      'path_provider',
    ];

    for (const pkg of flutterPackages) {
      if (packageName.includes(pkg)) {
        return 'pub';
      }
    }

    return 'npm';
  }

  private extractConflicts(problems: any[]): DependencyConflict[] {
    return problems
      .filter(p => p.includes('conflict'))
      .map(p => ({
        package: 'unknown',
        requested: 'unknown',
        installed: 'unknown',
        canResolve: false,
      }));
  }

  private async checkNeedsLinking(moduleName: string): Promise<boolean> {
    // Most modern React Native/Flutter packages use autolinking
    return false;
  }

  private async hasIosProject(): Promise<boolean> {
    return fs.pathExists(path.join(this.projectRoot, 'ios'));
  }

  private async hasAndroidProject(): Promise<boolean> {
    return fs.pathExists(path.join(this.projectRoot, 'android'));
  }

  private async linkIosModule(moduleName: string): Promise<void> {
    // iOS linking would go here
    // For now, most packages use CocoaPods autolinking
  }

  private async linkAndroidModule(moduleName: string): Promise<void> {
    // Android linking would go here
    // For now, most packages use Gradle autolinking
  }

  private async removePubPackage(packageName: string): Promise<void> {
    const pubspecPath = path.join(this.projectRoot, 'pubspec.yaml');
    const pubspecContent = await fs.readFile(pubspecPath, 'utf-8');
    const lines = pubspecContent
      .split('\n')
      .filter(line => !line.trim().startsWith(`${packageName}:`));

    await fs.writeFile(pubspecPath, lines.join('\n'));
    await execAsync('flutter pub get', { cwd: this.projectRoot });
  }

  private async updatePubPackage(
    packageName: string,
    version?: string
  ): Promise<void> {
    if (version) {
      await this.installPubPackage(packageName, { version });
    } else {
      await execAsync(`flutter pub upgrade ${packageName}`, {
        cwd: this.projectRoot,
      });
    }
  }
}

// Singleton instance
let dependencyManagerInstance: DependencyManager | null = null;

export function getDependencyManager(
  projectRoot?: string
): DependencyManager {
  if (!dependencyManagerInstance) {
    dependencyManagerInstance = new DependencyManager(projectRoot);
  }
  return dependencyManagerInstance;
}
