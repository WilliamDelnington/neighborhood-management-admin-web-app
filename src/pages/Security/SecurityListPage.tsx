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
import { useAuthStore } from "@store/authStore";
import { AppError, MucDoAnNinh, SecurityRecord } from "@dts";
import { LOAI_SO_HUU_LABEL, MUC_DO_AN_NINH_LABEL, MUC_DO_AN_NINH_TONE } from "@constants/domain";
import {
    createSecurityRecord,
    deleteSecurityRecord,
    fetchSecurityRecords,
    updateSecurityRecord,
} from "@service/securityApi";
import SecurityForm, {
    EMPTY_SECURITY_FORM,
    SecurityFormValues,
    isSecurityFormValid,
    toSecurityInput,
} from "./SecurityForm";

const VIEW_ROLES = [
    "admin",
    "neighborhood_leader",
    "regional_police",
    "people_committee_official",
] as const;

const LEVEL_ALL = "all";

const householdText = (h: SecurityRecord["householdId"]) =>
    typeof h === "string" ? h : `${h.code} — ${h.address}`;

const householdIdOf = (h: SecurityRecord["householdId"]) =>
    typeof h === "string" ? h : h._id;

const recordToForm = (r: SecurityRecord): SecurityFormValues => ({
    householdId: householdIdOf(r.householdId),
    householdLabel: householdText(r.householdId),
    ownershipType: r.ownershipType,
    renterCount: r.renterCount ? String(r.renterCount) : "",
    temporaryResidenceDeclared: r.temporaryResidenceDeclared,
    hasCamera: r.hasCamera,
    hasSecurityComplaint: r.hasSecurityComplaint,
    level: r.level,
    reportedToPolice: r.reportedToPolice,
    handlingStatus: r.handlingStatus || "",
    note: r.note || "",
});

const SecurityListPage: React.FC = () => (
    <AdminGuard roles={[...VIEW_ROLES]}>
        <SecurityListContent />
    </AdminGuard>
);

const SecurityListContent: React.FC = () => {
    const [searchParams] = useSearchParams();
    const user = useAuthStore(state => state.user);
    const canManage =
        !!user &&
        (user.roles.includes("admin") ||
            user.roles.includes("neighborhood_leader") ||
            user.roles.includes("regional_police"));

    const [level, setLevel] = useState<MucDoAnNinh | "">(
        (searchParams.get("level") as MucDoAnNinh | null) || "",
    );
    const [items, setItems] = useState<SecurityRecord[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<SecurityFormValues>(EMPTY_SECURITY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = (targetPage = 1) => {
        if (targetPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(false);
        fetchSecurityRecords({ page: targetPage, level: level || undefined })
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
    }, [level]);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_SECURITY_FORM);
        setFormVisible(true);
    };

    const openEdit = (r: SecurityRecord) => {
        if (!canManage) return;
        setEditingId(r._id);
        setForm(recordToForm(r));
        setFormVisible(true);
    };

    const handleSubmit = async () => {
        if (!isSecurityFormValid(form)) {
            toast.error("Vui lòng chọn hộ dân");
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
                    An ninh, tạm trú, nhà cho thuê
                </h1>
                {canManage && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm hồ sơ
                    </Button>
                )}
            </div>

            <Select
                value={level || LEVEL_ALL}
                onValueChange={v =>
                    setLevel(v === LEVEL_ALL ? "" : (v as MucDoAnNinh))
                }
            >
                <SelectTrigger className="mb-4 max-w-sm">
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
                                <TableHead>Hộ dân</TableHead>
                                <TableHead>Số người thuê</TableHead>
                                <TableHead>Hình thức sở hữu</TableHead>
                                <TableHead>Mức độ</TableHead>
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
                                        {householdText(r.householdId)}
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
                        <SecurityForm values={form} onChange={setForm} />
                    </div>
                    <SheetFooter>
                        {editingId && (
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
        </div>
    );
};

export default SecurityListPage;
