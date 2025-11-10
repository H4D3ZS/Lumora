/**
 * Conflict Resolution System Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import { ConflictDetector } from '../sync/conflict-detector';
import { ConflictNotifier, NotificationChannel } from '../sync/conflict-notifier';
import { ConflictResolverUI, ResolutionOption } from '../sync/conflict-resolver-ui';
import { ConflictResolver } from '../sync/conflict-resolver';
import { IRStorage } from '../storage/ir-storage';
import { LumoraIR } from '../types/ir-types';

describe('Conflict Resolution System', () => {
  const testDir = path.join(__dirname, '../../.test-conflict-resolution');
  const storageDir = path.join(testDir, 'ir');
  
  let detector: ConflictDetector;
  let notifier: ConflictNotifier;
  let ui: ConflictResolverUI;
  let resolver: ConflictResolver;
  let storage: IRStorage;

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Initialize components
    storage = new IRStorage(storageDir);
    detector = new ConflictDetector({
      conflictWindowMs: 5000,
      storageDir,
    });
    notifier = new ConflictNotifier();
    ui = new ConflictResolverUI();
    resolver = new ConflictResolver(detector, storage, {
      reactToIR: mockReactToIR,
      flutterToIR: mockFlutterToIR,
      irToReact: mockIRToReact,
      irToFlutter: mockIRToFlutter,
    });
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('ConflictDetector', () => {
    it('should detect conflicts when both files change within window', () => {
      const event1 = {
        type: 'change' as const,
        filePath: 'react.tsx',
        framework: 'react' as const,
        timestamp: Date.now(),
      };

      const event2 = {
        type: 'change' as const,
        filePath: 'flutter.dart',
        framework: 'flutter' as const,
        timestamp: Date.now() + 1000,
      };

      // First change - no conflict
      const result1 = detector.checkConflict(event1, 'test_id', 'react.tsx', 'flutter.dart');
      expect(result1.hasConflict).toBe(false);

      // Second change within window - conflict!
      const result2 = detector.checkConflict(event2, 'test_id', 'react.tsx', 'flutter.dart');
      expect(result2.hasConflict).toBe(true);
      expect(result2.conflict).toBeDefined();
      expect(result2.conflict?.id).toBe('test_id');
    });

    it('should not detect conflicts when changes are outside window', () => {
      const event1 = {
        type: 'change' as const,
        filePath: 'react.tsx',
        framework: 'react' as const,
        timestamp: Date.now() - 10000, // 10 seconds ago
      };

      const event2 = {
        type: 'change' as const,
        filePath: 'flutter.dart',
        framework: 'flutter' as const,
        timestamp: Date.now(),
      };

      detector.checkConflict(event1, 'test_id', 'react.tsx', 'flutter.dart');
      const result2 = detector.checkConflict(event2, 'test_id', 'react.tsx', 'flutter.dart');
      
      expect(result2.hasConflict).toBe(false);
    });

    it('should track unresolved conflicts', () => {
      const conflict = {
        id: 'test_conflict',
        reactFile: 'react.tsx',
        flutterFile: 'flutter.dart',
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      // Manually add conflict for testing
      detector['conflicts'].set(conflict.id, conflict);

      const unresolved = detector.getUnresolvedConflicts();
      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].id).toBe('test_conflict');
    });

    it('should mark conflicts as resolved', () => {
      const conflict = {
        id: 'test_conflict',
        reactFile: 'react.tsx',
        flutterFile: 'flutter.dart',
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      detector['conflicts'].set(conflict.id, conflict);

      const resolved = detector.resolveConflict('test_conflict');
      expect(resolved).toBe(true);

      const unresolved = detector.getUnresolvedConflicts();
      expect(unresolved).toHaveLength(0);
    });
  });

  describe('ConflictNotifier', () => {
    it('should send notifications to registered handlers', () => {
      const cliMessages: string[] = [];
      const webMessages: string[] = [];

      notifier.registerHandler(NotificationChannel.CLI, (notification) => {
        cliMessages.push(notification.message);
      });

      notifier.registerHandler(NotificationChannel.WEB_DASHBOARD, (notification) => {
        webMessages.push(notification.message);
      });

      const conflict = {
        id: 'test_conflict',
        reactFile: 'react.tsx',
        flutterFile: 'flutter.dart',
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      notifier.sendCLINotification(conflict);
      notifier.sendWebDashboardNotification(conflict);

      expect(cliMessages).toHaveLength(1);
      expect(webMessages).toHaveLength(1);
      expect(cliMessages[0]).toContain('CONFLICT DETECTED');
    });

    it('should maintain notification history', () => {
      const conflict = {
        id: 'test_conflict',
        reactFile: 'react.tsx',
        flutterFile: 'flutter.dart',
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      notifier.sendCLINotification(conflict);
      notifier.sendWebDashboardNotification(conflict);

      const history = notifier.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should clear notification history', () => {
      const conflict = {
        id: 'test_conflict',
        reactFile: 'react.tsx',
        flutterFile: 'flutter.dart',
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      notifier.sendCLINotification(conflict);
      expect(notifier.getHistory()).toHaveLength(1);

      notifier.clearHistory();
      expect(notifier.getHistory()).toHaveLength(0);
    });
  });

  describe('ConflictResolverUI', () => {
    it('should format conflict for web dashboard', () => {
      const conflict = {
        id: 'test_conflict',
        reactFile: path.join(testDir, 'react.tsx'),
        flutterFile: path.join(testDir, 'flutter.dart'),
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      // Create test files
      fs.writeFileSync(conflict.reactFile, 'const Button = () => <button>Click</button>;');
      fs.writeFileSync(conflict.flutterFile, 'class Button extends StatelessWidget {}');

      const formatted = ui.formatForWebDashboard(conflict);
      
      expect(formatted).toHaveProperty('id', 'test_conflict');
      expect(formatted).toHaveProperty('reactFile');
      expect(formatted).toHaveProperty('flutterFile');
      expect(formatted).toHaveProperty('options');
    });

    it('should format conflict for VS Code', () => {
      const conflict = {
        id: 'test_conflict',
        reactFile: 'react.tsx',
        flutterFile: 'flutter.dart',
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      const formatted = ui.formatForVSCode(conflict);
      
      expect(formatted).toHaveProperty('id', 'test_conflict');
      expect(formatted).toHaveProperty('title');
      expect(formatted).toHaveProperty('message');
      expect(formatted).toHaveProperty('actions');
    });

    it('should generate HTML diff view', () => {
      const conflict = {
        id: 'test_conflict',
        reactFile: path.join(testDir, 'react.tsx'),
        flutterFile: path.join(testDir, 'flutter.dart'),
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      // Create test files
      fs.writeFileSync(conflict.reactFile, 'const Button = () => <button>Click</button>;');
      fs.writeFileSync(conflict.flutterFile, 'class Button extends StatelessWidget {}');

      const html = ui.generateHTMLDiff(conflict);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Conflict Resolution');
      expect(html).toContain('test_conflict');
    });
  });

  describe('ConflictResolver', () => {
    it('should resolve conflict using React version', async () => {
      const conflict = {
        id: 'test_conflict',
        reactFile: path.join(testDir, 'react.tsx'),
        flutterFile: path.join(testDir, 'flutter.dart'),
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      // Create test files
      fs.writeFileSync(conflict.reactFile, 'const Button = () => <button>Click</button>;');
      fs.writeFileSync(conflict.flutterFile, 'class Button extends StatelessWidget {}');

      const result = await resolver.applyResolution({
        option: ResolutionOption.USE_REACT,
        conflict,
        timestamp: Date.now(),
      });

      if (!result.success) {
        console.log('Resolution error:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.option).toBe(ResolutionOption.USE_REACT);
      expect(result.filesRegenerated?.flutter).toBeDefined();
    });

    it('should resolve conflict using Flutter version', async () => {
      const conflict = {
        id: 'test_conflict',
        reactFile: path.join(testDir, 'react.tsx'),
        flutterFile: path.join(testDir, 'flutter.dart'),
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      // Create test files
      fs.writeFileSync(conflict.reactFile, 'const Button = () => <button>Click</button>;');
      fs.writeFileSync(conflict.flutterFile, 'class Button extends StatelessWidget {}');

      const result = await resolver.applyResolution({
        option: ResolutionOption.USE_FLUTTER,
        conflict,
        timestamp: Date.now(),
      });

      expect(result.success).toBe(true);
      expect(result.option).toBe(ResolutionOption.USE_FLUTTER);
      expect(result.filesRegenerated?.react).toBeDefined();
    });

    it('should handle manual merge', async () => {
      const conflict = {
        id: 'test_conflict',
        reactFile: path.join(testDir, 'react.tsx'),
        flutterFile: path.join(testDir, 'flutter.dart'),
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      // Create test files
      fs.writeFileSync(conflict.reactFile, 'const Button = () => <button>Click</button>;');
      fs.writeFileSync(conflict.flutterFile, 'class Button extends StatelessWidget {}');

      const result = await resolver.applyResolution({
        option: ResolutionOption.MANUAL_MERGE,
        conflict,
        timestamp: Date.now(),
      });

      expect(result.success).toBe(true);
      expect(result.option).toBe(ResolutionOption.MANUAL_MERGE);
      expect(result.filesRegenerated?.react).toContain('.backup.');
      expect(result.filesRegenerated?.flutter).toContain('.backup.');
    });

    it('should skip conflict resolution', async () => {
      const conflict = {
        id: 'test_conflict',
        reactFile: 'react.tsx',
        flutterFile: 'flutter.dart',
        reactTimestamp: Date.now(),
        flutterTimestamp: Date.now(),
        irVersion: 1,
        detectedAt: Date.now(),
        resolved: false,
      };

      const result = await resolver.applyResolution({
        option: ResolutionOption.SKIP,
        conflict,
        timestamp: Date.now(),
      });

      expect(result.success).toBe(true);
      expect(result.option).toBe(ResolutionOption.SKIP);
    });
  });
});

// Mock converter functions
async function mockReactToIR(filePath: string): Promise<LumoraIR> {
  return {
    version: '1.0.0',
    metadata: {
      sourceFramework: 'react',
      sourceFile: filePath,
      generatedAt: Date.now(),
    },
    nodes: [],
  };
}

async function mockFlutterToIR(filePath: string): Promise<LumoraIR> {
  return {
    version: '1.0.0',
    metadata: {
      sourceFramework: 'flutter',
      sourceFile: filePath,
      generatedAt: Date.now(),
    },
    nodes: [],
  };
}

async function mockIRToReact(ir: LumoraIR, outputPath: string): Promise<void> {
  // Mock implementation
}

async function mockIRToFlutter(ir: LumoraIR, outputPath: string): Promise<void> {
  // Mock implementation
}
