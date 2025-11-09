# Devpost Submission Checklist — Kiroween Hackathon

Use this checklist to prepare your Devpost submission and meet the hackathon rules.

## Code & Repo
- [ ] Public GitHub repo with OSI license (MIT recommended)
- [ ] Root contains `README.md` and `KIRO_IMPLEMENTATION_PLAN.md`
- [ ] `/apps/flutter-dev-client` is buildable and contains `lib/main.dart`
- [ ] `/tools/dev-proxy` exists and starts with `node index.js`
- [ ] `/tools/codegen` contains `tsx2schema.js`
- [ ] `/.kiro/` directory with `spec.yaml`, `steering.md`, and `hooks/` files
- [ ] `examples/todo-app` and `examples/chat-app` present and runnable

## Submission materials
- [ ] Text description explaining features and Kiro usage
- [ ] Demo video ≤ 3 minutes showing:
  - Repo & `.kiro`
  - Start dev-proxy & QR
  - Scan QR & device connect
  - Live edit in web editor and instant device update
  - Show generated Dart files or mapping rules
- [ ] Repository `About` with OSI license visible
- [ ] `/README.md` contains Quick Start (3 commands)
- [ ] Provide APK or TestFlight link (optional but recommended)
- [ ] If using third-party SDKs/APIs, confirm license compliance

## Kiro-specific artifacts
- [ ] `/.kiro/spec.yaml` describing features (flutter_dev_client, tsx_to_schema, qr_dev_flow)
- [ ] `/.kiro/steering.md` with constraints and deliverables
- [ ] `/.kiro/hooks/create-app-hook.md`, `proxy-launch-hook.md`, `codegen-hook.md`
- [ ] `/.kiro/vibe/session-logs.md` showing Kiro prompts and outputs

## Extra (increase judge appeal)
- [ ] Blog post on dev.to (first 50 get $100 bonus)
- [ ] Social post with #hookedonkiro tagging @kirodotdev (Social Blitz)
- [ ] Submit `Best Startup` category if eligible
