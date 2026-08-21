import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { LoadingState, EmptyState } from "@components/admin/DataStates";
import { AuditLogRecord, PaginatedData } from "@dts";

const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN");
};

const actorLabel = (actorId: AuditLogRecord["actorId"]) => {
    if (!actorId) return "Hệ thống";
    if (typeof actorId === "string") return actorId;
    return actorId.displayName || actorId.phone || actorId.email || actorId._id;
};

export interface RecordHistorySectionProps {
    /** Class cua khung boc ngoai - mac dinh phu hop dat truc tiep tren trang. */
    className?: string;
    title?: string;
    fetchHistory: (params: {
        page: number;
        limit: number;
    }) => Promise<PaginatedData<AuditLogRecord>>;
    actionLabels: Record<string, string>;
    /** Duong dan sang trang lich su day du, hien khi con nhieu hon so ban ghi xem truoc. */
    historyHref: string;
    previewLimit?: number;
}

/**
 * Khu vuc "Lich su chinh sua" dung chung cho man chi tiet cua nhieu module
 * (Nha so, PCCC, An ninh, Cuoc hop, Khao sat...). Mac dinh thu gon, chi goi API
 * khi nguoi dung bam xem (tranh tai du lieu khong can thiet), lay toi da
 * `previewLimit` ban ghi gan nhat; neu con nhieu hon, hien nut sang trang lich
 * su day du (xem RecordHistoryPage).
 */
const RecordHistorySection: React.FC<RecordHistorySectionProps> = ({
    className = "mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm",
    title = "Lịch sử chỉnh sửa",
    fetchHistory,
    actionLabels,
    historyHref,
    previewLimit = 10,
}) => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<AuditLogRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [viewing, setViewing] = useState<AuditLogRecord | null>(null);

    const toggle = () => {
        if (open) {
            setOpen(false);
            return;
        }
        setOpen(true);
        setLoading(true);
        fetchHistory({ page: 1, limit: previewLimit })
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

    return (
        <div className={className}>
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold">{title}</h2>
                <Button size="sm" variant="outline" onClick={toggle}>
                    {open ? "Ẩn lịch sử chỉnh sửa" : "Xem lịch sử chỉnh sửa"}
                </Button>
            </div>
            {open && (
                <>
                    {loading && <LoadingState />}
                    {!loading && items.length === 0 && (
                        <EmptyState label="Chưa có lịch sử chỉnh sửa" />
                    )}
                    {!loading &&
                        items.map(log => (
                            <div
                                key={log._id}
                                className="flex items-center justify-between border-b border-divider_01 py-2 text-sm last:border-0"
                            >
                                <div>
                                    <div className="font-medium">
                                        {actionLabels[log.action] ||
                                            log.action}
                                    </div>
                                    <div className="text-xs text-text_2">
                                        {actorLabel(log.actorId)} •{" "}
                                        {formatDateTime(log.createdAt)}
                                    </div>
                                </div>
                                {log.metadata && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setViewing(log)}
                                    >
                                        Chi tiết
                                    </Button>
                                )}
                            </div>
                        ))}
                    {!loading && total > items.length && (
                        <div className="mt-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(historyHref)}
                            >
                                Xem thêm lịch sử chỉnh sửa
                            </Button>
                        </div>
                    )}
                </>
            )}

            <Dialog
                open={!!viewing}
                onOpenChange={o => !o && setViewing(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chi tiết lịch sử chỉnh sửa</DialogTitle>
                    </DialogHeader>
                    <pre className="max-h-96 overflow-auto rounded-lg bg-gray-50 p-3 text-xs">
                        {JSON.stringify(viewing?.metadata, null, 2)}
                    </pre>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RecordHistorySection;
