import * as fs from 'fs';
import * as readline from 'readline';
import { ConflictRecord } from './conflict-detector';

/**
 * Resolution option types
 */
export enum ResolutionOption {
  USE_REACT = 'use_react',
  USE_FLUTTER = 'use_flutter',
  MANUAL_MERGE = 'manual_merge',
  SKIP = 'skip',
}

/**
 * Resolution choice
 */
export interface ResolutionChoice {
  option: ResolutionOption;
  conflict: ConflictRecord;
  timestamp: number;
}

/**
 * Diff view data
 */
export interface DiffViewData {
  conflict: ConflictRecord;
  reactContent: string;
  flutterContent: string;
  reactLines: string[];
  flutterLines: string[];
}

/**
 * Conflict Resolver UI
 * Provides UI components for conflict resolution across different platforms
 */
export class ConflictResolverUI {
  private rl?: readline.Interface;

  /**
   * Build CLI interactive prompt
   */
  async promptCLI(conflict: ConflictRecord): Promise<ResolutionChoice> {
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  CONFLICT RESOLUTION REQUIRED');
    console.log('='.repeat(80));
    console.log(`\nConflict ID: ${conflict.id}`);
    console.log(`React File: ${conflict.reactFile}`);
    console.log(`Flutter File: ${conflict.flutterFile}`);
    console.log(`\nReact modified at: ${new Date(conflict.reactTimestamp).toLocaleString()}`);
    console.log(`Flutter modified at: ${new Date(conflict.flutterTimestamp).toLocaleString()}`);
    console.log(`IR Version: ${conflict.irVersion}`);
    console.log('\n' + '-'.repeat(80));

    // Show file previews
    await this.showFilePreview('React', conflict.reactFile);
    console.log('\n' + '-'.repeat(80));
    await this.showFilePreview('Flutter', conflict.flutterFile);
    console.log('\n' + '-'.repeat(80));

    // Prompt for resolution
    console.log('\nHow would you like to resolve this conflict?');
    console.log('  1) Use React version (overwrite Flutter)');
    console.log('  2) Use Flutter version (overwrite React)');
    console.log('  3) Manual merge (open diff view)');
    console.log('  4) Skip (resolve later)');

    const choice = await this.promptChoice(['1', '2', '3', '4']);

    const optionMap: Record<string, ResolutionOption> = {
      '1': ResolutionOption.USE_REACT,
      '2': ResolutionOption.USE_FLUTTER,
      '3': ResolutionOption.MANUAL_MERGE,
      '4': ResolutionOption.SKIP,
    };

    return {
      option: optionMap[choice],
      conflict,
      timestamp: Date.now(),
    };
  }

  /**
   * Build web dashboard diff view data
   */
  buildWebDashboardDiffView(conflict: ConflictRecord): DiffViewData {
    const reactContent = this.readFileContent(conflict.reactFile);
    const flutterContent = this.readFileContent(conflict.flutterFile);

    return {
      conflict,
      reactContent,
      flutterContent,
      reactLines: reactContent.split('\n'),
      flutterLines: flutterContent.split('\n'),
    };
  }

  /**
   * Build VS Code extension diff view data
   */
  buildVSCodeDiffView(conflict: ConflictRecord): {
    leftUri: string;
    rightUri: string;
    title: string;
    options: object;
  } {
    return {
      leftUri: `file://${conflict.reactFile}`,
      rightUri: `file://${conflict.flutterFile}`,
      title: `Conflict: ${conflict.id}`,
      options: {
        preview: true,
        viewColumn: 1,
      },
    };
  }

  /**
   * Format conflict for web dashboard JSON
   */
  formatForWebDashboard(conflict: ConflictRecord): object {
    const diffView = this.buildWebDashboardDiffView(conflict);

    return {
      id: conflict.id,
      reactFile: conflict.reactFile,
      flutterFile: conflict.flutterFile,
      reactTimestamp: conflict.reactTimestamp,
      flutterTimestamp: conflict.flutterTimestamp,
      irVersion: conflict.irVersion,
      detectedAt: conflict.detectedAt,
      resolved: conflict.resolved,
      diffView: {
        reactLines: diffView.reactLines,
        flutterLines: diffView.flutterLines,
      },
      options: [
        { value: ResolutionOption.USE_REACT, label: 'Use React Version' },
        { value: ResolutionOption.USE_FLUTTER, label: 'Use Flutter Version' },
        { value: ResolutionOption.MANUAL_MERGE, label: 'Manual Merge' },
        { value: ResolutionOption.SKIP, label: 'Skip' },
      ],
    };
  }

  /**
   * Format conflict for VS Code extension
   */
  formatForVSCode(conflict: ConflictRecord): object {
    return {
      id: conflict.id,
      title: `Conflict: ${conflict.id}`,
      message: `Conflict detected between ${conflict.reactFile} and ${conflict.flutterFile}`,
      reactFile: conflict.reactFile,
      flutterFile: conflict.flutterFile,
      reactTimestamp: conflict.reactTimestamp,
      flutterTimestamp: conflict.flutterTimestamp,
      actions: [
        { title: 'Use React', command: 'lumora.resolveConflict', args: [conflict.id, ResolutionOption.USE_REACT] },
        { title: 'Use Flutter', command: 'lumora.resolveConflict', args: [conflict.id, ResolutionOption.USE_FLUTTER] },
        { title: 'Show Diff', command: 'lumora.showDiff', args: [conflict.id] },
        { title: 'Skip', command: 'lumora.skipConflict', args: [conflict.id] },
      ],
    };
  }

  /**
   * Show file preview in CLI
   */
  private async showFilePreview(label: string, filePath: string, maxLines: number = 20): Promise<void> {
    console.log(`\n${label} File Preview (${filePath}):`);
    
    try {
      const content = this.readFileContent(filePath);
      const lines = content.split('\n');
      const preview = lines.slice(0, maxLines);
      
      preview.forEach((line, index) => {
        console.log(`  ${(index + 1).toString().padStart(3, ' ')} | ${line}`);
      });

      if (lines.length > maxLines) {
        console.log(`  ... (${lines.length - maxLines} more lines)`);
      }
    } catch (error) {
      console.log(`  Error reading file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Read file content
   */
  private readFileContent(filePath: string): string {
    try {
      if (!fs.existsSync(filePath)) {
        return `[File not found: ${filePath}]`;
      }
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      return `[Error reading file: ${error instanceof Error ? error.message : String(error)}]`;
    }
  }

  /**
   * Prompt for user choice
   */
  private async promptChoice(validChoices: string[]): Promise<string> {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      const askQuestion = () => {
        this.rl!.question('\nYour choice: ', (answer) => {
          const choice = answer.trim();
          if (validChoices.includes(choice)) {
            this.rl!.close();
            resolve(choice);
          } else {
            console.log(`Invalid choice. Please enter one of: ${validChoices.join(', ')}`);
            askQuestion();
          }
        });
      };
      askQuestion();
    });
  }

  /**
   * Display side-by-side diff in CLI
   */
  displayCLIDiff(conflict: ConflictRecord): void {
    const diffView = this.buildWebDashboardDiffView(conflict);
    const maxLines = Math.max(diffView.reactLines.length, diffView.flutterLines.length);
    const columnWidth = 60;

    console.log('\n' + '='.repeat(columnWidth * 2 + 5));
    console.log('SIDE-BY-SIDE DIFF');
    console.log('='.repeat(columnWidth * 2 + 5));
    console.log(
      'React'.padEnd(columnWidth) + ' | ' + 'Flutter'.padEnd(columnWidth)
    );
    console.log('-'.repeat(columnWidth) + ' | ' + '-'.repeat(columnWidth));

    for (let i = 0; i < maxLines; i++) {
      const reactLine = (diffView.reactLines[i] || '').substring(0, columnWidth - 1);
      const flutterLine = (diffView.flutterLines[i] || '').substring(0, columnWidth - 1);
      
      const reactPadded = reactLine.padEnd(columnWidth);
      const flutterPadded = flutterLine.padEnd(columnWidth);
      
      // Highlight differences
      const isDifferent = reactLine !== flutterLine;
      const marker = isDifferent ? '!' : ' ';
      
      console.log(`${reactPadded}${marker}|${marker}${flutterPadded}`);
    }

    console.log('='.repeat(columnWidth * 2 + 5));
  }

  /**
   * Generate HTML diff view for web dashboard
   */
  generateHTMLDiff(conflict: ConflictRecord): string {
    const diffView = this.buildWebDashboardDiffView(conflict);
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Conflict Resolution - ${conflict.id}</title>
  <style>
    body { font-family: monospace; margin: 20px; }
    .header { background: #f0f0f0; padding: 10px; margin-bottom: 20px; }
    .diff-container { display: flex; gap: 20px; }
    .diff-panel { flex: 1; border: 1px solid #ccc; }
    .diff-header { background: #e0e0e0; padding: 5px 10px; font-weight: bold; }
    .diff-content { padding: 10px; }
    .line { padding: 2px 5px; }
    .line-number { color: #999; margin-right: 10px; }
    .different { background: #ffe0e0; }
    .actions { margin-top: 20px; }
    button { padding: 10px 20px; margin-right: 10px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Conflict Resolution</h2>
    <p><strong>ID:</strong> ${conflict.id}</p>
    <p><strong>React File:</strong> ${conflict.reactFile}</p>
    <p><strong>Flutter File:</strong> ${conflict.flutterFile}</p>
    <p><strong>Detected:</strong> ${new Date(conflict.detectedAt).toLocaleString()}</p>
  </div>
  
  <div class="diff-container">
    <div class="diff-panel">
      <div class="diff-header">React Version</div>
      <div class="diff-content">
        ${this.generateLineHTML(diffView.reactLines, diffView.flutterLines)}
      </div>
    </div>
    
    <div class="diff-panel">
      <div class="diff-header">Flutter Version</div>
      <div class="diff-content">
        ${this.generateLineHTML(diffView.flutterLines, diffView.reactLines)}
      </div>
    </div>
  </div>
  
  <div class="actions">
    <button onclick="resolve('${ResolutionOption.USE_REACT}')">Use React Version</button>
    <button onclick="resolve('${ResolutionOption.USE_FLUTTER}')">Use Flutter Version</button>
    <button onclick="resolve('${ResolutionOption.MANUAL_MERGE}')">Manual Merge</button>
    <button onclick="resolve('${ResolutionOption.SKIP}')">Skip</button>
  </div>
  
  <script>
    function resolve(option) {
      // Send resolution to backend
      fetch('/api/conflicts/${conflict.id}/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option })
      }).then(() => {
        window.location.href = '/conflicts';
      });
    }
  </script>
</body>
</html>
`;
    
    return html;
  }

  /**
   * Generate HTML for lines with diff highlighting
   */
  private generateLineHTML(lines: string[], compareLines: string[]): string {
    return lines
      .map((line, index) => {
        const isDifferent = line !== (compareLines[index] || '');
        const className = isDifferent ? 'line different' : 'line';
        const lineNumber = (index + 1).toString().padStart(4, ' ');
        const escapedLine = this.escapeHTML(line);
        return `<div class="${className}"><span class="line-number">${lineNumber}</span>${escapedLine}</div>`;
      })
      .join('\n');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Close readline interface
   */
  close(): void {
    if (this.rl) {
      this.rl.close();
    }
  }
}
