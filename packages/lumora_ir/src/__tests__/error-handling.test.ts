/**
 * Error Handling System Tests
 */

import {
  ErrorHandler,
  ErrorSeverity,
  ErrorCategory,
  ConversionErrorHandler,
  ConversionFailureReason,
  FallbackHandler,
  FallbackStrategy,
  PartialConversionHandler,
  ConversionIssueSeverity,
  FileBackupHandler,
  BackupStrategy,
} from '../errors';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearErrorLog();
  });

  test('should handle parse errors with location', () => {
    const error = errorHandler.handleParseError({
      filePath: '/test/file.tsx',
      line: 10,
      column: 5,
      errorMessage: 'Unexpected token',
      sourceCode: 'const x = {\n  invalid syntax\n}',
      framework: 'react',
    });

    expect(error.category).toBe(ErrorCategory.PARSE);
    expect(error.severity).toBe(ErrorSeverity.ERROR);
    expect(error.location?.line).toBe(10);
    expect(error.location?.column).toBe(5);
    expect(error.suggestions.length).toBeGreaterThan(0);
  });

  test('should format error for display', () => {
    const error = errorHandler.handleParseError({
      filePath: '/test/file.tsx',
      line: 10,
      errorMessage: 'Syntax error',
    });

    const formatted = errorHandler.formatError(error);
    expect(formatted).toContain('ERROR');
    expect(formatted).toContain('/test/file.tsx');
    expect(formatted).toContain('Line: 10');
    expect(formatted).toContain('Suggestions');
  });

  test('should maintain error log', () => {
    errorHandler.handleParseError({
      filePath: '/test/file1.tsx',
      errorMessage: 'Error 1',
    });

    errorHandler.handleParseError({
      filePath: '/test/file2.tsx',
      errorMessage: 'Error 2',
    });

    const log = errorHandler.getErrorLog();
    expect(log.length).toBe(2);
  });

  test('should filter errors by category', () => {
    errorHandler.handleParseError({
      filePath: '/test/file.tsx',
      errorMessage: 'Parse error',
    });

    const parseErrors = errorHandler.getErrorsByCategory(ErrorCategory.PARSE);
    expect(parseErrors.length).toBe(1);
    expect(parseErrors[0].category).toBe(ErrorCategory.PARSE);
  });
});

describe('ConversionErrorHandler', () => {
  let conversionErrorHandler: ConversionErrorHandler;

  beforeEach(() => {
    conversionErrorHandler = ConversionErrorHandler.getInstance();
  });

  test('should handle unsupported feature error', () => {
    const error = conversionErrorHandler.handleConversionFailure({
      reason: ConversionFailureReason.UNSUPPORTED_FEATURE,
      sourceFramework: 'react',
      targetFramework: 'flutter',
      filePath: '/test/component.tsx',
      featureName: 'Suspense',
      errorMessage: 'Suspense is not supported',
    });

    expect(error.category).toBe(ErrorCategory.CONVERSION);
    expect(error.description).toContain('not yet supported');
    expect(error.suggestions.length).toBeGreaterThan(0);
  });

  test('should handle unmapped widget error', () => {
    const error = conversionErrorHandler.handleConversionFailure({
      reason: ConversionFailureReason.UNMAPPED_WIDGET,
      sourceFramework: 'react',
      targetFramework: 'flutter',
      filePath: '/test/component.tsx',
      widgetType: 'CustomButton',
      errorMessage: 'No mapping found',
    });

    expect(error.description).toContain('does not have a mapping');
    expect(error.suggestions.some(s => s.message.includes('custom widget mapping'))).toBe(true);
  });

  test('should provide alternative approaches for incompatible patterns', () => {
    const error = conversionErrorHandler.handleConversionFailure({
      reason: ConversionFailureReason.INCOMPATIBLE_PATTERN,
      sourceFramework: 'react',
      targetFramework: 'flutter',
      filePath: '/test/component.tsx',
      patternName: 'Redux',
      errorMessage: 'Redux pattern not compatible',
    });

    expect(error.suggestions.length).toBeGreaterThan(0);
    expect(error.suggestions.some(s => s.message.includes('Bloc') || s.message.includes('Riverpod'))).toBe(true);
  });
});

describe('FallbackHandler', () => {
  let fallbackHandler: FallbackHandler;

  beforeEach(() => {
    fallbackHandler = FallbackHandler.getInstance();
    fallbackHandler.clearUnmappedWidgets();
  });

  test('should provide generic fallback', () => {
    fallbackHandler.setStrategy(FallbackStrategy.GENERIC);
    
    const result = fallbackHandler.getFallbackWidget('CustomWidget', 'react', 'flutter');
    
    expect(result.widgetName).toBe('Container');
    expect(result.strategy).toBe(FallbackStrategy.GENERIC);
    expect(result.warning).toContain('Unmapped Widget');
  });

  test('should find similar widget', () => {
    fallbackHandler.setStrategy(FallbackStrategy.SIMILAR);
    
    const result = fallbackHandler.getFallbackWidget('MyButton', 'react', 'flutter');
    
    expect(result.widgetName).toBe('ElevatedButton');
    expect(result.strategy).toBe(FallbackStrategy.SIMILAR);
  });

  test('should preserve original widget name', () => {
    fallbackHandler.setStrategy(FallbackStrategy.PRESERVE);
    
    const result = fallbackHandler.getFallbackWidget('CustomWidget', 'react', 'flutter');
    
    expect(result.widgetName).toBe('CustomWidget');
    expect(result.strategy).toBe(FallbackStrategy.PRESERVE);
  });

  test('should track unmapped widgets', () => {
    fallbackHandler.getFallbackWidget('Widget1', 'react', 'flutter');
    fallbackHandler.getFallbackWidget('Widget1', 'react', 'flutter');
    fallbackHandler.getFallbackWidget('Widget2', 'react', 'flutter');

    const unmapped = fallbackHandler.getUnmappedWidgets();
    expect(unmapped.length).toBe(2);
    
    const widget1 = unmapped.find(w => w.originalWidget === 'Widget1');
    expect(widget1?.occurrences).toBe(2);
  });

  test('should generate unmapped widgets summary', () => {
    fallbackHandler.getFallbackWidget('Widget1', 'react', 'flutter');
    
    const summary = fallbackHandler.getUnmappedWidgetsSummary();
    expect(summary).toContain('Unmapped Widgets Summary');
    expect(summary).toContain('Widget1');
  });

  test('should export unmapped widgets template', () => {
    fallbackHandler.getFallbackWidget('CustomButton', 'react', 'flutter');
    
    const template = fallbackHandler.exportUnmappedWidgetsTemplate();
    expect(template).toContain('CustomButton');
    expect(template).toContain('schemaVersion');
    expect(template).toContain('TODO');
  });
});

describe('PartialConversionHandler', () => {
  let partialHandler: PartialConversionHandler;

  beforeEach(() => {
    partialHandler = PartialConversionHandler.getInstance();
    partialHandler.clear();
  });

  test('should track conversion progress', () => {
    partialHandler.startConversion(10);
    partialHandler.recordSuccess();
    partialHandler.recordSuccess();
    partialHandler.recordSuccess();

    const result = partialHandler.getResult('generated code');
    expect(result.completionPercentage).toBe(30);
    expect(result.convertedNodes).toBe(3);
    expect(result.totalNodes).toBe(10);
  });

  test('should generate TODO comments for React', () => {
    const issue = {
      severity: ConversionIssueSeverity.ERROR,
      message: 'Cannot convert this feature',
      suggestion: 'Implement manually',
    };

    const comment = partialHandler.generateTodoComment('react', issue);
    expect(comment).toContain('// TODO(Lumora)');
    expect(comment).toContain('Cannot convert this feature');
    expect(comment).toContain('Suggestion: Implement manually');
  });

  test('should generate TODO comments for Flutter', () => {
    const issue = {
      severity: ConversionIssueSeverity.ERROR,
      message: 'Cannot convert this feature',
    };

    const comment = partialHandler.generateTodoComment('flutter', issue);
    expect(comment).toContain('// TODO(Lumora)');
    expect(comment).toContain('Cannot convert this feature');
  });

  test('should generate fallback code', () => {
    const issue = {
      severity: ConversionIssueSeverity.ERROR,
      message: 'Unsupported widget',
    };

    const reactCode = partialHandler.generateFallbackCode('react', issue);
    expect(reactCode).toContain('<div>');
    expect(reactCode).toContain('TODO(Lumora)');

    const flutterCode = partialHandler.generateFallbackCode('flutter', issue);
    expect(flutterCode).toContain('Container');
    expect(flutterCode).toContain('Placeholder');
  });

  test('should format conversion summary', () => {
    partialHandler.startConversion(10);
    partialHandler.recordSuccess();
    partialHandler.recordSuccess();
    
    partialHandler.recordIssue({
      severity: ConversionIssueSeverity.ERROR,
      message: 'Error 1',
    });

    const result = partialHandler.getResult('code');
    const summary = partialHandler.formatSummary(result);

    expect(summary).toContain('Partial Conversion Summary');
    expect(summary).toContain('Completion: 20%');
    expect(summary).toContain('Errors: 1');
  });

  test('should generate issue report', () => {
    partialHandler.startConversion(5);
    partialHandler.recordSuccess();
    
    partialHandler.recordIssue({
      severity: ConversionIssueSeverity.ERROR,
      message: 'Test error',
      location: { line: 10 },
    });

    const result = partialHandler.getResult('code');
    const report = partialHandler.generateIssueReport(result, '/test/file.tsx');

    expect(report).toContain('# Lumora Conversion Issue Report');
    expect(report).toContain('/test/file.tsx');
    expect(report).toContain('Test error');
    expect(report).toContain('Line: 10');
  });
});

describe('FileBackupHandler', () => {
  let backupHandler: FileBackupHandler;
  let tempDir: string;
  let testFile: string;

  beforeEach(() => {
    backupHandler = FileBackupHandler.getInstance();
    backupHandler.clearRecords();
    
    // Create temp directory and test file
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumora-test-'));
    testFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(testFile, 'original content');
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should create backup with timestamp strategy', async () => {
    backupHandler.configure({ strategy: BackupStrategy.TIMESTAMP });
    
    const record = await backupHandler.createBackup(testFile);
    
    expect(record).not.toBeNull();
    expect(record?.backupFile).toContain('.backup.');
    expect(fs.existsSync(record!.backupFile)).toBe(true);
  });

  test('should create backup with single strategy', async () => {
    backupHandler.configure({ strategy: BackupStrategy.SINGLE });
    
    const record1 = await backupHandler.createBackup(testFile);
    const record2 = await backupHandler.createBackup(testFile);
    
    expect(record1?.backupFile).toBe(record2?.backupFile);
  });

  test('should respect maxBackups limit', async () => {
    backupHandler.configure({ 
      strategy: BackupStrategy.TIMESTAMP,
      maxBackups: 2
    });
    
    await backupHandler.createBackup(testFile);
    await backupHandler.createBackup(testFile);
    await backupHandler.createBackup(testFile);
    
    const records = backupHandler.getBackupRecords(testFile);
    expect(records.length).toBeLessThanOrEqual(2);
  });

  test('should restore from backup', async () => {
    const record = await backupHandler.createBackup(testFile);
    
    // Modify original file
    fs.writeFileSync(testFile, 'modified content');
    
    // Restore from backup
    await backupHandler.restoreFromBackup(record!.backupFile, testFile);
    
    const content = fs.readFileSync(testFile, 'utf8');
    expect(content).toBe('original content');
  });

  test('should list backups', async () => {
    await backupHandler.createBackup(testFile);
    
    const list = backupHandler.listBackups(testFile);
    expect(list).toContain('Backups for:');
    expect(list).toContain('test.txt');
  });

  test('should get backup statistics', async () => {
    await backupHandler.createBackup(testFile);
    
    const stats = backupHandler.getBackupStats();
    expect(stats.totalFiles).toBe(1);
    expect(stats.totalBackups).toBe(1);
    expect(stats.totalSize).toBeGreaterThan(0);
  });

  test('should delete specific backup', async () => {
    const record = await backupHandler.createBackup(testFile);
    
    await backupHandler.deleteBackup(record!.backupFile);
    
    expect(fs.existsSync(record!.backupFile)).toBe(false);
  });

  test('should delete all backups for file', async () => {
    await backupHandler.createBackup(testFile);
    await backupHandler.createBackup(testFile);
    
    const deleted = await backupHandler.deleteAllBackups(testFile);
    
    expect(deleted).toBeGreaterThan(0);
    expect(backupHandler.getBackupRecords(testFile).length).toBe(0);
  });

  test('should handle backup when disabled', async () => {
    backupHandler.configure({ enabled: false });
    
    const record = await backupHandler.createBackup(testFile);
    
    expect(record).toBeNull();
  });
});
