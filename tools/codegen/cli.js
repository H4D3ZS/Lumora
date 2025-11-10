#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const TSXParser = require('./src/tsx-parser');
const TSXToIR = require('./src/tsx-to-ir');
const IRToFlutter = require('./src/ir-to-flutter');
const FlutterToIR = require('./src/flutter-to-ir');
const IRToReact = require('./src/ir-to-react');
const chokidar = require('chokidar');

const program = new Command();

program
  .name('kiro')
  .description('Lumora code generation tool for converting TSX to JSON schemas and generating Dart code')
  .version('1.0.0');

/**
 * tsx2ir command - Convert TSX files to Lumora IR
 */
program
  .command('tsx2ir')
  .description('Convert TSX file to Lumora IR (Intermediate Representation)')
  .argument('<input>', 'Input TSX file path')
  .argument('<output>', 'Output JSON file path')
  .option('-w, --watch', 'Watch for file changes and regenerate automatically')
  .action(async (input, output, options) => {
    try {
      // Validate input file exists and is readable
      if (!fs.existsSync(input)) {
        console.error(`✗ Error: Input file not found: ${input}`);
        process.exit(3);
      }

      try {
        fs.accessSync(input, fs.constants.R_OK);
      } catch (error) {
        console.error(`✗ Error: Input file is not readable: ${input}`);
        process.exit(3);
      }

      // Validate output directory is writable
      const outputDir = path.dirname(output);
      if (!fs.existsSync(outputDir)) {
        try {
          fs.mkdirSync(outputDir, { recursive: true });
        } catch (error) {
          console.error(`✗ Error: Cannot create output directory: ${outputDir}`);
          console.error(`  ${error.message}`);
          process.exit(3);
        }
      }

      try {
        fs.accessSync(outputDir, fs.constants.W_OK);
      } catch (error) {
        console.error(`✗ Error: Output directory is not writable: ${outputDir}`);
        process.exit(3);
      }

      // Convert TSX to IR
      const convertFile = () => {
        const parser = new TSXToIR();
        
        try {
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] Converting ${input} to Lumora IR: ${output}...`);
          
          parser.convertFileToIR(input, output);
          
        } catch (error) {
          // Handle Babel parse errors
          if (error.message.includes('SyntaxError') || error.message.includes('Unexpected token')) {
            console.error(`✗ Parse Error: ${error.message}`);
            
            // Try to extract line and column information
            const match = error.message.match(/\((\d+):(\d+)\)/);
            if (match) {
              const line = match[1];
              const column = match[2];
              console.error(`  at line ${line}, column ${column}`);
            }
            
            process.exit(2);
          }
          
          // Handle other errors
          if (error.message.includes('No JSX element found')) {
            console.error(`✗ Generation Error: ${error.message}`);
            process.exit(4);
          }
          
          // Generic error
          console.error(`✗ Error: ${error.message}`);
          process.exit(4);
        }
      };

      // Initial conversion
      convertFile();

      // Watch mode
      if (options.watch) {
        console.log(`\n👀 Watching ${input} for changes... (Press Ctrl+C to stop)`);
        
        const watcher = chokidar.watch(input, {
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 100,
            pollInterval: 100
          }
        });

        watcher.on('change', () => {
          console.log(''); // Empty line for readability
          convertFile();
        });

        watcher.on('error', (error) => {
          console.error(`✗ Watch Error: ${error.message}`);
        });

        // Keep process alive
        process.on('SIGINT', () => {
          console.log('\n\n👋 Stopping watch mode...');
          watcher.close();
          process.exit(0);
        });
      } else {
        // Exit successfully if not in watch mode
        process.exit(0);
      }

    } catch (error) {
      console.error(`✗ Unexpected Error: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * tsx2schema command - Convert TSX files to JSON schemas (legacy)
 */
program
  .command('tsx2schema')
  .description('Convert TSX file to JSON UI schema (legacy - use tsx2ir for new projects)')
  .argument('<input>', 'Input TSX file path')
  .argument('<output>', 'Output JSON file path')
  .option('-w, --watch', 'Watch for file changes and regenerate automatically')
  .action(async (input, output, options) => {
    try {
      // Validate input file exists and is readable
      if (!fs.existsSync(input)) {
        console.error(`✗ Error: Input file not found: ${input}`);
        process.exit(3);
      }

      try {
        fs.accessSync(input, fs.constants.R_OK);
      } catch (error) {
        console.error(`✗ Error: Input file is not readable: ${input}`);
        process.exit(3);
      }

      // Validate output directory is writable
      const outputDir = path.dirname(output);
      if (!fs.existsSync(outputDir)) {
        try {
          fs.mkdirSync(outputDir, { recursive: true });
        } catch (error) {
          console.error(`✗ Error: Cannot create output directory: ${outputDir}`);
          console.error(`  ${error.message}`);
          process.exit(3);
        }
      }

      try {
        fs.accessSync(outputDir, fs.constants.W_OK);
      } catch (error) {
        console.error(`✗ Error: Output directory is not writable: ${outputDir}`);
        process.exit(3);
      }

      // Convert TSX to schema
      const convertFile = () => {
        const parser = new TSXParser();
        
        try {
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] Converting ${input} to ${output}...`);
          
          parser.convertFileToSchema(input, output);
          
        } catch (error) {
          // Handle Babel parse errors
          if (error.message.includes('SyntaxError') || error.message.includes('Unexpected token')) {
            console.error(`✗ Parse Error: ${error.message}`);
            
            // Try to extract line and column information
            const match = error.message.match(/\((\d+):(\d+)\)/);
            if (match) {
              const line = match[1];
              const column = match[2];
              console.error(`  at line ${line}, column ${column}`);
            }
            
            process.exit(2);
          }
          
          // Handle other errors
          if (error.message.includes('No JSX element found')) {
            console.error(`✗ Generation Error: ${error.message}`);
            process.exit(4);
          }
          
          // Generic error
          console.error(`✗ Error: ${error.message}`);
          process.exit(4);
        }
      };

      // Initial conversion
      convertFile();

      // Watch mode
      if (options.watch) {
        console.log(`\n👀 Watching ${input} for changes... (Press Ctrl+C to stop)`);
        
        const watcher = chokidar.watch(input, {
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 100,
            pollInterval: 100
          }
        });

        watcher.on('change', () => {
          console.log(''); // Empty line for readability
          convertFile();
        });

        watcher.on('error', (error) => {
          console.error(`✗ Watch Error: ${error.message}`);
        });

        // Keep process alive
        process.on('SIGINT', () => {
          console.log('\n\n👋 Stopping watch mode...');
          watcher.close();
          process.exit(0);
        });
      } else {
        // Exit successfully if not in watch mode
        process.exit(0);
      }

    } catch (error) {
      console.error(`✗ Unexpected Error: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * ir2flutter command - Convert Lumora IR to Flutter Dart code
 */
program
  .command('ir2flutter')
  .description('Convert Lumora IR to Flutter/Dart code')
  .argument('<input>', 'Input IR JSON file path')
  .argument('<output>', 'Output Dart file path')
  .option('-m, --mapping <path>', 'Widget mapping file path', path.join(__dirname, 'ui-mapping.json'))
  .action(async (input, output, options) => {
    try {
      // Validate input file exists
      if (!fs.existsSync(input)) {
        console.error(`✗ Error: Input IR file not found: ${input}`);
        process.exit(3);
      }

      // Validate mapping file exists
      if (!fs.existsSync(options.mapping)) {
        console.error(`✗ Error: Widget mapping file not found: ${options.mapping}`);
        process.exit(3);
      }

      // Validate output directory is writable
      const outputDir = path.dirname(output);
      if (!fs.existsSync(outputDir)) {
        try {
          fs.mkdirSync(outputDir, { recursive: true });
        } catch (error) {
          console.error(`✗ Error: Cannot create output directory: ${outputDir}`);
          console.error(`  ${error.message}`);
          process.exit(3);
        }
      }

      console.log(`\n🚀 Converting Lumora IR to Flutter...`);
      console.log(`   Input: ${input}`);
      console.log(`   Output: ${output}`);
      console.log(`   Mapping: ${options.mapping}\n`);

      // Convert IR to Flutter
      const converter = new IRToFlutter();
      converter.convertFileToFlutter(input, output, options.mapping);

      console.log('\n✓ Conversion complete!\n');
      process.exit(0);

    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
      if (error.stack && process.env.DEBUG) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
      process.exit(1);
    }
  });

/**
 * create-app command - Scaffold a new Lumora project
 */
program
  .command('create-app')
  .description('Create a new Lumora project with template files')
  .argument('<app-name>', 'Name of the application (lowercase, underscores allowed)')
  .option('-a, --adapter <adapter>', 'State management adapter (bloc, riverpod, provider, getx)', 'bloc')
  .option('-d, --dir <directory>', 'Target directory (defaults to current directory)', process.cwd())
  .action(async (appName, options) => {
    try {
      const CreateApp = require('./src/create-app');
      
      // Validate adapter choice
      const validAdapters = ['bloc', 'riverpod', 'provider', 'getx'];
      if (!validAdapters.includes(options.adapter)) {
        console.error(`✗ Error: Invalid adapter: ${options.adapter}`);
        console.error(`  Valid adapters: ${validAdapters.join(', ')}`);
        process.exit(1);
      }

      console.log(`\n🚀 Creating Lumora project: ${appName}`);
      console.log(`   Adapter: ${options.adapter}`);
      console.log(`   Directory: ${options.dir}\n`);

      const creator = new CreateApp();
      const createdFiles = creator.createProject(appName, options.adapter, options.dir);

      console.log('✓ Project scaffolded successfully!\n');
      console.log(`Created ${createdFiles.length} files:\n`);
      
      // Show relative paths from target directory
      const projectDir = path.join(options.dir, appName);
      createdFiles.slice(0, 10).forEach(file => {
        const relativePath = path.relative(projectDir, file);
        console.log(`  ✓ ${relativePath}`);
      });
      
      if (createdFiles.length > 10) {
        console.log(`  ... and ${createdFiles.length - 10} more files`);
      }

      // Show next steps
      console.log(creator.getNextStepsMessage(appName));

      process.exit(0);

    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
      if (error.stack && process.env.DEBUG) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
      process.exit(1);
    }
  });

/**
 * flutter2ir command - Convert Flutter Dart code to Lumora IR
 */
program
  .command('flutter2ir')
  .description('Convert Flutter/Dart file to Lumora IR (Intermediate Representation)')
  .argument('<input>', 'Input Dart file path')
  .argument('<output>', 'Output JSON file path')
  .action(async (input, output) => {
    try {
      // Validate input file exists
      if (!fs.existsSync(input)) {
        console.error(`✗ Error: Input file not found: ${input}`);
        process.exit(3);
      }

      // Validate output directory is writable
      const outputDir = path.dirname(output);
      if (!fs.existsSync(outputDir)) {
        try {
          fs.mkdirSync(outputDir, { recursive: true });
        } catch (error) {
          console.error(`✗ Error: Cannot create output directory: ${outputDir}`);
          console.error(`  ${error.message}`);
          process.exit(3);
        }
      }

      console.log(`\n🚀 Converting Flutter to Lumora IR...`);
      console.log(`   Input: ${input}`);
      console.log(`   Output: ${output}\n`);

      // Convert Flutter to IR
      const converter = new FlutterToIR();
      converter.convertFileToIR(input, output);

      console.log('\n✓ Conversion complete!\n');
      process.exit(0);

    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
      if (error.stack && process.env.DEBUG) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
      process.exit(1);
    }
  });

/**
 * ir2react command - Convert Lumora IR to React TypeScript code
 */
program
  .command('ir2react')
  .description('Convert Lumora IR to React/TypeScript code')
  .argument('<input>', 'Input IR JSON file path')
  .argument('<output>', 'Output TypeScript file path')
  .option('-m, --mapping <path>', 'Widget mapping file path', path.join(__dirname, 'ui-mapping.json'))
  .action(async (input, output, options) => {
    try {
      // Validate input file exists
      if (!fs.existsSync(input)) {
        console.error(`✗ Error: Input IR file not found: ${input}`);
        process.exit(3);
      }

      // Validate mapping file exists
      if (!fs.existsSync(options.mapping)) {
        console.error(`✗ Error: Widget mapping file not found: ${options.mapping}`);
        process.exit(3);
      }

      // Validate output directory is writable
      const outputDir = path.dirname(output);
      if (!fs.existsSync(outputDir)) {
        try {
          fs.mkdirSync(outputDir, { recursive: true });
        } catch (error) {
          console.error(`✗ Error: Cannot create output directory: ${outputDir}`);
          console.error(`  ${error.message}`);
          process.exit(3);
        }
      }

      console.log(`\n🚀 Converting Lumora IR to React...`);
      console.log(`   Input: ${input}`);
      console.log(`   Output: ${output}`);
      console.log(`   Mapping: ${options.mapping}\n`);

      // Convert IR to React
      const converter = new IRToReact();
      converter.convertFileToReact(input, output, options.mapping);

      console.log('\n✓ Conversion complete!\n');
      process.exit(0);

    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
      if (error.stack && process.env.DEBUG) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
      process.exit(1);
    }
  });

/**
 * flutter2react command - Convert Flutter Dart code directly to React TypeScript
 */
program
  .command('flutter2react')
  .description('Convert Flutter/Dart file directly to React/TypeScript code')
  .argument('<input>', 'Input Dart file path')
  .argument('<output>', 'Output TypeScript file path')
  .option('-m, --mapping <path>', 'Widget mapping file path', path.join(__dirname, 'ui-mapping.json'))
  .action(async (input, output, options) => {
    try {
      // Validate input file exists
      if (!fs.existsSync(input)) {
        console.error(`✗ Error: Input file not found: ${input}`);
        process.exit(3);
      }

      // Validate mapping file exists
      if (!fs.existsSync(options.mapping)) {
        console.error(`✗ Error: Widget mapping file not found: ${options.mapping}`);
        process.exit(3);
      }

      // Validate output directory is writable
      const outputDir = path.dirname(output);
      if (!fs.existsSync(outputDir)) {
        try {
          fs.mkdirSync(outputDir, { recursive: true });
        } catch (error) {
          console.error(`✗ Error: Cannot create output directory: ${outputDir}`);
          console.error(`  ${error.message}`);
          process.exit(3);
        }
      }

      console.log(`\n🚀 Converting Flutter to React...`);
      console.log(`   Input: ${input}`);
      console.log(`   Output: ${output}`);
      console.log(`   Mapping: ${options.mapping}\n`);

      // Convert Flutter to IR
      const flutterToIR = new FlutterToIR();
      const ir = flutterToIR.parseFile(input);

      // Convert IR to React
      const irToReact = new IRToReact();
      irToReact.loadMappings(options.mapping);
      const reactCode = irToReact.convertToReact(ir);

      // Write output
      fs.writeFileSync(output, reactCode, 'utf-8');
      console.log(`✓ React code generated successfully: ${output}`);

      console.log('\n✓ Conversion complete!\n');
      process.exit(0);

    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
      if (error.stack && process.env.DEBUG) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
      process.exit(1);
    }
  });

/**
 * schema2dart command - Convert JSON schema to Dart code with state management
 */
program
  .command('schema2dart')
  .description('Convert JSON UI schema to Dart widget code with state management')
  .argument('<schema>', 'Input schema JSON file path')
  .argument('<output>', 'Output directory path')
  .option('-a, --adapter <adapter>', 'State management adapter (bloc, riverpod, provider, getx)', 'bloc')
  .option('-f, --feature <name>', 'Feature name for generated files', 'feature')
  .action(async (schema, output, options) => {
    try {
      const DartGenerator = require('./src/dart-generator');
      
      // Validate input file exists
      if (!fs.existsSync(schema)) {
        console.error(`✗ Error: Schema file not found: ${schema}`);
        process.exit(3);
      }

      // Validate adapter choice
      const validAdapters = ['bloc', 'riverpod', 'provider', 'getx'];
      if (!validAdapters.includes(options.adapter)) {
        console.error(`✗ Error: Invalid adapter: ${options.adapter}`);
        console.error(`  Valid adapters: ${validAdapters.join(', ')}`);
        process.exit(1);
      }

      // Create output directory if it doesn't exist
      if (!fs.existsSync(output)) {
        try {
          fs.mkdirSync(output, { recursive: true });
        } catch (error) {
          console.error(`✗ Error: Cannot create output directory: ${output}`);
          console.error(`  ${error.message}`);
          process.exit(3);
        }
      }

      // Validate output directory is writable
      try {
        fs.accessSync(output, fs.constants.W_OK);
      } catch (error) {
        console.error(`✗ Error: Output directory is not writable: ${output}`);
        process.exit(3);
      }

      console.log(`\n🚀 Generating Dart code with ${options.adapter} adapter...`);
      console.log(`   Schema: ${schema}`);
      console.log(`   Output: ${output}`);
      console.log(`   Feature: ${options.feature}\n`);

      // Initialize generator
      const generator = new DartGenerator(options.adapter);
      
      // Load templates
      const templatesDir = path.join(__dirname, 'templates');
      generator.loadTemplates(templatesDir);

      // Generate files
      const generatedFiles = generator.generateFiles(
        schema,
        output,
        options.feature,
        {
          events: [],
          methods: [],
          stateFields: []
        }
      );

      // Log success
      console.log('✓ Dart code generated successfully!\n');
      console.log('Generated files:');
      generatedFiles.forEach(file => {
        const relativePath = path.relative(output, file);
        console.log(`  - ${relativePath}`);
      });
      console.log('');

      process.exit(0);

    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
      if (error.stack) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
      process.exit(4);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
