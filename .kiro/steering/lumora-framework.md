# Lumora Framework Development Guidelines

## Project Overview

Lumora is a mobile-first Flutter development framework that bridges React/TSX authoring with native Flutter rendering. The system enables developers to write UI in familiar React syntax and see instant previews on actual mobile devices via QR code connection, then generate production-ready Dart code with proper state management.

## Core Constraints

### Technical Constraints

1. **No Runtime Compilation**: Flutter does not support runtime Dart compilation on mobile devices. All production code must be generated ahead of time.

2. **WebSocket-Only Communication**: Dev-Proxy uses WebSocket for real-time bidirectional communication. HTTP polling is not supported due to latency requirements.

3. **Session Lifetime**: Development sessions expire after 8 hours by default. This is a security measure to prevent stale connections.

4. **Platform Requirements**:
   - Android: minSdkVersion 21, targetSdkVersion 33
   - iOS: Platform version 12.0+
   - Flutter: 3.x with Dart 3.x

5. **Schema Size Limits**: Schemas larger than 100KB trigger isolate-based parsing to prevent UI thread blocking.

6. **Message Size Limits**: WebSocket messages are capped at 10MB to prevent memory issues.

## Deliverables

### Must-Have Features (MVP)

- [x] Dev-Proxy server with session management and QR code generation
- [x] Flutter-Dev-Client with schema interpretation and widget rendering
- [x] TSX to JSON schema conversion (tsx2schema command)
- [x] Schema to Dart code generation with Bloc adapter
- [x] WebSocket-based real-time communication
- [x] Event bridge for UI interactions
- [x] Delta updates with debouncing
- [x] Template placeholder resolution
- [x] Multi-platform support (Android + iOS)
- [x] Example applications (todo-app, chat-app)
- [x] Comprehensive documentation

### Should-Have Features

- [x] Multiple state adapter support (Bloc, Riverpod, Provider, GetX)
- [x] Custom renderer registry for extensions
- [x] Design token system (kiro_ui_tokens)
- [x] Watch mode for continuous schema regeneration
- [x] Clean Architecture code generation
- [x] Performance optimizations (isolate parsing, lazy rendering)
- [ ] Plugin system for custom components

### Nice-to-Have Features

- [ ] Hot reload integration with Flutter DevTools
- [ ] Visual schema editor
- [ ] Component library browser
- [ ] Performance profiling dashboard
- [ ] Automated testing infrastructure
- [ ] CI/CD pipeline templates

## Quality Benchmarks

### Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Session Creation | < 100ms | Time from POST request to QR display |
| Schema Push Latency | < 500ms | Time from HTTP POST to device render (local network) |
| Large Schema Parsing | < 2s | Parse and render 500KB JSON payload |
| Delta Application | < 100ms | Apply incremental update to existing UI |
| Code Generation | < 5s | Generate complete Dart project from schema |
| Quickstart Setup | < 5 commands | From clone to running app |
| App Scaffolding | < 30s | create-app command completion time |

### Code Quality Standards

1. **TypeScript/JavaScript**:
   - Use ESLint with recommended rules
   - Prefer async/await over callbacks
   - Document public APIs with JSDoc
   - Handle errors explicitly (no silent failures)

2. **Dart/Flutter**:
   - Follow official Dart style guide
   - Use const constructors where possible
   - Implement proper error handling with try-catch
   - Document public APIs with dartdoc comments
   - Prefer composition over inheritance

3. **Testing**:
   - Unit tests for core business logic
   - Integration tests for end-to-end flows
   - Widget tests for UI components
   - Golden file tests for code generation

## Anti-Patterns to Avoid

### Architecture Anti-Patterns

❌ **Don't**: Couple Dev-Proxy logic with schema interpretation
✅ **Do**: Keep Dev-Proxy as a dumb message broker

❌ **Don't**: Store state in WebSocket connections
✅ **Do**: Use session-based state management

❌ **Don't**: Generate Dart code that depends on runtime interpretation
✅ **Do**: Generate fully self-contained Dart code

❌ **Don't**: Mix fast path (interpretation) with native path (codegen) in production
✅ **Do**: Use interpretation for dev, codegen for production

### Performance Anti-Patterns

❌ **Don't**: Parse large JSON on the main UI thread
✅ **Do**: Use Dart isolates for payloads > 100KB

❌ **Don't**: Rebuild entire widget tree on delta updates
✅ **Do**: Apply deltas to specific subtrees only

❌ **Don't**: Send full schemas for small changes
✅ **Do**: Use JSON Patch format for incremental updates

❌ **Don't**: Create new WebSocket connections for each message
✅ **Do**: Maintain persistent connections with ping/pong

### Security Anti-Patterns

❌ **Don't**: Store tokens in URLs or query parameters
✅ **Do**: Send tokens in WebSocket message payloads

❌ **Don't**: Allow unlimited message rates
✅ **Do**: Implement rate limiting (100 msg/sec per client)

❌ **Don't**: Execute arbitrary code from schemas
✅ **Do**: Whitelist allowed widget types and sanitize props

❌ **Don't**: Log sensitive information (tokens, session IDs)
✅ **Do**: Log only non-sensitive debugging information

### Code Generation Anti-Patterns

❌ **Don't**: Generate code with hardcoded values
✅ **Do**: Use design tokens and configuration

❌ **Don't**: Generate monolithic files
✅ **Do**: Follow Clean Architecture with proper separation

❌ **Don't**: Generate code without imports
✅ **Do**: Include all necessary imports and exports

❌ **Don't**: Ignore adapter-specific patterns
✅ **Do**: Follow each adapter's best practices

## Development Workflow

### Quick Start Flow (Target: < 5 commands)

```bash
# 1. Install dependencies
npm install

# 2. Start Dev-Proxy
cd tools/dev-proxy && npm start

# 3. Create session (in new terminal)
curl http://localhost:3000/session/new

# 4. Run Flutter client (scan QR code)
cd apps/flutter-dev-client && flutter run

# 5. Generate and push schema
cd tools/codegen && node cli.js tsx2schema example.tsx schema.json
curl -X POST http://localhost:3000/send/:sessionId -d @schema.json
```

### Live Edit Flow

1. Start Dev-Proxy and connect device (as above)
2. Run tsx2schema in watch mode: `node cli.js tsx2schema --watch app.tsx schema.json`
3. Edit TSX file in your editor
4. Schema auto-regenerates on save
5. Push delta to session (manual or automated)
6. UI updates on device within 500ms

### Production Code Generation Flow

1. Create new app: `node cli.js create-app my-app --adapter=bloc`
2. Write TSX components in `web/src/`
3. Generate schema: `node cli.js tsx2schema web/src/App.tsx schema.json`
4. Generate Dart code: `node cli.js schema2dart schema.json mobile/lib --adapter=bloc`
5. Build Flutter app: `cd mobile && flutter build apk`

## Notes for Judges and Developers

### What Makes Lumora Unique

1. **True Mobile-First**: Unlike web-based mobile frameworks, Lumora generates native Flutter code, not WebViews or JavaScript bridges.

2. **Instant Preview**: QR code connection takes < 5 seconds. No app installation, no manual configuration.

3. **Two Runtime Modes**: Fast path for development (interpretation), native path for production (codegen). Best of both worlds.

4. **State Management Flexibility**: Support for 4 major Flutter state patterns. Choose what fits your team.

5. **Clean Architecture**: Generated code follows industry best practices, not toy examples.

### Technical Highlights

- **Isolate-based parsing**: Prevents UI freezing on large schemas
- **Delta updates**: Only send what changed, not entire UI tree
- **Session isolation**: Multiple developers can work simultaneously
- **Extensible renderer registry**: Add custom widgets without modifying core
- **Design token system**: Consistent styling across platforms

### Known Limitations

1. **No Hot Reload Integration**: Flutter's hot reload doesn't work with interpreted schemas (by design). Use delta updates instead.

2. **Limited Widget Support**: Core primitives only (View, Text, Button, List, Image, Input). Custom widgets require renderer extensions.

3. **No Animation Support**: Current schema format doesn't include animation definitions. Planned for future release.

4. **Local Network Only**: Dev-Proxy is designed for local development. Remote connections require TLS/WSS setup.

5. **No Persistent Storage**: Sessions are ephemeral. No database, no cloud sync.

### Debugging Tips

**Problem**: Device won't connect to Dev-Proxy
- Check that device and computer are on same network
- Verify firewall allows port 3000
- Use `ws://10.0.2.2:3000/ws` for Android emulator
- Check Dev-Proxy logs for connection attempts

**Problem**: Schema doesn't render correctly
- Validate JSON structure with online validator
- Check Flutter-Dev-Client logs for parsing errors
- Verify schemaVersion is "1.0"
- Ensure all required props are present

**Problem**: Generated Dart code doesn't compile
- Check ui-mapping.json for correct widget mappings
- Verify adapter templates are up to date
- Run `flutter pub get` to install dependencies
- Check for missing imports in generated files

**Problem**: Performance issues with large schemas
- Enable isolate parsing (automatic for > 100KB)
- Use delta updates instead of full schema replacement
- Implement lazy rendering for long lists
- Check for unnecessary widget rebuilds

### Future Roadmap

**Phase 2 (Post-MVP)**:
- Animation support in schema format
- Visual schema editor with drag-and-drop
- Component library with pre-built widgets
- Performance profiling dashboard
- Automated testing generation

**Phase 3 (Production Ready)**:
- Cloud-based Dev-Proxy for remote teams
- CI/CD integration and deployment pipelines
- Advanced debugging tools
- Plugin marketplace
- Enterprise features (SSO, audit logs)

## Contributing Guidelines

### Code Review Checklist

- [ ] Follows project coding standards
- [ ] Includes appropriate error handling
- [ ] Updates relevant documentation
- [ ] Adds tests for new functionality
- [ ] Doesn't introduce performance regressions
- [ ] Maintains backward compatibility
- [ ] Includes clear commit messages

### Testing Requirements

- Unit tests for all business logic
- Integration tests for API endpoints
- Widget tests for UI components
- End-to-end tests for critical flows
- Performance benchmarks for optimization claims

### Documentation Requirements

- Update README.md for user-facing changes
- Add JSDoc/dartdoc for public APIs
- Include code examples for new features
- Update CHANGELOG.md with version notes
- Add troubleshooting section for common issues

## Hackathon Submission Notes

### Demo Script (3 minutes)

1. **Setup (30s)**: Show quickstart commands, start Dev-Proxy, display QR code
2. **Connect (30s)**: Launch Flutter app, scan QR, show connection success
3. **Live Edit (60s)**: Edit TSX file, show instant preview on device
4. **Codegen (60s)**: Generate production Dart code, show Clean Architecture structure

### Key Talking Points

- "From zero to mobile preview in under 5 commands"
- "Write React, run Flutter - no compromise on performance"
- "Instant preview during development, native code for production"
- "Supports 4 major state management patterns out of the box"
- "QR code connection - no app store, no manual config"

### Judging Criteria Alignment

**Innovation**: Unique approach to mobile development - interpretation for speed, codegen for production

**Technical Complexity**: Multi-language stack (TypeScript, Dart), real-time WebSocket communication, AST parsing, code generation

**Completeness**: Full end-to-end workflow from authoring to deployment, comprehensive documentation, working examples

**Usability**: < 5 commands to get started, QR code connection, familiar React syntax

**Impact**: Solves real pain point - slow mobile development iteration cycles

## License and Attribution

This project is licensed under the MIT License. See LICENSE file for details.

Built for the Kiro AI Hackathon 2025.
