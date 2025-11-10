# Lumora Expo Mode - Fully Automatic Workflow

## Vision: Make Lumora Work Like React Native Expo

**Goal**: Flutter Dev Client = Expo Go for Lumora

Just like Expo:
1. Install Flutter Dev Client once (like Expo Go app)
2. Run `lumora start` (like `expo start`)
3. Scan QR code
4. Edit code → See changes instantly
5. Everything automatic!

## Current vs Desired Workflow

### ❌ Current (Manual Steps)
```bash
# Terminal 1: Start Dev-Proxy
cd tools/dev-proxy && npm start

# Terminal 2: Convert TSX to schema
cd tools/codegen
node cli.js tsx2schema App.tsx schema.json

# Terminal 3: Push schema manually
curl -X POST http://localhost:3000/send/abc123 -d @schema.json

# Terminal 4: Run Flutter Dev Client
cd apps/flutter-dev-client && flutter run
```

### ✅ Desired (Expo-Like - Fully Automatic)
```bash
# Just ONE command:
lumora start

# That's it! Everything else is automatic:
✓ Dev-Proxy starts
✓ File watcher monitors changes
✓ Auto-converts TSX to schema
✓ Auto-pushes to Dev-Proxy
✓ QR code displayed
✓ Scan with Flutter Dev Client (pre-installed)
✓ Edit code → Instant updates!
```

## Architecture for Automatic Mode

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LUMORA EXPO MODE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  $ lumora start                                                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  LUMORA CLI (Single Process)                                 │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  1. Dev-Proxy Server                                   │ │ │
│  │  │     • Session management                               │ │ │
│  │  │     • WebSocket server                                 │ │ │
│  │  │     • QR code generation                               │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  2. File Watcher (Chokidar)                            │ │ │
│  │  │     • Watches: web/src/**/*.{tsx,ts}                   │ │ │
│  │  │     • Detects changes in < 100ms                       │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  3. Auto-Converter (tsx2schema)                        │ │ │
│  │  │     • Converts TSX → JSON schema                       │ │ │
│  │  │     • Runs automatically on file change                │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  4. Auto-Pusher                                        │ │ │
│  │  │     • Pushes schema to Dev-Proxy automatically        │ │ │
│  │  │     • No manual curl commands needed                   │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  5. Code Generator (Optional)                          │ │ │
│  │  │     • Generates production Dart code                   │ │ │
│  │  │     • Runs in background                               │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  OUTPUT                                                      │ │
│  │                                                              │ │
│  │  ✓ Lumora started on http://localhost:3000                  │ │
│  │  ✓ Watching: web/src                                        │ │
│  │  ✓ Session: abc123                                          │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────┐                     │ │
│  │  │  █▀▀▀▀▀█ ▀▀█▄ ▀ ▄▀█ █▀▀▀▀▀█        │                     │ │
│  │  │  █ ███ █ ▄▀▀█▀▄█▀  █ ███ █        │                     │ │
│  │  │  █ ▀▀▀ █ █▀ ▀▄ ▀█▄ █ ▀▀▀ █        │                     │ │
│  │  │  ▀▀▀▀▀▀▀ █▄▀ ▀ █ ▀ ▀▀▀▀▀▀▀        │                     │ │
│  │  │  Scan with Flutter Dev Client      │                     │ │
│  │  └────────────────────────────────────┘                     │ │
│  │                                                              │ │
│  │  Ready! Edit your code and see changes instantly.           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              │ WebSocket                            │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  FLUTTER DEV CLIENT (Pre-installed on device)               │ │
│  │  = "Expo Go" for Lumora                                     │ │
│  │                                                              │ │
│  │  [Mobile Device]                                             │ │
│  │  ┌─────────────────────────┐                                │ │
│  │  │  Lumora Dev Client      │                                │ │
│  │  │  ┌───────────────────┐  │                                │ │
│  │  │  │ Scan QR Code      │  │                                │ │
│  │  │  └───────────────────┘  │                                │ │
│  │  │  [Tap to scan]          │                                │ │
│  │  └─────────────────────────┘                                │ │
│  │                                                              │ │
│  │  ✓ Scan once                                                │ │
│  │  ✓ Connected!                                               │ │
│  │  ✓ Auto-updates on code changes                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### 1. Create Unified CLI (`lumora start`)

**File**: `packages/lumora-cli/src/commands/start.ts`

```typescript
import { DevProxy } from '@lumora/dev-proxy';
import { FileWatcher } from '@lumora/ir';
import { tsx2schema } from '@lumora/codegen';
import chokidar from 'chokidar';
import axios from 'axios';

export async function startCommand(options: StartOptions) {
  console.log('🚀 Starting Lumora...\n');

  // 1. Start Dev-Proxy
  const devProxy = new DevProxy({
    port: options.port || 3000,
  });
  
  await devProxy.start();
  const session = await devProxy.createSession();
  
  console.log(`✓ Dev-Proxy started on http://localhost:${options.port}`);
  console.log(`✓ Session: ${session.id}\n`);
  
  // Display QR code
  devProxy.displayQRCode(session.id);
  
  // 2. Start File Watcher
  const watcher = chokidar.watch('web/src/**/*.{tsx,ts}', {
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });
  
  console.log(`✓ Watching: web/src\n`);
  console.log('Ready! Edit your code and see changes instantly.\n');
  
  // 3. Auto-convert and push on file change
  watcher.on('change', async (filePath) => {
    try {
      console.log(`[${new Date().toLocaleTimeString()}] File changed: ${filePath}`);
      
      // Convert TSX to schema
      const schema = await tsx2schema(filePath);
      console.log(`  ✓ Schema generated`);
      
      // Push to Dev-Proxy automatically
      await axios.post(`http://localhost:${options.port}/send/${session.id}`, schema);
      console.log(`  ✓ Pushed to device`);
      console.log(`  ⚡ Update completed in ${Date.now() - startTime}ms\n`);
      
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}\n`);
    }
  });
  
  // 4. Optional: Start code generator in background
  if (options.generateCode) {
    startCodeGenerator();
  }
  
  // Keep process running
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Stopping Lumora...');
    await watcher.close();
    await devProxy.stop();
    console.log('✓ Stopped\n');
    process.exit(0);
  });
}
```

### 2. Package Flutter Dev Client as "Expo Go"

**Options for distribution:**

#### Option A: App Store Distribution (Like Expo Go)
```bash
# Publish to stores
- Google Play Store: "Lumora Dev Client"
- Apple App Store: "Lumora Dev Client"

# Users install once:
- Android: Download from Play Store
- iOS: Download from App Store

# Then just scan QR codes!
```

#### Option B: TestFlight/Internal Distribution
```bash
# For development teams
- Distribute via TestFlight (iOS)
- Distribute via Firebase App Distribution (Android)
- Team members install once
```

#### Option C: Build Script
```bash
# Auto-build and install
$ lumora install-client

# Detects connected device
# Builds Flutter Dev Client
# Installs on device
# Ready to scan!
```

### 3. Automatic Workflow

**File**: `packages/lumora-cli/src/workflows/expo-mode.ts`

```typescript
export class ExpoModeWorkflow {
  private devProxy: DevProxy;
  private watcher: FSWatcher;
  private session: Session;
  
  async start() {
    // Start all services
    await this.startDevProxy();
    await this.startFileWatcher();
    await this.startAutoConverter();
    
    // Display instructions
    this.displayInstructions();
  }
  
  private async startDevProxy() {
    this.devProxy = new DevProxy();
    await this.devProxy.start();
    this.session = await this.devProxy.createSession();
  }
  
  private async startFileWatcher() {
    this.watcher = chokidar.watch('web/src/**/*.{tsx,ts}');
    
    this.watcher.on('change', async (filePath) => {
      await this.handleFileChange(filePath);
    });
  }
  
  private async handleFileChange(filePath: string) {
    const startTime = Date.now();
    
    try {
      // 1. Convert to schema
      const schema = await this.convertToSchema(filePath);
      
      // 2. Push to Dev-Proxy
      await this.pushToDevProxy(schema);
      
      // 3. Log success
      const duration = Date.now() - startTime;
      console.log(`✓ Updated in ${duration}ms`);
      
    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
    }
  }
  
  private displayInstructions() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              Lumora Expo Mode Started                 ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    this.devProxy.displayQRCode(this.session.id);
    
    console.log('\n📱 Next Steps:');
    console.log('   1. Open Lumora Dev Client on your device');
    console.log('   2. Tap "Scan QR Code"');
    console.log('   3. Point camera at QR code above');
    console.log('   4. Edit your code and see changes instantly!\n');
    
    console.log('📝 Watching: web/src/**/*.{tsx,ts}');
    console.log('🔄 Auto-converting and pushing changes...\n');
  }
}
```

## Complete Automatic Workflow

### Step 1: Install Flutter Dev Client (Once)

```bash
# Option A: From App Store (like Expo Go)
- Search "Lumora Dev Client" in App Store
- Install
- Done!

# Option B: Auto-install
$ lumora install-client
✓ Detected iPhone 14 Pro
✓ Building Flutter Dev Client...
✓ Installing on device...
✓ Done! Ready to scan QR codes.
```

### Step 2: Start Lumora (One Command)

```bash
$ lumora start

🚀 Starting Lumora...

✓ Dev-Proxy started on http://localhost:3000
✓ Session: abc123
✓ Watching: web/src

┌────────────────────────────────────┐
│  █▀▀▀▀▀█ ▀▀█▄ ▀ ▄▀█ █▀▀▀▀▀█        │
│  █ ███ █ ▄▀▀█▀▄█▀  █ ███ █        │
│  █ ▀▀▀ █ █▀ ▀▄ ▀█▄ █ ▀▀▀ █        │
│  ▀▀▀▀▀▀▀ █▄▀ ▀ █ ▀ ▀▀▀▀▀▀▀        │
│  Scan with Lumora Dev Client       │
└────────────────────────────────────┘

📱 Next Steps:
   1. Open Lumora Dev Client on your device
   2. Tap "Scan QR Code"
   3. Point camera at QR code above
   4. Edit your code and see changes instantly!

Ready! Waiting for connections...
```

### Step 3: Scan QR Code (Once)

```
[Mobile Device]
┌─────────────────────────┐
│  Lumora Dev Client      │
│  ┌───────────────────┐  │
│  │ [Camera View]     │  │
│  │ Scanning...       │  │
│  └───────────────────┘  │
│                         │
│  ✓ Connected!           │
│  Waiting for code...    │
└─────────────────────────┘
```

### Step 4: Edit Code → Automatic Updates!

```bash
# Terminal shows:
[12:34:56] File changed: web/src/App.tsx
[12:34:56]   ✓ Schema generated
[12:34:56]   ✓ Pushed to device
[12:34:56]   ⚡ Updated in 234ms

# Device automatically updates!
[Mobile Device]
┌─────────────────────────┐
│  Your App               │
│  [Updated UI]           │
│  ✓ Rendered!            │
└─────────────────────────┘
```

## Configuration File

**File**: `lumora.config.js`

```javascript
module.exports = {
  // Expo-like configuration
  expo: {
    // Watch directories
    watch: ['web/src'],
    
    // Auto-convert on change
    autoConvert: true,
    
    // Auto-push to device
    autoPush: true,
    
    // Generate production code in background
    generateCode: true,
    
    // Port for Dev-Proxy
    port: 3000,
  },
  
  // Code generation options
  codegen: {
    outputDir: 'mobile/lib',
    adapter: 'bloc',
    generateTests: true,
  },
};
```

## Package Structure

```
packages/
├── lumora-cli/              # Main CLI (like expo-cli)
│   ├── src/
│   │   ├── commands/
│   │   │   ├── start.ts     # lumora start
│   │   │   ├── init.ts      # lumora init
│   │   │   └── install-client.ts
│   │   └── workflows/
│   │       └── expo-mode.ts
│   └── package.json
│
├── lumora-dev-proxy/        # Dev-Proxy as package
│   └── src/
│       └── index.ts
│
└── lumora-ir/               # IR system (already implemented!)
    └── src/
        └── sync/            # Bidirectional sync
```

## Comparison: Expo vs Lumora

| Feature | React Native Expo | Lumora |
|---------|------------------|--------|
| **Install Client** | Download Expo Go | Download Lumora Dev Client |
| **Start Command** | `expo start` | `lumora start` |
| **QR Code** | ✓ Automatic | ✓ Automatic |
| **File Watching** | ✓ Metro bundler | ✓ Chokidar |
| **Auto-Update** | ✓ Fast Refresh | ✓ Schema push |
| **Language** | JavaScript/TypeScript | React/TSX |
| **Output** | React Native | Native Flutter |
| **Performance** | Good (has bridge) | Excellent (no bridge) |
| **Production** | EAS Build | Flutter build |

## Implementation Checklist

- [ ] Create `lumora-cli` package
- [ ] Implement `lumora start` command
- [ ] Integrate Dev-Proxy into CLI
- [ ] Add automatic file watching
- [ ] Add automatic tsx2schema conversion
- [ ] Add automatic schema pushing
- [ ] Create unified QR code display
- [ ] Package Flutter Dev Client for stores
- [ ] Add `lumora install-client` command
- [ ] Create `lumora.config.js` support
- [ ] Add progress indicators
- [ ] Add error handling
- [ ] Write documentation

## Summary

**YES! We can make Lumora work exactly like Expo!** ✅

### What you get:
1. **One command**: `lumora start`
2. **Automatic everything**: File watching, conversion, pushing
3. **Flutter Dev Client**: Acts as "Expo Go" for Lumora
4. **Scan QR once**: Then just code!
5. **Instant updates**: Edit → Save → See on device
6. **No manual steps**: Everything automatic

### The workflow becomes:
```bash
# Install Flutter Dev Client once (like Expo Go)
$ lumora install-client

# Start Lumora (like expo start)
$ lumora start

# Scan QR code
[Scan with device]

# Edit code
$ vim web/src/App.tsx
[Edit and save]

# Device updates automatically!
✓ No manual commands
✓ No manual conversions
✓ No manual pushing
✓ Just code and see!
```

**This is the Expo experience for Flutter!** 🚀

Would you like me to start implementing this unified CLI system?