/**
 * @lumora/camera - Camera module for Lumora
 * Take photos, record videos, and access camera features
 */

import {
  createNativeModule,
  createModuleProxy,
  defineMethod,
  PermissionStatus,
} from '@lumora/native-bridge';

// Module definition
export const CameraModule = createNativeModule({
  name: 'LumoraCamera',
  methods: [
    defineMethod({
      name: 'requestPermissions',
      returnType: 'Promise<PermissionStatus>',
      description: 'Request camera permissions',
    }),
    defineMethod({
      name: 'takePicture',
      parameters: [
        { name: 'options', type: 'CameraOptions', optional: true },
      ],
      returnType: 'Promise<CameraPhoto>',
      description: 'Take a photo',
    }),
    defineMethod({
      name: 'recordVideo',
      parameters: [
        { name: 'options', type: 'VideoOptions', optional: true },
      ],
      returnType: 'Promise<CameraVideo>',
      description: 'Record a video',
    }),
    defineMethod({
      name: 'getAvailableCameras',
      returnType: 'Promise<Camera[]>',
      description: 'Get list of available cameras',
    }),
  ],
  description: 'Access device camera for photos and videos',
});

// Types
export interface CameraOptions {
  quality?: number; // 0-1
  camera?: 'front' | 'back';
  flash?: 'on' | 'off' | 'auto';
  saveToGallery?: boolean;
}

export interface VideoOptions {
  quality?: 'low' | 'medium' | 'high' | '4k';
  camera?: 'front' | 'back';
  maxDuration?: number; // seconds
  saveToGallery?: boolean;
}

export interface CameraPhoto {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: Record<string, any>;
}

export interface CameraVideo {
  uri: string;
  width: number;
  height: number;
  duration: number;
  size: number;
}

export interface Camera {
  id: string;
  type: 'front' | 'back';
  name: string;
}

// API
export interface CameraAPI {
  requestPermissions(): Promise<PermissionStatus>;
  takePicture(options?: CameraOptions): Promise<CameraPhoto>;
  recordVideo(options?: VideoOptions): Promise<CameraVideo>;
  getAvailableCameras(): Promise<Camera[]>;
}

// Create and export proxy
export const Camera = createModuleProxy<CameraAPI>('LumoraCamera');

// Default export
export default Camera;
