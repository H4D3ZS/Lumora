# Devpost Submission Checklist — Kiroween Hackathon

Use this checklist to prepare your Devpost submission and meet the hackathon requirements. This comprehensive guide ensures you don't miss any critical components for a successful submission.

## Table of Contents

- [Code & Repository](#code--repository)
- [Submission Materials](#submission-materials)
- [Kiro-Specific Artifacts](#kiro-specific-artifacts)
- [Documentation](#documentation)
- [Demo & Presentation](#demo--presentation)
- [Bonus Opportunities](#bonus-opportunities)
- [Final Review](#final-review)

---

## Code & Repository

### Repository Setup

- [ ] **Public GitHub Repository**: Ensure your repository is public and accessible
- [ ] **OSI-Approved License**: Include MIT or another OSI-approved license
- [ ] **License File**: Add `LICENSE` file in the root directory
- [ ] **Repository Description**: Add a clear description in GitHub repository settings
- [ ] **Topics/Tags**: Add relevant tags (flutter, react, mobile-first, kiro, etc.)

### Core Components

- [ ] **Root README.md**: Comprehensive README with quickstart (≤ 5 commands)
- [ ] **KIRO_IMPLEMENTATION_PLAN.md**: Implementation plan and goals
- [ ] **Flutter-Dev-Client**: Located at `/apps/flutter-dev-client` with `lib/main.dart`
- [ ] **Dev-Proxy**: Located at `/tools/dev-proxy` and starts with `node dist/index.js`
- [ ] **Codegen Tool**: Located at `/tools/codegen` with `tsx2schema` functionality
- [ ] **Examples**: Both `examples/todo-app` and `examples/chat-app` present and runnable

### Build Verification

- [ ] **Flutter Build**: `flutter build apk --debug` succeeds
- [ ] **Dev-Proxy Build**: `npm install && npm run build` succeeds in tools/dev-proxy
- [ ] **Codegen Build**: `npm install` succeeds in tools/codegen
- [ ] **No Build Errors**: All components build without errors
- [ ] **Dependencies Installed**: All package.json and pubspec.yaml dependencies resolve

---

## Submission Materials

### Required Submissions

- [ ] **Project Title**: Clear, descriptive title for your submission
- [ ] **Tagline**: One-sentence description of your project
- [ ] **Description**: Comprehensive text description (500-2000 words) explaining:
  - What the project does
  - How it works
  - Key features and innovations
  - How Kiro was used in development
  - Technical architecture
  - Challenges overcome
  - Future plans

### Demo Video

- [ ] **Video Length**: ≤ 3 minutes (strictly enforced)
- [ ] **Video Quality**: Clear audio and video (1080p recommended)
- [ ] **Video Platform**: Uploaded to YouTube, Vimeo, or similar
- [ ] **Video Content** must show:
  - [ ] Repository structure and `.kiro` directory
  - [ ] Starting Dev-Proxy and QR code generation
  - [ ] Scanning QR code with mobile device
  - [ ] Device connecting to session
  - [ ] Live editing in web editor or TSX file
  - [ ] Instant UI update on device
  - [ ] Generated Dart files or mapping rules
  - [ ] Optional: Production build process

### Video Script Outline

```
0:00-0:20 - Introduction and project overview
0:20-0:40 - Show repository structure and .kiro directory
0:40-1:00 - Start Dev-Proxy, show QR code
1:00-1:20 - Scan QR with device, establish connection
1:20-2:00 - Live edit demo (TSX → Schema → Device)
2:00-2:30 - Show generated Dart code
2:30-3:00 - Wrap up, key features, future plans
```

### Screenshots

- [ ] **Main Screenshot**: Hero image showing the full workflow
- [ ] **Additional Screenshots** (3-5 recommended):
  - [ ] QR code generation in terminal
  - [ ] Mobile device showing rendered UI
  - [ ] TSX code editor
  - [ ] Generated Dart code
  - [ ] Architecture diagram

---

## Kiro-Specific Artifacts

### Required .kiro Directory Structure

```
.kiro/
├── specs/
│   └── kiro-stack-mvp/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
├── steering/
│   └── *.md (steering rules)
└── hooks/ (optional but recommended)
    ├── create-app-hook.md
    ├── proxy-launch-hook.md
    └── codegen-hook.md
```

### Kiro Artifacts Checklist

- [ ] **`.kiro/specs/` Directory**: Contains spec files for your features
- [ ] **Spec Files**: Include requirements.md, design.md, and tasks.md
- [ ] **Feature Descriptions**: Document key features:
  - [ ] flutter_dev_client
  - [ ] tsx_to_schema
  - [ ] qr_dev_flow
  - [ ] schema_interpreter
  - [ ] state_adapters
- [ ] **`.kiro/steering/` Directory**: Contains steering rules and constraints
- [ ] **Steering Content**: Document:
  - [ ] Project constraints
  - [ ] Deliverables
  - [ ] Quality benchmarks
  - [ ] Anti-patterns to avoid
- [ ] **`.kiro/hooks/` Directory** (optional): Contains agent hooks
- [ ] **Hook Documentation**: If included, document:
  - [ ] create-app-hook.md
  - [ ] proxy-launch-hook.md
  - [ ] codegen-hook.md

### Kiro Session Logs (Optional but Recommended)

- [ ] **Session Logs**: Create `.kiro/vibe/session-logs.md`
- [ ] **Log Content**: Include sample Kiro prompts and outputs showing:
  - [ ] How Kiro helped with implementation
  - [ ] Code generation examples
  - [ ] Problem-solving conversations
  - [ ] Architecture decisions

---

## Documentation

### Core Documentation Files

- [ ] **README.md**: Root README with:
  - [ ] Project overview
  - [ ] Quick start (≤ 5 commands)
  - [ ] Architecture overview
  - [ ] Component links
  - [ ] Examples section
  - [ ] Requirements
  - [ ] License information

- [ ] **FRAMEWORK_SPEC.md**: Framework specification with:
  - [ ] Architecture details
  - [ ] Package descriptions
  - [ ] API documentation
  - [ ] Extension points

- [ ] **STATE_MANAGEMENT.md**: State management guide with:
  - [ ] Adapter selection guide
  - [ ] Comparison matrix
  - [ ] Usage examples

- [ ] **MOBILE_FIRST_GUIDE.md**: Mobile build guide with:
  - [ ] iOS configuration
  - [ ] Android configuration
  - [ ] Troubleshooting steps
  - [ ] CI/CD tips

### Component READMEs

- [ ] **tools/dev-proxy/README.md**: Dev-Proxy documentation
- [ ] **apps/flutter-dev-client/README.md**: Flutter client documentation
- [ ] **tools/codegen/README.md**: Codegen tool documentation

### Example Documentation

- [ ] **examples/todo-app/README.md**: Todo app instructions
- [ ] **examples/chat-app/README.md**: Chat app instructions
- [ ] **examples/README.md**: Examples overview

---

## Demo & Presentation

### Installation Artifacts

- [ ] **Debug APK**: Build and include `app-debug.apk`
  ```bash
  cd apps/flutter-dev-client
  flutter build apk --debug
  ```
- [ ] **Artifact Location**: Place in `release-artifacts/android/` directory
- [ ] **Installation Instructions**: Include in `release-artifacts/README.md`
- [ ] **iOS Build** (optional): TestFlight link or .ipa file
- [ ] **Web Demo** (optional): Hosted web version of editor

### Release Artifacts Directory Structure

```
release-artifacts/
├── android/
│   ├── app-debug.apk
│   └── app-release.apk (optional)
├── ios/
│   └── Runner.ipa (optional)
└── README.md (installation instructions)
```

### Testing Instructions

- [ ] **Quick Start Works**: Verify quickstart commands work on clean machine
- [ ] **Examples Run**: Both example apps run successfully
- [ ] **QR Flow Works**: QR code scanning and connection works
- [ ] **Live Updates Work**: Schema updates appear on device instantly
- [ ] **Code Generation Works**: Dart code generation produces valid code

---

## Bonus Opportunities

### Social Blitz (Extra Points)

- [ ] **Social Media Post**: Post on Twitter/X with #hookedonkiro
- [ ] **Tag @kirodotdev**: Include the official Kiro account tag
- [ ] **Include Screenshot/Video**: Visual content of your project
- [ ] **Project Link**: Link to your Devpost submission

### Blog Post ($100 Bonus)

- [ ] **Platform**: Publish on dev.to, Medium, or personal blog
- [ ] **Content**: Write about your experience building with Lumora and Kiro
- [ ] **Length**: 500+ words recommended
- [ ] **Topics to Cover**:
  - [ ] What you built
  - [ ] How Kiro helped
  - [ ] Technical challenges
  - [ ] Lessons learned
  - [ ] Code examples
- [ ] **Deadline**: First 50 submissions get $100 bonus
- [ ] **Submission**: Link blog post in Devpost submission

### Additional Categories

- [ ] **Best Startup**: Submit to this category if eligible
- [ ] **Other Categories**: Check for additional relevant categories

---

## Final Review

### Pre-Submission Checklist

- [ ] **All Links Work**: Verify all links in README and documentation
- [ ] **No Broken Images**: Check all images load correctly
- [ ] **No Sensitive Data**: Remove API keys, tokens, personal information
- [ ] **Clean Git History**: Ensure no sensitive data in git history
- [ ] **License Compliance**: Verify all third-party dependencies are properly licensed
- [ ] **Code Quality**: Run linters and formatters
- [ ] **Tests Pass**: Run all tests and ensure they pass
- [ ] **Build Succeeds**: Final build verification on clean environment

### Submission Quality

- [ ] **Professional Presentation**: Clean, well-organized submission
- [ ] **Clear Communication**: Easy to understand for judges
- [ ] **Complete Documentation**: All required docs present and thorough
- [ ] **Working Demo**: Everything demonstrated in video actually works
- [ ] **Innovation Highlighted**: Unique features and innovations clearly explained
- [ ] **Kiro Usage Evident**: Clear demonstration of how Kiro was used

### Judge Accessibility

- [ ] **Easy to Test**: Judges can easily run your project
- [ ] **Clear Instructions**: Step-by-step setup instructions
- [ ] **Fallback Options**: APK or web demo for judges without dev environment
- [ ] **Video Covers Everything**: Video shows all key features
- [ ] **Documentation Complete**: Judges can understand project without running it

---

## Submission Timeline

### 1 Week Before Deadline

- [ ] Complete all core functionality
- [ ] Write comprehensive documentation
- [ ] Create example applications
- [ ] Set up .kiro directory structure

### 3 Days Before Deadline

- [ ] Record demo video
- [ ] Build release artifacts (APK, etc.)
- [ ] Write Devpost description
- [ ] Take screenshots
- [ ] Test on clean machine

### 1 Day Before Deadline

- [ ] Final testing and bug fixes
- [ ] Proofread all documentation
- [ ] Verify all links and images
- [ ] Complete this checklist
- [ ] Submit to Devpost

### After Submission

- [ ] Share on social media (#hookedonkiro)
- [ ] Write blog post (if pursuing bonus)
- [ ] Engage with community
- [ ] Prepare for potential judge questions

---

## Common Pitfalls to Avoid

- ❌ **Incomplete Documentation**: Missing READMEs or unclear instructions
- ❌ **Broken Build**: Project doesn't build on clean machine
- ❌ **Video Too Long**: Exceeding 3-minute limit (automatic disqualification)
- ❌ **Missing .kiro Directory**: Required for Kiro-specific judging criteria
- ❌ **No Working Demo**: Video shows features that don't actually work
- ❌ **Unclear Kiro Usage**: Not evident how Kiro was used in development
- ❌ **License Issues**: Missing or incompatible license
- ❌ **Last-Minute Rush**: Submitting without proper testing

---

## Resources

- [Devpost Submission Guidelines](https://help.devpost.com/)
- [Kiro Documentation](https://kiro.dev/docs)
- [Hackathon Rules](https://kiroween.devpost.com/rules)
- [Example Submissions](https://devpost.com/software/search?query=kiro)

---

## Questions?

If you have questions about the submission:

1. Check the [Hackathon FAQ](https://kiroween.devpost.com/faq)
2. Ask in the Discord community
3. Review example submissions
4. Contact hackathon organizers

---

## Final Checklist Summary

Before submitting, verify:

✅ Repository is public with OSI license  
✅ All core components build successfully  
✅ Demo video is ≤ 3 minutes and shows key features  
✅ .kiro directory is properly structured  
✅ Documentation is complete and clear  
✅ Examples work and are documented  
✅ Release artifacts are included  
✅ Tested on clean machine  
✅ All links and images work  
✅ Ready to submit!  

---

**Good luck with your submission!** 🚀

**Last Updated**: November 2025
