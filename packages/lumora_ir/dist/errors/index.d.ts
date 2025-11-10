/**
 * Error Handling and Recovery System
 *
 * Comprehensive error handling with detailed messages, suggestions,
 * fallback strategies, partial conversion support, and file backup.
 */
export { ErrorHandler, getErrorHandler, ErrorSeverity, ErrorCategory, SourceLocation, ErrorSuggestion, LumoraError, ParseErrorDetails, } from './error-handler';
export { ConversionErrorHandler, getConversionErrorHandler, ConversionFailureReason, ConversionErrorDetails, AlternativeApproach, } from './conversion-error-handler';
export { FallbackHandler, getFallbackHandler, FallbackStrategy, FallbackResult, UnmappedWidgetRecord, } from './fallback-handler';
export { PartialConversionHandler, getPartialConversionHandler, ConversionIssueSeverity, ConversionIssue, PartialConversionResult, TodoMarkerConfig, } from './partial-conversion-handler';
export { FileBackupHandler, getFileBackupHandler, BackupStrategy, BackupConfig, BackupRecord, } from './file-backup-handler';
