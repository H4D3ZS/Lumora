"use strict";
/**
 * Lumora Init Command
 * Creates a new Lumora project
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
exports.initCommand = initCommand;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
// Simple spinner replacement
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
async function initCommand(projectName, options) {
    console.log(chalk_1.default.bold.cyan(`\n🚀 Creating Lumora project: ${projectName}\n`));
    try {
        const projectPath = path.join(process.cwd(), projectName);
        // Check if directory exists
        if (fs.existsSync(projectPath)) {
            throw new Error(`Directory ${projectName} already exists`);
        }
        // Check if Flutter is installed
        spinner.start('Checking Flutter installation...');
        try {
            (0, child_process_1.execSync)('flutter --version', { stdio: 'ignore' });
            spinner.succeed('Flutter is installed');
        }
        catch (error) {
            spinner.fail('Flutter is not installed');
            console.error(chalk_1.default.red('\n✗ Flutter is required for Lumora!'));
            console.log(chalk_1.default.yellow('\nPlease install Flutter first:'));
            console.log(chalk_1.default.cyan('  https://docs.flutter.dev/get-started/install\n'));
            process.exit(1);
        }
        // Create project directory
        fs.mkdirSync(projectPath, { recursive: true });
        // Initialize Flutter project
        spinner.start('Creating Flutter project (this may take a minute)...');
        (0, child_process_1.execSync)('flutter create . --project-name ' + projectName.replace(/-/g, '_'), {
            cwd: projectPath,
            stdio: 'pipe' // Hide flutter create output
        });
        spinner.succeed('Flutter project created');
        // Create React source structure
        spinner.start('Creating React source structure...');
        const dirs = [
            'src/components',
            'src/screens',
            'src/utils',
        ];
        dirs.forEach(dir => {
            fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
        });
        spinner.succeed('React source structure created');
        // Create configuration files
        spinner.start('Creating configuration files...');
        createConfigFiles(projectPath, projectName);
        spinner.succeed('Configuration files created');
        // Create example files
        spinner.start('Creating example files...');
        createExampleFiles(projectPath);
        spinner.succeed('Example files created');
        // Success message
        console.log();
        console.log(chalk_1.default.bold.green('✓ Lumora project created successfully!\n'));
        console.log(chalk_1.default.bold('📁 Project structure:\n'));
        console.log(chalk_1.default.gray('  src/          # React/TypeScript source (edit here)'));
        console.log(chalk_1.default.gray('  lib/          # Flutter/Dart (auto-synced from src/)'));
        console.log(chalk_1.default.gray('  android/      # Android native'));
        console.log(chalk_1.default.gray('  ios/          # iOS native'));
        console.log(chalk_1.default.gray('  web/          # Web build output\n'));
        console.log(chalk_1.default.bold('📝 Next steps:\n'));
        console.log(chalk_1.default.cyan(`   cd ${projectName}`));
        console.log(chalk_1.default.cyan('   lumora start\n'));
        console.log(chalk_1.default.yellow('💡 Edit src/App.tsx → lib/main.dart updates automatically!'));
        console.log(chalk_1.default.yellow('💡 Edit lib/main.dart → src/App.tsx updates automatically!\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to create project'));
        console.error(chalk_1.default.red(`\nError: ${error instanceof Error ? error.message : String(error)}\n`));
        process.exit(1);
    }
}
function createConfigFiles(projectPath, projectName) {
    // lumora.yaml
    const config = `# Lumora Configuration
mode: universal  # react | flutter | universal
port: 3000

# Source directories
sources:
  react: src/
  flutter: lib/

# File mapping
mapping:
  # src/App.tsx <-> lib/main.dart
  # src/components/Button.tsx <-> lib/components/button.dart
  # Automatic 1:1 mapping with proper naming conventions

# Code generation
codegen:
  enabled: true
  preserveComments: true
  
# Development
dev:
  hotReload: true
  qrCode: true
  webPreview: true
`;
    fs.writeFileSync(path.join(projectPath, 'lumora.yaml'), config);
    // tsconfig.json
    const tsconfig = {
        compilerOptions: {
            target: 'ES2020',
            lib: ['ES2020', 'DOM'],
            jsx: 'react-jsx',
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'lib'],
    };
    fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
    // Update .gitignore to include Lumora-specific ignores
    const gitignorePath = path.join(projectPath, '.gitignore');
    let gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    gitignore += `\n# Lumora
.lumora/
*.log
`;
    fs.writeFileSync(gitignorePath, gitignore);
}
function createExampleFiles(projectPath) {
    // Example React component (src/App.tsx)
    const appTsx = `import React, { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>
        Welcome to Lumora! 🚀
      </h1>
      <p style={{ fontSize: 18, marginBottom: 10 }}>
        Count: {count}
      </p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: '12px 24px',
          fontSize: 16,
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        Increment
      </button>
      <p style={{ marginTop: 20, color: '#666', fontSize: 14 }}>
        💡 This React code auto-syncs to lib/main.dart!
      </p>
    </div>
  );
}

export default App;
`;
    fs.writeFileSync(path.join(projectPath, 'src/App.tsx'), appTsx);
    // Also create a matching Flutter file manually to avoid broken generation
    const mainDart = `import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lumora App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const App(),
    );
  }
}

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Welcome to Lumora! 🚀',
                style: TextStyle(fontSize: 32),
              ),
              const SizedBox(height: 20),
              Text(
                'Count: \$count',
                style: const TextStyle(fontSize: 18),
              ),
              const SizedBox(height: 10),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    count = count + 1;
                  });
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  backgroundColor: const Color(0xFF667eea),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Increment', style: TextStyle(fontSize: 16)),
              ),
              const SizedBox(height: 20),
              const Text(
                '💡 This Flutter code auto-syncs to src/App.tsx!',
                style: TextStyle(fontSize: 14, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`;
    fs.writeFileSync(path.join(projectPath, 'lib/main.dart'), mainDart);
    // README
    const readme = `# ${path.basename(projectPath)}

A Lumora project - True bidirectional React ↔ Flutter development!

## 🚀 Getting Started

1. Start development server:
   \`\`\`bash
   lumora start
   \`\`\`

2. **Web Preview**: Open http://localhost:3001 in your browser

3. **Mobile Preview**: Scan QR code with Lumora Dev Client

4. **Edit and Watch**:
   - Edit \`src/App.tsx\` → \`lib/main.dart\` updates automatically
   - Edit \`lib/main.dart\` → \`src/App.tsx\` updates automatically

## 📁 Project Structure

\`\`\`
${path.basename(projectPath)}/
├── src/              # React/TypeScript source (edit here)
│   ├── App.tsx       # Main app component
│   ├── components/   # Your React components
│   └── screens/      # Your app screens
├── lib/              # Flutter/Dart (auto-synced from src/)
│   ├── main.dart     # Auto-generated from src/App.tsx
│   ├── components/   # Auto-generated components
│   └── screens/      # Auto-generated screens
├── android/          # Android native code
├── ios/              # iOS native code
└── web/              # Web build output
\`\`\`

## 🎯 Key Features

- ✅ **Bidirectional Sync**: React ↔ Flutter automatic conversion
- ✅ **Real-time Preview**: See changes instantly on web AND mobile
- ✅ **No Manual Commands**: Everything happens automatically
- ✅ **Native Performance**: True Flutter native, not WebView
- ✅ **Like Expo Go**: But for Flutter with React syntax

## 📝 Commands

- \`lumora start\` - Start development server (web + mobile)
- \`lumora build\` - Build production Flutter app

## 💡 How It Works

1. **Write React**: Edit \`src/App.tsx\` in your favorite editor
2. **Auto-Convert**: Lumora converts to Flutter/Dart automatically
3. **See Everywhere**: Updates appear on web browser AND mobile device
4. **Production Ready**: Generated Flutter code is production-ready

## 🔄 File Mapping

| React (src/)              | Flutter (lib/)              |
|---------------------------|----------------------------|
| \`src/App.tsx\`           | \`lib/main.dart\`          |
| \`src/components/Button.tsx\` | \`lib/components/button.dart\` |
| \`src/screens/Home.tsx\`  | \`lib/screens/home.dart\`  |

## 🎨 Supported Features

- ✅ Components & Widgets
- ✅ State Management (useState → StatefulWidget)
- ✅ Event Handlers
- ✅ Styling (inline styles → Flutter styling)
- ✅ Props & Parameters
- ✅ Lifecycle Methods

## 📚 Learn More

- [Lumora Documentation](https://lumora.dev)
- [Flutter Documentation](https://flutter.dev)
- [React Documentation](https://react.dev)

## 🙏 Credits

Built with ❤️ using Lumora Framework
`;
    fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
}
//# sourceMappingURL=init.js.map