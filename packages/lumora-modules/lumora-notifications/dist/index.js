"use strict";
/**
 * @lumora/notifications - Notifications module for Lumora
 * Send local notifications and handle push notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notifications = exports.NotificationsModule = void 0;
const native_bridge_1 = require("@lumora/native-bridge");
// Module definition
exports.NotificationsModule = (0, native_bridge_1.createNativeModule)({
    name: 'LumoraNotifications',
    methods: [
        (0, native_bridge_1.defineMethod)({
            name: 'requestPermissions',
            returnType: 'Promise<PermissionStatus>',
            description: 'Request notification permissions',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'scheduleNotification',
            parameters: [
                { name: 'notification', type: 'NotificationContent' },
                { name: 'trigger', type: 'NotificationTrigger', optional: true },
            ],
            returnType: 'Promise<string>',
            description: 'Schedule a local notification',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'cancelNotification',
            parameters: [{ name: 'id', type: 'string' }],
            returnType: 'Promise<void>',
            description: 'Cancel a scheduled notification',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'cancelAllNotifications',
            returnType: 'Promise<void>',
            description: 'Cancel all notifications',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getNotificationToken',
            returnType: 'Promise<string>',
            description: 'Get push notification token',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'setBadgeCount',
            parameters: [{ name: 'count', type: 'number' }],
            returnType: 'Promise<void>',
            description: 'Set app badge count',
        }),
    ],
    events: [
        'notificationReceived',
        'notificationTapped',
        'tokenRefreshed',
    ],
    description: 'Handle local and push notifications',
});
// Create and export proxy
exports.Notifications = (0, native_bridge_1.createModuleProxy)('LumoraNotifications');
// Default export
exports.default = exports.Notifications;
//# sourceMappingURL=index.js.map