/**
 * @lumora/filesystem - FileSystem module for Lumora
 * Read, write, and manage files and directories on the device
 */

import {
  createNativeModule,
  createModuleProxy,
  defineMethod,
} from '@lumora/native-bridge';

// Module definition
export const FileSystemModule = createNativeModule({
  name: 'LumoraFileSystem',
  methods: [
    // File reading
    defineMethod({
      name: 'readAsStringAsync',
      parameters: [
        { name: 'fileUri', type: 'string' },
        { name: 'options', type: 'ReadOptions', optional: true },
      ],
      returnType: 'Promise<string>',
      description: 'Read file content as string',
    }),
    defineMethod({
      name: 'readAsBase64Async',
      parameters: [{ name: 'fileUri', type: 'string' }],
      returnType: 'Promise<string>',
      description: 'Read file content as base64',
    }),

    // File writing
    defineMethod({
      name: 'writeAsStringAsync',
      parameters: [
        { name: 'fileUri', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'options', type: 'WriteOptions', optional: true },
      ],
      returnType: 'Promise<void>',
      description: 'Write string content to file',
    }),

    // File info
    defineMethod({
      name: 'getInfoAsync',
      parameters: [
        { name: 'fileUri', type: 'string' },
        { name: 'options', type: 'GetInfoOptions', optional: true },
      ],
      returnType: 'Promise<FileInfo>',
      description: 'Get file or directory information',
    }),

    // File operations
    defineMethod({
      name: 'deleteAsync',
      parameters: [
        { name: 'fileUri', type: 'string' },
        { name: 'options', type: 'DeleteOptions', optional: true },
      ],
      returnType: 'Promise<void>',
      description: 'Delete file or directory',
    }),
    defineMethod({
      name: 'moveAsync',
      parameters: [
        { name: 'from', type: 'string' },
        { name: 'to', type: 'string' },
      ],
      returnType: 'Promise<void>',
      description: 'Move file or directory',
    }),
    defineMethod({
      name: 'copyAsync',
      parameters: [
        { name: 'from', type: 'string' },
        { name: 'to', type: 'string' },
      ],
      returnType: 'Promise<void>',
      description: 'Copy file or directory',
    }),

    // Directory operations
    defineMethod({
      name: 'makeDirectoryAsync',
      parameters: [
        { name: 'dirUri', type: 'string' },
        { name: 'options', type: 'MakeDirectoryOptions', optional: true },
      ],
      returnType: 'Promise<void>',
      description: 'Create a directory',
    }),
    defineMethod({
      name: 'readDirectoryAsync',
      parameters: [{ name: 'dirUri', type: 'string' }],
      returnType: 'Promise<string[]>',
      description: 'List directory contents',
    }),

    // Download/Upload
    defineMethod({
      name: 'downloadAsync',
      parameters: [
        { name: 'url', type: 'string' },
        { name: 'fileUri', type: 'string' },
        { name: 'options', type: 'DownloadOptions', optional: true },
      ],
      returnType: 'Promise<DownloadResult>',
      description: 'Download file from URL',
    }),
    defineMethod({
      name: 'uploadAsync',
      parameters: [
        { name: 'url', type: 'string' },
        { name: 'fileUri', type: 'string' },
        { name: 'options', type: 'UploadOptions', optional: true },
      ],
      returnType: 'Promise<UploadResult>',
      description: 'Upload file to URL',
    }),

    // Storage info
    defineMethod({
      name: 'getFreeDiskStorageAsync',
      returnType: 'Promise<number>',
      description: 'Get free disk storage in bytes',
    }),
    defineMethod({
      name: 'getTotalDiskCapacityAsync',
      returnType: 'Promise<number>',
      description: 'Get total disk capacity in bytes',
    }),
  ],
  constants: {
    documentDirectory: 'DOCUMENT_DIRECTORY',
    cacheDirectory: 'CACHE_DIRECTORY',
    bundleDirectory: 'BUNDLE_DIRECTORY',
  },
  description: 'File and directory operations',
});

// Types
export interface ReadOptions {
  encoding?: EncodingType;
  position?: number;
  length?: number;
}

export interface WriteOptions {
  encoding?: EncodingType;
}

export enum EncodingType {
  UTF8 = 'utf8',
  BASE64 = 'base64',
}

export interface GetInfoOptions {
  md5?: boolean;
  size?: boolean;
}

export interface FileInfo {
  exists: boolean;
  uri: string;
  size?: number;
  isDirectory?: boolean;
  modificationTime?: number;
  md5?: string;
}

export interface DeleteOptions {
  idempotent?: boolean;
}

export interface MakeDirectoryOptions {
  intermediates?: boolean;
}

export interface DownloadOptions {
  headers?: Record<string, string>;
  md5?: boolean;
}

export interface DownloadResult {
  uri: string;
  status: number;
  headers: Record<string, string>;
  md5?: string;
}

export interface UploadOptions {
  headers?: Record<string, string>;
  httpMethod?: 'POST' | 'PUT' | 'PATCH';
  uploadType?: 'BINARY_CONTENT' | 'MULTIPART';
  fieldName?: string;
  mimeType?: string;
  parameters?: Record<string, string>;
}

export interface UploadResult {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface DownloadProgressData {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
}

export interface UploadProgressData {
  totalBytesSent: number;
  totalBytesExpectedToSend: number;
}

// API
export interface FileSystemAPI {
  // File reading
  readAsStringAsync(fileUri: string, options?: ReadOptions): Promise<string>;
  readAsBase64Async(fileUri: string): Promise<string>;

  // File writing
  writeAsStringAsync(
    fileUri: string,
    content: string,
    options?: WriteOptions
  ): Promise<void>;

  // File info
  getInfoAsync(
    fileUri: string,
    options?: GetInfoOptions
  ): Promise<FileInfo>;

  // File operations
  deleteAsync(fileUri: string, options?: DeleteOptions): Promise<void>;
  moveAsync(from: string, to: string): Promise<void>;
  copyAsync(from: string, to: string): Promise<void>;

  // Directory operations
  makeDirectoryAsync(
    dirUri: string,
    options?: MakeDirectoryOptions
  ): Promise<void>;
  readDirectoryAsync(dirUri: string): Promise<string[]>;

  // Download/Upload
  downloadAsync(
    url: string,
    fileUri: string,
    options?: DownloadOptions
  ): Promise<DownloadResult>;
  uploadAsync(
    url: string,
    fileUri: string,
    options?: UploadOptions
  ): Promise<UploadResult>;

  // Storage info
  getFreeDiskStorageAsync(): Promise<number>;
  getTotalDiskCapacityAsync(): Promise<number>;

  // Constants
  documentDirectory: string;
  cacheDirectory: string;
  bundleDirectory: string;
}

// Create and export proxy
export const FileSystem = createModuleProxy<FileSystemAPI>('LumoraFileSystem');

// Default export
export default FileSystem;
