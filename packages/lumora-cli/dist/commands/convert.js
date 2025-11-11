"use strict";
/**
 * Convert Command
 * Bidirectional conversion between React and Flutter
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
exports.convertCommand = convertCommand;
exports.batchConvertCommand = batchConvertCommand;
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
const ir_1 = require("@lumora/ir");
/**
 * Convert command handler
 */
async function convertCommand(inputFile, options) {
    try {
        console.log(chalk_1.default.blue('🔄 Lumora Bidirectional Converter\n'));
        // Resolve input file path
        const inputPath = (0, path_1.resolve)(process.cwd(), inputFile);
        if (!(0, fs_1.existsSync)(inputPath)) {
            console.error(chalk_1.default.red(`✗ Input file not found: ${inputPath}`));
            process.exit(1);
        }
        // Read input file
        const inputCode = (0, fs_1.readFileSync)(inputPath, 'utf-8');
        const inputExt = (0, path_1.extname)(inputPath);
        // Determine conversion direction
        let direction;
        if (options.to) {
            // Explicit target specified
            if (options.to === 'flutter') {
                direction = 'react-to-flutter';
            }
            else {
                direction = 'flutter-to-react';
            }
        }
        else {
            // Auto-detect from file extension
            if (inputExt === '.tsx' || inputExt === '.jsx' || inputExt === '.ts' || inputExt === '.js') {
                direction = 'react-to-flutter';
            }
            else if (inputExt === '.dart') {
                direction = 'flutter-to-react';
            }
            else {
                console.error(chalk_1.default.red(`✗ Cannot determine conversion direction from file extension: ${inputExt}`));
                console.log(chalk_1.default.yellow('Use --to=react or --to=flutter to specify target'));
                process.exit(1);
            }
        }
        console.log(chalk_1.default.cyan(`📄 Input: ${inputPath}`));
        console.log(chalk_1.default.cyan(`🎯 Direction: ${direction === 'react-to-flutter' ? 'React → Flutter' : 'Flutter → React'}\n`));
        // Create converter
        const converter = new ir_1.BidirectionalConverter();
        // Perform conversion
        let outputCode;
        let outputExt;
        if (direction === 'react-to-flutter') {
            console.log(chalk_1.default.gray('Converting React to Flutter...'));
            outputCode = converter.reactToFlutter(inputCode, inputPath);
            outputExt = '.dart';
        }
        else {
            console.log(chalk_1.default.gray('Converting Flutter to React...'));
            outputCode = converter.flutterToReact(inputCode, inputPath);
            outputExt = '.tsx';
        }
        // Determine output path
        let outputPath;
        if (options.output) {
            outputPath = (0, path_1.resolve)(process.cwd(), options.output);
        }
        else {
            // Auto-generate output filename
            const inputBasename = (0, path_1.basename)(inputPath, inputExt);
            const inputDir = (0, path_1.dirname)(inputPath);
            outputPath = (0, path_1.resolve)(inputDir, `${inputBasename}${outputExt}`);
        }
        // Dry run mode
        if (options.dryRun) {
            console.log(chalk_1.default.yellow('\n📋 Dry run mode - output not written\n'));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            console.log(outputCode);
            console.log(chalk_1.default.gray('─'.repeat(80)));
            console.log(chalk_1.default.green(`\n✓ Conversion successful (dry run)`));
            console.log(chalk_1.default.gray(`Would write to: ${outputPath}\n`));
            return;
        }
        // Write output file
        (0, fs_1.writeFileSync)(outputPath, outputCode, 'utf-8');
        console.log(chalk_1.default.green(`\n✓ Conversion successful!`));
        console.log(chalk_1.default.cyan(`📝 Output: ${outputPath}\n`));
        // Watch mode
        if (options.watch) {
            console.log(chalk_1.default.blue('👀 Watching for changes...\n'));
            const chokidar = await Promise.resolve().then(() => __importStar(require('chokidar')));
            const watcher = chokidar.watch(inputPath, {
                persistent: true,
                ignoreInitial: true,
            });
            watcher.on('change', async () => {
                console.log(chalk_1.default.yellow(`\n🔄 File changed: ${inputPath}`));
                try {
                    const updatedCode = (0, fs_1.readFileSync)(inputPath, 'utf-8');
                    let newOutputCode;
                    if (direction === 'react-to-flutter') {
                        newOutputCode = converter.reactToFlutter(updatedCode, inputPath);
                    }
                    else {
                        newOutputCode = converter.flutterToReact(updatedCode, inputPath);
                    }
                    (0, fs_1.writeFileSync)(outputPath, newOutputCode, 'utf-8');
                    console.log(chalk_1.default.green(`✓ Converted and saved to ${outputPath}\n`));
                }
                catch (error) {
                    console.error(chalk_1.default.red(`✗ Conversion failed: ${error instanceof Error ? error.message : String(error)}\n`));
                }
            });
            // Keep process alive
            process.on('SIGINT', () => {
                console.log(chalk_1.default.yellow('\n\n👋 Stopping watch mode...'));
                watcher.close();
                process.exit(0);
            });
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✗ Conversion failed: ${error instanceof Error ? error.message : String(error)}\n`));
        process.exit(1);
    }
}
/**
 * Batch convert command handler
 */
async function batchConvertCommand(pattern, options) {
    try {
        console.log(chalk_1.default.blue('🔄 Lumora Batch Converter\n'));
        const glob = await Promise.resolve().then(() => __importStar(require('glob')));
        const files = glob.sync(pattern, { cwd: process.cwd() });
        if (files.length === 0) {
            console.log(chalk_1.default.yellow(`No files found matching pattern: ${pattern}`));
            return;
        }
        console.log(chalk_1.default.cyan(`Found ${files.length} file(s) to convert\n`));
        const converter = new ir_1.BidirectionalConverter();
        let successCount = 0;
        let failCount = 0;
        for (const file of files) {
            const inputPath = (0, path_1.resolve)(process.cwd(), file);
            const inputExt = (0, path_1.extname)(inputPath);
            try {
                console.log(chalk_1.default.gray(`Converting: ${file}`));
                const inputCode = (0, fs_1.readFileSync)(inputPath, 'utf-8');
                // Determine direction
                let outputCode;
                let outputExt;
                if (inputExt === '.tsx' || inputExt === '.jsx' || inputExt === '.ts' || inputExt === '.js') {
                    outputCode = converter.reactToFlutter(inputCode, inputPath);
                    outputExt = '.dart';
                }
                else if (inputExt === '.dart') {
                    outputCode = converter.flutterToReact(inputCode, inputPath);
                    outputExt = '.tsx';
                }
                else {
                    console.log(chalk_1.default.yellow(`  ⊘ Skipped (unknown extension): ${file}`));
                    continue;
                }
                // Generate output path
                const inputBasename = (0, path_1.basename)(inputPath, inputExt);
                const inputDir = (0, path_1.dirname)(inputPath);
                const outputPath = (0, path_1.resolve)(inputDir, `${inputBasename}${outputExt}`);
                if (!options.dryRun) {
                    (0, fs_1.writeFileSync)(outputPath, outputCode, 'utf-8');
                }
                console.log(chalk_1.default.green(`  ✓ ${file} → ${(0, path_1.basename)(outputPath)}`));
                successCount++;
            }
            catch (error) {
                console.error(chalk_1.default.red(`  ✗ Failed: ${error instanceof Error ? error.message : String(error)}`));
                failCount++;
            }
        }
        console.log(chalk_1.default.blue(`\n📊 Conversion Summary:`));
        console.log(chalk_1.default.green(`  ✓ Success: ${successCount}`));
        if (failCount > 0) {
            console.log(chalk_1.default.red(`  ✗ Failed: ${failCount}`));
        }
        console.log();
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✗ Batch conversion failed: ${error instanceof Error ? error.message : String(error)}\n`));
        process.exit(1);
    }
}
//# sourceMappingURL=convert.js.map