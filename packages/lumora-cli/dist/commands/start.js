"use strict";
/**
 * Lumora Start Command
 * Starts the complete development environment with automatic updates
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
exports.startCommand = startCommand;
const chalk_1 = __importDefault(require("chalk"));
const services_1 = require("../services");
const web_preview_server_1 = require("../services/web-preview-server");
const asset_resolver_1 = require("../utils/asset-resolver");
const lumora_ir_1 = require("lumora-ir");
const config_loader_1 = require("../utils/config-loader");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const chokidar_1 = __importDefault(require("chokidar"));
// Simple spinner replacement (ora has type issues)
const spinner = {
    text: '',
    start(text) {
        this.text = text;
        console.log(chalk_1.default.gray(`⏳ ${text}`));
        return this;
    },
    succeed(text) {
        console.log(chalk_1.default.green(`✓ ${text}`));
        return this;
    },
    fail(text) {
        console.log(chalk_1.default.red(`✗ ${text}`));
        return this;
    },
};
async function startCommand(options) {
    console.log(chalk_1.default.bold.cyan('\n🚀 Starting Lumora Bidirectional Server\n'));
    console.log(chalk_1.default.gray('Write React → See on Flutter mobile + React web'));
    console.log(chalk_1.default.gray('Write Flutter → See on React web + Flutter mobile\n'));
    try {
        // Load configuration
        const config = await (0, config_loader_1.loadConfig)();
        const port = parseInt(options.port);
        const projectRoot = process.cwd();
        // Initialize converters
        const converter = new lumora_ir_1.BidirectionalConverter();
        const reactParser = new lumora_ir_1.ReactParser();
        const dartParser = new lumora_ir_1.DartParser();
        // Track current IR for reload
        let currentIR = null;
        // 1. Start Dev-Proxy Server (for mobile)
        spinner.start('Starting Dev-Proxy for mobile...');
        const devProxy = new services_1.DevProxyServer({
            port,
            enableQR: options.qr,
            projectRoot,
        });
        await devProxy.start();
        const session = await devProxy.createSession();
        spinner.succeed(chalk_1.default.green(`Dev-Proxy started for mobile`));
        // 2. Start Web Preview Server (for browser)
        spinner.start('Starting web preview server...');
        const webPreview = new web_preview_server_1.WebPreviewServer({
            port: port + 1, // Use next port for web
            mode: options.mode,
        });
        await webPreview.start();
        // Display QR code
        if (options.qr) {
            console.log();
            devProxy.displayQRCode(session.id);
            console.log();
        }
        // 3. Setup bidirectional file watchers
        if (options.watch) {
            spinner.start('Setting up file watchers...');
            const srcDir = path.join(projectRoot, 'src');
            const libDir = path.join(projectRoot, 'lib');
            // Watch React files
            if (fs.existsSync(srcDir)) {
                const reactWatcher = chokidar_1.default.watch(`${srcDir}/**/*.{tsx,ts,jsx,js}`, {
                    persistent: true,
                    ignoreInitial: true, // We'll handle initial files manually
                });
                // Debounce to prevent infinite loops
                let reactProcessing = new Set();
                const handleReactFile = async (filePath, isInitial = false) => {
                    try {
                        // Prevent processing the same file multiple times simultaneously
                        if (reactProcessing.has(filePath))
                            return;
                        reactProcessing.add(filePath);
                        if (!isInitial) {
                            console.log(chalk_1.default.yellow(`\n🔄 React file changed: ${path.basename(filePath)}`));
                        }
                        const code = fs.readFileSync(filePath, 'utf-8');
                        const ir = reactParser.parse(code, filePath);
                        currentIR = ir;
                        // Resolve asset paths for mobile
                        const networkIP = devProxy.getNetworkIP();
                        const baseUrl = `http://${networkIP}:${port}`;
                        const resolvedIR = (0, asset_resolver_1.resolveAssetPaths)(ir, baseUrl);
                        // Update mobile (Flutter)
                        devProxy.pushSchemaUpdate(session.id, resolvedIR, true);
                        if (!isInitial)
                            console.log(chalk_1.default.green('  ✓ Updated Flutter mobile'));
                        // Update web (React)
                        webPreview.updateIR(ir);
                        if (!isInitial)
                            console.log(chalk_1.default.green('  ✓ Updated React web'));
                        // Generate Flutter code if enabled
                        if (options.codegen) {
                            const flutterCode = converter.generateFlutter(ir);
                            // Map file paths: src/App.tsx -> lib/main.dart, src/components/Button.tsx -> lib/components/button.dart
                            const relativePath = path.relative(srcDir, filePath);
                            const dartFileName = path.basename(filePath, path.extname(filePath)).toLowerCase().replace(/[A-Z]/g, (match, offset) => offset > 0 ? '_' + match.toLowerCase() : match.toLowerCase());
                            // Special case: App.tsx -> main.dart
                            const outputFileName = dartFileName === 'app' ? 'main.dart' : `${dartFileName}.dart`;
                            const outputPath = path.join(libDir, path.dirname(relativePath), outputFileName);
                            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                            fs.writeFileSync(outputPath, flutterCode, 'utf-8');
                            if (!isInitial) {
                                console.log(chalk_1.default.gray(`  → ${path.relative(projectRoot, filePath)} → ${path.relative(projectRoot, outputPath)}`));
                            }
                        }
                        // Remove from processing set after a delay
                        setTimeout(() => reactProcessing.delete(filePath), 1000);
                    }
                    catch (error) {
                        reactProcessing.delete(filePath);
                        console.error(chalk_1.default.red(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}`));
                    }
                };
                reactWatcher.on('change', (filePath) => handleReactFile(filePath, false));
                reactWatcher.on('add', (filePath) => handleReactFile(filePath, false));
                // Process initial files
                const glob = require('glob');
                const initialFiles = glob.sync(`${srcDir}/**/*.{tsx,ts,jsx,js}`);
                spinner.succeed(chalk_1.default.green(`Watching React files: ${srcDir}`));
                if (initialFiles.length > 0) {
                    console.log(chalk_1.default.gray(`Processing ${initialFiles.length} initial file(s)...`));
                    // Process initial files for preview AND generate code if enabled
                    let lastIR = null;
                    for (const file of initialFiles) {
                        try {
                            const code = fs.readFileSync(file, 'utf-8');
                            const ir = reactParser.parse(code, file);
                            lastIR = ir;
                            currentIR = ir;
                            // Update web preview immediately
                            webPreview.updateIR(ir);
                            // Generate Flutter code if enabled AND lib/main.dart doesn't exist yet
                            if (options.codegen) {
                                const mainDartPath = path.join(libDir, 'main.dart');
                                const shouldGenerate = !fs.existsSync(mainDartPath) ||
                                    fs.readFileSync(mainDartPath, 'utf-8').includes('// Generated by Lumora');
                                if (shouldGenerate) {
                                    const flutterCode = converter.generateFlutter(ir);
                                    const relativePath = path.relative(srcDir, file);
                                    const dartFileName = path.basename(file, path.extname(file)).toLowerCase().replace(/[A-Z]/g, (match, offset) => offset > 0 ? '_' + match.toLowerCase() : match.toLowerCase());
                                    const outputFileName = dartFileName === 'app' ? 'main.dart' : `${dartFileName}.dart`;
                                    const outputPath = path.join(libDir, path.dirname(relativePath), outputFileName);
                                    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                                    fs.writeFileSync(outputPath, flutterCode, 'utf-8');
                                    console.log(chalk_1.default.gray(`  → Generated ${path.relative(projectRoot, outputPath)}`));
                                }
                            }
                        }
                        catch (error) {
                            console.error(chalk_1.default.red(`  ✗ Error processing ${path.basename(file)}: ${error instanceof Error ? error.message : String(error)}`));
                        }
                    }
                    // Push the last IR to mobile (this will be the initial schema for connecting devices)
                    if (lastIR) {
                        const networkIP = devProxy.getNetworkIP();
                        const baseUrl = `http://${networkIP}:${port}`;
                        const resolvedIR = (0, asset_resolver_1.resolveAssetPaths)(lastIR, baseUrl);
                        devProxy.pushSchemaUpdate(session.id, resolvedIR, true);
                        // Wait a moment for the schema to be flushed to the session
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    console.log(chalk_1.default.green(`✓ Initial setup complete`));
                }
            }
            // Watch Flutter files
            if (fs.existsSync(libDir)) {
                const flutterWatcher = chokidar_1.default.watch(`${libDir}/**/*.dart`, {
                    persistent: true,
                    ignoreInitial: true, // We'll handle initial files manually
                });
                // Debounce to prevent infinite loops
                let flutterProcessing = new Set();
                const handleFlutterFile = async (filePath, isInitial = false) => {
                    try {
                        // Skip if already processing
                        if (flutterProcessing.has(filePath))
                            return;
                        // Skip test files and generated files
                        if (filePath.includes('_test.dart') || filePath.includes('/test/'))
                            return;
                        flutterProcessing.add(filePath);
                        if (!isInitial) {
                            console.log(chalk_1.default.yellow(`\n🔄 Flutter file changed: ${path.basename(filePath)}`));
                        }
                        const code = fs.readFileSync(filePath, 'utf-8');
                        const ir = dartParser.parse(code, filePath);
                        currentIR = ir;
                        // Update mobile (Flutter native)
                        devProxy.pushSchemaUpdate(session.id, ir, true);
                        if (!isInitial)
                            console.log(chalk_1.default.green('  ✓ Updated Flutter mobile'));
                        // Update web preview with converted React IR
                        try {
                            const tempReactCode = converter.generateReact(ir);
                            const reactIR = reactParser.parse(tempReactCode, 'temp.tsx');
                            webPreview.updateIR(reactIR);
                            if (!isInitial)
                                console.log(chalk_1.default.green('  ✓ Updated React web (via conversion)'));
                        }
                        catch (err) {
                            // If conversion fails, just ignore for web preview
                            if (!isInitial)
                                console.log(chalk_1.default.yellow('  ⚠ Could not update web preview from Flutter change'));
                        }
                        // Generate React code if enabled
                        if (options.codegen) {
                            const reactCode = converter.generateReact(ir);
                            // Map file paths: lib/main.dart -> src/App.tsx, lib/components/button.dart -> src/components/Button.tsx
                            const relativePath = path.relative(libDir, filePath);
                            const baseName = path.basename(filePath, '.dart');
                            // Convert snake_case to PascalCase for React
                            const reactFileName = baseName.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
                            // Special case: main.dart -> App.tsx
                            const outputFileName = baseName === 'main' ? 'App.tsx' : `${reactFileName}.tsx`;
                            const outputPath = path.join(srcDir, path.dirname(relativePath), outputFileName);
                            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                            fs.writeFileSync(outputPath, reactCode, 'utf-8');
                            if (!isInitial) {
                                console.log(chalk_1.default.gray(`  → ${path.relative(projectRoot, filePath)} → ${path.relative(projectRoot, outputPath)}`));
                            }
                        }
                        // Remove from processing set after a delay
                        setTimeout(() => flutterProcessing.delete(filePath), 1000);
                    }
                    catch (error) {
                        flutterProcessing.delete(filePath);
                        console.error(chalk_1.default.red(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}`));
                    }
                };
                flutterWatcher.on('change', (filePath) => handleFlutterFile(filePath, false));
                flutterWatcher.on('add', (filePath) => handleFlutterFile(filePath, false));
                // Process initial files (skip test files)
                const glob = require('glob');
                const initialFiles = glob.sync(`${libDir}/**/*.dart`).filter((f) => !f.includes('_test.dart') && !f.includes('/test/'));
                spinner.succeed(chalk_1.default.green(`Watching Flutter files: ${libDir}`));
                if (initialFiles.length > 0) {
                    console.log(chalk_1.default.gray(`Processing ${initialFiles.length} initial file(s)...`));
                    // Process initial files for preview AND generate code if enabled
                    let lastIR = null;
                    for (const file of initialFiles) {
                        try {
                            const code = fs.readFileSync(file, 'utf-8');
                            const ir = dartParser.parse(code, file);
                            lastIR = ir;
                            currentIR = ir;
                            // Update web preview with converted React IR
                            try {
                                const tempReactCode = converter.generateReact(ir);
                                const reactIR = reactParser.parse(tempReactCode, 'temp.tsx');
                                webPreview.updateIR(reactIR);
                            }
                            catch (err) {
                                // Ignore conversion errors during initial load
                            }
                            // Generate React code if enabled AND src/App.tsx doesn't exist yet
                            if (options.codegen) {
                                const appTsxPath = path.join(srcDir, 'App.tsx');
                                const shouldGenerate = !fs.existsSync(appTsxPath) ||
                                    fs.readFileSync(appTsxPath, 'utf-8').includes('// Generated by Lumora');
                                if (shouldGenerate) {
                                    const reactCode = converter.generateReact(ir);
                                    const relativePath = path.relative(libDir, file);
                                    const baseName = path.basename(file, '.dart');
                                    const reactFileName = baseName.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
                                    const outputFileName = baseName === 'main' ? 'App.tsx' : `${reactFileName}.tsx`;
                                    const outputPath = path.join(srcDir, path.dirname(relativePath), outputFileName);
                                    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                                    fs.writeFileSync(outputPath, reactCode, 'utf-8');
                                    console.log(chalk_1.default.gray(`  → Generated ${path.relative(projectRoot, outputPath)}`));
                                }
                            }
                        }
                        catch (error) {
                            console.error(chalk_1.default.red(`  ✗ Error processing ${path.basename(file)}: ${error instanceof Error ? error.message : String(error)}`));
                        }
                    }
                    // Push the last IR to mobile (this will be the initial schema for connecting devices)
                    if (lastIR) {
                        devProxy.pushSchemaUpdate(session.id, lastIR, true);
                        // Wait a moment for the schema to be flushed to the session
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    console.log(chalk_1.default.green(`✓ Initial setup complete`));
                }
            }
        }
        // Display success message
        console.log();
        console.log(chalk_1.default.bold.green('✓ Lumora is ready!\n'));
        // Display instructions
        displayBidirectionalInstructions(port, session.id, options);
        // Setup interactive CLI
        setupInteractiveCLI(devProxy, webPreview, session.id, port, options, 
        // onReload (Hot Reload - preserve state)
        () => {
            if (currentIR) {
                const networkIP = devProxy.getNetworkIP();
                const baseUrl = `http://${networkIP}:${port}`;
                const resolvedIR = (0, asset_resolver_1.resolveAssetPaths)(currentIR, baseUrl);
                devProxy.pushSchemaUpdate(session.id, resolvedIR, true);
                return true;
            }
            return false;
        }, 
        // onRestart (Hot Restart - clear state)
        () => {
            if (currentIR) {
                const networkIP = devProxy.getNetworkIP();
                const baseUrl = `http://${networkIP}:${port}`;
                const resolvedIR = (0, asset_resolver_1.resolveAssetPaths)(currentIR, baseUrl);
                devProxy.pushSchemaUpdate(session.id, resolvedIR, false);
                return true;
            }
            return false;
        });
        // Keep process running
        setupGracefulShutdown(devProxy, spinner);
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to start Lumora'));
        console.error(chalk_1.default.red(`\nError: ${error instanceof Error ? error.message : String(error)}\n`));
        process.exit(1);
    }
}
function setupInteractiveCLI(devProxy, webPreview, sessionId, port, options, onReload, onRestart) {
    const readline = require('readline');
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            process.emit('SIGINT');
            return;
        }
        if (key.name === 'r') {
            if (key.shift) {
                // Hot Restart (Shift + R)
                console.log(chalk_1.default.gray('\n🔄 Hot Restarting connected devices (clearing state)...'));
                const success = onRestart();
                if (success) {
                    console.log(chalk_1.default.green('✓ Restart signal sent'));
                }
                else {
                    console.log(chalk_1.default.yellow('⚠ No active schema to restart'));
                }
            }
            else {
                // Hot Reload (r)
                console.log(chalk_1.default.gray('\n⚡ Hot Reloading connected devices...'));
                const success = onReload();
                if (success) {
                    console.log(chalk_1.default.green('✓ Reload signal sent'));
                }
                else {
                    console.log(chalk_1.default.yellow('⚠ No active schema to reload'));
                }
            }
        }
        if (key.name === 'm') {
            console.clear();
            displayBidirectionalInstructions(port, sessionId, options);
            console.log(chalk_1.default.bold.white('Interactive Menu:'));
            console.log(chalk_1.default.gray(' r       - Hot Reload (preserve state)'));
            console.log(chalk_1.default.gray(' Shift+R - Hot Restart (clear state)'));
            console.log(chalk_1.default.gray(' m       - Show menu'));
            console.log(chalk_1.default.gray(' c       - Clear console'));
            console.log(chalk_1.default.gray(' q       - Quit'));
            console.log();
        }
        if (key.name === 'c') {
            console.clear();
            console.log(chalk_1.default.green('✓ Console cleared'));
            console.log(chalk_1.default.gray('Press "m" for menu'));
        }
        if (key.name === 'q') {
            process.emit('SIGINT');
        }
    });
    console.log(chalk_1.default.gray('Press "m" to show interactive menu'));
}
function displayInstructions(port, sessionId, options) {
    console.log(chalk_1.default.bold('📱 Next Steps:\n'));
    console.log(chalk_1.default.cyan('   1.') + ' Open Lumora Dev Client on your mobile device');
    console.log(chalk_1.default.cyan('   2.') + ' Tap "Scan QR Code"');
    console.log(chalk_1.default.cyan('   3.') + ' Point camera at the QR code above');
    console.log(chalk_1.default.cyan('   4.') + ' Edit your code and see changes instantly!\n');
    console.log(chalk_1.default.bold('📝 What\'s happening:\n'));
    console.log(chalk_1.default.gray('   • File watcher monitors your code'));
    console.log(chalk_1.default.gray('   • Changes auto-convert to JSON schema'));
    console.log(chalk_1.default.gray('   • Schema auto-pushes to your device'));
    console.log(chalk_1.default.gray('   • Device renders native Flutter widgets'));
    if (options.codegen) {
        console.log(chalk_1.default.gray('   • Production Dart code auto-generates'));
        console.log(chalk_1.default.gray('   • Tests auto-convert between frameworks'));
    }
    console.log();
    console.log(chalk_1.default.bold('🔗 URLs:\n'));
    console.log(chalk_1.default.gray(`   Dev-Proxy: http://localhost:${port}`));
    console.log(chalk_1.default.gray(`   Session:   ${sessionId}`));
    console.log();
    console.log(chalk_1.default.bold.yellow('Ready! Edit your code and watch the magic happen! ✨\n'));
    console.log(chalk_1.default.gray('Press "m" for menu, Ctrl+C to stop\n'));
}
function setupGracefulShutdown(devProxy, spinner) {
    let isShuttingDown = false;
    const shutdown = async () => {
        if (isShuttingDown)
            return;
        isShuttingDown = true;
        console.log(chalk_1.default.yellow('\n\n🛑 Stopping Lumora...\n'));
        try {
            await devProxy.stop();
            console.log(chalk_1.default.green('✓ Dev-Proxy stopped'));
            console.log(chalk_1.default.green('✓ All services stopped\n'));
            process.exit(0);
        }
        catch (error) {
            console.error(chalk_1.default.red('Error during shutdown:'), error);
            process.exit(1);
        }
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
function displayBidirectionalInstructions(port, sessionId, options) {
    console.log(chalk_1.default.bold('🌐 Web Preview:\n'));
    console.log(chalk_1.default.cyan(`   Open http://localhost:${port + 1} in your browser`));
    console.log(chalk_1.default.gray('   See React UI with live updates\n'));
    console.log(chalk_1.default.bold('📱 Mobile Preview:\n'));
    console.log(chalk_1.default.cyan('   1. Open Lumora Dev Client on your device'));
    console.log(chalk_1.default.cyan('   2. Scan the QR code above'));
    console.log(chalk_1.default.cyan('   3. See Flutter native UI with live updates\n'));
    console.log(chalk_1.default.bold('🔄 Bidirectional Magic:\n'));
    console.log(chalk_1.default.gray('   • Write React → See on Flutter mobile + React web'));
    console.log(chalk_1.default.gray('   • Write Flutter → See on React web + Flutter mobile'));
    console.log(chalk_1.default.gray('   • Changes sync instantly to BOTH platforms'));
    console.log(chalk_1.default.gray('   • No manual commands needed!'));
    if (options.codegen) {
        console.log(chalk_1.default.gray('   • Production code auto-generates'));
    }
    console.log();
    console.log(chalk_1.default.bold('🔗 URLs:\n'));
    console.log(chalk_1.default.gray(`   Web:       http://localhost:${port + 1}`));
    console.log(chalk_1.default.gray(`   Mobile:    ws://localhost:${port}/ws`));
    console.log(chalk_1.default.gray(`   Session:   ${sessionId}`));
    console.log();
    console.log(chalk_1.default.bold.yellow('✨ Edit your code and watch it update everywhere instantly!\n'));
    console.log(chalk_1.default.gray('Press "m" for menu, Ctrl+C to stop\n'));
}
//# sourceMappingURL=start.js.map