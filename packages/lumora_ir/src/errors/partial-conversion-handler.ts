/**
 * Partial Conversion Handler - Handles partial conversions with TODO markers
 * 
 * Enables completing convertible parts of code while marking problematic
 * sections with TODO comments for manual implementation.
 */

/**
 * Conversion issue severity
 */
export enum ConversionIssueSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Conversion issue
 */
export interface ConversionIssue {
  severity: ConversionIssueSeverity;
  message: string;
  location?: {
    line?: number;
    column?: number;
    nodeId?: string;
  };
  suggestion?: string;
  code?: string;
}

/**
 * Partial conversion result
 */
export interface PartialConversionResult {
  success: boolean;
  code: string;
  issues: ConversionIssue[];
  completionPercentage: number;
  convertedNodes: number;
  totalNodes: number;
  hasManualWork: boolean;
}

/**
 * TODO marker configuration
 */
export interface TodoMarkerConfig {
  prefix: string;
  includeLineNumber: boolean;
  includeTimestamp: boolean;
  includeIssueId: boolean;
}

/**
 * Partial Conversion Handler class
 */
export class PartialConversionHandler {
  private static instance: PartialConversionHandler;
  private issues: ConversionIssue[] = [];
  private convertedNodes = 0;
  private totalNodes = 0;
  private todoConfig: TodoMarkerConfig = {
    prefix: 'TODO(Lumora)',
    includeLineNumber: true,
    includeTimestamp: false,
    includeIssueId: false,
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PartialConversionHandler {
    if (!PartialConversionHandler.instance) {
      PartialConversionHandler.instance = new PartialConversionHandler();
    }
    return PartialConversionHandler.instance;
  }

  /**
   * Configure TODO marker format
   */
  public configureTodoMarker(config: Partial<TodoMarkerConfig>): void {
    this.todoConfig = { ...this.todoConfig, ...config };
  }

  /**
   * Start new conversion session
   */
  public startConversion(totalNodes: number): void {
    this.issues = [];
    this.convertedNodes = 0;
    this.totalNodes = totalNodes;
  }

  /**
   * Record successful node conversion
   */
  public recordSuccess(): void {
    this.convertedNodes++;
  }

  /**
   * Record conversion issue
   */
  public recordIssue(issue: ConversionIssue): void {
    this.issues.push(issue);
  }

  /**
   * Generate TODO comment for unconverted code
   */
  public generateTodoComment(
    framework: 'react' | 'flutter',
    issue: ConversionIssue,
    originalCode?: string
  ): string {
    const commentStyle = framework === 'react' ? '//' : '//';
    let comment = '';

    // Main TODO line
    let todoLine = `${commentStyle} ${this.todoConfig.prefix}: ${issue.message}`;
    
    if (this.todoConfig.includeLineNumber && issue.location?.line) {
      todoLine += ` (line ${issue.location.line})`;
    }
    
    if (this.todoConfig.includeTimestamp) {
      todoLine += ` [${new Date().toISOString()}]`;
    }

    comment += todoLine + '\n';

    // Add suggestion if available
    if (issue.suggestion) {
      comment += `${commentStyle} Suggestion: ${issue.suggestion}\n`;
    }

    // Add original code if available
    if (originalCode) {
      const lines = originalCode.split('\n');
      comment += `${commentStyle} Original code:\n`;
      lines.forEach(line => {
        comment += `${commentStyle}   ${line}\n`;
      });
    }

    // Add example code if available
    if (issue.code) {
      comment += `${commentStyle} Example:\n`;
      const lines = issue.code.split('\n');
      lines.forEach(line => {
        comment += `${commentStyle}   ${line}\n`;
      });
    }

    return comment;
  }

  /**
   * Generate fallback code with TODO marker
   */
  public generateFallbackCode(
    framework: 'react' | 'flutter',
    issue: ConversionIssue,
    originalCode?: string
  ): string {
    const todoComment = this.generateTodoComment(framework, issue, originalCode);
    let fallbackCode = '';

    if (framework === 'react') {
      fallbackCode = `${todoComment}<div>\n  {/* Implement this component manually */}\n</div>`;
    } else {
      fallbackCode = `${todoComment}Container(\n  // Implement this widget manually\n  child: const Placeholder(),\n)`;
    }

    return fallbackCode;
  }

  /**
   * Wrap problematic code section with TODO markers
   */
  public wrapWithTodoMarkers(
    framework: 'react' | 'flutter',
    code: string,
    issue: ConversionIssue
  ): string {
    const commentStyle = framework === 'react' ? '//' : '//';
    const startMarker = `${commentStyle} ${this.todoConfig.prefix} START: ${issue.message}`;
    const endMarker = `${commentStyle} ${this.todoConfig.prefix} END`;

    return `${startMarker}\n${code}\n${endMarker}`;
  }

  /**
   * Get conversion result
   */
  public getResult(generatedCode: string): PartialConversionResult {
    const completionPercentage = this.totalNodes > 0
      ? Math.round((this.convertedNodes / this.totalNodes) * 100)
      : 0;

    const hasManualWork = this.issues.some(
      issue => issue.severity === ConversionIssueSeverity.ERROR
    );

    return {
      success: completionPercentage > 0,
      code: generatedCode,
      issues: [...this.issues],
      completionPercentage,
      convertedNodes: this.convertedNodes,
      totalNodes: this.totalNodes,
      hasManualWork,
    };
  }

  /**
   * Format conversion summary
   */
  public formatSummary(result: PartialConversionResult): string {
    let summary = '\n';
    summary += '═══════════════════════════════════════════════════════\n';
    summary += '  Partial Conversion Summary\n';
    summary += '═══════════════════════════════════════════════════════\n\n';

    // Completion status
    const statusIcon = result.completionPercentage === 100 ? '✓' : '⚠️';
    summary += `${statusIcon} Completion: ${result.completionPercentage}% `;
    summary += `(${result.convertedNodes}/${result.totalNodes} nodes)\n\n`;

    // Issues breakdown
    if (result.issues.length > 0) {
      const errors = result.issues.filter(i => i.severity === ConversionIssueSeverity.ERROR);
      const warnings = result.issues.filter(i => i.severity === ConversionIssueSeverity.WARNING);
      const infos = result.issues.filter(i => i.severity === ConversionIssueSeverity.INFO);

      summary += 'Issues:\n';
      if (errors.length > 0) {
        summary += `  ❌ Errors: ${errors.length}\n`;
      }
      if (warnings.length > 0) {
        summary += `  ⚠️  Warnings: ${warnings.length}\n`;
      }
      if (infos.length > 0) {
        summary += `  ℹ️  Info: ${infos.length}\n`;
      }
      summary += '\n';

      // List issues
      summary += 'Issue Details:\n';
      result.issues.forEach((issue, index) => {
        const icon = this.getIssueIcon(issue.severity);
        summary += `\n${index + 1}. ${icon} ${issue.message}\n`;
        
        if (issue.location?.line) {
          summary += `   Location: Line ${issue.location.line}`;
          if (issue.location.column) {
            summary += `, Column ${issue.location.column}`;
          }
          summary += '\n';
        }
        
        if (issue.suggestion) {
          summary += `   💡 ${issue.suggestion}\n`;
        }
      });
      summary += '\n';
    }

    // Manual work required
    if (result.hasManualWork) {
      summary += '⚠️  Manual Work Required:\n';
      summary += '   The generated code contains TODO markers for sections that\n';
      summary += '   could not be automatically converted. Please review and\n';
      summary += '   implement these sections manually.\n\n';
      summary += '   Search for "TODO(Lumora)" in the generated code.\n\n';
    }

    // Next steps
    summary += 'Next Steps:\n';
    if (result.hasManualWork) {
      summary += '  1. Review TODO markers in the generated code\n';
      summary += '  2. Implement unconverted sections manually\n';
      summary += '  3. Test the implementation\n';
      summary += '  4. Remove TODO markers once complete\n';
    } else {
      summary += '  1. Review the generated code\n';
      summary += '  2. Test the implementation\n';
      summary += '  3. Make any necessary adjustments\n';
    }

    summary += '\n';
    summary += '═══════════════════════════════════════════════════════\n';

    return summary;
  }

  /**
   * Get issue icon
   */
  private getIssueIcon(severity: ConversionIssueSeverity): string {
    switch (severity) {
      case ConversionIssueSeverity.ERROR:
        return '❌';
      case ConversionIssueSeverity.WARNING:
        return '⚠️';
      case ConversionIssueSeverity.INFO:
        return 'ℹ️';
      default:
        return '•';
    }
  }

  /**
   * Generate issue report file content
   */
  public generateIssueReport(result: PartialConversionResult, sourceFile: string): string {
    let report = '# Lumora Conversion Issue Report\n\n';
    report += `**Source File:** ${sourceFile}\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Completion:** ${result.completionPercentage}%\n\n`;

    report += '## Summary\n\n';
    report += `- Total Nodes: ${result.totalNodes}\n`;
    report += `- Converted Nodes: ${result.convertedNodes}\n`;
    report += `- Issues: ${result.issues.length}\n`;
    report += `- Manual Work Required: ${result.hasManualWork ? 'Yes' : 'No'}\n\n`;

    if (result.issues.length > 0) {
      report += '## Issues\n\n';
      
      result.issues.forEach((issue, index) => {
        report += `### ${index + 1}. ${issue.message}\n\n`;
        report += `**Severity:** ${issue.severity}\n\n`;
        
        if (issue.location) {
          report += '**Location:**\n';
          if (issue.location.line) {
            report += `- Line: ${issue.location.line}\n`;
          }
          if (issue.location.column) {
            report += `- Column: ${issue.location.column}\n`;
          }
          if (issue.location.nodeId) {
            report += `- Node ID: ${issue.location.nodeId}\n`;
          }
          report += '\n';
        }
        
        if (issue.suggestion) {
          report += `**Suggestion:** ${issue.suggestion}\n\n`;
        }
        
        if (issue.code) {
          report += '**Example Code:**\n\n```\n';
          report += issue.code;
          report += '\n```\n\n';
        }
        
        report += '---\n\n';
      });
    }

    report += '## Next Steps\n\n';
    report += '1. Search for `TODO(Lumora)` markers in the generated code\n';
    report += '2. Review each issue listed above\n';
    report += '3. Implement the unconverted sections manually\n';
    report += '4. Test your implementation\n';
    report += '5. Remove TODO markers once complete\n\n';

    report += '## Resources\n\n';
    report += '- [Lumora Documentation](https://lumora.dev/docs)\n';
    report += '- [Widget Mappings Guide](https://lumora.dev/docs/widget-mappings)\n';
    report += '- [Conversion Best Practices](https://lumora.dev/docs/best-practices)\n';

    return report;
  }

  /**
   * Clear conversion state
   */
  public clear(): void {
    this.issues = [];
    this.convertedNodes = 0;
    this.totalNodes = 0;
  }
}

/**
 * Get singleton instance of PartialConversionHandler
 */
export function getPartialConversionHandler(): PartialConversionHandler {
  return PartialConversionHandler.getInstance();
}
