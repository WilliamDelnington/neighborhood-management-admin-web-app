import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Button } from "@components/ui/button";
import { NotificationDeliveryItem } from "@dts";
import {
    fetchMyNotifications,
    fetchUnreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
} from "@service/notificationApi";

const UNREAD_POLL_MS = 30_000;

const formatTime = (value?: string) =>
    value ? new Date(value).toLocaleString("vi-VN") : "";

const NotificationBell: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState<NotificationDeliveryItem[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshUnreadCount = () => {
        fetchUnreadNotificationCount()
            .then(res => setUnreadCount(res.count))
            .catch(() => {});
    };

    useEffect(() => {
        refreshUnreadCount();
        const timer = setInterval(refreshUnreadCount, UNREAD_POLL_MS);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        fetchMyNotifications({ limit: 10 })
            .then(res => setItems(res.items))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [open]);

    const handleItemClick = async (item: NotificationDeliveryItem) => {
        if (item.readAt) return;
        try {
            await markNotificationRead(item.deliveryId);
            setItems(prev =>
                prev.map(i =>
                    i.deliveryId === item.deliveryId
                        ? { ...i, readAt: new Date().toISOString() }
                        : i,
                ),
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            // bo qua loi, khong lam gian doan UI
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setItems(prev =>
                prev.map(i => ({ ...i, readAt: i.readAt || new Date().toISOString() })),
            );
            setUnreadCount(0);
        } catch {
            // bo qua loi, khong lam gian doan UI
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-ng_10">
                <Bell className="h-5 w-5 text-text_1" />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="p-0">
                        Thông báo
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllRead}
                        >
                            Đánh dấu đã đọc
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                    {loading && (
                        <div className="px-2 py-4 text-center text-sm text-text_2">
                            Đang tải...
                        </div>
                    )}
                    {!loading && items.length === 0 && (
                        <div className="px-2 py-4 text-center text-sm text-text_2">
                            Chưa có thông báo
                        </div>
                    )}
                    {!loading &&
                        items.map(item => (
                            <DropdownMenuItem
                                key={item.deliveryId}
                                className="flex flex-col items-start gap-0.5 whitespace-normal"
                                onClick={() => handleItemClick(item)}
                            >
                                <div className="flex w-full items-center gap-1.5">
                                    {!item.readAt && (
                                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-main" />
                                    )}
                                    <span className="text-sm font-medium">
                                        {item.notification?.title}
                                    </span>
                                </div>
                                <span className="text-xs text-text_2">
                                    {item.notification?.body}
                                </span>
                                <span className="text-xs text-text_3">
                                    {formatTime(item.notification?.createdAt)}
                                </span>
                            </DropdownMenuItem>
                        ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationBell;
