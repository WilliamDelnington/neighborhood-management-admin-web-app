import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
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

export interface RecordHistoryPageProps {
    title: string;
    backTo: string;
    fetchHistory: (params: {
        page: number;
        limit: number;
    }) => Promise<PaginatedData<AuditLogRecord>>;
    actionLabels: Record<string, string>;
}

/**
 * Noi dung trang "Lich su chinh sua day du" dung chung cho nhieu module - moi
 * trang cu the (HouseHistoryPage, PcccHistoryPage...) chi can boc AdminGuard
 * va truyen fetchHistory/backTo/title tuong ung.
 */
const RecordHistoryPage: React.FC<RecordHistoryPageProps> = ({
    title,
    backTo,
    fetchHistory,
    actionLabels,
}) => {
    const navigate = useNavigate();

    const [items, setItems] = useState<AuditLogRecord[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [viewing, setViewing] = useState<AuditLogRecord | null>(null);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchHistory({ page: targetPage, limit: 20 })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
                setTotal(res.total);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(backTo)}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">{title}</h1>
            </div>

            {total > 0 && (
                <div className="mb-2 text-xs text-text_2">{total} bản ghi</div>
            )}

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có lịch sử chỉnh sửa" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Thời gian</TableHead>
                                <TableHead>Người thực hiện</TableHead>
                                <TableHead>Hành động</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(log => (
                                <TableRow key={log._id}>
                                    <TableCell className="whitespace-nowrap text-sm">
                                        {formatDateTime(log.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        {actorLabel(log.actorId)}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {actionLabels[log.action] ||
                                            log.action}
                                    </TableCell>
                                    <TableCell>
                                        {log.metadata && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setViewing(log)
                                                }
                                            >
                                                Chi tiết
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {!loading && !error && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={load}
                    disabled={loading}
                />
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

export default RecordHistoryPage;
