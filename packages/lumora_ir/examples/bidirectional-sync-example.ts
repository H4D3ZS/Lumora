/**
 * Example: Bidirectional Sync Usage
 * 
 * This example demonstrates how to set up and use the bidirectional sync engine
 * to keep React and Flutter codebases synchronized.
 */

import { BidirectionalSync, LumoraIR, createIR, createNode } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mock React to IR converter
 * In a real implementation, this would use a proper React/TSX parser
 */
async function reactToIR(filePath: string): Promise<LumoraIR> {
  console.log(`Converting React file to IR: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Create a simple IR representation
  // In reality, you would parse the TSX and extract component structure
  const ir = createIR({
    sourceFramework: 'react',
    sourceFile: filePath,
  });

  // Add a simple node
  ir.nodes.push(
    createNode({
      type: 'View',
      props: { style: { padding: 16 } },
      children: [
        createNode({
          type: 'Text',
          props: { children: 'Hello from React!' },
          children: [],
        }),
      ],
    })
  );

  return ir;
}

/**
 * Mock Flutter to IR converter
 * In a real implementation, this would use the Dart analyzer
 */
async function flutterToIR(filePath: string): Promise<LumoraIR> {
  console.log(`Converting Flutter file to IR: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Create a simple IR representation
  const ir = createIR({
    sourceFramework: 'flutter',
    sourceFile: filePath,
  });

  // Add a simple node
  ir.nodes.push(
    createNode({
      type: 'Container',
      props: { padding: 16 },
      children: [
        createNode({
          type: 'Text',
          props: { data: 'Hello from Flutter!' },
          children: [],
        }),
      ],
    })
  );

  return ir;
}

/**
 * Mock IR to React generator
 * In a real implementation, this would generate proper React/TSX code
 */
async function irToReact(ir: LumoraIR, outputPath: string): Promise<void> {
  console.log(`Generating React file from IR: ${outputPath}`);
  
  // Generate simple React component
  const code = `
import React from 'react';

export default function Component() {
  return (
    <div style={{ padding: 16 }}>
      <p>Hello from React!</p>
    </div>
  );
}
`;

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, code, 'utf8');
}

/**
 * Mock IR to Flutter generator
 * In a real implementation, this would generate proper Dart code
 */
async function irToFlutter(ir: LumoraIR, outputPath: string): Promise<void> {
  console.log(`Generating Flutter file from IR: ${outputPath}`);
  
  // Generate simple Flutter widget
  const code = `
import 'package:flutter/material.dart';

class Component extends StatelessWidget {
  const Component({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: const Text('Hello from Flutter!'),
    );
  }
}
`;

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, code, 'utf8');
}

/**
 * Main example
 */
async function main() {
  console.log('=== Bidirectional Sync Example ===\n');

  // Create sync instance
  const sync = new BidirectionalSync({
    sync: {
      reactDir: 'examples/demo/web/src',
      flutterDir: 'examples/demo/mobile/lib',
      storageDir: 'examples/demo/.lumora/ir',
      reactToIR,
      flutterToIR,
      irToReact,
      irToFlutter,
    },
    watcher: {
      debounceMs: 100,
      ignored: ['**/node_modules/**', '**/.git/**', '**/build/**'],
    },
    queue: {
      batchSize: 5,
      batchDelayMs: 500,
    },
    conflictDetector: {
      conflictWindowMs: 5000,
    },
  });

  // Monitor status updates
  sync.onStatusUpdate((event) => {
    console.log(`[${new Date().toISOString()}] Status: ${event.status}`);
    if (event.message) {
      console.log(`  Message: ${event.message}`);
    }
    if (event.operation) {
      console.log(`  Operation: ${event.operation.sourceFile} -> ${event.operation.targetFile || 'pending'}`);
    }
  });

  // Monitor conflicts
  sync.onConflict((conflict) => {
    console.log('\n⚠️  CONFLICT DETECTED!');
    console.log(`  ID: ${conflict.id}`);
    console.log(`  React: ${conflict.reactFile} (${new Date(conflict.reactTimestamp).toISOString()})`);
    console.log(`  Flutter: ${conflict.flutterFile} (${new Date(conflict.flutterTimestamp).toISOString()})`);
    console.log('  Manual resolution required\n');
  });

  // Start sync
  console.log('Starting bidirectional sync...\n');
  sync.start();

  // Display status
  const statusTracker = sync.getStatusTracker();
  console.log(statusTracker.formatForCLI());
  console.log('\nWatching for changes... (Press Ctrl+C to stop)\n');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nStopping sync...');
    await sync.stop();
    
    // Display final statistics
    const stats = statusTracker.getStatistics();
    console.log('\n=== Final Statistics ===');
    console.log(`Total syncs: ${stats.totalSyncs}`);
    console.log(`Successful: ${stats.successfulSyncs}`);
    console.log(`Failed: ${stats.failedSyncs}`);
    console.log(`Conflicts: ${stats.conflicts}`);
    console.log(`Average sync time: ${Math.round(stats.averageSyncTime)}ms`);
    
    process.exit(0);
  });

  // Keep process running
  await new Promise(() => {});
}

// Run example if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { main };

