/**
 * @lumora/camera - Camera module for Lumora
 * Take photos, record videos, and access camera features
 */
import { PermissionStatus } from '@lumora/native-bridge';
export declare const CameraModule: import("@lumora/native-bridge").NativeModule;
export interface CameraOptions {
    quality?: number;
    camera?: 'front' | 'back';
    flash?: 'on' | 'off' | 'auto';
    saveToGallery?: boolean;
}
export interface VideoOptions {
    quality?: 'low' | 'medium' | 'high' | '4k';
    camera?: 'front' | 'back';
    maxDuration?: number;
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
export interface CameraAPI {
    requestPermissions(): Promise<PermissionStatus>;
    takePicture(options?: CameraOptions): Promise<CameraPhoto>;
    recordVideo(options?: VideoOptions): Promise<CameraVideo>;
    getAvailableCameras(): Promise<Camera[]>;
}
export declare const Camera: CameraAPI;
export default Camera;
//# sourceMappingURL=index.d.ts.map