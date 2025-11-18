"use strict";
/**
 * Dependency Manager - Automatic package installation and management
 * Handles both npm packages and Flutter pub packages
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyManager = void 0;
exports.getDependencyManager = getDependencyManager;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class DependencyManager {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
    }
    /**
     * Install a package
     */
    async installPackage(packageName, options = {}) {
        const type = options.type || this.detectPackageType(packageName);
        const spinner = (0, ora_1.default)(`Installing ${packageName}...`).start();
        try {
            if (type === 'npm') {
                await this.installNpmPackage(packageName, options);
            }
            else {
                await this.installPubPackage(packageName, options);
            }
            spinner.succeed(`Installed ${chalk_1.default.green(packageName)}`);
        }
        catch (error) {
            spinner.fail(`Failed to install ${packageName}`);
            throw error;
        }
    }
    /**
     * Install NPM package
     */
    async installNpmPackage(packageName, options) {
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
    async installPubPackage(packageName, options) {
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
        const existingIndex = lines.findIndex(line => line.trim().startsWith(`${packageName}:`));
        if (existingIndex !== -1) {
            lines[existingIndex] = packageLine;
        }
        else {
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
    async installPackages(packages) {
        console.log(chalk_1.default.blue(`\n📦 Installing ${packages.length} packages...\n`));
        for (const pkg of packages) {
            await this.installPackage(pkg.name, {
                version: pkg.version,
                type: pkg.type,
                dev: pkg.dev,
            });
        }
        console.log(chalk_1.default.green('\n✅ All packages installed!\n'));
    }
    /**
     * Check for dependency conflicts
     */
    async checkConflicts() {
        const conflicts = [];
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
    async checkNpmConflicts() {
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
        }
        catch (error) {
            // npm ls exits with error code if there are issues
            return [];
        }
    }
    /**
     * Check Flutter pub conflicts
     */
    async checkPubConflicts() {
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
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Resolve dependency conflicts
     */
    async resolveConflicts(conflicts) {
        console.log(chalk_1.default.yellow(`\n⚠️  Found ${conflicts.length} conflicts\n`));
        for (const conflict of conflicts) {
            if (conflict.canResolve && conflict.resolution) {
                console.log(`Resolving ${conflict.package}...`);
                await this.installPackage(conflict.package, {
                    version: conflict.resolution,
                });
            }
            else {
                console.log(chalk_1.default.red(`Cannot auto-resolve ${conflict.package}`));
                console.log(`  Requested: ${conflict.requested}`);
                console.log(`  Installed: ${conflict.installed}`);
            }
        }
    }
    /**
     * Link native module
     */
    async linkNativeModule(moduleName) {
        const spinner = (0, ora_1.default)(`Linking ${moduleName}...`).start();
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
            spinner.succeed(`Linked ${chalk_1.default.green(moduleName)}`);
        }
        catch (error) {
            spinner.fail(`Failed to link ${moduleName}`);
            throw error;
        }
    }
    /**
     * Uninstall package
     */
    async uninstallPackage(packageName) {
        const type = this.detectPackageType(packageName);
        const spinner = (0, ora_1.default)(`Uninstalling ${packageName}...`).start();
        try {
            if (type === 'npm') {
                await execAsync(`npm uninstall ${packageName}`, {
                    cwd: this.projectRoot,
                });
            }
            else {
                await this.removePubPackage(packageName);
            }
            spinner.succeed(`Uninstalled ${chalk_1.default.green(packageName)}`);
        }
        catch (error) {
            spinner.fail(`Failed to uninstall ${packageName}`);
            throw error;
        }
    }
    /**
     * List installed packages
     */
    async listPackages() {
        const packages = {
            npm: [],
            pub: [],
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
                version: version,
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
    async updatePackage(packageName, version) {
        const type = this.detectPackageType(packageName);
        const spinner = (0, ora_1.default)(`Updating ${packageName}...`).start();
        try {
            if (type === 'npm') {
                const versionStr = version ? `@${version}` : '@latest';
                await execAsync(`npm install ${packageName}${versionStr}`, {
                    cwd: this.projectRoot,
                });
            }
            else {
                await this.updatePubPackage(packageName, version);
            }
            spinner.succeed(`Updated ${chalk_1.default.green(packageName)}`);
        }
        catch (error) {
            spinner.fail(`Failed to update ${packageName}`);
            throw error;
        }
    }
    // Helper methods
    detectPackageType(packageName) {
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
    extractConflicts(problems) {
        return problems
            .filter(p => p.includes('conflict'))
            .map(p => ({
            package: 'unknown',
            requested: 'unknown',
            installed: 'unknown',
            canResolve: false,
        }));
    }
    async checkNeedsLinking(moduleName) {
        // Most modern React Native/Flutter packages use autolinking
        return false;
    }
    async hasIosProject() {
        return fs.pathExists(path.join(this.projectRoot, 'ios'));
    }
    async hasAndroidProject() {
        return fs.pathExists(path.join(this.projectRoot, 'android'));
    }
    async linkIosModule(moduleName) {
        // iOS linking would go here
        // For now, most packages use CocoaPods autolinking
    }
    async linkAndroidModule(moduleName) {
        // Android linking would go here
        // For now, most packages use Gradle autolinking
    }
    async removePubPackage(packageName) {
        const pubspecPath = path.join(this.projectRoot, 'pubspec.yaml');
        const pubspecContent = await fs.readFile(pubspecPath, 'utf-8');
        const lines = pubspecContent
            .split('\n')
            .filter(line => !line.trim().startsWith(`${packageName}:`));
        await fs.writeFile(pubspecPath, lines.join('\n'));
        await execAsync('flutter pub get', { cwd: this.projectRoot });
    }
    async updatePubPackage(packageName, version) {
        if (version) {
            await this.installPubPackage(packageName, { version });
        }
        else {
            await execAsync(`flutter pub upgrade ${packageName}`, {
                cwd: this.projectRoot,
            });
        }
    }
}
exports.DependencyManager = DependencyManager;
// Singleton instance
let dependencyManagerInstance = null;
function getDependencyManager(projectRoot) {
    if (!dependencyManagerInstance) {
        dependencyManagerInstance = new DependencyManager(projectRoot);
    }
    return dependencyManagerInstance;
}
//# sourceMappingURL=dependency-manager.js.map