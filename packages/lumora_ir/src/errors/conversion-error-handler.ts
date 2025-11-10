/**
 * Conversion Error Handler - Handles conversion failures with detailed explanations
 * 
 * Provides specific error handling for conversion failures between React and Flutter,
 * including explanations of why conversion failed and alternative approaches.
 */

import {
  ErrorHandler,
  LumoraError,
  ErrorCategory,
  ErrorSeverity,
  ErrorSuggestion,
  SourceLocation,
} from './error-handler';

/**
 * Conversion failure reason
 */
export enum ConversionFailureReason {
  UNSUPPORTED_FEATURE = 'unsupported_feature',
  UNMAPPED_WIDGET = 'unmapped_widget',
  INCOMPATIBLE_PATTERN = 'incompatible_pattern',
  MISSING_DEPENDENCY = 'missing_dependency',
  INVALID_IR = 'invalid_ir',
  GENERATION_ERROR = 'generation_error',
}

/**
 * Conversion error details
 */
export interface ConversionErrorDetails {
  reason: ConversionFailureReason;
  sourceFramework: 'react' | 'flutter';
  targetFramework: 'react' | 'flutter';
  filePath: string;
  featureName?: string;
  widgetType?: string;
  patternName?: string;
  errorMessage: string;
  location?: {
    line?: number;
    column?: number;
  };
}

/**
 * Alternative approach suggestion
 */
export interface AlternativeApproach {
  title: string;
  description: string;
  example?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Conversion Error Handler class
 */
export class ConversionErrorHandler {
  private static instance: ConversionErrorHandler;
  private errorHandler: ErrorHandler;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConversionErrorHandler {
    if (!ConversionErrorHandler.instance) {
      ConversionErrorHandler.instance = new ConversionErrorHandler();
    }
    return ConversionErrorHandler.instance;
  }

  /**
   * Handle conversion failure
   */
  public handleConversionFailure(details: ConversionErrorDetails): LumoraError {
    const error: LumoraError = {
      category: ErrorCategory.CONVERSION,
      severity: ErrorSeverity.ERROR,
      message: `Conversion failed: ${details.sourceFramework} → ${details.targetFramework}`,
      description: this.getFailureDescription(details),
      location: details.location ? {
        filePath: details.filePath,
        line: details.location.line,
        column: details.location.column,
      } : { filePath: details.filePath },
      suggestions: this.generateConversionSuggestions(details),
      timestamp: Date.now(),
      recoverable: this.isRecoverable(details.reason),
    };

    this.errorHandler['logError'](error);
    return error;
  }

  /**
   * Get failure description based on reason
   */
  private getFailureDescription(details: ConversionErrorDetails): string {
    switch (details.reason) {
      case ConversionFailureReason.UNSUPPORTED_FEATURE:
        return `The feature "${details.featureName}" is not yet supported for conversion from ${details.sourceFramework} to ${details.targetFramework}.`;

      case ConversionFailureReason.UNMAPPED_WIDGET:
        return `The widget/component "${details.widgetType}" does not have a mapping defined for ${details.targetFramework}.`;

      case ConversionFailureReason.INCOMPATIBLE_PATTERN:
        return `The pattern "${details.patternName}" used in ${details.sourceFramework} has no direct equivalent in ${details.targetFramework}.`;

      case ConversionFailureReason.MISSING_DEPENDENCY:
        return `A required dependency is missing for converting this code to ${details.targetFramework}.`;

      case ConversionFailureReason.INVALID_IR:
        return `The intermediate representation (IR) generated from the source code is invalid or incomplete.`;

      case ConversionFailureReason.GENERATION_ERROR:
        return `An error occurred while generating ${details.targetFramework} code: ${details.errorMessage}`;

      default:
        return details.errorMessage;
    }
  }

  /**
   * Generate suggestions for conversion failures
   */
  private generateConversionSuggestions(details: ConversionErrorDetails): ErrorSuggestion[] {
    const suggestions: ErrorSuggestion[] = [];

    switch (details.reason) {
      case ConversionFailureReason.UNSUPPORTED_FEATURE:
        suggestions.push({
          message: 'Check the documentation for supported features',
          action: 'Visit the Lumora documentation to see the list of supported features',
        });
        suggestions.push({
          message: 'Consider implementing this feature manually in the target framework',
          action: 'Use the partial conversion output as a starting point',
        });
        suggestions.push({
          message: 'Request feature support',
          action: 'Open an issue on the Lumora GitHub repository',
        });
        break;

      case ConversionFailureReason.UNMAPPED_WIDGET:
        suggestions.push({
          message: 'Add a custom widget mapping',
          action: 'Define a mapping in widget-mappings.yaml or lumora.yaml',
          code: this.getWidgetMappingExample(details),
        });
        suggestions.push({
          message: 'Use a similar widget that is supported',
          action: this.getSimilarWidgetSuggestion(details),
        });
        suggestions.push({
          message: 'Implement the widget manually after conversion',
          action: 'The converter will use a fallback widget that you can replace',
        });
        break;

      case ConversionFailureReason.INCOMPATIBLE_PATTERN:
        const alternatives = this.getAlternativeApproaches(details);
        alternatives.forEach(alt => {
          suggestions.push({
            message: `${alt.title} (${alt.difficulty})`,
            action: alt.description,
            code: alt.example,
          });
        });
        break;

      case ConversionFailureReason.MISSING_DEPENDENCY:
        suggestions.push({
          message: 'Install required dependencies',
          action: details.targetFramework === 'flutter'
            ? 'Run: flutter pub add <package_name>'
            : 'Run: npm install <package_name>',
        });
        suggestions.push({
          message: 'Check your project configuration',
          action: details.targetFramework === 'flutter'
            ? 'Verify pubspec.yaml has all required dependencies'
            : 'Verify package.json has all required dependencies',
        });
        break;

      case ConversionFailureReason.INVALID_IR:
        suggestions.push({
          message: 'Simplify the source code',
          action: 'Try breaking down complex components into smaller pieces',
        });
        suggestions.push({
          message: 'Check for syntax errors in the source file',
          action: 'Ensure the source code compiles without errors',
        });
        suggestions.push({
          message: 'Report this issue',
          action: 'This may be a bug in the parser - please report it',
        });
        break;

      case ConversionFailureReason.GENERATION_ERROR:
        suggestions.push({
          message: 'Review the error message for specific issues',
          action: 'The error message may contain details about what went wrong',
        });
        suggestions.push({
          message: 'Try converting a simpler version first',
          action: 'Remove complex features and add them back incrementally',
        });
        break;
    }

    // Always add general suggestions
    suggestions.push({
      message: 'Use --dry-run to preview the conversion',
      action: 'Run: lumora convert --dry-run <file>',
    });

    return suggestions;
  }

  /**
   * Get widget mapping example
   */
  private getWidgetMappingExample(details: ConversionErrorDetails): string {
    if (details.sourceFramework === 'react' && details.targetFramework === 'flutter') {
      return `
# In widget-mappings.yaml
react_to_flutter:
  ${details.widgetType}:
    flutter: YourFlutterWidget
    props:
      someProp: someFlutterProp
`;
    } else {
      return `
# In widget-mappings.yaml
flutter_to_react:
  ${details.widgetType}:
    react: YourReactComponent
    props:
      someFlutterProp: someProp
`;
    }
  }

  /**
   * Get similar widget suggestion
   */
  private getSimilarWidgetSuggestion(details: ConversionErrorDetails): string {
    // This could be enhanced with a similarity algorithm
    const widgetType = details.widgetType?.toLowerCase() || '';

    if (widgetType.includes('button')) {
      return details.targetFramework === 'flutter'
        ? 'Try using ElevatedButton, TextButton, or OutlinedButton'
        : 'Try using Button or TouchableOpacity';
    } else if (widgetType.includes('text')) {
      return details.targetFramework === 'flutter'
        ? 'Try using Text widget'
        : 'Try using Text component';
    } else if (widgetType.includes('container') || widgetType.includes('view')) {
      return details.targetFramework === 'flutter'
        ? 'Try using Container or SizedBox'
        : 'Try using View or div';
    } else if (widgetType.includes('list')) {
      return details.targetFramework === 'flutter'
        ? 'Try using ListView or Column'
        : 'Try using FlatList or map()';
    }

    return 'Check the widget mappings documentation for similar widgets';
  }

  /**
   * Get alternative approaches for incompatible patterns
   */
  private getAlternativeApproaches(details: ConversionErrorDetails): AlternativeApproach[] {
    const alternatives: AlternativeApproach[] = [];
    const patternName = details.patternName?.toLowerCase() || '';

    // State management alternatives
    if (patternName.includes('redux')) {
      alternatives.push({
        title: 'Use Bloc pattern',
        description: 'Flutter\'s Bloc pattern provides similar state management capabilities',
        example: 'See: https://bloclibrary.dev/',
        difficulty: 'medium',
      });
      alternatives.push({
        title: 'Use Riverpod',
        description: 'Riverpod is a reactive state management solution similar to Redux',
        example: 'See: https://riverpod.dev/',
        difficulty: 'medium',
      });
    }

    // Context alternatives
    if (patternName.includes('context')) {
      alternatives.push({
        title: 'Use InheritedWidget',
        description: 'Flutter\'s InheritedWidget provides similar context propagation',
        difficulty: 'medium',
      });
      alternatives.push({
        title: 'Use Provider',
        description: 'Provider package offers a simpler alternative to InheritedWidget',
        difficulty: 'easy',
      });
    }

    // Navigation alternatives
    if (patternName.includes('navigation') || patternName.includes('router')) {
      alternatives.push({
        title: 'Use Navigator 2.0',
        description: 'Flutter\'s declarative navigation system',
        difficulty: 'hard',
      });
      alternatives.push({
        title: 'Use go_router',
        description: 'A popular routing package for Flutter',
        difficulty: 'medium',
      });
    }

    // Generic alternative
    if (alternatives.length === 0) {
      alternatives.push({
        title: 'Manual implementation',
        description: `Implement the ${patternName} pattern manually in ${details.targetFramework}`,
        difficulty: 'medium',
      });
    }

    return alternatives;
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverable(reason: ConversionFailureReason): boolean {
    switch (reason) {
      case ConversionFailureReason.UNMAPPED_WIDGET:
      case ConversionFailureReason.MISSING_DEPENDENCY:
        return true;
      case ConversionFailureReason.UNSUPPORTED_FEATURE:
      case ConversionFailureReason.INCOMPATIBLE_PATTERN:
      case ConversionFailureReason.INVALID_IR:
      case ConversionFailureReason.GENERATION_ERROR:
        return false;
      default:
        return false;
    }
  }

  /**
   * Format conversion error for display
   */
  public formatConversionError(error: LumoraError): string {
    return this.errorHandler.formatError(error);
  }
}

/**
 * Get singleton instance of ConversionErrorHandler
 */
export function getConversionErrorHandler(): ConversionErrorHandler {
  return ConversionErrorHandler.getInstance();
}
