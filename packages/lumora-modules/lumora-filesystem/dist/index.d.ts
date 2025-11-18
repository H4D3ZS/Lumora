/**
 * @lumora/filesystem - FileSystem module for Lumora
 * Read, write, and manage files and directories on the device
 */
export declare const FileSystemModule: import("@lumora/native-bridge").NativeModule;
export interface ReadOptions {
    encoding?: EncodingType;
    position?: number;
    length?: number;
}
export interface WriteOptions {
    encoding?: EncodingType;
}
export declare enum EncodingType {
    UTF8 = "utf8",
    BASE64 = "base64"
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
export interface FileSystemAPI {
    readAsStringAsync(fileUri: string, options?: ReadOptions): Promise<string>;
    readAsBase64Async(fileUri: string): Promise<string>;
    writeAsStringAsync(fileUri: string, content: string, options?: WriteOptions): Promise<void>;
    getInfoAsync(fileUri: string, options?: GetInfoOptions): Promise<FileInfo>;
    deleteAsync(fileUri: string, options?: DeleteOptions): Promise<void>;
    moveAsync(from: string, to: string): Promise<void>;
    copyAsync(from: string, to: string): Promise<void>;
    makeDirectoryAsync(dirUri: string, options?: MakeDirectoryOptions): Promise<void>;
    readDirectoryAsync(dirUri: string): Promise<string[]>;
    downloadAsync(url: string, fileUri: string, options?: DownloadOptions): Promise<DownloadResult>;
    uploadAsync(url: string, fileUri: string, options?: UploadOptions): Promise<UploadResult>;
    getFreeDiskStorageAsync(): Promise<number>;
    getTotalDiskCapacityAsync(): Promise<number>;
    documentDirectory: string;
    cacheDirectory: string;
    bundleDirectory: string;
}
export declare const FileSystem: FileSystemAPI;
export default FileSystem;
//# sourceMappingURL=index.d.ts.map