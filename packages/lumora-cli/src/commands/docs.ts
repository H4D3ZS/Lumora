/**
 * Documentation and Template Commands
 * Manage API documentation and starter templates
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import express from 'express';
import { DocGenerator, DocConfig } from '../services/doc-generator';
import { TemplateManager } from '../templates/template-manager';
import { TutorialManager } from '../services/tutorial-manager';

/**
 * Create docs command
 */
export function createDocsCommand(): Command {
  const docsCommand = new Command('docs')
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
      const spinner = ora('Generating documentation...').start();

      try {
        const projectPath = process.cwd();
        const inputPath = path.resolve(projectPath, options.input);
        const outputPath = path.resolve(projectPath, options.output);

        // Check if input directory exists
        if (!await fs.pathExists(inputPath)) {
          spinner.fail(chalk.red(`Input directory not found: ${inputPath}`));
          process.exit(1);
        }

        const config: DocConfig = {
          projectPath: inputPath,
          outputDir: outputPath,
          format: options.format,
          includePrivate: options.private,
          title: options.title,
        };

        const generator = new DocGenerator(config);
        await generator.generateDocs();

        spinner.succeed(chalk.green('Documentation generated successfully!'));
        console.log(chalk.gray(`  Output: ${outputPath}`));
        console.log(chalk.gray(`  Format: ${options.format}`));

      } catch (error: any) {
        spinner.fail(chalk.red('Failed to generate documentation'));
        console.error(chalk.red(error.message));
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
        console.log(chalk.yellow('Documentation directory not found. Generating...'));

        const spinner = ora('Generating documentation...').start();
        try {
          const config: DocConfig = {
            projectPath: path.join(projectPath, 'src'),
            outputDir: docsPath,
            format: 'html',
          };

          const generator = new DocGenerator(config);
          await generator.generateDocs();
          spinner.succeed(chalk.green('Documentation generated!'));
        } catch (error: any) {
          spinner.fail(chalk.red('Failed to generate documentation'));
          console.error(chalk.red(error.message));
          process.exit(1);
        }
      }

      // Start Express server
      const app = express();
      app.use(express.static(docsPath));

      app.get('/', (req, res) => {
        const indexPath = path.join(docsPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
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
        console.log(chalk.green('\n✓ Documentation server started!'));
        console.log(chalk.gray(`  Local: http://localhost:${port}`));
        console.log(chalk.gray(`  Press Ctrl+C to stop\n`));
      });
    });

  return docsCommand;
}

/**
 * Create template command
 */
export function createTemplateCommand(): Command {
  const templateCommand = new Command('template')
    .description('Manage project templates');

  const templateManager = new TemplateManager();

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
        console.log(chalk.yellow('No templates found'));
        return;
      }

      console.log(chalk.bold('\n📦 Available Templates:\n'));

      // Group by category
      const categories = new Map<string, typeof templates>();
      templates.forEach(template => {
        if (!categories.has(template.category)) {
          categories.set(template.category, []);
        }
        categories.get(template.category)!.push(template);
      });

      categories.forEach((temps, category) => {
        console.log(chalk.cyan.bold(`${category.toUpperCase()}:`));
        temps.forEach(template => {
          console.log(chalk.white(`  ${chalk.bold(template.id)}`));
          console.log(chalk.gray(`    ${template.description}`));
          if (template.features.length > 0) {
            console.log(chalk.gray(`    Features: ${template.features.join(', ')}`));
          }
          console.log('');
        });
      });

      console.log(chalk.gray('Use "lumora template create <template-id> <project-name>" to create a project\n'));
    });

  // lumora template info
  templateCommand
    .command('info <template-id>')
    .description('Show template details')
    .action(async (templateId: string) => {
      try {
        const template = templateManager.getTemplate(templateId);

        if (!template) {
          console.error(chalk.red(`\n✗ Template "${templateId}" not found\n`));
          process.exit(1);
        }

        console.log(chalk.bold(`\n📦 ${template.name}\n`));
        console.log(chalk.white(`ID: ${template.id}`));
        console.log(chalk.white(`Category: ${template.category}`));
        console.log(chalk.white(`Description: ${template.description}\n`));

        if (template.features.length > 0) {
          console.log(chalk.cyan('Features:'));
          template.features.forEach(feature => {
            console.log(chalk.gray(`  • ${feature}`));
          });
          console.log('');
        }

        const deps = Object.keys(template.dependencies || {});
        if (deps.length > 0) {
          console.log(chalk.cyan('Dependencies:'));
          deps.forEach(dep => {
            console.log(chalk.gray(`  • ${dep}@${template.dependencies![dep]}`));
          });
          console.log('');
        }

        console.log(chalk.cyan('Files:'));
        template.files.forEach(file => {
          console.log(chalk.gray(`  • ${file.path}`));
        });
        console.log('');

      } catch (error: any) {
        console.error(chalk.red(`\n✗ ${error.message}\n`));
        process.exit(1);
      }
    });

  // lumora template create
  templateCommand
    .command('create <template-id> <project-name>')
    .description('Create a new project from a template')
    .option('-p, --path <path>', 'Project directory', '.')
    .action(async (templateId: string, projectName: string, options) => {
      const spinner = ora(`Creating project from template "${templateId}"...`).start();

      try {
        // Validate template
        const template = templateManager.getTemplate(templateId);

        if (!template) {
          spinner.fail(chalk.red(`Template "${templateId}" not found`));
          process.exit(1);
        }

        spinner.text = `Creating "${projectName}" from ${template.name} template...`;

        const projectPath = path.resolve(process.cwd(), options.path, projectName);

        // Check if directory already exists
        if (await fs.pathExists(projectPath)) {
          spinner.fail(chalk.red(`Directory already exists: ${projectPath}`));
          process.exit(1);
        }

        // Create project from template
        await templateManager.createFromTemplate(templateId, projectPath, projectName);

        spinner.succeed(chalk.green(`Project "${projectName}" created successfully!`));

        console.log(chalk.bold(`\n📦 Project created at: ${chalk.cyan(projectPath)}\n`));
        console.log(chalk.white('Next steps:'));
        console.log(chalk.gray(`  cd ${projectName}`));
        console.log(chalk.gray('  npm install'));
        console.log(chalk.gray('  lumora start\n'));

        // Show template-specific instructions
        if (templateId === 'auth') {
          console.log(chalk.yellow('⚠️  Auth template requires backend setup'));
          console.log(chalk.gray('   Update API_URL in src/config.ts\n'));
        } else if (templateId === 'camera-app') {
          console.log(chalk.yellow('⚠️  Camera requires @lumora/camera module'));
          console.log(chalk.gray('   Run: lumora plugin add @lumora/camera\n'));
        } else if (templateId === 'weather-app') {
          console.log(chalk.yellow('⚠️  Weather app requires API key'));
          console.log(chalk.gray('   Get free key at: https://openweathermap.org/api\n'));
        }

      } catch (error: any) {
        spinner.fail(chalk.red('Failed to create project'));
        console.error(chalk.red(error.message));
        process.exit(1);
      }
    });

  return templateCommand;
}

/**
 * Create tutorial command
 */
export function createTutorialCommand(): Command {
  const tutorialCommand = new Command('tutorial')
    .description('Interactive tutorials for learning Lumora');

  const tutorialManager = new TutorialManager();

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
        console.log(chalk.yellow('No tutorials found'));
        return;
      }

      console.log(chalk.bold('\n📚 Available Tutorials:\n'));

      // Group by category
      const categories = new Map<string, typeof tutorials>();
      tutorials.forEach(tutorial => {
        if (!categories.has(tutorial.category)) {
          categories.set(tutorial.category, []);
        }
        categories.get(tutorial.category)!.push(tutorial);
      });

      categories.forEach((tuts, category) => {
        console.log(chalk.cyan.bold(`${category.toUpperCase()}:`));
        tuts.forEach(tutorial => {
          console.log(chalk.white(`  ${chalk.bold(tutorial.id)}`));
          console.log(chalk.gray(`    ${tutorial.description}`));
          console.log(chalk.gray(`    Difficulty: ${tutorial.difficulty} | Duration: ~${tutorial.duration} min`));
          console.log('');
        });
      });

      console.log(chalk.gray('Use "lumora tutorial start <tutorial-id>" to begin a tutorial\n'));
    });

  // lumora tutorial start
  tutorialCommand
    .command('start <tutorial-id>')
    .description('Start an interactive tutorial')
    .action(async (tutorialId: string) => {
      try {
        await tutorialManager.startTutorial(tutorialId);
      } catch (error: any) {
        console.error(chalk.red(`\n✗ ${error.message}\n`));
        process.exit(1);
      }
    });

  // lumora tutorial info
  tutorialCommand
    .command('info <tutorial-id>')
    .description('Show tutorial details')
    .action(async (tutorialId: string) => {
      try {
        const tutorial = tutorialManager.getTutorial(tutorialId);

        if (!tutorial) {
          console.error(chalk.red(`\n✗ Tutorial "${tutorialId}" not found\n`));
          process.exit(1);
        }

        console.log(chalk.bold(`\n📚 ${tutorial.title}\n`));
        console.log(chalk.white(tutorial.description));
        console.log('');
        console.log(chalk.white(`Category: ${tutorial.category}`));
        console.log(chalk.white(`Difficulty: ${tutorial.difficulty}`));
        console.log(chalk.white(`Duration: ~${tutorial.duration} minutes`));
        console.log(chalk.white(`Steps: ${tutorial.steps.length}`));
        console.log('');

        if (tutorial.prerequisites.length > 0) {
          console.log(chalk.cyan('Prerequisites:'));
          tutorial.prerequisites.forEach(prereq => {
            console.log(chalk.gray(`  • ${prereq}`));
          });
          console.log('');
        }

        console.log(chalk.cyan('What You\'ll Learn:'));
        tutorial.steps.forEach((step, index) => {
          console.log(chalk.gray(`  ${index + 1}. ${step.title}`));
        });
        console.log('');

        console.log(chalk.gray(`Start with: lumora tutorial start ${tutorialId}\n`));

      } catch (error: any) {
        console.error(chalk.red(`\n✗ ${error.message}\n`));
        process.exit(1);
      }
    });

  return tutorialCommand;
}
