/**
 * Error Handling and Recovery System
 * 
 * Comprehensive error handling with detailed messages, suggestions,
 * fallback strategies, partial conversion support, and file backup.
 */

// Error Handler
export {
  ErrorHandler,
  getErrorHandler,
  ErrorSeverity,
  ErrorCategory,
  SourceLocation,
  ErrorSuggestion,
  LumoraError,
  ParseErrorDetails,
} from './error-handler';

// Conversion Error Handler
export {
  ConversionErrorHandler,
  getConversionErrorHandler,
  ConversionFailureReason,
  ConversionErrorDetails,
  AlternativeApproach,
} from './conversion-error-handler';

// Fallback Handler
export {
  FallbackHandler,
  getFallbackHandler,
  FallbackStrategy,
  FallbackResult,
  UnmappedWidgetRecord,
} from './fallback-handler';

// Partial Conversion Handler
export {
  PartialConversionHandler,
  getPartialConversionHandler,
  ConversionIssueSeverity,
  ConversionIssue,
  PartialConversionResult,
  TodoMarkerConfig,
} from './partial-conversion-handler';

// File Backup Handler
export {
  FileBackupHandler,
  getFileBackupHandler,
  BackupStrategy,
  BackupConfig,
  BackupRecord,
} from './file-backup-handler';
