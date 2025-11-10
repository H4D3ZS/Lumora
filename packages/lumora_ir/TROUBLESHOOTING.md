# Lumora IR Troubleshooting Guide

This guide helps you diagnose and fix common issues with Lumora IR.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Conversion Errors](#conversion-errors)
3. [Sync Problems](#sync-problems)
4. [Performance Issues](#performance-issues)
5. [Generated Code Issues](#generated-code-issues)
6. [Configuration Problems](#configuration-problems)
7. [Platform-Specific Issues](#platform-specific-issues)
8. [Getting Help](#getting-help)

## Installation Issues

### npm install fails

**Symptom**: Error during `npm install -g @lumora/ir`

**Solutions**:

1. **Check Node.js version**:
```bash
node --version  # Should be 16.0.0 or higher
```

2. **Clear npm cache**:
```bash
npm cache clean --force
npm install -g @lumora/ir
```

3. **Use sudo (macOS/Linux)**:
```bash
sudo npm install -g @lumora/ir
```

4. **Check permissions**:
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Command not found: lumora

**Symptom**: `lumora: command not found` after installation

**Solutions**:

1. **Check global bin path**:
```bash
npm config get prefix
# Add this path to your PATH environment variable
```

2. **Reinstall globally**:
```bash
npm uninstall -g @lumora/ir
npm install -g @lumora/ir
```

3. **Use npx**:
```bash
npx @lumora/ir convert src/App.tsx
```

### Flutter SDK not found

**Symptom**: Error about missing Flutter SDK

**Solutions**:

1. **Install Flutter**:
```bash
# macOS
brew install flutter

# Or download from https://flutter.dev
```

2. **Add Flutter to PATH**:
```bash
export PATH="$PATH:`pwd`/flutter/bin"
```

3. **Verify installation**:
```bash
flutter doctor
```

## Conversion Errors

### Parse Error: Unexpected token

**Symptom**: 
```
ParseError: Unexpected token (10:5)
  8 | export const Button = () => {
  9 |   return (
> 10 |     <button>
     |     ^
```

**Solutions**:

1. **Check syntax**:
   - Ensure JSX/TSX syntax is valid
   - Check for unclosed tags
   - Verify proper imports

2. **Update parser**:
```bash
npm update @lumora/ir
```

3. **Check file extension**:
   - Use `.tsx` for TypeScript with JSX
   - Use `.jsx` for JavaScript with JSX

### Validation Error: Invalid IR structure

**Symptom**:
```
ValidationError: IR validation failed
  - nodes[0].type: must be string
  - nodes[0].props: must be object
```

**Solutions**:

1. **Check component structure**:
```typescript
// ✅ Valid
export const Component = () => <div>Content</div>;

// ❌ Invalid
export const Component = () => null;
```

2. **Validate manually**:
```bash
lumora validate .lumora/ir/component-name/v1.json
```

3. **Clear IR cache**:
```bash
rm -rf .lumora/ir
lumora convert src/App.tsx
```

### Type Error: Cannot convert type

**Symptom**:
```
TypeError: Cannot convert type 'CustomType' to Dart
```

**Solutions**:

1. **Add type mapping**:
```yaml
# lumora.yaml
typeMappings:
  CustomType: MyDartType
```

2. **Use standard types**:
```typescript
// ✅ Use standard types
interface Props {
  count: number;
  name: string;
}

// ❌ Avoid complex types
interface Props {
  data: Map<string, Set<CustomType>>;
}
```

3. **Simplify types**:
```typescript
// Before
type ComplexType = A & B | C;

// After
interface SimpleType {
  fieldA: string;
  fieldB: number;
}
```

### Widget Not Found Error

**Symptom**:
```
Error: No mapping found for widget 'CustomButton'
```

**Solutions**:

1. **Add custom mapping**:
```yaml
# widget-mappings.yaml
mappings:
  - react: CustomButton
    flutter: MyButton
    props:
      label: text
```

2. **Use standard widgets**:
```typescript
// ✅ Use standard widgets
<button>Click</button>

// ❌ Avoid unmapped custom widgets
<CustomButton>Click</CustomButton>
```

3. **Check widget registry**:
```bash
lumora list-widgets
```

## Sync Problems

### Files not syncing

**Symptom**: Changes in React don't appear in Flutter (or vice versa)

**Solutions**:

1. **Check watch mode**:
```bash
# Ensure watch mode is running
lumora convert src/App.tsx --watch
```

2. **Verify file paths**:
```yaml
# lumora.yaml
paths:
  react: ./src      # Check this path
  flutter: ./lib    # Check this path
```

3. **Check file permissions**:
```bash
ls -la src/
ls -la lib/
```

4. **Restart watcher**:
```bash
# Stop current watcher (Ctrl+C)
# Start again
lumora convert src/App.tsx --watch
```

### Sync lag/delay

**Symptom**: Changes take several seconds to sync

**Solutions**:

1. **Check debounce settings**:
```yaml
# lumora.yaml
sync:
  debounceMs: 300  # Reduce for faster sync
```

2. **Reduce file size**:
   - Split large components
   - Remove unused code
   - Optimize imports

3. **Check system resources**:
```bash
# Monitor CPU/memory
top
```

### Conflict detection not working

**Symptom**: Conflicts not detected when both files change

**Solutions**:

1. **Enable universal mode**:
```yaml
# lumora.yaml
mode: universal  # Not 'react' or 'flutter'
```

2. **Check timestamps**:
```bash
# Verify file modification times
ls -la src/Button.tsx lib/button.dart
```

3. **Clear conflict cache**:
```bash
rm -rf .lumora/conflicts
```

## Performance Issues

### Slow conversion

**Symptom**: Conversion takes more than 5 seconds

**Solutions**:

1. **Enable caching**:
```yaml
# lumora.yaml
cache:
  enabled: true
  maxSize: 100MB
```

2. **Use incremental mode**:
```bash
lumora convert src/ --incremental
```

3. **Exclude unnecessary files**:
```yaml
# lumora.yaml
exclude:
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/node_modules/**"
```

4. **Check component complexity**:
```bash
# Analyze component
lumora analyze src/ComplexComponent.tsx
```

### High memory usage

**Symptom**: Process uses excessive memory

**Solutions**:

1. **Limit concurrent conversions**:
```yaml
# lumora.yaml
performance:
  maxConcurrent: 4
```

2. **Clear cache periodically**:
```bash
lumora cache clear
```

3. **Process files in batches**:
```bash
# Instead of converting entire directory
lumora convert src/components/*.tsx
```

### Watch mode CPU usage

**Symptom**: High CPU usage in watch mode

**Solutions**:

1. **Increase debounce**:
```yaml
# lumora.yaml
sync:
  debounceMs: 1000  # Wait longer between syncs
```

2. **Exclude large directories**:
```yaml
# lumora.yaml
watch:
  ignore:
    - "**/node_modules/**"
    - "**/build/**"
    - "**/.git/**"
```

3. **Use polling instead of native**:
```yaml
# lumora.yaml
watch:
  usePolling: true
  interval: 1000
```

## Generated Code Issues

### Generated code doesn't compile

**Symptom**: Flutter/React code has compilation errors

**Solutions**:

1. **Check for syntax errors**:
```bash
# Flutter
cd lib && flutter analyze

# React
cd src && npm run lint
```

2. **Review generated code**:
```bash
# Preview before writing
lumora convert src/Button.tsx --dry-run
```

3. **Add missing imports**:
```yaml
# lumora.yaml
generation:
  autoImport: true
```

4. **Format generated code**:
```bash
# Flutter
dart format lib/

# React
npx prettier --write src/
```

### Generated code style issues

**Symptom**: Generated code doesn't match project style

**Solutions**:

1. **Configure formatting**:
```yaml
# lumora.yaml
formatting:
  indent: 2
  semicolons: true
  trailingComma: true
```

2. **Use project formatter**:
```bash
# After generation
npm run format
flutter format .
```

3. **Add custom templates**:
```yaml
# lumora.yaml
templates:
  react: ./templates/react-component.hbs
  flutter: ./templates/flutter-widget.hbs
```

### Missing functionality

**Symptom**: Some features don't convert properly

**Solutions**:

1. **Check compatibility**:
```bash
lumora check-compatibility src/Component.tsx
```

2. **Use supported patterns**:
   - Refer to [Conversion Guide](./CONVERSION_GUIDE.md)
   - Check supported features list

3. **Manual implementation**:
   - Convert what's possible
   - Manually implement unsupported features
   - Document workarounds

## Configuration Problems

### lumora.yaml not found

**Symptom**: `Error: Configuration file not found`

**Solutions**:

1. **Initialize project**:
```bash
lumora init
```

2. **Create manually**:
```yaml
# lumora.yaml
version: 1.0.0
mode: universal
paths:
  react: ./src
  flutter: ./lib
  ir: ./.lumora/ir
```

3. **Specify config path**:
```bash
lumora convert src/App.tsx --config ./custom-config.yaml
```

### Invalid configuration

**Symptom**: `Error: Invalid configuration`

**Solutions**:

1. **Validate config**:
```bash
lumora validate-config lumora.yaml
```

2. **Check YAML syntax**:
```bash
# Use online YAML validator
# or
npm install -g js-yaml
js-yaml lumora.yaml
```

3. **Use default config**:
```bash
lumora init --force  # Overwrites existing config
```

### Widget mappings not loading

**Symptom**: Custom widget mappings ignored

**Solutions**:

1. **Check file path**:
```yaml
# lumora.yaml
widgetMappings: ./widget-mappings.yaml  # Verify path
```

2. **Validate mappings file**:
```bash
lumora validate-mappings widget-mappings.yaml
```

3. **Check YAML format**:
```yaml
# widget-mappings.yaml
mappings:
  - react: CustomButton
    flutter: MyButton
    props:
      label: text
      onClick: onPressed
```

## Platform-Specific Issues

### macOS: Permission denied

**Symptom**: `EACCES: permission denied`

**Solutions**:

1. **Fix npm permissions**:
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

2. **Use nvm**:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
npm install -g @lumora/ir
```

### Windows: Path too long

**Symptom**: `ENAMETOOLONG: name too long`

**Solutions**:

1. **Enable long paths**:
```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

2. **Shorten project path**:
```bash
# Move project closer to root
C:\projects\my-app
```

3. **Use WSL**:
```bash
# Install WSL and use Linux environment
wsl
npm install -g @lumora/ir
```

### Linux: inotify limit

**Symptom**: `ENOSPC: System limit for number of file watchers reached`

**Solutions**:

1. **Increase limit**:
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

2. **Use polling**:
```yaml
# lumora.yaml
watch:
  usePolling: true
```

## Common Error Messages

### "Cannot find module '@lumora/ir'"

**Cause**: Package not installed or not in PATH

**Solution**:
```bash
npm install -g @lumora/ir
# or
npm install @lumora/ir --save-dev
```

### "IR version mismatch"

**Cause**: Stored IR uses different schema version

**Solution**:
```bash
# Migrate IR
lumora migrate .lumora/ir/

# Or regenerate
rm -rf .lumora/ir
lumora convert src/
```

### "Circular dependency detected"

**Cause**: Components import each other

**Solution**:
```typescript
// Break circular dependency
// Use dependency injection or restructure
```

### "Maximum call stack size exceeded"

**Cause**: Deeply nested components or infinite recursion

**Solution**:
```typescript
// Reduce nesting depth
// Check for recursive components
```

## Debugging Tips

### Enable verbose logging

```bash
lumora convert src/App.tsx --verbose
```

### Check IR output

```bash
# View generated IR
cat .lumora/ir/app/v1.json | jq
```

### Use dry-run mode

```bash
# Preview without writing files
lumora convert src/Button.tsx --dry-run
```

### Analyze component

```bash
# Get component statistics
lumora analyze src/ComplexComponent.tsx
```

### Check system info

```bash
lumora doctor
```

## Getting Help

### Before asking for help

1. **Check this guide**: Search for your error message
2. **Review documentation**: [Getting Started](./GETTING_STARTED.md), [API Reference](./API_REFERENCE.md)
3. **Search issues**: [GitHub Issues](https://github.com/lumora/ir/issues)
4. **Try latest version**: `npm update -g @lumora/ir`

### When asking for help

Include:

1. **Lumora version**: `lumora --version`
2. **Node version**: `node --version`
3. **Operating system**: `uname -a` or `ver`
4. **Error message**: Full error output
5. **Minimal reproduction**: Smallest code that reproduces issue
6. **Configuration**: Your `lumora.yaml` file
7. **Steps to reproduce**: Exact commands run

### Where to get help

1. **GitHub Issues**: [github.com/lumora/ir/issues](https://github.com/lumora/ir/issues)
   - Bug reports
   - Feature requests
   - Technical questions

2. **Discord**: [discord.gg/lumora](https://discord.gg/lumora)
   - Quick questions
   - Community support
   - Real-time help

3. **Stack Overflow**: Tag `lumora-ir`
   - Detailed technical questions
   - Code examples
   - Best practices

4. **Documentation**: [lumora.dev/docs](https://lumora.dev/docs)
   - Guides and tutorials
   - API reference
   - Examples

## Reporting Bugs

### Bug report template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Create file '...'
2. Run command '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment**
- Lumora version: [e.g., 1.0.0]
- Node version: [e.g., 18.0.0]
- OS: [e.g., macOS 13.0]

**Additional context**
- Configuration file
- Error logs
- Screenshots
```

### Creating minimal reproduction

1. **Start with smallest possible code**:
```typescript
// Minimal component that reproduces issue
export const Bug = () => <div>Test</div>;
```

2. **Remove unrelated code**:
   - Remove styling
   - Remove complex logic
   - Remove dependencies

3. **Share complete example**:
   - Include all necessary files
   - Include configuration
   - Include commands to run

## FAQ

### Q: Can I use Lumora with existing projects?

**A**: Yes! Run `lumora init` in your project directory and configure paths to your existing source files.

### Q: Does Lumora support TypeScript?

**A**: Yes, Lumora fully supports TypeScript and generates type-safe Dart code.

### Q: Can I customize widget mappings?

**A**: Yes, create a `widget-mappings.yaml` file with your custom mappings.

### Q: Does Lumora support all React features?

**A**: Lumora supports most common React patterns. Check the [Conversion Guide](./CONVERSION_GUIDE.md) for details.

### Q: Can I use Lumora in CI/CD?

**A**: Yes, Lumora works great in CI/CD pipelines. Use `--no-watch` flag for one-time conversions.

### Q: Is Lumora production-ready?

**A**: Lumora is in active development. Use for new projects or gradual migration. Always review generated code.

### Q: How do I update Lumora?

**A**: Run `npm update -g @lumora/ir` to get the latest version.

### Q: Can I contribute to Lumora?

**A**: Yes! Check our [Contributing Guide](./CONTRIBUTING.md) for details.

---

**Still having issues?** Join our [Discord community](https://discord.gg/lumora) or [create an issue](https://github.com/lumora/ir/issues/new).
