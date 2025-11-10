# @lumora/cli

Lumora CLI - Expo-like development experience for Flutter

## Installation

```bash
npm install -g @lumora/cli
```

## Quick Start

```bash
# Create new project
lumora init my-app

# Start development server
cd my-app
lumora start

# Scan QR code with Lumora Dev Client
# Edit code and see changes instantly!
```

## Commands

### `lumora start`

Start the Lumora development server with automatic updates.

```bash
lumora start [options]

Options:
  -p, --port <port>     Port for Dev-Proxy server (default: 3000)
  -m, --mode <mode>     Development mode: react, flutter, or universal (default: universal)
  --no-qr               Disable QR code display
  --no-watch            Disable file watching
  --no-codegen          Disable automatic code generation
  --web-only            Only start web server (no mobile)
```

**What it does:**
- Starts Dev-Proxy server
- Displays QR code for mobile connection
- Watches your code for changes
- Auto-converts TSX → JSON schema
- Auto-pushes to connected devices
- Generates production Dart code (optional)
- Converts tests automatically (optional)

**Example:**
```bash
# Start with default settings
lumora start

# Start on custom port
lumora start --port 8080

# Start in React-first mode
lumora start --mode react

# Start without code generation
lumora start --no-codegen
```

### `lumora init`

Create a new Lumora project.

```bash
lumora init <project-name> [options]

Options:
  -t, --template <template>  Project template (default: default)
```

**Example:**
```bash
lumora init my-awesome-app
cd my-awesome-app
npm install
lumora start
```

### `lumora build`

Build production Flutter app.

```bash
lumora build [options]

Options:
  --platform <platform>  Platform: android, ios, or both (default: both)
  --release              Build release version (default: true)
```

**Example:**
```bash
# Build for both platforms
lumora build

# Build Android only
lumora build --platform android

# Build iOS only
lumora build --platform ios
```

## Configuration

Create a `lumora.config.js` file in your project root:

```javascript
module.exports = {
  // Watch directory
  watchDir: 'web/src',
  
  // React source directory
  reactDir: 'web/src',
  
  // Flutter output directory
  flutterDir: 'mobile/lib',
  
  // IR storage directory
  storageDir: '.lumora/ir',
  
  // Dev-Proxy port
  port: 3000,
  
  // Development mode
  mode: 'universal', // 'react', 'flutter', or 'universal'
  
  // Auto-convert on file change
  autoConvert: true,
  
  // Auto-push to device
  autoPush: true,
  
  // Generate production code
  generateCode: true,
};
```

## Workflow

### Development Workflow (Expo-like)

```bash
# 1. Start Lumora
$ lumora start

🚀 Starting Lumora...

✓ Dev-Proxy started on http://localhost:3000
✓ Watching: web/src

┌────────────────────────────────────┐
│  █▀▀▀▀▀█ ▀▀█▄ ▀ ▄▀█ █▀▀▀▀▀█        │
│  █ ███ █ ▄▀▀█▀▄█▀  █ ███ █        │
│  █ ▀▀▀ █ █▀ ▀▄ ▀█▄ █ ▀▀▀ █        │
│  ▀▀▀▀▀▀▀ █▄▀ ▀ █ ▀ ▀▀▀▀▀▀▀        │
│  Scan with Lumora Dev Client       │
└────────────────────────────────────┘

Ready! Edit your code and watch the magic happen! ✨

# 2. Scan QR code with Lumora Dev Client

# 3. Edit your code
$ vim web/src/App.tsx

# 4. Save file (Ctrl+S)

# 5. Device updates automatically!
[12:34:56] 📝 File changed: App.tsx
  ✓ Schema generated
  ✓ Pushed to device
  ⚡ Update completed in 234ms
```

### Production Workflow

```bash
# Generate production Dart code
$ lumora start --mode universal

# Code is automatically generated in mobile/lib/

# Build production app
$ lumora build

# Deploy to app stores
$ cd mobile
$ flutter build apk --release  # Android
$ flutter build ios --release  # iOS
```

## Features

### ✅ Automatic Everything
- File watching
- TSX → Schema conversion
- Schema → Device pushing
- Production code generation
- Test conversion

### ✅ Expo-like Experience
- One command to start
- QR code connection
- Instant updates
- No manual steps

### ✅ Native Performance
- Real Flutter widgets
- No JavaScript bridge
- 60fps rendering
- Full native APIs

### ✅ Bidirectional Sync
- Write React or Flutter
- Auto-sync between frameworks
- Tests convert automatically
- Production-ready code

## Comparison with Expo

| Feature | React Native Expo | Lumora |
|---------|------------------|--------|
| **Start Command** | `expo start` | `lumora start` |
| **Client App** | Expo Go | Lumora Dev Client |
| **QR Code** | ✓ | ✓ |
| **Auto-Update** | ✓ Fast Refresh | ✓ Schema Push |
| **Language** | JavaScript/TS | React/TSX |
| **Output** | React Native | Native Flutter |
| **Performance** | Good | Excellent |
| **Bridge** | Yes | No |

## Requirements

- Node.js 16+
- Flutter 3.x (for production builds)
- Lumora Dev Client (mobile app)

## Troubleshooting

### Device not connecting

1. Ensure device and computer are on same network
2. Check firewall settings
3. Try restarting Dev-Proxy: `lumora start`

### Changes not updating

1. Check file watcher is running
2. Verify file is in watch directory
3. Check Dev-Proxy logs for errors

### Build fails

1. Ensure Flutter is installed: `flutter doctor`
2. Check mobile/lib directory exists
3. Run `flutter pub get` in mobile directory

## Learn More

- [Lumora Documentation](https://lumora.dev)
- [GitHub Repository](https://github.com/lumora/lumora)
- [Examples](https://github.com/lumora/examples)

## License

MIT
