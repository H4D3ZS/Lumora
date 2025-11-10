/**
 * Lumora Init Command
 * Creates a new Lumora project
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

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
    console.log(chalk.bold.green('✓ Project created successfully!\n'));
    console.log(chalk.bold('📝 Next steps:\n'));
    console.log(chalk.cyan(`   cd ${projectName}`));
    console.log(chalk.cyan('   npm install'));
    console.log(chalk.cyan('   lumora start\n'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to create project'));
    console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  }
}

function createConfigFiles(projectPath: string) {
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
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

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

function createExampleFiles(projectPath: string) {
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
