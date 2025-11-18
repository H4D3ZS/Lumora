"use strict";
/**
 * @lumora/secure-store - Secure Store module for Lumora
 * Encrypted key-value storage using platform secure storage (Keychain on iOS, Keystore on Android)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureStore = exports.KeychainAccessibilityConstant = exports.SecureStoreModule = void 0;
const native_bridge_1 = require("@lumora/native-bridge");
// Module definition
exports.SecureStoreModule = (0, native_bridge_1.createNativeModule)({
    name: 'LumoraSecureStore',
    methods: [
        (0, native_bridge_1.defineMethod)({
            name: 'setItemAsync',
            parameters: [
                { name: 'key', type: 'string' },
                { name: 'value', type: 'string' },
                { name: 'options', type: 'SecureStoreOptions', optional: true },
            ],
            returnType: 'Promise<void>',
            description: 'Store a value securely',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getItemAsync',
            parameters: [
                { name: 'key', type: 'string' },
                { name: 'options', type: 'SecureStoreOptions', optional: true },
            ],
            returnType: 'Promise<string | null>',
            description: 'Retrieve a value from secure storage',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'deleteItemAsync',
            parameters: [
                { name: 'key', type: 'string' },
                { name: 'options', type: 'SecureStoreOptions', optional: true },
            ],
            returnType: 'Promise<void>',
            description: 'Delete a value from secure storage',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'isAvailableAsync',
            returnType: 'Promise<boolean>',
            description: 'Check if secure storage is available on the device',
        }),
    ],
    description: 'Secure encrypted storage for sensitive data',
});
var KeychainAccessibilityConstant;
(function (KeychainAccessibilityConstant) {
    /**
     * The data in the keychain item can be accessed only while the device is unlocked by the user
     */
    KeychainAccessibilityConstant["WHEN_UNLOCKED"] = "WHEN_UNLOCKED";
    /**
     * The data in the keychain item cannot be accessed after a restart until the device has been unlocked once
     */
    KeychainAccessibilityConstant["AFTER_FIRST_UNLOCK"] = "AFTER_FIRST_UNLOCK";
    /**
     * The data in the keychain can only be accessed when the device is unlocked. Only available if a passcode is set
     */
    KeychainAccessibilityConstant["WHEN_UNLOCKED_THIS_DEVICE_ONLY"] = "WHEN_UNLOCKED_THIS_DEVICE_ONLY";
    /**
     * The data in the keychain item can always be accessed regardless of whether the device is locked
     */
    KeychainAccessibilityConstant["ALWAYS"] = "ALWAYS";
    /**
     * The data in the keychain item can always be accessed regardless of whether the device is locked. Only available if a passcode is set
     */
    KeychainAccessibilityConstant["WHEN_PASSCODE_SET_THIS_DEVICE_ONLY"] = "WHEN_PASSCODE_SET_THIS_DEVICE_ONLY";
})(KeychainAccessibilityConstant || (exports.KeychainAccessibilityConstant = KeychainAccessibilityConstant = {}));
// Create and export proxy
exports.SecureStore = (0, native_bridge_1.createModuleProxy)('LumoraSecureStore');
// Default export
exports.default = exports.SecureStore;
//# sourceMappingURL=index.js.map