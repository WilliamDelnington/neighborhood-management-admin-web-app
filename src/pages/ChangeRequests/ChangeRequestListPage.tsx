import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Badge, BadgeTone } from "@components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@components/ui/sheet";
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
    AppError,
    ChangeRequest,
    ChangeRequestStatus,
    ChangeRequestTargetModel,
    ChangeRequestType,
} from "@dts";
import {
    decideChangeRequest,
    fetchChangeRequests,
} from "@service/changeRequestApi";

const TARGET_MODEL_LABEL: Record<ChangeRequestTargetModel, string> = {
    HouseRecord: "Nhà số",
    HouseOwnership: "Quan hệ sở hữu nhà",
    User: "Tài khoản",
};

const CHANGE_TYPE_LABEL: Record<ChangeRequestType, string> = {
    update: "Cập nhật thông tin",
    unlink: "Hủy liên kết",
};

const STATUS_LABEL: Record<ChangeRequestStatus, string> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Đã từ chối",
    cancelled: "Đã hủy",
};

const STATUS_TONE: Record<ChangeRequestStatus, BadgeTone> = {
    pending: "yellow",
    approved: "green",
    rejected: "red",
    cancelled: "gray",
};

const STATUS_FILTERS: { key: ChangeRequestStatus; label: string }[] = [
    { key: "pending", label: "Chờ duyệt" },
    { key: "approved", label: "Đã duyệt" },
    { key: "rejected", label: "Đã từ chối" },
    { key: "cancelled", label: "Đã hủy" },
];

const displayNameOf = (
    ref: string | { displayName: string } | undefined,
): string => (ref && typeof ref !== "string" ? ref.displayName : ref || "—");

const ChangeRequestListPage: React.FC = () => (
    <AdminGuard permissions={["change_requests.read"]}>
        <ChangeRequestListContent />
    </AdminGuard>
);

const ChangeRequestListContent: React.FC = () => {
    const [status, setStatus] = useState<ChangeRequestStatus>("pending");
    const [items, setItems] = useState<ChangeRequest[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [selected, setSelected] = useState<ChangeRequest | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [decisionNote, setDecisionNote] = useState("");
    const [deciding, setDeciding] = useState(false);

    const load = (targetPage = 1) => {
        setLoading(true);
        setError(false);
        fetchChangeRequests(targetPage, 20, status, "staff")
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
    }, [status]);

    const openDetail = (item: ChangeRequest) => {
        setSelected(item);
        setDecisionNote("");
        setRejecting(false);
        setSheetOpen(true);
    };

    const handleApprove = async () => {
        if (!selected) return;
        try {
            setDeciding(true);
            await decideChangeRequest(selected._id, true);
            toast.success("Đã duyệt yêu cầu");
            setSheetOpen(false);
            load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeciding(false);
        }
    };

    const handleReject = async () => {
        if (!selected || !decisionNote.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }
        try {
            setDeciding(true);
            await decideChangeRequest(selected._id, false, decisionNote.trim());
            toast.success("Đã từ chối yêu cầu");
            setSheetOpen(false);
            load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeciding(false);
        }
    };

    const diffFields = selected
        ? Array.from(
              new Set([
                  ...Object.keys(selected.previousSnapshot || {}),
                  ...Object.keys(selected.patch || {}),
              ]),
          )
        : [];

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Yêu cầu thay đổi</h1>
            </div>

            <Tabs
                className="mb-4"
                value={status}
                onValueChange={value => setStatus(value as ChangeRequestStatus)}
            >
                <TabsList>
                    {STATUS_FILTERS.map(f => (
                        <TabsTrigger key={f.key} value={f.key}>
                            {f.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(page)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Không có yêu cầu nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Đối tượng</TableHead>
                                <TableHead>Loại thay đổi</TableHead>
                                <TableHead>Người gửi</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày gửi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow
                                    key={item._id}
                                    className="cursor-pointer"
                                    onClick={() => openDetail(item)}
                                >
                                    <TableCell className="font-medium">
                                        {TARGET_MODEL_LABEL[item.targetModel]}
                                    </TableCell>
                                    <TableCell>
                                        {CHANGE_TYPE_LABEL[item.changeType]}
                                    </TableCell>
                                    <TableCell>
                                        {displayNameOf(item.requestedBy)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={STATUS_TONE[item.status]}>
                                            {STATUS_LABEL[item.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            item.createdAt,
                                        ).toLocaleString("vi-VN")}
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

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Chi tiết yêu cầu thay đổi</SheetTitle>
                    </SheetHeader>
                    {selected && (
                        <div className="flex-1 overflow-y-auto py-4">
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1 text-sm">
                                    <div>
                                        <span className="text-text_2">
                                            Đối tượng:{" "}
                                        </span>
                                        {TARGET_MODEL_LABEL[selected.targetModel]}
                                    </div>
                                    <div>
                                        <span className="text-text_2">
                                            Loại thay đổi:{" "}
                                        </span>
                                        {CHANGE_TYPE_LABEL[selected.changeType]}
                                    </div>
                                    <div>
                                        <span className="text-text_2">
                                            Người gửi:{" "}
                                        </span>
                                        {displayNameOf(selected.requestedBy)}
                                    </div>
                                    {selected.reason && (
                                        <div>
                                            <span className="text-text_2">
                                                Lý do:{" "}
                                            </span>
                                            {selected.reason}
                                        </div>
                                    )}
                                </div>

                                {selected.changeType === "update" && (
                                    <div>
                                        <Label className="mb-1.5 block">
                                            Nội dung đề nghị thay đổi
                                        </Label>
                                        <div className="overflow-x-auto rounded-lg border border-divider_01">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Trường
                                                        </TableHead>
                                                        <TableHead>
                                                            Giá trị cũ
                                                        </TableHead>
                                                        <TableHead>
                                                            Giá trị mới
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {diffFields.map(field => (
                                                        <TableRow key={field}>
                                                            <TableCell className="font-medium">
                                                                {field}
                                                            </TableCell>
                                                            <TableCell>
                                                                {String(
                                                                    selected
                                                                        .previousSnapshot?.[
                                                                        field
                                                                    ] ?? "—",
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {String(
                                                                    selected
                                                                        .patch?.[
                                                                        field
                                                                    ] ?? "—",
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {selected.status !== "pending" && (
                                    <div className="space-y-1 text-sm">
                                        <div>
                                            <span className="text-text_2">
                                                Kết quả:{" "}
                                            </span>
                                            <Badge
                                                tone={
                                                    STATUS_TONE[selected.status]
                                                }
                                            >
                                                {STATUS_LABEL[selected.status]}
                                            </Badge>
                                        </div>
                                        {selected.decisionNote && (
                                            <div>
                                                <span className="text-text_2">
                                                    Ghi chú:{" "}
                                                </span>
                                                {selected.decisionNote}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selected.status === "pending" && rejecting && (
                                    <div className="space-y-1.5">
                                        <Label>Lý do từ chối</Label>
                                        <Textarea
                                            value={decisionNote}
                                            onChange={e =>
                                                setDecisionNote(e.target.value)
                                            }
                                            placeholder="Nhập lý do từ chối yêu cầu này"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {selected?.status === "pending" && (
                        <SheetFooter className="flex-col gap-2 sm:flex-col">
                            {!rejecting ? (
                                <>
                                    <Button
                                        className="w-full"
                                        loading={deciding}
                                        onClick={handleApprove}
                                    >
                                        Duyệt yêu cầu
                                    </Button>
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => setRejecting(true)}
                                    >
                                        Từ chối
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        className="w-full !text-red-500"
                                        variant="outline"
                                        loading={deciding}
                                        onClick={handleReject}
                                    >
                                        Xác nhận từ chối
                                    </Button>
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => setRejecting(false)}
                                    >
                                        Quay lại
                                    </Button>
                                </>
                            )}
                        </SheetFooter>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default ChangeRequestListPage;
