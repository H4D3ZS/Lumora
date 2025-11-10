/**
 * Schema Bundler Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SchemaBundler, BundleOptimizer, ManifestGenerator, BundleValidator } from '../bundler';
import { createIR, createNode } from '../utils/ir-utils';

describe('SchemaBundler', () => {
  let tempDir: string;
  let bundler: SchemaBundler;

  beforeEach(() => {
    // Create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundler-test-'));
    bundler = new SchemaBundler(tempDir);
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('bundle', () => {
    it('should bundle a simple schema', async () => {
      // Create a test schema
      const schema = createIR(
        {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        [
          createNode('View', { style: { padding: 10 } }, [
            createNode('Text', { text: 'Hello World' }),
          ]),
        ]
      );

      // Write schema to file
      const schemaPath = path.join(tempDir, 'test-schema.json');
      fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

      // Bundle
      const bundle = await bundler.bundle({
        entry: schemaPath,
        output: path.join(tempDir, 'bundle.json'),
        baseDir: tempDir,
      });

      // Verify bundle
      expect(bundle).toBeDefined();
      expect(bundle.manifest).toBeDefined();
      expect(bundle.schemas.size).toBe(1);
      expect(bundle.manifest.schemas.length).toBe(1);
      expect(bundle.manifest.checksum).toBeTruthy();
    });

    it('should collect assets from schema', async () => {
      // Create a test schema with image reference
      const schema = createIR(
        {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        [
          createNode('Image', { source: 'test-image.png' }),
        ]
      );

      // Create a test image
      const imagePath = path.join(tempDir, 'assets', 'test-image.png');
      fs.mkdirSync(path.dirname(imagePath), { recursive: true });
      fs.writeFileSync(imagePath, Buffer.from('fake-image-data'));

      // Write schema to file
      const schemaPath = path.join(tempDir, 'test-schema.json');
      fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

      // Bundle
      const bundle = await bundler.bundle({
        entry: schemaPath,
        output: path.join(tempDir, 'bundle.json'),
        baseDir: tempDir,
      });

      // Verify assets
      expect(bundle.assets.size).toBe(1);
      expect(bundle.assets.has('test-image.png')).toBe(true);
    });
  });

  describe('writeBundle and loadBundle', () => {
    it('should write and load bundle', async () => {
      // Create a test schema
      const schema = createIR(
        {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        [createNode('Text', { text: 'Test' })]
      );

      const schemaPath = path.join(tempDir, 'test-schema.json');
      fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

      // Bundle
      const bundle = await bundler.bundle({
        entry: schemaPath,
        output: path.join(tempDir, 'bundle.json'),
        baseDir: tempDir,
      });

      // Write bundle
      const bundlePath = path.join(tempDir, 'bundle.json');
      await bundler.writeBundle(bundle, bundlePath);

      // Verify file exists
      expect(fs.existsSync(bundlePath)).toBe(true);

      // Load bundle
      const loadedBundle = await bundler.loadBundle(bundlePath);

      // Verify loaded bundle
      expect(loadedBundle.manifest.version).toBe(bundle.manifest.version);
      expect(loadedBundle.schemas.size).toBe(bundle.schemas.size);
    });
  });
});

describe('BundleOptimizer', () => {
  let optimizer: BundleOptimizer;

  beforeEach(() => {
    optimizer = new BundleOptimizer();
  });

  describe('minify', () => {
    it('should remove documentation from nodes', () => {
      const schema = createIR(
        {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
          author: 'Test Author',
        },
        [
          createNode('Text', { text: 'Test' }, [], 1),
        ]
      );

      // Add documentation
      schema.nodes[0].metadata.documentation = 'This is a test node';

      const schemas = new Map([['test.json', schema]]);
      const result = optimizer.minify(schemas, { removeComments: true });

      expect(result.removedProps).toBeGreaterThan(0);
      expect(schema.nodes[0].metadata.documentation).toBeUndefined();
    });
  });

  describe('calculateChecksum', () => {
    it('should calculate consistent checksums', () => {
      const content = 'test content';
      const checksum1 = optimizer.calculateChecksum(content);
      const checksum2 = optimizer.calculateChecksum(content);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });
  });
});

describe('ManifestGenerator', () => {
  let generator: ManifestGenerator;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-test-'));
    generator = new ManifestGenerator(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('generate', () => {
    it('should generate valid manifest', () => {
      const schema = createIR(
        {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        [createNode('Text', { text: 'Test' })]
      );

      const schemas = new Map([['test.json', schema]]);
      const assets = new Map<string, Buffer>();

      const manifest = generator.generate(
        {
          entry: 'test.json',
          baseDir: tempDir,
        },
        schemas,
        assets
      );

      expect(manifest.version).toBeDefined();
      expect(manifest.entry).toBe('test.json');
      expect(manifest.schemas.length).toBe(1);
      expect(manifest.checksum).toBeTruthy();
      expect(manifest.bundleSize).toBeGreaterThan(0);
    });
  });

  describe('validateManifest', () => {
    it('should validate correct manifest', () => {
      const schema = createIR(
        {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        [createNode('Text', { text: 'Test' })]
      );

      const schemas = new Map([['test.json', schema]]);
      const assets = new Map<string, Buffer>();

      const manifest = generator.generate(
        {
          entry: 'test.json',
          baseDir: tempDir,
        },
        schemas,
        assets
      );

      const validation = generator.validateManifest(manifest);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});

describe('BundleValidator', () => {
  let validator: BundleValidator;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-test-'));
    validator = new BundleValidator(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('validate', () => {
    it('should validate valid bundle', async () => {
      const schema = createIR(
        {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        [createNode('Text', { text: 'Test' })]
      );

      const schemas = new Map([['test.json', schema]]);
      const assets = new Map<string, Buffer>();

      const generator = new ManifestGenerator(tempDir);
      const manifest = generator.generate(
        {
          entry: 'test.json',
          baseDir: tempDir,
        },
        schemas,
        assets
      );

      const result = await validator.validate(manifest, schemas, assets);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.totalSchemas).toBe(1);
      expect(result.summary.validSchemas).toBe(1);
    });
  });
});
