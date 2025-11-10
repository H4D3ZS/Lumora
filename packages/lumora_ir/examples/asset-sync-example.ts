/**
 * Asset Sync Example
 * Demonstrates how to use the asset management module with the sync engine
 */

import {
  AssetManager,
  AssetPathConverter,
  ConfigUpdater,
  BidirectionalSync,
} from '../src';

// Example IR with asset references
const exampleIR = {
  version: '1.0',
  metadata: {
    sourceFramework: 'react' as const,
    sourceFile: 'App.tsx',
    generatedAt: Date.now(),
  },
  nodes: [
    {
      id: '1',
      type: 'View',
      props: {
        style: {
          backgroundImage: "url('/images/background.jpg')",
        },
      },
      children: [
        {
          id: '2',
          type: 'Image',
          props: {
            source: '/images/logo.png',
            style: { width: 200, height: 100 },
          },
          children: [],
          metadata: { lineNumber: 5 },
        },
        {
          id: '3',
          type: 'Text',
          props: {
            text: 'Welcome to Lumora',
            style: {
              fontFamily: 'Roboto',
              fontSize: 24,
            },
          },
          children: [],
          metadata: { lineNumber: 10 },
        },
      ],
      metadata: { lineNumber: 1 },
    },
  ],
};

async function syncAssetsExample() {
  console.log('=== Asset Sync Example ===\n');

  // 1. Initialize asset management components
  console.log('1. Initializing asset management...');
  const assetManager = new AssetManager({
    reactAssetsDir: './web/public',
    flutterAssetsDir: './mobile/assets',
  });

  const pathConverter = new AssetPathConverter({
    reactPublicPath: '/',
    flutterAssetsPath: 'assets/',
  });

  const configUpdater = new ConfigUpdater();

  // 2. Extract asset references from IR
  console.log('2. Extracting asset references from IR...');
  const assetPaths = assetManager.extractAssetReferences(exampleIR);
  console.log(`   Found ${assetPaths.length} assets:`, assetPaths);

  // 3. Sync assets to Flutter (in a real scenario)
  console.log('\n3. Syncing assets to Flutter...');
  console.log('   (Skipping actual file operations in example)');
  // const synced = assetManager.syncReactToFlutter(assetPaths);
  // console.log(`   Synced ${synced.length} assets`);

  // 4. Convert asset paths in IR
  console.log('\n4. Converting asset paths in IR...');
  const flutterIR = pathConverter.convertIRAssets(exampleIR, 'flutter');
  console.log('   Original image source:', exampleIR.nodes[0].children[0].props.source);
  console.log('   Converted image source:', flutterIR.nodes[0].children[0].props.source);
  console.log('   Original background:', exampleIR.nodes[0].props.style.backgroundImage);
  console.log('   Converted background:', flutterIR.nodes[0].props.style.backgroundImage);

  // 5. Extract font configurations
  console.log('\n5. Extracting font configurations...');
  const fontAssets = [
    'assets/fonts/Roboto-Regular.ttf',
    'assets/fonts/Roboto-Bold.ttf',
    'assets/fonts/Roboto-Italic.ttf',
  ];
  const fontConfigs = configUpdater.extractFontConfigs(fontAssets);
  console.log('   Font configurations:', JSON.stringify(fontConfigs, null, 2));

  // 6. Demonstrate path conversion
  console.log('\n6. Path conversion examples:');
  const reactPaths = [
    '/images/logo.png',
    './images/icon.png',
    'images/background.jpg',
  ];

  reactPaths.forEach(reactPath => {
    const flutterPath = pathConverter.reactToFlutter(reactPath);
    const backToReact = pathConverter.flutterToReact(flutterPath);
    console.log(`   ${reactPath} → ${flutterPath} → ${backToReact}`);
  });

  console.log('\n=== Example Complete ===');
}

// Integration with BidirectionalSync
function integrateWithSyncEngine() {
  console.log('\n=== Integration with Sync Engine ===\n');

  const assetManager = new AssetManager({
    reactAssetsDir: './web/public',
    flutterAssetsDir: './mobile/assets',
  });

  const pathConverter = new AssetPathConverter();

  // Example: Hook into sync process
  console.log('Asset management can be integrated with the sync engine:');
  console.log('');
  console.log('const sync = new BidirectionalSync({');
  console.log('  // ... config');
  console.log('});');
  console.log('');
  console.log('// Before converting IR to target framework');
  console.log('sync.on("beforeConvert", (ir, targetFramework) => {');
  console.log('  // Extract and sync assets');
  console.log('  const assets = assetManager.extractAssetReferences(ir);');
  console.log('  ');
  console.log('  if (targetFramework === "flutter") {');
  console.log('    assetManager.syncReactToFlutter(assets);');
  console.log('  } else {');
  console.log('    assetManager.syncFlutterToReact(assets);');
  console.log('  }');
  console.log('  ');
  console.log('  // Convert asset paths in IR');
  console.log('  return pathConverter.convertIRAssets(ir, targetFramework);');
  console.log('});');
  console.log('');
  console.log('// After generating code');
  console.log('sync.on("afterGenerate", (targetFramework) => {');
  console.log('  if (targetFramework === "flutter") {');
  console.log('    configUpdater.updatePubspecYaml("./pubspec.yaml", assets);');
  console.log('  } else {');
  console.log('    configUpdater.updatePackageJson("./package.json", assets);');
  console.log('  }');
  console.log('});');
}

// Run examples
if (require.main === module) {
  syncAssetsExample()
    .then(() => integrateWithSyncEngine())
    .catch(console.error);
}

export { syncAssetsExample, integrateWithSyncEngine };
