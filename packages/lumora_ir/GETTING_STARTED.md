# Getting Started with Lumora IR

Welcome to Lumora IR! This guide will help you get up and running with the Lumora Bidirectional Framework in minutes.

## Table of Contents

1. [What is Lumora IR?](#what-is-lumora-ir)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Your First Conversion](#your-first-conversion)
5. [Development Modes](#development-modes)
6. [Next Steps](#next-steps)

## What is Lumora IR?

Lumora IR (Intermediate Representation) is a framework-agnostic system that enables seamless conversion between React/TypeScript and Flutter/Dart. Write your UI in one framework and automatically generate code for the other.

### Key Features

- **Bidirectional Conversion**: Convert React ↔ Flutter seamlessly
- **Real-time Sync**: Watch mode for instant updates
- **State Management**: Preserves useState, StatefulWidget, and more
- **Type Safety**: Maintains TypeScript and Dart type information
- **Documentation**: Preserves JSDoc and dartdoc comments

### Use Cases

- **Cross-platform Development**: Write once, deploy to web and mobile
- **Team Collaboration**: React and Flutter developers working together
- **Migration**: Gradually migrate from one framework to another
- **Learning**: Understand framework equivalents

## Installation

### Prerequisites

- Node.js 16+ and npm/yarn
- For Flutter conversion: Flutter SDK 3.0+
- For React conversion: React 18+

### Install via npm

```bash
npm install -g @lumora/ir
```

### Install via yarn

```bash
yarn global add @lumora/ir
```

### Verify Installation

```bash
lumora --version
```

You should see the version number printed.

## Quick Start

### Initialize a New Project

```bash
# Create a new directory
mkdir my-lumora-app
cd my-lumora-app

# Initialize Lumora
lumora init

# Follow the prompts:
# - Choose development mode (react, flutter, or universal)
# - Select state management (bloc, riverpod, provider, getx)
# - Configure paths
```

This creates a `lumora.yaml` configuration file:

```yaml
version: 1.0.0
mode: universal
sourceFramework: react
paths:
  react: ./src
  flutter: ./lib
  ir: ./.lumora/ir
stateManagement: bloc
widgetMappings: ./widget-mappings.yaml
```

### Project Structure

After initialization, your project structure looks like this:

```
my-lumora-app/
├── .lumora/
│   ├── ir/              # IR storage
│   └── backups/         # File backups
├── src/                 # React source files
├── lib/                 # Flutter source files
├── lumora.yaml          # Configuration
└── widget-mappings.yaml # Custom widget mappings
```

## Your First Conversion

### Convert React to Flutter

Create a simple React component:

```typescript
// src/Button.tsx
import React from 'react';

interface ButtonProps {
  text: string;
  onPress: () => void;
}

export const Button: React.FC<ButtonProps> = ({ text, onPress }) => {
  return (
    <button onClick={onPress}>
      {text}
    </button>
  );
};
```

Convert it to Flutter:

```bash
lumora convert src/Button.tsx
```

This generates `lib/button.dart`:

```dart
// lib/button.dart
import 'package:flutter/material.dart';

class Button extends StatelessWidget {
  final String text;
  final VoidCallback onPress;

  const Button({
    Key? key,
    required this.text,
    required this.onPress,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPress,
      child: Text(text),
    );
  }
}
```

### Convert Flutter to React

Create a Flutter widget:

```dart
// lib/counter.dart
import 'package:flutter/material.dart';

class Counter extends StatefulWidget {
  const Counter({Key? key}) : super(key: key);

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int count = 0;

  void increment() {
    setState(() {
      count++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Count: $count'),
        ElevatedButton(
          onPressed: increment,
          child: Text('Increment'),
        ),
      ],
    );
  }
}
```

Convert it to React:

```bash
lumora convert lib/counter.dart
```

This generates `src/Counter.tsx`:

```typescript
// src/Counter.tsx
import React, { useState } from 'react';

export const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span>Count: {count}</span>
      <button onClick={increment}>
        Increment
      </button>
    </div>
  );
};
```

### Watch Mode

For continuous conversion during development:

```bash
# Watch React files
lumora convert src/App.tsx --watch

# Watch Flutter files
lumora convert lib/main.dart --watch
```

Now any changes to the source file will automatically trigger conversion.

## Development Modes

Lumora supports three development modes:

### React-First Mode

React is the source of truth, Flutter is generated.

```yaml
# lumora.yaml
mode: react
```

**Use when**:
- Your team primarily uses React
- Web is the primary platform
- Mobile is secondary

**Workflow**:
1. Edit React components
2. Flutter code auto-generates
3. Flutter files are read-only

### Flutter-First Mode

Flutter is the source of truth, React is generated.

```yaml
# lumora.yaml
mode: flutter
```

**Use when**:
- Your team primarily uses Flutter
- Mobile is the primary platform
- Web is secondary

**Workflow**:
1. Edit Flutter widgets
2. React code auto-generates
3. React files are read-only

### Universal Mode

Both frameworks are editable with conflict resolution.

```yaml
# lumora.yaml
mode: universal
```

**Use when**:
- Mixed team (React + Flutter developers)
- Both platforms are equally important
- Need flexibility

**Workflow**:
1. Edit either React or Flutter
2. Changes sync bidirectionally
3. Conflicts are detected and resolved

## Next Steps

### Learn More

- [Conversion Guide](./CONVERSION_GUIDE.md) - Detailed conversion examples
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Architecture](./ARCHITECTURE.md) - System architecture details
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

### Advanced Topics

- **Custom Widget Mappings**: Define your own widget conversions
- **State Management**: Work with Redux, Bloc, Riverpod, etc.
- **Styling**: Convert styles between frameworks
- **Navigation**: Handle routing and navigation
- **Testing**: Convert tests between frameworks

### Example Projects

Check out complete example projects:

```bash
# Clone examples
git clone https://github.com/lumora/examples.git
cd examples

# React-first example
cd react-first-example
npm install
lumora convert src/App.tsx --watch

# Flutter-first example
cd flutter-first-example
flutter pub get
lumora convert lib/main.dart --watch

# Universal mode example
cd universal-example
npm install && flutter pub get
lumora sync --watch
```

### Join the Community

- **GitHub**: [github.com/lumora/ir](https://github.com/lumora/ir)
- **Discord**: [discord.gg/lumora](https://discord.gg/lumora)
- **Twitter**: [@lumoraframework](https://twitter.com/lumoraframework)

### Get Help

If you run into issues:

1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Search [GitHub Issues](https://github.com/lumora/ir/issues)
3. Ask on [Discord](https://discord.gg/lumora)
4. Create a new issue with reproduction steps

## Common Commands

```bash
# Initialize project
lumora init

# Convert single file
lumora convert <file>

# Convert with watch mode
lumora convert <file> --watch

# Dry run (preview without writing)
lumora convert <file> --dry-run

# Start bidirectional sync
lumora sync --watch

# List stored IR
lumora list

# Show IR for a component
lumora show <component-id>

# Validate IR
lumora validate <ir-file>

# Get help
lumora --help
lumora convert --help
```

## Tips for Success

### Start Small

Begin with simple components and gradually move to complex ones:

1. Stateless components
2. Components with props
3. Components with state
4. Components with effects
5. Complex state management

### Use Watch Mode

Enable watch mode during development for instant feedback:

```bash
lumora convert src/App.tsx --watch
```

### Review Generated Code

Always review generated code before committing:

```bash
# Preview changes
lumora convert src/Button.tsx --dry-run

# Review diff
git diff lib/button.dart
```

### Customize Mappings

Create custom widget mappings for your design system:

```yaml
# widget-mappings.yaml
mappings:
  - react: MyButton
    flutter: CustomButton
    props:
      label: text
      onClick: onPressed
```

### Preserve Documentation

Add JSDoc/dartdoc comments - they're preserved during conversion:

```typescript
/**
 * A reusable button component
 * @param text - Button label
 * @param onPress - Click handler
 */
export const Button: React.FC<ButtonProps> = ({ text, onPress }) => {
  // ...
};
```

### Handle Conflicts Gracefully

In universal mode, conflicts will happen. Use the conflict resolver:

```bash
# When conflict detected
? Conflict detected in Button component. How to resolve?
  > Use React version
    Use Flutter version
    Manual merge
```

## What's Next?

Now that you have Lumora IR set up, you're ready to:

1. **Convert existing components** - Start with your component library
2. **Set up CI/CD** - Automate conversions in your pipeline
3. **Customize mappings** - Tailor conversions to your needs
4. **Explore advanced features** - State management, navigation, testing

Happy coding! 🚀

---

**Need Help?** Check out our [Troubleshooting Guide](./TROUBLESHOOTING.md) or join our [Discord community](https://discord.gg/lumora).
