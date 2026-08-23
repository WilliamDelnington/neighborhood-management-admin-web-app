import React, { useEffect, useState } from "react";
import AdminGuard from "@components/auth/AdminGuard";
import PageHeader from "@components/admin/PageHeader";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
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
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { AuditLogRecord } from "@dts";
import { fetchAuditLogs } from "@service/auditLogApi";
import { DEFAULT_PAGE_SIZE } from "@constants/common";

const TARGET_MODELS = [
    "User",
    "Role",
    "Household",
    "HouseRecord",
    "Citizen",
    "Business",
    "BusinessType",
    "Complaint",
    "PcccCheck",
    "SecurityRecord",
    "Meeting",
    "Announcement",
    "Survey",
    "FinanceTransaction",
    "FileAsset",
    "Setting",
    "ImportJob",
    "Report",
];

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

const AuditLogListPage: React.FC = () => (
    <AdminGuard permissions={["audit.read"]}>
        <AuditLogListContent />
    </AdminGuard>
);

const AuditLogListContent: React.FC = () => {
    const [action, setAction] = useState("");
    const [targetModel, setTargetModel] = useState<string>("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [items, setItems] = useState<AuditLogRecord[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [viewing, setViewing] = useState<AuditLogRecord | null>(null);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchAuditLogs({
            page: targetPage,
            limit: size,
            action: action || undefined,
            targetModel: targetModel || undefined,
            from: from || undefined,
            to: to || undefined,
        })
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
        const timer = setTimeout(() => load(1), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [action, targetModel, from, to]);

    return (
        <div>
            <PageHeader
                title="Nhật ký hệ thống"
                description="Tra cứu nhật ký thao tác của người dùng trong hệ thống."
            />

            <div className="mb-3 flex flex-wrap items-end gap-3">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
                <div className="space-y-1.5">
                    <Label className="text-xs">Hành động</Label>
                    <Input
                        className="w-48"
                        placeholder="vd: role.create"
                        value={action}
                        onChange={e => setAction(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Đối tượng</Label>
                    <Select
                        value={targetModel || "all"}
                        onValueChange={v => setTargetModel(v === "all" ? "" : v)}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {TARGET_MODELS.map(m => (
                                <SelectItem key={m} value={m}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Từ ngày</Label>
                    <Input
                        type="date"
                        className="w-40"
                        value={from}
                        onChange={e => setFrom(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Đến ngày</Label>
                    <Input
                        type="date"
                        className="w-40"
                        value={to}
                        onChange={e => setTo(e.target.value)}
                    />
                </div>
            </div>

            {total > 0 && (
                <div className="mb-2 text-xs text-text_2">{total} bản ghi</div>
            )}

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có nhật ký nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Thời gian</TableHead>
                                <TableHead>Người thực hiện</TableHead>
                                <TableHead>Hành động</TableHead>
                                <TableHead>Đối tượng</TableHead>
                                <TableHead>IP</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((log, index) => (
                                <TableRow key={log._id}>
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm">
                                        {formatDateTime(log.createdAt)}
                                    </TableCell>
                                    <TableCell>{actorLabel(log.actorId)}</TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {log.action}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {log.targetModel || "-"}
                                        {log.targetId && (
                                            <div className="text-text_2">
                                                {log.targetId}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-text_2">
                                        {log.ipAddress || "-"}
                                    </TableCell>
                                    <TableCell>
                                        {log.metadata && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setViewing(log)}
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
                onOpenChange={open => !open && setViewing(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chi tiết nhật ký</DialogTitle>
                    </DialogHeader>
                    <pre className="max-h-96 overflow-auto rounded-lg bg-gray-50 p-3 text-xs">
                        {JSON.stringify(viewing?.metadata, null, 2)}
                    </pre>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AuditLogListPage;
