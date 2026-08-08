import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import { Label } from "@components/ui/label";
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
import {
    REQUEST_STATUS_LABEL,
    REQUEST_STATUS_TONE,
    REQUEST_TYPE_LABEL,
} from "@constants/domain";
import { AppError, MyRequestItem, RequestStatus, RequestType } from "@dts";
import { fetchMyRequests, updateMyRequestStatus } from "@service/requestApi";

const ALL = "all";

const houseText = (h: MyRequestItem["houseId"]) => {
    if (!h) return "";
    if (typeof h === "string") return h;
    return `${h.code} — ${h.address}`;
};

const creatorText = (c: MyRequestItem["createdBy"]) => {
    if (!c) return "Hệ thống";
    if (typeof c === "string") return c;
    return c.displayName;
};

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";

const MyRequestsPage: React.FC = () => (
    <AdminGuard permissions={["dashboard.read"]}>
        <MyRequestsContent />
    </AdminGuard>
);

const MyRequestsContent: React.FC = () => {
    const [status, setStatus] = useState<RequestStatus | "">("");
    const [type, setType] = useState<RequestType | "">("");
    const [overdueOnly, setOverdueOnly] = useState(false);
    const [items, setItems] = useState<MyRequestItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchMyRequests({
            page: targetPage,
            status: status || undefined,
            type: type || undefined,
            overdueOnly: overdueOnly || undefined,
        })
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
    }, [status, type, overdueOnly]);

    const handleStatusChange = async (
        item: MyRequestItem,
        nextStatus: RequestStatus,
    ) => {
        try {
            setUpdatingId(item.requestId);
            await updateMyRequestStatus(item.requestId, { status: nextStatus });
            toast.success("Đã cập nhật trạng thái");
            load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div>
            <h1 className="mb-4 text-lg font-semibold">Yêu cầu của tôi</h1>

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select
                    value={status || ALL}
                    onValueChange={v =>
                        setStatus(v === ALL ? "" : (v as RequestStatus))
                    }
                >
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
                        {(
                            Object.entries(REQUEST_STATUS_LABEL) as [
                                RequestStatus,
                                string,
                            ][]
                        ).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={type || ALL}
                    onValueChange={v =>
                        setType(v === ALL ? "" : (v as RequestType))
                    }
                >
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Lọc theo loại yêu cầu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tất cả loại yêu cầu</SelectItem>
                        {(
                            Object.entries(REQUEST_TYPE_LABEL) as [
                                RequestType,
                                string,
                            ][]
                        ).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                        checked={overdueOnly}
                        onCheckedChange={c => setOverdueOnly(!!c)}
                    />
                    <Label className="cursor-pointer">Chỉ hiện quá hạn</Label>
                </label>
            </div>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Không có yêu cầu nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Nhà liên quan</TableHead>
                                <TableHead>Hạn xử lý</TableHead>
                                <TableHead>Người gửi</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item._id}>
                                    <TableCell className="font-medium">
                                        {item.title}
                                    </TableCell>
                                    <TableCell>
                                        {REQUEST_TYPE_LABEL[item.type]}
                                    </TableCell>
                                    <TableCell>{houseText(item.houseId)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {formatDate(item.dueDate)}
                                            {item.isOverdue && (
                                                <Badge tone="red">Quá hạn</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {creatorText(item.createdBy)}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={item.status}
                                            onValueChange={v =>
                                                handleStatusChange(
                                                    item,
                                                    v as RequestStatus,
                                                )
                                            }
                                            disabled={
                                                updatingId === item.requestId
                                            }
                                        >
                                            <SelectTrigger className="w-40">
                                                <SelectValue>
                                                    <Badge
                                                        tone={
                                                            REQUEST_STATUS_TONE[
                                                                item.status
                                                            ]
                                                        }
                                                    >
                                                        {
                                                            REQUEST_STATUS_LABEL[
                                                                item.status
                                                            ]
                                                        }
                                                    </Badge>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(
                                                    Object.entries(
                                                        REQUEST_STATUS_LABEL,
                                                    ) as [RequestStatus, string][]
                                                ).map(([key, label]) => (
                                                    <SelectItem
                                                        key={key}
                                                        value={key}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
        </div>
    );
};

export default MyRequestsPage;
