import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { EmergencyComplaintGisPoint } from "@dts";
import { fetchEmergencyComplaintGisOverview } from "@service/complaintApi";

const PREVIEW_LIMIT = 5;
const REFRESH_INTERVAL_MS = 30_000;

const formatTime = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
};

/**
 * Icon "Phản ánh khẩn cấp" tren header - cung nguon du lieu voi marker nhap
 * nhay o trang Ban do (fetchEmergencyComplaintGisOverview, xem
 * NeighborhoodZonesMap.tsx), de nhan vien thay ngay CO phan anh khan cap dang
 * mo tu BAT KY trang nao, khong phai vao Ban do moi biet. Chi hien nut nhap
 * nhay (dung lai class complaint-pulse-marker__ring cua index.css, container
 * "relative" o day dong vai tro tuong duong wrapper .complaint-pulse-marker
 * ben Ban do) khi co it nhat 1 phan anh - khac UpcomingMeetingsBell/
 * NotificationBell luon hien icon tinh, badge do la du.
 */
const EmergencyComplaintsBell: React.FC = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [points, setPoints] = useState<EmergencyComplaintGisPoint[]>([]);
    const [loading, setLoading] = useState(false);

    const refresh = () => {
        setLoading(true);
        fetchEmergencyComplaintGisOverview()
            .then(res => setPoints(res.points))
            .catch(() => setPoints([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (open) refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleItemClick = (point: EmergencyComplaintGisPoint) => {
        setOpen(false);
        navigate(`/complaints/${point._id}`);
    };

    const total = points.length;
    const preview = points.slice(0, PREVIEW_LIMIT);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                title="Phản ánh khẩn cấp"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ng_10 transition-colors hover:bg-blue_10"
            >
                {total > 0 && (
                    <>
                        <span className="complaint-pulse-marker__ring" />
                        <span className="complaint-pulse-marker__ring complaint-pulse-marker__ring--delay" />
                    </>
                )}
                <Flame className="relative h-5 w-5 text-red-600 dark:text-red-400" />
                {total > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                        {total > 99 ? "99+" : total}
                    </span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="p-0">
                        Phản ánh khẩn cấp
                    </DropdownMenuLabel>
                    <button
                        type="button"
                        className="text-xs font-medium text-primary hover:underline"
                        onClick={() => {
                            setOpen(false);
                            navigate("/complaints");
                        }}
                    >
                        Xem tất cả phản ánh
                    </button>
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                    {loading && (
                        <div className="px-2 py-4 text-center text-sm text-text_2">
                            Đang tải...
                        </div>
                    )}
                    {!loading && preview.length === 0 && (
                        <div className="px-2 py-4 text-center text-sm text-text_2">
                            Không có phản ánh khẩn cấp nào đang mở
                        </div>
                    )}
                    {!loading &&
                        preview.map(point => (
                            <DropdownMenuItem
                                key={point._id}
                                className="flex flex-col items-start gap-0.5 whitespace-normal"
                                onClick={() => handleItemClick(point)}
                            >
                                <span className="text-sm font-medium">
                                    {point.title}
                                </span>
                                <span className="text-xs text-text_2">
                                    {point.categoryLabel}
                                    {point.area ? ` · ${point.area}` : ""} ·{" "}
                                    {formatTime(point.createdAt)}
                                </span>
                            </DropdownMenuItem>
                        ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default EmergencyComplaintsBell;
