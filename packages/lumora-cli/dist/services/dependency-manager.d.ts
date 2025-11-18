/**
 * Dependency Manager - Automatic package installation and management
 * Handles both npm packages and Flutter pub packages
 */
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
export declare class DependencyManager {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Install a package
     */
    installPackage(packageName: string, options?: {
        version?: string;
        type?: 'npm' | 'pub';
        dev?: boolean;
        save?: boolean;
    }): Promise<void>;
    /**
     * Install NPM package
     */
    private installNpmPackage;
    /**
     * Install Flutter pub package
     */
    private installPubPackage;
    /**
     * Install multiple packages
     */
    installPackages(packages: PackageDependency[]): Promise<void>;
    /**
     * Check for dependency conflicts
     */
    checkConflicts(): Promise<DependencyConflict[]>;
    /**
     * Check NPM dependency conflicts
     */
    private checkNpmConflicts;
    /**
     * Check Flutter pub conflicts
     */
    private checkPubConflicts;
    /**
     * Resolve dependency conflicts
     */
    resolveConflicts(conflicts: DependencyConflict[]): Promise<void>;
    /**
     * Link native module
     */
    linkNativeModule(moduleName: string): Promise<void>;
    /**
     * Uninstall package
     */
    uninstallPackage(packageName: string): Promise<void>;
    /**
     * List installed packages
     */
    listPackages(): Promise<{
        npm: Array<{
            name: string;
            version: string;
        }>;
        pub: Array<{
            name: string;
            version: string;
        }>;
    }>;
    /**
     * Update package
     */
    updatePackage(packageName: string, version?: string): Promise<void>;
    private detectPackageType;
    private extractConflicts;
    private checkNeedsLinking;
    private hasIosProject;
    private hasAndroidProject;
    private linkIosModule;
    private linkAndroidModule;
    private removePubPackage;
    private updatePubPackage;
}
export declare function getDependencyManager(projectRoot?: string): DependencyManager;
//# sourceMappingURL=dependency-manager.d.ts.map