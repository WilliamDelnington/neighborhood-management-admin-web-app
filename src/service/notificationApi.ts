import { API } from "@constants/common";
import { NotificationDeliveryItem, PaginatedData } from "@dts";
import { request } from "./request";

export const fetchMyNotifications = (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
}): Promise<PaginatedData<NotificationDeliveryItem>> =>
    request<PaginatedData<NotificationDeliveryItem>>(
        "GET",
        API.NOTIFICATIONS,
        params,
    );

export const fetchUnreadNotificationCount = (): Promise<{ count: number }> =>
    request<{ count: number }>("GET", API.NOTIFICATIONS_UNREAD_COUNT);

export const markNotificationRead = (
    deliveryId: string,
): Promise<NotificationDeliveryItem> =>
    request<NotificationDeliveryItem>(
        "POST",
        `${API.NOTIFICATIONS}/${deliveryId}/read`,
    );

export const markAllNotificationsRead = (): Promise<{
    modifiedCount: number;
}> => request<{ modifiedCount: number }>("POST", API.NOTIFICATIONS_READ_ALL);
