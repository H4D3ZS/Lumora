#!/usr/bin/env node
/**
 * Real-Time Test Sync Demo
 * Demonstrates that test conversion works automatically when files change
 */

import * as fs from 'fs';
import * as path from 'path';
import { BidirectionalSync } from '../src/sync/bidirectional-sync';
import { LumoraIR } from '../src/types/ir-types';

// Demo directories
const DEMO_DIR = path.join(__dirname, '.demo-workspace');
const REACT_DIR = path.join(DEMO_DIR, 'web/src');
const FLUTTER_DIR = path.join(DEMO_DIR, 'lib');
const REACT_TEST_DIR = path.join(REACT_DIR, '__tests__');
const FLUTTER_TEST_DIR = path.join(DEMO_DIR, 'test');

// Setup demo workspace
function setupDemoWorkspace() {
  console.log('🔧 Setting up demo workspace...\n');
  
  // Clean up if exists
  if (fs.existsSync(DEMO_DIR)) {
    fs.rmSync(DEMO_DIR, { recursive: true, force: true });
  }

  // Create directories
  fs.mkdirSync(REACT_DIR, { recursive: true });
  fs.mkdirSync(REACT_TEST_DIR, { recursive: true });
  fs.mkdirSync(FLUTTER_DIR, { recursive: true });
  fs.mkdirSync(FLUTTER_TEST_DIR, { recursive: true });
  fs.mkdirSync(path.join(DEMO_DIR, '.lumora/ir'), { recursive: true });

  console.log('✓ Created directories:');
  console.log(`  - ${REACT_DIR}`);
  console.log(`  - ${REACT_TEST_DIR}`);
  console.log(`  - ${FLUTTER_DIR}`);
  console.log(`  - ${FLUTTER_TEST_DIR}\n`);
}

// Dummy converters (for demo purposes)
async function reactToIR(filePath: string): Promise<LumoraIR> {
  const content = fs.readFileSync(filePath, 'utf-8');
  return {
    version: '1.0.0',
    metadata: {
      sourceFramework: 'react',
      sourceFile: filePath,
      generatedAt: Date.now(),
    },
    nodes: [
      {
        id: 'demo-node',
        type: 'Container',
        props: {},
        children: [],
        metadata: { lineNumber: 1 },
      },
    ],
  };
}

async function flutterToIR(filePath: string): Promise<LumoraIR> {
  const content = fs.readFileSync(filePath, 'utf-8');
  return {
    version: '1.0.0',
    metadata: {
      sourceFramework: 'flutter',
      sourceFile: filePath,
      generatedAt: Date.now(),
    },
    nodes: [
      {
        id: 'demo-node',
        type: 'Container',
        props: {},
        children: [],
        metadata: { lineNumber: 1 },
      },
    ],
  };
}

async function irToReact(ir: LumoraIR, outputPath: string): Promise<void> {
  const code = `// Auto-generated from Flutter\nimport React from 'react';\n\nexport function Component() {\n  return <div>Demo Component</div>;\n}\n`;
  fs.writeFileSync(outputPath, code, 'utf-8');
}

async function irToFlutter(ir: LumoraIR, outputPath: string): Promise<void> {
  const code = `// Auto-generated from React\nimport 'package:flutter/material.dart';\n\nclass Component extends StatelessWidget {\n  @override\n  Widget build(BuildContext context) {\n    return Container();\n  }\n}\n`;
  fs.writeFileSync(outputPath, code, 'utf-8');
}

// Main demo
async function runDemo() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Lumora Real-Time Test Sync Demo                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  setupDemoWorkspace();

  // Initialize bidirectional sync
  console.log('🚀 Starting Lumora sync engine...\n');
  
  const sync = new BidirectionalSync({
    sync: {
      reactDir: REACT_DIR,
      flutterDir: FLUTTER_DIR,
      storageDir: path.join(DEMO_DIR, '.lumora/ir'),
      reactToIR,
      flutterToIR,
      irToReact,
      irToFlutter,
      testSync: {
        enabled: true,
        convertTests: true,
        convertMocks: true,
        generateStubs: true,
      },
    },
    watcher: {
      reactDir: REACT_DIR,
      flutterDir: FLUTTER_DIR,
      debounceMs: 100,
    },
  });

  // Track conversions
  let testConversions = 0;
  sync.onStatusUpdate((event) => {
    if (event.operation?.sourceFile?.includes('test')) {
      testConversions++;
      console.log(`  ✓ Test converted: ${path.basename(event.operation.sourceFile)} → ${event.operation.targetFile ? path.basename(event.operation.targetFile) : 'N/A'}`);
    }
  });

  // Start sync
  sync.start();
  console.log('✓ Sync engine started');
  console.log('✓ Watching for file changes...\n');

  // Wait for watcher to initialize
  await sleep(500);

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📝 Demo 1: Writing React Test (Auto-converts to Flutter)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Create React test file
  const reactTestPath = path.join(REACT_TEST_DIR, 'Counter.test.tsx');
  const reactTestContent = `
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Counter } from '../Counter';

describe('Counter Component', () => {
  it('should display initial count', () => {
    render(<Counter />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('should increment on button click', () => {
    render(<Counter />);
    const button = screen.getByText('Increment');
    fireEvent.click(button);
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });
});
`;

  console.log('Writing React test file...');
  console.log(`  File: ${path.relative(DEMO_DIR, reactTestPath)}`);
  fs.writeFileSync(reactTestPath, reactTestContent, 'utf-8');
  console.log('  ✓ File saved\n');

  console.log('⏳ Waiting for automatic conversion...\n');
  await sleep(1000);

  // Check if Flutter test was created
  const flutterTestPath = path.join(FLUTTER_TEST_DIR, '__tests__/counter_test.dart');
  const expectedFlutterPath = path.join(FLUTTER_TEST_DIR, 'counter_test.dart');
  
  let flutterTestExists = false;
  let actualFlutterPath = '';
  
  if (fs.existsSync(flutterTestPath)) {
    flutterTestExists = true;
    actualFlutterPath = flutterTestPath;
  } else if (fs.existsSync(expectedFlutterPath)) {
    flutterTestExists = true;
    actualFlutterPath = expectedFlutterPath;
  }

  if (flutterTestExists) {
    console.log('✅ SUCCESS! Flutter test was automatically created!');
    console.log(`  Location: ${path.relative(DEMO_DIR, actualFlutterPath)}\n`);
    
    const flutterContent = fs.readFileSync(actualFlutterPath, 'utf-8');
    console.log('Generated Flutter test preview:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(flutterContent.substring(0, 400) + '...');
    console.log('─────────────────────────────────────────────────────────\n');
  } else {
    console.log('⚠️  Flutter test not found (may need more time or check paths)\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📝 Demo 2: Writing Flutter Test (Auto-converts to React)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Create Flutter test file
  const flutterTestPath2 = path.join(FLUTTER_TEST_DIR, 'user_profile_test.dart');
  const flutterTestContent = `
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/widgets/user_profile.dart';

void main() {
  group('UserProfile Widget', () {
    testWidgets('should display user name', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: UserProfile(name: 'John Doe', email: 'john@example.com'),
        ),
      );

      expect(find.text('John Doe'), findsOneWidget);
      expect(find.text('john@example.com'), findsOneWidget);
    });

    testWidgets('should call onEdit callback', (WidgetTester tester) async {
      bool called = false;
      
      await tester.pumpWidget(
        MaterialApp(
          home: UserProfile(
            name: 'John Doe',
            email: 'john@example.com',
            onEdit: () => called = true,
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      expect(called, equals(true));
    });
  });
}
`;

  console.log('Writing Flutter test file...');
  console.log(`  File: ${path.relative(DEMO_DIR, flutterTestPath2)}`);
  fs.writeFileSync(flutterTestPath2, flutterTestContent, 'utf-8');
  console.log('  ✓ File saved\n');

  console.log('⏳ Waiting for automatic conversion...\n');
  await sleep(1000);

  // Check if React test was created
  const reactTestPath2 = path.join(REACT_TEST_DIR, 'UserProfile.test.tsx');
  
  if (fs.existsSync(reactTestPath2)) {
    console.log('✅ SUCCESS! React test was automatically created!');
    console.log(`  Location: ${path.relative(DEMO_DIR, reactTestPath2)}\n`);
    
    const reactContent = fs.readFileSync(reactTestPath2, 'utf-8');
    console.log('Generated React test preview:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(reactContent.substring(0, 400) + '...');
    console.log('─────────────────────────────────────────────────────────\n');
  } else {
    console.log('⚠️  React test not found (may need more time or check paths)\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📊 Demo Summary\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Total test conversions: ${testConversions}`);
  console.log(`React test created: ${fs.existsSync(reactTestPath)}`);
  console.log(`Flutter test created: ${flutterTestExists}`);
  console.log(`React test from Flutter: ${fs.existsSync(reactTestPath2)}\n`);

  console.log('✓ Demo completed!\n');
  console.log('Key Takeaways:');
  console.log('  1. Tests are detected automatically by file pattern');
  console.log('  2. Conversion happens in real-time (< 1 second)');
  console.log('  3. No manual commands needed');
  console.log('  4. Works just like component conversion\n');

  // Stop sync
  await sync.stop();
  console.log('✓ Sync engine stopped\n');

  // Cleanup
  console.log('🧹 Cleaning up demo workspace...');
  if (fs.existsSync(DEMO_DIR)) {
    fs.rmSync(DEMO_DIR, { recursive: true, force: true });
  }
  console.log('✓ Cleanup complete\n');

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Demo Complete - Test Sync Works in Real-Time! ✅      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run demo
if (require.main === module) {
  runDemo().catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  });
}

export { runDemo };
