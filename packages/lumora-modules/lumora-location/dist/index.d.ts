/**
 * @lumora/location - Location module for Lumora
 * Get device location, track movement, and geofencing
 */
import { PermissionStatus } from '@lumora/native-bridge';
export declare const LocationModule: import("@lumora/native-bridge").NativeModule;
export interface LocationOptions {
    accuracy?: 'low' | 'balanced' | 'high' | 'best';
    timeout?: number;
    maximumAge?: number;
    distanceFilter?: number;
}
export interface LocationPosition {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
    timestamp: number;
}
export interface LocationError {
    code: number;
    message: string;
}
export interface LocationAPI {
    requestPermissions(background?: boolean): Promise<PermissionStatus>;
    getCurrentPosition(options?: LocationOptions): Promise<LocationPosition>;
    watchPosition(callback: (position: LocationPosition) => void, options?: LocationOptions): Promise<number>;
    clearWatch(watchId: number): Promise<void>;
    isLocationEnabled(): Promise<boolean>;
    addListener(event: 'locationChanged', callback: (position: LocationPosition) => void): () => void;
}
export declare const Location: LocationAPI;
export default Location;
//# sourceMappingURL=index.d.ts.map