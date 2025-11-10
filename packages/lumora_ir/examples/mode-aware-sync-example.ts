/**
 * Mode-Aware Sync Example
 * 
 * This example demonstrates how to use the mode-aware sync system
 * to configure file watching behavior based on development mode.
 */

import { 
  initModeConfig, 
  loadModeConfig,
  DevelopmentMode,
  createModeAwareSync,
  LumoraIR
} from '../src/index';

// Example converter functions (simplified)
async function reactToIR(filePath: string): Promise<LumoraIR> {
  console.log(`Converting React file to IR: ${filePath}`);
  // In real implementation, parse React/TSX file and convert to IR
  return {
    version: '1.0',
    metadata: {
      sourceFramework: 'react',
      sourceFile: filePath,
      generatedAt: Date.now(),
    },
    nodes: [],
  };
}

async function flutterToIR(filePath: string): Promise<LumoraIR> {
  console.log(`Converting Flutter file to IR: ${filePath}`);
  // In real implementation, parse Flutter/Dart file and convert to IR
  return {
    version: '1.0',
    metadata: {
      sourceFramework: 'flutter',
      sourceFile: filePath,
      generatedAt: Date.now(),
    },
    nodes: [],
  };
}

async function irToReact(ir: LumoraIR, outputPath: string): Promise<void> {
  console.log(`Generating React file from IR: ${outputPath}`);
  // In real implementation, generate React/TSX code from IR
}

async function irToFlutter(ir: LumoraIR, outputPath: string): Promise<void> {
  console.log(`Generating Flutter file from IR: ${outputPath}`);
  // In real implementation, generate Flutter/Dart code from IR
}

/**
 * Example 1: React-first mode
 * React files are source, Flutter files are generated
 */
async function reactFirstExample() {
  console.log('\n=== React-First Mode Example ===\n');

  // Initialize project with React mode
  const modeConfig = initModeConfig(
    './my-react-project',
    DevelopmentMode.REACT,
    {
      reactDir: 'src',
      flutterDir: 'mobile/lib',
    }
  );

  // Create mode-aware sync
  const sync = createModeAwareSync({
    modeConfig,
    sync: {
      reactToIR,
      flutterToIR,
      irToReact,
      irToFlutter,
    },
  });

  // Start watching
  sync.start();

  // In React mode:
  // - Changes to React files will trigger Flutter generation
  // - Changes to Flutter files will be ignored (they're generated)
  // - No conflict detection needed

  console.log('Watching React files...');
  console.log('Flutter files will be generated automatically');

  // Stop after some time
  setTimeout(async () => {
    await sync.stop();
  }, 5000);
}

/**
 * Example 2: Flutter-first mode
 * Flutter files are source, React files are generated
 */
async function flutterFirstExample() {
  console.log('\n=== Flutter-First Mode Example ===\n');

  // Initialize project with Flutter mode
  const modeConfig = initModeConfig(
    './my-flutter-project',
    DevelopmentMode.FLUTTER,
    {
      reactDir: 'web/src',
      flutterDir: 'lib',
    }
  );

  // Create mode-aware sync
  const sync = createModeAwareSync({
    modeConfig,
    sync: {
      reactToIR,
      flutterToIR,
      irToReact,
      irToFlutter,
    },
  });

  // Start watching
  sync.start();

  // In Flutter mode:
  // - Changes to Flutter files will trigger React generation
  // - Changes to React files will be ignored (they're generated)
  // - No conflict detection needed

  console.log('Watching Flutter files...');
  console.log('React files will be generated automatically');

  // Stop after some time
  setTimeout(async () => {
    await sync.stop();
  }, 5000);
}

/**
 * Example 3: Universal mode
 * Both React and Flutter files are sources with bidirectional sync
 */
async function universalModeExample() {
  console.log('\n=== Universal Mode Example ===\n');

  // Initialize project with Universal mode
  const modeConfig = initModeConfig(
    './my-universal-project',
    DevelopmentMode.UNIVERSAL,
    {
      reactDir: 'web/src',
      flutterDir: 'mobile/lib',
    }
  );

  // Create mode-aware sync
  const sync = createModeAwareSync({
    modeConfig,
    sync: {
      reactToIR,
      flutterToIR,
      irToReact,
      irToFlutter,
    },
  });

  // Register conflict handler
  sync.onConflict((conflict) => {
    console.warn('Conflict detected!');
    console.warn(`React file: ${conflict.reactFile}`);
    console.warn(`Flutter file: ${conflict.flutterFile}`);
    console.warn('Manual resolution required');
  });

  // Start watching
  sync.start();

  // In Universal mode:
  // - Changes to React files will trigger Flutter generation
  // - Changes to Flutter files will trigger React generation
  // - Conflict detection is enabled
  // - Both sides can be edited simultaneously

  console.log('Watching both React and Flutter files...');
  console.log('Bidirectional sync enabled');
  console.log('Conflict detection active');

  // Stop after some time
  setTimeout(async () => {
    await sync.stop();
  }, 5000);
}

/**
 * Example 4: Loading existing configuration
 */
async function loadExistingConfigExample() {
  console.log('\n=== Load Existing Configuration Example ===\n');

  // Load existing lumora.yaml
  const modeConfig = loadModeConfig('./my-project');

  console.log(`Current mode: ${modeConfig.getMode()}`);
  console.log(`React directory: ${modeConfig.getReactDir()}`);
  console.log(`Flutter directory: ${modeConfig.getFlutterDir()}`);

  // Create sync with loaded config
  const sync = createModeAwareSync({
    modeConfig,
    sync: {
      reactToIR,
      flutterToIR,
      irToReact,
      irToFlutter,
    },
  });

  // Check mode-specific behavior
  const watcher = sync.getModeWatcher();
  console.log(`\nMode description: ${watcher.getModeDescription()}`);
  console.log(`Source framework: ${watcher.getSourceFramework()}`);
  console.log(`React files read-only: ${watcher.isReadOnly('react')}`);
  console.log(`Flutter files read-only: ${watcher.isReadOnly('flutter')}`);
}

/**
 * Example 5: Switching modes
 */
async function switchModeExample() {
  console.log('\n=== Switch Mode Example ===\n');

  // Start with React mode
  const modeConfig = initModeConfig(
    './my-project',
    DevelopmentMode.REACT
  );

  console.log(`Initial mode: ${modeConfig.getMode()}`);

  // Later, switch to Universal mode
  modeConfig.setMode(DevelopmentMode.UNIVERSAL);
  console.log(`New mode: ${modeConfig.getMode()}`);

  // Configuration is automatically saved to lumora.yaml
  console.log('Configuration saved to lumora.yaml');

  // Create new sync with updated mode
  const sync = createModeAwareSync({
    modeConfig,
    sync: {
      reactToIR,
      flutterToIR,
      irToReact,
      irToFlutter,
    },
  });

  sync.start();
  console.log('Sync started with new mode');

  setTimeout(async () => {
    await sync.stop();
  }, 5000);
}

// Run examples
async function main() {
  try {
    // Uncomment the example you want to run:
    
    // await reactFirstExample();
    // await flutterFirstExample();
    // await universalModeExample();
    // await loadExistingConfigExample();
    // await switchModeExample();

    console.log('\nExamples completed!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  reactFirstExample,
  flutterFirstExample,
  universalModeExample,
  loadExistingConfigExample,
  switchModeExample,
};
