/**
 * @lumora/permissions - Permissions module for Lumora
 * Unified permission management for all device features
 */

import {
  createNativeModule,
  createModuleProxy,
  defineMethod,
} from '@lumora/native-bridge';

// Module definition
export const PermissionsModule = createNativeModule({
  name: 'LumoraPermissions',
  methods: [
    // Core permission methods
    defineMethod({
      name: 'getAsync',
      parameters: [{ name: 'permissionType', type: 'PermissionType' }],
      returnType: 'Promise<PermissionResponse>',
      description: 'Get current permission status',
    }),
    defineMethod({
      name: 'askAsync',
      parameters: [{ name: 'permissionType', type: 'PermissionType' }],
      returnType: 'Promise<PermissionResponse>',
      description: 'Request permission from user',
    }),

    // Specific permission getters
    defineMethod({
      name: 'getCameraAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Get camera permission status',
    }),
    defineMethod({
      name: 'getLocationAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Get location permission status',
    }),
    defineMethod({
      name: 'getNotificationsAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Get notifications permission status',
    }),
    defineMethod({
      name: 'getMediaLibraryAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Get media library permission status',
    }),
    defineMethod({
      name: 'getAudioRecordingAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Get audio recording permission status',
    }),
    defineMethod({
      name: 'getContactsAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Get contacts permission status',
    }),
    defineMethod({
      name: 'getCalendarAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Get calendar permission status',
    }),

    // Specific permission requesters
    defineMethod({
      name: 'askCameraAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Request camera permission',
    }),
    defineMethod({
      name: 'askLocationAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Request location permission',
    }),
    defineMethod({
      name: 'askNotificationsAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Request notifications permission',
    }),
    defineMethod({
      name: 'askMediaLibraryAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Request media library permission',
    }),
    defineMethod({
      name: 'askAudioRecordingAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Request audio recording permission',
    }),
    defineMethod({
      name: 'askContactsAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Request contacts permission',
    }),
    defineMethod({
      name: 'askCalendarAsync',
      returnType: 'Promise<PermissionResponse>',
      description: 'Request calendar permission',
    }),
  ],
  description: 'Unified permission management system',
});

// Types
export enum PermissionStatus {
  /** User has granted permission */
  GRANTED = 'granted',
  /** User has denied permission */
  DENIED = 'denied',
  /** Permission has not been requested yet */
  UNDETERMINED = 'undetermined',
}

export enum PermissionType {
  CAMERA = 'camera',
  LOCATION = 'location',
  LOCATION_FOREGROUND = 'locationForeground',
  LOCATION_BACKGROUND = 'locationBackground',
  NOTIFICATIONS = 'notifications',
  MEDIA_LIBRARY = 'mediaLibrary',
  MEDIA_LIBRARY_WRITE_ONLY = 'mediaLibraryWriteOnly',
  AUDIO_RECORDING = 'audioRecording',
  CONTACTS = 'contacts',
  CALENDAR = 'calendar',
  REMINDERS = 'reminders',
  USER_FACING_NOTIFICATIONS = 'userFacingNotifications',
  SYSTEM_BRIGHTNESS = 'systemBrightness',
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

// API
export interface PermissionsAPI {
  // Core methods
  getAsync(permissionType: PermissionType): Promise<PermissionResponse>;
  askAsync(permissionType: PermissionType): Promise<PermissionResponse>;

  // Specific getters
  getCameraAsync(): Promise<PermissionResponse>;
  getLocationAsync(): Promise<PermissionResponse>;
  getNotificationsAsync(): Promise<PermissionResponse>;
  getMediaLibraryAsync(): Promise<PermissionResponse>;
  getAudioRecordingAsync(): Promise<PermissionResponse>;
  getContactsAsync(): Promise<PermissionResponse>;
  getCalendarAsync(): Promise<PermissionResponse>;

  // Specific requesters
  askCameraAsync(): Promise<PermissionResponse>;
  askLocationAsync(): Promise<PermissionResponse>;
  askNotificationsAsync(): Promise<PermissionResponse>;
  askMediaLibraryAsync(): Promise<PermissionResponse>;
  askAudioRecordingAsync(): Promise<PermissionResponse>;
  askContactsAsync(): Promise<PermissionResponse>;
  askCalendarAsync(): Promise<PermissionResponse>;
}

// Create and export proxy
export const Permissions = createModuleProxy<PermissionsAPI>('LumoraPermissions');

// Default export
export default Permissions;

// Export types
export { PermissionStatus as GRANTED } from './index';
export { PermissionStatus as DENIED } from './index';
export { PermissionStatus as UNDETERMINED } from './index';
