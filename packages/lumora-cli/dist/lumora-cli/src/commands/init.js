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
        // Create project directory
        spinner.start('Creating project structure...');
        fs.mkdirSync(projectPath, { recursive: true });
        // Create subdirectories
        const dirs = [
            'web/src/components',
            'web/src/screens',
            'web/public',
            'mobile/lib/widgets',
            'mobile/lib/screens',
            'mobile/test',
            '.lumora/ir',
        ];
        dirs.forEach(dir => {
            fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
        });
        spinner.succeed('Project structure created');
        // Create configuration file
        spinner.start('Creating configuration files...');
        createConfigFiles(projectPath);
        spinner.succeed('Configuration files created');
        // Create example files
        spinner.start('Creating example files...');
        createExampleFiles(projectPath);
        spinner.succeed('Example files created');
        // Success message
        console.log();
        console.log(chalk_1.default.bold.green('✓ Project created successfully!\n'));
        console.log(chalk_1.default.bold('📝 Next steps:\n'));
        console.log(chalk_1.default.cyan(`   cd ${projectName}`));
        console.log(chalk_1.default.cyan('   npm install'));
        console.log(chalk_1.default.cyan('   lumora start\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('Failed to create project'));
        console.error(chalk_1.default.red(`\nError: ${error instanceof Error ? error.message : String(error)}\n`));
        process.exit(1);
    }
}
function createConfigFiles(projectPath) {
    // lumora.config.js
    const config = `module.exports = {
  watchDir: 'web/src',
  reactDir: 'web/src',
  flutterDir: 'mobile/lib',
  storageDir: '.lumora/ir',
  port: 3000,
  mode: 'universal',
  autoConvert: true,
  autoPush: true,
  generateCode: true,
};
`;
    fs.writeFileSync(path.join(projectPath, 'lumora.config.js'), config);
    // package.json
    const packageJson = {
        name: path.basename(projectPath),
        version: '0.1.0',
        private: true,
        scripts: {
            start: 'lumora start',
            build: 'lumora build',
        },
        dependencies: {
            'lumora-cli': '^0.1.0',
            'lumora-ir': '^0.1.0',
        },
    };
    fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
    // .gitignore
    const gitignore = `node_modules/
dist/
build/
.lumora/
*.log
.DS_Store
`;
    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);
}
function createExampleFiles(projectPath) {
    // Example React component
    const appTsx = `import React, { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Welcome to Lumora!
      </Text>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Count: {count}
      </Text>
      <Button onPress={() => setCount(count + 1)}>
        Increment
      </Button>
    </View>
  );
}
`;
    fs.writeFileSync(path.join(projectPath, 'web/src/App.tsx'), appTsx);
    // README
    const readme = `# ${path.basename(projectPath)}

A Lumora project - Write React, Run Flutter!

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   lumora start
   \`\`\`

3. Scan QR code with Lumora Dev Client

4. Edit \`web/src/App.tsx\` and see changes instantly!

## Commands

- \`lumora start\` - Start development server
- \`lumora build\` - Build production app

## Learn More

- [Lumora Documentation](https://lumora.dev)
- [Flutter Documentation](https://flutter.dev)
- [React Documentation](https://react.dev)
`;
    fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
}
//# sourceMappingURL=init.js.map