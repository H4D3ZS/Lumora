"use strict";
/**
 * Error Handling and Recovery System
 *
 * Comprehensive error handling with detailed messages, suggestions,
 * fallback strategies, partial conversion support, and file backup.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupStrategy = exports.getFileBackupHandler = exports.FileBackupHandler = exports.ConversionIssueSeverity = exports.getPartialConversionHandler = exports.PartialConversionHandler = exports.FallbackStrategy = exports.getFallbackHandler = exports.FallbackHandler = exports.ConversionFailureReason = exports.getConversionErrorHandler = exports.ConversionErrorHandler = exports.ErrorCategory = exports.ErrorSeverity = exports.getErrorHandler = exports.ErrorHandler = void 0;
// Error Handler
var error_handler_1 = require("./error-handler");
Object.defineProperty(exports, "ErrorHandler", { enumerable: true, get: function () { return error_handler_1.ErrorHandler; } });
Object.defineProperty(exports, "getErrorHandler", { enumerable: true, get: function () { return error_handler_1.getErrorHandler; } });
Object.defineProperty(exports, "ErrorSeverity", { enumerable: true, get: function () { return error_handler_1.ErrorSeverity; } });
Object.defineProperty(exports, "ErrorCategory", { enumerable: true, get: function () { return error_handler_1.ErrorCategory; } });
// Conversion Error Handler
var conversion_error_handler_1 = require("./conversion-error-handler");
Object.defineProperty(exports, "ConversionErrorHandler", { enumerable: true, get: function () { return conversion_error_handler_1.ConversionErrorHandler; } });
Object.defineProperty(exports, "getConversionErrorHandler", { enumerable: true, get: function () { return conversion_error_handler_1.getConversionErrorHandler; } });
Object.defineProperty(exports, "ConversionFailureReason", { enumerable: true, get: function () { return conversion_error_handler_1.ConversionFailureReason; } });
// Fallback Handler
var fallback_handler_1 = require("./fallback-handler");
Object.defineProperty(exports, "FallbackHandler", { enumerable: true, get: function () { return fallback_handler_1.FallbackHandler; } });
Object.defineProperty(exports, "getFallbackHandler", { enumerable: true, get: function () { return fallback_handler_1.getFallbackHandler; } });
Object.defineProperty(exports, "FallbackStrategy", { enumerable: true, get: function () { return fallback_handler_1.FallbackStrategy; } });
// Partial Conversion Handler
var partial_conversion_handler_1 = require("./partial-conversion-handler");
Object.defineProperty(exports, "PartialConversionHandler", { enumerable: true, get: function () { return partial_conversion_handler_1.PartialConversionHandler; } });
Object.defineProperty(exports, "getPartialConversionHandler", { enumerable: true, get: function () { return partial_conversion_handler_1.getPartialConversionHandler; } });
Object.defineProperty(exports, "ConversionIssueSeverity", { enumerable: true, get: function () { return partial_conversion_handler_1.ConversionIssueSeverity; } });
// File Backup Handler
var file_backup_handler_1 = require("./file-backup-handler");
Object.defineProperty(exports, "FileBackupHandler", { enumerable: true, get: function () { return file_backup_handler_1.FileBackupHandler; } });
Object.defineProperty(exports, "getFileBackupHandler", { enumerable: true, get: function () { return file_backup_handler_1.getFileBackupHandler; } });
Object.defineProperty(exports, "BackupStrategy", { enumerable: true, get: function () { return file_backup_handler_1.BackupStrategy; } });
