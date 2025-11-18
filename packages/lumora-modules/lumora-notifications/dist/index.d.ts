/**
 * @lumora/notifications - Notifications module for Lumora
 * Send local notifications and handle push notifications
 */
import { PermissionStatus } from '@lumora/native-bridge';
export declare const NotificationsModule: import("@lumora/native-bridge").NativeModule;
export interface NotificationContent {
    title: string;
    body: string;
    data?: Record<string, any>;
    badge?: number;
    sound?: string;
    categoryId?: string;
    threadId?: string;
}
export interface NotificationTrigger {
    type: 'timeInterval' | 'calendar' | 'location';
    seconds?: number;
    repeats?: boolean;
    date?: Date;
    location?: {
        latitude: number;
        longitude: number;
        radius: number;
    };
}
export interface NotificationResponse {
    id: string;
    notification: NotificationContent;
    actionId?: string;
}
export interface NotificationsAPI {
    requestPermissions(): Promise<PermissionStatus>;
    scheduleNotification(notification: NotificationContent, trigger?: NotificationTrigger): Promise<string>;
    cancelNotification(id: string): Promise<void>;
    cancelAllNotifications(): Promise<void>;
    getNotificationToken(): Promise<string>;
    setBadgeCount(count: number): Promise<void>;
    addListener(event: 'notificationReceived', callback: (notification: NotificationContent) => void): () => void;
    addListener(event: 'notificationTapped', callback: (response: NotificationResponse) => void): () => void;
    addListener(event: 'tokenRefreshed', callback: (token: string) => void): () => void;
}
export declare const Notifications: NotificationsAPI;
export default Notifications;
//# sourceMappingURL=index.d.ts.map