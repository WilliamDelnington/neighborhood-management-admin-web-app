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
import AssigneePicker from "@components/admin/AssigneePicker";
import RecordHistorySection from "@components/admin/RecordHistorySection";
import { usePermission } from "@store/authStore";
import {
    AppError,
    AssignableStaff,
    MucDoAnNinh,
    SecurityRecord,
    TinhTrangTheoDoiAnNinh,
} from "@dts";
import {
    LOAI_SO_HUU_LABEL,
    MUC_DO_AN_NINH_LABEL,
    MUC_DO_AN_NINH_TONE,
    SECURITY_AUDIT_ACTION_LABEL,
    TINH_TRANG_THEO_DOI_AN_NINH_LABEL,
    TINH_TRANG_THEO_DOI_AN_NINH_TONE,
} from "@constants/domain";
import {
    assignSecurityRecord,
    createSecurityRecord,
    deleteSecurityRecord,
    fetchSecurityAuditLogs,
    fetchSecurityRecords,
    updateSecurityRecord,
} from "@service/securityApi";
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

const assigneeText = (a: SecurityRecord["assigneeId"]) => {
    if (!a) return "";
    if (typeof a === "string") return a;
    return a.displayName;
};

const recordToForm = (r: SecurityRecord): SecurityFormValues => ({
    houseId: houseIdOf(r.houseId),
    houseLabel: houseText(r.houseId),
    houseDeclarationNumber:
        typeof r.houseId === "object" && r.houseId
            ? r.houseId.residenceDeclarationNumber || ""
            : "",
    ownershipType: r.ownershipType,
    renterCount: r.renterCount ? String(r.renterCount) : "",
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
    const canAssign = usePermission("security.assign");

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
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
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

    const [assigneeDialogOpen, setAssigneeDialogOpen] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const load = (targetPage = 1) => {
        if (targetPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(false);
        fetchSecurityRecords({
            page: targetPage,
            level: level || undefined,
            monitoringStatus: monitoringStatus || undefined,
        })
            .then(res => {
                setItems(prev =>
                    targetPage === 1 ? res.items : [...prev, ...res.items],
                );
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => {
                setLoading(false);
                setLoadingMore(false);
            });
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [level, monitoringStatus]);

    const openCreate = () => {
        setEditingId(null);
        setEditingRecord(null);
        setForm(EMPTY_SECURITY_FORM);
        setFormVisible(true);
    };

    const openEdit = (r: SecurityRecord) => {
        if (!canManage) return;
        setEditingId(r._id);
        setEditingRecord(r);
        setForm(recordToForm(r));
        setFormVisible(true);
    };

    const handleAssign = async (staff: AssignableStaff) => {
        if (!editingId) return;
        try {
            setAssigning(true);
            const updated = await assignSecurityRecord(editingId, {
                assigneeId: staff.id,
            });
            setEditingRecord(updated);
            setAssigneeDialogOpen(false);
            toast.success(`Đã giao cho ${staff.displayName} theo dõi`);
            load(page);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setAssigning(false);
        }
    };

    const handleSubmit = async () => {
        if (!isSecurityFormValid(form)) {
            toast.error("Vui lòng chọn nhà và ngày kiểm tra");
            return;
        }
        try {
            setSubmitting(true);
            if (editingId) {
                await updateSecurityRecord(editingId, toSecurityInput(form));
                toast.success("Đã cập nhật hồ sơ an ninh");
            } else {
                await createSecurityRecord(toSecurityInput(form));
                toast.success("Đã thêm hồ sơ an ninh");
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
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">
                    An ninh & Quản lý cư trú
                </h1>
                {canCreate && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm hồ sơ
                    </Button>
                )}
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

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
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
                                <TableHead>Nhà</TableHead>
                                <TableHead>Ngày kiểm tra</TableHead>
                                <TableHead>Số người đang ở thực tế</TableHead>
                                <TableHead>Hình thức sở hữu</TableHead>
                                <TableHead>Mức độ</TableHead>
                                <TableHead>Tình trạng theo dõi</TableHead>
                                <TableHead>Người phụ trách</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(r => (
                                <TableRow
                                    key={r._id}
                                    className={canManage ? "cursor-pointer" : ""}
                                    onClick={() => openEdit(r)}
                                >
                                    <TableCell className="font-medium">
                                        {houseText(r.houseId)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(r.inspectionDate)}
                                    </TableCell>
                                    <TableCell>{r.renterCount || 0}</TableCell>
                                    <TableCell>
                                        {LOAI_SO_HUU_LABEL[r.ownershipType]}
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
                                    <TableCell>
                                        {assigneeText(r.assigneeId) || (
                                            <span className="text-text_2">
                                                Chưa giao
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {!loading && !error && page < totalPages && (
                <div className="mt-3">
                    <Button
                        variant="outline"
                        disabled={loadingMore}
                        onClick={() => load(page + 1)}
                    >
                        {loadingMore ? "Đang tải..." : "Tải thêm"}
                    </Button>
                </div>
            )}

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
                            afterInspectionDate={
                                editingId && (
                                    <div className="rounded-lg border border-divider_01 p-3">
                                        <h3 className="mb-3 text-sm font-semibold">
                                            Phân công theo dõi
                                        </h3>
                                        <p className="mb-3 text-sm text-text_2">
                                            Người phụ trách:{" "}
                                            <span className="font-medium text-text_1">
                                                {assigneeText(
                                                    editingRecord?.assigneeId,
                                                ) || "Chưa giao"}
                                            </span>
                                        </p>
                                        {canAssign && (
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setAssigneeDialogOpen(
                                                        true,
                                                    )
                                                }
                                            >
                                                {assigneeText(
                                                    editingRecord?.assigneeId,
                                                )
                                                    ? "Đổi người phụ trách"
                                                    : "Chọn người phụ trách"}
                                            </Button>
                                        )}
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

            <AssigneePicker
                open={assigneeDialogOpen}
                onOpenChange={setAssigneeDialogOpen}
                permission="security.assign"
                onSelect={handleAssign}
                selecting={assigning}
            />
        </div>
    );
};

export default SecurityListPage;
