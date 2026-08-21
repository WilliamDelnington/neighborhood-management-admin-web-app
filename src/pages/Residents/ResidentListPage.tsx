import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
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
import Pagination from "@components/admin/Pagination";
import PageHeader from "@components/admin/PageHeader";
import PageSizeSelect from "@components/admin/PageSizeSelect";
import RecordHistorySection from "@components/admin/RecordHistorySection";
import { usePermission } from "@store/authStore";
import { AppError, ResidentRecord } from "@dts";
import { LOAI_SO_HUU_LABEL, RESIDENT_AUDIT_ACTION_LABEL } from "@constants/domain";
import { DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    createResidentRecord,
    deleteResidentRecord,
    fetchResidentAuditLogs,
    fetchResidentRecords,
    updateResidentRecord,
} from "@service/residentApi";
import ResidentForm, {
    EMPTY_RESIDENT_FORM,
    ResidentFormValues,
    isResidentFormValid,
    toResidentInput,
} from "./ResidentForm";

const houseText = (h: ResidentRecord["houseId"]) => {
    if (typeof h === "string") return h;
    if (h) return `${h.code} — ${h.address}`;
    return "Nhà đã bị xóa";
};

const houseIdOf = (h: ResidentRecord["houseId"]) =>
    typeof h === "string" ? h : h?._id || "";

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "";

const recordToForm = (r: ResidentRecord): ResidentFormValues => ({
    houseId: houseIdOf(r.houseId),
    houseLabel: houseText(r.houseId),
    houseDeclarationNumber:
        typeof r.houseId === "object" && r.houseId
            ? r.houseId.residenceDeclarationNumber || ""
            : "",
    ownershipType: r.ownershipType,
    renterCount: r.renterCount ? String(r.renterCount) : "",
    inspectionDate: r.inspectionDate ? r.inspectionDate.slice(0, 10) : "",
});

const ResidentListPage: React.FC = () => (
    <AdminGuard permissions={["residents.read"]}>
        <ResidentListContent />
    </AdminGuard>
);

const ResidentListContent: React.FC = () => {
    const canCreate = usePermission("residents.create");
    const canManage = usePermission("residents.update");

    const [items, setItems] = useState<ResidentRecord[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ResidentFormValues>(EMPTY_RESIDENT_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = (targetPage = 1, size = pageSize) => {
        setLoading(true);
        setError(false);
        fetchResidentRecords({ page: targetPage, limit: size })
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
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_RESIDENT_FORM);
        setFormVisible(true);
    };

    const openEdit = (r: ResidentRecord) => {
        if (!canManage) return;
        setEditingId(r._id);
        setForm(recordToForm(r));
        setFormVisible(true);
    };

    const handleSubmit = async () => {
        if (!isResidentFormValid(form)) {
            toast.error("Vui lòng chọn nhà và ngày kiểm tra");
            return;
        }
        try {
            setSubmitting(true);
            if (editingId) {
                await updateResidentRecord(editingId, toResidentInput(form));
                toast.success("Đã cập nhật hồ sơ cư trú");
            } else {
                await createResidentRecord(toResidentInput(form));
                toast.success("Đã thêm hồ sơ cư trú");
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
            await deleteResidentRecord(confirmDeleteId);
            toast.success("Đã xóa hồ sơ cư trú");
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
                title="Hồ sơ cư trú"
                description="Quản lý hồ sơ cư trú, tạm trú/tạm vắng của cư dân."
                action={
                    canCreate && (
                        <Button onClick={openCreate}>
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm hồ sơ
                        </Button>
                    )
                }
            />

            <div className="mb-4 flex items-center justify-end gap-3">
                <PageSizeSelect
                    value={pageSize}
                    onChange={size => {
                        setPageSize(size);
                        load(1, size);
                    }}
                />
            </div>

            <div className="rounded-lg border border-divider_01 bg-ui_bg shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState onRetry={() => load(1)} />}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có hồ sơ cư trú nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead>Nhà</TableHead>
                                <TableHead>Ngày kiểm tra</TableHead>
                                <TableHead>Hình thức sở hữu</TableHead>
                                <TableHead>Số người đang ở thực tế</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((r, index) => (
                                <TableRow
                                    key={r._id}
                                    className={canManage ? "cursor-pointer" : ""}
                                    onClick={
                                        canManage ? () => openEdit(r) : undefined
                                    }
                                >
                                    <TableCell className="text-center text-text_2">
                                        {(page - 1) * pageSize + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {houseText(r.houseId)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(r.inspectionDate)}
                                    </TableCell>
                                    <TableCell>
                                        {LOAI_SO_HUU_LABEL[r.ownershipType]}
                                    </TableCell>
                                    <TableCell>{r.renterCount || 0}</TableCell>
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

            <Sheet open={formVisible} onOpenChange={setFormVisible}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {editingId ? "Sửa hồ sơ cư trú" : "Thêm hồ sơ cư trú"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <ResidentForm values={form} onChange={setForm} />

                        {editingId && (
                            <RecordHistorySection
                                className="mt-5 border-t border-divider_01 pt-4"
                                fetchHistory={params =>
                                    fetchResidentAuditLogs(editingId, params)
                                }
                                actionLabels={RESIDENT_AUDIT_ACTION_LABEL}
                                historyHref={`/residents/${editingId}/history`}
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
                        <DialogTitle>Xóa hồ sơ cư trú?</DialogTitle>
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
        </div>
    );
};

export default ResidentListPage;
