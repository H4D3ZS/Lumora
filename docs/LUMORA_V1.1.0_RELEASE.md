# Lumora v1.1.0 - Bidirectional Framework Release 🚀

## Published Successfully! ✅

**Date:** November 12, 2025  
**Packages Published:**
- `lumora-ir@1.1.0` ✅
- `lumora-cli@1.1.0` ✅

---

## 🎯 Major Features

### 1. **True Bidirectional Conversion**
- ✅ React → Flutter (automatic)
- ✅ Flutter → React (automatic)
- ✅ Real-time conversion on file save
- ✅ No manual commands needed!

### 2. **Expo Go-like Experience**
```bash
lumora start
```
**Automatically:**
- Starts Dev-Proxy on port 3000 (mobile WebSocket)
- Starts Web Preview on port 3001 (browser)
- Shows QR code for Flutter Dev Client
- Watches React files (`src/**/*.tsx`)
- Watches Flutter files (`lib/**/*.dart`)
- Updates BOTH web and mobile instantly!

### 3. **Flutter Dev Client Updates**
- ✅ Hidden debug banner (like Expo Go)
- ✅ Branded "Lumora Go" interface
- ✅ Clean, professional UI
- ✅ Dark mode support
- ✅ Hides app bar when showing rendered UI

### 4. **New Architecture Components**

#### Code Generators (NEW)
- `ReactGenerator`: IR → React/TSX
- `FlutterGenerator`: IR → Flutter/Dart
- Full component generation with state, events, lifecycle

#### Bidirectional Converter (NEW)
- Orchestrates React ↔ Flutter conversion
- Uses existing parsers + new generators
- Round-trip testing support

#### Web Preview Server (NEW)
- Serves React UI at `localhost:3001`
- Live updates via polling
- Works alongside Dev-Proxy

---

## 📦 Installation

```bash
npm install -g lumora-cli@1.1.0
```

Or update existing installation:
```bash
npm update -g lumora-cli
```

---

## 🚀 Quick Start

### Create New Project
```bash
lumora init my-app
cd my-app
```

### Start Development
```bash
lumora start
```

**What happens:**
1. Dev-Proxy starts on port 3000
2. Web preview starts on port 3001
3. QR code displays for mobile
4. File watchers activate
5. **Magic happens!** ✨

### View Your App
- **Web:** Open `http://localhost:3001` in browser
- **Mobile:** Scan QR code with Lumora Dev Client

### Edit Code
- **React devs:** Edit `src/App.tsx`
- **Flutter devs:** Edit `lib/main.dart`
- **Both:** See changes instantly on web AND mobile!

---

## 🔄 How It Works

### React Developer Workflow
```
Edit src/App.tsx
     ↓
Auto-parse to IR
     ↓
Push to Flutter mobile (native)
     ↓
Update React web (browser)
     ↓
Generate Flutter code (optional)
```

### Flutter Developer Workflow
```
Edit lib/main.dart
     ↓
Auto-parse to IR
     ↓
Push to Flutter mobile (native)
     ↓
Update React web (browser)
     ↓
Generate React code (optional)
```

---

## 🎨 Features

### Automatic Conversion
- ✅ No manual commands
- ✅ File watching with `chokidar`
- ✅ Debounced updates
- ✅ Error recovery

### Dual Preview
- ✅ Web browser preview (React)
- ✅ Mobile device preview (Flutter native)
- ✅ Both update in real-time
- ✅ QR code connection

### Code Generation
- ✅ Optional production code generation
- ✅ React → Flutter/Dart
- ✅ Flutter → React/TSX
- ✅ Preserves types and structure

### Developer Experience
- ✅ Like Expo Go but for Flutter
- ✅ Clean, professional UI
- ✅ No debug banners
- ✅ Dark mode support
- ✅ Instant feedback

---

## 📝 What's New in v1.1.0

### Added
- ✅ Bidirectional code generators (React ↔ Flutter)
- ✅ Web preview server for browser viewing
- ✅ Automatic file watching and conversion
- ✅ Enhanced Flutter Dev Client UI
- ✅ Dark mode support
- ✅ Improved error handling

### Changed
- ✅ Removed manual `convert` commands (now automatic)
- ✅ Updated start command for bidirectional support
- ✅ Enhanced CLI output and instructions
- ✅ Improved package structure

### Fixed
- ✅ TypeScript compilation errors
- ✅ Missing exports in lumora-ir
- ✅ Error handler method calls
- ✅ Metadata property references

---

## 🔧 Technical Details

### Architecture
```
React/TSX ←→ Lumora IR ←→ Flutter/Dart
    ↓              ↓              ↓
React Web    Universal    Flutter Mobile
(Browser)    Format       (Native)
```

### Components
1. **ReactParser**: React/TSX → IR
2. **DartParser**: Flutter/Dart → IR
3. **ReactGenerator**: IR → React/TSX (NEW)
4. **FlutterGenerator**: IR → Flutter/Dart (NEW)
5. **BidirectionalConverter**: Orchestrates conversion (NEW)
6. **WebPreviewServer**: Serves React UI (NEW)
7. **DevProxyServer**: WebSocket for mobile (existing)

### File Structure
```
my-app/
├── src/              # React source
│   └── App.tsx
├── lib/              # Flutter source
│   └── main.dart
├── public/           # Static assets
└── lumora.yaml       # Configuration
```

---

## 📚 Documentation

### Commands
```bash
lumora init <project-name>    # Create new project
lumora start                  # Start dev server
lumora build                  # Build production app
```

### Options
```bash
lumora start --port 3000      # Custom port
lumora start --mode react     # React-first mode
lumora start --mode flutter   # Flutter-first mode
lumora start --mode universal # Both (default)
lumora start --no-qr          # Disable QR code
lumora start --no-watch       # Disable file watching
lumora start --no-codegen     # Disable code generation
```

---

## 🎯 Use Cases

### 1. React Developer Building Mobile App
- Write React/TypeScript
- See on Flutter mobile (native)
- See on React web (browser)
- No Flutter knowledge needed!

### 2. Flutter Developer Building Web App
- Write Flutter/Dart
- See on React web (browser)
- See on Flutter mobile (native)
- No React knowledge needed!

### 3. Mixed Team
- React devs write React
- Flutter devs write Flutter
- Everything syncs automatically
- Best of both worlds!

---

## 🚦 Next Steps

### For Users
1. Install: `npm install -g lumora-cli@1.1.0`
2. Create project: `lumora init my-app`
3. Start developing: `lumora start`
4. Edit code and watch the magic!

### For Contributors
1. Clone repo
2. Install dependencies: `npm install`
3. Build packages: `npm run build`
4. Test locally: `npm link`

---

## 🐛 Known Issues

None reported yet! This is a fresh release.

---

## 🙏 Credits

Built with ❤️ by the Lumora team for the Kiro AI Hackathon 2025.

**Technologies:**
- React & TypeScript
- Flutter & Dart
- Babel (AST parsing)
- WebSocket (real-time communication)
- Express (web server)
- Chokidar (file watching)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🔗 Links

- **NPM:** https://www.npmjs.com/package/lumora-cli
- **GitHub:** https://github.com/lumora/lumora
- **Documentation:** Coming soon!

---

## 🎉 Conclusion

Lumora v1.1.0 brings true bidirectional development to mobile and web. Write in your preferred language, see results everywhere, instantly!

**No compromises. No manual commands. Just pure development magic.** ✨

---

**Published:** November 12, 2025  
**Version:** 1.1.0  
**Status:** Production Ready 🚀
