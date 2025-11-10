/**
 * Conflict Resolution System Example
 * Demonstrates how to use the conflict resolution components
 */

import {
  ConflictDetector,
  ConflictNotifier,
  ConflictResolverUI,
  ConflictResolver,
  NotificationChannel,
  ResolutionOption,
  IRStorage,
  LumoraIR,
} from '../src/index';

/**
 * Example: Complete conflict resolution workflow
 */
async function conflictResolutionExample() {
  console.log('=== Conflict Resolution System Example ===\n');

  // 1. Initialize components
  const storage = new IRStorage('.lumora/ir');
  const conflictDetector = new ConflictDetector({
    conflictWindowMs: 5000,
    storageDir: '.lumora/ir',
  });
  const conflictNotifier = new ConflictNotifier();
  const resolverUI = new ConflictResolverUI();
  const conflictResolver = new ConflictResolver(conflictDetector, storage, {
    // Mock converters for example
    reactToIR: async (filePath: string) => mockReactToIR(filePath),
    flutterToIR: async (filePath: string) => mockFlutterToIR(filePath),
    irToReact: async (ir: LumoraIR, outputPath: string) => mockIRToReact(ir, outputPath),
    irToFlutter: async (ir: LumoraIR, outputPath: string) => mockIRToFlutter(ir, outputPath),
  });

  // 2. Register notification handlers
  conflictNotifier.registerHandler(NotificationChannel.CLI, (notification) => {
    console.log('CLI Notification:', notification.message);
  });

  conflictNotifier.registerHandler(NotificationChannel.WEB_DASHBOARD, (notification) => {
    console.log('Web Dashboard Notification:', notification.message);
  });

  conflictNotifier.registerHandler(NotificationChannel.VSCODE_EXTENSION, (notification) => {
    console.log('VS Code Notification:', notification.message);
  });

  // 3. Register conflict handler on detector
  conflictDetector.onConflict((conflict) => {
    console.log('\n🔔 Conflict detected!');
    console.log(`  ID: ${conflict.id}`);
    console.log(`  React: ${conflict.reactFile}`);
    console.log(`  Flutter: ${conflict.flutterFile}`);
    
    // Send notifications to all channels
    conflictNotifier.notifyAll(conflict);
  });

  // 4. Simulate a conflict scenario
  console.log('Simulating conflict scenario...\n');
  
  const mockConflict = {
    id: 'example_conflict_1',
    reactFile: 'web/src/components/Button.tsx',
    flutterFile: 'mobile/lib/components/button.dart',
    reactTimestamp: Date.now() - 2000,
    flutterTimestamp: Date.now(),
    irVersion: 5,
    detectedAt: Date.now(),
    resolved: false,
  };

  // Manually trigger conflict for demonstration
  conflictDetector.onConflict(mockConflict);

  // 5. Display conflict information
  console.log('\n--- Conflict Details ---');
  console.log('Comparing file timestamps...');
  const timestampComparison = conflictDetector.compareFileTimestamps(
    mockConflict.reactFile,
    mockConflict.flutterFile
  );
  console.log('Timestamp comparison:', timestampComparison);

  console.log('\nComparing IR versions...');
  const versionComparison = conflictDetector.compareIRVersions(mockConflict.id);
  console.log('Version comparison:', versionComparison);

  console.log('\nIdentifying conflicting changes...');
  const conflictAnalysis = conflictDetector.identifyConflictingChanges(
    mockConflict.id,
    mockConflict.reactFile,
    mockConflict.flutterFile
  );
  console.log('Conflict analysis:', conflictAnalysis);

  // 6. Format conflict for different platforms
  console.log('\n--- Platform-Specific Formats ---');
  
  console.log('\nWeb Dashboard Format:');
  const webFormat = resolverUI.formatForWebDashboard(mockConflict);
  console.log(JSON.stringify(webFormat, null, 2));

  console.log('\nVS Code Format:');
  const vscodeFormat = resolverUI.formatForVSCode(mockConflict);
  console.log(JSON.stringify(vscodeFormat, null, 2));

  // 7. Demonstrate resolution options
  console.log('\n--- Resolution Options ---');
  
  // Option 1: Use React version
  console.log('\n1. Resolving with React version...');
  const reactResolution = await conflictResolver.applyResolution({
    option: ResolutionOption.USE_REACT,
    conflict: mockConflict,
    timestamp: Date.now(),
  });
  console.log('Resolution result:', reactResolution);

  // Option 2: Use Flutter version (for another conflict)
  const mockConflict2 = { ...mockConflict, id: 'example_conflict_2', resolved: false };
  console.log('\n2. Resolving with Flutter version...');
  const flutterResolution = await conflictResolver.applyResolution({
    option: ResolutionOption.USE_FLUTTER,
    conflict: mockConflict2,
    timestamp: Date.now(),
  });
  console.log('Resolution result:', flutterResolution);

  // Option 3: Manual merge
  const mockConflict3 = { ...mockConflict, id: 'example_conflict_3', resolved: false };
  console.log('\n3. Initiating manual merge...');
  const manualMergeResult = await conflictResolver.applyResolution({
    option: ResolutionOption.MANUAL_MERGE,
    conflict: mockConflict3,
    timestamp: Date.now(),
  });
  console.log('Manual merge result:', manualMergeResult);
  console.log('Backup files created. User can now manually edit and merge.');

  // Option 4: Skip
  const mockConflict4 = { ...mockConflict, id: 'example_conflict_4', resolved: false };
  console.log('\n4. Skipping conflict...');
  const skipResult = await conflictResolver.applyResolution({
    option: ResolutionOption.SKIP,
    conflict: mockConflict4,
    timestamp: Date.now(),
  });
  console.log('Skip result:', skipResult);

  // 8. Check unresolved conflicts
  console.log('\n--- Unresolved Conflicts ---');
  const unresolvedConflicts = conflictResolver.getUnresolvedConflicts();
  console.log(`Total unresolved conflicts: ${unresolvedConflicts.length}`);
  unresolvedConflicts.forEach((conflict) => {
    console.log(`  - ${conflict.id}: ${conflict.reactFile} ↔ ${conflict.flutterFile}`);
  });

  // 9. Notification history
  console.log('\n--- Notification History ---');
  const notificationHistory = conflictNotifier.getHistory(5);
  console.log(`Recent notifications: ${notificationHistory.length}`);
  notificationHistory.forEach((notification) => {
    console.log(`  [${notification.channel}] ${notification.message}`);
  });

  // 10. Generate HTML diff view
  console.log('\n--- HTML Diff View ---');
  const htmlDiff = resolverUI.generateHTMLDiff(mockConflict);
  console.log('HTML diff generated (first 200 chars):');
  console.log(htmlDiff.substring(0, 200) + '...');

  console.log('\n=== Example Complete ===');
}

/**
 * Mock converter functions for demonstration
 */
async function mockReactToIR(filePath: string): Promise<LumoraIR> {
  return {
    version: '1.0',
    metadata: {
      sourceFramework: 'react',
      sourceFile: filePath,
      generatedAt: Date.now(),
    },
    nodes: [
      {
        id: 'node_1',
        type: 'Button',
        props: { text: 'Click Me', onPress: 'handleClick' },
        children: [],
        metadata: { lineNumber: 10 },
      },
    ],
  };
}

async function mockFlutterToIR(filePath: string): Promise<LumoraIR> {
  return {
    version: '1.0',
    metadata: {
      sourceFramework: 'flutter',
      sourceFile: filePath,
      generatedAt: Date.now(),
    },
    nodes: [
      {
        id: 'node_1',
        type: 'ElevatedButton',
        props: { child: 'Text("Click Me")', onPressed: 'handleClick' },
        children: [],
        metadata: { lineNumber: 15 },
      },
    ],
  };
}

async function mockIRToReact(ir: LumoraIR, outputPath: string): Promise<void> {
  console.log(`  Generated React file: ${outputPath}`);
}

async function mockIRToFlutter(ir: LumoraIR, outputPath: string): Promise<void> {
  console.log(`  Generated Flutter file: ${outputPath}`);
}

/**
 * Example: CLI interactive resolution
 */
async function cliInteractiveExample() {
  console.log('\n=== CLI Interactive Resolution Example ===\n');
  console.log('Note: This example requires user input in a real terminal.\n');

  const resolverUI = new ConflictResolverUI();
  
  const mockConflict = {
    id: 'interactive_conflict',
    reactFile: 'web/src/App.tsx',
    flutterFile: 'mobile/lib/app.dart',
    reactTimestamp: Date.now() - 3000,
    flutterTimestamp: Date.now(),
    irVersion: 3,
    detectedAt: Date.now(),
    resolved: false,
  };

  console.log('In a real scenario, this would prompt the user:');
  console.log('- Show file previews');
  console.log('- Display resolution options');
  console.log('- Wait for user input');
  console.log('- Return the selected resolution choice');

  // In a real scenario:
  // const choice = await resolverUI.promptCLI(mockConflict);
  // console.log('User selected:', choice.option);

  console.log('\n=== Example Complete ===');
}

// Run examples
if (require.main === module) {
  conflictResolutionExample()
    .then(() => {
      console.log('\n');
      return cliInteractiveExample();
    })
    .catch((error) => {
      console.error('Error running example:', error);
      process.exit(1);
    });
}

export { conflictResolutionExample, cliInteractiveExample };
