import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import PageHeader from "@components/admin/PageHeader";
import Pagination from "@components/admin/Pagination";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import SendRequestSheet from "@components/admin/SendRequestSheet";
import RequestSubSection, {
    emptyRequestSubSection,
    isRequestSubSectionValid,
    RequestSubSectionValue,
} from "@components/admin/RequestSubSection";
import RecordHistorySection from "@components/admin/RecordHistorySection";
import { usePermission } from "@store/authStore";
import {
    AppError,
    MucDoAnNinh,
    RequestItem,
    SecurityRecord,
    TinhTrangTheoDoiAnNinh,
} from "@dts";
import {
    MUC_DO_AN_NINH_LABEL,
    MUC_DO_AN_NINH_TONE,
    REQUEST_STATUS_LABEL,
    REQUEST_STATUS_TONE,
    SECURITY_AUDIT_ACTION_LABEL,
    TINH_TRANG_THEO_DOI_AN_NINH_LABEL,
    TINH_TRANG_THEO_DOI_AN_NINH_TONE,
} from "@constants/domain";
import {
    createSecurityRecord,
    deleteSecurityRecord,
    fetchSecurityAuditLogs,
    fetchSecurityRecords,
    updateSecurityRecord,
} from "@service/securityApi";
import { createRequest, fetchRequests } from "@service/requestApi";
import SecurityForm, {
    EMPTY_SECURITY_FORM,
    SecurityFormValues,
    isSecurityFormValid,
    toSecurityInput,
} from "./SecurityForm";

const LEVEL_ALL = "all";
const MONITORING_STATUS_ALL = "all";

const houseText = (h: SecurityRecord["houseId"]) => {
    if (typeof h === "string") return h;
    if (h) return `${h.code} — ${h.address}`;
    return "Nhà đã bị xóa";
};

const houseIdOf = (h: SecurityRecord["houseId"]) =>
    typeof h === "string" ? h : h?._id || "";

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";

const recordToForm = (r: SecurityRecord): SecurityFormValues => ({
    houseId: houseIdOf(r.houseId),
    houseLabel: houseText(r.houseId),
    hasCamera: r.hasCamera,
    hasSecurityComplaint: r.hasSecurityComplaint,
    level: r.level,
    reportedToPolice: r.reportedToPolice,
    monitoringStatus: r.monitoringStatus,
    note: r.note || "",
    inspectionDate: r.inspectionDate ? r.inspectionDate.slice(0, 10) : "",
});

const SecurityListPage: React.FC = () => (
    <AdminGuard permissions={["security.read"]}>
        <SecurityListContent />
    </AdminGuard>
);

const SecurityListContent: React.FC = () => {
    const [searchParams] = useSearchParams();
    const canCreate = usePermission("security.create");
    const canManage = usePermission("security.update");
    const canSendRequest = usePermission("requests.create");

    const [level, setLevel] = useState<MucDoAnNinh | "">(
        (searchParams.get("level") as MucDoAnNinh | null) || "",
    );
    const [monitoringStatus, setMonitoringStatus] = useState<
        TinhTrangTheoDoiAnNinh | ""
    >(
        (searchParams.get("monitoringStatus") as TinhTrangTheoDoiAnNinh | null) ||
            "",
    );
    const [items, setItems] = useState<SecurityRecord[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<SecurityRecord | null>(
        null,
    );
    const [form, setForm] = useState<SecurityFormValues>(EMPTY_SECURITY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [sendRequestOpen, setSendRequestOpen] = useState(false);
    const [relatedRequests, setRelatedRequests] = useState<RequestItem[]>([]);
    const [relatedRequestsLoading, setRelatedRequestsLoading] = useState(false);
    const [requestSubSection, setRequestSubSection] =
        useState<RequestSubSectionValue>(emptyRequestSubSection());

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchSecurityRecords({
            page: targetPage,
            limit: size,
            level: level || undefined,
            monitoringStatus: monitoringStatus || undefined,
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
    }, [level, monitoringStatus]);

    const openCreate = () => {
        setEditingId(null);
        setEditingRecord(null);
        setForm(EMPTY_SECURITY_FORM);
        setRequestSubSection(emptyRequestSubSection("Xử lý vấn đề an ninh"));
        setFormVisible(true);
    };

    const loadRelatedRequests = (recordId: string) => {
        setRelatedRequestsLoading(true);
        fetchRequests({ relatedModel: "SecurityRecord", relatedId: recordId })
            .then(res => setRelatedRequests(res.items))
            .catch(() => setRelatedRequests([]))
            .finally(() => setRelatedRequestsLoading(false));
    };

    const openEdit = (r: SecurityRecord) => {
        if (!canManage) return;
        setEditingId(r._id);
        setEditingRecord(r);
        setForm(recordToForm(r));
        setRequestSubSection(
            emptyRequestSubSection(`Xử lý vấn đề an ninh — ${houseText(r.houseId)}`),
        );
        setFormVisible(true);
        loadRelatedRequests(r._id);
    };

    const handleSubmit = async () => {
        if (!isSecurityFormValid(form)) {
            toast.error("Vui lòng chọn nhà và ngày kiểm tra");
            return;
        }
        if (!isRequestSubSectionValid(requestSubSection)) {
            toast.error(
                "Vui lòng nhập tiêu đề và chọn ít nhất một người nhận cho yêu cầu",
            );
            return;
        }
        try {
            setSubmitting(true);
            const record = editingId
                ? await updateSecurityRecord(editingId, toSecurityInput(form))
                : await createSecurityRecord(toSecurityInput(form));
            toast.success(
                editingId ? "Đã cập nhật hồ sơ an ninh" : "Đã thêm hồ sơ an ninh",
            );

            if (requestSubSection.enabled) {
                try {
                    await createRequest({
                        type: "security",
                        title: requestSubSection.title,
                        relatedModel: "SecurityRecord",
                        relatedId: record._id,
                        houseId: houseIdOf(record.houseId),
                        dueDate: requestSubSection.dueDate
                            ? new Date(requestSubSection.dueDate).toISOString()
                            : undefined,
                        targetUserIds: requestSubSection.targetUserIds,
                        targetRoles: requestSubSection.targetRoles,
                    });
                    toast.success("Đã gửi yêu cầu xử lý");
                } catch (err) {
                    toast.error(
                        `Đã lưu hồ sơ nhưng gửi yêu cầu thất bại: ${(err as AppError).message}`,
                    );
                }
            }

            setFormVisible(false);
            load(1);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            setDeleting(true);
            await deleteSecurityRecord(confirmDeleteId);
            toast.success("Đã xóa hồ sơ an ninh");
            setConfirmDeleteId(null);
            setFormVisible(false);
            load(1);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="An ninh"
                description="Quản lý các vụ việc, hồ sơ liên quan đến an ninh trật tự."
                action={
                    canCreate && (
                        <Button onClick={openCreate}>
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm hồ sơ
                        </Button>
                    )
                }
            />

            <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
            </div>

            <div className="mb-4 grid max-w-xl grid-cols-2 gap-3">
                <Select
                    value={level || LEVEL_ALL}
                    onValueChange={v =>
                        setLevel(v === LEVEL_ALL ? "" : (v as MucDoAnNinh))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Lọc theo mức độ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={LEVEL_ALL}>Tất cả mức độ</SelectItem>
                        {(
                            Object.entries(MUC_DO_AN_NINH_LABEL) as [
                                MucDoAnNinh,
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
                    value={monitoringStatus || MONITORING_STATUS_ALL}
                    onValueChange={v =>
                        setMonitoringStatus(
                            v === MONITORING_STATUS_ALL
                                ? ""
                                : (v as TinhTrangTheoDoiAnNinh),
                        )
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Lọc theo tình trạng theo dõi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={MONITORING_STATUS_ALL}>
                            Tất cả tình trạng theo dõi
                        </SelectItem>
                        {(
                            Object.entries(TINH_TRANG_THEO_DOI_AN_NINH_LABEL) as [
                                TinhTrangTheoDoiAnNinh,
                                string,
                            ][]
                        ).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có hồ sơ an ninh nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Nhà</TableHead>
                                <TableHead>Ngày kiểm tra</TableHead>
                                <TableHead>Mức độ</TableHead>
                                <TableHead>Tình trạng theo dõi</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((r, index) => (
                                <TableRow
                                    key={r._id}
                                    className={canManage ? "cursor-pointer" : ""}
                                    onClick={() => openEdit(r)}
                                >
                                    <TableCell className="text-center text-text_2">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {houseText(r.houseId)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(r.inspectionDate)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={MUC_DO_AN_NINH_TONE[r.level]}>
                                            {MUC_DO_AN_NINH_LABEL[r.level]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            tone={
                                                TINH_TRANG_THEO_DOI_AN_NINH_TONE[
                                                    r.monitoringStatus
                                                ]
                                            }
                                        >
                                            {
                                                TINH_TRANG_THEO_DOI_AN_NINH_LABEL[
                                                    r.monitoringStatus
                                                ]
                                            }
                                        </Badge>
                                    </TableCell>
                                    <TableCell
                                        className="text-right"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {canManage && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openEdit(r)}
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

            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={load}
                disabled={loading}
            />

            <Sheet open={formVisible} onOpenChange={setFormVisible}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {editingId ? "Sửa hồ sơ an ninh" : "Thêm hồ sơ an ninh"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <SecurityForm
                            values={form}
                            onChange={setForm}
                            afterLevel={
                                form.level !== "binh_thuong" && (
                                    <RequestSubSection
                                        type="security"
                                        value={requestSubSection}
                                        onChange={setRequestSubSection}
                                    />
                                )
                            }
                            afterInspectionDate={
                                editingId && (
                                    <div className="rounded-lg border border-divider_01 p-3">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold">
                                                Yêu cầu liên quan
                                            </h3>
                                            {canSendRequest && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setSendRequestOpen(true)
                                                    }
                                                >
                                                    Gửi yêu cầu
                                                </Button>
                                            )}
                                        </div>
                                        {relatedRequestsLoading && (
                                            <LoadingState />
                                        )}
                                        {!relatedRequestsLoading &&
                                            relatedRequests.length === 0 && (
                                                <EmptyState label="Chưa có yêu cầu nào liên quan" />
                                            )}
                                        {!relatedRequestsLoading &&
                                            relatedRequests.map(req => (
                                                <div
                                                    key={req._id}
                                                    className="border-b border-divider_01 py-2 text-sm last:border-0"
                                                >
                                                    <div className="font-medium">
                                                        {req.title}
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {req.recipients.map(
                                                            rec => (
                                                                <Badge
                                                                    key={
                                                                        rec._id
                                                                    }
                                                                    tone={
                                                                        rec.isOverdue
                                                                            ? "red"
                                                                            : REQUEST_STATUS_TONE[
                                                                                  rec
                                                                                      .status
                                                                              ]
                                                                    }
                                                                >
                                                                    {
                                                                        rec.displayName
                                                                    }{" "}
                                                                    ·{" "}
                                                                    {
                                                                        REQUEST_STATUS_LABEL[
                                                                            rec
                                                                                .status
                                                                        ]
                                                                    }
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )
                            }
                        />

                        {editingId && (
                            <RecordHistorySection
                                className="mt-5 border-t border-divider_01 pt-4"
                                fetchHistory={params =>
                                    fetchSecurityAuditLogs(editingId, params)
                                }
                                actionLabels={SECURITY_AUDIT_ACTION_LABEL}
                                historyHref={`/security/${editingId}/history`}
                            />
                        )}
                    </div>
                    <SheetFooter>
                        {canManage && editingId && (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => setConfirmDeleteId(editingId)}
                            >
                                Xóa hồ sơ
                            </Button>
                        )}
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            {editingId ? "Lưu thay đổi" : "Thêm hồ sơ"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog
                open={!!confirmDeleteId}
                onOpenChange={open => !open && setConfirmDeleteId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa hồ sơ an ninh?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        Bạn có chắc muốn xóa hồ sơ này? Hành động này không thể
                        hoàn tác.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDeleteId(null)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            loading={deleting}
                            onClick={handleDelete}
                        >
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {editingId && (
                <SendRequestSheet
                    open={sendRequestOpen}
                    onOpenChange={setSendRequestOpen}
                    lockedType="security"
                    relatedModel="SecurityRecord"
                    relatedId={editingId}
                    defaultTitle="Theo dõi hồ sơ an ninh"
                    defaultHouseId={
                        editingRecord ? houseIdOf(editingRecord.houseId) : undefined
                    }
                    defaultHouseLabel={
                        editingRecord ? houseText(editingRecord.houseId) : undefined
                    }
                    onCreated={() => loadRelatedRequests(editingId)}
                />
            )}
        </div>
    );
};

export default SecurityListPage;
