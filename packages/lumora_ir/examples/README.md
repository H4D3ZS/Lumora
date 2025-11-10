# Lumora IR Examples

This directory contains example projects demonstrating different Lumora IR development modes.

## Available Examples

### 1. [React-First Example](./react-first/)

Demonstrates React-first development where React is the source of truth and Flutter code is automatically generated.

**Best for:**
- Web-first teams adding mobile support
- Teams primarily using React
- Projects where web is the primary platform

**Key Features:**
- React components are editable
- Flutter widgets are auto-generated
- One-way sync: React → Flutter

[View Example →](./react-first/)

---

### 2. [Flutter-First Example](./flutter-first/)

Demonstrates Flutter-first development where Flutter is the source of truth and React code is automatically generated.

**Best for:**
- Mobile-first teams adding web support
- Teams primarily using Flutter
- Projects where mobile is the primary platform

**Key Features:**
- Flutter widgets are editable
- React components are auto-generated
- One-way sync: Flutter → React

[View Example →](./flutter-first/)

---

### 3. [Universal Mode Example](./universal/)

Demonstrates universal mode where both React and Flutter are editable with bidirectional synchronization and conflict resolution.

**Best for:**
- Mixed teams (React + Flutter developers)
- Projects where both platforms are equally important
- Teams wanting maximum flexibility

**Key Features:**
- Both React and Flutter are editable
- Bidirectional sync: React ↔ Flutter
- Automatic conflict detection and resolution

[View Example →](./universal/)

---

## Quick Comparison

| Feature | React-First | Flutter-First | Universal |
|---------|-------------|---------------|-----------|
| React Editable | ✅ | ❌ | ✅ |
| Flutter Editable | ❌ | ✅ | ✅ |
| Sync Direction | React → Flutter | Flutter → React | Both ways |
| Conflict Resolution | N/A | N/A | ✅ |
| Complexity | Low | Low | Medium |
| Team Size | Any | Any | Medium-Large |
| Best For | Web-first | Mobile-first | Mixed teams |

## Getting Started

### 1. Choose Your Mode

Pick the example that matches your team's workflow:

- **React-first**: Your team knows React, wants to add mobile
- **Flutter-first**: Your team knows Flutter, wants to add web
- **Universal**: Your team has both React and Flutter developers

### 2. Clone Example

```bash
# Clone the Lumora IR repository
git clone https://github.com/lumora/ir.git
cd ir/packages/lumora_ir/examples

# Navigate to your chosen example
cd react-first  # or flutter-first, or universal
```

### 3. Install Dependencies

```bash
# Install Node dependencies
npm install

# Install Flutter dependencies (if applicable)
flutter pub get
```

### 4. Start Development

Follow the README in each example directory for specific instructions.

## Example Projects

Each example includes a complete working application:

### React-First: Todo App

A simple todo list application demonstrating:
- State management (useState)
- Event handlers
- List rendering
- Conditional rendering

### Flutter-First: User Profile App

A user profile application demonstrating:
- StatefulWidget
- Form handling
- Image loading
- Navigation

### Universal: Chat App

A real-time chat application demonstrating:
- Bidirectional sync
- Conflict resolution
- Complex state management
- Real-time updates

## Learning Path

### Beginner

1. Start with **React-First** or **Flutter-First** (whichever you know)
2. Understand basic conversion concepts
3. Experiment with simple components
4. Review generated code

### Intermediate

1. Try the opposite mode (React-First → Flutter-First or vice versa)
2. Understand bidirectional conversion
3. Customize widget mappings
4. Work with state management

### Advanced

1. Try **Universal Mode**
2. Handle conflicts
3. Customize conversion behavior
4. Integrate with CI/CD

## Common Patterns

### State Management

All examples demonstrate state management conversion:

```typescript
// React
const [count, setCount] = useState(0);
```

```dart
// Flutter
int count = 0;
setState(() { count++; });
```

### Event Handlers

All examples show event handler conversion:

```typescript
// React
<button onClick={handleClick}>Click</button>
```

```dart
// Flutter
ElevatedButton(
  onPressed: handleClick,
  child: Text('Click'),
)
```

### Styling

All examples demonstrate styling conversion:

```typescript
// React
<div style={{ padding: 16, backgroundColor: '#fff' }}>
```

```dart
// Flutter
Container(
  padding: EdgeInsets.all(16),
  color: Colors.white,
)
```

## Customization

Each example can be customized:

### Widget Mappings

Add custom widget mappings in `widget-mappings.yaml`:

```yaml
mappings:
  - react: CustomButton
    flutter: MyButton
    props:
      label: text
      onClick: onPressed
```

### Configuration

Modify `lumora.yaml` to change behavior:

```yaml
version: 1.0.0
mode: universal
paths:
  react: ./src
  flutter: ./lib
stateManagement: bloc
```

### Styling

Configure styling preferences:

```yaml
styling:
  useStyledComponents: true
  cssModules: false
  scssSupport: true
```

## Testing

Each example includes tests:

```bash
# React tests
npm test

# Flutter tests
flutter test

# Integration tests
npm run test:integration
```

## Deployment

Each example can be deployed:

### React (Web)

```bash
npm run build
# Deploy build/ directory
```

### Flutter (Mobile)

```bash
# Android
flutter build apk

# iOS
flutter build ios
```

## Troubleshooting

### Example won't run

1. Check Node.js version: `node --version` (should be 16+)
2. Check Flutter version: `flutter --version` (should be 3.0+)
3. Clear caches: `npm cache clean --force && flutter clean`
4. Reinstall dependencies

### Conversion not working

1. Verify Lumora is installed: `lumora --version`
2. Check configuration: `lumora validate-config`
3. Review logs: `lumora logs`
4. Try manual conversion: `lumora convert <file>`

### Generated code has errors

1. Check source code for errors
2. Review conversion logs
3. Validate IR: `lumora validate-ir`
4. Report issue with reproduction steps

## Contributing

Want to add an example?

1. Fork the repository
2. Create a new example directory
3. Follow the existing structure
4. Add comprehensive README
5. Submit pull request

## Resources

### Documentation

- [Getting Started Guide](../GETTING_STARTED.md)
- [Conversion Guide](../CONVERSION_GUIDE.md)
- [API Reference](../API_REFERENCE.md)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)

### External Resources

- [React Documentation](https://react.dev)
- [Flutter Documentation](https://flutter.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Dart Documentation](https://dart.dev)

### Community

- [GitHub Discussions](https://github.com/lumora/ir/discussions)
- [Discord Server](https://discord.gg/lumora)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/lumora-ir)
- [Twitter](https://twitter.com/lumoraframework)

## FAQ

### Q: Which example should I start with?

**A**: Start with the mode that matches your primary framework (React-First if you know React, Flutter-First if you know Flutter).

### Q: Can I switch modes later?

**A**: Yes! You can change the `mode` in `lumora.yaml` at any time.

### Q: Do I need to know both React and Flutter?

**A**: No! That's the point of Lumora. You can work in one framework and Lumora handles the other.

### Q: Are these production-ready?

**A**: These are learning examples. For production, review and test generated code thoroughly.

### Q: Can I use these as templates?

**A**: Absolutely! Feel free to use these as starting points for your projects.

### Q: How do I report issues?

**A**: Create an issue on [GitHub](https://github.com/lumora/ir/issues) with reproduction steps.

## Next Steps

1. **Choose an example** that matches your workflow
2. **Follow the README** in that example directory
3. **Experiment** with the code
4. **Read the guides** to learn more
5. **Join the community** for support

Happy coding! 🚀

---

**Need Help?** Join our [Discord community](https://discord.gg/lumora) or check the [Troubleshooting Guide](../TROUBLESHOOTING.md).
