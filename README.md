# Lumora

Mobile-first Flutter development framework that enables developers to author UI in React+TypeScript/TSX and preview instantly on native Flutter clients via QR code and live synchronization.

## Why Lumora?

Lumora bridges the gap between web development speed and native mobile performance. Write your UI in familiar React/TSX, see changes instantly on your device, and generate production-ready Flutter code with proper state management.

**Two Runtime Modes:**
- **Fast Path**: JSON UI schemas interpreted at runtime for instant preview during development
- **Native Path**: Deterministic TSX to Dart codegen for production-quality Flutter apps

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the Dev-Proxy server
npm run dev-proxy

# 3. In a new terminal, run the Flutter client
cd apps/flutter-dev-client && flutter run

# 4. Scan the QR code displayed in the Dev-Proxy terminal
```

That's it! Your device is now connected and ready to receive live UI updates.

## What to Build First

Start with one of our example applications:

- **Todo App** (`examples/todo-app`) - Simple task management UI
- **Chat App** (`examples/chat-app`) - Real-time messaging interface

Or create your own:

```bash
cd tools/codegen
npm start create-app my-app --adapter=bloc
```

## Project Structure

```
lumora/
├── apps/
│   └── flutter-dev-client/     # Native Flutter client for live preview
├── tools/
│   ├── dev-proxy/              # WebSocket server for session management
│   └── codegen/                # TSX to schema and Dart code generator
├── packages/
│   ├── kiro_core/              # Core schema interpretation engine
│   └── kiro_ui_tokens/         # Design tokens (colors, typography, spacing)
├── examples/
│   ├── todo-app/               # Example todo application
│   └── chat-app/               # Example chat application
└── docs/                       # Additional documentation
```

## Components

### Dev-Proxy
Node.js server that manages development sessions, generates QR codes, and brokers WebSocket connections between editors and Flutter clients.

[Read more →](tools/dev-proxy/README.md)

### Flutter-Dev-Client
Native Flutter application that connects to Dev-Proxy, receives JSON UI schemas, and renders them as native widgets in real-time.

[Read more →](apps/flutter-dev-client/README.md)

### Codegen-Tool
Command-line tool that converts React TSX files to JSON UI schemas and generates production Dart code with state management.

[Read more →](tools/codegen/README.md)

## Documentation

- [Framework Specification](FRAMEWORK_SPEC.md) - Architecture and technical details
- [Mobile-First Guide](MOBILE_FIRST_GUIDE.md) - iOS and Android build configuration
- [State Management](STATE_MANAGEMENT.md) - Choosing the right adapter for your project
- [Submission Checklist](SUBMISSION_CHECKLIST.md) - Hackathon preparation guide

## Supported Primitives

- **View** - Container with padding, margin, and background
- **Text** - Text with styling and alignment
- **Button** - Interactive button with tap handlers
- **List** - Scrollable list with lazy rendering
- **Image** - Network images with caching
- **Input** - Text input fields

## State Management Adapters

Choose the pattern that fits your project:

- **Bloc** - Structured, testable, ideal for medium-large projects
- **Riverpod** - Modern, modular, great for scalability
- **Provider** - Simple, lightweight, perfect for small projects
- **GetX** - Minimal boilerplate, fast development

## Requirements

- Node.js >= 16.0.0
- Flutter >= 3.0.0
- Dart >= 3.0.0
- iOS 12.0+ or Android API 21+

## License

MIT License - see [LICENSE](LICENSE) for details

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.
