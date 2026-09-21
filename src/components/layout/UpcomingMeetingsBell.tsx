import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Meeting } from "@dts";
import { fetchMeetings } from "@service/meetingApi";

const PREVIEW_LIMIT = 5;
const REFRESH_INTERVAL_MS = 60_000;

const formatTime = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
};

/**
 * Icon "Cuộc họp sắp tới" tren header - dua ra khoi noi dung Dashboard (truoc
 * chi hien o do, chi mot so vai tro nhin thay) de xem duoc tu BAT KY trang
 * nao, giong cach NotificationBell.tsx da lam voi thong bao. Dung chung 1
 * request (fetchMeetings) vua lay so luong (total) vua lay du lieu xem truoc
 * (items) - khac NotificationBell can socket rieng cho badge vi thong bao can
 * cap nhat tuc thi, con lich hop khong can realtime nen refresh dinh ky la du.
 */
const UpcomingMeetingsBell: React.FC = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<Meeting[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const refresh = () => {
        setLoading(true);
        fetchMeetings(true, 1, PREVIEW_LIMIT)
            .then(res => {
                setItems(res.items);
                setTotal(res.total);
            })
            .catch(() => {
                setItems([]);
                setTotal(0);
            })
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

    const handleItemClick = (meeting: Meeting) => {
        setOpen(false);
        navigate(`/meetings/${meeting._id}/edit`);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                title="Cuộc họp sắp tới"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ng_10 transition-colors hover:bg-blue_10"
            >
                <CalendarClock className="h-5 w-5 text-text_1" />
                {total > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                        {total > 99 ? "99+" : total}
                    </span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="p-0">
                        Cuộc họp sắp tới
                    </DropdownMenuLabel>
                    <button
                        type="button"
                        className="text-xs font-medium text-primary hover:underline"
                        onClick={() => {
                            setOpen(false);
                            navigate("/meetings");
                        }}
                    >
                        Xem lịch họp
                    </button>
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
                            Không có cuộc họp nào sắp tới
                        </div>
                    )}
                    {!loading &&
                        items.map(meeting => (
                            <DropdownMenuItem
                                key={meeting._id}
                                className="flex flex-col items-start gap-0.5 whitespace-normal"
                                onClick={() => handleItemClick(meeting)}
                            >
                                <span className="text-sm font-medium">
                                    {meeting.title}
                                </span>
                                <span className="text-xs text-text_2">
                                    {formatTime(meeting.startTime)} ·{" "}
                                    {meeting.location}
                                </span>
                            </DropdownMenuItem>
                        ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UpcomingMeetingsBell;
