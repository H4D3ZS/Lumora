/**
 * @lumora/location - Location module for Lumora
 * Get device location, track movement, and geofencing
 */

import {
  createNativeModule,
  createModuleProxy,
  defineMethod,
  PermissionStatus,
} from '@lumora/native-bridge';

// Module definition
export const LocationModule = createNativeModule({
  name: 'LumoraLocation',
  methods: [
    defineMethod({
      name: 'requestPermissions',
      parameters: [
        { name: 'background', type: 'boolean', optional: true },
      ],
      returnType: 'Promise<PermissionStatus>',
      description: 'Request location permissions',
    }),
    defineMethod({
      name: 'getCurrentPosition',
      parameters: [
        { name: 'options', type: 'LocationOptions', optional: true },
      ],
      returnType: 'Promise<LocationPosition>',
      description: 'Get current location',
    }),
    defineMethod({
      name: 'watchPosition',
      parameters: [
        { name: 'callback', type: 'Function' },
        { name: 'options', type: 'LocationOptions', optional: true },
      ],
      returnType: 'Promise<number>',
      description: 'Watch location changes',
    }),
    defineMethod({
      name: 'clearWatch',
      parameters: [{ name: 'watchId', type: 'number' }],
      returnType: 'Promise<void>',
      description: 'Stop watching location',
    }),
    defineMethod({
      name: 'isLocationEnabled',
      returnType: 'Promise<boolean>',
      description: 'Check if location services are enabled',
    }),
  ],
  events: ['locationChanged', 'providerChanged'],
  description: 'Access device location and GPS',
});

// Types
export interface LocationOptions {
  accuracy?: 'low' | 'balanced' | 'high' | 'best';
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number; // meters
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

// API
export interface LocationAPI {
  requestPermissions(background?: boolean): Promise<PermissionStatus>;
  getCurrentPosition(options?: LocationOptions): Promise<LocationPosition>;
  watchPosition(
    callback: (position: LocationPosition) => void,
    options?: LocationOptions
  ): Promise<number>;
  clearWatch(watchId: number): Promise<void>;
  isLocationEnabled(): Promise<boolean>;
  addListener(
    event: 'locationChanged',
    callback: (position: LocationPosition) => void
  ): () => void;
}

// Create and export proxy
export const Location = createModuleProxy<LocationAPI>('LumoraLocation');

// Default export
export default Location;
