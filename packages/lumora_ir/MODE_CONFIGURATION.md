# Mode Configuration

The Lumora IR system supports three development modes that control how file watching and synchronization behave. This allows teams to optimize their workflow based on whether they're working primarily in React, Flutter, or both.

## Development Modes

### 1. React Mode (`react`)

**Use Case**: Teams that primarily develop in React/TypeScript and want Flutter code generated automatically.

**Behavior**:
- ✅ Watches React files (`.tsx`, `.ts`, `.jsx`, `.js`)
- ❌ Does not watch Flutter files (`.dart`)
- 🔄 Automatically generates Flutter code when React files change
- 🔒 Flutter files are treated as read-only (generated)
- ⚠️ No conflict detection (single source of truth)

**Example**:
```typescript
import { initModeConfig, DevelopmentMode } from '@lumora/ir';

const config = initModeConfig(
  './my-project',
  DevelopmentMode.REACT,
  {
    reactDir: 'web/src',
    flutterDir: 'mobile/lib',
  }
);
```

### 2. Flutter Mode (`flutter`)

**Use Case**: Teams that primarily develop in Flutter/Dart and want React code generated automatically.

**Behavior**:
- ❌ Does not watch React files
- ✅ Watches Flutter files (`.dart`)
- 🔄 Automatically generates React code when Flutter files change
- 🔒 React files are treated as read-only (generated)
- ⚠️ No conflict detection (single source of truth)

**Example**:
```typescript
import { initModeConfig, DevelopmentMode } from '@lumora/ir';

const config = initModeConfig(
  './my-project',
  DevelopmentMode.FLUTTER,
  {
    reactDir: 'web/src',
    flutterDir: 'mobile/lib',
  }
);
```

### 3. Universal Mode (`universal`)

**Use Case**: Teams with both React and Flutter developers working simultaneously, or projects that need true bidirectional sync.

**Behavior**:
- ✅ Watches React files
- ✅ Watches Flutter files
- 🔄 Bidirectional sync: changes in either framework update the other
- ✏️ Both React and Flutter files are editable
- ⚠️ Conflict detection enabled (handles simultaneous edits)

**Example**:
```typescript
import { initModeConfig, DevelopmentMode } from '@lumora/ir';

const config = initModeConfig(
  './my-project',
  DevelopmentMode.UNIVERSAL,
  {
    reactDir: 'web/src',
    flutterDir: 'mobile/lib',
  }
);
```

## Configuration File

Mode configuration is stored in `lumora.yaml` at the project root:

```yaml
mode: universal
reactDir: web/src
flutterDir: mobile/lib
storageDir: .lumora/ir
namingConventions:
  fileNaming: snake_case
  identifierNaming: camelCase
formatting:
  indentSize: 2
  useTabs: false
  lineWidth: 80
```

## API Reference

### Initializing Configuration

```typescript
import { initModeConfig, DevelopmentMode } from '@lumora/ir';

// Initialize new project with mode
const config = initModeConfig(
  projectRoot: string,
  mode: DevelopmentMode,
  options?: Partial<LumoraConfig>
);
```

### Loading Existing Configuration

```typescript
import { loadModeConfig } from '@lumora/ir';

// Load existing lumora.yaml
const config = loadModeConfig(projectRoot?: string);
```

### Querying Mode

```typescript
// Get current mode
const mode = config.getMode(); // 'react' | 'flutter' | 'universal'

// Check specific mode
if (config.isReactFirst()) {
  // React mode logic
}

if (config.isFlutterFirst()) {
  // Flutter mode logic
}

if (config.isUniversal()) {
  // Universal mode logic
}
```

### Changing Mode

```typescript
// Change mode (automatically saves to lumora.yaml)
config.setMode(DevelopmentMode.UNIVERSAL);
```

## Mode-Aware Sync

The `ModeAwareSync` class automatically configures file watching and sync behavior based on the mode:

```typescript
import { 
  loadModeConfig, 
  createModeAwareSync,
  LumoraIR 
} from '@lumora/ir';

// Load configuration
const modeConfig = loadModeConfig('./my-project');

// Create mode-aware sync
const sync = createModeAwareSync({
  modeConfig,
  sync: {
    reactToIR: async (filePath: string): Promise<LumoraIR> => {
      // Convert React file to IR
    },
    flutterToIR: async (filePath: string): Promise<LumoraIR> => {
      // Convert Flutter file to IR
    },
    irToReact: async (ir: LumoraIR, outputPath: string): Promise<void> => {
      // Generate React file from IR
    },
    irToFlutter: async (ir: LumoraIR, outputPath: string): Promise<void> => {
      // Generate Flutter file from IR
    },
  },
});

// Start watching (behavior depends on mode)
sync.start();

// Stop watching
await sync.stop();
```

## Mode-Aware Watcher

The `ModeAwareWatcher` provides mode-specific file watching:

```typescript
import { loadModeConfig, createModeAwareWatcher } from '@lumora/ir';

const modeConfig = loadModeConfig('./my-project');
const watcher = createModeAwareWatcher(modeConfig);

// Get mode information
console.log(watcher.getMode()); // 'react' | 'flutter' | 'universal'
console.log(watcher.getSourceFramework()); // 'react' | 'flutter' | 'both'
console.log(watcher.getModeDescription());

// Check read-only status
console.log(watcher.isReadOnly('react')); // true in Flutter mode
console.log(watcher.isReadOnly('flutter')); // true in React mode

// Get target framework for conversion
console.log(watcher.getTargetFramework('react')); // 'flutter' in React/Universal mode

// Start watching
watcher.start();

// Register change handler
watcher.onChange((event) => {
  console.log(`File changed: ${event.filePath}`);
  console.log(`Framework: ${event.framework}`);
});

// Stop watching
await watcher.stop();
```

## Conflict Handling

In Universal mode, conflicts can occur when both React and Flutter files are modified simultaneously:

```typescript
const sync = createModeAwareSync({ modeConfig, sync: converters });

// Register conflict handler
sync.onConflict((conflict) => {
  console.warn('Conflict detected!');
  console.warn(`React file: ${conflict.reactFile}`);
  console.warn(`Flutter file: ${conflict.flutterFile}`);
  console.warn(`React timestamp: ${conflict.reactTimestamp}`);
  console.warn(`Flutter timestamp: ${conflict.flutterTimestamp}`);
  
  // Resolve conflict
  // Options: 'react', 'flutter', or manual merge
});

// Get unresolved conflicts
const conflicts = sync.getUnresolvedConflicts();

// Resolve conflict
sync.resolveConflict(conflictId);
```

## Best Practices

### Choosing the Right Mode

1. **Use React Mode when**:
   - Your team primarily works in React/TypeScript
   - Flutter is just a deployment target
   - You want to maintain a single source of truth in React

2. **Use Flutter Mode when**:
   - Your team primarily works in Flutter/Dart
   - React/web is just a deployment target
   - You want to maintain a single source of truth in Flutter

3. **Use Universal Mode when**:
   - You have both React and Flutter developers
   - Both platforms have platform-specific code
   - You need true bidirectional sync
   - You're willing to handle occasional conflicts

### Switching Modes

You can switch modes at any time, but be aware:

- Switching from React/Flutter mode to Universal mode enables conflict detection
- Switching from Universal mode to React/Flutter mode makes one side read-only
- Always commit your code before switching modes
- Regenerate all files after switching modes to ensure consistency

### Configuration Management

- Commit `lumora.yaml` to version control
- Document your chosen mode in your project README
- Use consistent modes across your team
- Consider using different modes for different branches (e.g., Universal on main, React on feature branches)

## Examples

See `examples/mode-aware-sync-example.ts` for complete working examples of all three modes.

## Troubleshooting

### Files not being watched

**Problem**: Changes to files are not triggering sync

**Solution**:
- Check that you're editing files in the correct framework for your mode
- In React mode, only React files trigger sync
- In Flutter mode, only Flutter files trigger sync
- Verify file paths match `reactDir` and `flutterDir` in config

### Conflicts in React/Flutter mode

**Problem**: Getting conflict warnings in single-source mode

**Solution**:
- This shouldn't happen in React/Flutter mode
- Check that you haven't manually edited generated files
- Verify mode is set correctly in `lumora.yaml`
- Reload configuration with `config.reload()`

### Generated files being edited

**Problem**: Generated files are being modified manually

**Solution**:
- In React mode, don't edit Flutter files (they're generated)
- In Flutter mode, don't edit React files (they're generated)
- Consider adding generated files to `.gitignore` in single-source modes
- Use Universal mode if you need to edit both sides

## Related Documentation

- [Bidirectional Sync](./SYNC_ENGINE_IMPLEMENTATION.md)
- [Conflict Resolution](./CONFLICT_RESOLUTION_IMPLEMENTATION.md)
- [File Watching](./src/sync/README.md)
