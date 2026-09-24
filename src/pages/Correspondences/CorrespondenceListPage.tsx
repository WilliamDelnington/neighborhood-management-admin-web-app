import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { useAuthStore, usePermission } from "@store/authStore";
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
import Pagination from "@components/admin/Pagination";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    Correspondence,
    CorrespondenceListItem,
    CorrespondenceListView,
    CorrespondenceType,
} from "@dts";
import { fetchCorrespondences } from "@service/correspondenceApi";

const STATUS_LABEL: Record<Correspondence["status"], string> = {
    nhap: "Nháp",
    da_gui: "Đã gửi",
};

const STATUS_TONE: Record<Correspondence["status"], BadgeTone> = {
    nhap: "gray",
    da_gui: "green",
};

type StatusFilter = "all" | Correspondence["status"];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "nhap", label: "Nháp" },
    { key: "da_gui", label: "Đã gửi" },
];

const MAX_RECEIVERS_SHOWN = 2;

const typeLabel = (doc: CorrespondenceListItem): string => {
    const type = doc.correspondenceTypeId;
    return typeof type === "string" ? "" : (type as CorrespondenceType).name;
};

const idOf = (ref: string | { _id: string } | null): string => {
    if (!ref) return "";
    return typeof ref === "string" ? ref : ref._id;
};

// Nguoi gui/nguoi nhan chi duoc populate o tab "Tất cả" (xem
// correspondenceService.listCorrespondences) - cac tab khac khong hien 2 cot nay.
const senderLabel = (doc: CorrespondenceListItem): string => {
    const sender = doc.senderId;
    if (!sender || typeof sender === "string") return "—";
    return sender.displayName;
};

const receiverLabels = (doc: CorrespondenceListItem): string[] => {
    const labels: string[] = [];
    doc.targetNeighborhoodIds.forEach(n => {
        if (typeof n !== "string") labels.push(n.name);
    });
    doc.targetUserIds.forEach(u => {
        if (typeof u !== "string") labels.push(u.displayName);
    });
    return labels;
};

const ReceiverCell: React.FC<{ doc: CorrespondenceListItem }> = ({ doc }) => {
    const labels = receiverLabels(doc);
    if (labels.length === 0) return <>—</>;
    const shown = labels.slice(0, MAX_RECEIVERS_SHOWN);
    const rest = labels.length - shown.length;
    return (
        <span title={labels.join(", ")}>
            {shown.join(", ")}
            {rest > 0 && <span className="text-text_2"> +{rest}</span>}
        </span>
    );
};

const CorrespondenceListPage: React.FC = () => (
    <AdminGuard permissions={["correspondences.read"]}>
        <CorrespondenceListContent />
    </AdminGuard>
);

const CorrespondenceListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("correspondences.create");
    const currentUserId = useAuthStore(state => state.user?.id);

    // null = chua biet tab mac dinh - lan tai dau de backend tu chon ("all"
    // cho user quan ly khong gioi han pham vi, "received" cho nguoi khac).
    const [view, setView] = useState<CorrespondenceListView | null>(null);
    const [canViewAll, setCanViewAll] = useState(false);
    // Bo qua lan chay effect do chinh ket qua lan tai dau gan `view`, tranh
    // tai lai lan thu hai y het.
    const skipNextLoadRef = useRef(false);
    const [status, setStatus] = useState<StatusFilter>("all");
    const [items, setItems] = useState<CorrespondenceListItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = (
        targetPage = 1,
        currentView = view,
        currentStatus = status,
        size = pageSize,
    ) => {
        setLoading(true);
        setError(false);
        fetchCorrespondences(
            targetPage,
            size,
            currentView ?? undefined,
            currentView !== "received" && currentStatus !== "all"
                ? currentStatus
                : undefined,
        )
            .then(res => {
                setCanViewAll(res.canViewAll);
                if (currentView === null) {
                    skipNextLoadRef.current = true;
                    setView(res.view);
                }
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (skipNextLoadRef.current) {
            skipNextLoadRef.current = false;
            return;
        }
        load(1, view, status);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, status]);

    const openCorrespondence = (doc: CorrespondenceListItem) => {
        // Chi nguoi gui moi sua duoc ban nhap - nguoi xem ban nhap cua nguoi
        // khac (tab "Tất cả") mo trang chi tiet chi xem.
        if (doc.status === "nhap" && idOf(doc.senderId) === currentUserId) {
            navigate(`/correspondences/${doc._id}/edit`);
        } else {
            navigate(`/correspondences/${doc._id}`);
        }
    };

    return (
        <div>
            <PageHeader
                title="Văn bản"
                description="Soạn thảo, gửi và theo dõi văn bản qua lại giữa tổ dân phố và phường."
                action={
                    canCreate && (
                        <Button onClick={() => navigate("/correspondences/create")}>
                            <Plus className="mr-1 h-4 w-4" />
                            Soạn văn bản
                        </Button>
                    )
                }
            />

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <Tabs
                    value={view ?? ""}
                    onValueChange={value => setView(value as CorrespondenceListView)}
                >
                    <TabsList>
                        {canViewAll && (
                            <TabsTrigger value="all">Tất cả văn bản</TabsTrigger>
                        )}
                        <TabsTrigger value="received">Đã nhận</TabsTrigger>
                        <TabsTrigger value="sent">Đã gửi</TabsTrigger>
                    </TabsList>
                </Tabs>
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, view, status, size);
                    }}
                />
            </div>

            {(view === "sent" || view === "all") && (
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
            )}

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, view, status)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có văn bản nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Số/ký hiệu</TableHead>
                                <TableHead>Tiêu đề</TableHead>
                                {view === "all" && (
                                    <>
                                        <TableHead>Người gửi</TableHead>
                                        <TableHead>Người nhận</TableHead>
                                    </>
                                )}
                                <TableHead>Trạng thái</TableHead>
                                {view === "received" && (
                                    <TableHead>Đọc</TableHead>
                                )}
                                <TableHead>Ngày ban hành</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((doc, index) => (
                                <TableRow
                                    key={doc._id}
                                    className="cursor-pointer"
                                    onClick={() => openCorrespondence(doc)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell
                                        className={
                                            doc.isUnread ? "font-semibold" : ""
                                        }
                                    >
                                        {typeLabel(doc)}
                                    </TableCell>
                                    <TableCell
                                        className={
                                            doc.isUnread
                                                ? "font-semibold"
                                                : "font-medium"
                                        }
                                    >
                                        {doc.documentNumber || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {doc.isUnread && (
                                                <span
                                                    className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500"
                                                    aria-label="Chưa đọc"
                                                />
                                            )}
                                            <span
                                                className={
                                                    doc.isUnread
                                                        ? "font-semibold"
                                                        : ""
                                                }
                                            >
                                                {doc.title}
                                            </span>
                                            {doc.isUrgent && (
                                                <Badge tone="red">Khẩn</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    {view === "all" && (
                                        <>
                                            <TableCell>{senderLabel(doc)}</TableCell>
                                            <TableCell>
                                                <ReceiverCell doc={doc} />
                                            </TableCell>
                                        </>
                                    )}
                                    <TableCell>
                                        <Badge tone={STATUS_TONE[doc.status]}>
                                            {STATUS_LABEL[doc.status]}
                                        </Badge>
                                    </TableCell>
                                    {view === "received" && (
                                        <TableCell>
                                            {doc.isUnread ? (
                                                <Badge tone="red">
                                                    Chưa đọc
                                                </Badge>
                                            ) : (
                                                <Badge tone="gray">
                                                    Đã đọc
                                                </Badge>
                                            )}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        {new Date(
                                            doc.issuedAt,
                                        ).toLocaleDateString("vi-VN")}
                                    </TableCell>
                                    <TableCell
                                        className="text-right"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openCorrespondence(doc)}
                                        >
                                            Chi tiết
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={p => load(p, view, status)}
                disabled={loading}
            />
        </div>
    );
};

export default CorrespondenceListPage;
