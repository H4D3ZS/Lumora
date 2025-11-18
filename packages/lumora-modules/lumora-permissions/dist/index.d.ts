/**
 * @lumora/permissions - Permissions module for Lumora
 * Unified permission management for all device features
 */
export declare const PermissionsModule: import("@lumora/native-bridge").NativeModule;
export declare enum PermissionStatus {
    /** User has granted permission */
    GRANTED = "granted",
    /** User has denied permission */
    DENIED = "denied",
    /** Permission has not been requested yet */
    UNDETERMINED = "undetermined"
}
export declare enum PermissionType {
    CAMERA = "camera",
    LOCATION = "location",
    LOCATION_FOREGROUND = "locationForeground",
    LOCATION_BACKGROUND = "locationBackground",
    NOTIFICATIONS = "notifications",
    MEDIA_LIBRARY = "mediaLibrary",
    MEDIA_LIBRARY_WRITE_ONLY = "mediaLibraryWriteOnly",
    AUDIO_RECORDING = "audioRecording",
    CONTACTS = "contacts",
    CALENDAR = "calendar",
    REMINDERS = "reminders",
    USER_FACING_NOTIFICATIONS = "userFacingNotifications",
    SYSTEM_BRIGHTNESS = "systemBrightness"
}
export interface PermissionResponse {
    /** Current status of the permission */
    status: PermissionStatus;
    /** iOS only - Whether user can be asked again */
    canAskAgain: boolean;
    /** Whether permission has been granted */
    granted: boolean;
    /** Additional permission details */
    expires?: 'never' | number;
    /** iOS only - iOS specific permission scope */
    ios?: {
        scope?: 'whenInUse' | 'always' | 'none';
    };
    /** Android only - Android specific permission details */
    android?: {
        scope?: 'fine' | 'coarse' | 'none';
    };
}
export interface PermissionExpiration {
    /** Whether permission expires */
    expires?: 'never' | number;
}
export interface PermissionsAPI {
    getAsync(permissionType: PermissionType): Promise<PermissionResponse>;
    askAsync(permissionType: PermissionType): Promise<PermissionResponse>;
    getCameraAsync(): Promise<PermissionResponse>;
    getLocationAsync(): Promise<PermissionResponse>;
    getNotificationsAsync(): Promise<PermissionResponse>;
    getMediaLibraryAsync(): Promise<PermissionResponse>;
    getAudioRecordingAsync(): Promise<PermissionResponse>;
    getContactsAsync(): Promise<PermissionResponse>;
    getCalendarAsync(): Promise<PermissionResponse>;
    askCameraAsync(): Promise<PermissionResponse>;
    askLocationAsync(): Promise<PermissionResponse>;
    askNotificationsAsync(): Promise<PermissionResponse>;
    askMediaLibraryAsync(): Promise<PermissionResponse>;
    askAudioRecordingAsync(): Promise<PermissionResponse>;
    askContactsAsync(): Promise<PermissionResponse>;
    askCalendarAsync(): Promise<PermissionResponse>;
}
export declare const Permissions: PermissionsAPI;
export default Permissions;
export { PermissionStatus as GRANTED } from './index';
export { PermissionStatus as DENIED } from './index';
export { PermissionStatus as UNDETERMINED } from './index';
//# sourceMappingURL=index.d.ts.map