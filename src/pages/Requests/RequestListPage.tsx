import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
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
import SendRequestSheet from "@components/admin/SendRequestSheet";
import RequestDetailSheet from "./RequestDetailSheet";
import { usePermission } from "@store/authStore";
import { RequestItem, RequestType } from "@dts";
import {
    REQUEST_PRIORITY_LABEL,
    REQUEST_PRIORITY_TONE,
    REQUEST_STATUS_LABEL,
    REQUEST_STATUS_TONE,
    REQUEST_TYPE_LABEL,
} from "@constants/domain";
import { fetchRequests } from "@service/requestApi";

const ALL_TYPES = "all";

const houseText = (h: RequestItem["houseId"]) => {
    if (!h) return "";
    if (typeof h === "string") return h;
    return `${h.code} — ${h.address}`;
};

const creatorText = (c: RequestItem["createdBy"]) => {
    if (!c) return "Hệ thống";
    if (typeof c === "string") return c;
    return c.displayName;
};

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";

const RequestListPage: React.FC = () => (
    <AdminGuard permissions={["requests.read"]}>
        <RequestListContent />
    </AdminGuard>
);

const RequestListContent: React.FC = () => {
    const canCreate = usePermission("requests.create");

    const [type, setType] = useState<RequestType | "">("");
    const [items, setItems] = useState<RequestItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchRequests({ page: targetPage, type: type || undefined })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Yêu cầu công việc</h1>
                {canCreate && (
                    <Button onClick={() => setFormOpen(true)}>
                        <Plus className="mr-1 h-4 w-4" />
                        Tạo yêu cầu
                    </Button>
                )}
            </div>

            <Select
                value={type || ALL_TYPES}
                onValueChange={v =>
                    setType(v === ALL_TYPES ? "" : (v as RequestType))
                }
            >
                <SelectTrigger className="mb-4 max-w-xs">
                    <SelectValue placeholder="Lọc theo loại yêu cầu" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_TYPES}>Tất cả loại yêu cầu</SelectItem>
                    {(Object.entries(REQUEST_TYPE_LABEL) as [RequestType, string][]).map(
                        ([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ),
                    )}
                </SelectContent>
            </Select>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có yêu cầu nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Mức độ</TableHead>
                                <TableHead>Nhà liên quan</TableHead>
                                <TableHead>Người nhận</TableHead>
                                <TableHead>Hạn xử lý</TableHead>
                                <TableHead>Người gửi</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(r => (
                                <TableRow
                                    key={r._id}
                                    className="cursor-pointer"
                                    onClick={() => setDetailId(r._id)}
                                >
                                    <TableCell className="font-medium">
                                        {r.title}
                                    </TableCell>
                                    <TableCell>
                                        {r.formDefinitionSnapshot?.name ||
                                            REQUEST_TYPE_LABEL[r.type] ||
                                            r.type}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={
                                                REQUEST_PRIORITY_TONE[
                                                    r.priority
                                                ]
                                            }
                                        >
                                            {
                                                REQUEST_PRIORITY_LABEL[
                                                    r.priority
                                                ]
                                            }
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{houseText(r.houseId)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {r.recipients.map(rec => (
                                                <Badge
                                                    key={rec._id}
                                                    tone={
                                                        rec.isOverdue
                                                            ? "red"
                                                            : REQUEST_STATUS_TONE[
                                                                  rec.status
                                                              ]
                                                    }
                                                    title={
                                                        REQUEST_STATUS_LABEL[
                                                            rec.status
                                                        ]
                                                    }
                                                >
                                                    {rec.displayName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatDate(r.dueDate)}</TableCell>
                                    <TableCell>{creatorText(r.createdBy)}</TableCell>
                                    <TableCell onClick={e => e.stopPropagation()}>
                                        <Link
                                            to={`/requests/${r._id}/history`}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Lịch sử
                                        </Link>
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
                    onPageChange={p => load(p)}
                    disabled={loading}
                />
            )}

            <SendRequestSheet
                open={formOpen}
                onOpenChange={setFormOpen}
                onCreated={() => load(1)}
            />

            <RequestDetailSheet
                requestId={detailId}
                onOpenChange={open => !open && setDetailId(null)}
                onUpdated={() => load(page)}
            />
        </div>
    );
};

export default RequestListPage;
