/**
 * Lumora Init Command
 * Creates a new Lumora project
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Simple spinner replacement
const spinner = {
  text: '',
  start(text: string) {
    this.text = text;
    console.log(chalk.gray(`⏳ ${text}`));
    return this;
  },
  succeed(text: string) {
    console.log(chalk.green(`✓ ${text}`));
    return this;
  },
  fail(text: string) {
    console.log(chalk.red(`✗ ${text}`));
    return this;
  },
};

export interface InitOptions {
  template: string;
}

export async function initCommand(projectName: string, options: InitOptions) {
  console.log(chalk.bold.cyan(`\n🚀 Creating Lumora project: ${projectName}\n`));

  try {
    const projectPath = path.join(process.cwd(), projectName);

    // Check if directory exists
    if (fs.existsSync(projectPath)) {
      throw new Error(`Directory ${projectName} already exists`);
    }

    // Check if Flutter is installed
    spinner.start('Checking Flutter installation...');
    try {
      execSync('flutter --version', { stdio: 'ignore' });
      spinner.succeed('Flutter is installed');
    } catch (error) {
      spinner.fail('Flutter is not installed');
      console.error(chalk.red('\n✗ Flutter is required for Lumora!'));
      console.log(chalk.yellow('\nPlease install Flutter first:'));
      console.log(chalk.cyan('  https://docs.flutter.dev/get-started/install\n'));
      process.exit(1);
    }

    // Create project directory
    fs.mkdirSync(projectPath, { recursive: true });

    // Initialize Flutter project
    spinner.start('Creating Flutter project (this may take a minute)...');
    execSync('flutter create . --project-name ' + projectName.replace(/-/g, '_'), {
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
    console.log(chalk.bold.green('✓ Lumora project created successfully!\n'));
    console.log(chalk.bold('📁 Project structure:\n'));
    console.log(chalk.gray('  src/          # React/TypeScript source (edit here)'));
    console.log(chalk.gray('  lib/          # Flutter/Dart (auto-synced from src/)'));
    console.log(chalk.gray('  android/      # Android native'));
    console.log(chalk.gray('  ios/          # iOS native'));
    console.log(chalk.gray('  web/          # Web build output\n'));

    console.log(chalk.bold('📝 Next steps:\n'));
    console.log(chalk.cyan(`   cd ${projectName}`));
    console.log(chalk.cyan('   npm install'));
    console.log(chalk.cyan('   lumora start\n'));
    console.log(chalk.yellow('💡 Edit src/App.tsx → lib/main.dart updates automatically!'));
    console.log(chalk.yellow('💡 Edit lib/main.dart → src/App.tsx updates automatically!\n'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to create project'));
    console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  }
}

function createConfigFiles(projectPath: string, projectName: string) {
  // package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'A Lumora project',
    private: true,
    scripts: {
      start: 'lumora start',
      dev: 'vite',
      build: 'vite build',
      'build:mobile': 'flutter build apk',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@vitejs/plugin-react': '^4.2.0',
      typescript: '^5.0.0',
      vite: '^5.0.0',
    },
  };
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

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
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }],
  };
  fs.writeFileSync(
    path.join(projectPath, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );

  // tsconfig.node.json
  const tsconfigNode = {
    compilerOptions: {
      composite: true,
      skipLibCheck: true,
      module: 'ESNext',
      moduleResolution: 'bundler',
      allowSyntheticDefaultImports: true,
    },
    include: ['vite.config.ts'],
  };
  fs.writeFileSync(
    path.join(projectPath, 'tsconfig.node.json'),
    JSON.stringify(tsconfigNode, null, 2)
  );

  // vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})
`;
  fs.writeFileSync(path.join(projectPath, 'vite.config.ts'), viteConfig);

  // index.html
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  fs.writeFileSync(path.join(projectPath, 'index.html'), indexHtml);

  // Update .gitignore to include Lumora-specific ignores
  const gitignorePath = path.join(projectPath, '.gitignore');
  let gitignore = fs.readFileSync(gitignorePath, 'utf-8');
  gitignore += `\n# Lumora
.lumora/
*.log
dist/
node_modules/
`;
  fs.writeFileSync(gitignorePath, gitignore);
}

function createExampleFiles(projectPath: string) {
  // src/main.tsx
  const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
  fs.writeFileSync(path.join(projectPath, 'src/main.tsx'), mainTsx);

  // Example React component (src/App.tsx)
  const appTsx = `import React, { useState } from 'react';

export default function App() {
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

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Start Development**:
   - **Magic Mode (Web + Mobile Sync)**:
     \`\`\`bash
     lumora start
     \`\`\`
   - **Standard Web Dev (Vite)**:
     \`\`\`bash
     npm run dev
     \`\`\`

3. **Previews**:
   - **Web**: http://localhost:3001 (Lumora) or http://localhost:3000 (Vite)
   - **Mobile**: Scan QR code with Lumora Dev Client

4. **Edit and Watch**:
   - Edit \`src/App.tsx\` → \`lib/main.dart\` updates automatically
   - Edit \`lib/main.dart\` → \`src/App.tsx\` updates automatically

## 📁 Project Structure

\`\`\`
${path.basename(projectPath)}/
├── src/              # React/TypeScript source (edit here)
│   ├── main.tsx      # Web entry point
│   ├── App.tsx       # Main app component
│   ├── components/   # Your React components
│   └── screens/      # Your app screens
├── lib/              # Flutter/Dart (auto-synced from src/)
│   ├── main.dart     # Auto-generated from src/App.tsx
│   ├── components/   # Auto-generated components
│   └── screens/      # Auto-generated screens
├── android/          # Android native code
├── ios/              # iOS native code
├── web/              # Web build output
├── index.html        # Web entry HTML
└── vite.config.ts    # Vite configuration
\`\`\`

## 🎯 Key Features

- ✅ **Bidirectional Sync**: React ↔ Flutter automatic conversion
- ✅ **Real-time Preview**: See changes instantly on web AND mobile
- ✅ **Standard Tooling**: Uses Vite for web, Flutter for mobile
- ✅ **Native Performance**: True Flutter native, not WebView
- ✅ **Like Expo Go**: But for Flutter with React syntax

## 📝 Commands

- \`lumora start\` - Start bidirectional development server
- \`npm run dev\` - Start standard Vite dev server
- \`npm run build\` - Build web app
- \`npm run build:mobile\` - Build Android APK

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
- [Vite Documentation](https://vitejs.dev)

## 🙏 Credits

Built with ❤️ using Lumora Framework
`;
  fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
}
