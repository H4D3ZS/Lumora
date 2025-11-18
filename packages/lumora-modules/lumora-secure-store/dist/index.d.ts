/**
 * @lumora/secure-store - Secure Store module for Lumora
 * Encrypted key-value storage using platform secure storage (Keychain on iOS, Keystore on Android)
 */
export declare const SecureStoreModule: import("@lumora/native-bridge").NativeModule;
export interface SecureStoreOptions {
    /**
     * iOS: The item's service (kSecAttrService)
     * Android: Alias for the key in the Keystore
     */
    keychainService?: string;
    /**
     * iOS: kSecAttrAccessible value
     * Specifies when a keychain item is accessible
     */
    keychainAccessible?: KeychainAccessibilityConstant;
    /**
     * Require authentication to access the value
     */
    requireAuthentication?: boolean;
    /**
     * Prompt message for authentication (if required)
     */
    authenticationPrompt?: string;
}
export declare enum KeychainAccessibilityConstant {
    /**
     * The data in the keychain item can be accessed only while the device is unlocked by the user
     */
    WHEN_UNLOCKED = "WHEN_UNLOCKED",
    /**
     * The data in the keychain item cannot be accessed after a restart until the device has been unlocked once
     */
    AFTER_FIRST_UNLOCK = "AFTER_FIRST_UNLOCK",
    /**
     * The data in the keychain can only be accessed when the device is unlocked. Only available if a passcode is set
     */
    WHEN_UNLOCKED_THIS_DEVICE_ONLY = "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
    /**
     * The data in the keychain item can always be accessed regardless of whether the device is locked
     */
    ALWAYS = "ALWAYS",
    /**
     * The data in the keychain item can always be accessed regardless of whether the device is locked. Only available if a passcode is set
     */
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = "WHEN_PASSCODE_SET_THIS_DEVICE_ONLY"
}
export interface SecureStoreAPI {
    /**
     * Store a value securely under the given key
     * @param key - The key to store the value under
     * @param value - The value to store (must be a string)
     * @param options - Optional configuration
     */
    setItemAsync(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
    /**
     * Retrieve a value from secure storage
     * @param key - The key to retrieve
     * @param options - Optional configuration
     * @returns The stored value or null if not found
     */
    getItemAsync(key: string, options?: SecureStoreOptions): Promise<string | null>;
    /**
     * Delete a value from secure storage
     * @param key - The key to delete
     * @param options - Optional configuration
     */
    deleteItemAsync(key: string, options?: SecureStoreOptions): Promise<void>;
    /**
     * Check if secure storage is available on the device
     * @returns true if available, false otherwise
     */
    isAvailableAsync(): Promise<boolean>;
}
export declare const SecureStore: SecureStoreAPI;
export default SecureStore;
//# sourceMappingURL=index.d.ts.map