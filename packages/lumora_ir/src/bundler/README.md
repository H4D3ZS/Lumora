# Schema Bundler

The Schema Bundler provides tools for packaging Lumora IR schemas with assets for distribution and deployment.

## Features

- **Schema Collection**: Automatically collects all schemas from an entry point, following dependencies
- **Asset Collection**: Extracts and bundles referenced assets (images, fonts, etc.)
- **Optimization**: Tree shaking, minification, and compression
- **Manifest Generation**: Creates detailed manifests with checksums and metadata
- **Validation**: Validates bundle integrity, schema structure, and asset references

## Components

### SchemaBundler

Main bundler class that orchestrates the bundling process.

```typescript
import { SchemaBundler } from 'lumora-ir';

const bundler = new SchemaBundler('/path/to/project');

const bundle = await bundler.bundle({
  entry: 'src/App.schema.json',
  output: 'dist/bundle.json',
  minify: true,
  compress: true,
  treeShake: true,
});

// Write bundle to disk
await bundler.writeBundle(bundle, 'dist/bundle.json');

// Load bundle from disk
const loadedBundle = await bundler.loadBundle('dist/bundle.json');
```

### BundleOptimizer

Provides optimization features for reducing bundle size.

```typescript
import { BundleOptimizer } from 'lumora-ir';

const optimizer = new BundleOptimizer();

// Optimize schemas
const result = await optimizer.optimize(schemas, {
  treeShake: true,
  minify: true,
  compress: true,
  removeComments: true,
  removeUnusedProps: true,
});

console.log(`Original size: ${optimizer.formatSize(result.originalSize)}`);
console.log(`Optimized size: ${optimizer.formatSize(result.optimizedSize)}`);
console.log(`Compression ratio: ${(result.compressionRatio * 100).toFixed(2)}%`);

// Compress schemas
const compressed = await optimizer.compressSchemas(schemas);

// Decompress schemas
const decompressed = await optimizer.decompressSchemas(compressed);
```

### ManifestGenerator

Generates bundle manifests with schema and asset references.

```typescript
import { ManifestGenerator } from 'lumora-ir';

const generator = new ManifestGenerator('/path/to/project');

const manifest = generator.generate(
  {
    entry: 'src/App.schema.json',
    version: '1.0.0',
    includeSourceMaps: true,
    includeDependencies: true,
  },
  schemas,
  assets
);

// Write manifest to file
generator.writeManifest(manifest, 'dist/manifest.json');

// Read manifest from file
const loadedManifest = generator.readManifest('dist/manifest.json');

// Compare manifests
const diff = generator.compareManifests(oldManifest, newManifest);
console.log('Schemas added:', diff.schemasAdded);
console.log('Schemas modified:', diff.schemasModified);
console.log('Schemas removed:', diff.schemasRemoved);
```

### BundleValidator

Validates bundle integrity and structure.

```typescript
import { BundleValidator } from 'lumora-ir';

const validator = new BundleValidator('/path/to/project');

const result = await validator.validate(manifest, schemas, assets, {
  validateSchemas: true,
  validateAssets: true,
  validateChecksums: true,
  validateDependencies: true,
  strict: true,
});

if (!result.valid) {
  console.error('Bundle validation failed:');
  result.errors.forEach(error => {
    console.error(`  [${error.type}] ${error.message}`);
    if (error.path) {
      console.error(`    Path: ${error.path}`);
    }
  });
}

// Format validation result
console.log(validator.formatValidationResult(result));
```

## Bundle Structure

A bundle consists of:

```typescript
interface Bundle {
  manifest: BundleManifest;
  schemas: Map<string, LumoraIR>;
  assets: Map<string, Buffer>;
  metadata: BundleMetadata;
}
```

### Manifest Structure

```typescript
interface BundleManifest {
  version: string;
  entry: string;
  schemas: SchemaReference[];
  assets: AssetReference[];
  dependencies: Record<string, string>;
  checksum: string;
  bundleSize: number;
  createdAt: number;
  metadata?: ManifestMetadata;
}
```

## Optimization Techniques

### Tree Shaking

Removes unused nodes from schemas:

```typescript
const result = optimizer.treeShake(schemas);
console.log(`Removed ${result.removedNodes} unused nodes`);
```

### Minification

Removes unnecessary metadata and props:

```typescript
const result = optimizer.minify(schemas, {
  removeComments: true,
  removeUnusedProps: true,
});
console.log(`Removed ${result.removedProps} unused properties`);
```

### Compression

Compresses schemas and assets using gzip:

```typescript
const compressed = await optimizer.compressSchemas(schemas);
const compressedAssets = await optimizer.compressAssets(assets);
```

## Validation

The validator checks:

- **Schema Integrity**: Validates schema structure and node relationships
- **Asset References**: Verifies all referenced assets exist
- **Checksums**: Validates data integrity using SHA-256 checksums
- **Dependencies**: Checks dependency versions and availability
- **Circular References**: Detects circular references in schemas

## CLI Integration

The bundler can be integrated into CLI tools:

```typescript
import { getBundler } from 'lumora-ir';

async function bundleCommand(options: any) {
  const bundler = getBundler(options.baseDir);
  
  console.log('Bundling schemas...');
  const bundle = await bundler.bundle({
    entry: options.entry,
    output: options.output,
    minify: options.minify,
    compress: options.compress,
    treeShake: options.treeShake,
  });
  
  console.log(`Bundle created: ${bundle.metadata.size} bytes`);
  console.log(`Schemas: ${bundle.schemas.size}`);
  console.log(`Assets: ${bundle.assets.size}`);
  
  await bundler.writeBundle(bundle, options.output);
  console.log(`Bundle written to ${options.output}`);
}
```

## Best Practices

1. **Always validate bundles** before deployment
2. **Use compression** for production bundles
3. **Enable tree shaking** to reduce bundle size
4. **Include source maps** for debugging
5. **Verify checksums** when loading bundles
6. **Keep manifests** for version tracking

## Performance

- Schema collection: O(n) where n is number of schemas
- Tree shaking: O(n) where n is number of nodes
- Compression: Depends on data size, typically 60-80% reduction
- Validation: O(n) where n is number of schemas + assets

## Error Handling

All bundler operations throw descriptive errors:

```typescript
try {
  const bundle = await bundler.bundle(config);
} catch (error) {
  if (error.message.includes('Entry file not found')) {
    console.error('Entry file does not exist');
  } else if (error.message.includes('Failed to parse schema')) {
    console.error('Invalid schema format');
  } else {
    console.error('Bundling failed:', error);
  }
}
```

## Testing

The bundler includes comprehensive tests:

```bash
npm test -- schema-bundler.test.ts
```

## Future Enhancements

- Incremental bundling (only bundle changed files)
- Bundle splitting (code splitting for large apps)
- Source map generation
- Bundle analysis and visualization
- Remote bundle loading
- Bundle caching and CDN integration
