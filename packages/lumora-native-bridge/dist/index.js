"use strict";
/**
 * Lumora Native Bridge
 * Enables React components to call native Flutter/platform code
 *
 * @example
 * ```typescript
 * import { getNativeBridge, createModuleProxy } from '@lumora/native-bridge';
 *
 * // Get bridge instance
 * const bridge = getNativeBridge();
 * bridge.connect();
 *
 * // Call native method
 * const camera = createModuleProxy('Camera');
 * const photo = await camera.takePicture({ quality: 0.8 });
 * ```
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeModuleDecorator = exports.defineMethod = exports.registerModule = exports.createTypedModuleProxy = exports.createModuleProxy = exports.createNativeModule = exports.createNativeBridge = exports.getNativeBridge = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./native-bridge"), exports);
__exportStar(require("./module-factory"), exports);
// Re-export commonly used functions
var native_bridge_1 = require("./native-bridge");
Object.defineProperty(exports, "getNativeBridge", { enumerable: true, get: function () { return native_bridge_1.getNativeBridge; } });
Object.defineProperty(exports, "createNativeBridge", { enumerable: true, get: function () { return native_bridge_1.createNativeBridge; } });
var module_factory_1 = require("./module-factory");
Object.defineProperty(exports, "createNativeModule", { enumerable: true, get: function () { return module_factory_1.createNativeModule; } });
Object.defineProperty(exports, "createModuleProxy", { enumerable: true, get: function () { return module_factory_1.createModuleProxy; } });
Object.defineProperty(exports, "createTypedModuleProxy", { enumerable: true, get: function () { return module_factory_1.createTypedModuleProxy; } });
Object.defineProperty(exports, "registerModule", { enumerable: true, get: function () { return module_factory_1.registerModule; } });
Object.defineProperty(exports, "defineMethod", { enumerable: true, get: function () { return module_factory_1.defineMethod; } });
Object.defineProperty(exports, "NativeModuleDecorator", { enumerable: true, get: function () { return module_factory_1.NativeModuleDecorator; } });
//# sourceMappingURL=index.js.map