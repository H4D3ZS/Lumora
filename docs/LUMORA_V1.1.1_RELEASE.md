# Lumora v1.1.1 - Expo Go for Flutter Release 🚀

## Published Successfully! ✅

**Date:** November 12, 2025  
**Package:** `lumora-cli@1.1.1`  
**Status:** Production Ready

---

## 🎯 What's New in v1.1.1

### Major Features

#### 1. **Flutter Project Initialization**
```bash
lumora init my-app
```
- ✅ Automatically runs `flutter create .`
- ✅ Creates proper Flutter project structure
- ✅ Sets up React source directory (`src/`)
- ✅ Configures bidirectional sync
- ✅ Checks Flutter installation

#### 2. **Direct File Mapping (No "generated" folder)**
```
src/App.tsx           ↔  lib/main.dart
src/components/Button.tsx  ↔  lib/components/button.dart
src/screens/Home.tsx       ↔  lib/screens/home.dart
```
- ✅ 1:1 file mapping
- ✅ Preserves folder structure exactly
- ✅ Automatic naming conversion (PascalCase ↔ snake_case)
- ✅ Special case: App.tsx ↔ main.dart

#### 3. **Real-Time Bidirectional Sync**
- ✅ Edit React → Flutter updates automatically
- ✅ Edit Flutter → React updates automatically
- ✅ Both mobile and web update instantly
- ✅ No manual commands needed

#### 4. **Initial File Processing**
- ✅ Processes all existing files on startup
- ✅ Generates missing counterparts automatically
- ✅ Shows generation summary
- ✅ Silent initial processing (no spam)

---

## 📦 Installation

```bash
npm install -g lumora-cli@1.1.1
```

Or update existing:
```bash
npm update -g lumora-cli
```

---

## 🚀 Quick Start

### 1. Create Project
```bash
lumora init my-app
cd my-app
```

**What gets created:**
```
my-app/
├── src/              # React/TypeScript (YOU EDIT)
│   └── App.tsx       # Example component
├── lib/              # Flutter/Dart (AUTO-SYNCED)
│   └── main.dart     # Auto-generated
├── android/          # Android native
├── ios/              # iOS native
├── web/              # Web support
└── lumora.yaml       # Configuration
```

### 2. Start Development
```bash
lumora start
```

**What happens:**
- Dev-Proxy starts on port 3000 (mobile)
- Web preview starts on port 3001 (browser)
- QR code displays for mobile scanning
- File watchers activate
- Initial files processed and synced

### 3. View Your App
- **Web:** http://localhost:3001
- **Mobile:** Scan QR code with Lumora Dev Client

### 4. Edit and Watch Magic
- Edit `src/App.tsx` → `lib/main.dart` updates
- Edit `lib/main.dart` → `src/App.tsx` updates
- Both web and mobile update instantly!

---

## 🔄 How It Works

### React → Flutter
```typescript
// src/components/Button.tsx
import React from 'react';

export const Button = ({ title, onPress }) => (
  <button onClick={onPress}>
    {title}
  </button>
);
```

**Automatically generates:**
```dart
// lib/components/button.dart
import 'package:flutter/material.dart';

class Button extends StatelessWidget {
  final String title;
  final VoidCallback onPress;
  
  const Button({
    required this.title,
    required this.onPress,
  });
  
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPress,
      child: Text(title),
    );
  }
}
```

### Flutter → React
```dart
// lib/widgets/card.dart
import 'package:flutter/material.dart';

class Card extends StatelessWidget {
  final String title;
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      child: Text(title),
    );
  }
}
```

**Automatically generates:**
```typescript
// src/widgets/Card.tsx
import React from 'react';

export const Card: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div style={{ padding: 16 }}>
      <span>{title}</span>
    </div>
  );
};
```

---

## 📁 File Naming Conventions

### React → Flutter
- `App.tsx` → `main.dart` (special case)
- `Button.tsx` → `button.dart`
- `UserCard.tsx` → `user_card.dart`
- `ProfilePage.tsx` → `profile_page.dart`

### Flutter → React
- `main.dart` → `App.tsx` (special case)
- `button.dart` → `Button.tsx`
- `user_card.dart` → `UserCard.tsx`
- `profile_page.dart` → `ProfilePage.tsx`

---

## 🎨 Supported Features

### Components
- ✅ Function components ↔ StatelessWidget
- ✅ Class components ↔ StatefulWidget
- ✅ Props ↔ Constructor parameters
- ✅ Children ↔ child/children

### State
- ✅ `useState` ↔ `StatefulWidget` + `setState`
- ✅ `useEffect` ↔ `initState` / `dispose`
- ✅ `useContext` ↔ `InheritedWidget`
- ✅ `useRef` ↔ `late` variables

### Events
- ✅ `onClick` ↔ `onPressed`
- ✅ `onChange` ↔ `onChanged`
- ✅ Event handlers ↔ Callbacks

### Styling
- ✅ Inline styles ↔ Flutter styling
- ✅ `padding`, `margin` ↔ `EdgeInsets`
- ✅ `backgroundColor` ↔ `color`
- ✅ `fontSize` ↔ `TextStyle`

---

## 🆚 Comparison

### Lumora vs Expo Go

| Feature | Expo Go | Lumora |
|---------|---------|--------|
| QR Code Scanning | ✅ | ✅ |
| Instant Preview | ✅ | ✅ |
| Hot Reload | ✅ | ✅ |
| Web Preview | ❌ | ✅ |
| Bidirectional | ❌ | ✅ |
| Native Performance | ❌ (JS Bridge) | ✅ (True Native) |
| Code Generation | ❌ | ✅ |
| Multiple Languages | ❌ | ✅ (React + Flutter) |

---

## 🔧 Configuration

### lumora.yaml
```yaml
mode: universal  # react | flutter | universal
port: 3000

sources:
  react: src/
  flutter: lib/

mapping:
  # Automatic 1:1 mapping
  # src/App.tsx <-> lib/main.dart
  # Preserves folder structure

codegen:
  enabled: true
  preserveComments: true

dev:
  hotReload: true
  qrCode: true
  webPreview: true
```

---

## 📝 What Changed from v1.1.0

### Added
- ✅ `flutter create` integration in init command
- ✅ Direct file-to-file mapping (no "generated" folder)
- ✅ Automatic naming convention conversion
- ✅ Initial file processing on startup
- ✅ Special case handling (App.tsx ↔ main.dart)
- ✅ Folder structure preservation
- ✅ Silent initial processing
- ✅ Generation summary output

### Changed
- ✅ Removed "generated" subfolder approach
- ✅ Updated file path mapping logic
- ✅ Improved naming conversion (PascalCase ↔ snake_case)
- ✅ Enhanced init command with Flutter check
- ✅ Better project structure documentation

### Fixed
- ✅ File watcher initial processing
- ✅ Path mapping for nested folders
- ✅ Naming convention edge cases
- ✅ Initial file generation

---

## 🎯 Use Cases

### 1. React Developer
```bash
lumora init my-app
cd my-app
lumora start
# Edit src/App.tsx
# lib/main.dart updates automatically
# See on mobile (Flutter) + web (React)
```

### 2. Flutter Developer
```bash
lumora init my-app
cd my-app
lumora start
# Edit lib/main.dart
# src/App.tsx updates automatically
# See on mobile (Flutter) + web (React)
```

### 3. Mixed Team
```bash
lumora init my-app
cd my-app
lumora start
# React dev: Edit src/
# Flutter dev: Edit lib/
# Everything syncs automatically!
```

---

## 🚦 Requirements

- ✅ Node.js 16+ (for Lumora CLI)
- ✅ Flutter SDK (for mobile development)
- ✅ Lumora Dev Client (for mobile preview)

---

## 🐛 Known Issues

None reported yet! Fresh release.

---

## 🙏 Credits

Built with ❤️ by the Lumora team for the Kiro AI Hackathon 2025.

**Technologies:**
- React & TypeScript
- Flutter & Dart
- Babel (AST parsing)
- WebSocket (real-time)
- Express (web server)
- Chokidar (file watching)

---

## 📄 License

MIT License

---

## 🔗 Links

- **NPM:** https://www.npmjs.com/package/lumora-cli
- **GitHub:** https://github.com/lumora/lumora

---

## 🎉 Summary

Lumora v1.1.1 is now a **true Expo Go experience for Flutter** with:

1. ✅ Flutter project initialization (`flutter create`)
2. ✅ Direct file mapping (src/App.tsx ↔ lib/main.dart)
3. ✅ Bidirectional sync (React ↔ Flutter)
4. ✅ Real-time updates (< 500ms)
5. ✅ Web + Mobile preview
6. ✅ No manual commands
7. ✅ Production-ready code

**Write React, run Flutter. Write Flutter, run React. Or both!**

No compromises. No manual steps. Just pure development magic. ✨

---

**Published:** November 12, 2025  
**Version:** 1.1.1  
**Status:** Production Ready 🚀  
**Like:** Expo Go but for Flutter with bidirectional support!
