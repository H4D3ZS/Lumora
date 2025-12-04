# Lumora Framework Structure Updates

To ensure Lumora generates a properly structured framework for both Flutter and TypeScript/Node.js, the following enhancements have been made to the `init` command.

## 1. Vite Integration for React/TypeScript

**Problem:**
Previously, `lumora init` created a barebones React structure (`src/App.tsx`) without a bundler or entry point. This meant the React code couldn't be run independently using standard tools, and users were reliant solely on `lumora start`'s magic preview.

**Solution:**
Updated `packages/lumora-cli/src/commands/init.ts` to scaffold a complete **Vite** project:
- **`vite.config.ts`**: Standard Vite configuration with React plugin.
- **`index.html`**: Root HTML file pointing to the entry module.
- **`src/main.tsx`**: Entry point that mounts the React app to the DOM.
- **`package.json`**: Added `vite`, `@vitejs/plugin-react` dependencies and `dev`, `build`, `preview` scripts.

**Result:**
Users can now run `npm run dev` to start a standard, robust React development server. This provides a "proper framework" experience for the web side, supporting all standard React features (HMR, CSS modules, npm packages).

## 2. Bidirectional Workflow

The framework now supports two complementary workflows:

1.  **Magic Mode (`lumora start`)**:
    - Runs the custom Lumora Web Preview and Dev Proxy.
    - Enables real-time **React ↔ Flutter** conversion.
    - Best for: Cross-platform development and previewing.

2.  **Standard Mode (`npm run dev` / `flutter run`)**:
    - **Web**: Runs Vite. Best for pure React development or debugging web-specific issues.
    - **Mobile**: Runs standard Flutter tooling. Best for native debugging and deployment.

## 3. Updated Documentation

The generated `README.md` has been updated to clearly explain these workflows and the new project structure.

## Conclusion

Lumora projects are now fully structured, production-ready environments for both:
- **TypeScript/Node.js**: via Vite and standard React tooling.
- **Flutter**: via standard Flutter project structure (`lib/`, `android/`, `ios/`).

This ensures that "everything works properly" regardless of which side of the bridge the developer is working on.
