"use strict";
/**
 * @lumora/camera - Camera module for Lumora
 * Take photos, record videos, and access camera features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Camera = exports.CameraModule = void 0;
const native_bridge_1 = require("@lumora/native-bridge");
// Module definition
exports.CameraModule = (0, native_bridge_1.createNativeModule)({
    name: 'LumoraCamera',
    methods: [
        (0, native_bridge_1.defineMethod)({
            name: 'requestPermissions',
            returnType: 'Promise<PermissionStatus>',
            description: 'Request camera permissions',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'takePicture',
            parameters: [
                { name: 'options', type: 'CameraOptions', optional: true },
            ],
            returnType: 'Promise<CameraPhoto>',
            description: 'Take a photo',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'recordVideo',
            parameters: [
                { name: 'options', type: 'VideoOptions', optional: true },
            ],
            returnType: 'Promise<CameraVideo>',
            description: 'Record a video',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getAvailableCameras',
            returnType: 'Promise<Camera[]>',
            description: 'Get list of available cameras',
        }),
    ],
    description: 'Access device camera for photos and videos',
});
// Create and export proxy
exports.Camera = (0, native_bridge_1.createModuleProxy)('LumoraCamera');
// Default export
exports.default = exports.Camera;
//# sourceMappingURL=index.js.map