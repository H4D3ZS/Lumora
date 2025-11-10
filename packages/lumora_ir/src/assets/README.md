# Asset Management Module

The Asset Management module handles syncing, path conversion, and configuration updates for assets (images, fonts, etc.) between React and Flutter frameworks.

## Components

### AssetManager

Handles syncing assets between React and Flutter directories.

**Features:**
- Sync assets from React to Flutter
- Sync assets from Flutter to React
- Extract asset references from IR
- List all assets in a directory
- Automatic directory creation

**Usage:**

```typescript
import { AssetManager } from '@lumora/ir';

const assetManager = new AssetManager({
  reactAssetsDir: './public',
  flutterAssetsDir: './assets',
});

// Sync assets from React to Flutter
const synced = assetManager.syncReactToFlutter([
  'images/logo.png',
  'images/icon.png',
]);

// Extract asset references from IR
const ir = { /* ... */ };
const assetPaths = assetManager.extractAssetReferences(ir);

// Sync extracted assets
assetManager.syncReactToFlutter(assetPaths);
```

### AssetPathConverter

Converts asset paths between React and Flutter conventions.

**Path Conventions:**
- React: `/images/logo.png` or `./images/logo.png`
- Flutter: `assets/images/logo.png`

**Features:**
- Convert React paths to Flutter paths
- Convert Flutter paths to React paths
- Convert image references in IR nodes
- Convert background images in styles
- Convert font references
- Batch convert all assets in IR

**Usage:**

```typescript
import { AssetPathConverter } from '@lumora/ir';

const converter = new AssetPathConverter({
  reactPublicPath: '/',
  flutterAssetsPath: 'assets/',
});

// Convert individual paths
const flutterPath = converter.reactToFlutter('/images/logo.png');
// Result: 'assets/images/logo.png'

const reactPath = converter.flutterToReact('assets/images/logo.png');
// Result: '/images/logo.png'

// Convert all assets in IR
const ir = { /* ... */ };
const convertedIR = converter.convertIRAssets(ir, 'flutter');
```

### ConfigUpdater

Updates framework configuration files with asset references.

**Features:**
- Update `pubspec.yaml` with Flutter assets
- Update `pubspec.yaml` with Flutter fonts
- Update `package.json` with React asset metadata
- Extract font configurations from asset list
- Validate asset configuration

**Usage:**

```typescript
import { ConfigUpdater } from '@lumora/ir';

const updater = new ConfigUpdater();

// Update Flutter assets
updater.updatePubspecYaml('./pubspec.yaml', [
  'assets/images/logo.png',
  'assets/images/icon.png',
]);

// Update Flutter fonts
updater.updatePubspecFonts('./pubspec.yaml', [
  {
    family: 'Roboto',
    fonts: [
      { asset: 'assets/fonts/Roboto-Regular.ttf', weight: 400 },
      { asset: 'assets/fonts/Roboto-Bold.ttf', weight: 700 },
    ],
  },
]);

// Update React package.json
updater.updatePackageJson('./package.json', [
  'images/logo.png',
  'images/icon.png',
]);

// Extract font configs from asset list
const assets = [
  'assets/fonts/Roboto-Regular.ttf',
  'assets/fonts/Roboto-Bold.ttf',
];
const fontConfigs = updater.extractFontConfigs(assets);

// Validate configuration
const validation = updater.validateAssetConfig('./pubspec.yaml', assets);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

## Complete Workflow Example

Here's a complete example of syncing assets from React to Flutter:

```typescript
import {
  AssetManager,
  AssetPathConverter,
  ConfigUpdater,
} from '@lumora/ir';

// 1. Initialize components
const assetManager = new AssetManager({
  reactAssetsDir: './web/public',
  flutterAssetsDir: './mobile/assets',
});

const pathConverter = new AssetPathConverter({
  reactPublicPath: '/',
  flutterAssetsPath: 'assets/',
});

const configUpdater = new ConfigUpdater();

// 2. Extract assets from IR
const ir = { /* your IR */ };
const reactAssetPaths = assetManager.extractAssetReferences(ir);

// 3. Sync assets to Flutter
const syncedAssets = assetManager.syncReactToFlutter(reactAssetPaths);

// 4. Convert asset paths in IR
const flutterIR = pathConverter.convertIRAssets(ir, 'flutter');

// 5. Update Flutter configuration
const flutterAssetPaths = syncedAssets.map(a => a.targetPath);
configUpdater.updatePubspecYaml('./mobile/pubspec.yaml', flutterAssetPaths);

// 6. Handle fonts separately
const fontAssets = syncedAssets
  .filter(a => a.type === 'font')
  .map(a => a.targetPath);

if (fontAssets.length > 0) {
  const fontConfigs = configUpdater.extractFontConfigs(fontAssets);
  configUpdater.updatePubspecFonts('./mobile/pubspec.yaml', fontConfigs);
}

console.log(`Synced ${syncedAssets.length} assets to Flutter`);
```

## Asset Types

The module supports the following asset types:

### Images
- `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.bmp`

### Fonts
- `.ttf`, `.otf`, `.woff`, `.woff2`

### Other
- Any other file type is classified as "other"

## Font Weight Detection

The module automatically detects font weights from filenames:

| Filename Pattern | Weight |
|-----------------|--------|
| Thin | 100 |
| ExtraLight | 200 |
| Light | 300 |
| Regular | 400 |
| Medium | 500 |
| SemiBold | 600 |
| Bold | 700 |
| ExtraBold | 800 |
| Black | 900 |

## Font Style Detection

The module automatically detects font styles:

| Filename Pattern | Style |
|-----------------|-------|
| Italic | italic |

## Error Handling

All components handle errors gracefully:

- Missing assets are logged as warnings and skipped
- Missing configuration files throw descriptive errors
- Invalid configurations are validated and reported

## Integration with Sync Engine

The asset management module integrates with the bidirectional sync engine:

```typescript
import { BidirectionalSync, AssetManager } from '@lumora/ir';

const sync = new BidirectionalSync({
  // ... other config
});

const assetManager = new AssetManager({
  reactAssetsDir: './web/public',
  flutterAssetsDir: './mobile/assets',
});

// Hook into sync events
sync.on('beforeConvert', (ir, targetFramework) => {
  // Extract and sync assets
  const assets = assetManager.extractAssetReferences(ir);
  
  if (targetFramework === 'flutter') {
    assetManager.syncReactToFlutter(assets);
  } else {
    assetManager.syncFlutterToReact(assets);
  }
});
```

## Requirements Covered

This implementation covers the following requirements from the spec:

- **Requirement 12.1**: Sync assets between frameworks
- **Requirement 12.2**: Copy assets to appropriate directories
- **Requirement 12.3**: Convert asset references for target framework
- **Requirement 12.4**: Update pubspec.yaml for Flutter assets
- **Requirement 12.5**: Update package.json for React assets

## Testing

The module includes comprehensive tests:

```bash
npm test -- asset-manager.test.ts
npm test -- asset-path-converter.test.ts
npm test -- config-updater.test.ts
```

All tests use temporary directories and clean up after themselves.
