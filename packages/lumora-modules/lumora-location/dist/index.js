"use strict";
/**
 * @lumora/location - Location module for Lumora
 * Get device location, track movement, and geofencing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = exports.LocationModule = void 0;
const native_bridge_1 = require("@lumora/native-bridge");
// Module definition
exports.LocationModule = (0, native_bridge_1.createNativeModule)({
    name: 'LumoraLocation',
    methods: [
        (0, native_bridge_1.defineMethod)({
            name: 'requestPermissions',
            parameters: [
                { name: 'background', type: 'boolean', optional: true },
            ],
            returnType: 'Promise<PermissionStatus>',
            description: 'Request location permissions',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getCurrentPosition',
            parameters: [
                { name: 'options', type: 'LocationOptions', optional: true },
            ],
            returnType: 'Promise<LocationPosition>',
            description: 'Get current location',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'watchPosition',
            parameters: [
                { name: 'callback', type: 'Function' },
                { name: 'options', type: 'LocationOptions', optional: true },
            ],
            returnType: 'Promise<number>',
            description: 'Watch location changes',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'clearWatch',
            parameters: [{ name: 'watchId', type: 'number' }],
            returnType: 'Promise<void>',
            description: 'Stop watching location',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'isLocationEnabled',
            returnType: 'Promise<boolean>',
            description: 'Check if location services are enabled',
        }),
    ],
    events: ['locationChanged', 'providerChanged'],
    description: 'Access device location and GPS',
});
// Create and export proxy
exports.Location = (0, native_bridge_1.createModuleProxy)('LumoraLocation');
// Default export
exports.default = exports.Location;
//# sourceMappingURL=index.js.map