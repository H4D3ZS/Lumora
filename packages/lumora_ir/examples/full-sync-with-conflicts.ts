/**
 * Full Bidirectional Sync with Conflict Resolution Example
 * Demonstrates complete integration of sync engine with conflict resolution
 */

import {
  BidirectionalSync,
  ConflictDetector,
  ConflictNotifier,
  ConflictResolverUI,
  ConflictResolver,
  NotificationChannel,
  ResolutionOption,
  SyncStatus,
} from '../src/index';

/**
 * Example: Complete bidirectional sync with automatic conflict handling
 */
async function fullSyncWithConflictsExample() {
  console.log('=== Full Bidirectional Sync with Conflict Resolution ===\n');

  // 1. Initialize bidirectional sync
  const sync = new BidirectionalSync({
    reactDir: 'web/src',
    flutterDir: 'mobile/lib',
    storageDir: '.lumora/ir',
    mode: 'universal',
  });

  // 2. Get conflict components
  const conflictDetector = sync['conflictDetector'];
  const conflictNotifier = new ConflictNotifier();
  const conflictResolverUI = new ConflictResolverUI();
  const conflictResolver = new ConflictResolver(
    conflictDetector,
    sync['syncEngine'].getStorage(),
    {
      reactToIR: sync['config'].reactToIR,
      flutterToIR: sync['config'].flutterToIR,
      irToReact: sync['config'].irToReact,
      irToFlutter: sync['config'].irToFlutter,
    }
  );

  // 3. Register conflict notification handlers
  console.log('Setting up notification handlers...\n');

  conflictNotifier.registerHandler(NotificationChannel.CLI, (notification) => {
    console.log('\n📢 CLI Notification:');
    console.log(notification.message);
  });

  conflictNotifier.registerHandler(NotificationChannel.WEB_DASHBOARD, (notification) => {
    console.log('\n🌐 Web Dashboard Notification:');
    console.log(JSON.stringify(conflictNotifier.formatForJSON(notification), null, 2));
  });

  conflictNotifier.registerHandler(NotificationChannel.VSCODE_EXTENSION, (notification) => {
    console.log('\n💻 VS Code Notification:');
    console.log(notification.message);
  });

  // 4. Register conflict handler on detector
  conflictDetector.onConflict(async (conflict) => {
    console.log('\n⚠️  CONFLICT DETECTED!');
    console.log(`ID: ${conflict.id}`);
    console.log(`React: ${conflict.reactFile}`);
    console.log(`Flutter: ${conflict.flutterFile}`);

    // Notify all channels
    conflictNotifier.notifyAll(conflict);

    // Analyze conflict
    const analysis = conflictDetector.identifyConflictingChanges(
      conflict.id,
      conflict.reactFile,
      conflict.flutterFile
    );
    console.log('\nConflict Analysis:');
    console.log(`  Type: ${analysis.conflictType}`);
    console.log(`  Details:`, JSON.stringify(analysis.details, null, 2));

    // Auto-resolve based on strategy (in real app, this would be user choice)
    const strategy = getResolutionStrategy(conflict);
    console.log(`\nApplying resolution strategy: ${strategy}`);

    const result = await conflictResolver.applyResolution({
      option: strategy,
      conflict,
      timestamp: Date.now(),
    });

    if (result.success) {
      console.log('✅ Conflict resolved successfully!');
      if (result.filesRegenerated) {
        console.log('Files regenerated:', result.filesRegenerated);
      }
    } else {
      console.error('❌ Conflict resolution failed:', result.error);
    }
  });

  // 5. Register sync status handler
  sync.onStatusUpdate((event) => {
    if (event.status === SyncStatus.CONFLICT) {
      console.log('\n🔴 Sync Status: CONFLICT');
      console.log('Message:', event.message);
    } else if (event.status === SyncStatus.SYNCING) {
      console.log('\n🔄 Sync Status: SYNCING');
      if (event.operation) {
        console.log(`  Processing: ${event.operation.sourceFile}`);
      }
    } else if (event.status === SyncStatus.WATCHING) {
      console.log('\n👀 Sync Status: WATCHING');
    }
  });

  // 6. Start watching
  console.log('Starting bidirectional sync...\n');
  await sync.start();

  console.log('✅ Sync started successfully!');
  console.log('Watching for changes in:');
  console.log(`  - React: web/src`);
  console.log(`  - Flutter: mobile/lib`);
  console.log('\nConflict resolution is active and will handle simultaneous changes.\n');

  // 7. Simulate some file changes and conflicts
  console.log('--- Simulating File Changes ---\n');

  // Simulate React change
  console.log('1. Simulating React file change...');
  await simulateFileChange('web/src/components/Button.tsx', 'react');
  await sleep(1000);

  // Simulate Flutter change (no conflict - outside window)
  console.log('\n2. Simulating Flutter file change (no conflict)...');
  await simulateFileChange('mobile/lib/components/button.dart', 'flutter');
  await sleep(1000);

  // Simulate simultaneous changes (conflict!)
  console.log('\n3. Simulating simultaneous changes (CONFLICT!)...');
  await Promise.all([
    simulateFileChange('web/src/components/Card.tsx', 'react'),
    sleep(100).then(() => simulateFileChange('mobile/lib/components/card.dart', 'flutter')),
  ]);
  await sleep(2000);

  // 8. Check conflict status
  console.log('\n--- Conflict Status ---');
  const unresolvedConflicts = conflictResolver.getUnresolvedConflicts();
  console.log(`Unresolved conflicts: ${unresolvedConflicts.length}`);

  if (unresolvedConflicts.length > 0) {
    console.log('\nUnresolved conflicts:');
    unresolvedConflicts.forEach((conflict) => {
      console.log(`  - ${conflict.id}`);
      console.log(`    React: ${conflict.reactFile}`);
      console.log(`    Flutter: ${conflict.flutterFile}`);
      console.log(`    Detected: ${new Date(conflict.detectedAt).toLocaleString()}`);
    });
  }

  // 9. Show notification history
  console.log('\n--- Notification History ---');
  const history = conflictNotifier.getHistory(5);
  console.log(`Recent notifications: ${history.length}`);
  history.forEach((notification, index) => {
    console.log(`\n${index + 1}. [${notification.channel}] ${notification.severity}`);
    console.log(`   ${notification.message.split('\n')[0]}`);
  });

  // 10. Stop sync
  console.log('\n--- Stopping Sync ---');
  await sync.stop();
  console.log('✅ Sync stopped');

  console.log('\n=== Example Complete ===');
}

/**
 * Get resolution strategy based on conflict
 * In a real application, this would be user choice or configured policy
 */
function getResolutionStrategy(conflict: any): ResolutionOption {
  // Example strategy: Use most recent change
  if (conflict.reactTimestamp > conflict.flutterTimestamp) {
    return ResolutionOption.USE_REACT;
  } else if (conflict.flutterTimestamp > conflict.reactTimestamp) {
    return ResolutionOption.USE_FLUTTER;
  } else {
    // If timestamps are equal, use manual merge
    return ResolutionOption.MANUAL_MERGE;
  }
}

/**
 * Simulate file change
 */
async function simulateFileChange(filePath: string, framework: 'react' | 'flutter'): Promise<void> {
  console.log(`  📝 ${framework} file changed: ${filePath}`);
  // In real scenario, this would be actual file system change
  // For demo, we just log it
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Example: Manual conflict resolution workflow
 */
async function manualConflictResolutionExample() {
  console.log('\n=== Manual Conflict Resolution Workflow ===\n');

  const conflictResolverUI = new ConflictResolverUI();

  const mockConflict = {
    id: 'manual_conflict',
    reactFile: 'web/src/components/Form.tsx',
    flutterFile: 'mobile/lib/components/form.dart',
    reactTimestamp: Date.now() - 2000,
    flutterTimestamp: Date.now(),
    irVersion: 3,
    detectedAt: Date.now(),
    resolved: false,
  };

  console.log('Conflict detected:');
  console.log(`  ID: ${mockConflict.id}`);
  console.log(`  React: ${mockConflict.reactFile}`);
  console.log(`  Flutter: ${mockConflict.flutterFile}`);

  // Show diff view
  console.log('\n--- Generating Diff View ---');
  const diffView = conflictResolverUI.buildWebDashboardDiffView(mockConflict);
  console.log('Diff view generated with:');
  console.log(`  React lines: ${diffView.reactLines.length}`);
  console.log(`  Flutter lines: ${diffView.flutterLines.length}`);

  // Show CLI diff
  console.log('\n--- CLI Diff View ---');
  conflictResolverUI.displayCLIDiff(mockConflict);

  // Generate HTML for web dashboard
  console.log('\n--- HTML Diff View ---');
  const html = conflictResolverUI.generateHTMLDiff(mockConflict);
  console.log('HTML diff generated (length:', html.length, 'chars)');
  console.log('First 200 chars:', html.substring(0, 200) + '...');

  // Format for VS Code
  console.log('\n--- VS Code Integration ---');
  const vscodeFormat = conflictResolverUI.formatForVSCode(mockConflict);
  console.log('VS Code format:', JSON.stringify(vscodeFormat, null, 2));

  console.log('\n=== Example Complete ===');
}

/**
 * Example: Conflict resolution with backup management
 */
async function backupManagementExample() {
  console.log('\n=== Backup Management Example ===\n');

  const storage = require('../src/storage/ir-storage').IRStorage;
  const conflictDetector = new ConflictDetector();
  const conflictResolver = new ConflictResolver(
    conflictDetector,
    new storage('.lumora/ir')
  );

  const testFile = 'web/src/components/Button.tsx';

  console.log('Managing backups for:', testFile);

  // List existing backups
  console.log('\n1. Listing existing backups...');
  const backups = conflictResolver.listBackups(testFile);
  console.log(`Found ${backups.length} backups`);
  backups.forEach((backup, index) => {
    console.log(`  ${index + 1}. ${backup}`);
  });

  // Clean up old backups
  console.log('\n2. Cleaning up old backups (keeping 5 most recent)...');
  conflictResolver.cleanupBackups(testFile, 5);
  console.log('Cleanup complete');

  // Show remaining backups
  const remainingBackups = conflictResolver.listBackups(testFile);
  console.log(`Remaining backups: ${remainingBackups.length}`);

  console.log('\n=== Example Complete ===');
}

// Run examples
if (require.main === module) {
  (async () => {
    try {
      await fullSyncWithConflictsExample();
      await manualConflictResolutionExample();
      await backupManagementExample();
    } catch (error) {
      console.error('Error running examples:', error);
      process.exit(1);
    }
  })();
}

export {
  fullSyncWithConflictsExample,
  manualConflictResolutionExample,
  backupManagementExample,
};
