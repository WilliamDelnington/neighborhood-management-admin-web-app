import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, ClipboardCheck } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import Pagination from "@components/admin/Pagination";
import { Badge, type BadgeTone } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import type { InspectionCampaign, InspectionCampaignStatus } from "@dts";
import { fetchInspectionCampaigns } from "@service/inspectionApi";

const STATUS: Record<InspectionCampaignStatus, { label: string; tone: BadgeTone }> = {
    DRAFT: { label: "Nháp", tone: "gray" },
    ACTIVE: { label: "Đang thực hiện", tone: "blue" },
    LOCKED: { label: "Phường đã khóa", tone: "yellow" },
    CLOSED: { label: "Đã kết thúc", tone: "green" },
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("vi-VN");

const InspectionCampaignListPage: React.FC = () => (
    <AdminGuard permissions={["inspections.read"]}>
        <InspectionCampaignListContent />
    </AdminGuard>
);

const InspectionCampaignListContent: React.FC = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<InspectionCampaign[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [status, setStatus] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchInspectionCampaigns({
            page: targetPage,
            status: status === "ALL" ? undefined : status,
        })
            .then(data => {
                setItems(data.items);
                setPage(data.page);
                setTotalPages(data.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold">Rà soát – chiến dịch</h1>
                    <p className="mt-1 text-sm text-text_2">
                        Các đợt rà soát do Phường giao cho Tổ dân phố.
                    </p>
                </div>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                        {Object.entries(STATUS).map(([value, meta]) => (
                            <SelectItem key={value} value={value}>{meta.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading && <LoadingState label="Đang tải chiến dịch..." />}
            {!loading && error && <ErrorState onRetry={() => load(page)} />}
            {!loading && !error && items.length === 0 && (
                <EmptyState label="Chưa có chiến dịch nào được giao cho phạm vi của bạn" />
            )}
            {!loading && !error && items.length > 0 && (
                <div className="grid gap-4 xl:grid-cols-2">
                    {items.map(item => {
                        const overdue = item.status === "ACTIVE" && new Date(item.dueAt) < new Date();
                        return (
                            <article
                                key={item._id}
                                className="rounded-2xl border border-divider_01 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 gap-3">
                                        <span className="rounded-xl bg-blue-50 p-2 text-primary">
                                            <ClipboardCheck className="h-5 w-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-text_1">{item.name}</h2>
                                            <p className="mt-1 line-clamp-2 text-sm text-text_2">{item.purpose}</p>
                                        </div>
                                    </div>
                                    <Badge tone={STATUS[item.status].tone}>{STATUS[item.status].label}</Badge>
                                </div>
                                <div className={`mt-4 flex items-center gap-2 text-sm ${overdue ? "text-red-600" : "text-text_2"}`}>
                                    <CalendarClock className="h-4 w-4" />
                                    {formatDate(item.startAt)} – {formatDate(item.dueAt)}
                                    {overdue && " · Quá hạn"}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-text_2">
                                    <span className="rounded-full bg-ng_10 px-3 py-1">
                                        {item.checklistTemplate.length} mục checklist
                                    </span>
                                    {item.allowSelfDeclaration && (
                                        <span className="rounded-full bg-ng_10 px-3 py-1">Cho phép tự khai</span>
                                    )}
                                    {item.requiredEvidence && (
                                        <span className="rounded-full bg-ng_10 px-3 py-1">Bắt buộc minh chứng</span>
                                    )}
                                </div>
                                <Button
                                    className="mt-5 w-full sm:w-auto"
                                    onClick={() => navigate(`/inspections/${item._id}`)}
                                >
                                    Xem và thực hiện
                                </Button>
                            </article>
                        );
                    })}
                </div>
            )}
            {!loading && !error && totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={load} />
            )}
        </div>
    );
};

export default InspectionCampaignListPage;
