import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
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
import { usePermission } from "@store/authStore";
import { AppError, Citizen, Household } from "@dts";
import {
    createCitizen,
    deleteCitizen,
    fetchCitizens,
    updateCitizen,
} from "@service/citizenApi";
import CitizenForm, {
    CitizenFormValues,
    EMPTY_CITIZEN_FORM,
    isCitizenFormValid,
    toCitizenInput,
} from "./CitizenForm";

const householdLabelOf = (h: string | Household): string =>
    typeof h === "string" ? "" : `${h.code} — ${h.address}`;

const householdIdOf = (h: string | Household): string =>
    typeof h === "string" ? h : h._id;

const citizenToForm = (c: Citizen): CitizenFormValues => ({
    fullName: c.fullName,
    phone: c.phone || "",
    cccd: c.cccd || "",
    birthDate: c.birthDate ? c.birthDate.slice(0, 10) : "",
    gender: c.gender,
    relationToHead: c.relationToHead || "",
    householdId: householdIdOf(c.householdId),
    householdLabel: householdLabelOf(c.householdId),
    residenceType: c.residenceType,
    isElderly: c.isElderly,
    isChild: c.isChild,
    isDisabledOrSupportNeeded: c.isDisabledOrSupportNeeded,
    isPartyMember: c.isPartyMember,
    isUnionMember: c.isUnionMember,
});

const badgeFor = (c: Citizen) => {
    if (c.isDisabledOrSupportNeeded) {
        return <Badge tone="red">Cần hỗ trợ</Badge>;
    }
    if (c.isElderly) {
        return <Badge tone="yellow">Cao tuổi</Badge>;
    }
    if (c.isChild) {
        return <Badge tone="blue">Trẻ em</Badge>;
    }
    return null;
};

const CitizenListPage: React.FC = () => (
    <AdminGuard permissions={["citizens.read"]}>
        <CitizenListContent />
    </AdminGuard>
);

const CitizenListContent: React.FC = () => {
    const canCreate = usePermission("citizens.create");
    const canUpdate = usePermission("citizens.update");
    const canDelete = usePermission("citizens.delete");

    const [search, setSearch] = useState("");
    const [items, setItems] = useState<Citizen[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CitizenFormValues>(EMPTY_CITIZEN_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    const load = (targetPage = 1, keyword = search) => {
        setLoading(true);
        setError(false);
        fetchCitizens({ page: targetPage, search: keyword })
            .then(res => {
                setItems(res.items);
                setPage(res.page);
                setTotalPages(res.totalPages);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => load(1, search), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_CITIZEN_FORM);
        setFormVisible(true);
    };

    const openEdit = (c: Citizen) => {
        if (!canUpdate) return;
        setEditingId(c._id);
        setForm(citizenToForm(c));
        setFormVisible(true);
    };

    const handleSubmit = async () => {
        if (!isCitizenFormValid(form)) {
            toast.error("Vui lòng nhập họ tên và chọn hộ dân");
            return;
        }
        try {
            setSubmitting(true);
            if (editingId) {
                await updateCitizen(editingId, toCitizenInput(form));
                toast.success("Đã cập nhật nhân khẩu");
            } else {
                await createCitizen(toCitizenInput(form));
                toast.success("Đã thêm nhân khẩu mới");
            }
            setFormVisible(false);
            load(1, search);
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
            await deleteCitizen(confirmDeleteId);
            toast.success("Đã xóa nhân khẩu");
            setConfirmDeleteId(null);
            setFormVisible(false);
            load(1, search);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Quản lý nhân khẩu</h1>
                {canCreate && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm nhân khẩu
                    </Button>
                )}
            </div>

            <Input
                className="mb-4 max-w-sm"
                placeholder="Tìm theo họ tên, CCCD, số điện thoại..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="rounded-2xl border border-divider_01 bg-white shadow-sm">
                {loading && <LoadingState />}
                {!loading && error && (
                    <ErrorState onRetry={() => load(1, search)} />
                )}
                {!loading && !error && items.length === 0 && (
                    <EmptyState label="Chưa có nhân khẩu nào" />
                )}
                {!loading && !error && items.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>CCCD/SĐT</TableHead>
                                <TableHead>Hộ dân</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(c => (
                                <TableRow
                                    key={c._id}
                                    className={
                                        canUpdate ? "cursor-pointer" : undefined
                                    }
                                    onClick={
                                        canUpdate
                                            ? () => openEdit(c)
                                            : undefined
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {c.fullName}
                                    </TableCell>
                                    <TableCell>
                                        {c.cccd || c.phone || "Chưa có CCCD/SĐT"}
                                    </TableCell>
                                    <TableCell>
                                        {householdLabelOf(c.householdId)}
                                    </TableCell>
                                    <TableCell>{badgeFor(c)}</TableCell>
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
                    onPageChange={p => load(p, search)}
                    disabled={loading}
                />
            )}

            <Sheet open={formVisible} onOpenChange={setFormVisible}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {editingId ? "Sửa nhân khẩu" : "Thêm nhân khẩu"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <CitizenForm values={form} onChange={setForm} />
                    </div>
                    <SheetFooter>
                        {canDelete && editingId && (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => setConfirmDeleteId(editingId)}
                            >
                                Xóa nhân khẩu
                            </Button>
                        )}
                        <Button
                            className="w-full"
                            loading={submitting}
                            onClick={handleSubmit}
                        >
                            {editingId ? "Lưu thay đổi" : "Thêm nhân khẩu"}
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
                        <DialogTitle>Xóa nhân khẩu?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        Bạn có chắc muốn xóa nhân khẩu này? Hành động này
                        không thể hoàn tác.
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

export default CitizenListPage;
