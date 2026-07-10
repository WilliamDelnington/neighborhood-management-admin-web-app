import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge, BadgeTone } from "@components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import {
    LOAI_THONG_BAO_LABEL,
    TRANG_THAI_THONG_BAO_LABEL,
} from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { Announcement, AppError } from "@dts";
import {
    fetchAdminAnnouncements,
    publishAnnouncement,
} from "@service/announcementApi";

const STATUS_TONE: Record<Announcement["status"], BadgeTone> = {
    nhap: "gray",
    da_dang: "green",
};

type StatusFilter = "all" | Announcement["status"];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "nhap", label: "Nháp" },
    { key: "da_dang", label: "Đã đăng" },
];

const AnnouncementListPage: React.FC = () => (
    <AdminGuard roles={["admin", "secretary", "neighborhood_leader"]}>
        <AnnouncementListContent />
    </AdminGuard>
);

const AnnouncementListContent: React.FC = () => {
    const navigate = useNavigate();

    const [status, setStatus] = useState<StatusFilter>("all");
    const [items, setItems] = useState<Announcement[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [publishingId, setPublishingId] = useState<string | null>(null);

    const load = (targetPage = 1, currentStatus = status) => {
        if (targetPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(false);
        fetchAdminAnnouncements(
            targetPage,
            DEFAULT_PAGE_SIZE,
            currentStatus === "all" ? undefined : currentStatus,
        )
            .then(res => {
                setItems(prev =>
                    targetPage === 1 ? res.items : [...prev, ...res.items],
                );
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => {
                setLoading(false);
                setLoadingMore(false);
            });
    };

    useEffect(() => {
        load(1, status);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const handlePublish = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            setPublishingId(id);
            await publishAnnouncement(id);
            toast.success("Đã đăng thông báo");
            load(1, status);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setPublishingId(null);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Quản lý thông báo</h1>
                <Button onClick={() => navigate("/announcements/create")}>
                    <Plus className="mr-1 h-4 w-4" />
                    Thêm thông báo
                </Button>
            </div>

            <Tabs
                className="mb-4"
                value={status}
                onValueChange={value => setStatus(value as StatusFilter)}
            >
                <TabsList>
                    {STATUS_FILTERS.map(f => (
                        <TabsTrigger key={f.key} value={f.key}>
                            {f.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, status)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có thông báo nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày đăng</TableHead>
                                <TableHead aria-label="Thao tác" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(a => (
                                <TableRow
                                    key={a._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/announcements/${a._id}/edit`)
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {a.pinned ? "📌 " : ""}
                                        {a.title}
                                    </TableCell>
                                    <TableCell>
                                        {LOAI_THONG_BAO_LABEL[a.category]}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={STATUS_TONE[a.status]}>
                                            {TRANG_THAI_THONG_BAO_LABEL[a.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {a.publishedAt
                                            ? new Date(
                                                  a.publishedAt,
                                              ).toLocaleDateString("vi-VN")
                                            : "-"}
                                    </TableCell>
                                    <TableCell
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {a.status === "nhap" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                loading={publishingId === a._id}
                                                onClick={e =>
                                                    handlePublish(e, a._id)
                                                }
                                            >
                                                Đăng
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {!loading && !error && page < totalPages && (
                <div className="mt-3">
                    <Button
                        variant="outline"
                        disabled={loadingMore}
                        onClick={() => load(page + 1, status)}
                    >
                        {loadingMore ? "Đang tải..." : "Tải thêm"}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AnnouncementListPage;
