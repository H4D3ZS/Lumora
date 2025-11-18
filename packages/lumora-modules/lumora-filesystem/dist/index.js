"use strict";
/**
 * @lumora/filesystem - FileSystem module for Lumora
 * Read, write, and manage files and directories on the device
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystem = exports.EncodingType = exports.FileSystemModule = void 0;
const native_bridge_1 = require("@lumora/native-bridge");
// Module definition
exports.FileSystemModule = (0, native_bridge_1.createNativeModule)({
    name: 'LumoraFileSystem',
    methods: [
        // File reading
        (0, native_bridge_1.defineMethod)({
            name: 'readAsStringAsync',
            parameters: [
                { name: 'fileUri', type: 'string' },
                { name: 'options', type: 'ReadOptions', optional: true },
            ],
            returnType: 'Promise<string>',
            description: 'Read file content as string',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'readAsBase64Async',
            parameters: [{ name: 'fileUri', type: 'string' }],
            returnType: 'Promise<string>',
            description: 'Read file content as base64',
        }),
        // File writing
        (0, native_bridge_1.defineMethod)({
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
        (0, native_bridge_1.defineMethod)({
            name: 'getInfoAsync',
            parameters: [
                { name: 'fileUri', type: 'string' },
                { name: 'options', type: 'GetInfoOptions', optional: true },
            ],
            returnType: 'Promise<FileInfo>',
            description: 'Get file or directory information',
        }),
        // File operations
        (0, native_bridge_1.defineMethod)({
            name: 'deleteAsync',
            parameters: [
                { name: 'fileUri', type: 'string' },
                { name: 'options', type: 'DeleteOptions', optional: true },
            ],
            returnType: 'Promise<void>',
            description: 'Delete file or directory',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'moveAsync',
            parameters: [
                { name: 'from', type: 'string' },
                { name: 'to', type: 'string' },
            ],
            returnType: 'Promise<void>',
            description: 'Move file or directory',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'copyAsync',
            parameters: [
                { name: 'from', type: 'string' },
                { name: 'to', type: 'string' },
            ],
            returnType: 'Promise<void>',
            description: 'Copy file or directory',
        }),
        // Directory operations
        (0, native_bridge_1.defineMethod)({
            name: 'makeDirectoryAsync',
            parameters: [
                { name: 'dirUri', type: 'string' },
                { name: 'options', type: 'MakeDirectoryOptions', optional: true },
            ],
            returnType: 'Promise<void>',
            description: 'Create a directory',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'readDirectoryAsync',
            parameters: [{ name: 'dirUri', type: 'string' }],
            returnType: 'Promise<string[]>',
            description: 'List directory contents',
        }),
        // Download/Upload
        (0, native_bridge_1.defineMethod)({
            name: 'downloadAsync',
            parameters: [
                { name: 'url', type: 'string' },
                { name: 'fileUri', type: 'string' },
                { name: 'options', type: 'DownloadOptions', optional: true },
            ],
            returnType: 'Promise<DownloadResult>',
            description: 'Download file from URL',
        }),
        (0, native_bridge_1.defineMethod)({
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
        (0, native_bridge_1.defineMethod)({
            name: 'getFreeDiskStorageAsync',
            returnType: 'Promise<number>',
            description: 'Get free disk storage in bytes',
        }),
        (0, native_bridge_1.defineMethod)({
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
var EncodingType;
(function (EncodingType) {
    EncodingType["UTF8"] = "utf8";
    EncodingType["BASE64"] = "base64";
})(EncodingType || (exports.EncodingType = EncodingType = {}));
// Create and export proxy
exports.FileSystem = (0, native_bridge_1.createModuleProxy)('LumoraFileSystem');
// Default export
exports.default = exports.FileSystem;
//# sourceMappingURL=index.js.map