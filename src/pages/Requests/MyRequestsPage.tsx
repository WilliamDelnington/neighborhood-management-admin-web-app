import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
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
    REQUEST_PRIORITY_LABEL,
    REQUEST_PRIORITY_TONE,
    REQUEST_STATUS_LABEL,
    REQUEST_STATUS_TONE,
    REQUEST_TYPE_LABEL,
} from "@constants/domain";
import { AppError, MyRequestItem, RequestStatus, RequestType } from "@dts";
import { fetchMyRequests, updateMyRequestStatus } from "@service/requestApi";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import RequestDetailSheet from "./RequestDetailSheet";

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

    const [needsInfoTarget, setNeedsInfoTarget] = useState<MyRequestItem | null>(
        null,
    );
    const [needsInfoNote, setNeedsInfoNote] = useState("");
    const [detailRequestId, setDetailRequestId] = useState<string | null>(
        null,
    );

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
        note?: string,
    ) => {
        try {
            setUpdatingId(item.requestId);
            await updateMyRequestStatus(item.requestId, {
                status: nextStatus,
                note,
            });
            toast.success("Đã cập nhật trạng thái");
            load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUpdatingId(null);
        }
    };

    const openNeedsInfoDialog = (item: MyRequestItem) => {
        setNeedsInfoNote("");
        setNeedsInfoTarget(item);
    };

    const confirmNeedsInfo = async () => {
        if (!needsInfoTarget) return;
        if (!needsInfoNote.trim()) {
            toast.error("Vui lòng mô tả thông tin cần bổ sung");
            return;
        }
        await handleStatusChange(needsInfoTarget, "needs_info", needsInfoNote.trim());
        setNeedsInfoTarget(null);
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
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Mức độ</TableHead>
                                <TableHead>Nhà liên quan</TableHead>
                                <TableHead>Hạn xử lý</TableHead>
                                <TableHead>Người gửi</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => {
                                const busy = updatingId === item.requestId;
                                return (
                                    <TableRow
                                        key={item._id}
                                        className="cursor-pointer"
                                        onClick={() =>
                                            setDetailRequestId(item.requestId)
                                        }
                                    >
                                        <TableCell className="text-center text-text_2">
                                            {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {item.title}
                                        </TableCell>
                                        <TableCell>
                                            {item.formDefinitionSnapshot?.name ||
                                                REQUEST_TYPE_LABEL[item.type] ||
                                                item.type}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                tone={
                                                    REQUEST_PRIORITY_TONE[
                                                        item.priority
                                                    ]
                                                }
                                            >
                                                {
                                                    REQUEST_PRIORITY_LABEL[
                                                        item.priority
                                                    ]
                                                }
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {houseText(item.houseId)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {formatDate(item.dueDate)}
                                                {item.isOverdue && (
                                                    <Badge tone="red">
                                                        Quá hạn
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {creatorText(item.createdBy)}
                                        </TableCell>
                                        <TableCell
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="flex flex-col items-start gap-1.5">
                                                <Badge
                                                    tone={
                                                        item.isOverdue
                                                            ? "red"
                                                            : REQUEST_STATUS_TONE[
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
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.status ===
                                                        "pending" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    item,
                                                                    "acknowledged",
                                                                )
                                                            }
                                                        >
                                                            Tiếp nhận
                                                        </Button>
                                                    )}
                                                    {item.status ===
                                                        "acknowledged" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    item,
                                                                    "in_progress",
                                                                )
                                                            }
                                                        >
                                                            Bắt đầu xử lý
                                                        </Button>
                                                    )}
                                                    {(item.status ===
                                                        "in_progress" ||
                                                        item.status ===
                                                            "needs_info") && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    openNeedsInfoDialog(
                                                                        item,
                                                                    )
                                                                }
                                                            >
                                                                Cần bổ sung
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={busy}
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        item,
                                                                        "awaiting_confirmation",
                                                                    )
                                                                }
                                                            >
                                                                Báo hoàn thành
                                                            </Button>
                                                        </>
                                                    )}
                                                    {item.status ===
                                                        "needs_info" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    item,
                                                                    "in_progress",
                                                                )
                                                            }
                                                        >
                                                            Tiếp tục xử lý
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setDetailRequestId(
                                                        item.requestId,
                                                    )
                                                }
                                            >
                                                Chi tiết
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
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

            <Dialog
                open={!!needsInfoTarget}
                onOpenChange={open => !open && setNeedsInfoTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yêu cầu bổ sung thông tin</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label>Bạn cần bổ sung thông tin gì? (bắt buộc)</Label>
                        <Textarea
                            value={needsInfoNote}
                            onChange={e => setNeedsInfoNote(e.target.value)}
                            placeholder="Mô tả cụ thể thông tin bạn cần người giao yêu cầu bổ sung"
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setNeedsInfoTarget(null)}
                        >
                            Hủy
                        </Button>
                        <Button
                            loading={updatingId === needsInfoTarget?.requestId}
                            onClick={confirmNeedsInfo}
                        >
                            Gửi yêu cầu bổ sung
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <RequestDetailSheet
                requestId={detailRequestId}
                onOpenChange={open => !open && setDetailRequestId(null)}
                onUpdated={() => load(page)}
            />
        </div>
    );
};

export default MyRequestsPage;
