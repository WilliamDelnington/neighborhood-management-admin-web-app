import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    CalendarDays,
    ImageOff,
    LayoutGrid,
    List,
    Pin,
    Plus,
    Trash2,
    UserRound,
} from "lucide-react";
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

// Noi dung tin tuc luu dang HTML (xem RichTextEditor) - can bo the truoc
// khi hien trich doan van ban thuan tren the danh sach.
const excerptFromHtml = (html: string) =>
    html
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const authorName = (createdBy: News["createdBy"]) => {
    if (!createdBy) return "";
    return typeof createdBy === "string" ? "" : createdBy.displayName;
};

type StatusFilter = "all" | News["status"];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "nhap", label: "Nháp" },
    { key: "da_dang", label: "Đã đăng" },
];

type ViewMode = "card" | "list";
const VIEW_MODE_STORAGE_KEY = "news_list_view_mode";

const loadStoredViewMode = (): ViewMode => {
    try {
        const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
        return stored === "list" ? "list" : "card";
    } catch {
        return "card";
    }
};

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
    const [viewMode, setViewMode] = useState<ViewMode>(loadStoredViewMode);
    const [items, setItems] = useState<News[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [publishingId, setPublishingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const changeViewMode = (mode: ViewMode) => {
        setViewMode(mode);
        try {
            localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
        } catch {
            // Khong sao neu trinh duyet chan localStorage - chi mat tuy chinh
            // ghi nho giua cac lan ghe trang, khong anh huong chuc nang.
        }
    };

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

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Tabs
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

                <div className="flex items-center gap-1 rounded-lg border border-divider_01 p-1">
                    <button
                        type="button"
                        title="Xem dạng danh sách"
                        onClick={() => changeViewMode("list")}
                        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                            viewMode === "list"
                                ? "bg-primary text-primary-foreground"
                                : "text-text_2 hover:bg-ng_10"
                        }`}
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        title="Xem dạng thẻ"
                        onClick={() => changeViewMode("card")}
                        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                            viewMode === "card"
                                ? "bg-primary text-primary-foreground"
                                : "text-text_2 hover:bg-ng_10"
                        }`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {loading && (
                <div className="rounded-lg border border-divider_01 bg-ui_bg p-6 shadow-sm">
                    <LoadingState />
                </div>
            )}
            {!loading && error && (
                <div className="rounded-lg border border-divider_01 bg-ui_bg p-6 shadow-sm">
                    <ErrorState onRetry={() => load(1, status)} />
                </div>
            )}
            {!loading && !error && items.length === 0 && (
                <div className="rounded-lg border border-divider_01 bg-ui_bg p-6 shadow-sm">
                    <EmptyState label="Chưa có tin tức nào" />
                </div>
            )}

            {!loading && !error && items.length > 0 && viewMode === "card" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map(n => (
                        <div
                            key={n._id}
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/news/${n._id}/edit`)}
                            onKeyDown={e => {
                                if (e.key === "Enter")
                                    navigate(`/news/${n._id}/edit`);
                            }}
                            className="flex cursor-pointer flex-col overflow-hidden rounded-lg border border-divider_01 bg-ui_bg shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="relative aspect-video w-full bg-ng_10">
                                {n.coverImageUrl ? (
                                    <img
                                        src={resolveAssetUrl(
                                            n.coverImageUrl,
                                        )}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-text_3">
                                        <ImageOff className="h-7 w-7" />
                                    </div>
                                )}
                                <div className="absolute right-2 top-2">
                                    <Badge
                                        tone={STATUS_TONE[n.status]}
                                        className="px-3"
                                    >
                                        {TRANG_THAI_TIN_TUC_LABEL[n.status]}
                                    </Badge>
                                </div>
                                {n.pinned && (
                                    <div className="absolute left-2 top-2">
                                        <Badge
                                            tone="yellow"
                                            className="gap-1"
                                        >
                                            <Pin className="h-3 w-3" />
                                            Ghim
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-1 flex-col gap-2 p-3">
                                <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold">
                                    {n.title}
                                </h3>
                                <div>
                                    <Badge tone="gray">
                                        {LOAI_TIN_TUC_LABEL[n.category]}
                                    </Badge>
                                </div>
                                {excerptFromHtml(n.content) && (
                                    <p className="line-clamp-2 text-xs text-text_2">
                                        {excerptFromHtml(n.content)}
                                    </p>
                                )}
                                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-text_2">
                                    {authorName(n.createdBy) ? (
                                        <span className="flex min-w-0 items-center gap-1">
                                            <UserRound className="h-3 w-3 shrink-0" />
                                            <span className="truncate">
                                                {authorName(n.createdBy)}
                                            </span>
                                        </span>
                                    ) : (
                                        <span />
                                    )}
                                    <span className="flex shrink-0 items-center gap-1">
                                        <CalendarDays className="h-3 w-3" />
                                        {n.publishedAt
                                            ? new Date(
                                                  n.publishedAt,
                                              ).toLocaleDateString("vi-VN")
                                            : "Chưa đăng"}
                                    </span>
                                </div>

                                {(canPublish || canManage) && (
                                    <div
                                        className="mt-auto flex items-center gap-1.5 border-t border-divider_01 pt-2.5"
                                        onClick={e => e.stopPropagation()}
                                        onKeyDown={e => e.stopPropagation()}
                                        role="presentation"
                                    >
                                        {canPublish &&
                                            n.status === "nhap" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    loading={
                                                        publishingId ===
                                                        n._id
                                                    }
                                                    onClick={e =>
                                                        handlePublish(
                                                            e,
                                                            n._id,
                                                        )
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
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && items.length > 0 && viewMode === "list" && (
                <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">
                                    STT
                                </TableHead>
                                <TableHead aria-label="Ảnh đại diện" />
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Người đăng</TableHead>
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
                                    <TableCell className="text-text_2">
                                        {authorName(n.createdBy) || "-"}
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
                                            {canPublish &&
                                                n.status === "nhap" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        loading={
                                                            publishingId ===
                                                            n._id
                                                        }
                                                        onClick={e =>
                                                            handlePublish(
                                                                e,
                                                                n._id,
                                                            )
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
                                                        handleDelete(
                                                            e,
                                                            n._id,
                                                        )
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
                </div>
            )}

            {!loading && !error && page < totalPages && (
                <div className="mt-4">
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
