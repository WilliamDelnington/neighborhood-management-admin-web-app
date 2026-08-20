import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
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
import PageHeader from "@components/admin/PageHeader";
import {
    LOAI_TIN_TUC_LABEL,
    TRANG_THAI_TIN_TUC_LABEL,
} from "@constants/domain";
import { DEFAULT_PAGE_SIZE, resolveAssetUrl } from "@constants/common";
import { News, AppError } from "@dts";
import { deleteNews, fetchAdminNews, publishNews } from "@service/newsApi";

const STATUS_TONE: Record<News["status"], BadgeTone> = {
    nhap: "gray",
    da_dang: "green",
};

type StatusFilter = "all" | News["status"];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "nhap", label: "Nháp" },
    { key: "da_dang", label: "Đã đăng" },
];

const NewsListPage: React.FC = () => (
    <AdminGuard permissions={["news.read"]}>
        <NewsListContent />
    </AdminGuard>
);

const NewsListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("news.create");
    const canManage = usePermission("news.update");
    const canPublish = usePermission("news.publish");

    const [status, setStatus] = useState<StatusFilter>("all");
    const [items, setItems] = useState<News[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [publishingId, setPublishingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = (targetPage = 1, currentStatus = status) => {
        if (targetPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(false);
        fetchAdminNews(
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
            await publishNews(id);
            toast.success("Đã đăng tin tức");
            load(1, status);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setPublishingId(null);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            setDeletingId(id);
            await deleteNews(id);
            toast.success("Đã xóa tin tức");
            load(1, status);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>
            <PageHeader
                title="Quản lý tin tức"
                description="Soạn và đăng tin tức tới cư dân."
                action={
                    canCreate && (
                        <Button onClick={() => navigate("/news/create")}>
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm tin tức
                        </Button>
                    )
                }
            />

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
                    <EmptyState label="Chưa có tin tức nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead aria-label="Ảnh đại diện" />
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày đăng</TableHead>
                                <TableHead aria-label="Thao tác" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((n, index) => (
                                <TableRow
                                    key={n._id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/news/${n._id}/edit`)
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        {n.coverImageUrl ? (
                                            <img
                                                src={resolveAssetUrl(
                                                    n.coverImageUrl,
                                                )}
                                                alt=""
                                                className="h-10 w-14 rounded-md object-cover"
                                            />
                                        ) : (
                                            <div className="h-10 w-14 rounded-md bg-ng_10" />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {n.pinned ? "📌 " : ""}
                                        {n.title}
                                    </TableCell>
                                    <TableCell>
                                        {LOAI_TIN_TUC_LABEL[n.category]}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={STATUS_TONE[n.status]}>
                                            {TRANG_THAI_TIN_TUC_LABEL[n.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {n.publishedAt
                                            ? new Date(
                                                  n.publishedAt,
                                              ).toLocaleDateString("vi-VN")
                                            : "-"}
                                    </TableCell>
                                    <TableCell
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {canPublish && n.status === "nhap" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    loading={
                                                        publishingId === n._id
                                                    }
                                                    onClick={e =>
                                                        handlePublish(e, n._id)
                                                    }
                                                >
                                                    Đăng
                                                </Button>
                                            )}
                                            {canManage && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="!text-red-500"
                                                    loading={
                                                        deletingId === n._id
                                                    }
                                                    onClick={e =>
                                                        handleDelete(e, n._id)
                                                    }
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
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

export default NewsListPage;
