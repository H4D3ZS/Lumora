# Pre-Publishing Checklist for Lumora v1.0.0

Use this checklist to ensure everything is ready before publishing.

## ✅ Code Quality

- [ ] All TypeScript files compile without errors
  ```bash
  cd packages/lumora_ir && npm run build
  cd packages/lumora-cli && npm run build
  ```

- [ ] All Dart files analyze without errors
  ```bash
  cd apps/flutter-dev-client && flutter analyze
  cd packages/kiro_ui_tokens && flutter analyze
  ```

- [ ] All tests pass
  ```bash
  # TypeScript tests
  cd packages/lumora_ir && npm test
  cd packages/lumora-cli && npm test
  
  # Flutter tests
  cd apps/flutter-dev-client && flutter test
  cd packages/kiro_ui_tokens && flutter test
  ```

- [ ] Code is formatted
  ```bash
  # TypeScript
  cd packages/lumora_ir && npm run format
  cd packages/lumora-cli && npm run format
  
  # Dart
  cd apps/flutter-dev-client && dart format .
  cd packages/kiro_ui_tokens && dart format .
  ```

- [ ] No linting errors
  ```bash
  # TypeScript
  cd packages/lumora_ir && npm run lint
  cd packages/lumora-cli && npm run lint
  ```

## ✅ Version Numbers

- [ ] Root `package.json` updated to 1.0.0
- [ ] `packages/lumora_ir/package.json` updated to 1.0.0
- [ ] `packages/lumora-cli/package.json` updated to 1.0.0
- [ ] `apps/flutter-dev-client/pubspec.yaml` updated to 1.0.0+1
- [ ] `packages/kiro_ui_tokens/pubspec.yaml` updated to 1.0.0

## ✅ Documentation

- [ ] `README.md` is up to date
- [ ] `CHANGELOG.md` is complete with all changes
- [ ] `RELEASE_NOTES.md` is ready
- [ ] `PUBLISHING.md` is accurate
- [ ] API documentation is current
- [ ] Performance benchmarks are documented
- [ ] Migration guide is available (if needed)

## ✅ Performance Verification

- [ ] Interpreter optimizations verified
  ```bash
  cd apps/flutter-dev-client
  flutter test test/interpreter_performance_test.dart
  ```

- [ ] Parser optimizations verified
  ```bash
  cd packages/lumora_ir
  npm test -- parser-performance.test.ts
  ```

- [ ] Hot reload optimizations verified
  ```bash
  cd packages/lumora-cli
  npm test -- hot-reload-batching.test.ts
  ```

- [ ] Cache statistics working correctly
- [ ] Memory usage is acceptable
- [ ] No memory leaks detected

## ✅ Integration Testing

- [ ] Dev-Proxy starts successfully
  ```bash
  cd packages/lumora-cli && npm start
  ```

- [ ] Flutter client connects to Dev-Proxy
  ```bash
  cd apps/flutter-dev-client && flutter run
  ```

- [ ] Schema generation works
  ```bash
  cd tools/codegen
  node cli.js tsx2schema examples/simple.tsx schema.json
  ```

- [ ] Schema push works
  ```bash
  curl -X POST http://localhost:3000/send/<session-id> \
    -H "Content-Type: application/json" \
    -d @schema.json
  ```

- [ ] Hot reload works correctly
- [ ] Code generation works
  ```bash
  node cli.js schema2dart schema.json output/ --adapter=bloc
  ```

- [ ] Generated code compiles
  ```bash
  cd output && flutter analyze
  ```

## ✅ Example Applications

- [ ] Todo app works correctly
  ```bash
  cd examples/todo-app
  # Test the app
  ```

- [ ] Chat app works correctly
  ```bash
  cd examples/chat-app
  # Test the app
  ```

- [ ] All example schemas are valid
- [ ] All examples use latest version

## ✅ Git & Repository

- [ ] All changes committed
  ```bash
  git status
  ```

- [ ] Working directory is clean
- [ ] On correct branch (main)
- [ ] Remote is up to date
  ```bash
  git pull origin main
  ```

- [ ] No merge conflicts
- [ ] `.gitignore` is correct
- [ ] No sensitive data in repository

## ✅ NPM Preparation

- [ ] Logged in to npm
  ```bash
  npm whoami
  ```

- [ ] Have publish permissions
- [ ] Package names are available
  - `lumora-ir`
  - `lumora-cli`

- [ ] `package.json` files have correct metadata:
  - [ ] Name
  - [ ] Version
  - [ ] Description
  - [ ] Repository URL
  - [ ] Keywords
  - [ ] License
  - [ ] Author

- [ ] `.npmignore` or `files` field is correct
- [ ] No unnecessary files will be published

## ✅ Flutter Pub Preparation

- [ ] Logged in to pub.dev (if publishing)
  ```bash
  flutter pub login
  ```

- [ ] `pubspec.yaml` files are correct:
  - [ ] Name
  - [ ] Version
  - [ ] Description
  - [ ] Homepage
  - [ ] Repository

- [ ] Dry run successful
  ```bash
  cd packages/kiro_ui_tokens
  flutter pub publish --dry-run
  ```

## ✅ Release Assets

- [ ] `CHANGELOG.md` created
- [ ] `RELEASE_NOTES.md` created
- [ ] `PUBLISHING.md` created
- [ ] Performance documentation complete
- [ ] Verification guide complete

## ✅ Communication Preparation

- [ ] Release announcement drafted
- [ ] Social media posts prepared
- [ ] Blog post ready (if applicable)
- [ ] Newsletter prepared (if applicable)
- [ ] Community channels notified

## ✅ Rollback Plan

- [ ] Backup of current state created
- [ ] Rollback procedure documented
- [ ] Know how to unpublish if needed
- [ ] Have deprecation plan if needed

## ✅ Post-Publishing Tasks

- [ ] Monitor npm downloads
- [ ] Watch GitHub issues
- [ ] Check for user feedback
- [ ] Update documentation site
- [ ] Announce on social media
- [ ] Update example apps
- [ ] Monitor performance in production

## 🚀 Ready to Publish?

If all items are checked, you're ready to publish!

### Quick Publish (Automated)

```bash
# Dry run first
./scripts/publish.sh --version 1.0.0 --dry-run

# Actual publish
./scripts/publish.sh --version 1.0.0
```

### Manual Publish

Follow the steps in `PUBLISHING.md`

## 📞 Support Contacts

If you encounter issues:
- GitHub Issues: https://github.com/your-org/lumora/issues
- Discord: https://discord.gg/lumora
- Email: support@lumora.dev

## 📝 Notes

Add any additional notes or reminders here:

---

**Last Updated**: 2024-01-XX
**Version**: 1.0.0
**Status**: Ready for Publishing ✅
