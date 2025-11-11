/**
 * OTA (Over-The-Air) Updates via GitHub Releases - Usage Examples
 *
 * This file demonstrates how to use the GitHub Release Manager and Update Checker
 * for implementing OTA updates in Lumora applications.
 */
/**
 * Example 1: Create a release and upload bundle
 */
declare function publishRelease(): Promise<void>;
/**
 * Example 2: Create release with custom release notes
 */
declare function publishReleaseWithNotes(): Promise<void>;
/**
 * Example 3: Check for updates
 */
declare function checkForUpdates(): Promise<void>;
/**
 * Example 4: Download and verify update
 */
declare function downloadAndVerifyUpdate(): Promise<void>;
/**
 * Example 5: Complete OTA update workflow
 */
declare function completeOTAWorkflow(): Promise<void>;
/**
 * Example 6: Publish prerelease
 */
declare function publishPrerelease(): Promise<void>;
/**
 * Example 7: Version comparison
 */
declare function demonstrateVersionComparison(): void;
export { publishRelease, publishReleaseWithNotes, checkForUpdates, downloadAndVerifyUpdate, completeOTAWorkflow, publishPrerelease, demonstrateVersionComparison, };
//# sourceMappingURL=ota-usage.example.d.ts.map