"use strict";
/**
 * @lumora/permissions - Permissions module for Lumora
 * Unified permission management for all device features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNDETERMINED = exports.DENIED = exports.GRANTED = exports.Permissions = exports.PermissionType = exports.PermissionStatus = exports.PermissionsModule = void 0;
const native_bridge_1 = require("@lumora/native-bridge");
// Module definition
exports.PermissionsModule = (0, native_bridge_1.createNativeModule)({
    name: 'LumoraPermissions',
    methods: [
        // Core permission methods
        (0, native_bridge_1.defineMethod)({
            name: 'getAsync',
            parameters: [{ name: 'permissionType', type: 'PermissionType' }],
            returnType: 'Promise<PermissionResponse>',
            description: 'Get current permission status',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'askAsync',
            parameters: [{ name: 'permissionType', type: 'PermissionType' }],
            returnType: 'Promise<PermissionResponse>',
            description: 'Request permission from user',
        }),
        // Specific permission getters
        (0, native_bridge_1.defineMethod)({
            name: 'getCameraAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Get camera permission status',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getLocationAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Get location permission status',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getNotificationsAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Get notifications permission status',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getMediaLibraryAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Get media library permission status',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getAudioRecordingAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Get audio recording permission status',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getContactsAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Get contacts permission status',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getCalendarAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Get calendar permission status',
        }),
        // Specific permission requesters
        (0, native_bridge_1.defineMethod)({
            name: 'askCameraAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Request camera permission',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'askLocationAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Request location permission',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'askNotificationsAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Request notifications permission',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'askMediaLibraryAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Request media library permission',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'askAudioRecordingAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Request audio recording permission',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'askContactsAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Request contacts permission',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'askCalendarAsync',
            returnType: 'Promise<PermissionResponse>',
            description: 'Request calendar permission',
        }),
    ],
    description: 'Unified permission management system',
});
// Types
var PermissionStatus;
(function (PermissionStatus) {
    /** User has granted permission */
    PermissionStatus["GRANTED"] = "granted";
    /** User has denied permission */
    PermissionStatus["DENIED"] = "denied";
    /** Permission has not been requested yet */
    PermissionStatus["UNDETERMINED"] = "undetermined";
})(PermissionStatus || (exports.PermissionStatus = PermissionStatus = {}));
var PermissionType;
(function (PermissionType) {
    PermissionType["CAMERA"] = "camera";
    PermissionType["LOCATION"] = "location";
    PermissionType["LOCATION_FOREGROUND"] = "locationForeground";
    PermissionType["LOCATION_BACKGROUND"] = "locationBackground";
    PermissionType["NOTIFICATIONS"] = "notifications";
    PermissionType["MEDIA_LIBRARY"] = "mediaLibrary";
    PermissionType["MEDIA_LIBRARY_WRITE_ONLY"] = "mediaLibraryWriteOnly";
    PermissionType["AUDIO_RECORDING"] = "audioRecording";
    PermissionType["CONTACTS"] = "contacts";
    PermissionType["CALENDAR"] = "calendar";
    PermissionType["REMINDERS"] = "reminders";
    PermissionType["USER_FACING_NOTIFICATIONS"] = "userFacingNotifications";
    PermissionType["SYSTEM_BRIGHTNESS"] = "systemBrightness";
})(PermissionType || (exports.PermissionType = PermissionType = {}));
// Create and export proxy
exports.Permissions = (0, native_bridge_1.createModuleProxy)('LumoraPermissions');
// Default export
exports.default = exports.Permissions;
// Export types
var index_1 = require("./index");
Object.defineProperty(exports, "GRANTED", { enumerable: true, get: function () { return index_1.PermissionStatus; } });
var index_2 = require("./index");
Object.defineProperty(exports, "DENIED", { enumerable: true, get: function () { return index_2.PermissionStatus; } });
var index_3 = require("./index");
Object.defineProperty(exports, "UNDETERMINED", { enumerable: true, get: function () { return index_3.PermissionStatus; } });
//# sourceMappingURL=index.js.map