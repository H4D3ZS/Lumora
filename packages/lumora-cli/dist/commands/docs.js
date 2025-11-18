"use strict";
/**
 * Documentation and Template Commands
 * Manage API documentation and starter templates
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocsCommand = createDocsCommand;
exports.createTemplateCommand = createTemplateCommand;
exports.createTutorialCommand = createTutorialCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const express_1 = __importDefault(require("express"));
const doc_generator_1 = require("../services/doc-generator");
const template_manager_1 = require("../templates/template-manager");
const tutorial_manager_1 = require("../services/tutorial-manager");
/**
 * Create docs command
 */
function createDocsCommand() {
    const docsCommand = new commander_1.Command('docs')
        .description('Generate and serve API documentation');
    // lumora docs generate
    docsCommand
        .command('generate')
        .description('Generate API documentation from source files')
        .option('-i, --input <path>', 'Input directory (default: src/)', 'src/')
        .option('-o, --output <path>', 'Output directory (default: docs/)', 'docs/')
        .option('-f, --format <format>', 'Output format: markdown, html, json', 'markdown')
        .option('--title <title>', 'Documentation title', 'API Documentation')
        .option('--no-private', 'Exclude private members')
        .action(async (options) => {
        const spinner = (0, ora_1.default)('Generating documentation...').start();
        try {
            const projectPath = process.cwd();
            const inputPath = path.resolve(projectPath, options.input);
            const outputPath = path.resolve(projectPath, options.output);
            // Check if input directory exists
            if (!await fs.pathExists(inputPath)) {
                spinner.fail(chalk_1.default.red(`Input directory not found: ${inputPath}`));
                process.exit(1);
            }
            const config = {
                projectPath: inputPath,
                outputDir: outputPath,
                format: options.format,
                includePrivate: options.private,
                title: options.title,
            };
            const generator = new doc_generator_1.DocGenerator(config);
            await generator.generateDocs();
            spinner.succeed(chalk_1.default.green('Documentation generated successfully!'));
            console.log(chalk_1.default.gray(`  Output: ${outputPath}`));
            console.log(chalk_1.default.gray(`  Format: ${options.format}`));
        }
        catch (error) {
            spinner.fail(chalk_1.default.red('Failed to generate documentation'));
            console.error(chalk_1.default.red(error.message));
            process.exit(1);
        }
    });
    // lumora docs serve
    docsCommand
        .command('serve')
        .description('Serve documentation locally')
        .option('-p, --port <port>', 'Port to serve on', '8080')
        .option('-d, --dir <path>', 'Documentation directory', 'docs/')
        .action(async (options) => {
        const projectPath = process.cwd();
        const docsPath = path.resolve(projectPath, options.dir);
        // Check if docs directory exists
        if (!await fs.pathExists(docsPath)) {
            console.log(chalk_1.default.yellow('Documentation directory not found. Generating...'));
            const spinner = (0, ora_1.default)('Generating documentation...').start();
            try {
                const config = {
                    projectPath: path.join(projectPath, 'src'),
                    outputDir: docsPath,
                    format: 'html',
                };
                const generator = new doc_generator_1.DocGenerator(config);
                await generator.generateDocs();
                spinner.succeed(chalk_1.default.green('Documentation generated!'));
            }
            catch (error) {
                spinner.fail(chalk_1.default.red('Failed to generate documentation'));
                console.error(chalk_1.default.red(error.message));
                process.exit(1);
            }
        }
        // Start Express server
        const app = (0, express_1.default)();
        app.use(express_1.default.static(docsPath));
        app.get('/', (req, res) => {
            const indexPath = path.join(docsPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            }
            else {
                res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>API Documentation</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; padding: 40px; }
                h1 { color: #333; }
                ul { list-style: none; padding: 0; }
                li { margin: 10px 0; }
                a { color: #007bff; text-decoration: none; }
                a:hover { text-decoration: underline; }
              </style>
            </head>
            <body>
              <h1>API Documentation</h1>
              <ul id="files"></ul>
              <script>
                fetch('/api/files')
                  .then(r => r.json())
                  .then(files => {
                    const ul = document.getElementById('files');
                    files.forEach(file => {
                      const li = document.createElement('li');
                      const a = document.createElement('a');
                      a.href = file;
                      a.textContent = file;
                      li.appendChild(a);
                      ul.appendChild(li);
                    });
                  });
              </script>
            </body>
            </html>
          `);
            }
        });
        app.get('/api/files', async (req, res) => {
            const files = await fs.readdir(docsPath);
            const docFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.html'));
            res.json(docFiles);
        });
        const port = parseInt(options.port);
        app.listen(port, () => {
            console.log(chalk_1.default.green('\n✓ Documentation server started!'));
            console.log(chalk_1.default.gray(`  Local: http://localhost:${port}`));
            console.log(chalk_1.default.gray(`  Press Ctrl+C to stop\n`));
        });
    });
    return docsCommand;
}
/**
 * Create template command
 */
function createTemplateCommand() {
    const templateCommand = new commander_1.Command('template')
        .description('Manage project templates');
    const templateManager = new template_manager_1.TemplateManager();
    // lumora template list
    templateCommand
        .command('list')
        .description('List available templates')
        .option('-c, --category <category>', 'Filter by category')
        .action(async (options) => {
        let templates = templateManager.listTemplates();
        // Filter by category if specified
        if (options.category) {
            templates = templates.filter(t => t.category === options.category);
        }
        if (templates.length === 0) {
            console.log(chalk_1.default.yellow('No templates found'));
            return;
        }
        console.log(chalk_1.default.bold('\n📦 Available Templates:\n'));
        // Group by category
        const categories = new Map();
        templates.forEach(template => {
            if (!categories.has(template.category)) {
                categories.set(template.category, []);
            }
            categories.get(template.category).push(template);
        });
        categories.forEach((temps, category) => {
            console.log(chalk_1.default.cyan.bold(`${category.toUpperCase()}:`));
            temps.forEach(template => {
                console.log(chalk_1.default.white(`  ${chalk_1.default.bold(template.id)}`));
                console.log(chalk_1.default.gray(`    ${template.description}`));
                if (template.features.length > 0) {
                    console.log(chalk_1.default.gray(`    Features: ${template.features.join(', ')}`));
                }
                console.log('');
            });
        });
        console.log(chalk_1.default.gray('Use "lumora template create <template-id> <project-name>" to create a project\n'));
    });
    // lumora template info
    templateCommand
        .command('info <template-id>')
        .description('Show template details')
        .action(async (templateId) => {
        try {
            const template = templateManager.getTemplate(templateId);
            if (!template) {
                console.error(chalk_1.default.red(`\n✗ Template "${templateId}" not found\n`));
                process.exit(1);
            }
            console.log(chalk_1.default.bold(`\n📦 ${template.name}\n`));
            console.log(chalk_1.default.white(`ID: ${template.id}`));
            console.log(chalk_1.default.white(`Category: ${template.category}`));
            console.log(chalk_1.default.white(`Description: ${template.description}\n`));
            if (template.features.length > 0) {
                console.log(chalk_1.default.cyan('Features:'));
                template.features.forEach(feature => {
                    console.log(chalk_1.default.gray(`  • ${feature}`));
                });
                console.log('');
            }
            const deps = Object.keys(template.dependencies || {});
            if (deps.length > 0) {
                console.log(chalk_1.default.cyan('Dependencies:'));
                deps.forEach(dep => {
                    console.log(chalk_1.default.gray(`  • ${dep}@${template.dependencies[dep]}`));
                });
                console.log('');
            }
            console.log(chalk_1.default.cyan('Files:'));
            template.files.forEach(file => {
                console.log(chalk_1.default.gray(`  • ${file.path}`));
            });
            console.log('');
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n✗ ${error.message}\n`));
            process.exit(1);
        }
    });
    // lumora template create
    templateCommand
        .command('create <template-id> <project-name>')
        .description('Create a new project from a template')
        .option('-p, --path <path>', 'Project directory', '.')
        .action(async (templateId, projectName, options) => {
        const spinner = (0, ora_1.default)(`Creating project from template "${templateId}"...`).start();
        try {
            // Validate template
            const template = templateManager.getTemplate(templateId);
            if (!template) {
                spinner.fail(chalk_1.default.red(`Template "${templateId}" not found`));
                process.exit(1);
            }
            spinner.text = `Creating "${projectName}" from ${template.name} template...`;
            const projectPath = path.resolve(process.cwd(), options.path, projectName);
            // Check if directory already exists
            if (await fs.pathExists(projectPath)) {
                spinner.fail(chalk_1.default.red(`Directory already exists: ${projectPath}`));
                process.exit(1);
            }
            // Create project from template
            await templateManager.createFromTemplate(templateId, projectPath, projectName);
            spinner.succeed(chalk_1.default.green(`Project "${projectName}" created successfully!`));
            console.log(chalk_1.default.bold(`\n📦 Project created at: ${chalk_1.default.cyan(projectPath)}\n`));
            console.log(chalk_1.default.white('Next steps:'));
            console.log(chalk_1.default.gray(`  cd ${projectName}`));
            console.log(chalk_1.default.gray('  npm install'));
            console.log(chalk_1.default.gray('  lumora start\n'));
            // Show template-specific instructions
            if (templateId === 'auth') {
                console.log(chalk_1.default.yellow('⚠️  Auth template requires backend setup'));
                console.log(chalk_1.default.gray('   Update API_URL in src/config.ts\n'));
            }
            else if (templateId === 'camera-app') {
                console.log(chalk_1.default.yellow('⚠️  Camera requires @lumora/camera module'));
                console.log(chalk_1.default.gray('   Run: lumora plugin add @lumora/camera\n'));
            }
            else if (templateId === 'weather-app') {
                console.log(chalk_1.default.yellow('⚠️  Weather app requires API key'));
                console.log(chalk_1.default.gray('   Get free key at: https://openweathermap.org/api\n'));
            }
        }
        catch (error) {
            spinner.fail(chalk_1.default.red('Failed to create project'));
            console.error(chalk_1.default.red(error.message));
            process.exit(1);
        }
    });
    return templateCommand;
}
/**
 * Create tutorial command
 */
function createTutorialCommand() {
    const tutorialCommand = new commander_1.Command('tutorial')
        .description('Interactive tutorials for learning Lumora');
    const tutorialManager = new tutorial_manager_1.TutorialManager();
    // lumora tutorial list
    tutorialCommand
        .command('list')
        .description('List available tutorials')
        .option('-c, --category <category>', 'Filter by category')
        .action(async (options) => {
        let tutorials = tutorialManager.listTutorials();
        // Filter by category if specified
        if (options.category) {
            tutorials = tutorials.filter(t => t.category === options.category);
        }
        if (tutorials.length === 0) {
            console.log(chalk_1.default.yellow('No tutorials found'));
            return;
        }
        console.log(chalk_1.default.bold('\n📚 Available Tutorials:\n'));
        // Group by category
        const categories = new Map();
        tutorials.forEach(tutorial => {
            if (!categories.has(tutorial.category)) {
                categories.set(tutorial.category, []);
            }
            categories.get(tutorial.category).push(tutorial);
        });
        categories.forEach((tuts, category) => {
            console.log(chalk_1.default.cyan.bold(`${category.toUpperCase()}:`));
            tuts.forEach(tutorial => {
                console.log(chalk_1.default.white(`  ${chalk_1.default.bold(tutorial.id)}`));
                console.log(chalk_1.default.gray(`    ${tutorial.description}`));
                console.log(chalk_1.default.gray(`    Difficulty: ${tutorial.difficulty} | Duration: ~${tutorial.duration} min`));
                console.log('');
            });
        });
        console.log(chalk_1.default.gray('Use "lumora tutorial start <tutorial-id>" to begin a tutorial\n'));
    });
    // lumora tutorial start
    tutorialCommand
        .command('start <tutorial-id>')
        .description('Start an interactive tutorial')
        .action(async (tutorialId) => {
        try {
            await tutorialManager.startTutorial(tutorialId);
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n✗ ${error.message}\n`));
            process.exit(1);
        }
    });
    // lumora tutorial info
    tutorialCommand
        .command('info <tutorial-id>')
        .description('Show tutorial details')
        .action(async (tutorialId) => {
        try {
            const tutorial = tutorialManager.getTutorial(tutorialId);
            if (!tutorial) {
                console.error(chalk_1.default.red(`\n✗ Tutorial "${tutorialId}" not found\n`));
                process.exit(1);
            }
            console.log(chalk_1.default.bold(`\n📚 ${tutorial.title}\n`));
            console.log(chalk_1.default.white(tutorial.description));
            console.log('');
            console.log(chalk_1.default.white(`Category: ${tutorial.category}`));
            console.log(chalk_1.default.white(`Difficulty: ${tutorial.difficulty}`));
            console.log(chalk_1.default.white(`Duration: ~${tutorial.duration} minutes`));
            console.log(chalk_1.default.white(`Steps: ${tutorial.steps.length}`));
            console.log('');
            if (tutorial.prerequisites.length > 0) {
                console.log(chalk_1.default.cyan('Prerequisites:'));
                tutorial.prerequisites.forEach(prereq => {
                    console.log(chalk_1.default.gray(`  • ${prereq}`));
                });
                console.log('');
            }
            console.log(chalk_1.default.cyan('What You\'ll Learn:'));
            tutorial.steps.forEach((step, index) => {
                console.log(chalk_1.default.gray(`  ${index + 1}. ${step.title}`));
            });
            console.log('');
            console.log(chalk_1.default.gray(`Start with: lumora tutorial start ${tutorialId}\n`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`\n✗ ${error.message}\n`));
            process.exit(1);
        }
    });
    return tutorialCommand;
}
//# sourceMappingURL=docs.js.map