#!/usr/bin/env node
"use strict";
/**
 * Lumora CLI - Command-line interface for Lumora IR conversions
 *
 * Provides commands for converting between React and Flutter using Lumora IR
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
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chokidar = __importStar(require("chokidar"));
const ir_validator_1 = require("../validator/ir-validator");
const plugin_registry_1 = require("../registry/plugin-registry");
const package_manager_1 = require("../registry/package-manager");
const program = new commander_1.Command();
/**
 * Error codes for CLI
 */
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["SUCCESS"] = 0] = "SUCCESS";
    ErrorCode[ErrorCode["GENERAL_ERROR"] = 1] = "GENERAL_ERROR";
    ErrorCode[ErrorCode["PARSE_ERROR"] = 2] = "PARSE_ERROR";
    ErrorCode[ErrorCode["FILE_NOT_FOUND"] = 3] = "FILE_NOT_FOUND";
    ErrorCode[ErrorCode["CONVERSION_ERROR"] = 4] = "CONVERSION_ERROR";
    ErrorCode[ErrorCode["VALIDATION_ERROR"] = 5] = "VALIDATION_ERROR";
})(ErrorCode || (ErrorCode = {}));
/**
 * Detect framework from file extension
 */
function detectFramework(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.tsx' || ext === '.jsx' || ext === '.ts' || ext === '.js') {
        return 'react';
    }
    else if (ext === '.dart') {
        return 'flutter';
    }
    throw new Error(`Unable to detect framework from file extension: ${ext}`);
}
/**
 * Get target framework based on source
 */
function getTargetFramework(sourceFramework) {
    return sourceFramework === 'react' ? 'flutter' : 'react';
}
/**
 * Get output file extension for target framework
 */
function getOutputExtension(targetFramework) {
    return targetFramework === 'react' ? '.tsx' : '.dart';
}
/**
 * Mock converter functions (to be replaced with actual implementations)
 * These would normally import from tools/codegen
 */
async function convertReactToIR(filePath) {
    // This is a placeholder - in production, this would use TSXToIR from tools/codegen
    console.log(`  → Parsing React file: ${filePath}`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    // Create a minimal IR structure
    const ir = {
        version: '1.0.0',
        metadata: {
            sourceFramework: 'react',
            sourceFile: filePath,
            generatedAt: Date.now(),
        },
        nodes: [],
    };
    console.log(`  ✓ Parsed React component`);
    return ir;
}
async function convertFlutterToIR(filePath) {
    // This is a placeholder - in production, this would use FlutterToIR from tools/codegen
    console.log(`  → Parsing Flutter file: ${filePath}`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    // Create a minimal IR structure
    const ir = {
        version: '1.0.0',
        metadata: {
            sourceFramework: 'flutter',
            sourceFile: filePath,
            generatedAt: Date.now(),
        },
        nodes: [],
    };
    console.log(`  ✓ Parsed Flutter widget`);
    return ir;
}
async function convertIRToReact(ir, outputPath) {
    // This is a placeholder - in production, this would use IRToReact from tools/codegen
    console.log(`  → Generating React code: ${outputPath}`);
    const code = `// Generated from Lumora IR
// Source: ${ir.metadata.sourceFile}
// Generated at: ${new Date(ir.metadata.generatedAt).toISOString()}

import React from 'react';

export default function Component() {
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
}
`;
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, code, 'utf8');
    console.log(`  ✓ Generated React component`);
}
async function convertIRToFlutter(ir, outputPath) {
    // This is a placeholder - in production, this would use IRToFlutter from tools/codegen
    console.log(`  → Generating Flutter code: ${outputPath}`);
    const code = `// Generated from Lumora IR
// Source: ${ir.metadata.sourceFile}
// Generated at: ${new Date(ir.metadata.generatedAt).toISOString()}

import 'package:flutter/material.dart';

class Component extends StatelessWidget {
  const Component({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      // Widget implementation
    );
  }
}
`;
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, code, 'utf8');
    console.log(`  ✓ Generated Flutter widget`);
}
/**
 * Perform the conversion
 */
async function performConversion(inputPath, outputPath, options) {
    // Detect source framework
    const sourceFramework = detectFramework(inputPath);
    const targetFramework = options.targetFramework || getTargetFramework(sourceFramework);
    console.log(`\n🔄 Converting ${sourceFramework} → ${targetFramework}`);
    console.log(`   Input: ${inputPath}`);
    // Determine output path
    let finalOutputPath;
    if (outputPath) {
        finalOutputPath = outputPath;
    }
    else {
        const dir = path.dirname(inputPath);
        const basename = path.basename(inputPath, path.extname(inputPath));
        const ext = getOutputExtension(targetFramework);
        finalOutputPath = path.join(dir, `${basename}${ext}`);
    }
    console.log(`   Output: ${finalOutputPath}`);
    if (options.dryRun) {
        console.log(`   Mode: DRY RUN (no files will be written)\n`);
    }
    else {
        console.log('');
    }
    // Convert source to IR
    let ir;
    try {
        if (sourceFramework === 'react') {
            ir = await convertReactToIR(inputPath);
        }
        else {
            ir = await convertFlutterToIR(inputPath);
        }
    }
    catch (error) {
        if (error.message.includes('SyntaxError') || error.message.includes('Unexpected token')) {
            console.error(`\n✗ Parse Error: ${error.message}`);
            // Try to extract line and column information
            const match = error.message.match(/\((\d+):(\d+)\)/);
            if (match) {
                const line = match[1];
                const column = match[2];
                console.error(`  at line ${line}, column ${column}`);
            }
            throw new Error('Parse error');
        }
        throw error;
    }
    // Validate IR
    console.log(`  → Validating IR structure`);
    const validator = new ir_validator_1.IRValidator();
    const validation = validator.validate(ir);
    if (!validation.valid) {
        console.error(`\n✗ Validation Error: IR structure is invalid`);
        if (validation.errors) {
            validation.errors.forEach((error, index) => {
                console.error(`  ${index + 1}. ${error.path}: ${error.message}`);
            });
        }
        throw new Error('Validation error');
    }
    console.log(`  ✓ IR validated successfully`);
    // Convert IR to target framework
    if (!options.dryRun) {
        try {
            if (targetFramework === 'react') {
                await convertIRToReact(ir, finalOutputPath);
            }
            else {
                await convertIRToFlutter(ir, finalOutputPath);
            }
        }
        catch (error) {
            console.error(`\n✗ Generation Error: ${error.message}`);
            throw new Error('Generation error');
        }
    }
    else {
        console.log(`  → Would generate ${targetFramework} code (skipped in dry-run mode)`);
    }
    return { outputPath: finalOutputPath, ir };
}
/**
 * Format error message with suggestions
 */
function formatError(error, inputPath) {
    const sourceFramework = detectFramework(inputPath);
    console.error(`\n💡 Suggestions:`);
    if (error.message.includes('Parse error')) {
        console.error(`  • Check your ${sourceFramework === 'react' ? 'TSX' : 'Dart'} syntax`);
        console.error(`  • Ensure all brackets and parentheses are balanced`);
        console.error(`  • Verify imports are correct`);
    }
    else if (error.message.includes('Validation error')) {
        console.error(`  • The generated IR structure is invalid`);
        console.error(`  • This may indicate an issue with the parser`);
        console.error(`  • Try simplifying your component and converting again`);
    }
    else if (error.message.includes('Generation error')) {
        console.error(`  • The IR could not be converted to ${sourceFramework === 'react' ? 'Flutter' : 'React'}`);
        console.error(`  • Some features may not be supported yet`);
        console.error(`  • Check the IR structure for unsupported patterns`);
    }
    else if (error.message.includes('File not found')) {
        console.error(`  • Verify the file path is correct`);
        console.error(`  • Check that the file exists and is readable`);
    }
    else {
        console.error(`  • Check the error message above for details`);
        console.error(`  • Run with DEBUG=1 for more information`);
    }
    console.error('');
}
// Configure CLI
program
    .name('lumora')
    .description('Lumora CLI - Bidirectional conversion between React and Flutter')
    .version('0.1.0');
/**
 * Convert command - Convert files between React and Flutter
 */
program
    .command('convert')
    .description('Convert a file between React and Flutter')
    .argument('<input>', 'Input file path (React .tsx or Flutter .dart)')
    .argument('[output]', 'Output file path (optional, auto-generated if not provided)')
    .option('-d, --dry-run', 'Show what would be converted without writing files', false)
    .option('-t, --target <framework>', 'Target framework (react or flutter, auto-detected if not provided)')
    .option('-w, --watch', 'Watch for file changes and auto-convert', false)
    .action(async (input, output, options) => {
    try {
        // Validate input file exists
        if (!fs.existsSync(input)) {
            console.error(`✗ Error: Input file not found: ${input}`);
            process.exit(ErrorCode.FILE_NOT_FOUND);
        }
        // Validate input file is readable
        try {
            fs.accessSync(input, fs.constants.R_OK);
        }
        catch (error) {
            console.error(`✗ Error: Input file is not readable: ${input}`);
            process.exit(ErrorCode.FILE_NOT_FOUND);
        }
        // Validate target framework if provided
        if (options.target && !['react', 'flutter'].includes(options.target)) {
            console.error(`✗ Error: Invalid target framework: ${options.target}`);
            console.error(`  Valid options: react, flutter`);
            process.exit(ErrorCode.GENERAL_ERROR);
        }
        // Validate output directory is writable (if output provided and not dry-run)
        if (output && !options.dryRun) {
            const outputDir = path.dirname(output);
            if (!fs.existsSync(outputDir)) {
                try {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                catch (error) {
                    console.error(`✗ Error: Cannot create output directory: ${outputDir}`);
                    console.error(`  ${error.message}`);
                    process.exit(ErrorCode.FILE_NOT_FOUND);
                }
            }
            try {
                fs.accessSync(outputDir, fs.constants.W_OK);
            }
            catch (error) {
                console.error(`✗ Error: Output directory is not writable: ${outputDir}`);
                process.exit(ErrorCode.FILE_NOT_FOUND);
            }
        }
        // Perform conversion
        const convert = async () => {
            try {
                const result = await performConversion(input, output || null, {
                    dryRun: options.dryRun,
                    targetFramework: options.target,
                });
                console.log(`\n✓ Conversion complete!`);
                if (options.dryRun) {
                    console.log(`\n📋 Dry run summary:`);
                    console.log(`   • Source framework: ${result.ir.metadata.sourceFramework}`);
                    console.log(`   • Target file: ${result.outputPath}`);
                    console.log(`   • IR nodes: ${result.ir.nodes.length}`);
                    console.log(`\n   Run without --dry-run to write the file\n`);
                }
                else {
                    console.log(`   Output: ${result.outputPath}\n`);
                }
                return result;
            }
            catch (error) {
                formatError(error, input);
                if (error.message.includes('Parse error')) {
                    process.exit(ErrorCode.PARSE_ERROR);
                }
                else if (error.message.includes('Validation error')) {
                    process.exit(ErrorCode.VALIDATION_ERROR);
                }
                else if (error.message.includes('Generation error')) {
                    process.exit(ErrorCode.CONVERSION_ERROR);
                }
                else {
                    process.exit(ErrorCode.GENERAL_ERROR);
                }
            }
        };
        // Initial conversion
        await convert();
        // Watch mode
        if (options.watch) {
            console.log(`👀 Watching ${input} for changes... (Press Ctrl+C to stop)\n`);
            const watcher = chokidar.watch(input, {
                persistent: true,
                ignoreInitial: true,
                awaitWriteFinish: {
                    stabilityThreshold: 100,
                    pollInterval: 100,
                },
            });
            watcher.on('change', async () => {
                const timestamp = new Date().toISOString();
                console.log(`\n[${timestamp}] File changed, reconverting...`);
                await convert();
            });
            watcher.on('error', (error) => {
                console.error(`✗ Watch Error: ${error.message}`);
            });
            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log('\n\n👋 Stopping watch mode...');
                watcher.close();
                process.exit(ErrorCode.SUCCESS);
            });
            // Keep process alive
            await new Promise(() => { });
        }
        else {
            process.exit(ErrorCode.SUCCESS);
        }
    }
    catch (error) {
        console.error(`✗ Unexpected Error: ${error.message}`);
        if (process.env.DEBUG) {
            console.error(`\nStack trace:\n${error.stack}`);
        }
        process.exit(ErrorCode.GENERAL_ERROR);
    }
});
/**
 * Install command - Install and check compatibility of packages
 */
program
    .command('install')
    .description('Install a package and check Lumora compatibility')
    .argument('<package>', 'Package name to install')
    .option('-f, --framework <framework>', 'Framework (react or flutter)', 'react')
    .option('--check-only', 'Only check compatibility without installing', false)
    .action(async (packageName, options) => {
    try {
        const framework = options.framework;
        if (!['react', 'flutter'].includes(framework)) {
            console.error(`✗ Error: Invalid framework: ${framework}`);
            console.error(`  Valid options: react, flutter`);
            process.exit(ErrorCode.GENERAL_ERROR);
        }
        console.log(`\n📦 Checking package: ${packageName}`);
        console.log(`   Framework: ${framework}\n`);
        const packageManager = (0, package_manager_1.getPackageManager)();
        const pluginRegistry = (0, plugin_registry_1.getPluginRegistry)();
        // Check package compatibility
        const packageInfo = packageManager.checkPackageCompatibility(packageName, 'latest', framework);
        // Display compatibility info
        console.log(`✓ Package found: ${packageInfo.name}`);
        console.log(`  Compatible: ${packageInfo.isLumoraCompatible ? '✓ Yes' : '⚠️  Unknown'}`);
        console.log(`  Native code: ${packageInfo.hasNativeDependencies ? '⚠️  Yes' : '✓ No'}`);
        // Display warnings
        if (packageInfo.warnings.length > 0) {
            console.log(`\n⚠️  Warnings:`);
            packageInfo.warnings.forEach(warning => {
                console.log(`   ${warning}`);
            });
        }
        // Register as plugin
        const plugin = packageManager.packageToPlugin(packageInfo);
        const validation = pluginRegistry.register(plugin);
        if (!validation.valid) {
            console.log(`\n✗ Plugin validation failed:`);
            validation.errors.forEach(error => {
                console.log(`   • ${error}`);
            });
            process.exit(ErrorCode.VALIDATION_ERROR);
        }
        if (validation.warnings.length > 0) {
            console.log(`\n⚠️  Plugin warnings:`);
            validation.warnings.forEach(warning => {
                console.log(`   ${warning}`);
            });
        }
        // Get documentation link
        const docUrl = packageManager.getDocumentationUrl(packageName, framework);
        console.log(`\n📚 Documentation: ${docUrl}`);
        if (options.checkOnly) {
            console.log(`\n✓ Compatibility check complete (no installation performed)\n`);
            process.exit(ErrorCode.SUCCESS);
        }
        // Install package
        console.log(`\n📥 Installing package...`);
        const projectPath = process.cwd();
        let installCommand;
        let configFile;
        if (framework === 'flutter') {
            configFile = path.join(projectPath, 'pubspec.yaml');
            installCommand = `flutter pub add ${packageName}`;
        }
        else {
            configFile = path.join(projectPath, 'package.json');
            installCommand = `npm install ${packageName}`;
        }
        // Check if config file exists
        if (!fs.existsSync(configFile)) {
            console.log(`\n⚠️  ${framework === 'flutter' ? 'pubspec.yaml' : 'package.json'} not found in current directory`);
            console.log(`   Please run this command from your project root, or create a new project first.\n`);
            process.exit(ErrorCode.FILE_NOT_FOUND);
        }
        console.log(`   Running: ${installCommand}`);
        console.log(`\n   Note: You'll need to run this command manually:`);
        console.log(`   $ ${installCommand}\n`);
        console.log(`✓ Package check complete!`);
        console.log(`\n💡 Next steps:`);
        console.log(`   1. Run: ${installCommand}`);
        console.log(`   2. Import the package in your code`);
        console.log(`   3. Use "lumora convert" to generate cross-platform code\n`);
        process.exit(ErrorCode.SUCCESS);
    }
    catch (error) {
        console.error(`\n✗ Error: ${error.message}\n`);
        process.exit(ErrorCode.GENERAL_ERROR);
    }
});
/**
 * Packages command - Analyze project dependencies
 */
program
    .command('packages')
    .description('Analyze project dependencies and check compatibility')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (options) => {
    try {
        const projectPath = options.path;
        console.log(`\n📦 Analyzing project dependencies...`);
        console.log(`   Path: ${projectPath}\n`);
        const packageManager = (0, package_manager_1.getPackageManager)();
        const analysis = packageManager.analyzeProject(projectPath);
        // Display Flutter packages
        if (analysis.flutter.length > 0) {
            console.log(`Flutter packages (${analysis.flutter.length}):`);
            analysis.flutter.forEach(pkg => {
                const icon = pkg.isLumoraCompatible ? '✓' : pkg.hasNativeDependencies ? '⚠️' : '?';
                console.log(`   ${icon} ${pkg.name} (${pkg.version})`);
            });
            console.log('');
        }
        // Display React packages
        if (analysis.react.length > 0) {
            console.log(`React packages (${analysis.react.length}):`);
            analysis.react.forEach(pkg => {
                const icon = pkg.isLumoraCompatible ? '✓' : pkg.hasNativeDependencies ? '⚠️' : '?';
                console.log(`   ${icon} ${pkg.name} (${pkg.version})`);
            });
            console.log('');
        }
        // Display warnings
        if (analysis.warnings.length > 0) {
            analysis.warnings.forEach(warning => {
                console.log(warning);
            });
            console.log('');
        }
        // Summary
        const totalPackages = analysis.flutter.length + analysis.react.length;
        const nativePackages = [...analysis.flutter, ...analysis.react].filter(p => p.hasNativeDependencies).length;
        const compatiblePackages = [...analysis.flutter, ...analysis.react].filter(p => p.isLumoraCompatible).length;
        console.log(`Summary:`);
        console.log(`   Total packages: ${totalPackages}`);
        console.log(`   Lumora-compatible: ${compatiblePackages}`);
        console.log(`   With native code: ${nativePackages}`);
        console.log(`\n   Legend: ✓ = Compatible, ⚠️  = Native code, ? = Unknown\n`);
        process.exit(ErrorCode.SUCCESS);
    }
    catch (error) {
        console.error(`\n✗ Error: ${error.message}\n`);
        process.exit(ErrorCode.GENERAL_ERROR);
    }
});
// Parse command line arguments
program.parse(process.argv);
// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
