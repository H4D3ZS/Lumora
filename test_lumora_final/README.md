# test_lumora_final

A Lumora project - True bidirectional React ↔ Flutter development!

## 🚀 Getting Started

1. Start development server:
   ```bash
   lumora start
   ```

2. **Web Preview**: Open http://localhost:3001 in your browser

3. **Mobile Preview**: Scan QR code with Lumora Dev Client

4. **Edit and Watch**:
   - Edit `src/App.tsx` → `lib/main.dart` updates automatically
   - Edit `lib/main.dart` → `src/App.tsx` updates automatically

## 📁 Project Structure

```
test_lumora_final/
├── src/              # React/TypeScript source (edit here)
│   ├── App.tsx       # Main app component
│   ├── components/   # Your React components
│   └── screens/      # Your app screens
├── lib/              # Flutter/Dart (auto-synced from src/)
│   ├── main.dart     # Auto-generated from src/App.tsx
│   ├── components/   # Auto-generated components
│   └── screens/      # Auto-generated screens
├── android/          # Android native code
├── ios/              # iOS native code
└── web/              # Web build output
```

## 🎯 Key Features

- ✅ **Bidirectional Sync**: React ↔ Flutter automatic conversion
- ✅ **Real-time Preview**: See changes instantly on web AND mobile
- ✅ **No Manual Commands**: Everything happens automatically
- ✅ **Native Performance**: True Flutter native, not WebView
- ✅ **Like Expo Go**: But for Flutter with React syntax

## 📝 Commands

- `lumora start` - Start development server (web + mobile)
- `lumora build` - Build production Flutter app

## 💡 How It Works

1. **Write React**: Edit `src/App.tsx` in your favorite editor
2. **Auto-Convert**: Lumora converts to Flutter/Dart automatically
3. **See Everywhere**: Updates appear on web browser AND mobile device
4. **Production Ready**: Generated Flutter code is production-ready

## 🔄 File Mapping

| React (src/)              | Flutter (lib/)              |
|---------------------------|----------------------------|
| `src/App.tsx`           | `lib/main.dart`          |
| `src/components/Button.tsx` | `lib/components/button.dart` |
| `src/screens/Home.tsx`  | `lib/screens/home.dart`  |

## 🎨 Supported Features

- ✅ Components & Widgets
- ✅ State Management (useState → StatefulWidget)
- ✅ Event Handlers
- ✅ Styling (inline styles → Flutter styling)
- ✅ Props & Parameters
- ✅ Lifecycle Methods

## 📚 Learn More

- [Lumora Documentation](https://lumora.dev)
- [Flutter Documentation](https://flutter.dev)
- [React Documentation](https://react.dev)

## 🙏 Credits

Built with ❤️ using Lumora Framework
