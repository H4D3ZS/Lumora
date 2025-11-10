# Conflict Resolution System

The Lumora IR conflict resolution system handles cases where both React and Flutter versions of a component are modified simultaneously. It provides detection, notification, and resolution capabilities across multiple platforms.

## Architecture

The conflict resolution system consists of four main components:

### 1. ConflictDetector
Detects conflicts by comparing file timestamps and IR versions.

**Key Features:**
- Compares file modification timestamps
- Tracks IR version history
- Identifies conflicting changes
- Maintains conflict records
- Configurable conflict detection window (default: 5 seconds)

**Usage:**
```typescript
import { ConflictDetector } from '@lumora/ir';

const detector = new ConflictDetector({
  conflictWindowMs: 5000,
  storageDir: '.lumora/ir',
});

// Register conflict handler
detector.onConflict((conflict) => {
  console.log('Conflict detected:', conflict.id);
});

// Check for conflicts
const result = detector.checkConflict(
  fileChangeEvent,
  'component_id',
  'web/src/Component.tsx',
  'mobile/lib/component.dart'
);

if (result.hasConflict) {
  // Handle conflict
}
```

### 2. ConflictNotifier
Sends notifications about conflicts to various channels.

**Supported Channels:**
- CLI (terminal output)
- Web Dashboard (JSON API)
- VS Code Extension (extension API)

**Usage:**
```typescript
import { ConflictNotifier, NotificationChannel } from '@lumora/ir';

const notifier = new ConflictNotifier();

// Register handlers
notifier.registerHandler(NotificationChannel.CLI, (notification) => {
  console.log(notification.message);
});

// Send notifications
notifier.sendCLINotification(conflict);
notifier.sendWebDashboardNotification(conflict);
notifier.sendVSCodeNotification(conflict);

// Or notify all channels at once
notifier.notifyAll(conflict);
```

### 3. ConflictResolverUI
Provides user interface components for conflict resolution.

**Features:**
- CLI interactive prompt with file previews
- Web dashboard diff view with side-by-side comparison
- VS Code extension integration
- HTML diff generation

**Usage:**
```typescript
import { ConflictResolverUI } from '@lumora/ir';

const ui = new ConflictResolverUI();

// CLI interactive prompt
const choice = await ui.promptCLI(conflict);
console.log('User selected:', choice.option);

// Web dashboard diff view
const diffView = ui.buildWebDashboardDiffView(conflict);

// VS Code diff view
const vscodeView = ui.buildVSCodeDiffView(conflict);

// Generate HTML diff
const html = ui.generateHTMLDiff(conflict);
```

### 4. ConflictResolver
Applies conflict resolution and regenerates files.

**Resolution Options:**
- **USE_REACT**: Use React version, regenerate Flutter
- **USE_FLUTTER**: Use Flutter version, regenerate React
- **MANUAL_MERGE**: Create backups, let user manually merge
- **SKIP**: Keep conflict for later resolution

**Usage:**
```typescript
import { ConflictResolver, ResolutionOption } from '@lumora/ir';

const resolver = new ConflictResolver(detector, storage, {
  reactToIR: async (file) => convertReactToIR(file),
  flutterToIR: async (file) => convertFlutterToIR(file),
  irToReact: async (ir, output) => generateReact(ir, output),
  irToFlutter: async (ir, output) => generateFlutter(ir, output),
});

// Apply resolution
const result = await resolver.applyResolution({
  option: ResolutionOption.USE_REACT,
  conflict,
  timestamp: Date.now(),
});

if (result.success) {
  console.log('Conflict resolved!');
  console.log('Regenerated files:', result.filesRegenerated);
}
```

## Complete Workflow

### 1. Detection Phase
```typescript
// File watcher detects changes
const event = {
  type: 'change',
  filePath: 'web/src/Button.tsx',
  framework: 'react',
  timestamp: Date.now(),
};

// Check for conflicts
const result = detector.checkConflict(
  event,
  'button_component',
  'web/src/Button.tsx',
  'mobile/lib/button.dart'
);

if (result.hasConflict) {
  // Conflict detected!
  const conflict = result.conflict;
}
```

### 2. Notification Phase
```typescript
// Notify all channels
notifier.notifyAll(conflict);

// CLI output:
// ⚠️  CONFLICT DETECTED
// ID: button_component
// React File: web/src/Button.tsx (modified at 10:30:45)
// Flutter File: mobile/lib/button.dart (modified at 10:30:47)
// IR Version: 5
```

### 3. Resolution Phase
```typescript
// Present options to user
const choice = await ui.promptCLI(conflict);

// Apply resolution
const result = await resolver.applyResolution(choice);

if (result.success) {
  console.log('✅ Conflict resolved');
  console.log('Files regenerated:', result.filesRegenerated);
}
```

## Advanced Features

### Timestamp Comparison
```typescript
const comparison = detector.compareFileTimestamps(
  'web/src/Component.tsx',
  'mobile/lib/component.dart'
);

if (comparison.hasConflict) {
  console.log('Time difference:', comparison.timeDiff, 'ms');
}
```

### IR Version Comparison
```typescript
const versionCheck = detector.compareIRVersions('component_id');

if (versionCheck.hasConflict) {
  console.log('Multiple versions detected:', versionCheck.versionHistory);
}
```

### Comprehensive Conflict Analysis
```typescript
const analysis = detector.identifyConflictingChanges(
  'component_id',
  'web/src/Component.tsx',
  'mobile/lib/component.dart'
);

console.log('Conflict type:', analysis.conflictType); // 'timestamp' | 'version' | 'both'
console.log('Details:', analysis.details);
```

### Manual Merge Workflow
```typescript
// 1. Initiate manual merge
const result = await resolver.applyResolution({
  option: ResolutionOption.MANUAL_MERGE,
  conflict,
  timestamp: Date.now(),
});

// Backup files created
console.log('Backups:', result.filesRegenerated);

// 2. User manually edits files...

// 3. Complete manual merge
const finalResult = await resolver.resolveManualMerge(
  conflict.id,
  'react' // or 'flutter' - which file is the source of truth
);

console.log('Manual merge complete:', finalResult);
```

### Backup Management
```typescript
// List backups
const backups = resolver.listBackups('web/src/Component.tsx');
console.log('Available backups:', backups);

// Restore from backup
await resolver.restoreFromBackup(
  'web/src/Component.backup.1699999999999.tsx',
  'web/src/Component.tsx'
);

// Clean up old backups (keep 5 most recent)
resolver.cleanupBackups('web/src/Component.tsx', 5);
```

## Integration Examples

### CLI Tool Integration
```typescript
import { program } from 'commander';

program
  .command('resolve <conflictId>')
  .description('Resolve a conflict')
  .action(async (conflictId) => {
    const conflict = resolver.getConflict(conflictId);
    if (!conflict) {
      console.error('Conflict not found');
      return;
    }

    const choice = await ui.promptCLI(conflict);
    const result = await resolver.applyResolution(choice);

    if (result.success) {
      console.log('✅ Conflict resolved');
    } else {
      console.error('❌ Resolution failed:', result.error);
    }
  });
```

### Web Dashboard Integration
```typescript
import express from 'express';

const app = express();

// Get all conflicts
app.get('/api/conflicts', (req, res) => {
  const conflicts = resolver.getUnresolvedConflicts();
  res.json(conflicts.map(c => ui.formatForWebDashboard(c)));
});

// Get conflict diff view
app.get('/api/conflicts/:id/diff', (req, res) => {
  const conflict = resolver.getConflict(req.params.id);
  if (!conflict) {
    return res.status(404).json({ error: 'Conflict not found' });
  }

  const html = ui.generateHTMLDiff(conflict);
  res.send(html);
});

// Resolve conflict
app.post('/api/conflicts/:id/resolve', async (req, res) => {
  const conflict = resolver.getConflict(req.params.id);
  if (!conflict) {
    return res.status(404).json({ error: 'Conflict not found' });
  }

  const result = await resolver.applyResolution({
    option: req.body.option,
    conflict,
    timestamp: Date.now(),
  });

  res.json(result);
});
```

### VS Code Extension Integration
```typescript
import * as vscode from 'vscode';

// Register conflict notification
detector.onConflict((conflict) => {
  const formatted = ui.formatForVSCode(conflict);
  
  vscode.window.showWarningMessage(
    formatted.message,
    ...formatted.actions.map(a => a.title)
  ).then(async (selection) => {
    if (selection === 'Show Diff') {
      const diffView = ui.buildVSCodeDiffView(conflict);
      await vscode.commands.executeCommand(
        'vscode.diff',
        vscode.Uri.parse(diffView.leftUri),
        vscode.Uri.parse(diffView.rightUri),
        diffView.title
      );
    }
    // Handle other actions...
  });
});
```

## Configuration

### Conflict Detection Window
```typescript
const detector = new ConflictDetector({
  conflictWindowMs: 10000, // 10 seconds
});
```

### Notification History
```typescript
const notifier = new ConflictNotifier();

// Get recent notifications
const recent = notifier.getHistory(10);

// Clear history
notifier.clearHistory();
```

### Backup Settings
```typescript
// Keep only 3 most recent backups
resolver.cleanupBackups('web/src/Component.tsx', 3);
```

## Error Handling

```typescript
try {
  const result = await resolver.applyResolution(choice);
  
  if (!result.success) {
    console.error('Resolution failed:', result.error);
    // Handle error...
  }
} catch (error) {
  console.error('Unexpected error:', error);
  // Handle exception...
}
```

## Best Practices

1. **Always create backups** before applying resolution
2. **Notify all channels** to ensure developers are aware
3. **Clean up old backups** regularly to save disk space
4. **Use manual merge** for complex conflicts
5. **Test converters** thoroughly to ensure accurate regeneration
6. **Monitor conflict frequency** to identify problematic areas
7. **Document resolution decisions** for team awareness

## Troubleshooting

### Conflict not detected
- Check conflict window setting (may be too short)
- Verify file watchers are running
- Ensure timestamps are accurate

### Resolution fails
- Verify converters are configured correctly
- Check file permissions
- Ensure IR storage is accessible

### Backups not created
- Check write permissions in target directory
- Verify disk space availability
- Review error logs

## See Also

- [Bidirectional Sync](./README.md)
- [File Watcher](./file-watcher.ts)
- [Sync Engine](./sync-engine.ts)
- [IR Storage](../storage/ir-storage.ts)
