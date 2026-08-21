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
import Pagination from "@components/admin/Pagination";
import PageSizeSelect from "@components/admin/PageSizeSelect";
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
            currentView,
            currentView === "sent" && currentStatus !== "all"
                ? currentStatus
                : undefined,
        )
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
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

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <Tabs
                    value={view}
                    onValueChange={value => setView(value as ViewFilter)}
                >
                    <TabsList>
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
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày ban hành</TableHead>
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
                                        {index + 1}
                                    </TableCell>
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
