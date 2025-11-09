const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

/**
 * CreateApp - Scaffolds a new Lumora project with template files
 */
class CreateApp {
  constructor() {
    // Register Handlebars helpers for conditional rendering
    Handlebars.registerHelper('if_bloc', function(options) {
      return this.adapter === 'bloc' ? options.fn(this) : options.inverse(this);
    });
    
    Handlebars.registerHelper('if_riverpod', function(options) {
      return this.adapter === 'riverpod' ? options.fn(this) : options.inverse(this);
    });
    
    Handlebars.registerHelper('if_provider', function(options) {
      return this.adapter === 'provider' ? options.fn(this) : options.inverse(this);
    });
    
    Handlebars.registerHelper('if_getx', function(options) {
      return this.adapter === 'getx' ? options.fn(this) : options.inverse(this);
    });
  }

  /**
   * Create a new Lumora project
   * @param {string} appName - Name of the application
   * @param {string} adapter - State management adapter (bloc, riverpod, provider, getx)
   * @param {string} targetDir - Target directory (defaults to current directory)
   * @returns {string[]} - List of created files
   */
  createProject(appName, adapter, targetDir = process.cwd()) {
    const startTime = Date.now();
    
    // Validate app name
    if (!appName || !/^[a-z][a-z0-9_]*$/.test(appName)) {
      throw new Error('App name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores');
    }

    // Validate adapter
    const validAdapters = ['bloc', 'riverpod', 'provider', 'getx'];
    if (!validAdapters.includes(adapter)) {
      throw new Error(`Invalid adapter: ${adapter}. Valid adapters: ${validAdapters.join(', ')}`);
    }

    // Create project directory
    const projectDir = path.join(targetDir, appName);
    if (fs.existsSync(projectDir)) {
      throw new Error(`Directory already exists: ${projectDir}`);
    }

    const createdFiles = [];

    try {
      // Create directory structure
      const directories = [
        projectDir,
        path.join(projectDir, 'web'),
        path.join(projectDir, 'web', 'src'),
        path.join(projectDir, 'web', 'schema'),
        path.join(projectDir, 'mobile'),
        path.join(projectDir, 'mobile', 'lib'),
        path.join(projectDir, 'mobile', 'lib', 'features'),
      ];

      directories.forEach(dir => {
        fs.mkdirSync(dir, { recursive: true });
      });

      // Template context
      const context = {
        appName,
        adapter,
      };

      // Get template directory
      const templateDir = path.join(__dirname, '..', 'templates', 'create-app');

      // Copy and process template files
      const templateFiles = [
        { src: 'web/src/App.tsx', dest: 'web/src/App.tsx', process: false },
        { src: 'web/package.json.template', dest: 'web/package.json', process: true },
        { src: 'mobile/pubspec.yaml.template', dest: 'mobile/pubspec.yaml', process: true },
        { src: 'mobile/lib/main.dart.template', dest: 'mobile/lib/main.dart', process: true },
        { src: 'kiro.config.json.template', dest: 'kiro.config.json', process: true },
        { src: 'README.md.template', dest: 'README.md', process: true },
        { src: '.gitignore.template', dest: '.gitignore', process: false },
      ];

      templateFiles.forEach(({ src, dest, process: shouldProcess }) => {
        const srcPath = path.join(templateDir, src);
        const destPath = path.join(projectDir, dest);

        if (!fs.existsSync(srcPath)) {
          console.warn(`Warning: Template file not found: ${srcPath}`);
          return;
        }

        let content = fs.readFileSync(srcPath, 'utf8');

        if (shouldProcess) {
          // Process with Handlebars
          const template = Handlebars.compile(content);
          content = template(context);
        }

        fs.writeFileSync(destPath, content, 'utf8');
        createdFiles.push(destPath);
      });

      // Create empty schema directory placeholder
      const schemaReadme = path.join(projectDir, 'web', 'schema', '.gitkeep');
      fs.writeFileSync(schemaReadme, '# Generated schemas will be placed here\n', 'utf8');
      createdFiles.push(schemaReadme);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      if (duration > 30) {
        console.warn(`Warning: Scaffolding took ${duration}s (target: <30s)`);
      }

      return createdFiles;

    } catch (error) {
      // Clean up on error
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
      }
      throw error;
    }
  }

  /**
   * Get next steps message for the user
   * @param {string} appName - Name of the application
   * @returns {string} - Next steps message
   */
  getNextStepsMessage(appName) {
    return `
🎉 Project created successfully!

Next steps:

  1. Navigate to your project:
     cd ${appName}

  2. Install dependencies:
     npm install
     cd mobile && flutter pub get && cd ..

  3. Start the dev proxy (in a new terminal):
     cd ../../tools/dev-proxy
     npm start

  4. Start development (in another terminal):
     cd ${appName}
     npm run dev

  5. Run your Flutter app (in another terminal):
     cd ${appName}/mobile
     flutter run

  6. Scan the QR code from the dev-proxy to connect your device

Happy coding! 🚀
`;
  }
}

module.exports = CreateApp;
