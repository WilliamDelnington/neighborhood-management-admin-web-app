import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
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
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import { Correspondence, CorrespondenceType } from "@dts";
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
type ViewFilter = "received" | "sent";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "nhap", label: "Nháp" },
    { key: "da_gui", label: "Đã gửi" },
];

const typeLabel = (doc: Correspondence): string => {
    const type = doc.correspondenceTypeId;
    return typeof type === "string" ? "" : (type as CorrespondenceType).name;
};

const CorrespondenceListPage: React.FC = () => (
    <AdminGuard permissions={["correspondences.read"]}>
        <CorrespondenceListContent />
    </AdminGuard>
);

const CorrespondenceListContent: React.FC = () => {
    const navigate = useNavigate();
    const canCreate = usePermission("correspondences.create");

    const [view, setView] = useState<ViewFilter>("received");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [items, setItems] = useState<Correspondence[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const load = (
        targetPage = 1,
        currentView = view,
        currentStatus = status,
    ) => {
        if (targetPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(false);
        fetchCorrespondences(
            targetPage,
            DEFAULT_PAGE_SIZE,
            currentView,
            currentView === "sent" && currentStatus !== "all"
                ? currentStatus
                : undefined,
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
        load(1, view, status);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, status]);

    const openCorrespondence = (doc: Correspondence) => {
        if (view === "sent" && doc.status === "nhap") {
            navigate(`/correspondences/${doc._id}/edit`);
        } else {
            navigate(`/correspondences/${doc._id}`);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Văn bản</h1>
                {canCreate && (
                    <Button onClick={() => navigate("/correspondences/create")}>
                        <Plus className="mr-1 h-4 w-4" />
                        Soạn văn bản
                    </Button>
                )}
            </div>

            <Tabs
                className="mb-3"
                value={view}
                onValueChange={value => setView(value as ViewFilter)}
            >
                <TabsList>
                    <TabsTrigger value="received">Đã nhận</TabsTrigger>
                    <TabsTrigger value="sent">Đã gửi</TabsTrigger>
                </TabsList>
            </Tabs>

            {view === "sent" && (
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

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
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
                                <TableHead>Loại</TableHead>
                                <TableHead>Số/ký hiệu</TableHead>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày ban hành</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(doc => (
                                <TableRow
                                    key={doc._id}
                                    className="cursor-pointer"
                                    onClick={() => openCorrespondence(doc)}
                                >
                                    <TableCell>{typeLabel(doc)}</TableCell>
                                    <TableCell className="font-medium">
                                        {doc.documentNumber || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {doc.title}
                                            {doc.isUrgent && (
                                                <Badge tone="red">Khẩn</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={STATUS_TONE[doc.status]}>
                                            {STATUS_LABEL[doc.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            doc.issuedAt,
                                        ).toLocaleDateString("vi-VN")}
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
                        onClick={() => load(page + 1, view, status)}
                    >
                        {loadingMore ? "Đang tải..." : "Tải thêm"}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CorrespondenceListPage;
