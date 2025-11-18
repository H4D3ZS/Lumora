# Lumora Alpha Testing Guide

Welcome to the Lumora Alpha Testing Program! We're excited to have you help us test and improve the Lumora Bidirectional Framework.

## What is Alpha Testing?

Alpha testing is the first phase of user testing where we gather feedback on core functionality, identify bugs, and validate our approach. Your feedback will directly shape the future of Lumora.

## What We're Testing

### Phase 1 - Core Features

- ✅ Bidirectional conversion between React and Flutter
- ✅ Lumora IR (Intermediate Representation) system
- ✅ Widget mapping registry
- ✅ Type system conversion
- ✅ State management conversion
- ✅ Event handler conversion
- ✅ Styling conversion
- ✅ Sync engine with conflict resolution

## Prerequisites

Before you start testing, ensure you have:

- Node.js >= 16.0.0
- Flutter >= 3.0.0
- Dart >= 3.0.0
- Git
- A code editor (VS Code recommended)
- Basic knowledge of React and/or Flutter

## Getting Started

### 1. Installation

```bash
# Install Lumora CLI globally
npm install -g @lumora/cli@alpha

# Verify installation
lumora --version
```

### 2. Create a Test Project

```bash
# Initialize a new project
lumora init my-test-project --mode universal

# Navigate to project
cd my-test-project
```

### 3. Run Your First Conversion

```bash
# Create a simple React component
cat > src/HelloWorld.tsx << 'EOF'
import React from 'react';

export const HelloWorld: React.FC = () => {
  return (
    <div style={{ padding: 20 }}>
      <h1>Hello, Lumora!</h1>
      <p>This is a test component.</p>
    </div>
  );
};
EOF

# Convert to Flutter
lumora convert src/HelloWorld.tsx --to flutter

# Check the output
cat lib/hello_world.dart
```

## Testing Scenarios

### Scenario 1: React to Flutter Conversion

**Objective**: Test basic React component conversion

**Steps**:
1. Create a React component with:
   - Props
   - State (useState)
   - Event handlers
   - Styling
2. Convert to Flutter using `lumora convert`
3. Verify the generated Dart code
4. Report any issues

**What to look for**:
- Correct widget mapping
- Proper type conversion
- State management accuracy
- Event handler preservation
- Styling accuracy

### Scenario 2: Flutter to React Conversion

**Objective**: Test basic Flutter widget conversion

**Steps**:
1. Create a Flutter widget with:
   - Constructor parameters
   - StatefulWidget with state
   - Event callbacks
   - Styling
2. Convert to React using `lumora convert`
3. Verify the generated TypeScript code
4. Report any issues

**What to look for**:
- Correct component structure
- Proper type annotations
- Hook usage (useState, useEffect)
- Event handler conversion
- Style object accuracy

### Scenario 3: Bidirectional Sync

**Objective**: Test real-time synchronization

**Steps**:
1. Initialize project in universal mode
2. Start watch mode: `lumora convert src/App.tsx --to flutter --watch`
3. Make changes to React component
4. Verify Flutter code updates automatically
5. Make changes to Flutter code
6. Verify React code updates automatically
7. Report sync latency and accuracy

**What to look for**:
- Sync speed (< 1 second)
- Accuracy of updates
- Conflict detection
- File watching reliability

### Scenario 4: Conflict Resolution

**Objective**: Test conflict handling

**Steps**:
1. Start bidirectional sync
2. Modify both React and Flutter files simultaneously
3. Observe conflict detection
4. Use conflict resolution UI
5. Verify resolution accuracy
6. Report user experience

**What to look for**:
- Conflict detection accuracy
- UI clarity and usability
- Resolution options effectiveness
- Data preservation

### Scenario 5: Complex State Management

**Objective**: Test advanced state patterns

**Steps**:
1. Create a React component with:
   - Multiple useState hooks
   - useEffect with dependencies
   - useContext
2. Convert to Flutter
3. Verify state management conversion
4. Test the opposite direction
5. Report accuracy

**What to look for**:
- StatefulWidget generation
- Lifecycle method accuracy
- Context/Provider conversion
- State reference handling

### Scenario 6: Styling Conversion

**Objective**: Test style conversion accuracy

**Steps**:
1. Create components with various styles:
   - Colors (hex, rgba, named)
   - Dimensions (px, %, em)
   - Flexbox layouts
   - Text styles
2. Convert in both directions
3. Compare visual output
4. Report discrepancies

**What to look for**:
- Color accuracy
- Layout preservation
- Text style conversion
- Responsive behavior

### Scenario 7: Navigation

**Objective**: Test navigation conversion

**Steps**:
1. Create a multi-screen app with React Router
2. Convert to Flutter
3. Verify Navigator generation
4. Test route parameters
5. Test nested navigation
6. Report issues

**What to look for**:
- Route definition accuracy
- Parameter passing
- Navigation hierarchy
- Deep linking support

### Scenario 8: Asset Handling

**Objective**: Test asset synchronization

**Steps**:
1. Add images to React project
2. Reference in components
3. Convert to Flutter
4. Verify asset copying
5. Verify path conversion
6. Check configuration updates
7. Report issues

**What to look for**:
- Asset file copying
- Path accuracy
- Configuration updates (pubspec.yaml, package.json)
- Asset loading in both frameworks

## Reporting Issues

### Where to Report

- **GitHub Issues**: [https://github.com/lumora/lumora/issues](https://github.com/lumora/lumora/issues)
- **Discord**: [Join our Discord](https://discord.gg/lumora) (TBD)
- **Email**: alpha-testing@lumora.dev (TBD)

### Issue Template

When reporting issues, please include:

```markdown
**Issue Type**: Bug / Feature Request / Question

**Description**:
[Clear description of the issue]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What you expected to happen]

**Actual Behavior**:
[What actually happened]

**Environment**:
- OS: [e.g., macOS 13.0, Windows 11, Ubuntu 22.04]
- Node.js version: [e.g., 18.16.0]
- Flutter version: [e.g., 3.16.0]
- Lumora version: [e.g., 0.1.0-alpha.1]

**Code Sample**:
```typescript
// Your code here
```

**Generated Output**:
```dart
// Generated code here
```

**Screenshots** (if applicable):
[Attach screenshots]

**Additional Context**:
[Any other relevant information]
```

### Priority Levels

Help us prioritize by indicating severity:

- **Critical**: Blocks all usage, data loss, security issue
- **High**: Major feature broken, significant impact
- **Medium**: Feature partially broken, workaround exists
- **Low**: Minor issue, cosmetic problem

## Feedback Categories

### What We Want to Know

#### 1. Conversion Accuracy
- Are conversions correct?
- Are there missing features?
- Are there incorrect mappings?

#### 2. Performance
- How fast are conversions?
- Is sync responsive?
- Are there performance bottlenecks?

#### 3. Usability
- Is the CLI intuitive?
- Is documentation clear?
- Are error messages helpful?

#### 4. Reliability
- Are there crashes?
- Are there data loss scenarios?
- Is file watching reliable?

#### 5. Feature Requests
- What features are missing?
- What would make Lumora more useful?
- What workflows need support?

## Feedback Channels

### GitHub Discussions

Use for:
- General questions
- Feature discussions
- Best practices
- Sharing experiences

### GitHub Issues

Use for:
- Bug reports
- Specific feature requests
- Documentation issues

### Discord (TBD)

Use for:
- Real-time chat
- Quick questions
- Community support
- Announcements

### Surveys

We'll send periodic surveys to gather structured feedback:
- Weekly quick surveys (2-3 questions)
- Monthly detailed surveys (10-15 questions)
- End-of-alpha comprehensive survey

## Testing Rewards

### Recognition

- Listed in CONTRIBUTORS.md
- Special "Alpha Tester" badge (TBD)
- Early access to new features
- Direct communication with dev team

### Incentives (TBD)

- Swag for active testers
- Free premium features (when available)
- Conference tickets (if applicable)

## Testing Schedule

### Week 1-2: Initial Testing
- Focus: Installation and basic conversion
- Goal: Identify critical bugs
- Deliverable: Initial bug reports

### Week 3-4: Feature Testing
- Focus: Advanced features (sync, conflict resolution)
- Goal: Validate core functionality
- Deliverable: Feature feedback

### Week 5-6: Integration Testing
- Focus: Real-world projects
- Goal: Test in production-like scenarios
- Deliverable: Use case reports

### Week 7-8: Polish Testing
- Focus: Documentation, UX, edge cases
- Goal: Prepare for beta
- Deliverable: Final feedback

## Best Practices

### Do's

✅ Test with real projects (not just examples)
✅ Report both bugs and successes
✅ Provide detailed reproduction steps
✅ Test edge cases
✅ Share your use cases
✅ Suggest improvements
✅ Help other testers
✅ Update to latest alpha versions

### Don'ts

❌ Use in production (alpha is unstable)
❌ Report duplicate issues (search first)
❌ Expect immediate fixes
❌ Share alpha builds publicly
❌ Ignore security issues
❌ Test without reading documentation

## FAQ

### Q: How long is the alpha period?
**A**: Approximately 8 weeks, subject to change based on feedback.

### Q: Can I use Lumora in production?
**A**: No, alpha releases are not production-ready. Use for testing only.

### Q: How often are updates released?
**A**: We aim for weekly alpha releases with bug fixes and improvements.

### Q: What happens to my feedback?
**A**: All feedback is reviewed, prioritized, and tracked in our issue tracker.

### Q: Can I contribute code?
**A**: Yes! See CONTRIBUTING.md for guidelines.

### Q: Is there a testing quota?
**A**: No, test as much or as little as you like. Quality over quantity.

### Q: What if I find a security issue?
**A**: Report immediately to security@lumora.dev (TBD) - do not post publicly.

### Q: Can I share my experience publicly?
**A**: Yes, but please don't share alpha builds or internal documentation.

## Support

### Getting Help

- **Documentation**: [https://github.com/lumora/lumora](https://github.com/lumora/lumora)
- **Discord**: [Join our Discord](https://discord.gg/lumora) (TBD)
- **Email**: support@lumora.dev (TBD)

### Office Hours (TBD)

Weekly video calls with the dev team:
- Tuesday 10:00 AM PST
- Thursday 3:00 PM PST

## Thank You!

Your participation in the alpha testing program is invaluable. Every bug report, feature request, and piece of feedback helps make Lumora better.

We're building Lumora together with the community, and your input directly shapes the product.

Happy testing! 🚀

---

**Last Updated:** 2025-11-10
**Alpha Version:** 0.1.0-alpha.1
